import { Link, useLocation } from "react-router";
import { Timer, History, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";
import { TimerSettingsPopover } from "@/components/timer-settings";

const navItems = [
  { to: "/", icon: Timer, label: "Timer" },
  { to: "/history", icon: History, label: "History" },
  { to: "/distractions", icon: ListChecks, label: "Parking Lot" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top nav */}
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-primary flex items-center justify-center">
              <Timer className="size-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm tracking-tight gradient-text">
              Personal Pomodoro
            </span>
          </div>
          <nav className="flex items-center gap-1">
            {navItems.map(({ to, icon: Icon, label }) => (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
                  pathname === to
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
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
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 animate-fade-in">
        {children}
      </main>
    </div>
  );
}
