import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';

import { opportunitiesApi } from './opportunities.api';
import { ContactSelection } from './ContactSelection';
import { DraftComposer } from './DraftComposer';

import { LoadingTable } from '@/components/common/LoadingState';
import { Button } from '@/components/ui/button';

import type {
  ContactMatch,
  Opportunity,
} from './opportunities.types';

export function ExistingOpportunityMatchesPage() {
  const { id } = useParams<{ id: string }>();
  const opportunityId = Number(id);

  const [selectedMatch, setSelectedMatch] =
    useState<ContactMatch | null>(null);

  const [showDraft, setShowDraft] = useState(false);

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
  };

  const handleSelectMatch = (match: ContactMatch | null) => {
    setSelectedMatch(match);
    setShowDraft(false);
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

                <DraftComposer
                  key={`${opportunityId}-${generatedDraft.match.id}`}
                  opportunity={draftOpportunity}
                  match={draftMatch}
                  onBack={handleBackToContacts}
                  onNext={() => {}}
                  previewOnly
                />
              </>
            )}
        </div>
      )}
    </div>
  );
}