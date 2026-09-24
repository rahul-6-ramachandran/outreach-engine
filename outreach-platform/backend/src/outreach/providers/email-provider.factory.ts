import { EmailProvider } from '../email-provider.js';
import { LogEmailProvider } from './log-email-provider.js';
import { SmtpEmailProvider } from './smtp-email.provider.js';

export function createEmailProvider(): EmailProvider {
  const provider = process.env['EMAIL_PROVIDER'] ?? 'log';

  switch (provider) {
    case 'log':
      return new LogEmailProvider();

    case 'smtp':
      return new SmtpEmailProvider();

    default:
      throw new Error(
        `Unsupported EMAIL_PROVIDER: ${provider}`,
      );
  }
}