import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';

export const REFRESH_COOKIE_NAME = 'lucia_refresh_token';
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
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

    const { accessToken, refreshToken } = await this.createSession(user);
    const { passwordHash: _passwordHash, ...publicUser } = user;

    return { accessToken, refreshToken, user: publicUser };
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