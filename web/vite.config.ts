import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const proxy = {
  '/api': {
    target: 'http://127.0.0.1:3000',
    changeOrigin: true,
    rewrite: (path: string) => path.replace(/^\/api/, ''),
  },
};

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, host: '127.0.0.1', proxy },
  preview: { port: 5173, host: '127.0.0.1', proxy },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['tests/setup.ts'],
    env: {
      VITE_SUPABASE_URL: 'http://127.0.0.1:54321',
      VITE_SUPABASE_ANON_KEY: 'test-public-key',
      VITE_API_BASE_URL: '/api',
    },
  },
});
