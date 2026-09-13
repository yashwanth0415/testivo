# Testivo — Supabase Edge Function 404 Fix

## Why `/save-ai-config` was returning 404

The browser calls the deployed Supabase Edge Function at:

`https://<project>.supabase.co/functions/v1/make-server-1b359045/save-ai-config`

Inside an Edge Function, the request path is `/save-ai-config`. The Hono app was incorrectly registering routes under `/make-server-1b359045/save-ai-config`, so the deployed function returned 404.

This build changes the internal route prefix to an empty string. The public function URL still contains the function name, so **do not change the frontend `EDGE_FUNCTION_URL`**.

## What you need to do after replacing the GitHub files

1. Push the updated project to GitHub.
2. In Supabase Dashboard, open **Edge Functions**.
3. Open the function named `make-server-1b359045` and redeploy it from the updated `supabase/functions/server/index.tsx` source, or deploy the project using the Supabase CLI.
4. Confirm the function has these secrets/configuration values:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `AI_CREDENTIAL_ENCRYPTION_KEY`
5. Test the function health endpoint:

`https://<project>.supabase.co/functions/v1/make-server-1b359045/health`

Expected response:

`{"status":"ok"}`

6. Return to `/admin/ai`, enter the provider/API key, fetch models, select a model and click **Test selected model & Save / Activate**.

## Important

Do not put a Supabase service-role key or AI API key in the React/Vite frontend.
