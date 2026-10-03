import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';

import { outreachApi } from '@/features/outreach/outreach.api';
import type { OutreachRecord } from '@/features/outreach/outreach.types';
import { opportunitiesApi } from './opportunities.api';
import { ContactSelection } from './ContactSelection';
import { DraftComposer } from './DraftComposer';

import { LoadingTable } from '@/components/common/LoadingState';
import { Button } from '@/components/ui/button';

import type {
  ContactMatch,
  Opportunity,
} from './opportunities.types';
import { SendConfirmationDialog } from '../outreach/SendConfirmationDialog';

export function ExistingOpportunityMatchesPage() {
  const { id } = useParams<{ id: string }>();
  const opportunityId = Number(id);

  const [selectedMatch, setSelectedMatch] =
    useState<ContactMatch | null>(null);

  const [showDraft, setShowDraft] = useState(false);
  const [outreach, setOutreach] = useState<OutreachRecord | null>(null);
const [isCreatingDraft, setIsCreatingDraft] = useState(false);
const [isApproving, setIsApproving] = useState(false);

const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
const [isSending, setIsSending] = useState(false);

const [outreachError, setOutreachError] = useState<string | null>(null);

  const {
    data: opportunities,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['opportunities'],
    queryFn: opportunitiesApi.getAll,
    enabled: Number.isInteger(opportunityId) && opportunityId > 0,
  });

  const {
    data: generatedDraft,
    isLoading: isDraftLoading,
    isError: isDraftError,
    error: draftError,
    refetch: refetchDraft,
  } = useQuery({
    queryKey: [
      'generated-match-draft',
      opportunityId,
      selectedMatch?.id,
    ],
    queryFn: () =>
      opportunitiesApi.generateMatchDraft(
        opportunityId,
        selectedMatch!.id
      ),
    enabled:
      showDraft &&
      Number.isInteger(opportunityId) &&
      opportunityId > 0 &&
      selectedMatch !== null,
    retry: false,
  });


  if (isLoading) {
    return <LoadingTable rows={4} />;
  }

  if (
    isError ||
    !Number.isInteger(opportunityId) ||
    opportunityId <= 0
  ) {
    return <p>Could not load the opportunity.</p>;
  }

  const opportunity = opportunities?.find(
    (item) => item.id === opportunityId
  );

  if (!opportunity) {
    return <p>Opportunity not found.</p>;
  }

  const handleReviewDraft = () => {
    if (!selectedMatch) return;

    setShowDraft(true);
  };

  const handleBackToContacts = () => {
  setShowDraft(false);
  setOutreach(null);
  setOutreachError(null);
};

  const handleCreateAndApprove = async () => {
  if (!selectedMatch || !generatedDraft) return;

  setOutreachError(null);
  setIsCreatingDraft(true);

  try {
    const created = await outreachApi.createDraft(
      opportunityId,
      generatedDraft.match.id,
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
  setShowDraft(false);
  setOutreach(null);
  setOutreachError(null);
};

  const draftOpportunity: Opportunity | null =
    generatedDraft
      ? {
          ...opportunity,
          companyName: generatedDraft.opportunity.companyName,
          roleTitle: generatedDraft.opportunity.roleTitle,
          location: generatedDraft.opportunity.location,
          jobUrl: generatedDraft.opportunity.jobUrl,
        }
      : null;

  const draftMatch: ContactMatch | null =
    generatedDraft && selectedMatch
      ? {
          ...selectedMatch,
          id: generatedDraft.match.id,
          rank: generatedDraft.match.rank,
          score: generatedDraft.match.score,
          reasons: generatedDraft.match.reasons,
          contactId: generatedDraft.contact.id,
          name: generatedDraft.contact.name,
          title: generatedDraft.contact.title,
          roleFamily: generatedDraft.contact.roleFamily,
          email: generatedDraft.contact.email,
          emailType: generatedDraft.contact.emailType,
          identityConfidence:
            generatedDraft.contact.identityConfidence,
          outreach: {
            strategy: generatedDraft.strategy,
            draft: generatedDraft.draft,
          },
        }
      : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link to="/">
          <Button variant="outline" size="sm">
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {!showDraft && (
        <ContactSelection
          opportunity={opportunity}
          selectedMatch={selectedMatch}
          onSelectMatch={handleSelectMatch}
          onNext={handleReviewDraft}
          onBack={() => {}}
          readOnly
        />
      )}

      {showDraft && (
        <div className="space-y-4">
          {isDraftLoading && (
            <div className="rounded-lg border p-6 text-sm text-slate-600">
              Generating your draft preview…
            </div>
          )}

          {isDraftError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-3">
              <p className="text-sm text-red-700">
                Could not generate the draft preview.
              </p>

              <p className="text-xs text-red-600">
                {draftError instanceof Error
                  ? draftError.message
                  : 'Please try again.'}
              </p>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => refetchDraft()}
                >
                  Retry
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleBackToContacts}
                >
                  Back to Contacts
                </Button>
              </div>
            </div>
          )}

          {generatedDraft &&
            draftOpportunity &&
            draftMatch &&
            !isDraftLoading &&
            !isDraftError && (
              <>
                {!generatedDraft.contact.email && (
                  <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
                    No eligible email address was returned for this
                    contact. Review the contact details before using
                    this draft.
                  </div>
                )}

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
                          Outreach #{outreach.id} is saved as a draft and has not been approved.
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
                          Outreach #{outreach.id} has an unresolved delivery state.
                        </p>
                      </div>
                    )}

                    <DraftComposer
                      key={`${opportunityId}-${generatedDraft.match.id}`}
                      opportunity={draftOpportunity}
                      match={draftMatch}
                      actionDisabled={
                        outreach !== null &&
                        ['APPROVED', 'SENT', 'FAILED', 'UNKNOWN'].includes(outreach.status)
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
              </>
            )}
        </div>
      )}

      {outreach && draftOpportunity && draftMatch && (
        <SendConfirmationDialog
          isOpen={isSendDialogOpen}
          onClose={() => setIsSendDialogOpen(false)}
          onConfirmSend={handleSendOutreach}
          recipientEmail={outreach.email}
          companyName={draftOpportunity.companyName}
          roleTitle={draftOpportunity.roleTitle}
          subject={outreach.subject}
          body={outreach.body}
          isSending={isSending}
        />
      )}
    </div>
  );
}