# Supabase project setup

One backend serves both directions. Everything here runs from the owner's machine with the Supabase CLI; nothing in this folder holds a secret.

1. Create a project at supabase.com. Free tier is fine for the prototypes.
2. SQL editor: paste `db/schema.sql` and run it. It is idempotent, so re-running after a schema change is safe.
3. Authentication → Providers → Email: for development, turn off "Confirm email" so test accounts can sign in immediately. Turn it back on before any public beta.
4. Project Settings → API: copy the Project URL and the anon key (newer dashboards call it the publishable key). Put them in an untracked `.env.local` in each app folder:

   ```bash
   printf 'REVIVEX_SUPABASE_URL=%s\nREVIVEX_SUPABASE_ANON_KEY=%s\n' '<url>' '<key>' > apps/direction-a/.env.local
   cp apps/direction-a/.env.local apps/direction-b/.env.local
   ```

   `app.config.js` reads them; values in `app.json` under `expo.extra` still win if set. Both are publishable and safe to ship in the app binary. Restart `expo start` with `--clear` after changing them. Never put a service-role or secret key in either place.
5. Edge Functions (needs `supabase login` and `supabase link --project-ref <ref>` once):

   ```bash
   supabase functions deploy delete-account
   ```

   The function reads `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` from the environment Supabase provides. No secrets to set.

6. Strava functions arrive in a later step and will need `STRAVA_CLIENT_ID` and `STRAVA_CLIENT_SECRET` set with `supabase secrets set`.

Policy tests run locally without a project: `npm run test:db`. Sync can be rehearsed against a local stand-in with `npm run e2e:mock`, and verified against the real project with `npm run e2e:live` once `.env.local` is in place.

## Strava (push-first)

Owner prerequisites: a Strava API application (https://www.strava.com/settings/api) whose **Authorization Callback Domain** is your project's host, for example `abcdefghijkl.supabase.co`, and an active Strava subscription (required for Standard-tier developers since June 2026).

```bash
supabase secrets set STRAVA_CLIENT_ID=... STRAVA_CLIENT_SECRET=... STRAVA_WEBHOOK_VERIFY_TOKEN=$(openssl rand -hex 16)
supabase functions deploy strava-connect
supabase functions deploy strava-push
supabase functions deploy strava-disconnect
supabase functions deploy strava-callback --no-verify-jwt   # Strava's browser redirect carries no Supabase session
supabase functions deploy strava-webhook --no-verify-jwt    # Strava calls it directly
```

Create the webhook subscription once (replace the placeholders):

```bash
curl -X POST https://www.strava.com/api/v3/push_subscriptions \
  -F client_id=$STRAVA_CLIENT_ID -F client_secret=$STRAVA_CLIENT_SECRET \
  -F callback_url=https://<ref>.supabase.co/functions/v1/strava-webhook \
  -F verify_token=<the STRAVA_WEBHOOK_VERIFY_TOKEN you set>
```

What the functions do: `strava-connect` starts OAuth with `read,activity:write`; `strava-callback` exchanges the code and stores tokens in the server-only `strava_connections` table; `strava-push` drains the user's queue (GPX upload for runs with a trace, manual activities otherwise); `strava-webhook` marks a connection revoked when the athlete deauthorizes; `strava-disconnect` revokes and deletes. The app starts in Strava's single-player mode; raise the athlete cap from the Strava developer dashboard before inviting testers. Pure helpers are unit-tested with `npm run test:functions`.
