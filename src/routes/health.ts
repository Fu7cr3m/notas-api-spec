import type { FastifyPluginAsync } from "fastify";
import type { AppConfig } from "../config/env.js";

interface HealthOptions {
  config?: AppConfig;
  readinessCheck?: () => Promise<boolean>;
}

async function checkSupabaseReadiness(config: AppConfig): Promise<boolean> {
  const headers = { apikey: config.supabaseAnonKey };
  const options = {
    headers,
    signal: AbortSignal.timeout(1500),
  };

  try {
    const [authResponse, dataResponse] = await Promise.all([
      fetch(`${config.supabaseUrl}/auth/v1/health`, options),
      fetch(`${config.supabaseUrl}/rest/v1/`, options),
    ]);
    return authResponse.ok && dataResponse.ok;
  } catch {
    return false;
  }
}

export const registerHealthRoutes: FastifyPluginAsync<HealthOptions> = async (
  app,
  options,
) => {
  app.get("/health/live", async (_request, reply) => {
    return reply.code(200).send({ status: "ok" });
  });

  app.get("/health/ready", async (_request, reply) => {
    const ready = options.readinessCheck
      ? await options.readinessCheck()
      : options.config
        ? await checkSupabaseReadiness(options.config)
        : false;

    return reply
      .code(ready ? 200 : 503)
      .send({ status: ready ? "ready" : "not_ready" });
  });
};
