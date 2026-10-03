import Fastify, { type FastifyServerOptions } from "fastify";
import type { AppConfig } from "./config/env.js";
import { registerNotesRoutes } from "./routes/notes.js";
import { registerHealthRoutes } from "./routes/health.js";
import { registerProblemHandler } from "./schemas/problem.js";

export interface AppOptions {
  logger?: FastifyServerOptions["logger"];
  readinessCheck?: () => Promise<boolean>;
}

export function buildApp(
  config: AppConfig,
  options: AppOptions = {},
) {
  const app = Fastify({
    ajv: {
      customOptions: {
        removeAdditional: false,
      },
    },
    logger:
      options.logger === undefined
        ? {
            redact: {
              paths: [
                "req.headers.authorization",
                "req.headers.apikey",
                "req.headers.cookie",
                "*.access_token",
                "*.refresh_token",
                "*.password",
                "*.secret",
              ],
              censor: "[Redacted]",
            },
          }
        : options.logger,
  });

  app.decorateRequest("user", null);
  app.decorateRequest("accessToken", null);
  registerProblemHandler(app);
  app.register(registerHealthRoutes, {
    config,
    ...(options.readinessCheck
      ? { readinessCheck: options.readinessCheck }
      : {}),
  });
  app.register(registerNotesRoutes, { config });

  return app;
}
