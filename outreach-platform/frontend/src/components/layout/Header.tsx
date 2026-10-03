import { useLocation, Link } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header() {
  const location = useLocation();

  const getPageDetails = () => {
    switch (location.pathname) {
      case '/':
        return {
          title: 'Outreach Dashboard',
          description: 'Local workspace overview and matching health statistics.',
          showNewAction: true,
        };
      case '/new-outreach':
        return {
          title: 'New Outreach',
          description: 'Create an opportunity, review candidate matches, and prepare outreach.',
          showNewAction: false,
        };
      case '/outreach-history':
        return {
          title: 'Outreach History',
          description: 'Review persisted outreach lifecycle records.',
          showNewAction: true,
        };
      case '/settings':
        return {
          title: 'System & Security Settings',
          description: 'Inspect local backend connectivity, database health, and session state.',
          showNewAction: false,
        };
      default:
        return {
          title: 'Mailer',
          description: 'Privacy-First Local Outreach Platform',
          showNewAction: false,
        };
    }
  };

  const { title, description, showNewAction } = getPageDetails();

  return (
    <header className="h-16 border-b border-slate-200 bg-white px-8 flex items-center justify-between shrink-0">
      <div>
        <h2 className="text-sm font-semibold text-slate-900 tracking-tight">{title}</h2>
        <p className="text-xs text-slate-500">{description}</p>
      </div>

      <div className="flex items-center gap-3">
        {showNewAction && (
          <Link to="/new-outreach">
            <Button size="sm" className="gap-1.5 shadow-sm">
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New Outreach</span>
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
}
