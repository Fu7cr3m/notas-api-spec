import type {
  FastifyReply,
  FastifyRequest,
  preHandlerHookHandler,
} from "fastify";
import { createSupabaseAuthClient } from "./supabase.js";
import type { AppConfig } from "../config/env.js";
import { ApiProblemError } from "../schemas/problem.js";

export interface VerifiedClaims {
  sub?: string;
  iss?: string;
  exp?: number;
  aud?: string | string[];
}

export interface AuthenticatedUser {
  id: string;
}

export type ClaimsVerifier = (
  token: string,
) => Promise<VerifiedClaims | null>;

declare module "fastify" {
  interface FastifyRequest {
    user: AuthenticatedUser | null;
    accessToken: string | null;
  }
}

export function createAuthenticationGuard(
  config: AppConfig,
  verifyClaims?: ClaimsVerifier,
): preHandlerHookHandler {
  const authClient = verifyClaims
    ? null
    : createSupabaseAuthClient(config);
  const verifier: ClaimsVerifier =
    verifyClaims ??
    (async (token) => {
      if (!authClient) {
        throw new Error("Supabase Auth client is unavailable.");
      }

      const { data, error } = await authClient.auth.getClaims(token);

      if (error) {
        if (error.name === "AuthRetryableFetchError") {
          throw error;
        }
        return null;
      }

      return data?.claims ?? null;
    });

  return async function authenticateRequest(
    request: FastifyRequest,
    _reply: FastifyReply,
  ): Promise<void> {
    const authorization = request.headers.authorization;
    const match =
      typeof authorization === "string"
        ? /^Bearer\s+(\S+)$/i.exec(authorization)
        : null;

    if (!match?.[1]) {
      throw new ApiProblemError(401, "Não autenticado");
    }

    const token = match[1];
    const claims = await verifier(token);
    const now = Math.floor(Date.now() / 1000);
    if (
      !claims ||
      typeof claims.sub !== "string" ||
      claims.sub.length === 0 ||
      claims.iss !== config.supabaseIssuer ||
      typeof claims.exp !== "number" ||
      claims.exp <= now
    ) {
      throw new ApiProblemError(401, "Não autenticado");
    }

    request.user = { id: claims.sub };
    request.accessToken = token;
  };
}
