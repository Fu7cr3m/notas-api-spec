import { useNavigate } from 'react-router-dom';
import type { NoteInput } from '../api/types';
import { useAuth } from '../auth/AuthProvider';
import NoteForm from './NoteForm';

export default function NewNotePage() {
  const { notes } = useAuth();
  const navigate = useNavigate();

  async function create(input: NoteInput) {
    await notes.createNote(input);
    navigate('/', { state: { notice: 'Nota criada.' } });
  }

  return (
    <section>
      <h2>Nova nota</h2>
      <NoteForm onSubmit={create} onCancel={() => navigate('/')} />
    </section>
  );
}
