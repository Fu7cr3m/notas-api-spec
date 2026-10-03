import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './auth/AuthProvider';
import { isAuthConfigured } from './auth/supabase';
import './styles.css';

const root = createRoot(document.getElementById('root')!);

if (!isAuthConfigured()) {
  root.render(
    <p role="alert">Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY em web/.env (veja web/.env.example).</p>,
  );
} else {
  root.render(
    <StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </StrictMode>,
  );
}
