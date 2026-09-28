import * as React from 'react';
import {
  FileEdit,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { type Opportunity, type ContactMatch, type OutreachDraft } from './opportunities.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';

interface DraftComposerProps {
  opportunity: Opportunity;
  match: ContactMatch;
  onNext: (draft: OutreachDraft) => void;
  onBack: () => void;
    previewOnly?: boolean;
}

export function DraftComposer({
  opportunity,
  match,
  onNext,
  onBack,
    previewOnly = false,
}: DraftComposerProps) {
  // Original draft from match.outreach
  const originalSubject = match.outreach?.draft?.subject || `Exploring Opportunities at ${opportunity.companyName}`;
  const originalBody = match.outreach?.draft?.body || '';

  const [subject, setSubject] = React.useState(originalSubject);
  const [body, setBody] = React.useState(originalBody);

  const isModified = subject !== originalSubject || body !== originalBody;

  const handleReset = () => {
    setSubject(originalSubject);
    setBody(originalBody);
  };

  const handleProceed = () => {
    if (isModified) return;
    onNext({ subject, body });
  };

  const strategy = match.outreach?.strategy;

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Draft safety warning if user made local modifications */}
      {isModified && (
        <Alert variant="warning" title="Draft Modification Safety Notice">
          <div className="space-y-1 mt-0.5">
            <p>
              The backend currently generates drafts using internal templates and does not support saving custom subject or body overrides.
            </p>
            <p className="font-semibold text-amber-900">
              To guarantee that the email sent matches the exact reviewed content, approval and sending are locked while custom modifications exist. Reset to the system-generated draft to proceed.
            </p>
          </div>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Context & Strategy */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-xs uppercase font-semibold text-slate-500 tracking-wider">
                Recipient Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Name</span>
                <span className="font-semibold text-slate-900 text-sm">
                  {match.name || 'Unnamed Contact'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Role & Title</span>
                <span className="text-slate-700 font-medium">
                  {match.title || 'Role not specified'}
                </span>
                {match.roleFamily && (
                  <Badge variant="outline" className="mt-1 text-[10px] block w-fit">
                    {match.roleFamily}
                  </Badge>
                )}
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Email Address</span>
                <span className="font-mono text-slate-800 break-all">
                  {match.email || 'Email not available in contact record'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Company & Target Role</span>
                <span className="text-slate-700">
                  {opportunity.companyName} • {opportunity.roleTitle}
                </span>
              </div>
            </CardContent>
          </Card>

          {strategy && (
            <Card className="bg-slate-50/50 border-slate-200">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-xs uppercase font-semibold text-slate-500 tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Outreach Strategy</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-2.5 text-xs text-slate-600">
                {strategy.angle && (
                  <div>
                    <span className="text-slate-400 block text-[11px]">Angle</span>
                    <span className="font-medium text-slate-800">{strategy.angle}</span>
                  </div>
                )}
                {strategy.tone && (
                  <div>
                    <span className="text-slate-400 block text-[11px]">Tone</span>
                    <span className="capitalize">{strategy.tone}</span>
                  </div>
                )}
                {strategy.reason && (
                  <div>
                    <span className="text-slate-400 block text-[11px]">Strategy Rationale</span>
                    <p className="text-slate-600 text-[11px] leading-relaxed">{strategy.reason}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="rounded-lg border border-slate-200 bg-white p-3.5 text-[11px] text-slate-500 space-y-1.5">
            <div className="flex items-center gap-1.5 font-medium text-slate-700">
              <ShieldAlert className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>Draft Integrity Rule</span>
            </div>
            <p className="text-slate-500 leading-relaxed">
              Never send an unreviewed or stale draft. What you see is rendered directly from your local templates.
            </p>
          </div>
        </div>

        {/* Right Column: Editable Draft Composer */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <FileEdit className="w-4 h-4 text-indigo-600" />
                  <span>Email Composer</span>
                </CardTitle>
                <CardDescription>
                  Review the system-generated draft tailored for {match.name || 'this recipient'}.
                </CardDescription>
              </div>

              {isModified && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleReset}
                  className="gap-1.5 text-xs h-7"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset to Template</span>
                </Button>
              )}
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              <Input
                label="Subject Line"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject..."
              />

              <Textarea
                label="Email Body"
                rows={12}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Email content..."
                showCount
                maxLength={4000}
                className="font-mono text-xs leading-relaxed"
              />

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Contacts</span>
                </Button>

                <div className="flex items-center gap-2">
                  {isModified && (
                    <span className="text-xs text-amber-700 font-medium">
                      Reset required to proceed
                    </span>
                  )}
                  <Button
                    size="sm"
                    disabled={
                      previewOnly ||
                      isModified ||
                      !subject.trim() ||
                      !body.trim()
                    }  
                    onClick={handleProceed}
                    className="gap-1.5 shadow-sm"
                  >
<span>
  {previewOnly ? 'Preview Only — Sending Disabled' : 'Proceed to Review'}
</span>                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
