// Example usage of the Memed SDK
import { MemedClient, timeoutSignal, type PatientCreate } from "./src";

const memed = new MemedClient({ token: process.env.MEMED_TOKEN! });
const { signal } = timeoutSignal(8000);

const newPatient: PatientCreate = {
  full_name: "Dayman Moreira Teste1",
  cpf: "11884625630",
  use_social_name: false,
  social_name: null,
  birthdate: "1995-06-02",
  without_cpf: false,
  gender_identity_id: null,
  phone: null,
  email: null,
  gender: null,
  address: null,
  conditions: [],
};

// Example usage (commented out to avoid actual API calls)
// const created = await memed.createPatient(newPatient, { signal });
const results = await memed.searchPatients({ filter: "11884625630", size: 5, page: 1 }, { signal });

// console.log(created);
console.log(results);
