import { z } from "zod";
import { API_BASE_URL } from "@/lib/config";
import { notifyUnauthorized } from "@/lib/auth/ensure-session";
import { demoUpload, isDemoMode } from "@/lib/demo/demo-mode";

const errorEnvelopeSchema = z.object({
  error: z.object({
    code: z.string().optional(),
    message: z.string(),
    requestId: z.string().optional(),
  }),
});

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

export async function apiJson<T>(
  path: string,
  schema: z.ZodType<T>,
  init: RequestInit = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      credentials: "include",
      signal: init.signal ?? AbortSignal.timeout(30_000),
      headers: { Accept: "application/json", ...init.headers },
    });
  } catch (error) {
    throw new ApiRequestError(
      error instanceof DOMException && error.name === "TimeoutError"
        ? "Request timed out. Retry shortly."
        : error instanceof Error
          ? error.message
          : "Network request failed",
      0,
      error instanceof DOMException && error.name === "TimeoutError" ? "TIMEOUT" : "NETWORK_ERROR",
    );
  }

  const raw: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) notifyUnauthorized();
    const parsed = errorEnvelopeSchema.safeParse(raw);
    throw new ApiRequestError(
      parsed.success ? parsed.data.error.message : `Request failed (${response.status})`,
      response.status,
      parsed.success ? parsed.data.error.code : undefined,
    );
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new ApiRequestError("API returned an invalid response", 502, "INVALID_RESPONSE");
  }
  return parsed.data;
}

export const jobStatusSchema = z.enum(["Queued", "Running", "Completed", "Failed", "Cancelled"]);

export const dubJobSchema = z.object({
  id: z.string().min(1),
  jobId: z.string().optional(),
  projectName: z.string(),
  sourceLanguage: z.string(),
  targetLanguage: z.string(),
  status: jobStatusSchema,
  progressPercent: z.number().min(0).max(100).nullable(),
  currentStage: z.string().nullable(),
  errorMessage: z.string().nullable(),
  durationSeconds: z.number().nonnegative().nullable(),
  createdAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
});

export const jobsListSchema = z.object({
  items: z.array(dubJobSchema),
  totalCount: z.number().int().nonnegative(),
});

export const languagesSchema = z.object({
  items: z.array(z.object({ code: z.string().min(2), name: z.string().min(1) })).min(1),
});

export const capabilitiesSchema = z.object({
  status: z.string().optional(),
  capabilities: z
    .object({
      jobIntake: z.boolean().default(true),
      upload: z.boolean().default(true),
      jobProcessing: z.boolean().default(true),
      outputDownload: z.boolean().default(true),
    })
    .default({ jobIntake: true, upload: true, jobProcessing: true, outputDownload: true }),
});

export const uploadResponseSchema = z.object({
  filePath: z.string().min(1),
  fileName: z.string().min(1),
  fileSize: z.number().positive(),
});

export async function apiUpload(
  file: File,
  onProgress: (value: number) => void,
  setRequest: (xhr: XMLHttpRequest | null) => void,
  signal?: AbortSignal,
) {
  if (signal?.aborted) throw new DOMException("Upload aborted", "AbortError");
  if (isDemoMode()) return demoUpload(file, onProgress, signal);
  const form = new FormData();
  form.append("file", file);
  return new Promise<z.infer<typeof uploadResponseSchema>>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    setRequest(xhr);
    const abort = () => xhr.abort();
    signal?.addEventListener("abort", abort, { once: true });
    xhr.timeout = 15 * 60 * 1000;
    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    });
    xhr.addEventListener("load", () => {
      signal?.removeEventListener("abort", abort);
      setRequest(null);
      if (xhr.status < 200 || xhr.status >= 300) {
        let message = `Upload failed (${xhr.status})`;
        let errorBody: unknown = null;
        try {
          errorBody = JSON.parse(xhr.responseText || "null");
        } catch {
          /* fall back to status */
        }
        const parsedError = errorEnvelopeSchema.safeParse(errorBody);
        if (parsedError.success) message = parsedError.data.error.message;
        if (xhr.status === 401 || xhr.status === 403) notifyUnauthorized();
        reject(new ApiRequestError(message, xhr.status));
        return;
      }
      let raw: unknown;
      try {
        raw = JSON.parse(xhr.responseText);
      } catch {
        reject(new ApiRequestError("Upload returned invalid JSON", 502, "INVALID_RESPONSE"));
        return;
      }
      const parsed = uploadResponseSchema.safeParse(raw);
      if (!parsed.success) {
        reject(new ApiRequestError("Upload returned an invalid response", 502, "INVALID_RESPONSE"));
        return;
      }
      resolve(parsed.data);
    });
    xhr.addEventListener("error", () => {
      setRequest(null);
      reject(new ApiRequestError("Network error during upload", 0, "NETWORK_ERROR"));
    });
    xhr.addEventListener("timeout", () => {
      setRequest(null);
      reject(new ApiRequestError("Upload timed out. Retry upload.", 408, "TIMEOUT"));
    });
    xhr.addEventListener("abort", () => {
      setRequest(null);
      reject(new DOMException("Upload aborted", "AbortError"));
    });
    xhr.open("POST", `${API_BASE_URL}/api/dubs/upload`);
    xhr.withCredentials = true;
    xhr.send(form);
  });
}

export function filenameFromDisposition(value: string | null, fallback: string): string {
  if (!value) return fallback;
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(value)?.[1];
  if (encoded) {
    try {
      return decodeURIComponent(encoded);
    } catch {
      return fallback;
    }
  }
  const filename = /filename="?([^";]+)"?/i.exec(value)?.[1];
  if (!filename) return fallback;
  return [...filename]
    .map((character) => {
      const code = character.charCodeAt(0);
      return character === "/" || character === "\\" || code < 32 || code === 127 ? "_" : character;
    })
    .join("");
}
