import { Outlet, useNavigate } from "@/lib/router-compat";
import { useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "./Sidebar";
import { authService, invalidateSession, useAuth } from "@/lib/auth";
import { disableDemoMode, isDemoMode } from "@/lib/demo/demo-mode";

export function AppLayout() {
  const { user, setLocalSession, status, error, refresh } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const navigate = useNavigate();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await authService.signOut();
    invalidateSession();
    setLocalSession(null);
    await router.invalidate();
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#f5f3ee" }}>
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <header
          className="flex h-12 items-center justify-end px-6"
          style={{ borderBottom: "1px solid #e0dbd2", background: "#f5f3ee" }}
        >
          <div className="flex items-center gap-3">
            <span className="text-xs" style={{ color: "#8a8a82" }}>
              {user?.email ?? ""}
            </span>
            <button
              onClick={signOut}
              className="px-2.5 py-1 text-xs transition-colors"
              style={{
                border: "1px solid #d0cab8",
                color: "#6b6b5e",
                background: "transparent",
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.background = "#ede9e2";
                (e.target as HTMLElement).style.color = "#1c1c1a";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.background = "transparent";
                (e.target as HTMLElement).style.color = "#6b6b5e";
              }}
            >
              Sign out
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-7">
          {status === "unavailable" && (
            <div
              role="alert"
              className="mb-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"
            >
              Session service unavailable. {error?.message ?? "Retry before continuing."}
              <button className="ml-2 underline" onClick={() => void refresh()}>
                Retry
              </button>
            </div>
          )}
          {isDemoMode() && (
            <div
              role="status"
              className="mb-4 rounded-md border border-sky-300 bg-sky-50 p-3 text-sm text-sky-900"
            >
              You're viewing demo data — the sign-in service is bypassed and every job,
              invoice and key below is a sample.
              <button className="ml-2 underline" onClick={() => disableDemoMode()}>
                Turn off demo
              </button>
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
