import { a as auth, M as MemedClient } from "./auth-aSfrURnt.js";
function getAnswersByType(response, type) {
  return response.data.filter((q) => q.type === type).map((q) => q.answer);
}
function getAnswerByQuestionPattern(response, pattern) {
  const question = response.data.find((q) => {
    if (typeof pattern === "string") {
      return q.question.includes(pattern);
    }
    return pattern.test(q.question);
  });
  return question?.answer;
}
function extractPersonalData(response) {
  return {
    name: getAnswersByType(response, "name")[0],
    phone: getAnswersByType(response, "phone")[0],
    email: getAnswersByType(response, "email")[0],
    cpf: getAnswersByType(response, "cpf")[0] || getAnswerByQuestionPattern(response, /CPF/),
    birthdate: getAnswersByType(response, "birthdate")[0] || getAnswerByQuestionPattern(response, /Data de nascimento/i)
  };
}
function sendNtfy(message, url = "https://ntfy.sh/drmente-prod-grafqk0d37b5") {
  const payload = {
    message
  };
  return fetch(url, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
function validate(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({
      error: "Method not allowed",
      message: "Only POST method is supported for webhooks"
    });
    return false;
  }
  const formShareData = req.body;
  if (!formShareData.formId || !formShareData.submissionId || !formShareData.data) {
    res.status(400).json({
      error: "Bad request",
      message: "Invalid FormShare response format"
    });
    return false;
  }
  return true;
}
async function findPatientOrCreate(personalData, memedClient) {
  const patient = await memedClient.searchPatients({ filter: personalData.cpf || personalData.name, size: 10, page: 1 });
  if (patient.data.length > 1) {
    await sendNtfy(`Mais de um paciente encontrado em Memed (${patient.data.length}) para ${personalData.name}, CPF: ${personalData.cpf}`);
    return null;
  }
  if (patient.data.length === 1) {
    return patient.data[0];
  }
  const newPatient = await memedClient.createPatient({
    full_name: personalData.name,
    cpf: personalData.cpf,
    email: personalData.email,
    phone: personalData.phone
  });
  await memedClient.createPatientAnnotation({
    content: `Paciente criado por integração`,
    patient_id: newPatient.id
  });
  return newPatient;
}
async function handlePatient(patient, personalData, formShareData, memedClient) {
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
async function handler(req, res) {
  if (!auth(req, res)) {
    return;
  }
  if (!validate(req, res)) {
    return;
  }
  try {
    const personalData = extractPersonalData(req.body);
    await sendNtfy(`Resposta recebida no formulário para ${personalData?.name}. Veja a resposta completa em https://formshare.ai/forms/r/cmfly6p6q0003ob39pv5mvisq`);
    const memedClient = new MemedClient({ token: process.env.MEMED_TOKEN });
    const patient = await findPatientOrCreate(personalData, memedClient);
    if (patient) {
      await handlePatient(patient, personalData, req.body, memedClient);
    } else {
      await sendNtfy(`Paciente não encontrado em Memed para ${personalData.name}, CPF: ${personalData.cpf}`);
    }
    return res.status(200).json({
      success: true,
      message: "Webhook processed successfully",
      foundPatient: Boolean(patient),
      patientId: patient?.id
    });
  } catch (error) {
    console.error("Error processing FormShare webhook:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: "Failed to process webhook"
    });
  }
}
export {
  handler as default
};
