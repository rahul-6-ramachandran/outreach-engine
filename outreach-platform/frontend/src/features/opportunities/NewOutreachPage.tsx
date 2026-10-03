import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Users, FileEdit, Check } from 'lucide-react';

import { CompanyRoleForm } from './CompanyRoleForm';
import { ContactSelection } from './ContactSelection';
import { DraftComposer } from './DraftComposer';

import { outreachApi } from '@/features/outreach/outreach.api';
import type { OutreachRecord } from '@/features/outreach/outreach.types';

import {
  type Opportunity,
  type ContactMatch,
} from './opportunities.types';

import { SendConfirmationDialog } from '../outreach/SendConfirmationDialog';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function NewOutreachPage() {
  const navigate = useNavigate();

  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [opportunity, setOpportunity] =
    React.useState<Opportunity | null>(null);
  const [selectedMatch, setSelectedMatch] =
    React.useState<ContactMatch | null>(null);
  const [outreach, setOutreach] =
    React.useState<OutreachRecord | null>(null);

  const [isCreatingDraft, setIsCreatingDraft] = React.useState(false);
  const [isApproving, setIsApproving] = React.useState(false);
  const [isSendDialogOpen, setIsSendDialogOpen] = React.useState(false);
  const [isSending, setIsSending] = React.useState(false);
  const [outreachError, setOutreachError] =
    React.useState<string | null>(null);

  const steps = [
    { number: 1, label: 'Company & Role', icon: Building2 },
    { number: 2, label: 'Select Contact', icon: Users },
    { number: 3, label: 'Draft & Send', icon: FileEdit },
  ];

  const handleCreateAndApprove = async () => {
    if (!opportunity || !selectedMatch) return;

    setOutreachError(null);
    setIsCreatingDraft(true);

    try {
      const created = await outreachApi.createDraft(
        opportunity.id,
        selectedMatch.id,
      );

      setOutreach(created);
      setIsCreatingDraft(false);
      setIsApproving(true);

      const approved = await outreachApi.approve(created.id);

      setOutreach(approved);
    } catch (error) {
      setOutreachError(
        error instanceof Error
          ? error.message
          : 'Could not create or approve the outreach draft.',
      );
    } finally {
      setIsCreatingDraft(false);
      setIsApproving(false);
    }
  };

  const handleSendOutreach = async () => {
    if (!outreach || outreach.status !== 'APPROVED') return;

    setOutreachError(null);
    setIsSending(true);

    try {
      const result = await outreachApi.send(outreach.id);

      setOutreach((current) =>
        current
          ? {
              ...current,
              status: result.status as OutreachRecord['status'],
              sentAt: result.sentAt ?? current.sentAt,
              updatedAt: result.updatedAt,
            }
          : current,
      );

      setIsSendDialogOpen(false);
    } catch (error) {
      setOutreachError(
        error instanceof Error
          ? error.message
          : 'Could not send the outreach email.',
      );
      throw error;
    } finally {
      setIsSending(false);
    }
  };

  const handleSelectMatch = (match: ContactMatch | null) => {
    setSelectedMatch(match);
    setOutreach(null);
    setOutreachError(null);
  };

  const handleBackToContacts = () => {
    setStep(2);
    setOutreach(null);
    setOutreachError(null);
  };

  return (
    <div className="space-y-6">
      {/* Stepper Progress Bar */}
      <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
        <div className="flex items-center justify-between">
          {steps.map((s, idx) => {
            const isCompleted = step > s.number;
            const isCurrent = step === s.number;

            return (
              <React.Fragment key={s.number}>
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors',
                      isCompleted
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                          ? 'bg-indigo-600 text-white ring-2 ring-indigo-100'
                          : 'bg-slate-100 text-slate-400',
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    ) : (
                      s.number
                    )}
                  </div>

                  <span
                    className={cn(
                      'text-xs hidden sm:inline font-medium',
                      isCurrent
                        ? 'text-slate-900 font-semibold'
                        : 'text-slate-500',
                    )}
                  >
                    {s.label}
                  </span>
                </div>

                {idx < steps.length - 1 && (
                  <div
                    className={cn(
                      'flex-1 h-0.5 mx-3',
                      step > idx + 1
                        ? 'bg-emerald-600'
                        : 'bg-slate-200',
                    )}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <CompanyRoleForm
          initialValues={
            opportunity
              ? {
                  companyName: opportunity.companyName,
                  roleTitle: opportunity.roleTitle,
                  location: opportunity.location || undefined,
                  jobUrl: opportunity.jobUrl || undefined,
                  jobDescription:
                    opportunity.jobDescription || undefined,
                }
              : undefined
          }
          onSuccess={(opp) => {
            setOpportunity(opp);
            setSelectedMatch(null);
            setOutreach(null);
            setOutreachError(null);
            setStep(2);
          }}
          onUseExisting={(existing) => {
            navigate(`/saved-opportunities/${existing.id}/matches`);
          }}
        />
      )}

      {/* Step 2 */}
      {step === 2 && opportunity && (
        <ContactSelection
          opportunity={opportunity}
          selectedMatch={selectedMatch}
          onSelectMatch={handleSelectMatch}
          onBack={() => setStep(1)}
          onNext={() => {
            if (selectedMatch) {
              setStep(3);
            }
          }}
        />
      )}

      {/* Step 3 */}
      {step === 3 && opportunity && selectedMatch && (
        <div className="space-y-4">
          {outreachError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {outreachError}
            </div>
          )}

          {outreach?.status === 'APPROVED' && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-green-800">
                    Draft approved
                  </p>
                  <p className="mt-1 text-sm text-green-700">
                    Outreach #{outreach.id} is approved and ready to send.
                  </p>
                </div>

                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => setIsSendDialogOpen(true)}
                >
                  Send Email
                </Button>
              </div>
            </div>
          )}

          {outreach?.status === 'SENT' && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="font-semibold text-blue-800">
                Outreach sent
              </p>
              <p className="mt-1 text-sm text-blue-700">
                Outreach #{outreach.id} was successfully dispatched.
              </p>
            </div>
          )}

          {outreach?.status === 'DRAFT' && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="font-semibold text-amber-800">
                Draft saved
              </p>
              <p className="mt-1 text-sm text-amber-700">
                Outreach #{outreach.id} is saved as a draft and has not
                been approved.
              </p>
            </div>
          )}

          {outreach?.status === 'FAILED' && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="font-semibold text-red-800">
                Outreach failed
              </p>
              <p className="mt-1 text-sm text-red-700">
                Outreach #{outreach.id} failed during transmission.
              </p>

              {outreach.errorMessage && (
                <p className="mt-2 text-xs text-red-600">
                  {outreach.errorMessage}
                </p>
              )}
            </div>
          )}

          {outreach?.status === 'UNKNOWN' && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
              <p className="font-semibold text-amber-800">
                Outreach status requires inspection
              </p>
              <p className="mt-1 text-sm text-amber-700">
                Outreach #{outreach.id} has an unresolved delivery
                state.
              </p>
            </div>
          )}

          <DraftComposer
            key={`${opportunity.id}-${selectedMatch.id}`}
            opportunity={opportunity}
            match={selectedMatch}
            actionDisabled={
              outreach !== null &&
              ['APPROVED', 'SENT', 'FAILED', 'UNKNOWN'].includes(
                outreach.status,
              )
            }
            onBack={handleBackToContacts}
            onNext={handleCreateAndApprove}
            actionLabel={
              outreach?.status === 'APPROVED'
                ? 'Approved'
                : outreach?.status === 'SENT'
                  ? 'Sent'
                  : outreach?.status === 'FAILED'
                    ? 'Send Failed'
                    : outreach?.status === 'UNKNOWN'
                      ? 'Status Unknown'
                      : 'Create Draft & Approve'
            }
            actionLoading={isCreatingDraft || isApproving}
          />
        </div>
      )}

      {outreach && opportunity && selectedMatch && (
        <SendConfirmationDialog
          isOpen={isSendDialogOpen}
          onClose={() => setIsSendDialogOpen(false)}
          onConfirmSend={handleSendOutreach}
          recipientEmail={outreach.email}
          companyName={opportunity.companyName}
          roleTitle={opportunity.roleTitle}
          subject={outreach.subject}
          body={outreach.body}
          isSending={isSending}
        />
      )}
    </div>
  );
}
