import {
  CanActivate,
  ExecutionContext,
  Injectable,
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
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    const [scheme, bearerToken] = authorization?.split(' ') ?? [];
    const token = scheme?.toLowerCase() === 'bearer'
      ? bearerToken
      : this.getCookie(request.headers.cookie, ACCESS_COOKIE_NAME);
    if (!token) {
      throw new UnauthorizedException('Bearer token requerido');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      if (typeof payload.sub !== 'string' || !payload.sub) {
        throw new UnauthorizedException('Token inválido');
      }
      request.userId = payload.sub;
      return true;
    } catch {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }

  private getCookie(header: string | undefined, name: string) {
    if (!header) return undefined;
    const prefix = `${name}=`;
    const entry = header.split(';').map((part) => part.trim()).find((part) => part.startsWith(prefix));
    return entry ? decodeURIComponent(entry.slice(prefix.length)) : undefined;
  }
}
