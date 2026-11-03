import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthRateLimitGuard } from './auth-rate-limit.guard';
import { RolesGuard } from './roles.guard';

const jwtSecret = process.env.JWT_SECRET ?? '';
const configuredAccessTokenTtl = process.env.JWT_EXPIRES_IN ?? '15m';
const accessTokenTtlMatch = /^(\d+)m$/.exec(configuredAccessTokenTtl);
const accessTokenTtlMinutes = Number(accessTokenTtlMatch?.[1]);

if (!jwtSecret || jwtSecret.length < 32) {
  throw new Error('JWT_SECRET debe estar configurado y tener al menos 32 caracteres');
}

if (
  !accessTokenTtlMatch ||
  (accessTokenTtlMinutes !== 1 && (accessTokenTtlMinutes < 15 || accessTokenTtlMinutes > 30))
) {
  throw new Error('JWT_EXPIRES_IN debe estar entre 15m y 30m (1m solo para pruebas)');
}

@Module({
  imports: [
    JwtModule.register({
      secret: jwtSecret,
      signOptions: { expiresIn: accessTokenTtlMinutes * 60 },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, AuthRateLimitGuard, RolesGuard],
  exports: [JwtModule, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
