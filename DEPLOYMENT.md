# InnerTruth Deployment Checklist

Use this checklist for each production deployment.

## 1) Pre-Deploy Validation (local)

- Install dependencies: `npm ci`
- Typecheck: `npm run check`
- Tests: `npm run test`
- Build: `npm run build`
- Confirm migrations exist in `migrations/` and are committed.

## 2) Required Environment Variables (Netlify)

Backend/runtime:

- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (if used by server jobs/admin operations)
- `SUPABASE_JWT_AUD` (usually `authenticated`)
- `OPENAI_API_KEY` or `OPENAI_API_BASE_URL` (Ollama mode)
- `AI_MODEL`
- `AI_CHAT_MODEL` (optional, defaults to `AI_MODEL`)
- `ELEVENLABS_API_KEY` (optional)
- `CORS_ORIGIN`

Frontend:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_URL` (optional, if API is not same-origin)

## 3) Database Migration Step

- Preferred in production: apply committed SQL migrations from `migrations/`.
- For first rollout, ensure schema and app code are in sync before deploy cutover.
- If using Drizzle direct sync (`npm run db:push`), run it only in controlled environments and validate immediately after.

## 4) Post-Deploy Smoke Test

Run these in the deployed app:

1. Auth:
   - Sign in with magic link or password.
   - Confirm `/api/auth/user` returns current user.
2. Core features:
   - Create a conversation and send one message.
   - Create, edit, and delete one journal entry.
   - Add one mood entry.
3. Category tracking:
   - Free-tier user can select exactly one category.
   - Attempt selecting premium/locked category should return `403`.
   - Generate a category score and verify it appears in history.
4. Reflection:
   - Start a free reflection and verify polling completes or shows clear failure message.
5. TTS (optional):
   - Trigger `/api/text-to-speech` and verify audio response if key is configured.

## 5) Observability and Rollback Readiness

- Review server logs for:
  - auth verification failures
  - OpenAI quota/rate-limit failures
  - DB connection or query errors
- Keep previous deploy available for immediate rollback in Netlify.
- If schema changes were applied, confirm rollback strategy before traffic cutover.

## 6) Manual Plan Tier Operations

Until billing automation is wired, you can safely set a user's plan tier via CLI:

- Read current tier:
  - `npm run plan:get -- --user-id <user-id>`
  - `npm run plan:get -- --email <user-email>`
- By user ID:
  - `npm run plan:set -- --user-id <user-id> --tier <free|standard|premium> --yes`
- By email:
  - `npm run plan:set -- --email <user-email> --tier <free|standard|premium> --yes`

Notes:

- Requires `DATABASE_URL` in environment.
- Script updates `users.plan_tier` and `updated_at`.
- See `ADMIN_OPERATIONS.md` for the full runbook (verification flow + rollback steps).
