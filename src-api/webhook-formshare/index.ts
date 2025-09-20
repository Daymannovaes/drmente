import type { VercelRequest, VercelResponse } from '@vercel/node';
import auth from '../auth';
import type { FormShareResponse, PersonalData } from './formshare';
import { extractPersonalData } from './formshare';
import { sendNtfy } from './ntfy';
import { MemedClient, type Patient } from '../../memed-sdk/src';

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

async function findPatientOrCreate(personalData: PersonalData, memedClient: MemedClient): Promise<Patient | null> {
  const patient = await memedClient.searchPatients({ filter: personalData.cpf || personalData.name, size: 10, page: 1 });
  if (patient.data.length > 1) {
    await sendNtfy(`Mais de um paciente encontrado em Memed (${patient.data.length}) para ${personalData.name}, CPF: ${personalData.cpf}`);
    return null;
  }

  if (patient.data.length === 1) {
    return patient.data[0];
  }

  // @todo create
  return null;
}

async function handlePatient(patient: Patient, personalData: PersonalData, formShareData: FormShareResponse, memedClient: MemedClient) {
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
      await handlePatient(patient, personalData, req.body, memedClient);
    } else {
      await sendNtfy(`Paciente não encontrado em Memed para ${personalData.name}, CPF: ${personalData.cpf}`);
    }

    return res.status(200).json({
      success: true,
      message: 'Webhook processed successfully',
      foundPatient: Boolean(patient)
    });

    // proximos passos: criar o cara caso ele não existe,
    // depois já pré-criar a prescrição

  //   // Extract structured data
  //   const preConsultaData: PreConsultaData = extractPreConsultaData(formShareData);

  //   console.log('FormShare webhook received:', {
  //     formId: formShareData.formId,
  //     formName: formShareData.formName,
  //     submissionId: formShareData.submissionId,
  //     patientName: preConsultaData.patientName,
  //     email: preConsultaData.email,
  //     phone: preConsultaData.phone
  //   });

  //   // TODO: Process the form data (create patient, send notifications, etc.)

  //   return res.status(200).json({
  //     success: true,
  //     message: 'Webhook processed successfully',
  //     data: {
  //       formId: formShareData.formId,
  //       submissionId: formShareData.submissionId,
  //       patientName: preConsultaData.patientName
  //     }
  //   });

  } catch (error) {
    console.error('Error processing FormShare webhook:', error);

    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process webhook'
    });
  }
}
