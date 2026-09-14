import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function StatPill({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "brand" | "ember";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
        tone === "neutral" && "bg-card text-chalk ring-1 ring-border",
        tone === "brand" && "bg-brand/10 text-brand ring-1 ring-brand/20",
        tone === "ember" && "bg-ember/10 text-ember ring-1 ring-ember/20",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("eyebrow", className)}>{children}</p>;
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="card-surface flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <div className="grid size-12 place-items-center rounded-2xl bg-brand/10 text-brand">{icon}</div>
      <h3 className="font-display text-lg font-semibold text-foreground">{title}</h3>
      <p className="max-w-sm text-sm text-chalk">{description}</p>
      {action}
    </div>
  );
}
