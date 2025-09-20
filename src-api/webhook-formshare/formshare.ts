export interface FormShareQuestion {
  id: string;
  type: 'name' | 'phone' | 'email' | 'text' | 'select'
  | 'cpf'       // ??
  | 'birthdate'; // ??
  question: string;
  answer: string;
}

export interface FormShareResponse {
  formId: string;
  formName: string;
  formUrl: string;
  submissionId: string;
  createdAt: string; // ISO 8601 date string
  data: FormShareQuestion[];
}

export type FormShareAnswers = {
  [K in FormShareQuestion['type']]: FormShareQuestion & { type: K };
};

export function getAnswersByType(response: FormShareResponse, type: FormShareQuestion['type']): string[] {
  return response.data
    .filter(q => q.type === type)
    .map(q => q.answer);
}

export function getAnswerByQuestionPattern(response: FormShareResponse, pattern: string | RegExp): string | undefined {
  const question = response.data.find(q => {
    if (typeof pattern === 'string') {
      return q.question.includes(pattern);
    }
    return pattern.test(q.question);
  });
  return question?.answer;
}

export interface PersonalData {
  name: string;
  phone: string;
  email: string;
  cpf?: string;
  birthdate?: string;
}

/**
 * Pre-consultation specific types based on the example
 */
export interface PreConsultaData {
  patientName: string;
  phone: string;
  email: string;
  reasonForRenewal: string;
  diagnosis: string;
  currentMedication: string;
  medicationDuration: string;
  recentFeelings: string;
  consultationType: 'Regular consultations' | 'Apenas renovações';
  symptomStatus: 'Melhoraram significativamente' | 'Estáveis' | 'Pioraram';
  hasSeriousPsychiatricCondition: 'Sim' | 'Não';
  hasSelfHarmThoughts: 'Sim' | 'Não';
  psychiatricHospitalization: 'Sim' | 'Não';
  usingControlledMedication: 'Sim' | 'Não';
  treatmentSatisfaction: 'Satisfeito' | 'Gostaria de mudar';
  onlyRenewalGoal: 'Sim' | 'Não';
  canProvidePrescription: 'Sim' | 'Não';
  understandsLimitations: 'Sim' | 'Não';
}

export function extractPersonalData(response: FormShareResponse): PersonalData {
  return {
    name: getAnswersByType(response, 'name')[0],
    phone: getAnswersByType(response, 'phone')[0],
    email: getAnswersByType(response, 'email')[0],

    cpf: getAnswersByType(response, 'cpf')[0],
    birthdate: getAnswersByType(response, 'birthdate')[0],
  };
}

/**
 * Helper function to extract structured data from FormShare response
 */
export function extractPreConsultaData(response: FormShareResponse): PreConsultaData {
  const getAnswer = (pattern: string | RegExp) => getAnswerByQuestionPattern(response, pattern) || '';

  return {
    patientName: getAnswer('nome'),
    phone: getAnswer('telefone'),
    email: getAnswer('email'),
    reasonForRenewal: getAnswer('motivo para renovar'),
    diagnosis: getAnswer('diagnóstico'),
    currentMedication: getAnswer('medicamento'),
    medicationDuration: getAnswer('quanto tempo'),
    recentFeelings: getAnswer('sentindo'),
    consultationType: getAnswer('consultas médicas regulares') as PreConsultaData['consultationType'],
    symptomStatus: getAnswer('avaliaria seus sintomas') as PreConsultaData['symptomStatus'],
    hasSeriousPsychiatricCondition: getAnswer('transtorno bipolar') as PreConsultaData['hasSeriousPsychiatricCondition'],
    hasSelfHarmThoughts: getAnswer('automutilação') as PreConsultaData['hasSelfHarmThoughts'],
    psychiatricHospitalization: getAnswer('hospitalizado') as PreConsultaData['psychiatricHospitalization'],
    usingControlledMedication: getAnswer('medicamento controlado') as PreConsultaData['usingControlledMedication'],
    treatmentSatisfaction: getAnswer('satisfeito com seu tratamento') as PreConsultaData['treatmentSatisfaction'],
    onlyRenewalGoal: getAnswer('único objetivo') as PreConsultaData['onlyRenewalGoal'],
    canProvidePrescription: getAnswer('cópia da sua última receita') as PreConsultaData['canProvidePrescription'],
    understandsLimitations: getAnswer('entende que este serviço') as PreConsultaData['understandsLimitations'],
  };
}
