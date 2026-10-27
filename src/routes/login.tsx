import { createFileRoute, redirect, useNavigate, useRouter } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";

import { authService, useAuth } from "../lib/auth";
import { demoAllowed, disableDemoMode, enableDemoMode, isDemoMode } from "../lib/demo/demo-mode";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";

const searchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/login")({
  ssr: false,
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in — Trackdub Portal" },
      { name: "description", content: "Sign in to the Trackdub admin portal." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  beforeLoad: async ({ context, search }) => {
    let session = null;
    try {
      session = await context.auth.ensureSession();
    } catch {
      /* Let login render; transient errors appear inline. */
    }
    if (session?.user) {
      throw redirect({ to: (search.redirect as never) ?? "/dashboard" });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const search = Route.useSearch();
  const { setLocalSession, status: authStatus, error: sessionError, refresh } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const res = await authService.signIn({ email: email.trim(), password });
    if (!res.ok) {
      setSubmitting(false);
      setError(
        res.status === 401 || res.status === 400
          ? "Invalid email or password."
          : res.message || "Sign in failed. Please try again.",
      );
      return;
    }

    // Force a session re-read so the context reflects the new cookie.
    const { authService: svc } = await import("../lib/auth/auth-service");
    const { invalidateSession, setSession } = await import("../lib/auth/ensure-session");
    invalidateSession();
    const session = await svc.getSession();
    setSession(session);
    setLocalSession(session);

    await router.invalidate();
    const target = (search.redirect as string | undefined) ?? "/dashboard";
    navigate({ to: target as never, replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Sign in</CardTitle>
          <CardDescription>Trackdub admin portal</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <a
                  href="/forgot-password"
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Forgot?
                </a>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
              />
            </div>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            {authStatus === "unavailable" && (
              <p role="alert" className="text-sm text-destructive">
                {sessionError?.message ?? "Session service unavailable."}{" "}
                <button type="button" className="underline" onClick={() => void refresh()}>
                  Retry
                </button>
              </p>
            )}
            {demoAllowed() && !isDemoMode() && (
              <p className="text-xs text-muted-foreground">
                The sign-in service is unreachable right now.{" "}
                <button type="button" className="underline" onClick={() => enableDemoMode()}>
                  Browse with demo data
                </button>
              </p>
            )}
            {isDemoMode() && (
              <p className="text-xs text-muted-foreground">
                Demo data is on.{" "}
                <button type="button" className="underline" onClick={() => disableDemoMode()}>
                  Turn it off
                </button>
              </p>
            )}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
