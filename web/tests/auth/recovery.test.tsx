import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../setup';
import { renderApp } from '../helpers';
import { createFakeSupabase, fakeSession } from '../state';

beforeEach(() => {
  server.use(
    http.get('/api/notes', () => HttpResponse.json({ data: [], total: 0, limit: 50, offset: 0 })),
  );
});

describe('recuperação de senha', () => {
  it('mostra a mesma mensagem neutra com sucesso ou erro do provedor', async () => {
    const messages: string[] = [];
    for (const error of [null, { message: 'User not found', status: 404 }]) {
      const fake = createFakeSupabase();
      fake.auth.resetPasswordForEmail.mockResolvedValue({ data: {}, error } as never);
      const { unmount } = renderApp('/forgot-password');
      const user = userEvent.setup();
      await user.type(await screen.findByLabelText('E-mail'), 'x@example.com');
      await user.click(screen.getByRole('button', { name: 'Enviar instruções' }));
      const status = await screen.findByRole('status');
      messages.push(status.textContent ?? '');
      expect(fake.auth.resetPasswordForEmail).toHaveBeenCalledWith('x@example.com', {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      unmount();
    }
    expect(messages[0]).toBe(messages[1]);
    expect(messages[0]).toMatch(/se o e-mail estiver cadastrado/i);
  });

  it('define nova senha após o evento de recuperação', async () => {
    const fake = createFakeSupabase();
    fake.auth.updateUser.mockImplementation(async () => {
      fake.emit('USER_UPDATED', fakeSession);
      return { data: { user: fakeSession.user }, error: null };
    });
    renderApp('/reset-password');
    await screen.findByRole('heading', { name: 'Entrar' });
    fake.emit('PASSWORD_RECOVERY', fakeSession);
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText('Nova senha'), 'novasenha123');
    await user.click(screen.getByRole('button', { name: 'Salvar nova senha' }));
    expect(await screen.findByRole('heading', { name: 'Minhas notas' })).toBeInTheDocument();
    expect(fake.auth.updateUser).toHaveBeenCalledWith({ password: 'novasenha123' });
  });
});

