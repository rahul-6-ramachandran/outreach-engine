import { useState } from 'react';
import {
  CheckCircle,
  Send,
  ArrowLeft,
  FileCheck,
  Paperclip,
  Lock,
} from 'lucide-react';
import { type Opportunity, type ContactMatch, type OutreachDraft } from './opportunities.types';
import { type OutreachRecord } from '../outreach/outreach.types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { SendConfirmationDialog } from '../outreach/SendConfirmationDialog';

interface OutreachReviewProps {
  opportunity: Opportunity;
  match: ContactMatch;
  draft: OutreachDraft;
  onBack: () => void;
  onSaveToSessionHistory: (record: OutreachRecord) => void;
}

export function OutreachReview({
  opportunity,
  match,
  draft,
  onBack,
  onSaveToSessionHistory,
}: OutreachReviewProps) {
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [outreachStatus, setOutreachStatus] = useState<'DRAFT' | 'APPROVED' | 'SENT'>('DRAFT');

  // Backend routes are commented out in the current backend working tree
  const backendOutreachRoutesDisabled = true;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Backend Routes Disabled Warning Banner */}
      {backendOutreachRoutesDisabled && (
        <Alert variant="warning" title="Outreach Mutation Endpoints Disabled">
          <p className="mt-0.5 leading-relaxed">
            The backend controller routes for draft creation, approval, and sending (<code className="bg-amber-100 font-mono px-1 py-0.5 rounded text-[11px]">/outreach/*</code>) are commented out in the backend working tree. Outreach mutations are locked in read-only preview mode to prevent unintended calls.
          </p>
        </Alert>
      )}

      {/* Review details card */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-indigo-600" />
              <span>Final Outreach Inspection</span>
            </CardTitle>
            <CardDescription>
              Carefully verify the recipient, message body, and attachment before any sending action.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Current Status:</span>
            <Badge variant={outreachStatus === 'SENT' ? 'success' : outreachStatus === 'APPROVED' ? 'info' : 'default'}>
              {outreachStatus}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-5 space-y-5">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg bg-slate-50/80 border border-slate-200/80 text-xs">
            <div className="space-y-2">
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Recipient Contact</span>
                <span className="text-sm font-semibold text-slate-900 block">
                  {match.name || 'Unnamed Contact'}
                </span>
                <span className="font-mono text-slate-600">{match.email || 'No email specified'}</span>
              </div>
              {match.title && (
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Position</span>
                  <span className="text-slate-700">{match.title}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Target Company & Role</span>
                <span className="text-sm font-semibold text-slate-900 block">
                  {opportunity.companyName}
                </span>
                <span className="text-slate-700">{opportunity.roleTitle}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Attachment</span>
                <div className="flex items-center gap-1.5 text-slate-700 mt-0.5">
                  <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                  <span>Resume (resolved via backend RESUME_PATH)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Subject Line */}
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
              Subject Line
            </label>
            <div className="p-3 rounded-md bg-white border border-slate-200 text-xs font-medium text-slate-900 shadow-sm">
              {draft.subject}
            </div>
          </div>

          {/* Email Body */}
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
              Complete Message Body
            </label>
            <div className="p-4 rounded-md bg-white border border-slate-200 text-xs text-slate-800 whitespace-pre-wrap font-mono leading-relaxed shadow-sm min-h-[200px]">
              {draft.body}
            </div>
          </div>

          {/* Actions & Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
            <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Edit</span>
            </Button>

            <div className="flex items-center gap-3">
              {backendOutreachRoutesDisabled ? (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled
                    className="gap-1.5 opacity-60 cursor-not-allowed"
                    title="Backend approval route is commented out"
                  >
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Approve Draft (Disabled)</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="primary"
                    disabled
                    className="gap-1.5 opacity-60 cursor-not-allowed"
                    title="Backend send route is commented out"
                  >
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Send Email (Disabled)</span>
                  </Button>
                </div>
              ) : (
                <>
                  {outreachStatus === 'DRAFT' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setOutreachStatus('APPROVED')}
                      className="gap-1.5"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Approve Draft</span>
                    </Button>
                  )}

                  <Button
                    size="sm"
                    disabled={outreachStatus !== 'APPROVED'}
                    onClick={() => setIsSendDialogOpen(true)}
                    className="gap-1.5 shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Initiate Send...</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Final Send Safety Modal */}
      <SendConfirmationDialog
        isOpen={isSendDialogOpen}
        onClose={() => setIsSendDialogOpen(false)}
        recipientEmail={match.email || 'unknown@domain.local'}
        companyName={opportunity.companyName}
        roleTitle={opportunity.roleTitle}
        subject={draft.subject}
        body={draft.body}
        isSending={isSending}
        onConfirmSend={async () => {
          setIsSending(true);
          try {
            // Simulated / protected send flow:
            // When routes are enabled, calls outreachApi.send(...)
            setIsSendDialogOpen(false);
            setOutreachStatus('SENT');
            onSaveToSessionHistory({
              id: Date.now(),
              opportunityId: opportunity.id,
              contactId: match.contactId,
              email: match.email || '',
              subject: draft.subject,
              body: draft.body,
              status: 'SENT',
              sentAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              companyName: opportunity.companyName,
              roleTitle: opportunity.roleTitle,
              contactName: match.name || '',
            });
          } finally {
            setIsSending(false);
          }
        }}
      />
    </div>
  );
}
