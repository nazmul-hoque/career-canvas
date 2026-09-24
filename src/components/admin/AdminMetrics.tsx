import { useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { QueryError } from "@/components/common/QueryError";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminMetrics } from "@/hooks/useAdmin";
import type { AdminMetrics as Metrics } from "@/lib/admin.functions";
import { cn } from "@/lib/utils";
import { formatCount, formatDay } from "./format";

const RANGES = [7, 30, 90] as const;

type SeriesKey = "signups" | "completions" | "active";

// Three measures on three scales, so three charts rather than one with two axes.
const SERIES: { key: SeriesKey; title: string; hint: string }[] = [
  { key: "signups", title: "Sign-ups", hint: "New accounts per day" },
  { key: "completions", title: "Lesson completions", hint: "Lessons finished per day" },
  { key: "active", title: "Active learners", hint: "Learners who earned XP that day" },
];

export function AdminMetrics() {
  const [days, setDays] = useState<(typeof RANGES)[number]>(30);
  const metrics = useAdminMetrics(days);

  if (metrics.isError) {
    return (
      <QueryError title="Couldn't load metrics" retry={metrics.refetch} busy={metrics.isFetching} />
    );
  }

  const m = metrics.data;
  const paid = m
    ? Object.entries(m.plans).reduce((n, [plan, c]) => (plan === "free" ? n : n + c), 0)
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile
          label="Learners"
          value={m?.learners}
          note={m ? `${formatCount(m.onboarded)} onboarded` : null}
        />
        <Tile
          label="Active, last 7 days"
          value={m?.active7}
          note={m ? `${formatCount(m.active30)} in 30 days` : null}
        />
        <Tile
          label="Paid plans"
          value={m ? paid : undefined}
          note={m ? `${formatCount(m.trialing)} on a trial` : null}
        />
        <Tile
          label="Lessons completed"
          value={m?.completions}
          note={m ? `${formatCount(m.certificates)} certificates issued` : null}
        />
      </div>

      {m && m.openReports > 0 ? (
        <p className="rounded-lg border border-destructive/30 bg-card px-4 py-3 text-sm">
          {m.openReports} open community {m.openReports === 1 ? "report is" : "reports are"} waiting
          in Moderation.
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-bold">Daily activity</h2>
        <div
          role="tablist"
          aria-label="Date range"
          className="flex gap-1 rounded-lg bg-secondary p-1"
        >
          {RANGES.map((r) => (
            <button
              key={r}
              role="tab"
              aria-selected={days === r}
              onClick={() => setDays(r)}
              className={cn(
                "rounded-md px-3 py-1 text-sm font-semibold",
                days === r
                  ? "bg-card text-foreground shadow-card"
                  : "text-chalk hover:text-foreground",
              )}
            >
              {r} days
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {SERIES.map((s) => (
          <DailyChart key={s.key} series={s} daily={m?.daily} />
        ))}
      </div>
      <p className="text-xs text-chalk">Days are UTC.</p>
    </div>
  );
}

function Tile({
  label,
  value,
  note,
}: {
  label: string;
  value: number | undefined;
  note: string | null;
}) {
  return (
    <div className="card-surface p-4">
      <p className="text-xs font-semibold text-chalk">{label}</p>
      {value === undefined ? (
        <Skeleton className="mt-2 h-8 w-20" />
      ) : (
        <p className="mt-1 font-display text-3xl font-bold tabular-nums">{formatCount(value)}</p>
      )}
      {note ? <p className="mt-1 text-xs text-chalk">{note}</p> : null}
    </div>
  );
}

function DailyChart({
  series,
  daily,
}: {
  series: (typeof SERIES)[number];
  daily: Metrics["daily"] | undefined;
}) {
  const config = {
    [series.key]: { label: series.title, color: "var(--chart-1)" },
  } satisfies ChartConfig;
  const total = daily?.reduce((n, d) => n + d[series.key], 0) ?? 0;
  const label = series.key === "active" ? "Peak day" : "Total";
  const figure =
    series.key === "active" ? Math.max(0, ...(daily ?? []).map((d) => d.active)) : total;

  return (
    <figure className="card-surface flex flex-col p-4">
      <figcaption>
        <p className="font-semibold">{series.title}</p>
        <p className="text-xs text-chalk">
          {series.hint}
          {daily ? ` · ${label} ${formatCount(figure)}` : ""}
        </p>
      </figcaption>
      {!daily ? (
        <Skeleton className="mt-3 h-40 w-full" />
      ) : (
        <>
          <ChartContainer config={config} className="mt-3 aspect-auto h-40 w-full">
            <BarChart data={daily} margin={{ left: -20, right: 4, top: 4 }} barCategoryGap={2}>
              <CartesianGrid vertical={false} strokeOpacity={0.5} />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tickFormatter={formatDay}
                minTickGap={24}
                fontSize={11}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                width={44}
                fontSize={11}
              />
              <ChartTooltip
                cursor={{ fillOpacity: 0.4 }}
                content={<ChartTooltipContent labelFormatter={(v) => formatDay(String(v))} />}
              />
              <Bar
                dataKey={series.key}
                fill={`var(--color-${series.key})`}
                radius={[4, 4, 0, 0]}
                maxBarSize={24}
              />
            </BarChart>
          </ChartContainer>
          {/* The bars are pale against a light card; the numbers are here for anyone who
              can't make them out, and for copying. */}
          <details className="mt-2 text-xs">
            <summary className="cursor-pointer text-chalk hover:text-foreground">
              Show as table
            </summary>
            <div className="mt-2 max-h-48 overflow-y-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-chalk">
                    <th className="py-1 font-medium">Day</th>
                    <th className="py-1 text-right font-medium">{series.title}</th>
                  </tr>
                </thead>
                <tbody>
                  {[...daily].reverse().map((d) => (
                    <tr key={d.day} className="border-t border-border">
                      <td className="py-1">{formatDay(d.day)}</td>
                      <td className="py-1 text-right tabular-nums">{formatCount(d[series.key])}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
    </figure>
  );
}
