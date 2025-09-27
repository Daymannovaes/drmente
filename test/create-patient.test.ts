import { describe, it, expect, vi, beforeEach, afterAll, afterEach, beforeAll } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import type { Patient } from '@/memed-sdk';
import handler from '@/pages/api/create-patient/index';

const server = setupServer()

describe('Create Patient API', () => {
  let mockReq: Partial<VercelRequest>;
  let mockRes: Partial<VercelResponse>;
  let mockJsonResponse: unknown;
  let mockStatus: unknown;

  beforeAll(() => server.listen())
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())

  beforeEach(() => {
    mockJsonResponse = vi.fn();
    mockStatus = vi.fn().mockReturnValue({ json: mockJsonResponse });

    mockReq = {
      method: 'POST',
      body: {},
      query: { token: 'test-auth-token' }
    };

    mockRes = {
      status: mockStatus as ((statusCode: number) => VercelResponse),
      json: mockJsonResponse as ((jsonBody: unknown) => VercelResponse),
      setHeader: vi.fn(),
      end: vi.fn()
    };

    vi.clearAllMocks();
  });

  describe('Method validation', () => {

    it('should reject non-POST methods', async () => {
      mockReq.method = 'GET';

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockStatus).toHaveBeenCalledWith(405);
      expect(mockJsonResponse).toHaveBeenCalledWith({
        error: 'Method not allowed',
        message: 'Only POST method is supported'
      });
    });
  });

  describe('Patient data validation', () => {
    it('should reject request without full_name', async () => {
      mockReq.body = {};

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJsonResponse).toHaveBeenCalledWith({
        error: 'Bad request',
        message: 'full_name is required and must be a string'
      });
    });

    it('should reject request with non-string full_name', async () => {
      mockReq.body = { full_name: 123 };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJsonResponse).toHaveBeenCalledWith({
        error: 'Bad request',
        message: 'full_name is required and must be a string'
      });
    });

    it('should reject request with non-string cpf', async () => {
      mockReq.body = {
        full_name: 'John Doe',
        cpf: 12345678901
      };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJsonResponse).toHaveBeenCalledWith({
        error: 'Bad request',
        message: 'cpf must be a string'
      });
    });

    it('should reject request with non-string birthdate', async () => {
      mockReq.body = {
        full_name: 'John Doe',
        birthdate: 19900101
      };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJsonResponse).toHaveBeenCalledWith({
        error: 'Bad request',
        message: 'birthdate must be a string in YYYY-MM-DD format'
      });
    });

    it('should reject request with non-string email', async () => {
      mockReq.body = {
        full_name: 'John Doe',
        email: 123
      };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJsonResponse).toHaveBeenCalledWith({
        error: 'Bad request',
        message: 'email must be a string'
      });
    });

    it('should reject request with non-string phone', async () => {
      mockReq.body = {
        full_name: 'John Doe',
        phone: 1234567890
      };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJsonResponse).toHaveBeenCalledWith({
        error: 'Bad request',
        message: 'phone must be a string'
      });
    });
  });

  describe('Successful patient creation', () => {
    it('should create patient with valid data', async () => {
      const mockPatient: Partial<Patient> = {
        id: 'patient-123',
        full_name: 'John Doe',
        email: 'john@example.com',
        created_at: '2024-01-01T00:00:00Z'
      };

      mockReq.body = {
        full_name: 'John Doe',
        email: 'john@example.com',
        phone: '+55 11 99999-9999'
      };

      server.use(
        http.post('https://gateway.memed.com.br/v2/patient-management/patients', () => {
          return HttpResponse.json(mockPatient)
        })
      )


      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJsonResponse).toHaveBeenCalledWith({
        success: true,
        data: mockPatient,
        message: 'Patient created successfully'
      });
    });
  });
});
