import { ExecutionContext, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthenticatedRequest, JwtAuthGuard } from './jwt-auth.guard';

jest.mock('@nestjs/common', () => jest.requireActual('../../../__mocks__/nestjs-common'));
jest.mock('@nestjs/jwt', () => jest.requireActual('../../../__mocks__/nestjs-jwt'));

describe('JwtAuthGuard', () => {
  const jwt = { verifyAsync: jest.fn() };
  const logger = jest.spyOn(Logger.prototype, 'warn');
  let guard: JwtAuthGuard;

  function context(request: Partial<AuthenticatedRequest>) {
    return {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new JwtAuthGuard(jwt as unknown as JwtService);
  });

  it('registra token ausente sin datos de credenciales', async () => {
    const request = { headers: {}, method: 'GET', path: '/auth/me' } as AuthenticatedRequest;

    await expect(guard.canActivate(context(request))).rejects.toThrow(UnauthorizedException);

    expect(logger).toHaveBeenCalledWith('401 token_absent GET /auth/me');
    expect(jwt.verifyAsync).not.toHaveBeenCalled();
  });

  it('distingue tokens vencidos', async () => {
    const request = {
      headers: { authorization: 'Bearer access-secret-value' },
      method: 'GET',
      path: '/auth/me',
    } as AuthenticatedRequest;
    const error = Object.assign(new Error('jwt expired'), { name: 'TokenExpiredError' });
    jwt.verifyAsync.mockRejectedValue(error);

    await expect(guard.canActivate(context(request))).rejects.toThrow(UnauthorizedException);

    expect(logger).toHaveBeenCalledWith('401 token_expired GET /auth/me');
    expect(logger.mock.calls.map((call) => call.join(' ')).join(' ')).not.toContain('access-secret-value');
  });

  it('distingue firmas inválidas sin registrar el token', async () => {
    const request = {
      headers: { authorization: 'Bearer access-secret-value' },
      method: 'GET',
      path: '/auth/me',
    } as AuthenticatedRequest;
    const error = Object.assign(new Error('invalid signature'), { name: 'JsonWebTokenError' });
    jwt.verifyAsync.mockRejectedValue(error);

    await expect(guard.canActivate(context(request))).rejects.toThrow(UnauthorizedException);

    expect(logger).toHaveBeenCalledWith('401 invalid_signature GET /auth/me');
    expect(logger.mock.calls.map((call) => call.join(' ')).join(' ')).not.toContain('access-secret-value');
  });
});
