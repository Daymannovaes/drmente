# API Build Process

This project includes automated bundling for API endpoints to create single-file versions that include all dependencies.

## Available Build Commands

### Build All APIs
```bash
npm run build:api
```
This builds all API endpoints defined in `vite.api.config.ts` and outputs them to the `api-bundled/` directory.

### Build Single API
```bash
npm run build:api:single api/search-patient/index.ts
```
This builds a specific API endpoint and outputs it to the `api-bundled/` directory.

## Build Configuration

The build process uses Vite with the following configuration:

- **Format**: ES modules
- **Target**: Node.js 18+
- **External**: `@vercel/node` (kept as external dependency)
- **Minification**: Disabled for better debugging
- **Source maps**: Disabled for smaller output

## Output Structure

```
api-bundled/
├── search-patient.bundled.js
└── create-patient.bundled.js
```

## How It Works

1. **Dependency Resolution**: The build process resolves all imports from the `memed-sdk` and inlines them into the final bundle
2. **External Dependencies**: Only `@vercel/node` is kept as an external dependency since it's provided by the Vercel runtime
3. **Single File Output**: Each API endpoint becomes a self-contained JavaScript file with all SDK code included

## Usage in Production

The bundled files can be deployed directly to Vercel or any Node.js environment. They contain all the necessary code from the memed-sdk, making them completely self-contained.

## Development Workflow

1. Make changes to your API files in the `api/` directory
2. Run `npm run build:api:single api/your-endpoint/index.ts` to build a specific endpoint
3. Or run `npm run build:api` to build all endpoints
4. The bundled files will be available in the `api-bundled/` directory

## Troubleshooting

- **Import Errors**: Make sure all imports in your API files use relative paths to the memed-sdk
- **Build Failures**: Check that the API file path is correct and the file exists
- **Runtime Errors**: Ensure the bundled file is compatible with your deployment environment
