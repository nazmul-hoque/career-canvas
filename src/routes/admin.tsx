import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { AuthLink } from "@/components/common/AuthLink";
import { EmptyState } from "@/components/common/StatPill";
import { AppShell } from "@/components/layout/AppShell";
import { AdminContent } from "@/components/admin/AdminContent";
import { AdminLog } from "@/components/admin/AdminLog";
import { AdminMetrics } from "@/components/admin/AdminMetrics";
import { AdminModeration } from "@/components/admin/AdminModeration";
import { AdminUsers } from "@/components/admin/AdminUsers";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSession } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useAdmin";

/**
 * Admin console. Who counts as an admin is a row in `admin_users`; this page
 * only decides what to render — every read and write behind it goes through
 * src/lib/admin.functions.ts, which checks that row again on the server.
 */
export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Ascent" },
      { name: "description", content: "Manage learners, moderate the community and track usage." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Admin — Ascent" },
      { property: "og:description", content: "Ascent's admin console." },
    ],
  }),
  component: Admin,
});

function Admin() {
  const { user, isLoading: sessionLoading } = useSession();
  const { isAdmin, isLoading } = useIsAdmin();

  if (sessionLoading || (user && isLoading)) {
    return (
      <AppShell>
        <Skeleton className="h-96 w-full" />
      </AppShell>
    );
  }

  if (!user || !isAdmin) {
    return (
      <AppShell>
        <EmptyState
          icon={<ShieldCheck className="size-6" />}
          title="Admins only"
          description={
            user
              ? "Your account doesn't have admin access."
              : "Sign in with an admin account to open the console."
          }
          action={
            user ? null : (
              <Button asChild>
                <AuthLink mode="login">Log in</AuthLink>
              </Button>
            )
          }
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-6">
        <p className="eyebrow">Admin</p>
        <h1 className="font-display text-3xl font-bold">Console</h1>
      </div>
      <Tabs defaultValue="users" className="space-y-6">
        <div className="-mx-4 overflow-x-auto px-4">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="moderation">Moderation</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="log">Log</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="users">
          <AdminUsers />
        </TabsContent>
        <TabsContent value="moderation">
          <AdminModeration />
        </TabsContent>
        <TabsContent value="metrics">
          <AdminMetrics />
        </TabsContent>
        <TabsContent value="content">
          <AdminContent />
        </TabsContent>
        <TabsContent value="log">
          <AdminLog />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
