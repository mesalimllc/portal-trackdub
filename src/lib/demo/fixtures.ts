/**
 * In-memory fixture store for demo mode.
 *
 * Demo mode fabricates a session and serves fixture data so the portal UI
 * can be browsed while the real Worker (api.trackdub.com) is unavailable.
 * It is never active on the production origin — see demo-mode.ts for the
 * host gate. Nothing here touches the network.
 */

const NOW = Date.now();
const iso = (minutesAgo: number): string =>
  new Date(NOW - minutesAgo * 60_000).toISOString();

export type DemoJobStatus = "Queued" | "Running" | "Completed" | "Failed" | "Cancelled";

export interface DemoJob {
  id: string;
  projectName: string;
  sourceLanguage: string;
  targetLanguage: string;
  status: DemoJobStatus;
  progressPercent: number | null;
  currentStage: string | null;
  errorMessage: string | null;
  durationSeconds: number | null;
  createdAt: string;
  completedAt: string | null;
}

export interface DemoWebhook {
  id: string;
  tenantId: string;
  url: string;
  eventTypes: string[];
  secret: string;
  enabled: boolean;
  createdAt: string;
}

export interface DemoDelivery {
  id: string;
  eventType: string;
  eventId: string;
  attempts: number;
  httpStatus: number;
  errorMessage: string | null;
  firstAttemptAt: string;
  lastAttemptAt: string | null;
  nextRetryAt: string | null;
  delivered: boolean;
}

export interface DemoApiKey {
  id: string;
  name: string;
  prefix: string | null;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
}

export interface DemoStore {
  signedIn: boolean;
  user: { id: string; email: string; name: string; emailVerified: boolean };
  jobs: DemoJob[];
  webhooks: DemoWebhook[];
  deliveries: DemoDelivery[];
  keys: DemoApiKey[];
  languages: { code: string; name: string }[];
  usage: {
    accumulatedSeconds: number;
    includedSeconds: number;
    percentageConsumed: number;
    tierName: string;
  };
  subscription: {
    tier: string;
    status: string;
    paymentStatus: string;
    gracePeriodActive: boolean;
    periodStart: string;
    periodEnd: string;
  };
  invoices: {
    invoiceId: string;
    amountCents: number;
    status: string;
    periodStart: string;
    periodEnd: string;
    hostedInvoiceUrl: string | null;
  }[];
}

const STAGES = ["Transcribing", "Aligning", "Synthesizing", "Mixing"];

/** Creates the fixture store and starts a light progress simulation. */
export function createDemoStore(): DemoStore {
  const store: DemoStore = {
    signedIn: true,
    user: {
      id: "demo-user-1",
      email: "demo@trackdub.com",
      name: "Demo User",
      emailVerified: true,
    },
    jobs: [
      {
        id: "dub_1001",
        projectName: "Q4 Launch Video",
        sourceLanguage: "en",
        targetLanguage: "es",
        status: "Completed",
        progressPercent: 100,
        currentStage: "Done",
        errorMessage: null,
        durationSeconds: 412,
        createdAt: iso(180),
        completedAt: iso(173),
      },
      {
        id: "dub_1002",
        projectName: "Product Tour — German Market",
        sourceLanguage: "en",
        targetLanguage: "de",
        status: "Running",
        progressPercent: 34,
        currentStage: STAGES[1],
        errorMessage: null,
        durationSeconds: null,
        createdAt: iso(12),
        completedAt: null,
      },
      {
        id: "dub_1003",
        projectName: "Support FAQ (French)",
        sourceLanguage: "en",
        targetLanguage: "fr",
        status: "Completed",
        progressPercent: 100,
        currentStage: "Done",
        errorMessage: null,
        durationSeconds: 268,
        createdAt: iso(1440),
        completedAt: iso(1435),
      },
      {
        id: "dub_1004",
        projectName: "Onboarding Clip (Japanese)",
        sourceLanguage: "en",
        targetLanguage: "ja",
        status: "Failed",
        progressPercent: 61,
        currentStage: "Synthesizing",
        errorMessage: "Voice model unavailable for the requested speaker.",
        durationSeconds: 96,
        createdAt: iso(2880),
        completedAt: iso(2878),
      },
      {
        id: "dub_1005",
        projectName: "Webinar Recap (Portuguese)",
        sourceLanguage: "en",
        targetLanguage: "pt",
        status: "Cancelled",
        progressPercent: 8,
        currentStage: "Transcribing",
        errorMessage: null,
        durationSeconds: 22,
        createdAt: iso(4320),
        completedAt: iso(4319),
      },
      {
        id: "dub_1006",
        projectName: "Ad Cutdown (Italian)",
        sourceLanguage: "en",
        targetLanguage: "it",
        status: "Completed",
        progressPercent: 100,
        currentStage: "Done",
        errorMessage: null,
        durationSeconds: 154,
        createdAt: iso(10080),
        completedAt: iso(10077),
      },
    ],
    webhooks: [
      {
        id: "wh_1",
        tenantId: "tenant_demo",
        url: "https://hooks.trackdub.com/dubbing",
        eventTypes: ["job.completed", "job.failed"],
        secret: "whsec_demo_9f2c41",
        enabled: true,
        createdAt: iso(20160),
      },
      {
        id: "wh_2",
        tenantId: "tenant_demo",
        url: "https://example.com/trackdub/status",
        eventTypes: ["job.completed"],
        secret: "whsec_demo_5b7e08",
        enabled: false,
        createdAt: iso(8640),
      },
    ],
    deliveries: [
      {
        id: "dl_1",
        eventType: "job.completed",
        eventId: "evt_1001",
        attempts: 1,
        httpStatus: 200,
        errorMessage: null,
        firstAttemptAt: iso(173),
        lastAttemptAt: iso(173),
        nextRetryAt: null,
        delivered: true,
      },
      {
        id: "dl_2",
        eventType: "job.failed",
        eventId: "evt_1004",
        attempts: 3,
        httpStatus: 503,
        errorMessage: "Upstream endpoint returned 503",
        firstAttemptAt: iso(2878),
        lastAttemptAt: iso(2870),
        nextRetryAt: null,
        delivered: false,
      },
      {
        id: "dl_3",
        eventType: "job.completed",
        eventId: "evt_1003",
        attempts: 2,
        httpStatus: 200,
        errorMessage: "First attempt timed out",
        firstAttemptAt: iso(1435),
        lastAttemptAt: iso(1434),
        nextRetryAt: null,
        delivered: true,
      },
    ],
    keys: [
      {
        id: "key_1",
        name: "Production server",
        prefix: "td_live_9f2c",
        createdAt: iso(43200),
        lastUsedAt: iso(35),
        revokedAt: null,
      },
      {
        id: "key_2",
        name: "Staging",
        prefix: "td_test_5b7e",
        createdAt: iso(20160),
        lastUsedAt: iso(2880),
        revokedAt: null,
      },
    ],
    languages: [
      { code: "en", name: "English" },
      { code: "es", name: "Spanish" },
      { code: "fr", name: "French" },
      { code: "de", name: "German" },
      { code: "pt", name: "Portuguese" },
      { code: "it", name: "Italian" },
      { code: "nl", name: "Dutch" },
      { code: "pl", name: "Polish" },
      { code: "tr", name: "Turkish" },
      { code: "ja", name: "Japanese" },
      { code: "ko", name: "Korean" },
      { code: "zh", name: "Chinese" },
      { code: "hi", name: "Hindi" },
      { code: "ar", name: "Arabic" },
    ],
    usage: {
      accumulatedSeconds: 41_400,
      includedSeconds: 108_000,
      percentageConsumed: 38,
      tierName: "Pro",
    },
    subscription: {
      tier: "pro",
      status: "active",
      paymentStatus: "paid",
      gracePeriodActive: false,
      periodStart: iso(4320),
      periodEnd: iso(-25200),
    },
    invoices: [
      {
        invoiceId: "in_demo_3",
        amountCents: 24900,
        status: "open",
        periodStart: iso(4320),
        periodEnd: iso(-25200),
        hostedInvoiceUrl: null,
      },
      {
        invoiceId: "in_demo_2",
        amountCents: 24900,
        status: "paid",
        periodStart: iso(32400),
        periodEnd: iso(4320),
        hostedInvoiceUrl: null,
      },
      {
        invoiceId: "in_demo_1",
        amountCents: 24900,
        status: "paid",
        periodStart: iso(60480),
        periodEnd: iso(32400),
        hostedInvoiceUrl: null,
      },
    ],
  };

  // Advance running jobs so the dashboard looks alive while browsing.
  const timer = setInterval(() => {
    for (const job of store.jobs) {
      if (job.status === "Queued") {
        job.status = "Running";
        job.currentStage = STAGES[0];
        job.progressPercent = 2;
        continue;
      }
      if (job.status !== "Running") continue;
      const next = Math.min(100, (job.progressPercent ?? 0) + 7);
      job.progressPercent = next;
      job.currentStage = STAGES[Math.min(STAGES.length - 1, Math.floor(next / 26))];
      if (next >= 100) {
        job.status = "Completed";
        job.currentStage = "Done";
        job.completedAt = new Date().toISOString();
        job.durationSeconds = Math.round((Date.now() - Date.parse(job.createdAt)) / 1000);
        store.usage.accumulatedSeconds += 300;
        store.usage.percentageConsumed = Math.min(
          100,
          Math.round(
            (store.usage.accumulatedSeconds / store.usage.includedSeconds) * 100,
          ),
        );
      }
    }
  }, 4000);

  return store;
}

const json = (data: unknown, status = 200): Response =>
  new Response(status === 204 ? null : JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });

const notFound = (message: string): Response =>
  json({ error: { code: "NOT_FOUND", message } }, 404);

/** Serves a fixture response for any request aimed at the Worker origin. */
export function handleDemoRequest(
  store: DemoStore,
  request: { url: string; method: string; bodyText: string | null },
): Response {
  const parsed = new URL(request.url, "http://demo.local");
  const path = (parsed.pathname.replace(/\/+$/, "") || "/").toLowerCase();
  const method = request.method.toUpperCase();
  const body = (): Record<string, unknown> => {
    try {
      return request.bodyText ? (JSON.parse(request.bodyText) as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  };

  // ── Auth ────────────────────────────────────────────────────────────────
  if (path === "/api/auth/session") {
    return store.signedIn
      ? json({ user: store.user, expiresAt: iso(-43_200) })
      : json(null);
  }
  if (path === "/api/auth/sign-in/email" && method === "POST") {
    const input = body();
    const email = typeof input.email === "string" && input.email.trim() ? input.email.trim() : store.user.email;
    store.user = { ...store.user, email };
    store.signedIn = true;
    return json({ user: store.user });
  }
  if (path === "/api/auth/sign-out" && method === "POST") {
    store.signedIn = false;
    return json({ ok: true });
  }
  if (path === "/api/auth/forget-password" && method === "POST") {
    return json({ ok: true });
  }
  if (path === "/api/auth/reset-password" && method === "POST") {
    return json({ ok: true });
  }

  // ── Health / capabilities ───────────────────────────────────────────────
  if (path === "/api/health") {
    return json({
      status: "ok",
      capabilities: {
        jobIntake: true,
        upload: true,
        jobProcessing: true,
        outputDownload: true,
      },
    });
  }

  // ── Languages ───────────────────────────────────────────────────────────
  if (path === "/api/languages") {
    return json({ items: store.languages });
  }

  // ── Jobs ────────────────────────────────────────────────────────────────
  if (path === "/api/dubs" && method === "GET") {
    const status = parsed.searchParams.get("status");
    const items = status ? store.jobs.filter((job) => job.status === status) : store.jobs;
    return json({ items, totalCount: items.length });
  }
  const jobMatch = /^\/api\/dubs\/([^/]+)$/.exec(path);
  if (jobMatch) {
    const job = store.jobs.find((candidate) => candidate.id === jobMatch[1]);
    if (!job) return notFound("Job not found.");
    if (method === "DELETE") {
      if (job.status === "Queued" || job.status === "Running") {
        job.status = "Cancelled";
        job.completedAt = new Date().toISOString();
        job.durationSeconds = Math.round(
          (Date.now() - Date.parse(job.createdAt)) / 1000,
        );
      }
      return new Response(null, { status: 204 });
    }
    return json(job);
  }
  if (method === "POST" && path.startsWith("/api/dubs")) {
    const input = body();
    const job: DemoJob = {
      id: `dub_${Math.floor(Math.random() * 9000 + 1000)}`,
      projectName: String(input.projectName ?? "Untitled project"),
      sourceLanguage: String(input.sourceLanguage ?? "en"),
      targetLanguage: String(input.targetLanguage ?? "es"),
      status: "Queued",
      progressPercent: 0,
      currentStage: "Queued",
      errorMessage: null,
      durationSeconds: null,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };
    store.jobs.unshift(job);
    return json(job, 201);
  }

  // ── Billing ─────────────────────────────────────────────────────────────
  if (path === "/api/billing/subscriptions") {
    if (method === "DELETE") {
      store.subscription = { ...store.subscription, status: "cancelled" };
      return json({ ok: true });
    }
    return json(store.subscription);
  }
  if (path === "/api/billing/usage") {
    return json(store.usage);
  }
  if (path === "/api/billing/invoices") {
    return json({ items: store.invoices, hasMore: false });
  }

  // ── Webhooks ────────────────────────────────────────────────────────────
  if (path === "/api/webhooks") {
    if (method === "POST") {
      const input = body();
      const webhook: DemoWebhook = {
        id: `wh_${Math.floor(Math.random() * 900 + 100)}`,
        tenantId: "tenant_demo",
        url: String(input.url ?? "https://example.com/hook"),
        eventTypes: Array.isArray(input.eventTypes) ? (input.eventTypes as string[]) : [],
        secret: `whsec_demo_${Math.random().toString(36).slice(2, 8)}`,
        enabled: true,
        createdAt: new Date().toISOString(),
      };
      store.webhooks.push(webhook);
      return json(webhook, 201);
    }
    return json(store.webhooks);
  }
  const deliveryMatch = /^\/api\/webhooks\/([^/]+)\/deliveries$/.exec(path);
  if (deliveryMatch) {
    return json({ items: store.deliveries, nextCursor: null });
  }
  const webhookMatch = /^\/api\/webhooks\/([^/]+)$/.exec(path);
  if (webhookMatch) {
    const webhook = store.webhooks.find((candidate) => candidate.id === webhookMatch[1]);
    if (!webhook) return notFound("Webhook not found.");
    if (method === "DELETE") {
      store.webhooks = store.webhooks.filter((candidate) => candidate.id !== webhook.id);
      return new Response(null, { status: 204 });
    }
    if (method === "PUT" || method === "PATCH") {
      const input = body();
      if (typeof input.url === "string") webhook.url = input.url;
      if (Array.isArray(input.eventTypes)) webhook.eventTypes = input.eventTypes as string[];
      if (typeof input.enabled === "boolean") webhook.enabled = input.enabled;
      return json(webhook);
    }
    return json(webhook);
  }

  // ── API keys ────────────────────────────────────────────────────────────
  if (path === "/api/keys") {
    if (method === "POST") {
      const input = body();
      const plaintext = `td_live_${Math.random().toString(36).slice(2, 12)}`;
      const key: DemoApiKey = {
        id: `key_${Math.floor(Math.random() * 900 + 100)}`,
        name: String(input.name ?? "Untitled key"),
        prefix: plaintext.slice(0, 12),
        createdAt: new Date().toISOString(),
        lastUsedAt: null,
        revokedAt: null,
      };
      store.keys.push(key);
      return json({ key, plaintext }, 201);
    }
    return json({ items: store.keys });
  }
  const keyMatch = /^\/api\/keys\/([^/]+)$/.exec(path);
  if (keyMatch) {
    const key = store.keys.find((candidate) => candidate.id === keyMatch[1]);
    if (!key) return notFound("API key not found.");
    key.revokedAt = new Date().toISOString();
    return new Response(null, { status: 204 });
  }

  return notFound(`No demo handler for ${method} ${path}`);
}

/** Simulates the upload XHR so the Create Job flow works without a backend. */
export function simulateUpload(
  file: { name: string; size: number },
  onProgress: (value: number) => void,
  signal?: AbortSignal,
): Promise<{ filePath: string; fileName: string; fileSize: number }> {
  return new Promise((resolve, reject) => {
    let percent = 0;
    const timer = setInterval(() => {
      percent = Math.min(100, percent + 12);
      onProgress(percent);
      if (percent >= 100) {
        clearInterval(timer);
        resolve({
          filePath: `demo/uploads/${Date.now()}-${file.name}`,
          fileName: file.name,
          fileSize: file.size,
        });
      }
    }, 120);
    signal?.addEventListener("abort", () => {
      clearInterval(timer);
      reject(new DOMException("Upload aborted", "AbortError"));
    });
  });
}
