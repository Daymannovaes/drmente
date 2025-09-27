import type { VercelRequest, VercelResponse } from '@vercel/node';
import auth from '../auth';
import type { FormShareResponse, PersonalData } from './formshare';
import { extractPersonalData } from './formshare';
import { sendNtfy } from './ntfy';
import { MemedClient, MemedError, type Patient } from '@/memed-sdk';

function validate(req: VercelRequest, res: VercelResponse): boolean {
  // Only allow POST method for webhooks
  if (req.method !== 'POST') {
    res.status(405).json({
      error: 'Method not allowed',
      message: 'Only POST method is supported for webhooks'
    });
    return false;
  }

  const formShareData: FormShareResponse = req.body;

  if (!formShareData.formId || !formShareData.submissionId || !formShareData.data) {
    res.status(400).json({
      error: 'Bad request',
      message: 'Invalid FormShare response format'
    });
    return false;
  }
  return true;
}

async function findPatientOrCreate(personalData: PersonalData, memedClient: MemedClient): Promise<Patient> {
  const patient = personalData.cpf ? await memedClient.findPatientByCpf(personalData.cpf) : null;

  if (patient) {
    return patient;
  }

  const newPatient = await memedClient.createPatient({
    full_name: personalData.name,
    cpf: personalData.cpf,
    email: personalData.email,
    phone: personalData.phone,
    use_social_name: false,
    social_name: '',
    without_cpf: false
  });

  console.log('newPatient', newPatient);
  await memedClient.createPatientAnnotation({
    content: `Paciente criado por integração`,
    patient_id: newPatient.data.id
  });

  return newPatient.data;
}

async function createPatientAnnotation(patient: Patient, personalData: PersonalData, formShareData: FormShareResponse, memedClient: MemedClient) {
    await sendNtfy(`Paciente encontrado em Memed: ${patient.full_name} para ${personalData.name}, CPF: ${personalData.cpf}`);

    await memedClient.createPatientAnnotation({
      content: `
Resposta recebida no formulário para ${personalData.name}. Veja em https://formshare.ai/forms/r/${formShareData.formId}

Resposta do formulário:
${JSON.stringify(formShareData, null, 2)}
`,
      patient_id: patient.id
    });
}

async function editPatientAddress(patient: Patient, personalData: PersonalData, memedClient: MemedClient) {
  // @todo o endereço é necessário para gerar a prescrição
  // await memedClient.updatePatient({
  //   id: patient.id,
  //   address: personalData.address
  // });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!auth(req, res)) {
    return;
  }

  if (!validate(req, res)) {
    return;
  }

  try {
    const personalData: PersonalData = extractPersonalData(req.body);

    await sendNtfy(`Resposta recebida no formulário para ${personalData?.name}. Veja a resposta completa em https://formshare.ai/forms/r/cmfly6p6q0003ob39pv5mvisq`);

    const memedClient = new MemedClient({ token: process.env.MEMED_TOKEN! });

    const patient = await findPatientOrCreate(personalData, memedClient);

    if (patient) {
      await createPatientAnnotation(patient, personalData, req.body, memedClient);
    } else {
      await sendNtfy(`Paciente não encontrado em Memed para ${personalData.name}, CPF: ${personalData.cpf}`);
    }

    return res.status(200).json({
      success: true,
      message: 'Webhook processed successfully',
      foundPatient: Boolean(patient),
      patientId: patient?.id
    });

  } catch (error) {
    console.error('Error processing FormShare webhook:', error);
    console.error(JSON.stringify((error as MemedError).response, null, 2));

    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process webhook'
    });
  }
}
