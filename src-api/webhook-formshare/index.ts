import type { VercelRequest, VercelResponse } from '@vercel/node';
import auth from '../auth';
import type { FormShareResponse, PersonalData } from './formshare';
import { extractPersonalData } from './formshare';
import { sendNtfy } from './ntfy';
import { MemedClient } from '../../memed-sdk/src';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!auth(req, res)) {
    return;
  }

  // Only allow POST method for webhooks
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'Only POST method is supported for webhooks'
    });
  }

  try {
    // Parse and validate the FormShare response
    const formShareData: FormShareResponse = req.body;

    // Validate required fields
    if (!formShareData.formId || !formShareData.submissionId || !formShareData.data) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Invalid FormShare response format'
      });
    }

    const personalData: PersonalData = extractPersonalData(formShareData);

    await sendNtfy(`
Resposta recebida no formulário!
Nome: ${personalData?.name}, Telefone: ${personalData?.phone}, Email: ${personalData?.email}, CPF: ${personalData?.cpf}, Data de nascimento: ${personalData?.birthdate}
`);

    const memedClient = new MemedClient({ token: process.env.MEMED_TOKEN! });

    const patient = await memedClient.searchPatients({ filter: personalData.cpf || personalData.name, size: 1, page: 1 });

    if (patient.data.length > 0) {
      await sendNtfy(`Paciente encontrado em Memed: ${patient.data[0].full_name}`);
    } else {
      await sendNtfy(`Paciente não encontrado em Memed: ${personalData.name}, CPF: ${personalData.cpf}`);
    }

    return res.status(200).json({
      success: true,
      message: 'Webhook processed successfully'
    });

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
