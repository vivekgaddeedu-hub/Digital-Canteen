import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@prisma/client': path.resolve(__dirname, './src/types/database.ts'),
    },
  },
});
