import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Users,
  Building,
  Mail,
  ShieldCheck,
  PlusCircle,
  Sparkles,
  ArrowRight,
  Database,
  BarChart3,
  History,
  AlertCircle,
} from 'lucide-react';
import { opportunitiesApi } from '../opportunities/opportunities.api';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { LoadingCard } from '@/components/common/LoadingState';
import { formatDate } from '@/lib/utils';

import { outreachApi } from '../outreach/outreach.api';



export function DashboardPage() {
  // Query matching health from real backend endpoint GET /opportunities/matches/health
  const {
    data: health,
    isLoading: isLoadingHealth,
    isError: isHealthError,
  } = useQuery({
    queryKey: ['opportunities', 'matches', 'health'],
    queryFn: () => opportunitiesApi.getMatchingHealth(),
    retry: 1,
  });




  const {
  data: opportunities,
  isLoading: isLoadingOpportunities,
  isError: isOpportunitiesError,
} = useQuery({
  queryKey: ['opportunities'],
  queryFn: () => opportunitiesApi.getAll(),
  retry: 1,
});

 const {
    data: outreachRecords,
    isLoading: isLoadingOutreach,
    isError: isOutreachError,
  } = useQuery({
    queryKey: ['outreach', 'history'],
    queryFn: () => outreachApi.getHistory(),
    retry: 1,
  });
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Welcome & Primary Action Hero */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-[11px] font-semibold">
            <Sparkles className="w-3 h-3" />
            <span>Local Outreach Workspace</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Welcome to Mailer
          </h2>
          <p className="text-xs text-slate-500 max-w-xl">
            Prepare personalized, human-reviewed outreach for your target companies using local database contacts and strict send safety controls.
          </p>
        </div>

        <Link to="/new-outreach" className="shrink-0">
          <Button size="md" className="gap-2 shadow-sm">
            <PlusCircle className="w-4 h-4" />
            <span>Start New Outreach</span>
          </Button>
        </Link>
      </div>

      {/* Real Backend Statistics Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-slate-400" />
            <span>Local Database Matching Health</span>
          </h3>
          <span className="text-[11px] text-slate-400">Source: GET /opportunities/matches/health</span>
        </div>

        {isLoadingHealth ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <LoadingCard rows={1} />
            <LoadingCard rows={1} />
            <LoadingCard rows={1} />
            <LoadingCard rows={1} />
          </div>
        ) : isHealthError || !health ? (
          <div className="rounded-lg border border-slate-200 bg-white p-5 text-center text-xs text-slate-500">
            <AlertCircle className="w-5 h-5 text-amber-500 mx-auto mb-1.5" />
            <span>Could not connect to backend health statistics. Ensure the NestJS server is running on port 3000.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500">Total Contacts</div>
                  <div className="text-2xl font-bold text-slate-900 mt-0.5">
                    {health.contacts.total.toLocaleString()}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500">Linked to Company</div>
                  <div className="text-2xl font-bold text-slate-900 mt-0.5">
                    {health.contacts.withCompany.toLocaleString()}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Building className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500">With Valid Email</div>
                  <div className="text-2xl font-bold text-slate-900 mt-0.5">
                    {health.contacts.withEmail.toLocaleString()}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500">Do Not Contact</div>
                  <div className="text-2xl font-bold text-slate-900 mt-0.5">
                    {health.contacts.doNotContact.toLocaleString()}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
{/* Saved Opportunities */}
<Card>
  <CardHeader className="pb-3 border-b border-slate-100">
    <CardTitle className="text-sm font-semibold flex items-center gap-2">
      <Building className="w-4 h-4 text-indigo-600" />
      <span>Saved Opportunities</span>
    </CardTitle>
    <CardDescription>
      Your locally saved target companies and roles.
    </CardDescription>
  </CardHeader>

  <CardContent className="p-0">
    {isLoadingOpportunities ? (
      <div className="p-5">
        <LoadingCard rows={2} />
      </div>
    ) : isOpportunitiesError ? (
      <div className="p-6 text-center text-xs text-slate-500">
        <AlertCircle className="w-5 h-5 text-amber-500 mx-auto mb-2" />
        Could not load saved opportunities.
      </div>
    ) : !opportunities?.length ? (
      <div className="p-8 text-center text-xs text-slate-500">
        <p>No saved opportunities yet.</p>

        <Link to="/new-outreach">
          <Button
            size="sm"
            variant="outline"
            className="mt-3 gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Create First Opportunity
          </Button>
        </Link>
      </div>
    ) : (
      <div className="max-h-[min(30vh,16rem)] divide-y divide-slate-100 overflow-y-auto overscroll-contain">
        {opportunities.map((opportunity) => (
          <div
            key={opportunity.id}
            className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50"
          >
            <div className="min-w-0 space-y-1">
              <div className="text-sm font-semibold text-slate-900">
                {opportunity.companyName}
              </div>

              <div className="text-xs text-slate-500">
                {opportunity.roleTitle}
                {opportunity.location
                  ? ` • ${opportunity.location}`
                  : ''}
              </div>

             <div className="text-[11px] text-slate-400">
                Opportunity #{opportunity.id} • Created {formatDate(opportunity.createdAt)}
              </div>

              <div className="text-xs font-medium text-indigo-600">
                {Number(opportunity.matchCount) === 1
                  ? '1 saved match'
                  : `${Number(opportunity.matchCount) || 0} saved matches`}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <StatusBadge status={opportunity.status} />
               <Link to={`/saved-opportunities/${opportunity.id}/matches`}>
                <Button size="sm" variant="outline">
                  View Saved Matches
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    )}
  </CardContent>
</Card>
      {/* Two Column Layout: Role Breakdown & Session Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Role Family Distribution */}
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              <span>Contact Role Family Distribution</span>
            </CardTitle>
            <CardDescription>
              Breakdown of current roles identified across your local contacts.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {health?.roleFamilies ? (
              <div className="space-y-2.5">
                {Object.entries(health.roleFamilies).map(([family, count]) => {
                  const total = health.contacts.total || 1;
                  const percentage = Math.round((count / total) * 100);

                  return (
                    <div key={family} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-700">{family}</span>
                        <span className="text-slate-500 font-mono text-[11px]">
                          {count.toLocaleString()} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-1.5 rounded-full transition-all"
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">
                Health breakdown unavailable.
              </p>
            )}
          </CardContent>
        </Card>

                {/* Recent Outreach Activity */}
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-600" />
                <span>Recent Outreach</span>
              </CardTitle>
              <CardDescription>
                Latest persisted outreach lifecycle records from the local database.
              </CardDescription>
            </div>

            <Link
              to="/outreach-history"
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>

          <CardContent className="p-0">
            {isLoadingOutreach ? (
              <div className="p-8 text-center text-xs text-slate-500">
                Loading recent outreach...
              </div>
            ) : isOutreachError ? (
              <div className="p-8 text-center text-xs text-slate-500">
                <AlertCircle className="w-5 h-5 text-amber-500 mx-auto mb-2" />
                Could not load recent outreach history.
              </div>
            ) : !outreachRecords?.length ? (
              <div className="p-8 text-center text-xs text-slate-500 space-y-2">
                <p>No outreach records yet.</p>

                <Link to="/new-outreach">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 mt-2"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Create First Outreach</span>
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {outreachRecords.slice(0, 5).map((record) => (
                  <div
                    key={record.id}
                    className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">
                        {record.contactName || record.email}
                      </div>

                      <div className="text-[11px] text-slate-400">
                        {record.companyName || 'Unknown company'}
                        {record.roleTitle
                          ? ` • ${record.roleTitle}`
                          : ''}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <StatusBadge status={record.status} />

                      <span className="text-[10px] text-slate-400">
                        {formatDate(record.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
