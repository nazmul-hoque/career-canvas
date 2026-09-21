import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { track } from "@/lib/analytics";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isAuthCallback, safeReturnTo } from "@/lib/auth-navigation";
import { useSession } from "@/hooks/useAuth";
import { Wordmark } from "@/components/layout/AppShell";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in or create your account — Ascent" },
      {
        name: "description",
        content:
          "Create a free Ascent account to follow a tech career roadmap, practise with real challenges and track your progress.",
      },
      { property: "og:title", content: "Sign in or create your account — Ascent" },
      {
        property: "og:description",
        content: "Join Ascent and start building job-ready tech skills by doing, not watching.",
      },
    ],
  }),
  validateSearch: (
    search: Record<string, unknown>,
  ): { mode?: Mode; returnTo?: string; complete?: boolean } => ({
    mode: search["mode"] === "signup" ? "signup" : search["mode"] === "forgot" ? "forgot" : "login",
    returnTo: safeReturnTo(search["returnTo"]),
    complete: isAuthCallback(search["complete"]),
  }),
  component: AuthPage,
});

type Mode = "login" | "signup" | "forgot";

function AuthPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const mode = search.mode ?? "login";
  const returnTo = safeReturnTo(search.returnTo);
  const { user } = useSession();
  const [authError, setAuthError] = useState<string | null>(null);
  const [resendSeconds, setResendSeconds] = useState(0);
  function setMode(next: Mode) {
    void navigate({ to: "/auth", search: { mode: next, returnTo }, replace: true });
  }
  const callbackUrl = () =>
    `${window.location.origin}/auth?complete=true&returnTo=${encodeURIComponent(returnTo)}`;
  async function finishLogin(id: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("onboarded")
      .eq("id", id)
      .single();
    if (error)
      throw new Error("You're signed in, but we couldn't load your profile. Try continuing again.");
    if (!data.onboarded) await navigate({ to: "/onboarding", search: { returnTo } });
    else await navigate({ href: returnTo });
  }
  useEffect(() => {
    if (!search.complete || !user) return;
    void finishLogin(user.id).catch((error: Error) => setAuthError(error.message));
    // Keyed on the account, not the objects: `finishLogin` is rebuilt every
    // render and `user` is a fresh object on each auth refresh, so depending on
    // either would re-run the redirect on a learner who is already on their way.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.complete, user?.id]);
  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = window.setTimeout(() => setResendSeconds((n) => n - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendSeconds]);
  async function resend() {
    setBusy(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: callbackUrl() },
      });
      if (error) throw error;
      setResendSeconds(60);
      toast.success("Confirmation email sent");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't resend the email.");
    } finally {
      setBusy(false);
    }
  }
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<"verify" | "reset" | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setAuthError(null);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: callbackUrl(),
            data: { display_name: name || email.split("@")[0] },
          },
        });
        if (error) throw error;
        if (!data.session) {
          track("signed_up", { method: "email", verification_required: true });
          setSent("verify");
          setResendSeconds(60);
          return;
        }
        track("signed_up", { method: "email", verification_required: false });
        toast.success("Welcome to Ascent");
        navigate({ to: "/onboarding", search: { returnTo } });
      } else if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        track("signed_in", { method: "email" });
        toast.success("Welcome back");
        await finishLogin(data.user.id);
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setSent("reset");
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    // Leaves the page for Google and comes back to /auth?complete=true, where
    // the client picks the session out of the URL hash and `finishLogin` sends
    // the learner on. That callback URL must be in the project's allowed
    // redirect list, or Supabase falls back to the Site URL.
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl() },
    });
    if (error) toast.error("Google sign-in is unavailable right now");
  }

  if (sent) {
    return (
      <Centered>
        <div className="card-surface w-full max-w-md p-8 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand/10 text-brand">
            <Mail className="size-5" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold">Check your inbox</h1>
          <p className="mt-2 text-sm text-chalk">
            {sent === "verify"
              ? `We sent a confirmation link to ${email}. Click it to activate your account, then come back here to sign in.`
              : `We sent a password reset link to ${email}. The link opens a page where you can choose a new password.`}
          </p>
          {sent === "verify" ? (
            <div className="mt-5 space-y-2">
              <Button className="w-full" onClick={resend} disabled={busy || resendSeconds > 0}>
                {resendSeconds > 0 ? `Resend in ${resendSeconds}s` : "Resend confirmation"}
              </Button>
              <Button
                className="w-full"
                variant="ghost"
                onClick={() => {
                  setSent(null);
                  setMode("signup");
                  setPassword("");
                }}
              >
                Use a different email
              </Button>
            </div>
          ) : null}
          <Button
            variant="outline"
            className="mt-6 w-full"
            onClick={() => {
              setSent(null);
              setMode("login");
            }}
          >
            Back to sign in
          </Button>
        </div>
      </Centered>
    );
  }

  return (
    <Centered>
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <Wordmark />
          <Link
            to="/"
            className="flex items-center gap-1.5 text-sm font-semibold text-chalk hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Home
          </Link>
        </div>

        <div className="card-surface p-8">
          <h1 className="font-display text-2xl font-bold">
            {mode === "signup"
              ? "Create your account"
              : mode === "login"
                ? "Welcome back"
                : "Reset your password"}
          </h1>
          <p className="mt-1.5 text-sm text-chalk">
            {mode === "signup"
              ? "Free forever on the starter plan. No card needed."
              : mode === "login"
                ? "Pick up exactly where your streak left off."
                : "We'll email you a link to choose a new one."}
          </p>

          {mode !== "forgot" ? (
            <>
              <Button variant="outline" className="mt-6 w-full" onClick={google} type="button">
                <GoogleMark /> Continue with Google
              </Button>
              <div className="my-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-widest text-chalk">
                <span className="h-px flex-1 bg-border" /> or{" "}
                <span className="h-px flex-1 bg-border" />
              </div>
            </>
          ) : null}

          {authError ? (
            <div role="alert" className="my-4 rounded-lg bg-destructive/10 p-3 text-sm">
              {authError}
              {user ? (
                <Button
                  type="button"
                  variant="outline"
                  className="mt-2"
                  onClick={() => {
                    setAuthError(null);
                    void finishLogin(user.id).catch((e: Error) => setAuthError(e.message));
                  }}
                >
                  Continue to your account
                </Button>
              ) : null}
            </div>
          ) : null}
          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" ? (
              <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Rivera"
                />
              </div>
            ) : null}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                autoComplete="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            {mode !== "forgot" ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {mode === "login" ? (
                    <button
                      type="button"
                      className="text-xs font-semibold text-brand hover:underline"
                      onClick={() => setMode("forgot")}
                    >
                      Forgot password?
                    </button>
                  ) : null}
                </div>
                <Input
                  id="password"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                />
              </div>
            ) : null}

            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : null}
              {mode === "signup"
                ? "Create account"
                : mode === "login"
                  ? "Sign in"
                  : "Send reset link"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-chalk">
            {mode === "signup" ? (
              <>
                Already have an account?{" "}
                <button
                  className="font-semibold text-brand hover:underline"
                  onClick={() => setMode("login")}
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                New to Ascent?{" "}
                <button
                  className="font-semibold text-brand hover:underline"
                  onClick={() => setMode("signup")}
                >
                  Create a free account
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </Centered>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-12">
      {children}
    </div>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.9Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24Z"
      />
      <path fill="#FBBC05" d="M5.4 14.4a7.2 7.2 0 0 1 0-4.6V6.7H1.4a12 12 0 0 0 0 10.8l4-3.1Z" />
      <path
        fill="#EA4335"
        d="M12 4.8c1.8 0 3.3.6 4.5 1.8l3.4-3.4C17.9 1.2 15.2 0 12 0A12 12 0 0 0 1.4 6.7l4 3.1C6.3 6.9 8.9 4.8 12 4.8Z"
      />
    </svg>
  );
}
