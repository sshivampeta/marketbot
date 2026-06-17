import { createApp } from "./app.js";
import { createWorkerDeps, type WorkerEnv } from "./store.js";

export default {
  fetch(request: Request, env: WorkerEnv): Response | Promise<Response> {
    return createApp(createWorkerDeps(env)).fetch(request);
  },
};
