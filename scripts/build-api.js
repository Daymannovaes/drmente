#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Build script for API endpoints using Vite
 * Usage: node scripts/build-api.js [api-file-path]
 * Example: node scripts/build-api.js api/search-patient/index.ts
 */

function buildAPI(apiPath) {
  const fullPath = path.resolve(process.cwd(), apiPath);
  
  if (!fs.existsSync(fullPath)) {
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
      fileName: () => '${path.basename(apiPath, '.ts')}.bundled.js'
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

    const tempConfigPath = path.join(process.cwd(), 'vite.temp.config.ts');
    fs.writeFileSync(tempConfigPath, configContent);

    // Run Vite build
    execSync(`npx vite build --config ${tempConfigPath}`, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });

    // Clean up temp config
    fs.unlinkSync(tempConfigPath);

    const outputPath = path.join(process.cwd(), 'api-bundled', `${path.basename(apiPath, '.ts')}.bundled.js`);
    console.log(`✅ Built successfully: ${outputPath}`);

  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

function buildAllAPIs() {
  console.log('🔨 Building all API endpoints...');
  
  try {
    execSync('npm run build:api', { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log('✅ All APIs built successfully!');
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Usage:');
  console.log('  node scripts/build-api.js                    # Build all APIs');
  console.log('  node scripts/build-api.js <api-file-path>     # Build specific API');
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/build-api.js api/search-patient/index.ts');
  console.log('  node scripts/build-api.js api/create-patient/index.ts');
  process.exit(1);
}

const apiPath = args[0];

if (apiPath === 'all' || apiPath === '*') {
  buildAllAPIs();
} else {
  buildAPI(apiPath);
}
