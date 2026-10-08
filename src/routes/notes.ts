import type { FastifyPluginAsync, FastifyRequest } from "fastify";
import type { AppConfig } from "../config/env.js";
import { createAuthenticationGuard } from "../plugins/authentication.js";
import { createUserSupabaseClient } from "../plugins/supabase.js";
import {
  noteIdParamsSchema,
  noteInputSchema,
  notePageSchema,
  notePaginationSchema,
  noteSchema,
  type NoteInput,
  type NotePagination,
} from "../schemas/notes.js";
import { ApiProblemError } from "../schemas/problem.js";
import {
  createNote,
  deleteNote,
  getNote,
  listNotes,
  replaceNote,
} from "../services/notes.js";

interface NotesOptions {
  config: AppConfig;
}

interface NoteIdParams {
  noteId: string;
}

function getRequestIdentity(request: FastifyRequest, config: AppConfig) {
  if (!request.user || !request.accessToken) {
    throw new ApiProblemError(401, "Não autenticado");
  }

  return {
    ownerId: request.user.id,
    client: createUserSupabaseClient(
      config,
      request.accessToken,
    ),
  };
}

export const registerNotesRoutes: FastifyPluginAsync<NotesOptions> = async (
  app,
  options,
) => {
  const authenticate = createAuthenticationGuard(options.config);

  app.post<{ Body: NoteInput }>(
    "/notes",
    {
      onRequest: authenticate,
      schema: {
        body: noteInputSchema,
        response: { 201: noteSchema },
      },
    },
    async (request, reply) => {
      const { client, ownerId } = getRequestIdentity(request, options.config);
      const note = await createNote(client, ownerId, request.body);

      return reply
        .header("Location", `/notes/${note.id}`)
        .code(201)
        .send(note);
    },
  );

  app.get<{ Querystring: NotePagination }>(
    "/notes",
    {
      onRequest: authenticate,
      schema: {
        querystring: notePaginationSchema,
        response: { 200: notePageSchema },
      },
    },
    async (request) => {
      const { client } = getRequestIdentity(request, options.config);
      return listNotes(
        client,
        request.query.limit ?? 50,
        request.query.offset ?? 0,
      );
    },
  );

  app.get<{ Params: NoteIdParams }>(
    "/notes/:noteId",
    {
      onRequest: authenticate,
      schema: {
        params: noteIdParamsSchema,
        response: { 200: noteSchema },
      },
    },
    async (request) => {
      const { client } = getRequestIdentity(request, options.config);
      const note = await getNote(client, request.params.noteId);

      if (!note) {
        throw new ApiProblemError(404, "Nota não encontrada");
      }
      return note;
    },
  );

  app.put<{ Params: NoteIdParams; Body: NoteInput }>(
    "/notes/:noteId",
    {
      onRequest: authenticate,
      schema: {
        params: noteIdParamsSchema,
        body: noteInputSchema,
        response: { 200: noteSchema },
      },
    },
    async (request) => {
      const { client } = getRequestIdentity(request, options.config);
      const note = await replaceNote(
        client,
        request.params.noteId,
        request.body,
      );

      if (!note) {
        throw new ApiProblemError(404, "Nota não encontrada");
      }
      return note;
    },
  );

  app.delete<{ Params: NoteIdParams }>(
    "/notes/:noteId",
    {
      onRequest: authenticate,
      schema: {
        params: noteIdParamsSchema,
      },
    },
    async (request, reply) => {
      const { client } = getRequestIdentity(request, options.config);
      const deleted = await deleteNote(client, request.params.noteId);

      if (!deleted) {
        throw new ApiProblemError(404, "Nota não encontrada");
      }
      return reply.code(204).send();
    },
  );
};
