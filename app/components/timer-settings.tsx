import { useState } from "react";
import { Settings2 } from "lucide-react";
import { useTimerContext } from "@/lib/timer-context";
import { DEFAULT_SETTINGS } from "@/lib/types";
import type { TimerSettings } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
          "flex items-center justify-center size-8 rounded-lg transition-all duration-200",
          "text-muted-foreground hover:text-foreground hover:bg-accent"
        )}
      >
        <Settings2 className="size-4" />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Popover panel */}
      {open && (
        <div
          className={cn(
            "absolute right-0 top-10 z-50 w-72",
            "glass rounded-2xl border border-border/60 shadow-2xl",
            "p-5 flex flex-col gap-5",
            "animate-slide-up"
          )}
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Timer Settings</h3>
            {isRunning && (
              <span className="text-[10px] text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                takes effect after current session
              </span>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <DurationField
              label="Focus"
              accent="primary"
              value={draft.focusDuration}
              onChange={(v) => setField("focusDuration", v)}
            />
            <DurationField
              label="Short Break"
              accent="emerald"
              value={draft.shortBreakDuration}
              onChange={(v) => setField("shortBreakDuration", v)}
            />
            <DurationField
              label="Long Break"
              accent="blue"
              value={draft.longBreakDuration}
              onChange={(v) => setField("longBreakDuration", v)}
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleReset}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Reset defaults
            </button>
            <div className="flex-1" />
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs border-border/60"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              id="btn-save-settings"
              size="sm"
              className="h-8 text-xs"
              onClick={handleSave}
            >
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
  accent: "primary" | "emerald" | "blue";
  value: number;
  onChange: (v: string) => void;
}) {
  const accentClasses = {
    primary: "text-primary border-primary/30 focus:border-primary/60 focus:ring-primary/20",
    emerald: "text-emerald-400 border-emerald-500/30 focus:border-emerald-500/60 focus:ring-emerald-500/20",
    blue: "text-blue-400 border-blue-400/30 focus:border-blue-400/60 focus:ring-blue-400/20",
  }[accent];

  const dotClasses = {
    primary: "bg-primary",
    emerald: "bg-emerald-400",
    blue: "bg-blue-400",
  }[accent];

  return (
    <div className="flex items-center gap-3">
      <div className={cn("size-2 rounded-full shrink-0", dotClasses)} />
      <span className="text-sm text-foreground/80 flex-1">{label}</span>
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          min={1}
          max={99}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "w-14 text-center text-sm font-semibold tabular-nums",
            "bg-background/60 border rounded-lg px-2 py-1.5",
            "outline-none focus:ring-2 transition-all",
            accentClasses
          )}
        />
        <span className="text-xs text-muted-foreground">min</span>
      </div>
    </div>
  );
}
