import { AlertTriangle, ShieldCheck } from 'lucide-react';

interface BackendStatusBannerProps {
  outreachRoutesDisabled?: boolean;
}

export function BackendStatusBanner({ outreachRoutesDisabled = true }: BackendStatusBannerProps) {
  if (!outreachRoutesDisabled) return null;

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-900 shadow-sm flex items-start gap-3">
      <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
      <div className="space-y-1">
        <div className="font-semibold flex items-center gap-2">
          <span>Backend Notice: Outreach Controller Routes Commented Out</span>
          <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] bg-amber-200/80 font-mono text-amber-800">
            Read-Only Preview Mode
          </span>
        </div>
        <p className="text-amber-800/90 leading-relaxed">
          The backend routes for draft creation, approval, and sending (<code className="bg-amber-100 px-1 py-0.5 rounded font-mono">/outreach/*</code>) are commented out in the backend working copy. Candidate matching and draft generation remain active, but sending and approval mutations are safely disabled.
        </p>
      </div>
    </div>
  );
}

export function LocalPrivacyIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-medium">
      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
      <span>Local Sandbox • 127.0.0.1</span>
    </div>
  );
}
