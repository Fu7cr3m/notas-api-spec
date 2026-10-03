export interface NoteInput {
  title: string;
  content: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotePage {
  data: Note[];
  total: number;
  limit: number;
  offset: number;
}

export interface NotePagination {
  limit: number;
  offset: number;
}

export const noteInputSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "content"],
  properties: {
    title: { type: "string", minLength: 1, pattern: ".*\\S.*" },
    content: { type: "string", minLength: 1, pattern: ".*\\S.*" },
  },
} as const;

export const noteSchema = {
  type: "object",
  additionalProperties: false,
  required: ["id", "title", "content", "createdAt", "updatedAt"],
  properties: {
    id: { type: "string" },
    title: { type: "string" },
    content: { type: "string" },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
} as const;

export const notePageSchema = {
  type: "object",
  additionalProperties: false,
  required: ["data", "total", "limit", "offset"],
  properties: {
    data: {
      type: "array",
      items: noteSchema,
    },
    total: { type: "integer", minimum: 0 },
    limit: { type: "integer", minimum: 1, maximum: 100 },
    offset: { type: "integer", minimum: 0 },
  },
} as const;

export const noteIdParamsSchema = {
  type: "object",
  additionalProperties: false,
  required: ["noteId"],
  properties: {
    noteId: { type: "string", minLength: 1 },
  },
} as const;

export const notePaginationSchema = {
  type: "object",
  properties: {
    limit: { type: "integer", minimum: 1, maximum: 100, default: 50 },
    offset: { type: "integer", minimum: 0, default: 0 },
  },
} as const;
