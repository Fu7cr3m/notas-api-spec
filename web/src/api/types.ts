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

export interface NoteInput {
  title: string;
  content: string;
}

export interface ProblemError {
  pointer?: string;
  detail?: string;
  [key: string]: unknown;
}

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  errors?: ProblemError[];
}
