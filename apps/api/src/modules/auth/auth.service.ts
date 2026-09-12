import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register({ email, password, name, phone }: RegisterDto) {
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

  async login({ email, password }: LoginDto) {
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

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    const { passwordHash: _passwordHash, ...publicUser } = user;

    return { accessToken, user: publicUser };
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

  private isPrismaUniqueConstraintError(error: unknown): error is { code: string } {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    );
  }
}