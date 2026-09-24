import { afterEach, describe, expect, it, vi } from 'vitest';
import { getEmailProviderName } from './email-provider-name.js';

describe('getEmailProviderName', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('defaults to log when EMAIL_PROVIDER is unset', () => {
    vi.stubEnv('EMAIL_PROVIDER', '');

    expect(getEmailProviderName()).toBe('log');
  });

  it('returns smtp when SMTP is configured', () => {
    vi.stubEnv('EMAIL_PROVIDER', 'smtp');

    expect(getEmailProviderName()).toBe('smtp');
  });

  it('returns log when log is configured', () => {
    vi.stubEnv('EMAIL_PROVIDER', 'log');

    expect(getEmailProviderName()).toBe('log');
  });

  it('rejects unsupported providers', () => {
    vi.stubEnv('EMAIL_PROVIDER', 'unknown');

    expect(() => getEmailProviderName()).toThrow(
      'Unsupported EMAIL_PROVIDER: unknown',
    );
  });
});