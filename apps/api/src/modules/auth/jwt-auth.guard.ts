import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { ACCESS_COOKIE_NAME } from './auth.service';

export interface AuthenticatedRequest extends Request {
  userId: string;
}

interface JwtPayload {
  sub?: unknown;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    const [scheme, bearerToken] = authorization?.split(' ') ?? [];
    const token = scheme?.toLowerCase() === 'bearer'
      ? bearerToken
      : this.getCookie(request.headers.cookie, ACCESS_COOKIE_NAME);
    if (!token) {
      this.logUnauthorized(request, 'token_absent');
      throw new UnauthorizedException('Sesión requerida');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      if (typeof payload.sub !== 'string' || !payload.sub) {
        this.logUnauthorized(request, 'invalid_payload');
        throw new UnauthorizedException('Sesión inválida');
      }
      request.userId = payload.sub;
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      const reason = error instanceof Error && error.name === 'TokenExpiredError'
        ? 'token_expired'
        : error instanceof Error &&
            error.name === 'JsonWebTokenError' &&
            error.message.toLowerCase().includes('signature')
          ? 'invalid_signature'
          : 'invalid_token';
      this.logUnauthorized(request, reason);
      throw new UnauthorizedException('Sesión inválida');
    }
  }

  private logUnauthorized(request: Request, reason: string) {
    this.logger.warn(`401 ${reason} ${request.method} ${request.path}`);
  }

  private getCookie(header: string | undefined, name: string) {
    if (!header) return undefined;
    const prefix = `${name}=`;
    const entry = header.split(';').map((part) => part.trim()).find((part) => part.startsWith(prefix));
    if (!entry) return undefined;
    try {
      return decodeURIComponent(entry.slice(prefix.length));
    } catch {
      return undefined;
    }
  }
}
