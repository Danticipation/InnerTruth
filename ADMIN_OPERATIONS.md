# Admin Operations

Operational runbook for manual user plan-tier management and safe rollback.

## Prerequisites

- `DATABASE_URL` is set in your shell environment.
- You are in the project root.
- Dependencies are installed (`npm ci` or `npm install`).

## Read Current Plan Tier

Use one selector only:

- By user ID:
  - `npm run plan:get -- --user-id <user-id>`
- By email:
  - `npm run plan:get -- --email <user-email>`

Expected output: JSON containing `id`, `email`, `planTier`, and `updatedAt`.

## Set Plan Tier

Allowed values: `free`, `standard`, `premium`

Use one selector only and include `--yes`:

- By user ID:
  - `npm run plan:set -- --user-id <user-id> --tier <free|standard|premium> --yes`
- By email:
  - `npm run plan:set -- --email <user-email> --tier <free|standard|premium> --yes`

The command logs the before/after tier transition.

## Safe Change Procedure

1. Read current tier with `plan:get`.
2. Record current value for rollback.
3. Apply new tier with `plan:set`.
4. Verify with `plan:get` again.
5. Ask user to refresh app session if they are currently logged in.

## Rollback

If a tier was changed incorrectly:

1. Re-run `plan:set` with the previously recorded tier.
2. Verify with `plan:get`.

## Common Failures

- `DATABASE_URL is required`
  - Export a valid `DATABASE_URL` and retry.
- `User not found for provided selector`
  - Re-check the selector and try the other selector type.
- `Provide exactly one selector`
  - Pass only one of `--user-id` or `--email`.
