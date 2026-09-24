import { EmailProvider } from '../email-provider.js';
import { LogEmailProvider } from './log-email-provider.js';
import { SmtpEmailProvider } from './smtp-email.provider.js';
import { getEmailProviderName } from './email-provider-name.js';

export function createEmailProvider(): EmailProvider {
  const provider = getEmailProviderName();

  switch (provider) {
    case 'log':
      return new LogEmailProvider();

    case 'smtp':
      return new SmtpEmailProvider();
  }
}