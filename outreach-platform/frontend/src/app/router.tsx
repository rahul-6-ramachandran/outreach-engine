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

export function createAppRouter() {
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
            element: <DashboardPage />,
          },
          {
            path: '/new-outreach',
            element: (
              <NewOutreachPage
              />
            ),
          },
          {
            path: 'outreach-history',
            element: (
              <OutreachHistoryPage/>
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