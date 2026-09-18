/**
 * The re-engagement job.
 *
 * Analytics told us retention was measurable; nothing acted on it. A streak
 * mechanic only retains if something reaches the learner on the day they are
 * about to break it — that is the whole of Duolingo's trick, and it is a
 * scheduled job, not a feature in the app.
 *
 * Rules, deliberately conservative:
 *   - one nudge per learner per run, highest-priority reason only, on one channel
 *   - push first when the learner turned it on for a device (that is where they
 *     are when the streak breaks); email only if no device accepted the push
 *   - the database refuses a second send of the same kind on the same day
 *   - the 30-day "last nudge" is sent once ever, then never again
 *   - only learners who consented to a channel are selected; anyone with
 *     email_optin = false never has their address read
 *
 * Run it from a scheduler (any cron: GitHub Actions, Cloudflare Cron, cron-job.org):
 *   POST /api/cron/reengagement   with   Authorization: Bearer $CRON_SECRET
 */

type Kind = "streak_at_risk" | "dormant_7d" | "dormant_30d";
type Channel = "email" | "push";

interface ProfileRow {
  id: string;
  display_name: string;
  streak_current: number;
  last_active_day: string | null;
  email_optin: boolean;
}

interface Candidate extends ProfileRow {
  kind: Kind;
}

interface DeviceRow {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface ReengagementReport {
  ranAt: string;
  dryRun: boolean;
  provider: string;
  scanned: number;
  selected: number;
  sent: number;
  skipped: number;
  failed: number;
  byKind: Record<Kind, number>;
  byChannel: Record<Channel, number>;
  /** Whether VAPID keys are set; without them every nudge goes by email. */
  pushConfigured: boolean;
}

/** Keeps a misconfigured schedule from mailing the entire user base in a loop. */
const MAX_PER_RUN = 200;

const utcDay = (offsetDays = 0) =>
  new Date(Date.now() + offsetDays * 86_400_000).toISOString().slice(0, 10);

const daysSince = (day: string) =>
  Math.floor((Date.parse(`${utcDay()}T00:00:00Z`) - Date.parse(`${day}T00:00:00Z`)) / 86_400_000);

function classify(profile: {
  streak_current: number;
  last_active_day: string | null;
}): Kind | null {
  const { last_active_day: last, streak_current: streak } = profile;
  if (!last) return null;
  const gap = daysSince(last);

  // A streak worth protecting is one the learner has actually built. Nagging
  // someone about a one-day streak is how an app gets muted.
  if (gap === 1 && streak >= 2) return "streak_at_risk";
  if (gap >= 30) return "dormant_30d";
  if (gap >= 7 && gap < 30) return "dormant_7d";
  return null;
}

function copyFor(kind: Kind, name: string, streak: number, link: string) {
  const first = name.split(" ")[0] || "there";
  switch (kind) {
    case "streak_at_risk":
      return {
        subject: `${first}, your ${streak}-day streak ends tonight`,
        heading: `Your ${streak}-day streak is still alive`,
        body: `One lesson holds it — that's ten minutes, not an evening. You don't need to hit your daily XP goal, just finish something.`,
        cta: "Finish one lesson",
        link,
      };
    case "dormant_7d":
      return {
        subject: `${first}, pick your roadmap back up`,
        heading: "Your roadmap is exactly where you left it",
        body: `It's been a week. Nothing has expired and nothing has moved — your next lesson is waiting, and the first one back is always the hardest.`,
        cta: "Resume where you stopped",
        link,
      };
    case "dormant_30d":
      return {
        subject: `${first}, we'll stop emailing you about this`,
        heading: "Last nudge from us",
        body: `It's been a month, so this is the last reminder we'll send. Your progress stays on your account for whenever you want it — no expiry, no penalty.`,
        cta: "Open my dashboard",
        link,
      };
  }
}

/** A notification is a line, not a letter: title plus one sentence. */
function pushCopyFor(kind: Kind, streak: number) {
  switch (kind) {
    case "streak_at_risk":
      return {
        title: `Your ${streak}-day streak ends tonight`,
        body: "One lesson holds it — ten minutes, not an evening.",
      };
    case "dormant_7d":
      return {
        title: "Your roadmap is where you left it",
        body: "It's been a week. Your next lesson is waiting.",
      };
    case "dormant_30d":
      return {
        title: "Last nudge from us",
        body: "Your progress stays on your account for whenever you want it.",
      };
  }
}

function render(
  copy: ReturnType<typeof copyFor>,
  unsubscribeUrl: string,
): { html: string; text: string } {
  const text = [
    copy.heading,
    "",
    copy.body,
    "",
    `${copy.cta}: ${copy.link}`,
    "",
    `Don't want these? Unsubscribe: ${unsubscribeUrl}`,
  ].join("\n");

  // Inline styles and a table-free layout: email clients are not browsers, and
  // the app's design tokens do not exist here.
  const html = `<!doctype html><html><body style="margin:0;padding:24px;background:#f6f6f4;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1b1b1a">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px">
    <p style="margin:0 0 20px;font-size:13px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#8a8a85">Ascent</p>
    <h1 style="margin:0 0 12px;font-size:24px;line-height:1.25">${copy.heading}</h1>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#4a4a45">${copy.body}</p>
    <a href="${copy.link}" style="display:inline-block;background:#1b1b1a;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:999px;font-size:14px;font-weight:600">${copy.cta}</a>
    <p style="margin:28px 0 0;font-size:12px;color:#8a8a85">
      You're getting this because you have an Ascent account.
      <a href="${unsubscribeUrl}" style="color:#8a8a85">Unsubscribe</a>.
    </p>
  </div>
</body></html>`;

  return { html, text };
}

export async function runReengagement(
  options: { dryRun?: boolean } = {},
): Promise<ReengagementReport> {
  const dryRun = options.dryRun ?? false;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { sendEmail, emailProvider, appUrl } = await import("@/lib/email.server");
  const { signToken, unsubscribePayload } = await import("@/lib/signing.server");
  const { vapidConfig, sendPush } = await import("@/lib/web-push.server");
  const vapid = vapidConfig();

  const report: ReengagementReport = {
    ranAt: new Date().toISOString(),
    dryRun,
    provider: emailProvider(),
    scanned: 0,
    selected: 0,
    sent: 0,
    skipped: 0,
    failed: 0,
    byKind: { streak_at_risk: 0, dormant_7d: 0, dormant_30d: 0 },
    byChannel: { email: 0, push: 0 },
    pushConfigured: Boolean(vapid),
  };

  // Turning push on for a device is consent to push, separate from email.
  const pushUsers = new Set<string>();
  if (vapid) {
    const { data, error } = await supabaseAdmin
      .from("push_subscriptions")
      .select("user_id")
      .limit(5000);
    if (error) throw new Error(`Could not read push subscriptions: ${error.message}`);
    for (const row of data ?? []) pushUsers.add(row.user_id);
  }

  // Consent is filtered in the query: only learners reachable on a channel they
  // agreed to are fetched, and an address is read only for email_optin = true.
  const consented = pushUsers.size
    ? `email_optin.eq.true,id.in.(${[...pushUsers].join(",")})`
    : "email_optin.eq.true";
  const { data: profiles, error } = await supabaseAdmin
    .from("profiles")
    .select("id, display_name, streak_current, last_active_day, email_optin")
    .or(consented)
    .not("last_active_day", "is", null)
    .lte("last_active_day", utcDay(-1))
    .limit(2000);

  if (error) throw new Error(`Could not read profiles: ${error.message}`);

  const rows = (profiles ?? []) as ProfileRow[];
  report.scanned = rows.length;

  const candidates: Candidate[] = [];
  for (const row of rows) {
    const kind = classify(row);
    if (kind) candidates.push({ ...row, kind });
  }

  // Streaks first: that nudge has a deadline tonight, the others do not.
  const priority: Record<Kind, number> = { streak_at_risk: 0, dormant_7d: 1, dormant_30d: 2 };
  candidates.sort((a, b) => priority[a.kind] - priority[b.kind]);
  const batch = candidates.slice(0, MAX_PER_RUN);
  report.selected = batch.length;

  if (candidates.length > MAX_PER_RUN) {
    console.warn(
      `[reengagement] ${candidates.length} candidates, capped at ${MAX_PER_RUN}; the rest wait for the next run.`,
    );
  }

  const devicesByUser = new Map<string, DeviceRow[]>();
  const pushTargets = batch.filter((c) => pushUsers.has(c.id)).map((c) => c.id);
  if (vapid && pushTargets.length) {
    const { data: devices } = await supabaseAdmin
      .from("push_subscriptions")
      .select("id, user_id, endpoint, p256dh, auth")
      .in("user_id", pushTargets);
    for (const device of devices ?? []) {
      const list = devicesByUser.get(device.user_id) ?? [];
      list.push(device);
      devicesByUser.set(device.user_id, list);
    }
  }

  const record = async (candidate: Candidate, channel: Channel, provider: string) => {
    // Written only after a successful send: a crash mid-run costs a duplicate
    // at worst, never a silently skipped learner.
    await supabaseAdmin.from("reengagement_sends").insert({
      user_id: candidate.id,
      kind: candidate.kind,
      day: utcDay(),
      provider,
      channel,
    });
    await supabaseAdmin.from("analytics_events").insert({
      user_id: candidate.id,
      name: "reengagement_sent",
      props: { kind: candidate.kind, provider, channel },
    });
    report.sent += 1;
    report.byKind[candidate.kind] += 1;
    report.byChannel[channel] += 1;
  };

  for (const candidate of batch) {
    // Across channels on purpose: a learner who got the push today does not
    // also get the email. The 30-day note is a goodbye, not a schedule: once
    // sent, never again.
    const dedupe = supabaseAdmin
      .from("reengagement_sends")
      .select("id")
      .eq("user_id", candidate.id)
      .eq("kind", candidate.kind);
    const { data: already } =
      candidate.kind === "dormant_30d"
        ? await dedupe.limit(1).maybeSingle()
        : await dedupe.eq("day", utcDay()).limit(1).maybeSingle();

    if (already) {
      report.skipped += 1;
      continue;
    }

    const devices = devicesByUser.get(candidate.id) ?? [];
    let pushFailed = false;
    if (vapid && devices.length) {
      if (dryRun) {
        report.byKind[candidate.kind] += 1;
        report.byChannel.push += 1;
        continue;
      }

      const copy = pushCopyFor(candidate.kind, candidate.streak_current);
      let delivered = 0;
      for (const device of devices) {
        const outcome = await sendPush(
          device,
          { ...copy, url: `${appUrl()}/dashboard`, tag: candidate.kind },
          vapid,
        );
        if (outcome.delivered) {
          delivered += 1;
          await supabaseAdmin
            .from("push_subscriptions")
            .update({ last_success_at: new Date().toISOString() })
            .eq("id", device.id);
        } else if (outcome.gone) {
          await supabaseAdmin.from("push_subscriptions").delete().eq("id", device.id);
        } else {
          console.error(`[reengagement] push to ${candidate.id} failed: ${outcome.error}`);
        }
      }

      if (delivered > 0) {
        await record(candidate, "push", "webpush");
        continue;
      }
      // No device took it — fall through to email, if they want email.
      pushFailed = true;
    }

    if (!candidate.email_optin) {
      if (pushFailed) report.failed += 1;
      else report.skipped += 1;
      continue;
    }

    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(candidate.id);
    const address = authUser?.user?.email;
    if (!address) {
      report.skipped += 1;
      continue;
    }

    const token = await signToken(unsubscribePayload(candidate.id));
    const unsubscribeUrl = `${appUrl()}/unsubscribe?u=${candidate.id}&t=${token}`;
    const copy = copyFor(
      candidate.kind,
      candidate.display_name,
      candidate.streak_current,
      `${appUrl()}/dashboard`,
    );
    const { html, text } = render(copy, unsubscribeUrl);

    if (dryRun) {
      report.byKind[candidate.kind] += 1;
      report.byChannel.email += 1;
      continue;
    }

    const outcome = await sendEmail({
      to: address,
      subject: copy.subject,
      html,
      text,
      unsubscribeUrl,
    });

    if (!outcome.delivered) {
      report.failed += 1;
      console.error(`[reengagement] ${candidate.kind} to ${candidate.id} failed: ${outcome.error}`);
      continue;
    }

    await record(candidate, "email", outcome.provider);
  }

  return report;
}

/** Bearer check for the cron endpoint. Constant-time, like every other one here. */
export function cronSecretMatches(header: string | null): boolean {
  const expected = process.env["CRON_SECRET"];
  if (!expected) return false;
  const given = (header ?? "").replace(/^Bearer\s+/i, "");
  if (given.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= given.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}
