# Supabase project setup

One backend serves both directions. Everything here runs from the owner's machine with the Supabase CLI; nothing in this folder holds a secret.

1. Create a project at supabase.com. Free tier is fine for the prototypes.
2. SQL editor: paste `db/schema.sql` and run it. It is idempotent, so re-running after a schema change is safe.
3. Authentication → Providers → Email: for development, turn off "Confirm email" so test accounts can sign in immediately. Turn it back on before any public beta.
4. Project Settings → API: copy the Project URL and the anon (publishable) key into `apps/direction-a/app.json` and `apps/direction-b/app.json` under `expo.extra.supabaseUrl` / `supabaseAnonKey`. Both values are safe to ship in the app binary.
5. Edge Functions (needs `supabase login` and `supabase link --project-ref <ref>` once):

   ```bash
   supabase functions deploy delete-account
   ```

   The function reads `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` from the environment Supabase provides. No secrets to set.

6. Strava functions arrive in a later step and will need `STRAVA_CLIENT_ID` and `STRAVA_CLIENT_SECRET` set with `supabase secrets set`.

Policy tests run locally without a project: `npm run test:db`.
