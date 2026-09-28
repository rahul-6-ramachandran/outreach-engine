import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Search,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Mail,
  Briefcase,
} from 'lucide-react';
import { opportunitiesApi } from './opportunities.api';
import { type Opportunity, type ContactMatch } from './opportunities.types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { LoadingTable } from '@/components/common/LoadingState';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { getErrorMessage } from '@/types/api.types';
import { cn } from '@/lib/utils';

interface ContactSelectionProps {
  opportunity: Opportunity;
  selectedMatch: ContactMatch | null;
  onSelectMatch: (match: ContactMatch) => void;
  onNext: () => void;
  onBack: () => void;
  readOnly?: boolean;
}

export function ContactSelection({
  opportunity,
  selectedMatch,
  onSelectMatch,
  onNext,
  onBack,
  readOnly = false,
}: ContactSelectionProps) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [roleFamilyFilter, setRoleFamilyFilter] = React.useState<string>('ALL');

  // Fetch matches from GET /opportunities/:id/matches
  const {
    data: matchesData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['opportunities', opportunity.id, 'matches'],
    queryFn: () =>
        readOnly
          ? opportunitiesApi.getSavedMatches(opportunity.id)
          : opportunitiesApi.getMatches(opportunity.id),
  });

  // Generate matches mutation
  const generateMutation = useMutation({
    mutationFn: () => opportunitiesApi.generateMatches(opportunity.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities', opportunity.id, 'matches'] });
    },
  });

  const matches = matchesData?.matches || [];

  // Role families for filtering
  const availableRoleFamilies = React.useMemo(() => {
    const families = new Set<string>();
    matches.forEach((m) => {
      if (m.roleFamily) families.add(m.roleFamily);
    });
    return Array.from(families);
  }, [matches]);

  // Filtered matches
  const filteredMatches = React.useMemo(() => {
    return matches.filter((m) => {
      const matchesSearch =
        searchQuery === '' ||
        (m.name && m.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (m.title && m.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (m.email && m.email.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesFilter =
        roleFamilyFilter === 'ALL' || m.roleFamily === roleFamilyFilter;

      return matchesSearch && matchesFilter;
    });
  }, [matches, searchQuery, roleFamilyFilter]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <LoadingTable rows={4} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-2xl mx-auto">
        <ErrorState
          title="Could not load candidate matches"
          message={getErrorMessage(error, 'Failed to fetch matches for this company.')}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Context banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
        <div>
          <div className="text-xs text-slate-500 font-medium">Target Company & Role</div>
          <div className="text-sm font-semibold text-slate-900">
            {opportunity.companyName} <span className="text-slate-400 font-normal">•</span> {opportunity.roleTitle}
          </div>
        </div>
        {!readOnly && (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs"
            onClick={() => generateMutation.mutate()}
            isLoading={generateMutation.isPending}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Regenerate Matches</span>
          </Button>
        </div>
        )}
      </div>

      {/* Main card */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>Select Outreach Recipient ({filteredMatches.length} available)</span>
              </CardTitle>
              <CardDescription>
                Select an individual contact to generate and inspect their tailored outreach email.
              </CardDescription>
            </div>

            {/* Search and filters */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-48">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search name, title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 pl-8 pr-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {availableRoleFamilies.length > 0 && (
                <select
                  value={roleFamilyFilter}
                  onChange={(e) => setRoleFamilyFilter(e.target.value)}
                  className="h-8 rounded-md border border-slate-200 bg-slate-50 px-2 text-xs text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="ALL">All Roles</option>
                  {availableRoleFamilies.map((fam) => (
                    <option key={fam} value={fam}>
                      {fam}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredMatches.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={Users}
                title="No contacts found for this company"
                description={
                  matches.length === 0
                    ? `No contacts in your local database match ${opportunity.companyName}. You can run match generation or try another target company.`
                    : 'No candidate contacts match your active search filters.'
                }
                actionLabel={matches.length === 0 ? 'Generate Matches' : undefined}
                onAction={matches.length === 0 ? () => generateMutation.mutate() : undefined}
              />
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[480px] overflow-y-auto">
              {filteredMatches.map((match) => {
                const isSelected = selectedMatch?.id === match.id;

                return (
                  <div
                    key={match.id}
                    onClick={() => onSelectMatch(match)}
                    className={cn(
                      'p-4 transition-colors cursor-pointer flex items-start justify-between gap-4 hover:bg-slate-50/80',
                      isSelected && 'bg-indigo-50/50 border-l-4 border-l-indigo-600'
                    )}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={cn(
                          'mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors',
                          isSelected
                            ? 'border-indigo-600 bg-indigo-600 text-white'
                            : 'border-slate-300 bg-white'
                        )}
                      >
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>

                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-slate-900">
                            {match.name || 'Unnamed Contact'}
                          </span>
                          {match.roleFamily && (
                            <Badge variant="outline" className="text-[10px]">
                              {match.roleFamily}
                            </Badge>
                          )}
                          {match.score > 0 && (
                            <Badge variant="purple" className="text-[10px]">
                              Score: {match.score}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                          {match.title && (
                            <span className="flex items-center gap-1">
                              <Briefcase className="w-3 h-3 text-slate-400" />
                              <span>{match.title}</span>
                            </span>
                          )}
                          {match.email && (
                            <span className="flex items-center gap-1 font-mono text-slate-600">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span>{match.email}</span>
                            </span>
                          )}
                        </div>

                       {(() => {
                          const reasons = Array.isArray(match.reasons)
                            ? match.reasons
                            : typeof match.reasons === 'string'
                              ? [match.reasons]
                              : [];

                          return reasons.length > 0 ? (
                            <div className="text-[11px] text-slate-500 pt-0.5 flex items-center gap-1 flex-wrap">
                              <span className="text-slate-400">Match criteria:</span>

                              {reasons.map((reason, idx) => (
                                <span
                                  key={idx}
                                  className="inline-block px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[10px]"
                                >
                                  {String(reason)}
                                </span>
                              ))}
                            </div>
                          ) : null;
                        })()}
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <span className="text-[11px] text-slate-400">Rank #{match.rank}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Navigation action footer */}
          <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50/50">
            <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </Button>

            <Button
              size="sm"
              disabled={!selectedMatch}
              onClick={onNext}
              className="gap-1.5 shadow-sm"
            >
              <span>Review Draft</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
