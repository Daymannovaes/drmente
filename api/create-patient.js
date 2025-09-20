import { M as MemedClient, a as MemedError } from "./client-DjwK6qim.js";
async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
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
    if (!patientData.full_name || typeof patientData.full_name !== "string") {
      return res.status(400).json({
        error: "Bad request",
        message: "full_name is required and must be a string"
      });
    }
    if (patientData.cpf && typeof patientData.cpf !== "string") {
      return res.status(400).json({
        error: "Bad request",
        message: "cpf must be a string"
      });
    }
    if (patientData.birthdate && typeof patientData.birthdate !== "string") {
      return res.status(400).json({
        error: "Bad request",
        message: "birthdate must be a string in YYYY-MM-DD format"
      });
    }
    if (patientData.email && typeof patientData.email !== "string") {
      return res.status(400).json({
        error: "Bad request",
        message: "email must be a string"
      });
    }
    if (patientData.phone && typeof patientData.phone !== "string") {
      return res.status(400).json({
        error: "Bad request",
        message: "phone must be a string"
      });
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
