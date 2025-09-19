# Memed SDK

A TypeScript SDK for integrating with the Memed API.

## Installation

```bash
npm install @drmente/memed-sdk
```

## Usage

```typescript
import { MemedClient, timeoutSignal, type PatientCreate } from '@drmente/memed-sdk';

// Initialize the client
const memed = new MemedClient({ 
  token: process.env.MEMED_TOKEN! 
});

// Create a timeout signal for requests
const { signal } = timeoutSignal(8000);

// Create a new patient
const newPatient: PatientCreate = {
  full_name: "John Doe",
  cpf: "12345678901",
  use_social_name: false,
  social_name: null,
  birthdate: "1990-01-01",
  without_cpf: false,
  gender_identity_id: null,
  phone: null,
  email: null,
  gender: null,
  address: null,
  conditions: [],
};

try {
  const created = await memed.createPatient(newPatient, { signal });
  console.log('Patient created:', created);
  
  const results = await memed.searchPatients({ 
    filter: "12345678901", 
    size: 5, 
    page: 1 
  }, { signal });
  console.log('Search results:', results);
} catch (error) {
  console.error('Error:', error);
}
```

## API Reference

### MemedClient

The main client class for interacting with the Memed API.

#### Constructor Options

- `token` (string): JWT token for authentication (required)
- `baseURL` (string): API base URL (defaults to "https://gateway.memed.com.br")
- `defaultHeaders` (Record<string, string>): Additional default headers

#### Methods

- `createPatient(patient: PatientCreate, options?: RequestOptions): Promise<Patient>`
- `searchPatients(params: PatientSearchParams, options?: RequestOptions): Promise<Paginated<Patient>>`

### Types

- `PatientCreate`: Interface for creating a new patient
- `Patient`: Complete patient interface
- `PatientSearchParams`: Parameters for patient search
- `Paginated<T>`: Generic pagination wrapper
- `RequestOptions`: Request configuration options

## Error Handling

The SDK throws `MemedError` instances for API errors, which include:
- `status`: HTTP status code
- `statusText`: HTTP status text
- `url`: Request URL
- `requestBody`: Original request body
- `response`: API response data

## License

MIT
