export interface AppConfig {
  host: string;
  port: number;
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseIssuer: string;
}

export function loadConfig(
  env: NodeJS.ProcessEnv = process.env,
): AppConfig {
  const missing: string[] = [];

  const host = env.HOST?.trim() || "127.0.0.1";
  const rawPort = env.PORT?.trim() || "3000";
  const supabaseUrl = env.SUPABASE_URL?.trim();
  const supabaseAnonKey = env.SUPABASE_ANON_KEY?.trim();

  if (!supabaseUrl) {
    missing.push("SUPABASE_URL");
  }

  if (!supabaseAnonKey || supabaseAnonKey === "replace-with-local-anon-key-from-supabase-status") {
    missing.push("SUPABASE_ANON_KEY");
  }

  const port = Number(rawPort);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535.");
  }

  if (missing.length > 0) {
    throw new Error(`Missing required configuration: ${missing.join(", ")}.`);
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase configuration is incomplete.");
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(supabaseUrl);
  } catch {
    throw new Error("SUPABASE_URL must be a valid URL.");
  }

  if (
    parsedUrl.protocol !== "https:" &&
    parsedUrl.hostname !== "127.0.0.1" &&
    parsedUrl.hostname !== "localhost"
  ) {
    throw new Error("SUPABASE_URL must use HTTPS except for local development.");
  }

  const normalizedSupabaseUrl = parsedUrl.toString().replace(/\/$/, "");
  return {
    host,
    port,
    supabaseUrl: normalizedSupabaseUrl,
    supabaseAnonKey,
    supabaseIssuer: `${normalizedSupabaseUrl}/auth/v1`,
  };
}
