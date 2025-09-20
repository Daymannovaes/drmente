import { a as auth, M as MemedClient } from "./auth-DI3I7hHd.js";
function getAnswersByType(response, type) {
  return response.data.filter((q) => q.type === type).map((q) => q.answer);
}
function extractPersonalData(response) {
  return {
    name: getAnswersByType(response, "name")[0],
    phone: getAnswersByType(response, "phone")[0],
    email: getAnswersByType(response, "email")[0],
    cpf: getAnswersByType(response, "cpf")[0],
    birthdate: getAnswersByType(response, "birthdate")[0]
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
    await sendNtfy(`
Resposta recebida no formulário!
Nome: ${personalData?.name}, Telefone: ${personalData?.phone}, Email: ${personalData?.email}, CPF: ${personalData?.cpf}, Data de nascimento: ${personalData?.birthdate}
`);
    const memedClient = new MemedClient({ token: process.env.MEMED_TOKEN });
    const patient = await memedClient.searchPatients({ filter: personalData.cpf || personalData.name, size: 1, page: 1 });
    if (patient.data.length > 0) {
      await sendNtfy(`Paciente encontrado em Memed: ${patient.data[0].full_name}`);
    } else {
      await sendNtfy(`Paciente não encontrado em Memed: ${personalData.name}, CPF: ${personalData.cpf}`);
    }
    return res.status(200).json({
      success: true,
      message: "Webhook processed successfully"
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
