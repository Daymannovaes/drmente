# Memed SDK API Endpoints

This project includes Vercel serverless functions that provide API endpoints for the Memed SDK functionality.

## Environment Setup

1. Copy `env.example` to `.env.local`:
   ```bash
   cp env.example .env.local
   ```

2. Add your Memed token to `.env.local`:
   ```
   MEMED_TOKEN=your_actual_memed_jwt_token_here
   ```

## API Endpoints

### Search Patients

**Endpoint:** `GET/POST /api/search-patient`

Search for patients using CPF or name.

#### GET Request
```
GET /api/search-patient?filter=12345678901&size=5&page=1
```

#### POST Request
```json
POST /api/search-patient
Content-Type: application/json

{
  "filter": "12345678901",
  "size": 5,
  "page": 1
}
```

#### Parameters
- `filter` (required): CPF or patient name to search for
- `size` (optional): Number of results per page (1-100, default: 5)
- `page` (optional): Page number (default: 1)

#### Response
```json
{
  "success": true,
  "data": {
    "data": [...],
    "current_page": 1,
    "per_page": 5,
    "total_items": 10
  },
  "meta": {
    "filter": "12345678901",
    "size": 5,
    "page": 1
  }
}
```

### Create Patient

**Endpoint:** `POST /api/create-patient`

Create a new patient.

#### Request
```json
POST /api/create-patient
Content-Type: application/json

{
  "full_name": "John Doe",
  "cpf": "12345678901",
  "use_social_name": false,
  "social_name": null,
  "birthdate": "1990-01-01",
  "without_cpf": false,
  "gender_identity_id": null,
  "phone": "+1234567890",
  "email": "john@example.com",
  "gender": "M",
  "address": null,
  "conditions": []
}
```

#### Required Fields
- `full_name`: Patient's full name

#### Optional Fields
- `cpf`: Patient's CPF
- `use_social_name`: Whether to use social name
- `social_name`: Patient's social name
- `birthdate`: Birth date in YYYY-MM-DD format
- `without_cpf`: Whether patient doesn't have CPF
- `gender_identity_id`: Gender identity ID
- `phone`: Phone number
- `email`: Email address
- `gender`: Gender
- `address`: Address object
- `conditions`: Array of medical conditions

#### Response
```json
{
  "success": true,
  "data": {
    "id": "patient-id",
    "uuid": "patient-uuid",
    "full_name": "John Doe",
    "cpf": "12345678901",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "message": "Patient created successfully"
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error type",
  "message": "Human-readable error message",
  "details": {
    "status": 400,
    "statusText": "Bad Request",
    "url": "https://api.example.com/endpoint"
  }
}
```

## CORS

All endpoints include CORS headers allowing cross-origin requests from any domain.

## Deployment

Deploy to Vercel:

```bash
vercel --prod
```

Make sure to set the `MEMED_TOKEN` environment variable in your Vercel project settings.
