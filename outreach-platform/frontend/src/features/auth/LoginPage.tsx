import * as React from 'react';
import { Eye, EyeOff, Lock, Mail, ShieldAlert } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';

export function LoginPage() {
  const { login, isLoggingIn, loginError } = useAuth();
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [validationError, setValidationError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const trimmed = password.trim();
    if (!trimmed) {
      setValidationError('Password is required');
      return;
    }

    try {
      await login(trimmed);
    } catch {
      // Error handled by AuthProvider and shown via loginError
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-100 mb-1">
            <Mail className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Sign in to Mailer
          </h1>
          <p className="text-xs text-slate-500">
            Enter your local application password to continue
          </p>
        </div>

        {/* Login Card */}
        <Card className="shadow-md border-slate-200">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-sm font-semibold">Authentication</CardTitle>
            <CardDescription>
              Backend uses HttpOnly session cookie authentication.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {loginError && (
                <Alert variant="danger">
                  {loginError}
                </Alert>
              )}

              <div className="space-y-1">
                <div className="relative">
                  <Input
                    label="Application Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (validationError) setValidationError(null);
                    }}
                    error={validationError || undefined}
                    disabled={isLoggingIn}
                    autoFocus
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-[31px] text-slate-400 hover:text-slate-600 focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full gap-2"
                isLoading={isLoggingIn}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Unlock Session</span>
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Local Security Notice */}
        <div className="rounded-lg border border-slate-200 bg-white/70 p-3.5 text-center text-xs text-slate-500 space-y-1">
          <div className="flex items-center justify-center gap-1.5 font-medium text-slate-700">
            <ShieldAlert className="w-3.5 h-3.5 text-indigo-600" />
            <span>Local & Privacy-First Architecture</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-400">
            Mailer is strictly local software. No telemetry, third-party analytics, or cloud credentials are exchanged.
          </p>
        </div>
      </div>
    </div>
  );
}
