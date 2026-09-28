import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Send,
  History,
  Settings,
  LogOut,
  Mail,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/features/auth/AuthProvider';

export function Sidebar() {
  const { logout, isLoggingOut } = useAuth();

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/new-outreach', label: 'New Outreach', icon: Send },
    { to: '/outreach/history', label: 'Outreach History', icon: History },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 border-r border-slate-200 bg-white flex flex-col justify-between shrink-0 select-none">
      {/* Brand header */}
      <div>
        <div className="h-16 flex items-center px-6 border-b border-slate-100 gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200">
            <Mail className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-semibold text-sm tracking-tight text-slate-900 flex items-center gap-1.5">
              Mailer
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-normal">
                local
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">Privacy-First Outreach</p>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors',
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  )
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-100 space-y-3">
        {/* Local Security Badge */}
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-slate-50 border border-slate-100 text-[11px] text-slate-500">
          <Shield className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="truncate">Localhost Isolated</span>
        </div>

        {/* Logout Button */}
        <button
          onClick={() => logout()}
          disabled={isLoggingOut}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium text-slate-600 hover:bg-red-50 hover:text-red-700 transition-colors disabled:opacity-50"
        >
          <LogOut className="w-4 h-4 text-slate-400 group-hover:text-red-600" />
          <span>{isLoggingOut ? 'Logging out…' : 'Sign out'}</span>
        </button>
      </div>
    </aside>
  );
}
