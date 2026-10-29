import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { defineConfig } from 'vitest/config';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
    },
  },
  server: {
    // Em desenvolvimento, /api vai para a API Spring Boot (no Docker Compose o endereço vem de VITE_API_PROXY)
    proxy: {
      '/api': process.env.VITE_API_PROXY ?? 'http://localhost:8080',
    },
  },
  test: {
    // Testes de componentes rodam num DOM simulado; o setup liga os matchers do Testing Library
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
