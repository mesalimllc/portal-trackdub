import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { ensureSession, invalidateSession } from "./lib/auth/ensure-session";
import { installDemoFetch } from "./lib/demo/demo-mode";

// Preview-only demo mode must patch fetch before any route guard runs.
installDemoFetch();

/**
 * Router context exposed to `beforeLoad` and components.
 *
 * `auth.ensureSession()` is awaitable and memoized — route guards MUST
 * await it before deciding whether to redirect. The Worker remains the
 * true authorization boundary; guards are only for portal UX.
 */
export type RouterAuthContext = {
  ensureSession: typeof ensureSession;
  invalidateSession: typeof invalidateSession;
};

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: {
      queryClient,
      auth: {
        ensureSession,
        invalidateSession,
      } satisfies RouterAuthContext,
    },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
