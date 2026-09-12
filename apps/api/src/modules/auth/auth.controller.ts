import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService, REFRESH_COOKIE_NAME } from './auth.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { AuthRateLimitGuard } from './auth-rate-limit.guard';

@Controller('auth')
@UseGuards(AuthRateLimitGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post('login')
  async login(@Body() body: LoginDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.authService.login(body);
    this.setRefreshCookie(response, result.refreshToken);
    const { refreshToken: _refreshToken, ...safeResult } = result;
    return safeResult;
  }

  @Post('refresh')
  async refresh(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const result = await this.authService.refresh(this.getRefreshToken(request));
    this.setRefreshCookie(response, result.refreshToken);
    const { refreshToken: _refreshToken, ...safeResult } = result;
    return safeResult;
  }

  @Post('logout')
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    await this.authService.logout(this.getRefreshToken(request));
    response.clearCookie(REFRESH_COOKIE_NAME, this.cookieOptions());
    return { success: true };
  }

  private getRefreshToken(request: Request) {
    const header = request.headers.cookie ?? '';
    const value = header.split(';').map((part) => part.trim())
      .find((part) => part.startsWith(`${REFRESH_COOKIE_NAME}=`));
    return value ? decodeURIComponent(value.slice(REFRESH_COOKIE_NAME.length + 1)) : '';
  }

  private setRefreshCookie(response: Response, token: string) {
    response.cookie(REFRESH_COOKIE_NAME, token, this.cookieOptions());
  }

  private cookieOptions() {
    return {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/auth',
    };
  }
}