import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: {
        'search-patient': resolve(__dirname, 'src-api/search-patient/index.ts'),
        'create-patient': resolve(__dirname, 'src-api/create-patient/index.ts'),
        'webhook-formshare': resolve(__dirname, 'src-api/webhook-formshare/index.ts'),
      },
      formats: ['es'],
      fileName: (format, entryName) => `${entryName}.js`
    },
    rollupOptions: {
      external: ['@vercel/node'],
      output: {
        dir: 'api',
        entryFileNames: '[name].js',
        format: 'es'
      }
    },
    outDir: 'api',
    emptyOutDir: true,
    target: 'node18',
    minify: false,
    sourcemap: false
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      'memed-sdk': resolve(__dirname, 'memed-sdk/src')
    }
  }
});
