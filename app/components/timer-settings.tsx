import { useState } from 'react';
import { Settings2 } from 'lucide-react';
import { useTimerContext } from '@/lib/timer-context';
import { DEFAULT_SETTINGS } from '@/lib/types';
import type { TimerSettings } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function TimerSettingsPopover() {
  const { state, updateSettings, isRunning } = useTimerContext();
  const [open, setOpen] = useState(false);

  // Local draft — only commit on "Save"
  const [draft, setDraft] = useState<TimerSettings>(() => state.settings);

  function handleOpen() {
    setDraft(state.settings); // sync to latest persisted settings
    setOpen(true);
  }

  function handleSave() {
    updateSettings(draft);
    setOpen(false);
  }

  function handleReset() {
    setDraft({ ...DEFAULT_SETTINGS });
  }

  function setField(field: keyof TimerSettings, raw: string) {
    const val = Math.max(1, Math.min(99, parseInt(raw, 10) || 1));
    setDraft((d) => ({ ...d, [field]: val }));
  }

  return (
    <div className="relative">
      <button
        id="btn-settings"
        onClick={handleOpen}
        title="Timer settings"
        className={cn(
          'flex size-8 items-center justify-center rounded-lg transition-all duration-200',
          'text-muted-foreground hover:text-foreground hover:bg-accent',
        )}
      >
        <Settings2 className="size-4" />
      </button>

      {/* Backdrop */}
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}

      {/* Popover panel */}
      {open && (
        <div
          className={cn(
            'absolute top-10 right-0 z-50 w-72',
            'glass-darker border-border/60 rounded-2xl border shadow-2xl',
            'flex flex-col gap-5 p-5',
            'animate-slide-up',
          )}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Timer Settings</h3>
            {isRunning && (
              <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-0.5 text-[10px] text-amber-400">
                takes effect after current session
              </span>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <DurationField
              label="Focus"
              accent="primary"
              value={draft.focusDuration}
              onChange={(v) => setField('focusDuration', v)}
            />
            <DurationField
              label="Short Break"
              accent="emerald"
              value={draft.shortBreakDuration}
              onChange={(v) => setField('shortBreakDuration', v)}
            />
            <DurationField
              label="Long Break"
              accent="blue"
              value={draft.longBreakDuration}
              onChange={(v) => setField('longBreakDuration', v)}
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleReset}
              className="text-muted-foreground hover:text-foreground text-xs transition-colors"
            >
              Reset defaults
            </button>
            <div className="flex-1" />
            <Button
              size="sm"
              variant="outline"
              className="border-border/60 h-8 text-xs"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button id="btn-save-settings" size="sm" className="h-8 text-xs" onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function DurationField({
  label,
  accent,
  value,
  onChange,
}: {
  label: string;
  accent: 'primary' | 'emerald' | 'blue';
  value: number;
  onChange: (v: string) => void;
}) {
  const accentClasses = {
    primary: 'text-primary border-primary/30 focus:border-primary/60 focus:ring-primary/20',
    emerald:
      'text-emerald-400 border-emerald-500/30 focus:border-emerald-500/60 focus:ring-emerald-500/20',
    blue: 'text-blue-400 border-blue-400/30 focus:border-blue-400/60 focus:ring-blue-400/20',
  }[accent];

  const dotClasses = {
    primary: 'bg-primary',
    emerald: 'bg-emerald-400',
    blue: 'bg-blue-400',
  }[accent];

  return (
    <div className="flex items-center gap-3">
      <div className={cn('size-2 shrink-0 rounded-full', dotClasses)} />
      <span className="text-foreground/80 flex-1 text-sm">{label}</span>
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          min={1}
          max={99}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'w-14 text-center text-sm font-semibold tabular-nums',
            'bg-background/60 rounded-lg border px-2 py-1.5',
            'transition-all outline-none focus:ring-2',
            accentClasses,
          )}
        />
        <span className="text-muted-foreground text-xs">min</span>
      </div>
    </div>
  );
}
