export interface PatientCreate {
  full_name: string;
  cpf?: string;
  use_social_name: boolean;
  social_name?: string | null;
  birthdate?: string; // YYYY-MM-DD
  without_cpf: boolean;
  gender_identity_id?: number | null;
  phone?: string | null;
  email?: string | null;
  gender?: string | null;
  address?: unknown;
  conditions?: unknown[];
}

export interface Patient extends PatientCreate {
  id: string;
  created_at?: string;
  patient_legacy_id: number;
  doctor_legacy_id: number;
  rg?: string
  birthdate: string;
  is_mother_unknown: boolean;
  mother_name?: string
  phone_type_id: number;
  address: PatientAddress;
  emergency_contacts: unknown[];
  allergies: unknown[];
  conditions: unknown[];
  patient_guardian?: unknown;
  partner_id?: unknown;
  external_i?: unknown;
}

export interface PatientAddress {
  city? : string;
  state?: string;
  zip_code?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
}

export interface PatientSearchParams {
  filter: string; // e.g., CPF or name
  size?: number; // default 5
  page?: number; // default 1
}
export interface PatientAnnotationCreate {
  content: string;
  patient_id: string;
}
export interface PatientAnnotation extends PatientAnnotationCreate {
  id: string;
  created_at: string;
  updated_at: string;

  status: number; // não sei o que é isso, na API sempre retorna 1
}
