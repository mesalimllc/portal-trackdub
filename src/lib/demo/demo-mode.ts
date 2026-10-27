import { API_BASE_URL } from "../config";
import {
  createDemoStore,
  handleDemoRequest,
  simulateUpload,
  type DemoStore,
} from "./fixtures";

/**
 * Demo mode: a preview convenience, not an auth bypass in production.
 *
 * When active, every request aimed at the Worker origin is answered from an
 * in-memory fixture store and a fabricated session, so the portal UI can be
 * browsed while api.trackdub.com is down.
 *
 * Activation rules:
 *   - `VITE_DEMO_MODE=1` at build time (explicit, any host), OR
 *   - the `?demo=1` URL flag, but ONLY on localhost / lovable.app previews.
 *     The real portal origin (portal.trackdub.com) can never be flipped into
 *     demo mode, so the guard there is never weakened.
 */

const STORAGE_KEY = "trackdub.demo";
const BUILD_FLAG = import.meta.env.VITE_DEMO_MODE === "1";

let installed = false;
let store: DemoStore | null = null;

function isPreviewHost(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "preview localhost" ||
    host.endsWith("lovable.app")
  );
}

/** True when this environment is allowed to run demo mode at all. */
export function demoAllowed(): boolean {
  return BUILD_FLAG || isPreviewHost();
}

/** True when demo mode is both allowed here and switched on. */
export function isDemoMode(): boolean {
  if (!demoAllowed()) return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

/** Read/apply the `?demo=1` / `?demo=0` flag, then strip it from the URL. */
function syncFlagFromUrl(): void {
  if (typeof window === "undefined" || !demoAllowed()) return;
  const url = new URL(window.location.href);
  const flag = url.searchParams.get("demo");
  if (!flag) return;
  try {
    if (flag === "1") window.localStorage.setItem(STORAGE_KEY, "1");
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage blocked — demo mode stays off */
  }
  url.searchParams.delete("demo");
  window.history.replaceState({}, "", url.toString());
}

/** Turn demo mode on (preview hosts only) and reload into it. */
export function enableDemoMode(): void {
  if (!demoAllowed()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* ignore */
  }
  window.location.reload();
}

/** Turn demo mode off and reload back to the real sign-in flow. */
export function disableDemoMode(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  window.location.reload();
}

/**
 * Patch `fetch` so Worker requests are answered from fixtures.
 * Must run before the router starts resolving guards.
 */
export function installDemoFetch(): void {
  if (typeof window === "undefined" || installed) return;
  syncFlagFromUrl();
  if (!isDemoMode()) return;

  installed = true;
  store = createDemoStore();
  const original = window.fetch.bind(window);

  window.fetch = async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;

    if (!url.startsWith(API_BASE_URL)) {
      return original(input as RequestInfo, init);
    }

    const method = (init?.method ?? "GET").toUpperCase();
    let bodyText: string | null = null;
    if (typeof init?.body === "string") bodyText = init.body;

    await new Promise((resolve) => setTimeout(resolve, 120));
    return handleDemoRequest(store as DemoStore, { url, method, bodyText });
  };
}

/** Upload path uses XHR, so it needs its own demo branch. */
export async function demoUpload(
  file: File,
  onProgress: (value: number) => void,
  signal?: AbortSignal,
) {
  return simulateUpload({ name: file.name, size: file.size }, onProgress, signal);
}
