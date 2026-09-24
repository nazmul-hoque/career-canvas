import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { PlanId } from "@/lib/entitlements";

/**
 * Everything behind /admin. The route hides itself from non-admins, but that is
 * courtesy: each function here re-reads `admin_users` with the service role
 * before touching anything, and records every change in `admin_actions`.
 */

async function adminClient(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error("Admin access could not be checked. Try again.");
  if (!data) throw new Error("You don't have admin access.");
  return supabaseAdmin;
}

type AdminClient = Awaited<ReturnType<typeof adminClient>>;

async function logAction(
  db: AdminClient,
  adminId: string,
  action: string,
  target: { type: string; id: string },
  detail: Record<string, string | number | boolean | null> = {},
) {
  // A change that can't be recorded is still made — the log is for accountability,
  // and failing the action after it happened would only mislead the admin.
  const { error } = await db.from("admin_actions").insert({
    admin_id: adminId,
    action,
    target_type: target.type,
    target_id: target.id,
    detail,
  });
  if (error) console.error("[admin] could not record action", action, error.message);
}

/** One admin can't lock out another from the UI; that's a deliberate SQL change. */
async function refuseIfAdmin(db: AdminClient, userId: string) {
  const { data } = await db
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (data) throw new Error("That account is an admin. Remove its admin access in SQL first.");
}

const byIds = async (db: AdminClient, ids: string[]) => {
  if (!ids.length) return new Map<string, string>();
  const { data } = await db.from("profiles").select("id, display_name").in("id", ids);
  return new Map((data ?? []).map((p) => [p.id, p.display_name]));
};

// ——— Users ———

export type AdminUserRow = {
  id: string;
  email: string;
  displayName: string;
  plan: string;
  trialEndsAt: string | null;
  xp: number;
  level: number;
  streak: number;
  lastActiveDay: string | null;
  createdAt: string;
  lastSignInAt: string | null;
  suspended: boolean;
  isAdmin: boolean;
};

const PAGE_SIZE = 25;

export const adminListUsersFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z
      .object({ query: z.string().trim().max(200).default(""), page: z.number().int().min(0) })
      .parse(input),
  )
  .handler(
    async ({
      data,
      context,
    }): Promise<{ rows: AdminUserRow[]; total: number; pageSize: number }> => {
      const db = await adminClient(context.userId);
      const { data: rows, error } = await db.rpc("admin_user_directory", {
        p_query: data.query,
        p_limit: PAGE_SIZE,
        p_offset: data.page * PAGE_SIZE,
      });
      if (error) throw new Error(error.message);
      const now = Date.now();
      return {
        rows: (rows ?? []).map((r) => ({
          id: r.id,
          email: r.email,
          displayName: r.display_name,
          plan: r.plan,
          trialEndsAt: r.trial_ends_at,
          xp: r.xp,
          level: r.level,
          streak: r.streak_current,
          lastActiveDay: r.last_active_day,
          createdAt: r.created_at,
          lastSignInAt: r.last_sign_in_at,
          suspended: Boolean(r.banned_until && Date.parse(r.banned_until) > now),
          isAdmin: r.is_admin,
        })),
        total: Number(rows?.[0]?.total ?? 0),
        pageSize: PAGE_SIZE,
      };
    },
  );

export type AdminUserDetail = {
  lessonsCompleted: number;
  recentLessons: { courseId: string; lessonId: string; xp: number; completedAt: string }[];
  submissions: { id: string; projectId: string; status: string; published: boolean }[];
  certificates: { certificateId: string; pathId: string; issuedAt: string }[];
  posts: number;
  mentorMessages: number;
};

export const adminUserDetailFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ userId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }): Promise<AdminUserDetail> => {
    const db = await adminClient(context.userId);
    const id = data.userId;
    const [lessons, recent, submissions, certificates, posts, mentor] = await Promise.all([
      db.from("lesson_progress").select("id", { count: "exact", head: true }).eq("user_id", id),
      db
        .from("lesson_progress")
        .select("course_id, lesson_id, xp_earned, completed_at")
        .eq("user_id", id)
        .order("completed_at", { ascending: false })
        .limit(8),
      db
        .from("project_submissions")
        .select("id, project_id, status, is_published")
        .eq("user_id", id),
      db
        .from("issued_certificates")
        .select("certificate_id, path_id, issued_at")
        .eq("user_id", id)
        .order("issued_at", { ascending: false }),
      db.from("community_posts").select("id", { count: "exact", head: true }).eq("user_id", id),
      db.from("mentor_messages").select("id", { count: "exact", head: true }).eq("user_id", id),
    ]);
    return {
      lessonsCompleted: lessons.count ?? 0,
      recentLessons: (recent.data ?? []).map((r) => ({
        courseId: r.course_id,
        lessonId: r.lesson_id,
        xp: r.xp_earned,
        completedAt: r.completed_at,
      })),
      submissions: (submissions.data ?? []).map((s) => ({
        id: s.id,
        projectId: s.project_id,
        status: s.status,
        published: s.is_published,
      })),
      certificates: (certificates.data ?? []).map((c) => ({
        certificateId: c.certificate_id,
        pathId: c.path_id,
        issuedAt: c.issued_at,
      })),
      posts: posts.count ?? 0,
      mentorMessages: mentor.count ?? 0,
    };
  });

const planSchema = z.object({
  userId: z.string().uuid(),
  plan: z.enum(["free", "pro", "lifetime"]),
});

export const adminSetPlanFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => planSchema.parse(input))
  .handler(async ({ data, context }): Promise<{ plan: PlanId }> => {
    const db = await adminClient(context.userId);
    const { data: before } = await db
      .from("profiles")
      .select("plan")
      .eq("id", data.userId)
      .maybeSingle();
    if (!before) throw new Error("That learner doesn't exist.");
    const { error } = await db
      .from("profiles")
      .update({ plan: data.plan, updated_at: new Date().toISOString() })
      .eq("id", data.userId);
    if (error) throw new Error(error.message);
    await logAction(
      db,
      context.userId,
      "set_plan",
      { type: "user", id: data.userId },
      {
        from: before.plan,
        to: data.plan,
      },
    );
    return { plan: data.plan };
  });

// Supabase has no "suspend": a ban with a century-long duration is the same thing.
const SUSPEND_FOR = "876000h";

export const adminSetSuspendedFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z.object({ userId: z.string().uuid(), suspended: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }): Promise<{ suspended: boolean }> => {
    if (data.userId === context.userId) throw new Error("You can't suspend your own account.");
    const db = await adminClient(context.userId);
    await refuseIfAdmin(db, data.userId);
    const { error } = await db.auth.admin.updateUserById(data.userId, {
      ban_duration: data.suspended ? SUSPEND_FOR : "none",
    });
    if (error) throw new Error(error.message);
    await logAction(db, context.userId, data.suspended ? "suspend_user" : "unsuspend_user", {
      type: "user",
      id: data.userId,
    });
    return { suspended: data.suspended };
  });

export const adminDeleteUserFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ userId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }): Promise<{ deleted: true }> => {
    if (data.userId === context.userId) throw new Error("You can't delete your own account here.");
    const db = await adminClient(context.userId);
    await refuseIfAdmin(db, data.userId);
    const { data: profile } = await db
      .from("profiles")
      .select("display_name, plan")
      .eq("id", data.userId)
      .maybeSingle();

    // Deleting the account wouldn't stop Stripe charging the card behind it.
    const { paymentsProvider } = await import("@/lib/payments.server");
    if (paymentsProvider() === "stripe" && profile && profile.plan !== "free") {
      throw new Error(
        "This learner is on a paid plan. Cancel their subscription in Stripe before deleting the account.",
      );
    }

    const { error } = await db.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    await logAction(
      db,
      context.userId,
      "delete_user",
      { type: "user", id: data.userId },
      {
        display_name: profile?.display_name ?? null,
        plan: profile?.plan ?? null,
      },
    );
    return { deleted: true };
  });

// ——— Moderation ———

export type AdminReport = {
  id: string;
  reason: string;
  status: string;
  createdAt: string;
  reporter: string;
  post: { id: string; title: string; body: string; author: string; authorId: string } | null;
};

export type AdminPost = {
  id: string;
  title: string;
  body: string;
  topic: string;
  likes: number;
  createdAt: string;
  author: string;
  authorId: string;
  openReports: number;
};

export type AdminPublishedProject = {
  id: string;
  projectId: string;
  summary: string;
  liveUrl: string | null;
  repoUrl: string | null;
  author: string;
  authorId: string;
};

export const adminModerationFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z.object({ reportStatus: z.enum(["open", "resolved", "dismissed"]) }).parse(input),
  )
  .handler(
    async ({
      data,
      context,
    }): Promise<{
      reports: AdminReport[];
      posts: AdminPost[];
      projects: AdminPublishedProject[];
    }> => {
      const db = await adminClient(context.userId);
      const [reports, posts, projects, openReports] = await Promise.all([
        db
          .from("community_reports")
          .select("id, post_id, reporter_id, reason, status, created_at")
          .eq("status", data.reportStatus)
          .order("created_at", { ascending: false })
          .limit(100),
        db
          .from("community_posts")
          .select("id, user_id, title, body, topic, likes, created_at")
          .order("created_at", { ascending: false })
          .limit(50),
        db
          .from("project_submissions")
          .select("id, user_id, project_id, public_summary, live_url, repo_url")
          .eq("is_published", true)
          .order("created_at", { ascending: false })
          .limit(50),
        db.from("community_reports").select("post_id").eq("status", "open"),
      ]);
      if (reports.error) throw new Error(reports.error.message);
      if (posts.error) throw new Error(posts.error.message);
      if (projects.error) throw new Error(projects.error.message);

      const reportRows = reports.data ?? [];
      // Reported posts may be older than the recent-posts window, so fetch them too.
      const reportedIds = [...new Set(reportRows.map((r) => r.post_id))];
      const { data: reportedPosts } = reportedIds.length
        ? await db.from("community_posts").select("id, user_id, title, body").in("id", reportedIds)
        : { data: [] };
      const postById = new Map((reportedPosts ?? []).map((p) => [p.id, p]));

      const names = await byIds(db, [
        ...new Set([
          ...reportRows.map((r) => r.reporter_id),
          ...(reportedPosts ?? []).map((p) => p.user_id),
          ...(posts.data ?? []).map((p) => p.user_id),
          ...(projects.data ?? []).map((p) => p.user_id),
        ]),
      ]);
      const name = (id: string) => names.get(id) ?? "Deleted learner";

      const openByPost = new Map<string, number>();
      for (const r of openReports.data ?? [])
        openByPost.set(r.post_id, (openByPost.get(r.post_id) ?? 0) + 1);

      return {
        reports: reportRows.map((r) => {
          const post = postById.get(r.post_id);
          return {
            id: r.id,
            reason: r.reason,
            status: r.status,
            createdAt: r.created_at,
            reporter: name(r.reporter_id),
            post: post
              ? {
                  id: post.id,
                  title: post.title,
                  body: post.body,
                  author: name(post.user_id),
                  authorId: post.user_id,
                }
              : null,
          };
        }),
        posts: (posts.data ?? []).map((p) => ({
          id: p.id,
          title: p.title,
          body: p.body,
          topic: p.topic,
          likes: p.likes,
          createdAt: p.created_at,
          author: name(p.user_id),
          authorId: p.user_id,
          openReports: openByPost.get(p.id) ?? 0,
        })),
        projects: (projects.data ?? []).map((p) => ({
          id: p.id,
          projectId: p.project_id,
          summary: p.public_summary,
          liveUrl: p.live_url,
          repoUrl: p.repo_url,
          author: name(p.user_id),
          authorId: p.user_id,
        })),
      };
    },
  );

export const adminSetReportStatusFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z
      .object({ reportId: z.string().uuid(), status: z.enum(["open", "resolved", "dismissed"]) })
      .parse(input),
  )
  .handler(async ({ data, context }): Promise<{ status: string }> => {
    const db = await adminClient(context.userId);
    const { error } = await db
      .from("community_reports")
      .update({ status: data.status })
      .eq("id", data.reportId);
    if (error) throw new Error(error.message);
    await logAction(
      db,
      context.userId,
      "set_report_status",
      { type: "report", id: data.reportId },
      {
        status: data.status,
      },
    );
    return { status: data.status };
  });

export const adminDeletePostFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ postId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }): Promise<{ deleted: true }> => {
    const db = await adminClient(context.userId);
    const { data: post } = await db
      .from("community_posts")
      .select("user_id, title")
      .eq("id", data.postId)
      .maybeSingle();
    if (!post) throw new Error("That post no longer exists.");
    // Deleting the post cascades its reports and comments away, so the log
    // entry is the only record left of what was removed.
    const { error } = await db.from("community_posts").delete().eq("id", data.postId);
    if (error) throw new Error(error.message);
    await logAction(
      db,
      context.userId,
      "delete_post",
      { type: "post", id: data.postId },
      {
        author_id: post.user_id,
        title: post.title,
      },
    );
    return { deleted: true };
  });

export const adminUnpublishProjectFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ submissionId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }): Promise<{ unpublished: true }> => {
    const db = await adminClient(context.userId);
    const { error } = await db
      .from("project_submissions")
      .update({ is_published: false })
      .eq("id", data.submissionId);
    if (error) throw new Error(error.message);
    await logAction(db, context.userId, "unpublish_project", {
      type: "project_submission",
      id: data.submissionId,
    });
    return { unpublished: true };
  });

// ——— Metrics & content ———

export type AdminMetrics = {
  learners: number;
  onboarded: number;
  active7: number;
  active30: number;
  trialing: number;
  plans: Record<string, number>;
  completions: number;
  certificates: number;
  openReports: number;
  daily: { day: string; signups: number; completions: number; active: number }[];
};

export const adminMetricsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ days: z.number().int().min(7).max(180) }).parse(input))
  .handler(async ({ data, context }): Promise<AdminMetrics> => {
    const db = await adminClient(context.userId);
    const { data: metrics, error } = await db.rpc("admin_metrics", { p_days: data.days });
    if (error) throw new Error(error.message);
    return metrics as AdminMetrics;
  });

export type AdminCourseUsage = Record<string, { completions: number; learners: number }>;

export const adminCourseUsageFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminCourseUsage> => {
    const db = await adminClient(context.userId);
    const { data, error } = await db.rpc("admin_course_usage");
    if (error) throw new Error(error.message);
    return Object.fromEntries(
      (data ?? []).map((r) => [
        r.course_id,
        { completions: Number(r.completions), learners: Number(r.learners) },
      ]),
    );
  });

export type AdminAction = {
  id: string;
  admin: string;
  action: string;
  targetType: string;
  targetId: string;
  detail: Record<string, string | number | boolean | null>;
  createdAt: string;
};

export const adminActionsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminAction[]> => {
    const db = await adminClient(context.userId);
    const { data, error } = await db
      .from("admin_actions")
      .select("id, admin_id, action, target_type, target_id, detail, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    const names = await byIds(db, [
      ...new Set((data ?? []).flatMap((a) => (a.admin_id ? [a.admin_id] : []))),
    ]);
    return (data ?? []).map((a) => ({
      id: a.id,
      admin: a.admin_id ? (names.get(a.admin_id) ?? "Removed admin") : "Removed admin",
      action: a.action,
      targetType: a.target_type,
      targetId: a.target_id,
      detail: (a.detail ?? {}) as AdminAction["detail"],
      createdAt: a.created_at,
    }));
  });
