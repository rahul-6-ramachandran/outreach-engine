import { useState, useMemo } from 'react';
import {
  History,
  Search,
  Eye,
  Inbox,
} from 'lucide-react';
import { type OutreachRecord } from './outreach.types';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { Alert } from '@/components/ui/alert';
import { EmptyState } from '@/components/common/EmptyState';
import { formatDate } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface OutreachHistoryPageProps {
  sessionRecords?: OutreachRecord[];
}

export function OutreachHistoryPage({ sessionRecords = [] }: OutreachHistoryPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedRecord, setSelectedRecord] = useState<OutreachRecord | null>(null);

  const filteredRecords = useMemo(() => {
    return sessionRecords.filter((record) => {
      const matchesSearch =
        searchQuery === '' ||
        (record.companyName && record.companyName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (record.roleTitle && record.roleTitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (record.email && record.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (record.subject && record.subject.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === 'ALL' || record.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [sessionRecords, searchQuery, statusFilter]);

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Session-Only History Disclosure */}
      <Alert variant="info" title="Session-Only Storage Architecture">
        <p className="mt-0.5 leading-relaxed">
          The NestJS backend does not expose a persistent outreach history listing endpoint (<code className="bg-blue-100 font-mono px-1 py-0.5 rounded text-[11px]">GET /outreach</code>). Records are maintained strictly in-memory during this active browser session. To protect private contact data, records are never stored in <code className="font-mono">localStorage</code> or <code className="font-mono">sessionStorage</code> and will reset upon page reload.
        </p>
      </Alert>

      {/* Main Table Card */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-600" />
              <span>Outreach Records ({sessionRecords.length} in session)</span>
            </CardTitle>
            <CardDescription>
              Inspection log for outreach prepared during this active application session.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-48">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search history..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 pl-8 pr-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 rounded-md border border-slate-200 bg-slate-50 px-2 text-xs text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="APPROVED">Approved</option>
              <option value="SENT">Sent</option>
              <option value="FAILED">Failed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {sessionRecords.length === 0 ? (
            <div className="p-10">
              <EmptyState
                icon={Inbox}
                title="No session outreach records available"
                description="The backend does not provide a persistent outreach history listing endpoint. Outreach items created during your current session will appear here."
                actionLabel="Create New Outreach"
                onAction={() => {}}
                secondaryAction={
                  <Link to="/new-outreach">
                    <Button size="sm">Start New Outreach</Button>
                  </Link>
                }
              />
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={Search}
                title="No matching records"
                description="No in-memory outreach records matched your search query or status filter."
              />
            </div>
          ) : (
            <div className="divide-y divide-slate-100 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4">Recipient & Company</th>
                    <th className="py-2.5 px-4">Subject</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4">Created</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRecords.map((record) => (
                    <tr
                      key={record.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {record.contactName || record.email}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <span>{record.companyName || 'Target Company'}</span>
                          {record.roleTitle && (
                            <>
                              <span>•</span>
                              <span>{record.roleTitle}</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-slate-700 font-medium">
                        {record.subject}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={record.status} />
                      </td>
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap text-[11px]">
                        {formatDate(record.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => setSelectedRecord(record)}
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500 mr-1" />
                          <span>View</span>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      {selectedRecord && (
        <Dialog
          isOpen={!!selectedRecord}
          onClose={() => setSelectedRecord(null)}
          title="Outreach Record Detail"
          description="In-memory record created during this browser session."
          className="max-w-xl"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Status</span>
                <StatusBadge status={selectedRecord.status} />
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Created</span>
                <span className="text-slate-600 font-medium">{formatDate(selectedRecord.createdAt)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <span className="text-slate-400 text-[11px] block">Recipient</span>
                <span className="font-mono text-slate-900 font-medium">{selectedRecord.email}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Subject</span>
                <span className="text-slate-900 font-medium">{selectedRecord.subject}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Body</span>
                <div className="mt-1 p-3 rounded border border-slate-200 bg-white font-mono text-[11px] text-slate-800 whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {selectedRecord.body}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button size="sm" variant="outline" onClick={() => setSelectedRecord(null)}>
                Close
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
