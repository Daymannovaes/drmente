import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
  define: {
    'process.env.MEMED_TOKEN': '"test-memed-token"',
    'process.env.AUTH_API_TOKEN': '"test-auth-token"'
  }
});
