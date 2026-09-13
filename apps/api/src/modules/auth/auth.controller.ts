import { Body, Controller, Get, Patch, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { randomBytes } from 'crypto';
import { AuthService, REFRESH_COOKIE_NAME } from './auth.service';
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
import { AuthRateLimitGuard } from './auth-rate-limit.guard';
import { AuthenticatedRequest, JwtAuthGuard } from './jwt-auth.guard';

export const GOOGLE_STATE_COOKIE = 'lucia_oauth_state';

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
    if ('refreshToken' in result && result.refreshToken) {
      this.setRefreshCookie(response, result.refreshToken);
      const { refreshToken: _refreshToken, ...safeResult } = result;
      return safeResult;
    }
    return result;
  }

  @Post('mfa/verify')
  async verifyMfa(@Body() body: MfaVerifyDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.authService.verifyMfa(body);
    this.setRefreshCookie(response, result.refreshToken);
    const { refreshToken: _refreshToken, ...safeResult } = result;
    return safeResult;
  }

  @Get('mfa/setup')
  @UseGuards(JwtAuthGuard)
  setupMfa(@Req() request: AuthenticatedRequest) {
    return this.authService.setupMfa(request.userId);
  }

  @Post('mfa/enable')
  @UseGuards(JwtAuthGuard)
  enableMfa(@Req() request: AuthenticatedRequest, @Body() body: MfaCodeDto) {
    return this.authService.enableMfa(request.userId, body);
  }

  @Post('mfa/disable')
  @UseGuards(JwtAuthGuard)
  disableMfa(@Req() request: AuthenticatedRequest, @Body() body: MfaCodeDto) {
    return this.authService.disableMfa(request.userId, body);
  }

  @Post('forgot-password')
  forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body);
  }

  @Post('reset-password')
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  updateProfile(@Req() request: AuthenticatedRequest, @Body() body: UpdateProfileDto) {
    return this.authService.updateProfile(request.userId, body);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  changePassword(@Req() request: AuthenticatedRequest, @Body() body: ChangePasswordDto) {
    return this.authService.changePassword(request.userId, body);
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

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() request: AuthenticatedRequest) {
    return this.authService.getProfile(request.userId);
  }

  @Get('google')
  google(@Res() response: Response) {
    try {
      const state = randomBytes(32).toString('base64url');
      response.cookie(GOOGLE_STATE_COOKIE, state, this.googleStateCookieOptions());
      response.redirect(this.authService.getGoogleAuthUrl(state));
    } catch {
      const clientRedirect =
        process.env.GOOGLE_OAUTH_CLIENT_REDIRECT?.trim() || 'http://localhost:3000/login';
      response.redirect(`${clientRedirect}?error=google_not_configured`);
    }
  }

  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    const clientRedirect =
      process.env.GOOGLE_OAUTH_CLIENT_REDIRECT?.trim() || 'http://localhost:3000/login';
    const clearState = () => response.clearCookie(GOOGLE_STATE_COOKIE, this.googleStateCookieOptions());

    try {
      if (!code || !state) {
        throw new Error('Faltan parámetros de OAuth');
      }
      const expectedState = this.getCookie(request, GOOGLE_STATE_COOKIE);
      const result = await this.authService.handleGoogleCallback(code, state, expectedState);
      this.setRefreshCookie(response, result.refreshToken);
      clearState();
      response.redirect(`${clientRedirect}#token=${encodeURIComponent(result.accessToken)}`);
    } catch {
      clearState();
      response.redirect(`${clientRedirect}?error=google_login_failed`);
    }
  }

  private getRefreshToken(request: Request) {
    return this.getCookie(request, REFRESH_COOKIE_NAME);
  }

  private getCookie(request: Request, name: string) {
    const header = request.headers.cookie ?? '';
    if (header.length > 4096) return '';
    const value = header.split(';').map((part) => part.trim())
      .find((part) => part.startsWith(`${name}=`));
    if (!value) return '';
    try {
      return decodeURIComponent(value.slice(name.length + 1));
    } catch {
      return '';
    }
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

  private googleStateCookieOptions() {
    return {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 10 * 60 * 1000,
      path: '/',
    };
  }
}