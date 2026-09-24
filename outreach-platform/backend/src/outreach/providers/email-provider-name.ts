export function getEmailProviderName(): 'log' | 'smtp' {
  const provider = process.env['EMAIL_PROVIDER'] || 'log';

  if (provider !== 'log' && provider !== 'smtp') {
    throw new Error(`Unsupported EMAIL_PROVIDER: ${provider}`);
  }

  return provider;
}