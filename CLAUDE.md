# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Workflow

Every change — no matter how small — must follow this sequence. Do not skip or reorder steps.

1. **Open a branch** — use `/superpowers:using-git-worktrees` to create an isolated branch before touching any code.
2. **Plan** — for any non-trivial task, use `/superpowers:brainstorming` first, then `/superpowers:writing-plans` to produce a written plan before writing code.
3. **Implement with TDD** — use `/superpowers:test-driven-development`: write the failing test first, then the implementation. Commit in small, logical units.
4. **Debug failures** — if anything breaks, use `/superpowers:systematic-debugging` before proposing a fix.
5. **Verify before claiming done** — use `/superpowers:verification-before-completion` to run all checks and confirm output before declaring the work finished.
6. **Open a PR** — use `/superpowers:finishing-a-development-branch` to choose between merge, PR, or cleanup. Always open a PR; never merge directly to `main`.
7. **Code review** — use `/pr-review-toolkit:review-pr` (runs the full multi-agent review suite) on the PR before requesting merge.
8. **Fix review findings** — apply `/superpowers:receiving-code-review` to evaluate and implement reviewer feedback. Re-run verification after fixes.
9. **Hand off to senior developer (the user)** — only when all review findings are resolved and you are 100% confident the code is correct and safe. Do not merge; notify the user and wait for them to merge.

**Never merge to `main` yourself.** The final merge is always performed by the senior developer human supervisor.

---

## Commands

```bash
npm run dev       # Start dev server with Turbopack on port 3000
npm run build     # Production build
npm run lint      # ESLint
npm run tunnel    # Expose local server via ngrok (needed for Vercel Blob webhooks locally)
npx prisma migrate dev   # Create and apply a new migration
npx prisma migrate deploy  # Apply migrations in production
npx prisma studio  # Open Prisma GUI
```

## Environment Variables

```env
DATABASE_URL=postgresql://...
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
OPENAI_API_KEY=sk-...
BLOB_READ_WRITE_TOKEN=...
ADMIN_ID=...        # Optional: bypasses daily upload limit
ADMIN_EMAIL=...     # Optional: bypasses daily upload limit
```

## Architecture

**Upload & AI pipeline** (the core flow):

1. Client calls `createNotebook` server action → creates a `pending` Notebook row in DB, gets back the ID.
2. Client uses `@vercel/blob` client-side upload to `POST /api/upload/recording`.
3. Vercel Blob calls `onUploadCompleted` on the same route — this is where the AI pipeline runs:
   - `app/api/upload/recording/recording.ts` → `handleRecording()` → `processRecording()`
   - Status transitions: `pending → transcribing → summarizing → completed` (or `failed`)
   - Calls `lib/openai.ts`: `transcribe()` (Whisper, Hebrew) then `summarize()` (GPT-4o-mini)
   - Summary stored as a JSON string: `{ title, notes, cues, summary }` — all values are Hebrew HTML strings
   - Audio blob is deleted from Vercel Blob after transcription, before summarization
4. Client at `/notebook/[id]` polls `GET /api/notebook/[id]` every `notebook_polling_interval` ms until `completed` or `failed`, then stops.
5. `Notebook.tsx` parses `notebook.summary` as JSON and renders each field with `dangerouslySetInnerHTML`.

**Download**: `html2canvas-pro` screenshots the notebook `<div>` at A4 width and saves as JPEG.

**Auth**: NextAuth v4 with Google OAuth, JWT sessions. On sign-in, the user is upserted into the `User` table (`lib/auth.ts`). The session is not automatically attached to the notebook during upload — the client passes `email` in `clientPayload` to `onBeforeGenerateToken`, which forwards it as `tokenPayload` so `onUploadCompleted` can look up the user.

**Rate limiting**: `enforceLimits()` counts today's notebooks for the user and throws if `>= daily_limit`. `ADMIN_ID` / `ADMIN_EMAIL` env vars bypass this.

## Configuration

`server-parameters.json` is the single place to tune runtime behavior without touching code:

- `daily_limit` — max uploads per user per day
- `notebook_polling_interval` — client polling frequency in ms
- `prompts.transcribe` — Whisper prompt (Hebrew context hint)
- `prompts.summarize` — GPT-4o-mini system prompt (Cornell Notes format, Hebrew HTML output)

## Key Constraints

- The entire AI pipeline runs inside Vercel's `onUploadCompleted` webhook callback. `vercel.json` sets `maxDuration: 300` (5 min) for this route — Whisper + GPT must complete within that window.
- GPT output must be valid JSON conforming to `{ title, notes, cues, summary }`. The route validates this with `JSON.parse` before saving.
- Prisma client uses a singleton in `lib/prisma.ts` to avoid connection exhaustion in serverless.
- Audio files are limited to 25 MB (OpenAI Whisper's limit), enforced in `lib/openai.ts`.
