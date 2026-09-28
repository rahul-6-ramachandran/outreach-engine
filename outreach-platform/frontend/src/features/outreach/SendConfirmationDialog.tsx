import { useState, useEffect } from 'react';
import {
  Send,
  Paperclip,
  ShieldAlert,
} from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';

export interface SendConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmSend: () => Promise<void>;
  recipientEmail: string;
  companyName: string;
  roleTitle: string;
  subject: string;
  body: string;
  isSending?: boolean;
}

export function SendConfirmationDialog({
  isOpen,
  onClose,
  onConfirmSend,
  recipientEmail,
  companyName,
  roleTitle,
  subject,
  body,
  isSending,
}: SendConfirmationDialogProps) {
  const [typedConfirmation, setTypedConfirmation] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setTypedConfirmation('');
      setSendError(null);
    }
  }, [isOpen]);

  const isConfirmed = typedConfirmation.trim() === 'SEND';

  const handleSend = async () => {
    if (!isConfirmed || isSending) return;
    setSendError(null);
    try {
      await onConfirmSend();
    } catch (err: unknown) {
      const errorMsg =
        typeof err === 'object' && err !== null && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Failed to send outreach email. Please verify backend status.';
      setSendError(errorMsg);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={() => {
        if (!isSending) onClose();
      }}
      title="Final Send Confirmation"
      description="Review complete transmission details before initiating external dispatch."
      className="max-w-xl"
    >
      <div className="space-y-4 text-xs">
        {/* Irreversible Action Warning */}
        <Alert variant="danger" title="Real Email Transmission Warning">
          <p>
            Confirming this action will instruct your local backend to connect to your configured SMTP provider and immediately deliver this email to the external recipient.
          </p>
        </Alert>

        {sendError && (
          <Alert variant="danger" title="Send Error">
            <p>{sendError}</p>
          </Alert>
        )}

        {/* Message Summary Card */}
        <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 space-y-2.5">
          <div className="grid grid-cols-2 gap-2 text-slate-600">
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Recipient</span>
              <span className="font-mono text-slate-900 font-medium break-all">
                {recipientEmail}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Target Opportunity</span>
              <span className="text-slate-900 font-medium">
                {companyName} • {roleTitle}
              </span>
            </div>
          </div>

          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Subject</span>
            <span className="text-slate-900 font-medium">{subject}</span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Message Preview</span>
            <div className="mt-1 max-h-32 overflow-y-auto rounded border border-slate-200 bg-white p-2.5 font-mono text-[11px] text-slate-700 whitespace-pre-wrap">
              {body}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1 text-slate-600 border-t border-slate-200/60">
            <Paperclip className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium text-slate-700">Attachment:</span>
            <span>Resume (configured in backend environment)</span>
          </div>
        </div>

        {/* Verification safeguard input */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center gap-1.5 text-slate-700 font-medium">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span>Type <strong className="font-mono text-slate-900 px-1 py-0.5 rounded bg-slate-100">SEND</strong> to unlock confirmation:</span>
          </div>
          <Input
            value={typedConfirmation}
            onChange={(e) => setTypedConfirmation(e.target.value)}
            placeholder="Type SEND in uppercase"
            disabled={isSending}
            autoFocus
            className="font-mono text-center tracking-widest text-sm uppercase"
          />
          <p className="text-[10px] text-slate-400">
            * Note: This modal is a client-side safeguard. The backend relies on APPROVED status verification.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSending}
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="danger"
            size="sm"
            disabled={!isConfirmed || isSending}
            isLoading={isSending}
            onClick={handleSend}
            className="gap-2 shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send email now</span>
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
