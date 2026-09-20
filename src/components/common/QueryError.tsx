import { Button } from "@/components/ui/button";

export function QueryError({
  title = "We couldn't load this section",
  retry,
  busy = false,
}: {
  title?: string;
  retry: () => unknown;
  busy?: boolean;
}) {
  return (
    <div role="alert" className="my-4 rounded-xl border border-destructive/30 bg-card p-5">
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm text-chalk">
        Your saved work has not been changed. Check your connection and try again.
      </p>
      <Button className="mt-3" variant="outline" disabled={busy} onClick={() => void retry()}>
        {busy ? "Retrying…" : "Try again"}
      </Button>
    </div>
  );
}
