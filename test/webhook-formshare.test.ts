import { describe, it, expect, vi, beforeEach, afterAll, afterEach, beforeAll } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import type { Paginated, Patient, PatientAnnotation, Response } from 'memed-sdk/src';
import handler from '../src-api/webhook-formshare/index';
import type { FormShareResponse } from '../src-api/webhook-formshare/formshare';

const server = setupServer()

describe('Webhook FormShare API', () => {
  let mockReq: Partial<VercelRequest>;
  let mockRes: Partial<VercelResponse>;
  let mockJsonResponse: any;
  let mockStatus: any;

  beforeAll(() => server.listen({
    onUnhandledRequest: 'error'
  }))
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())

  beforeEach(() => {
    mockJsonResponse = vi.fn();
    mockStatus = vi.fn().mockReturnValue({ json: mockJsonResponse, end: vi.fn() });

    mockReq = {
      method: 'POST',
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
    it('should reject non-POST methods', async () => {
      mockReq.method = 'GET';

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockStatus).toHaveBeenCalledWith(405);
    });
  });

  describe('FormShare data validation', () => {
    it('should reject request without formId', async () => {
      mockReq.body = {
        submissionId: 'sub-123',
        data: []
      };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it('should reject request without submissionId', async () => {
      mockReq.body = {
        formId: 'form-123',
        data: []
      };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it('should reject request without data', async () => {
      mockReq.body = {
        formId: 'form-123',
        submissionId: 'sub-123'
      };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockStatus).toHaveBeenCalledWith(400);
    });
  });

  describe('Successful webhook processing', () => {
    it('should handle patient found', async () => {
      const mockFormShareData: FormShareResponse = {
        formId: 'form_cmfly6p6q0003ob39pv5mvisq',
        formName: 'Pré consulta 2',
        formUrl: 'https://formshare.ai/forms/r/cmfly6p6q0003ob39pv5mvisq',
        createdAt: '2025-01-01',
        submissionId: 'submission_a7j6oilfeoildewktlzg69o2',
        data: [
          {
            id: 'question_ptcpefw1ljuhnx7niz5iys6x',
            type: 'name',
            question: 'Qual é o seu nome?',
            answer: 'João Silva'
          },
          {
            id: 'question_j0gdviy7b657lwnyoq93rgxv',
            type: 'phone',
            question: 'Qual é seu telefone?',
            answer: '+55 31 98312222'
          },
          {
            id: 'question_xqbf8zwi77129anpswt3op9o',
            type: 'email',
            question: 'Qual é seu email?',
            answer: 'joao@gmail.com'
          },
          {
            id: 'question_xqbf8zwi77129anpswt3op9o',
            type: 'text',
            question: 'Qual é seu CPF?',
            answer: '12345678900'
          }
        ]
      };

      const mockSearchResults: Paginated<Partial<Patient>> = {
        data: [
          {
            id: 'patient-123',
            full_name: 'João Silva',
            email: 'joao@gmail.com',
            cpf: '12345678900'
          }
        ],
        current_page: 1,
        per_page: 10,
        total_items: 1
      };

      mockReq.body = mockFormShareData;

      // Mock both Memed API and ntfy calls
      server.use(
        http.get('https://gateway.memed.com.br/v2/patient-management/patients/search', () => {
          return HttpResponse.json(mockSearchResults)
        }),
        http.post('https://gateway.memed.com.br/v2/patient-management/patients-annotations', () => {
          return HttpResponse.json({ ok: true })
        }),
        http.post('https://ntfy.sh/drmente-prod-grafqk0d37b5', () => {
          return HttpResponse.json({ ok: true })
        })
      )

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJsonResponse).toHaveBeenCalledWith({
        success: true,
        message: 'Webhook processed successfully',
        patientId: 'patient-123',
        foundPatient: true,
      });
    });

    it('should handle patient found but with wrong CPF', async () => {
      const mockFormShareData: FormShareResponse = {
        formId: 'form_cmfly6p6q0003ob39pv5mvisq',
        formName: 'Pré consulta 2',
        formUrl: 'https://formshare.ai/forms/r/cmfly6p6q0003ob39pv5mvisq',
        createdAt: '2025-01-01',
        submissionId: 'submission_a7j6oilfeoildewktlzg69o2',
        data: [
          {
            id: 'question_ptcpefw1ljuhnx7niz5iys6x',
            type: 'name',
            question: 'Qual é o seu nome?',
            answer: 'João Silva'
          },
          {
            id: 'question_j0gdviy7b657lwnyoq93rgxv',
            type: 'phone',
            question: 'Qual é seu telefone?',
            answer: '+55 31 98312222'
          },
          {
            id: 'question_xqbf8zwi77129anpswt3op9o',
            type: 'email',
            question: 'Qual é seu email?',
            answer: 'joao@gmail.com'
          },
          {
            id: 'question_xqbf8zwi77129anpswt3op9o',
            type: 'text',
            question: 'Qual é seu CPF?',
            answer: '12345678900'
          }
        ]
      };

      const mockSearchResults: Paginated<Partial<Patient>> = {
        data: [
          {
            id: 'patient-123',
            full_name: 'João Silva',
            email: 'joao@gmail.com',
            cpf: '98765432100'
          }
        ],
        current_page: 1,
        per_page: 10,
        total_items: 1
      };

      mockReq.body = mockFormShareData;

      // Mock both Memed API and ntfy calls
      server.use(
        http.get('https://gateway.memed.com.br/v2/patient-management/patients/search', () => {
          return HttpResponse.json(mockSearchResults)
        }),
        // in the case the response is a person that exists but cpf doesn't match the one sent, we should create a new one
        http.post('https://gateway.memed.com.br/v2/patient-management/patients', () => {
          return HttpResponse.json<Response<Partial<Patient>>>({ data: { id: 'patient-created-123' } })
        }),
        http.post('https://gateway.memed.com.br/v2/patient-management/patients-annotations', () => {
          return HttpResponse.json<Response<Partial<PatientAnnotation>>>({ data: { id: 'patient-annotation-created-123' } })
        }),
        http.post('https://ntfy.sh/drmente-prod-grafqk0d37b5', () => {
          return HttpResponse.json({ ok: true })
        })
      )

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJsonResponse).toHaveBeenCalledWith({
        success: true,
        message: 'Webhook processed successfully',
        patientId: 'patient-created-123',
        foundPatient: true,
      });
    });

    it('should handle no patients found', async () => {
      const mockFormShareData = {
        formId: 'form_cmfly6p6q0003ob39pv5mvisq',
        submissionId: 'submission_a7j6oilfeoildewktlzg69o2',
        data: [
          {
            id: 'question_ptcpefw1ljuhnx7niz5iys6x',
            type: 'name',
            question: 'Qual é o seu nome?',
            answer: 'João Silva'
          }
        ]
      };

      const mockEmptyResults: Paginated<Patient> = {
        data: [],
        current_page: 1,
        per_page: 10,
        total_items: 0
      };

      mockReq.body = mockFormShareData;

      server.use(
        http.get('https://gateway.memed.com.br/v2/patient-management/patients/search', () => {
          return HttpResponse.json(mockEmptyResults)
        }),
        http.post('https://gateway.memed.com.br/v2/patient-management/patients', () => {
          return HttpResponse.json<Response<Partial<Patient>>>({ data: { id: 'patient-created-123' } })
        }),
        http.post('https://gateway.memed.com.br/v2/patient-management/patients-annotations', () => {
          return HttpResponse.json<Response<Partial<PatientAnnotation>>>({ data: { id: 'patient-annotation-created-123' } })
        }),
        http.post('https://ntfy.sh/drmente-prod-grafqk0d37b5', () => {
          return HttpResponse.json({ ok: true })
        })
      )

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJsonResponse).toHaveBeenCalledWith({
        success: true,
        message: 'Webhook processed successfully',
        patientId: 'patient-created-123',
        foundPatient: true
      });
    });
  });
});
