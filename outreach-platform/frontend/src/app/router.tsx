import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { AppLayout } from '@/components/layout/AppLayout';
import { RequireAuth } from '@/features/auth/AuthProvider';
import { LoginPage } from '@/features/auth/LoginPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { NewOutreachPage } from '@/features/opportunities/NewOutreachPage';
import { OutreachHistoryPage } from '@/features/outreach/OutreachHistoryPage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { ExistingOpportunityMatchesPage } from '@/features/opportunities/ExistingOpportunityMatchesPage';
import { type OutreachRecord } from '@/features/outreach/outreach.types';

export function createAppRouter(
  sessionRecords: OutreachRecord[],
  onAddSessionRecord: (record: OutreachRecord) => void
) {
  return createBrowserRouter([
  {
    element: (
      <AuthProvider>
        <Outlet />
      </AuthProvider>
    ),
    children: [
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        path: '/',
        element: (
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        ),
        children: [
          {
            index: true,
            element: <DashboardPage sessionRecords={sessionRecords} />,
          },
          {
            path: '/new-outreach',
            element: (
              <NewOutreachPage
                onAddSessionRecord={onAddSessionRecord}
              />
            ),
          },
          {
            path: 'outreach/history',
            element: (
              <OutreachHistoryPage sessionRecords={sessionRecords} />
            ),
          },
          {
            path: 'settings',
            element: <SettingsPage />,
          },
          {
            path: 'saved-opportunities/:id/matches',
            element: <ExistingOpportunityMatchesPage />,
          },
          {
            path: '*',
            element: <Navigate to="/" replace />,
          },
        ],
      },
    ],
  },
]);
}