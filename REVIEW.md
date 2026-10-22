# Review Guide

Use this file when reviewing pull requests in the Trackdub portal SPA
(`mesalimllc/portal.trackdub`).

This is a reviewer checklist, not an authoring guide. For architecture and
Worker requirements, see `README.md`. For agent Linear sync, see `AGENTS.md`.

This repo is a client-rendered React / TanStack Start SPA for
`portal.trackdub.com`. Backend logic lives in `api.trackdub` (Cloudflare Worker
+ Better Auth + D1). Do not land API or auth-server work here.

## Automated review (Bugbot)

If Cursor Bugbot (or similar) is configured for this repository, it should follow
this checklist. Human reviewers still own the final merge bar.

Bugbot should surface the same blocking issues as
[Automatic review stops](#automatic-review-stops) below (backend-in-SPA leaks,
cookie reads, fake auth, Lovable history rewrites).

## Review priorities

Review in this order:

1. Correctness
2. Scope control
3. Client-only boundary (no backend in this repo)
4. Auth UX vs real authorization
5. API client / OpenAPI contract alignment
6. Test and build evidence
7. Docs and Lovable sync safety

## Approval standard

Do not approve a PR if any of these are unclear:

- What changed
- What did not change
- What was tested
- What was not tested
- Whether auth client, session, or API base URL behavior changed
- Whether any server/backend surface was introduced here
- Whether OpenAPI / schema regen is needed and done

## Checklist

### 1. Scope

- [ ] The PR solves one clear problem or one bounded slice.
- [ ] The PR description explicitly states non-goals.
- [ ] Unrelated cleanup is absent or clearly separated.
- [ ] Changes stay in portal UI, routes, auth client, and static assets.
      Worker/API changes belong in `api.trackdub`.

### 2. Hard architectural constraints

Treat these as request-changes items, not suggestions.

- [ ] No backend code lands here: no Lovable Cloud, no Supabase, no TanStack
      server functions, no server routes that own business logic.
- [ ] Auth remains cookie-based against the Worker. Portal JS never reads the
      session cookie (`HttpOnly` on the API host).
- [ ] API calls use `credentials: "include"` against `VITE_API_BASE_URL`.
- [ ] Route guards stay UX-only. The Worker remains the true authorization
      boundary.
- [ ] Signup UI is not introduced (invite-only is enforced by the Worker).
- [ ] Session source stays awaitable/memoized (`src/lib/auth/ensure-session.ts`
      or successor) rather than ad hoc duplicate fetches.

### 3. Auth and API client behavior

- [ ] Session / sign-in / sign-out flows still talk to Worker `/api/auth/*`.
- [ ] Protected page UX handles unauthenticated state without inventing a
      local "authorized" truth.
- [ ] New API consumption matches Worker contracts. Schema/type regen is
      called out when the API surface changed.
- [ ] `VITE_API_BASE_URL` remains a public build variable, not a secret.

### 4. UX and frontend quality

- [ ] Destructive actions are confirmed or clearly signaled.
- [ ] Loading, empty, and error states are honest (no fake success).
- [ ] Accessibility basics hold for new interactive controls.
- [ ] Design-system / Figma alignment is noted for visual work when applicable.

### 5. Lovable / git safety

- [ ] No force-push, rebase, or history rewrite of already-pushed commits
      (Lovable sync depends on linear history).
- [ ] Branch stays in a working state for Lovable editor sync.

### 6. Tests and verification

- [ ] Build / typecheck / lint commands actually run are listed in the PR.
- [ ] Skipped checks are named and justified.
- [ ] Auth-guard or API-client changes include focused verification steps.
- [ ] The PR does not claim broader verification than was actually run.

### 7. Docs

- [ ] `README.md` / `AGENTS.md` remain accurate if architecture or env vars
      changed.
- [ ] Worker contract assumptions stay documented when portal expectations
      change.

## Automatic review stops

Request changes immediately if a PR does any of the following:

- Adds server-side business logic, secrets handling, or a second auth backend
  in this SPA.
- Reads or stores the session token in browser JS.
- Treats portal route guards as security.
- Adds public signup that bypasses invite-only Worker policy.
- Force-pushes or rewrites published history on a Lovable-connected branch.
- Claims validation that the PR body does not support with exact commands.

## Review comment style

Prefer comments that are concrete and falsifiable:

- Point to the exact file or behavior.
- State the risk.
- State what evidence is missing.
- Suggest the narrowest acceptable correction.

Good review comments usually sound like:

- "This adds a server function that owns auth. Move that to `api.trackdub`."
- "Route guard treats local session cache as authorization. Worker must decide."
- "API client dropped `credentials: \"include\"`, so the host-only cookie will
  not be sent."
- "Visual change has no build/typecheck evidence listed."

## Minimum merge bar

A PR is ready to merge when:

- The scope is still client-only.
- Auth UX vs Worker authorization boundaries still hold.
- Validation is honest and adequate.
- Docs match the shipped behavior.
