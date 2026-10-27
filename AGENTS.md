<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Cursor Cloud specific instructions

TanStack Start / Vite / Bun portal (GitHub repo `mesalimllc/trackdub-api-hub`). Local: `bun install`, then `bun run dev` or `bun run build`.

- Install with Bun (`bun.lock` is canonical; `package-lock.json` may also exist, prefer Bun).
- Auth and API calls need live/staging backend secrets when testing logged-in flows. Prefer Cursor Secrets over committed env files.
- Agent verification default: `bun run build`. Skip deploy unless asked.
- Demo mode (`src/lib/demo/`) is a preview convenience only: it may activate on localhost/`*.lovable.app` hosts or when `VITE_DEMO_MODE=1` is set at build time, and never on the production portal origin — the Worker stays the only real authorization boundary.
