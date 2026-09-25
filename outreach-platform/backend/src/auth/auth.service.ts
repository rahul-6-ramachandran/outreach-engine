import {
  Injectable,
  UnauthorizedException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  createHmac,
  createHash,
  timingSafeEqual,
} from 'node:crypto';

const SESSION_DURATION_SECONDS = 8 * 60 * 60;

@Injectable()
export class AuthService {
  private get appPassword(): string {
    const value = process.env.APP_PASSWORD;

    if (!value) {
      throw new ServiceUnavailableException(
        'Authentication is not configured',
      );
    }

    return value;
  }

  private get sessionSecret(): string {
    const value = process.env.SESSION_SECRET;

    if (!value) {
      throw new ServiceUnavailableException(
        'Session authentication is not configured',
      );
    }

    return value;
  }

  private sign(payload: string): string {
    return createHmac('sha256', this.sessionSecret)
      .update(payload)
      .digest('base64url');
  }

  verifyPassword(password: string): boolean {
    const expected = createHash('sha256')
      .update(this.appPassword)
      .digest();

    const actual = createHash('sha256')
      .update(password)
      .digest();

    return timingSafeEqual(expected, actual);
  }

  createSession(): string {
    const payload = Buffer.from(
      JSON.stringify({
        exp:
          Math.floor(Date.now() / 1000) +
          SESSION_DURATION_SECONDS,
      }),
    ).toString('base64url');

    return `${payload}.${this.sign(payload)}`;
  }

  validateSession(token?: string): boolean {
    if (!token) return false;

    const parts = token.split('.');
    if (parts.length !== 2) return false;

    const [payload, signature] = parts;

    try {
      const expected = this.sign(payload);

      const expectedBuffer = Buffer.from(expected);
      const actualBuffer = Buffer.from(signature);

      if (
        expectedBuffer.length !== actualBuffer.length ||
        !timingSafeEqual(expectedBuffer, actualBuffer)
      ) {
        return false;
      }

      const decoded = JSON.parse(
        Buffer.from(payload, 'base64url').toString(),
      ) as { exp?: number };

      return (
        typeof decoded.exp === 'number' &&
        decoded.exp > Math.floor(Date.now() / 1000)
      );
    } catch {
      return false;
    }
  }

  get sessionDurationSeconds(): number {
    return SESSION_DURATION_SECONDS;
  }

  authenticate(password: string): string {
    if (!this.verifyPassword(password)) {
      throw new UnauthorizedException('Invalid password');
    }

    return this.createSession();
  }
}
