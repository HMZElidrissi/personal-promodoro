import { Link, useLocation } from 'react-router';
import { Timer, History, ListChecks } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TimerSettingsPopover } from '@/components/timer-settings';

const navItems = [
  { to: '/', icon: Timer, label: 'Timer' },
  { to: '/history', icon: History, label: 'History' },
  { to: '/distractions', icon: ListChecks, label: 'Parking Lot' },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();

  return (
    <div className="bg-background flex min-h-screen flex-col">
      {/* Top nav */}
      <header className="glass border-border/50 sticky top-0 z-50 border-b">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="bg-primary flex size-7 items-center justify-center rounded-lg">
              <Timer className="text-primary-foreground size-4" />
            </div>
            <span className="gradient-text text-sm font-semibold tracking-tight">
              Personal Pomodoro
            </span>
          </div>
          <nav className="flex items-center gap-1">
            {navItems.map(({ to, icon: Icon, label }) => (
              <Link
                key={to}
                to={to}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200',
                  pathname === to
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                )}
              >
                <Icon className="size-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            ))}
          </nav>
          <TimerSettingsPopover />
        </div>
      </header>

      {/* Page content */}
      <main className="animate-fade-in mx-auto w-full max-w-4xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
