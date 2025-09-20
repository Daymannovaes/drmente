import { a as auth, M as MemedClient, b as MemedError } from "./auth-aSfrURnt.js";
function validatePatientData(patientData, res) {
  if (!patientData.full_name || typeof patientData.full_name !== "string") {
    res.status(400).json({
      error: "Bad request",
      message: "full_name is required and must be a string"
    });
    return false;
  }
  if (patientData.cpf && typeof patientData.cpf !== "string") {
    res.status(400).json({
      error: "Bad request",
      message: "cpf must be a string"
    });
    return false;
  }
  if (patientData.birthdate && typeof patientData.birthdate !== "string") {
    res.status(400).json({
      error: "Bad request",
      message: "birthdate must be a string in YYYY-MM-DD format"
    });
    return false;
  }
  if (patientData.email && typeof patientData.email !== "string") {
    res.status(400).json({
      error: "Bad request",
      message: "email must be a string"
    });
    return false;
  }
  if (patientData.phone && typeof patientData.phone !== "string") {
    res.status(400).json({
      error: "Bad request",
      message: "phone must be a string"
    });
    return false;
  }
  return true;
}
async function handler(req, res) {
  if (!auth(req, res)) {
    return;
  }
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
      message: "Only POST method is supported"
    });
  }
  try {
    const token = process.env.MEMED_TOKEN;
    if (!token) {
      return res.status(500).json({
        error: "Server configuration error",
        message: "Memed token not configured"
      });
    }
    const memedClient = new MemedClient({ token });
    const patientData = req.body;
    if (!validatePatientData(patientData, res)) {
      return;
    }
    const createdPatient = await memedClient.createPatient(patientData);
    return res.status(201).json({
      success: true,
      data: createdPatient,
      message: "Patient created successfully"
    });
  } catch (error) {
    console.error("Error creating patient:", error);
    if (error instanceof MemedError) {
      return res.status(error.status).json({
        error: "Memed API error",
        message: error.message,
        details: {
          status: error.status,
          statusText: error.statusText,
          url: error.url
        }
      });
    }
    return res.status(500).json({
      error: "Internal server error",
      message: "An unexpected error occurred while creating patient"
    });
  }
}
export {
  handler as default
};
