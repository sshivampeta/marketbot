import { serve } from "@hono/node-server";
import { app } from "./app.js";

const port = Number(process.env.ENGINE_PORT ?? 8787);

serve({ fetch: app.fetch, port }, () => {
  console.log(`MarketBot engine listening on http://localhost:${port}`);
});
