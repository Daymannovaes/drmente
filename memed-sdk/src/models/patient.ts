export interface PatientCreate {
  full_name: string;
  cpf?: string;
  use_social_name?: boolean;
  social_name?: string | null;
  birthdate?: string; // YYYY-MM-DD
  without_cpf?: boolean;
  gender_identity_id?: number | null;
  phone?: string | null;
  email?: string | null;
  gender?: string | null;
  address?: unknown;
  conditions?: unknown[];
}

export interface Patient extends PatientCreate {
  id: string;
  created_at: string;
  updated_at: string;
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
