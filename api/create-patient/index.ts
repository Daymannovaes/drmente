import type { VercelRequest, VercelResponse } from '@vercel/node';
import { MemedClient, MemedError, type PatientCreate } from '../../memed-sdk/src/index';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'Only POST method is supported'
    });
  }

  try {
    // Get the Memed token from environment variables
    const token = process.env.MEMED_TOKEN;
    if (!token) {
      return res.status(500).json({
        error: 'Server configuration error',
        message: 'Memed token not configured'
      });
    }

    // Initialize the Memed client
    const memedClient = new MemedClient({ token });

    // Extract patient data from request body
    const patientData: PatientCreate = req.body;

    // Validate required fields
    if (!patientData.full_name || typeof patientData.full_name !== 'string') {
      return res.status(400).json({
        error: 'Bad request',
        message: 'full_name is required and must be a string'
      });
    }

    // Validate CPF format if provided
    if (patientData.cpf && typeof patientData.cpf !== 'string') {
      return res.status(400).json({
        error: 'Bad request',
        message: 'cpf must be a string'
      });
    }

    // Validate birthdate format if provided
    if (patientData.birthdate && typeof patientData.birthdate !== 'string') {
      return res.status(400).json({
        error: 'Bad request',
        message: 'birthdate must be a string in YYYY-MM-DD format'
      });
    }

    // Validate email format if provided
    if (patientData.email && typeof patientData.email !== 'string') {
      return res.status(400).json({
        error: 'Bad request',
        message: 'email must be a string'
      });
    }

    // Validate phone format if provided
    if (patientData.phone && typeof patientData.phone !== 'string') {
      return res.status(400).json({
        error: 'Bad request',
        message: 'phone must be a string'
      });
    }

    // Create patient using the SDK
    const createdPatient = await memedClient.createPatient(patientData);

    // Return the created patient
    return res.status(201).json({
      success: true,
      data: createdPatient,
      message: 'Patient created successfully'
    });

  } catch (error) {
    console.error('Error creating patient:', error);

    // Handle Memed-specific errors
    if (error instanceof MemedError) {
      return res.status(error.status).json({
        error: 'Memed API error',
        message: error.message,
        details: {
          status: error.status,
          statusText: error.statusText,
          url: error.url
        }
      });
    }

    // Handle other errors
    return res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred while creating patient'
    });
  }
}
