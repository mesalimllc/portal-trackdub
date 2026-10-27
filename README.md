# Trackdub Portal

**portal.trackdub.com** — client-rendered React/TanStack Start SPA for the Trackdub admin portal.

## Architecture

```
portal.trackdub.com          api.trackdub.com
(this repo)                  (Cloudflare Worker + Better Auth + D1)
  UI, routes, auth client ─►  /api/auth/* (sign-in, sign-out, forgot, reset, session)
  Route guards (UX only)  ─►  /api/users, /api/licenses, /api/keys, /api/jobs
```

- **No backend code lives here.** No Lovable Cloud, no Supabase, no TanStack server functions, no server routes.
- **Authentication is cookie-based.** The Worker issues a host-only session cookie on `api.trackdub.com` (`Secure; HttpOnly; SameSite=Lax; Path=/`). The portal calls the Worker with `credentials: "include"` and never reads the cookie itself.
- **Signup is invite-only** and enforced by the Worker — no signup UI ships here.
- Route guards use an awaitable, memoized session source (`src/lib/auth/ensure-session.ts`). The Worker remains the true authorization boundary; guards are UX only.

## Environment

| Variable            | Default                        | Notes                                                                 |
| ------------------- | ------------------------------ | --------------------------------------------------------------------- |
| `VITE_API_BASE_URL` | `https://api.trackdub.com`     | Origin of the Trackdub Worker. **Public build variable — not secret.** Compiled into the browser bundle. |
| `VITE_APP_ENV`      | `production`                   | Optional — used for banners/logging.                                  |

## Demo mode (preview only)

When `api.trackdub.com` is unreachable you can still browse the portal UI.
Demo mode fabricates a session and answers every Worker request from an
in-memory fixture store (`src/lib/demo/`).

Turn it on from the sign-in page ("Browse with demo data"), or with `?demo=1`
in the URL. Turn it off with "Turn off demo" or `?demo=0`.

- Only available on `localhost` / `*.lovable.app` preview hosts, or when the
  build sets `VITE_DEMO_MODE=1`.
- Never active on `portal.trackdub.com` — the Worker remains the only real
  authorization boundary.
- All data shown is sample data; nothing is sent to the backend.

## Worker requirements (external, not in this repo)

- `Access-Control-Allow-Origin: https://portal.trackdub.com` (exact origin, never `*`).
- `Access-Control-Allow-Credentials: true`.
- Handles `OPTIONS` preflight.
- `https://portal.trackdub.com` is in Better Auth `trustedOrigins`.
- Every protected endpoint authorizes independently — do not rely on portal guards.

## Development

```sh
npm i
npm run dev
```

## Built with

- TanStack Start (client-rendered)
- TypeScript
- React
- Tailwind CSS
