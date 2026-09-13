# Testivo – Render /admin routing fix

Testivo is a Vite + React SPA. When deployed as a Render Static Site, direct requests to client routes such as `/admin` must be rewritten to `/index.html` so React Router can handle the route.

The included `render.yaml` is configured as a Render Static Site with the SPA rewrite:

- `type: static`
- `staticPublishPath: ./dist`
- `source: /*` -> `destination: /index.html`

If you already created the Render service manually, open the Static Site in Render and add a Rewrite rule:

Source: `/*`
Destination: `/index.html`
Action: `Rewrite`

Then trigger a new deploy.

Important: this fixes the 404/Not Found for the frontend route. The page can then redirect to `/admin/login` if no valid Supabase admin session exists.
