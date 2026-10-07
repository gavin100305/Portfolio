# Ship presence Worker

This Worker provides temporary, anonymous astronaut presence for the portfolio map.

## Local development

1. Install dependencies with `npm install` from this directory.
2. Create `.dev.vars` with a development-only ticket secret of at least 32 characters:

   ```text
   PRESENCE_TICKET_SECRET=replace-with-a-long-local-development-secret
   ```

3. Start the service with `npm run dev`. Wrangler serves it at `http://localhost:8787` and permits only the configured `ALLOWED_ORIGIN` from `wrangler.toml` (`http://localhost:3000` by default).
4. Set `NEXT_PUBLIC_PRESENCE_URL=http://localhost:8787` in the Next.js app's local environment and restart Next.js.

The map remains usable without the Worker URL or the ticket secret.

## Deploy

Set the deployed site's exact origin in the Worker's `ALLOWED_ORIGIN` variable. Add a unique secret using `npx wrangler secret put PRESENCE_TICKET_SECRET`, then run `npm run build` to inspect the bundle and `npx wrangler deploy` to publish. Set `NEXT_PUBLIC_PRESENCE_URL` to the deployed Worker origin in the Next.js hosting environment. Never use the local development secret in production.

Run `npx wrangler types` after changing bindings or variables so `worker-configuration.d.ts` stays current.

## Load test

Use a deployed test Worker or local Wrangler instance, then run with `PRESENCE_TICKET_URL`, `PRESENCE_WS_URL`, and `PRESENCE_ORIGIN` set. The script defaults to 1,000 short-lived simulated guests; choose a smaller `PRESENCE_CLIENTS` for local smoke runs and optionally set `PRESENCE_DURATION_MS`. It reports counts and timing only; it does not print guest tickets or positions.

```bash
PRESENCE_TICKET_URL=http://localhost:8787/ticket \
PRESENCE_WS_URL=ws://localhost:8787/connect \
PRESENCE_ORIGIN=http://localhost:3000 \
PRESENCE_CLIENTS=8 npm run loadtest
```
