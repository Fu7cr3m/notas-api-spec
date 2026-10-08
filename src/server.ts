import { buildApp } from "./app.js";
import { loadConfig } from "./config/env.js";

export async function start(): Promise<void> {
  const config = loadConfig();
  const app = buildApp(config);

  try {
    await app.listen({ host: config.host, port: config.port });
  } catch (error) {
    app.log.error(
      { errorName: error instanceof Error ? error.name : "UnknownError" },
      "Server failed to start",
    );
    process.exitCode = 1;
    await app.close();
    return;
  }

  const shutdown = async () => {
    try {
      await app.close();
    } catch (error) {
      app.log.error(
        { errorName: error instanceof Error ? error.name : "UnknownError" },
        "Server failed to shut down cleanly",
      );
      process.exitCode = 1;
    }
  };

  process.once("SIGINT", () => void shutdown());
  process.once("SIGTERM", () => void shutdown());
}

void start();
