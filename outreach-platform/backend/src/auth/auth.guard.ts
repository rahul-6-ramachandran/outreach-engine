import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

import { AuthService } from './auth.service.js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<Request>();

    const cookieHeader = request.headers.cookie ?? '';

    const sessionCookie = cookieHeader
      .split(';')
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith('mailer_session='));

    const token = sessionCookie
      ? decodeURIComponent(
          sessionCookie.substring('mailer_session='.length),
        )
      : undefined;

    if (!this.authService.validateSession(token)) {
      throw new UnauthorizedException(
        'Please log in to access Mailer',
      );
    }

    return true;
  }
}
