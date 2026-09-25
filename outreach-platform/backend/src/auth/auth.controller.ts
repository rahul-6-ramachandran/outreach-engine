import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { AuthService } from './auth.service.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(
    @Body() body: { password?: string },
    @Res({ passthrough: true }) response: Response,
  ) {
    if (
      typeof body?.password !== 'string' ||
      body.password.length === 0 ||
      body.password.length > 256
    ) {
      throw new UnauthorizedException('Invalid password');
    }

    const token = this.authService.authenticate(body.password);

    response.setHeader(
      'Set-Cookie',
      [
        `mailer_session=${encodeURIComponent(token)}`,
        'HttpOnly',
        'SameSite=Strict',
        'Path=/',
        `Max-Age=${this.authService.sessionDurationSeconds}`,
      ].join('; '),
    );

    return { authenticated: true };
  }

  @Get('me')
  me(@Req() request: Request) {
    const cookieHeader = request.headers.cookie ?? '';

    const cookie = cookieHeader
      .split(';')
      .map((item) => item.trim())
      .find((item) => item.startsWith('mailer_session='));

    const token = cookie
      ? decodeURIComponent(
          cookie.substring('mailer_session='.length),
        )
      : undefined;

    if (!this.authService.validateSession(token)) {
      throw new UnauthorizedException('Not authenticated');
    }

    return { authenticated: true };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) response: Response) {
    response.setHeader(
      'Set-Cookie',
      [
        'mailer_session=',
        'HttpOnly',
        'SameSite=Strict',
        'Path=/',
        'Max-Age=0',
      ].join('; '),
    );

    return { authenticated: false };
  }
}
