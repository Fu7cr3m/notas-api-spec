import { randomBytes, randomUUID } from "node:crypto";
import type { AppConfig } from "../../../src/config/env.js";
import { loadConfig } from "../../../src/config/env.js";
import {
  createSupabaseAuthClient,
  createUserSupabaseClient,
} from "../../../src/plugins/supabase.js";

export interface TestIdentity {
  id: string;
  accessToken: string;
}

export async function createTestIdentities(
  config: AppConfig = loadConfig(),
): Promise<[TestIdentity, TestIdentity]> {
  const authClient = createSupabaseAuthClient(config);
  const identities: TestIdentity[] = [];

  for (let index = 0; index < 2; index += 1) {
    const { data, error } = await authClient.auth.signUp({
      email: `notes-${randomUUID()}@example.test`,
      password: `${randomBytes(18).toString("base64url")}aA1!`,
    });

    if (error) {
      throw new Error(`Could not create a local test identity: ${error.message}`);
    }
    if (!data.user || !data.session) {
      throw new Error("Local Supabase Auth did not return a test access token.");
    }

    identities.push({
      id: data.user.id,
      accessToken: data.session.access_token,
    });
  }

  const [first, second] = identities;
  if (!first || !second) {
    throw new Error("Could not create two local test identities.");
  }

  return [first, second];
}

export async function cleanupTestIdentities(
  config: AppConfig,
  identities: readonly TestIdentity[],
): Promise<void> {
  for (const identity of identities) {
    const { error } = await createUserSupabaseClient(
      config,
      identity.accessToken,
    )
      .from("notes")
      .delete()
      .eq("owner_id", identity.id);

    if (error) {
      throw new Error(
        `Could not clean notes for a local test identity: ${error.message}`,
      );
    }
  }
}
