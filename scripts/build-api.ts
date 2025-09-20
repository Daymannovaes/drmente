#!/usr/bin/env tsx

import { execSync } from 'child_process';
import { existsSync, writeFileSync, unlinkSync } from 'fs';
import { resolve, join, basename } from 'path';

/**
 * Build script for API endpoints using Vite
 * Usage: tsx scripts/build-api.ts [api-file-path]
 * Example: tsx scripts/build-api.ts api/search-patient/index.ts
 */

function buildAPI(apiPath: string): void {
  const fullPath = resolve(process.cwd(), apiPath);
  
  if (!existsSync(fullPath)) {
    console.error(`❌ API file not found: ${fullPath}`);
    process.exit(1);
  }

  console.log(`🔨 Building API: ${apiPath}`);

  try {
    // Create a temporary Vite config for this specific file
    const configContent = `
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, '${apiPath}'),
      formats: ['es'],
      fileName: () => '${basename(apiPath, '.ts')}.bundled.js'
    },
    rollupOptions: {
      external: ['@vercel/node'],
      output: {
        dir: 'api-bundled',
        entryFileNames: '[name].bundled.js',
        format: 'es'
      }
    },
    outDir: 'api-bundled',
    emptyOutDir: false,
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
`;

    const tempConfigPath = join(process.cwd(), 'vite.temp.config.ts');
    writeFileSync(tempConfigPath, configContent);

    // Run Vite build
    execSync(`npx vite build --config ${tempConfigPath}`, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });

    // Clean up temp config
    unlinkSync(tempConfigPath);

    const outputPath = join(process.cwd(), 'api-bundled', `${basename(apiPath, '.ts')}.bundled.js`);
    console.log(`✅ Built successfully: ${outputPath}`);

  } catch (error: any) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

function buildAllAPIs(): void {
  console.log('🔨 Building all API endpoints...');
  
  try {
    execSync('npm run build:api', { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log('✅ All APIs built successfully!');
  } catch (error: any) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Usage:');
  console.log('  tsx scripts/build-api.ts                    # Build all APIs');
  console.log('  tsx scripts/build-api.ts <api-file-path>     # Build specific API');
  console.log('');
  console.log('Examples:');
  console.log('  tsx scripts/build-api.ts api/search-patient/index.ts');
  console.log('  tsx scripts/build-api.ts api/create-patient/index.ts');
  process.exit(1);
}

const apiPath = args[0];

if (apiPath === 'all' || apiPath === '*') {
  buildAllAPIs();
} else {
  buildAPI(apiPath);
}
