import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  component: AuthPage,
});

type Mode = "login" | "signup" | "forgot";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<"verify" | "reset" | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: name || email.split("@")[0] },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setSent("verify");
          return;
        }
        toast.success("Welcome to Ascent");
        navigate({ to: "/onboarding" });
      } else if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
        navigate({ to: "/dashboard" });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setSent("reset");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in is unavailable right now");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard" });
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
          <Link to="/" className="flex items-center gap-1.5 text-sm font-semibold text-chalk hover:text-foreground">
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
                <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
              </div>
            </>
          ) : null}

          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" ? (
              <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Rivera" />
              </div>
            ) : null}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
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
              {mode === "signup" ? "Create account" : mode === "login" ? "Sign in" : "Send reset link"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-chalk">
            {mode === "signup" ? (
              <>
                Already have an account?{" "}
                <button className="font-semibold text-brand hover:underline" onClick={() => setMode("login")}>
                  Sign in
                </button>
              </>
            ) : (
              <>
                New to Ascent?{" "}
                <button className="font-semibold text-brand hover:underline" onClick={() => setMode("signup")}>
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
  return <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-12">{children}</div>;
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
