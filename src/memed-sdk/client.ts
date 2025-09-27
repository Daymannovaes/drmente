import { buildUrl, requestJSON } from "./http";
import type { RequestOptions, Paginated, Response } from "./models/common";
import type { PatientCreate, Patient, PatientSearchParams, PatientAnnotationCreate, PatientAnnotation } from "./models/patient";

export interface MemedClientOptions {
  token: string; // JWT for x-token header
  baseURL?: string; // defaults to https://gateway.memed.com.br
  defaultHeaders?: Record<string, string>;
}

export class MemedClient {
  private token: string;
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor({ token, baseURL = "https://gateway.memed.com.br", defaultHeaders = {} }: MemedClientOptions) {
    if (!token) throw new Error("MemedClient: `token` is required");
    this.token = token;
    this.baseURL = baseURL;
    this.defaultHeaders = {
      accept: "application/json",
      "content-type": "application/json",
      ...defaultHeaders,
    };
  }

  /** Create a patient (POST /v2/patient-management/patients) */
  async createPatient(patient: PatientCreate, opts: RequestOptions = {}): Promise<Response<Patient>> {
    const url = buildUrl(this.baseURL, "/v2/patient-management/patients");
    return requestJSON<Response<Patient>>(url, {
      method: "POST",
      signal: opts.signal,
      headers: { ...this.defaultHeaders, ...(opts.headers ?? {}), "x-token": this.token },
      body: JSON.stringify(patient),
    });
  }

  async createPatientAnnotation(annotation: PatientAnnotationCreate, opts: RequestOptions = {}): Promise<Response<PatientAnnotation>> {
    const url = buildUrl(this.baseURL, `/v2/patient-management/patients-annotations`);
    return requestJSON<Response<PatientAnnotation>>(url, {
      method: "POST",
      signal: opts.signal,
      headers: { ...this.defaultHeaders, ...(opts.headers ?? {}), "x-token": this.token },
      body: JSON.stringify(annotation, null, 2),
    });
  }

  /** Search patients (GET /v2/patient-management/patients/search) */
  async searchPatients(params: PatientSearchParams, opts: RequestOptions = {}): Promise<Paginated<Patient>> {
    const { filter, size = 5, page = 1 } = params;
    if (!filter) throw new Error("searchPatients: `filter` is required");

    const url = buildUrl(this.baseURL, "/v2/patient-management/patients/search", { filter, size, page });
    return requestJSON<Paginated<Patient>>(url, {
      method: "GET",
      signal: opts.signal,
      headers: { ...this.defaultHeaders, ...(opts.headers ?? {}), "x-token": this.token },
    });
  }

  /** Find a patient by CPF (GET /v2/patient-management/patients/search) */
  async findPatientByCpf(cpf: string, opts: RequestOptions = {}): Promise<Patient | null> {
    const patients = await this.searchPatients({ filter: cpf, size: 10, page: 1 }, opts);

    return patients.data.find(patient => patient.cpf === cpf) || null;
  }
}
