import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { opportunitiesApi } from './opportunities.api';
import { ContactSelection } from './ContactSelection';
import { LoadingTable } from '@/components/common/LoadingState';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import type { ContactMatch } from './opportunities.types';

export function ExistingOpportunityMatchesPage() {
  const { id } = useParams<{ id: string }>();
  const opportunityId = Number(id);
  const [selectedMatch, setSelectedMatch] =
    useState<ContactMatch | null>(null);

  const {
    data: opportunities,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['opportunities'],
    queryFn: opportunitiesApi.getAll,
    enabled: Number.isInteger(opportunityId) && opportunityId > 0,
  });

  if (isLoading) return <LoadingTable rows={4} />;

  if (isError || !Number.isInteger(opportunityId) || opportunityId <= 0) {
    return <p>Could not load the opportunity.</p>;
  }

  const opportunity = opportunities?.find(
    (item) => item.id === opportunityId
  );

  if (!opportunity) {
    return <p>Opportunity not found.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link to="/">
          <Button variant="outline" size="sm">
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <ContactSelection
        opportunity={opportunity}
        selectedMatch={selectedMatch}
        onSelectMatch={setSelectedMatch}
        onNext={() => {}}
        onBack={() => {}}
        readOnly
      />
    </div>
  );
}