import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BackendStatusBanner } from '@/components/common/BackendStatusBanner';

export function AppLayout() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-900">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-8 space-y-6">
          <BackendStatusBanner outreachRoutesDisabled={true} />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
