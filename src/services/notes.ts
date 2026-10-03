import type { SupabaseClient } from "@supabase/supabase-js";
import type { Note, NoteInput, NotePage } from "../schemas/notes.js";

interface NoteRow {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

const NOTE_COLUMNS = "id,title,content,created_at,updated_at";
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function toNote(row: NoteRow): Note {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createNote(
  client: SupabaseClient,
  ownerId: string,
  input: NoteInput,
): Promise<Note> {
  const { data, error } = await client
    .from("notes")
    .insert({
      owner_id: ownerId,
      title: input.title,
      content: input.content,
    })
    .select(NOTE_COLUMNS)
    .single();

  if (error) {
    throw error;
  }
  if (!data) {
    throw new Error("The database did not return the created note.");
  }

  return toNote(data);
}

export async function listNotes(
  client: SupabaseClient,
  limit: number,
  offset: number,
): Promise<NotePage> {
  const { data, error, count } = await client
    .from("notes")
    .select(NOTE_COLUMNS, { count: "exact" })
    .order("created_at", { ascending: true })
    .order("id", { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    throw error;
  }
  if (data === null || count === null) {
    throw new Error("The database did not return the requested note page.");
  }

  return {
    data: data.map(toNote),
    total: count,
    limit,
    offset,
  };
}

export async function getNote(
  client: SupabaseClient,
  noteId: string,
): Promise<Note | null> {
  if (!UUID_PATTERN.test(noteId)) {
    return null;
  }

  const { data, error } = await client
    .from("notes")
    .select(NOTE_COLUMNS)
    .eq("id", noteId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? toNote(data) : null;
}

export async function replaceNote(
  client: SupabaseClient,
  noteId: string,
  input: NoteInput,
): Promise<Note | null> {
  if (!UUID_PATTERN.test(noteId)) {
    return null;
  }

  const { data, error } = await client
    .from("notes")
    .update({
      title: input.title,
      content: input.content,
    })
    .eq("id", noteId)
    .select(NOTE_COLUMNS)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? toNote(data) : null;
}

export async function deleteNote(
  client: SupabaseClient,
  noteId: string,
): Promise<boolean> {
  if (!UUID_PATTERN.test(noteId)) {
    return false;
  }

  const { data, error } = await client
    .from("notes")
    .delete()
    .eq("id", noteId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data !== null;
}
