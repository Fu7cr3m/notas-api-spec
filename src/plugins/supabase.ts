import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { AppConfig } from "../config/env.js";

function clientOptions() {
  return {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  };
}

export function createSupabaseAuthClient(config: AppConfig): SupabaseClient {
  return createClient(
    config.supabaseUrl,
    config.supabaseAnonKey,
    clientOptions(),
  );
}

export function createUserSupabaseClient(
  config: AppConfig,
  accessToken: string,
): SupabaseClient {
  return createClient(
    config.supabaseUrl,
    config.supabaseAnonKey,
    {
      ...clientOptions(),
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    },
  );
}
