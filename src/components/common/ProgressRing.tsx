import { cn } from "@/lib/utils";

interface ProgressRingProps {
  percent: number;
  size?: number;
  label?: string;
  sublabel?: string;
  className?: string;
}

export function ProgressRing({ percent, size = 176, label, sublabel, className }: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <div className={cn("relative", className)} style={{ width: size, height: size }}>
      <div
        className="size-full rounded-full transition-all duration-700"
        style={{
          background: `conic-gradient(var(--brand) 0% ${clamped}%, var(--line) ${clamped}% 100%)`,
        }}
        role="img"
        aria-label={`${clamped}% complete`}
      />
      <div className="absolute inset-3 grid place-items-center rounded-full bg-card text-center">
        <div>
          <div className="font-display text-4xl font-bold leading-none text-foreground">
            {label ?? `${clamped}%`}
          </div>
          {sublabel ? <div className="mt-1 text-xs font-medium text-chalk">{sublabel}</div> : null}
        </div>
      </div>
    </div>
  );
}
