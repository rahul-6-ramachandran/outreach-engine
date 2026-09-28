import { useQuery } from '@tanstack/react-query';
import {
  ShieldCheck,
  Server,
  Lock,
  LogOut,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { opportunitiesApi } from '../opportunities/opportunities.api';
import { useAuth } from '../auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api-client';

export function SettingsPage() {
  const { logout, isLoggingOut } = useAuth();

  // Test root backend liveness probe GET /
  const {
    data: rootStatus,
    isLoading: isCheckingRoot,
    refetch: refetchRoot,
  } = useQuery({
    queryKey: ['backend', 'liveness'],
    queryFn: async () => {
      try {
        const text = await apiClient<string>('/');
        return { online: true, message: text };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unreachable';
        return { online: false, message };
      }
    },
    staleTime: 30000,
  });

  // Test database matching health
  const {
    data: health,
    isLoading: isCheckingHealth,
    refetch: refetchHealth,
  } = useQuery({
    queryKey: ['opportunities', 'matches', 'health'],
    queryFn: () => opportunitiesApi.getMatchingHealth(),
    staleTime: 30000,
  });

  const handleRefresh = () => {
    refetchRoot();
    refetchHealth();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
        <div className="space-y-0.5">
          <h3 className="text-sm font-semibold text-slate-900">Local Environment & Diagnostics</h3>
          <p className="text-xs text-slate-500">
            Verify local backend connectivity, security architecture, and system isolation.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={handleRefresh} className="gap-1.5 self-start">
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Status</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Backend Connectivity Status */}
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Server className="w-4 h-4 text-indigo-600" />
              <span>Backend Connectivity</span>
            </CardTitle>
            <CardDescription>
              Local NestJS API server connection through Vite proxy.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-3 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Target Host</span>
              <span className="font-mono text-slate-900 font-medium">127.0.0.1:3000</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Liveness Probe (GET /)</span>
              {isCheckingRoot ? (
                <span className="text-slate-400">Checking…</span>
              ) : rootStatus?.online ? (
                <Badge variant="success">Online</Badge>
              ) : (
                <Badge variant="danger">Disconnected</Badge>
              )}
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Matching API Health</span>
              {isCheckingHealth ? (
                <span className="text-slate-400">Checking…</span>
              ) : health ? (
                <Badge variant="success">Healthy</Badge>
              ) : (
                <Badge variant="warning">Unavailable</Badge>
              )}
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-slate-500">Outreach Mutation Routes</span>
              <Badge variant="warning">Disabled (Commented out)</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Security & Local Isolation */}
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Privacy & Security Compliance</span>
            </CardTitle>
            <CardDescription>
              Architectural safeguards enforced by the local application.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-2 text-xs">
            <div className="flex items-start gap-2 text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>HttpOnly Session Cookie:</strong> Token cannot be read by JavaScript; stored strictly in browser memory.
              </span>
            </div>

            <div className="flex items-start gap-2 text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Zero Storage:</strong> No contact records, emails, or credentials in localStorage / sessionStorage.
              </span>
            </div>

            <div className="flex items-start gap-2 text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Localhost Isolation:</strong> Zero external analytics, tracking scripts, or CDN dependencies.
              </span>
            </div>

            <div className="flex items-start gap-2 text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>System Fonts:</strong> No external Google Fonts requests.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Session Management */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Lock className="w-4 h-4 text-indigo-600" />
            <span>Active Session</span>
          </CardTitle>
          <CardDescription>
            Manage your authenticated local session.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 flex items-center justify-between">
          <div className="text-xs text-slate-600">
            Authenticated via backend password validation with SameSite=Strict cookie protection.
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => logout()}
            isLoading={isLoggingOut}
            className="gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
