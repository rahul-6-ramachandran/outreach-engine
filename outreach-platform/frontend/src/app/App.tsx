 import * as React from 'react';
import { RouterProvider } from 'react-router-dom';
import { createAppRouter } from './router';
import { type OutreachRecord } from '@/features/outreach/outreach.types';

export function App() {
  // In-memory session outreach records
  const [sessionRecords, setSessionRecords] =
    React.useState<OutreachRecord[]>([]);

  const handleAddSessionRecord = React.useCallback(
    (record: OutreachRecord) => {
      setSessionRecords((prev) => [record, ...prev]);
    },
    []
  );

  const router = React.useMemo(
    () => createAppRouter(sessionRecords, handleAddSessionRecord),
    [sessionRecords, handleAddSessionRecord]
  );

  return (
    <RouterProvider router={router} />
  );
}