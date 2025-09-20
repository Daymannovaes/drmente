import { buildUrl, requestJSON } from "./http.js";
import type { RequestOptions, Paginated } from "./models/common.js";
import type { PatientCreate, Patient, PatientSearchParams, PatientAnnotationCreate, PatientAnnotation } from "./models/patient.js";

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
  async createPatient(patient: PatientCreate, opts: RequestOptions = {}): Promise<Patient> {
    const url = buildUrl(this.baseURL, "/v2/patient-management/patients");
    return requestJSON<Patient>(url, {
      method: "POST",
      signal: opts.signal,
      headers: { ...this.defaultHeaders, ...(opts.headers ?? {}), "x-token": this.token },
      body: JSON.stringify(patient),
    });
  }

  async createPatientAnnotation(annotation: PatientAnnotationCreate, opts: RequestOptions = {}): Promise<PatientAnnotation> {
    const url = buildUrl(this.baseURL, `/v2/patient-management/patients-annotations`);
    return requestJSON<PatientAnnotation>(url, {
      method: "POST",
      signal: opts.signal,
      headers: { ...this.defaultHeaders, ...(opts.headers ?? {}), "x-token": this.token },
      body: JSON.stringify(annotation),
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
}
