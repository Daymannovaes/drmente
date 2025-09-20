import { a as auth, M as MemedClient } from "./auth-DI3I7hHd.js";
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
async function handler(req, res) {
  if (!auth(req, res)) {
    return;
  }
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
      message: "Only POST method is supported for webhooks"
    });
  }
  try {
    const formShareData = req.body;
    if (!formShareData.formId || !formShareData.submissionId || !formShareData.data) {
      return res.status(400).json({
        error: "Bad request",
        message: "Invalid FormShare response format"
      });
    }
    const personalData = extractPersonalData(formShareData);
    await sendNtfy(`Resposta recebida no formulário para ${personalData?.name}. Veja a resposta completa em https://formshare.ai/forms/r/cmfly6p6q0003ob39pv5mvisq`);
    const memedClient = new MemedClient({ token: process.env.MEMED_TOKEN });
    const patient = await memedClient.searchPatients({ filter: personalData.cpf || personalData.name, size: 10, page: 1 });
    if (patient.data.length > 1) {
      await sendNtfy(`Mais de um paciente encontrado em Memed (${patient.data.length}) para ${personalData.name}, CPF: ${personalData.cpf}`);
    } else if (patient.data.length === 1) {
      await sendNtfy(`Paciente encontrado em Memed: ${patient.data[0].full_name} para ${personalData.name}, CPF: ${personalData.cpf}`);
    } else {
      await sendNtfy(`Paciente não encontrado em Memed para ${personalData.name}, CPF: ${personalData.cpf}`);
    }
    return res.status(200).json({
      success: true,
      message: "Webhook processed successfully",
      foundPatients: patient.data.length
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
