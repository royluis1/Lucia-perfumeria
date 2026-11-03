import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

jest.mock('@nestjs/common', () => jest.requireActual('../../../__mocks__/nestjs-common'));
jest.mock('@nestjs/jwt', () => jest.requireActual('../../../__mocks__/nestjs-jwt'));

import { AuthService } from './auth.service';
import { MailService } from '../mail/mail.service';

describe('AuthService', () => {
  let service: AuthService;
  const prisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    refreshSession: {
      create: jest.fn(),
      updateMany: jest.fn(),
    },
    passwordResetToken: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  const jwt = { signAsync: jest.fn(), verifyAsync: jest.fn() };
  const mail = { send: jest.fn().mockResolvedValue(undefined) };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(
      prisma as any,
      jwt as unknown as JwtService,
      mail as unknown as MailService,
    );
  });

  describe('register', () => {
    it('crea un usuario con email normalizado y password hasheada', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockImplementation(async ({ data }: any) => ({
        id: 'u1',
        ...data,
        role: Role.CUSTOMER,
        mfaEnabled: false,
        createdAt: new Date(),
      }));

      const result = await service.register({
        email: '  TEST@Example.com ',
        password: 'password123',
        name: '  Ana  ',
        phone: undefined,
      });

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'test@example.com',
            name: 'Ana',
          }),
        }),
      );
      const createArgs = prisma.user.create.mock.calls[0][0];
      expect(await bcrypt.compare('password123', createArgs.data.passwordHash)).toBe(true);
      expect(result.user.email).toBe('test@example.com');
    });

    it('lanza ConflictException si el email ya existe', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
      await expect(
        service.register({ email: 'a@b.com', password: 'password123', name: 'Ana' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login con MFA', () => {
    it('devuelve mfaRequired cuando el usuario tiene MFA activo', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'a@b.com',
        passwordHash: await bcrypt.hash('password123', 4),
        role: Role.CUSTOMER,
        mfaEnabled: true,
        mfaSecret: 'secret',
      });
      jwt.signAsync.mockResolvedValue('challenge-token');

      const result = await service.login({ email: 'a@b.com', password: 'password123' });

      expect(result).toEqual({ mfaRequired: true, mfaToken: 'challenge-token' });
      expect(prisma.refreshSession.create).not.toHaveBeenCalled();
    });

    it('lanza UnauthorizedException con password incorrecta', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'a@b.com',
        passwordHash: await bcrypt.hash('wrong', 4),
        role: Role.CUSTOMER,
        mfaEnabled: false,
      });
      await expect(
        service.login({ email: 'a@b.com', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('resetPassword', () => {
    it('marca la password como vencida si no existe el token', async () => {
      prisma.passwordResetToken.findUnique.mockResolvedValue(null);
      await expect(
        service.resetPassword({ token: 'abc', password: 'newPassword123' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});