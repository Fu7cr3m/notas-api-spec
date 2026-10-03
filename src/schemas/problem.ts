import type { FastifyError, FastifyInstance } from "fastify";

export interface ProblemFieldError {
  pointer: string;
  detail: string;
}

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  errors?: ProblemFieldError[];
}

export class ApiProblemError extends Error {
  constructor(
    readonly status: number,
    readonly title: string,
    readonly fieldErrors?: ProblemFieldError[],
  ) {
    super(title);
    this.name = "ApiProblemError";
  }
}

function toFieldError(
  issue: NonNullable<FastifyError["validation"]>[number],
): ProblemFieldError {
  const params = issue.params as Record<string, unknown>;
  const additionalProperty =
    typeof params.additionalProperty === "string"
      ? params.additionalProperty
      : undefined;
  const missingProperty =
    typeof params.missingProperty === "string"
      ? params.missingProperty
      : undefined;
  const field = additionalProperty ?? missingProperty;
  const basePointer = issue.instancePath ?? "";
  const pointer = field
    ? `${basePointer}/${field.replace(/~/g, "~0").replace(/\//g, "~1")}`
    : basePointer;

  return {
    pointer: pointer ? `#${pointer}` : "#",
    detail: issue.message ?? "Valor inválido.",
  };
}

export const problemSchema = {
  type: "object",
  required: ["type", "title", "status"],
  properties: {
    type: { type: "string" },
    title: { type: "string" },
    status: { type: "integer" },
    detail: { type: "string" },
    instance: { type: "string" },
    errors: {
      type: "array",
      items: {
        type: "object",
        required: ["pointer", "detail"],
        properties: {
          pointer: { type: "string" },
          detail: { type: "string" },
        },
      },
    },
  },
} as const;

export function registerProblemHandler(app: FastifyInstance): void {
  app.setErrorHandler((error: FastifyError, request, reply) => {
    let status = 500;
    let title = "Erro interno";
    let errors: ProblemFieldError[] | undefined;

    if (error instanceof ApiProblemError) {
      status = error.status;
      title = error.title;
      errors = error.fieldErrors;
    } else if (error.validation) {
      status = 400;
      title = "Solicitação inválida";
      errors = error.validation.map(toFieldError);
    } else if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
      status = error.statusCode;
      title = status === 404 ? "Recurso não encontrado" : "Solicitação inválida";
    } else {
      request.log.error({ errorName: error.name }, "Unexpected request failure");
    }

    const problem: ProblemDetails = {
      type: "about:blank",
      title,
      status,
      ...(errors ? { errors } : {}),
    };

    if (status === 401) {
      reply.header("WWW-Authenticate", "Bearer");
    }

    reply
      .code(status)
      .type("application/problem+json")
      .send(problem);
  });
}
