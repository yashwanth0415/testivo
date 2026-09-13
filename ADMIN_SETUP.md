# Testivo admin setup

The application uses Supabase Auth for the administrator. There is no hard-coded frontend password.

## Create the requested default administrator

From the project root:

```bash
SUPABASE_URL="https://YOUR_PROJECT.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY" \
node scripts/bootstrap-admin.mjs
```

Defaults created by the script:

- Email: `thurpatiyashwanth@gmail.com`
- Password: `Yash@1234`
- Username: `YASHWANTH`

Change the password immediately after the first login at `/admin/settings`.

## Supabase migration

Run migrations `001_initial_schema.sql` and `002_security_admin_ai_fix.sql` in the Supabase SQL editor (or through your normal migration workflow).

## Edge Function secrets

Set these as Supabase Edge Function secrets, never as frontend `VITE_*` variables:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `AI_CREDENTIAL_ENCRYPTION_KEY` (32 random bytes; 64 hex characters)

## Render

The project includes `render.yaml` and `public/_redirects` so client-side routes such as `/admin`, `/admin/login`, `/dashboard`, and `/exam/...` resolve to `index.html` on a static Render deployment. If your existing Render service was created manually, add an equivalent rewrite rule in the Render service settings or redeploy using the Blueprint configuration.
