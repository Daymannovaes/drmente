import { describe, it, expect, vi, beforeEach, afterAll, afterEach, beforeAll } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import type { Paginated, Patient } from 'memed-sdk/src';
import handler from '../src-api/search-patient/index';

const server = setupServer()

describe('Search Patient API', () => {
  let mockReq: Partial<VercelRequest>;
  let mockRes: Partial<VercelResponse>;
  let mockJsonResponse: any;
  let mockStatus: any;

  beforeAll(() => server.listen())
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())

  beforeEach(() => {
    mockJsonResponse = vi.fn();
    mockStatus = vi.fn().mockReturnValue({ json: mockJsonResponse, end: vi.fn() });

    mockReq = {
      method: 'GET',
      body: {},
      query: { token: 'test-auth-token' }
    };

    mockRes = {
      status: mockStatus,
      json: mockJsonResponse,
      setHeader: vi.fn(),
      end: vi.fn()
    };

    vi.clearAllMocks();
  });

  describe('Method validation', () => {
    it('should handle OPTIONS request', async () => {
      mockReq.method = 'OPTIONS';

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('should reject non-GET/POST methods', async () => {
      mockReq.method = 'PUT';

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockStatus).toHaveBeenCalledWith(405);
    });
  });

  describe('Search parameter validation', () => {
    it('should reject GET request without filter', async () => {
      mockReq.method = 'GET';
      mockReq.query = { token: 'test-auth-token' };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJsonResponse).toHaveBeenCalledWith({
        error: 'Bad request',
        message: 'Filter parameter is required'
      });
    });

    it('should reject POST request without filter', async () => {
      mockReq.method = 'POST';
      mockReq.body = {};

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it('should reject request with invalid size (too large)', async () => {
      mockReq.method = 'GET';
      mockReq.query = {
        token: 'test-auth-token',
        filter: 'John Doe',
        size: '101'
      };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockStatus).toHaveBeenCalledWith(400);
    });
  });

  describe('Successful patient search', () => {
    it('should search patients with GET request', async () => {
      const mockSearchResults: Paginated<Patient> = {
        data: [
          {
            id: 'patient-123',
            full_name: 'John Doe',
            email: 'john@example.com'
          }
        ],
        current_page: 1,
        per_page: 5,
        total_items: 1
      };

      mockReq.method = 'GET';
      mockReq.query = {
        token: 'test-auth-token',
        filter: 'John Doe',
        size: '5',
        page: '1'
      };

      server.use(
        http.get('https://gateway.memed.com.br/v2/patient-management/patients/search', () => {
          return HttpResponse.json(mockSearchResults)
        })
      )

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJsonResponse).toHaveBeenCalledWith({
        success: true,
        data: mockSearchResults,
        meta: {
          filter: 'John Doe',
          size: 5,
          page: 1
        }
      });
    });

    it('should search patients with POST request', async () => {
      const mockSearchResults: Paginated<Patient> = {
        data: [
          {
            id: 'patient-456',
            full_name: 'Jane Smith',
            email: 'jane@example.com'
          }
        ],
        current_page: 1,
        per_page: 10,
        total_items: 1
      };

      mockReq.method = 'POST';
      mockReq.body = {
        filter: 'Jane Smith',
        size: 10,
        page: 1
      };

      server.use(
        http.get('https://gateway.memed.com.br/v2/patient-management/patients/search', () => {
          return HttpResponse.json(mockSearchResults)
        })
      )

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJsonResponse).toHaveBeenCalledWith({
        success: true,
        data: mockSearchResults,
        meta: {
          filter: 'Jane Smith',
          size: 10,
          page: 1
        }
      });
    });

    it('should handle empty search results', async () => {
      const mockEmptyResults: Paginated<Patient> = {
        data: [],
        current_page: 1,
        per_page: 5,
        total_items: 0
      };

      mockReq.method = 'GET';
      mockReq.query = {
        token: 'test-auth-token',
        filter: 'NonExistentPatient'
      };

      server.use(
        http.get('https://gateway.memed.com.br/v2/patient-management/patients/search', () => {
          return HttpResponse.json(mockEmptyResults)
        })
      )

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJsonResponse).toHaveBeenCalledWith({
        success: true,
        data: mockEmptyResults,
        meta: {
          filter: 'NonExistentPatient',
          size: 5,
          page: 1
        }
      });
    });
  });
});
