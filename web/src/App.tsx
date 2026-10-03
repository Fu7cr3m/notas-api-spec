import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/AuthProvider';
import ForgotPasswordPage from './auth/ForgotPasswordPage';
import LoginPage from './auth/LoginPage';
import ResetPasswordPage from './auth/ResetPasswordPage';
import SignUpPage from './auth/SignUpPage';
import { LoadingState } from './components/States';
import NewNotePage from './notes/NewNotePage';
import NoteDetailPage from './notes/NoteDetailPage';
import NotesListPage from './notes/NotesListPage';

type GuardMode = 'private' | 'public' | 'recovery';

function Guard({ mode }: { mode: GuardMode }) {
  const { status } = useAuth();
  if (status === 'loading') return <LoadingState />;
  if (mode === 'recovery') {
    if (status === 'recovery') return <Outlet />;
    return <Navigate to={status === 'authenticated' ? '/' : '/login'} replace />;
  }
  if (status === 'recovery') return <Navigate to="/reset-password" replace />;
  if (mode === 'private') {
    return status === 'authenticated' ? <Outlet /> : <Navigate to="/login" replace />;
  }
  return status === 'authenticated' ? <Navigate to="/" replace /> : <Outlet />;
}

function Layout() {
  const { status, signOut } = useAuth();
  return (
    <>
      <header className="app-header">
        <h1>Notas</h1>
        {status === 'authenticated' && (
          <button type="button" className="secondary" onClick={() => void signOut()}>
            Sair
          </button>
        )}
      </header>
      <main>
        <Outlet />
      </main>
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route element={<Guard mode="public" />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Route>
        <Route element={<Guard mode="recovery" />}>
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>
        <Route element={<Guard mode="private" />}>
          <Route path="/" element={<NotesListPage />} />
          <Route path="/notes/new" element={<NewNotePage />} />
          <Route path="/notes/:id" element={<NoteDetailPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
