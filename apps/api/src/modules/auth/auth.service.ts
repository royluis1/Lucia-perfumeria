import {
  ConflictException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  MfaCodeDto,
  MfaVerifyDto,
  RegisterDto,
  ResetPasswordDto,
  UpdateProfileDto,
} from './dto/auth.dto';
import { MailService } from '../mail/mail.service';
import { generateBase32Secret, generateOtpUri, verifyTotpToken } from '../../common/totp.util';
import * as QRCode from 'qrcode';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';

export const REFRESH_COOKIE_NAME = 'lucia_refresh_token';
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MFA_CHALLENGE_TTL = '5m';
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async register(body: RegisterDto) {
    this.validateRegisterPayload(body);
    const { email, password, name, phone } = body;
    const normalizedEmail = this.normalizeEmail(email);
    this.validateCredentials(normalizedEmail, password, name);

    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    try {
      const user = await this.prisma.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          name: name.trim(),
          phone: phone?.trim() || undefined,
        },
        select: this.publicUserSelect,
      });

      return { user };
    } catch (error) {
      if (this.isPrismaUniqueConstraintError(error)) {
        throw new ConflictException('El email ya está registrado');
      }
      throw error;
    }
  }

  async login(body: LoginDto) {
    if (!this.isRecord(body) || typeof body.email !== 'string' || typeof body.password !== 'string') {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const { email, password } = body;
    const normalizedEmail = this.normalizeEmail(email);
    if (!normalizedEmail || typeof password !== 'string' || !password) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (user.mfaEnabled && user.mfaSecret) {
      const challengeToken = await this.jwtService.signAsync(
        { sub: user.id, type: 'mfa_challenge' },
        { expiresIn: MFA_CHALLENGE_TTL },
      );
      return { mfaRequired: true, mfaToken: challengeToken };
    }

    return this.createSessionResponse(user);
  }

  async verifyMfa(body: MfaVerifyDto) {
    const userId = await this.verifyMfaChallenge(body.challengeToken);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.mfaEnabled || !user.mfaSecret) {
      throw new UnauthorizedException('MFA no está activo para esta cuenta');
    }
    if (!this.verifyTotp(user.mfaSecret, body.code)) {
      throw new UnauthorizedException('Código inválido o expirado');
    }
    return this.createSessionResponse(user);
  }

  async setupMfa(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Usuario no encontrado');
    if (user.mfaEnabled) {
      throw new ConflictException('El doble factor ya está activo');
    }
    const secret = generateBase32Secret();
    const otpauthUrl = generateOtpUri({
      issuer: 'Lucia Perfumeria',
      label: this.accountLabel(user.email),
      secret,
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaSecret: secret },
    });

    const qrDataUrl = await QRCode.toDataURL(otpauthUrl);
    return { secret, otpauthUrl, qrDataUrl };
  }

  async enableMfa(userId: string, body: MfaCodeDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Usuario no encontrado');
    if (user.mfaEnabled) {
      throw new ConflictException('El doble factor ya está activo');
    }
    if (!user.mfaSecret) {
      throw new ConflictException('Primero generá el código QR de configuración');
    }
    if (!this.verifyTotp(user.mfaSecret, body.code)) {
      throw new UnauthorizedException('Código inválido o expirado');
    }
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: true },
      select: this.publicUserSelect,
    });
    return { user: updated };
  }

  async disableMfa(userId: string, body: MfaCodeDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Usuario no encontrado');
    if (!user.mfaEnabled || !user.mfaSecret) {
      throw new ConflictException('El doble factor no está activo');
    }
    if (!this.verifyTotp(user.mfaSecret, body.code)) {
      throw new UnauthorizedException('Código inválido o expirado');
    }
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: false, mfaSecret: null },
      select: this.publicUserSelect,
    });
    return { user: updated };
  }

  async forgotPassword(body: ForgotPasswordDto) {
    const normalizedEmail = this.normalizeEmail(body.email);
    if (!normalizedEmail) throw new UnauthorizedException('Email inválido');
    const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      return { ok: true };
    }

    const rawToken = randomBytes(32).toString('base64url');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    await this.prisma.passwordResetToken.upsert({
      where: { userId: user.id },
      update: { tokenHash, expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS) },
      create: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS) },
    });

    const appUrl = process.env.WEB_APP_URL?.trim() || 'http://localhost:3000';
    const resetUrl = `${appUrl}/reset-password?token=${rawToken}`;
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto">
        <h1 style="text-transform:uppercase;letter-spacing:2px">Lucía</h1>
        <p>Hola ${user.name},</p>
        <p>Recibimos una solicitud para restablecer tu contraseña. Hacé clic en el botón para continuar. El enlace vence en 1 hora.</p>
        <p style="margin:24px 0">
          <a href="${resetUrl}" style="background:#111;color:#fff;padding:12px 24px;text-decoration:none;text-transform:uppercase;letter-spacing:1px;font-size:12px">Restablecer contraseña</a>
        </p>
        <p style="font-size:12px;color:#666">Si no solicitaste esto, ignorá este mensaje.</p>
      </div>`;

    await this.mailService.send({
      to: user.email,
      subject: 'Restablecé tu contraseña — Lucía Perfumería',
      html,
    });

    return { ok: true };
  }

  async resetPassword(body: ResetPasswordDto) {
    const tokenHash = createHash('sha256').update(body.token).digest('hex');
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
    if (!record || record.expiresAt <= new Date()) {
      throw new UnauthorizedException('El enlace expiró o es inválido. Pedí uno nuevo.');
    }

    const passwordHash = await bcrypt.hash(body.password, 12);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.delete({ where: { userId: record.userId } }),
      this.prisma.refreshSession.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    return { ok: true };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Usuario no encontrado');
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone.trim() || null } : {}),
      },
      select: this.publicUserSelect,
    });
    return { user: updated };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Usuario no encontrado');
    if (!(await bcrypt.compare(dto.currentPassword, user.passwordHash))) {
      throw new UnauthorizedException('La contraseña actual es incorrecta');
    }
    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { passwordHash } }),
      this.prisma.refreshSession.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
    return { ok: true };
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) throw new UnauthorizedException('Refresh token inválido');
    const tokenHash = this.hashRefreshToken(refreshToken);
    const now = new Date();
    const nextRefreshToken = this.generateRefreshToken();
    const nextTokenHash = this.hashRefreshToken(nextRefreshToken);

    const result = await this.prisma.$transaction(async (tx) => {
      const session = await tx.refreshSession.findUnique({
        where: { tokenHash },
        include: { user: true },
      });
      if (!session || session.revokedAt || session.expiresAt <= now) {
        throw new UnauthorizedException('Refresh token inválido o expirado');
      }
      const revoked = await tx.refreshSession.updateMany({
        where: { id: session.id, revokedAt: null },
        data: { revokedAt: now },
      });
      if (revoked.count !== 1) {
        throw new UnauthorizedException('Refresh token inválido');
      }
      await tx.refreshSession.create({
        data: {
          tokenHash: nextTokenHash,
          userId: session.userId,
          expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
        },
      });
      return session.user;
    });

    return {
      accessToken: await this.signAccessToken(result),
      refreshToken: nextRefreshToken,
      user: this.toPublicUser(result),
    };
  }

  async logout(refreshToken: string | undefined) {
    if (refreshToken) {
      await this.prisma.refreshSession.updateMany({
        where: { tokenHash: this.hashRefreshToken(refreshToken), revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        mfaEnabled: true,
        createdAt: true,
      },
    });
    if (!user) throw new UnauthorizedException('Usuario no encontrado');
    return user;
  }

  getGoogleAuthUrl(state: string): string {
    const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
    if (!clientId) {
      throw new ServiceUnavailableException('Inicio de sesión con Google no configurado');
    }
    const redirectUri =
      process.env.GOOGLE_REDIRECT_URI?.trim() || 'http://localhost:3005/auth/google/callback';
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      prompt: 'select_account',
      access_type: 'online',
      include_granted_scopes: 'false',
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async handleGoogleCallback(code: string, state: string, expectedState: string) {
    if (!state || state !== expectedState) {
      throw new UnauthorizedException('Estado de OAuth inválido');
    }
    const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
    if (!clientId || !clientSecret) {
      throw new ServiceUnavailableException('Inicio de sesión con Google no configurado');
    }
    const redirectUri =
      process.env.GOOGLE_REDIRECT_URI?.trim() || 'http://localhost:3005/auth/google/callback';

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    if (!tokenResponse.ok) {
      throw new UnauthorizedException('No se pudo intercambiar el código de Google');
    }
    const tokens = (await tokenResponse.json()) as { access_token?: string };
    if (!tokens.access_token) {
      throw new UnauthorizedException('Google no devolvió un token de acceso');
    }

    const userinfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!userinfoResponse.ok) {
      throw new UnauthorizedException('No se pudo obtener tu perfil de Google');
    }
    const profile = (await userinfoResponse.json()) as {
      sub?: string;
      email?: string;
      email_verified?: boolean;
      name?: string;
    };
    if (!profile.email || profile.email_verified !== true) {
      throw new UnauthorizedException('Tu email de Google no está verificado');
    }

    const email = profile.email.toLowerCase().trim();
    let user = await this.prisma.user.findUnique({ where: { email } });
    if (user && user.mfaEnabled && user.mfaSecret) {
      throw new UnauthorizedException('Completá el doble factor desde tu cuenta');
    }
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          name: (profile.name ?? 'Usuario Google').trim(),
          passwordHash: await bcrypt.hash(randomBytes(32).toString('hex'), 12),
        },
      });
    }

    const { accessToken, refreshToken } = await this.createSession(user);
    const { passwordHash: _passwordHash, ...publicUser } = user;
    return { accessToken, refreshToken, user: publicUser };
  }

  private async createSessionResponse(user: { id: string; email: string; role: Role; passwordHash: string }) {
    const { accessToken, refreshToken } = await this.createSession(user);
    const { passwordHash: _passwordHash, ...publicUser } = user;
    return { accessToken, refreshToken, user: publicUser };
  }

  private verifyTotp(secret: string, code: string) {
    return verifyTotpToken(secret, code.trim());
  }

  private async verifyMfaChallenge(challengeToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync<{ sub: string; type?: string }>(challengeToken);
      if (payload.type !== 'mfa_challenge' || !payload.sub) {
        throw new Error('invalid challenge');
      }
      return payload.sub;
    } catch {
      throw new UnauthorizedException('El desafío expiró. Ingresá de nuevo.');
    }
  }

  private accountLabel(email: string) {
    return email.split('@')[0] || 'usuario';
  }

  private async createSession(user: { id: string; email: string; role: Role }) {
    const refreshToken = this.generateRefreshToken();
    await this.prisma.refreshSession.create({
      data: {
        tokenHash: this.hashRefreshToken(refreshToken),
        userId: user.id,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      },
    });
    return { accessToken: await this.signAccessToken(user), refreshToken };
  }

  private signAccessToken(user: { id: string; email: string; role: Role }) {
    return this.jwtService.signAsync({ sub: user.id, email: user.email, role: user.role });
  }

  private generateRefreshToken() {
    return randomBytes(48).toString('base64url');
  }

  private hashRefreshToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private toPublicUser<T extends { passwordHash: string }>(user: T): Omit<T, 'passwordHash'> {
    const { passwordHash: _passwordHash, ...publicUser } = user;
    return publicUser;
  }

  private readonly publicUserSelect = {
    id: true,
    email: true,
    role: true,
    name: true,
    phone: true,
    mfaEnabled: true,
    createdAt: true,
  } as const;

  private normalizeEmail(email: unknown) {
    return typeof email === 'string' ? email.trim().toLowerCase() : '';
  }

  private validateCredentials(email: string, password: unknown, name: unknown) {
    if (
      !email ||
      typeof password !== 'string' ||
      password.length < 8 ||
      typeof name !== 'string' ||
      !name.trim()
    ) {
      throw new ConflictException(
        'Email, nombre y una contraseña de al menos 8 caracteres son requeridos',
      );
    }
  }

  private validateRegisterPayload(body: RegisterDto) {
    if (
      !this.isRecord(body) ||
      typeof body.email !== 'string' ||
      typeof body.password !== 'string' ||
      typeof body.name !== 'string' ||
      (body.phone !== undefined && typeof body.phone !== 'string')
    ) {
      throw new ConflictException('Email, nombre y una contraseña de al menos 8 caracteres son requeridos');
    }
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private isPrismaUniqueConstraintError(error: unknown): error is { code: string } {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    );
  }
}