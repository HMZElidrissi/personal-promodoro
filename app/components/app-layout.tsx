import { Link, useLocation } from 'react-router';
import { Timer, History, ListChecks } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TimerSettingsPopover } from '@/components/timer-settings';

const navItems = [
  { to: '/', icon: Timer, label: 'Timer' },
  { to: '/history', icon: History, label: 'History' },
  { to: '/distractions', icon: ListChecks, label: 'Things that distracted me' },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();

  return (
    <div className="bg-background flex min-h-screen flex-col">
      {/* Top nav — Geist style: solid, sharp, minimal */}
      <header className="border-border/60 bg-background/95 sticky top-0 z-50 border-b backdrop-blur-sm">
        <div className="mx-auto flex h-12 max-w-4xl items-center justify-between px-4">
          {/* Logo mark */}
          <div className="flex items-center gap-2.5">
            <div className="border-border/80 bg-foreground/5 flex size-6 items-center justify-center rounded-md border">
              <Timer className="text-foreground size-3.5" strokeWidth={1.75} />
            </div>
            <span className="text-foreground text-sm font-semibold tracking-tight">
              ~my pomodoro
            </span>
          </div>

          {/* Nav */}
          <nav className="flex items-center gap-0.5">
            {navItems.map(({ to, icon: Icon, label }) => (
              <Link
                key={to}
                to={to}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-150',
                  pathname === to
                    ? 'bg-foreground/8 text-foreground'
                    : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground',
                )}
              >
                <Icon className="size-3.5" strokeWidth={1.75} />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            ))}
          </nav>

          <TimerSettingsPopover />
        </div>
      </header>

      {/* Page content */}
      <main className="animate-fade-in mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        {children}
      </main>
    </div>
  );
}
