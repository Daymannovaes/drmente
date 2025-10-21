import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { WebhookPayload } from "./webhook-payload.entity";
import { VercelRequest, VercelResponse } from "@vercel/node";

interface LlmChatConversation {
  messages: LlmChatMessage[];
  last_updated: string | null;
}

interface LlmChatMessage {
  id: number;
  content: string;
  created_at: number;
  sender: number;
  sender_name: string;
  sender_phone: string;
  sender_email: string;
  type: "user" | "assistant";
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Diretório onde cada conversa será salva como <conversationId>.json
const STORAGE_DIR = process.env.STORAGE_DIR || path.join(__dirname, "data");
fs.mkdirSync(STORAGE_DIR, { recursive: true });

// -------------------------------
// Prompt de triagem (PT-BR)
// -------------------------------
const INTAKE_SYSTEM_PROMPT_PT = `
Você é um assistente de recepção de um centro médico especializado em **renovação de receitas**. Sua missão é **conduzir uma entrevista estruturada**, de forma cordial, objetiva e ética, para coletar informações necessárias antes da avaliação clínica.

**Regras:**
- Pergunte **uma coisa por vez** e aguarde resposta.
- Use linguagem simples, tom empático e profissional.
- Se a pessoa não souber responder, ou se responder parcialmente, pergunte novamente o que falta, de forma suave e sem pressão.
- Caso apareça uma emergência (p.ex., ideação suicida, sintomas graves agudos), **oriente procurar atendimento médico imediato** (SAMU/UPA) e avise que um profissional da equipe será notificado.
- **Não faça diagnóstico, não ajuste dose, não prescreva.** Diga que a prescrição final depende do médico responsável.
- Ao final, faça um **resumo estruturado** dos dados coletados.

**Fluxo de perguntas (siga na ordem):**
1) "Olá, somos um centro médico para renovação de receitas. Qual o seu nome?"
2) "Você já faz algum tratamento?"
3) "Qual remédio e dosagem você usa?"
4) "Desde quando usa este remédio?"
5) "Qual foi o diagnóstico na ocasião em que começou?"
6) "Você se sente satisfeito com o tratamento atual?"
7) "Tem algum sintoma novo, sintoma que tenha voltado ou agravado que sente que é importante compartilhar comigo?"
8) "Você tem bipolaridade ou esquizofrenia? Já foi internado em hospital psiquiátrico?"

**Ao terminar:**
- Confirme nome completo, medicamento/dose/frequência, diagnóstico, tempo de uso, satisfação e sintomas atuais.
- Informe o próximo passo: um profissional avaliará as respostas e prosseguirá com orientações.
`;

// Utilitário para ler arquivo JSON com tolerância a erro
function readJsonSafe(filePath: string): LlmChatConversation | null {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Salva (ou cria) o arquivo da conversa, anexando a nova mensagem
function saveMessagePayloadyConversation(webhookPayload: WebhookPayload) {
  const conversationId = webhookPayload?.conversation?.id;
  if (!conversationId) {
    const err = new Error("conversation.id ausente no payload");
    (err as Error & { status: number }).status = 400;
    throw err;
  }

  const filePath = path.join(STORAGE_DIR, `${conversationId}.json`);
  const existing = readJsonSafe(filePath) || {
    messages: [],
    last_updated: null,
  };

  const minimalMessage: LlmChatMessage = {
    id: webhookPayload.id,
    content: webhookPayload.content,
    created_at: new Date(webhookPayload.created_at).getTime(),
    sender: webhookPayload.sender?.id,
    sender_name: webhookPayload.sender?.name,
    sender_phone: webhookPayload.sender?.phone_number || "",
    sender_email: webhookPayload.sender?.email || "",
    type: webhookPayload.message_type === "outgoing" ? "assistant" : "user",
  };

  existing.messages.push(minimalMessage);
  existing.last_updated = new Date().toISOString();

  fs.writeFileSync(filePath, JSON.stringify(existing, null, 2), "utf8");

  return { filePath, conversationId };
}

function saveLlmReplyIntoConversation(conversationId: number, reply: string) {
  const filePath = path.join(STORAGE_DIR, `${conversationId}.json`);
  const data = readJsonSafe(filePath);
  if (!data) {
    const err = new Error("Conversa não encontrada");
    (err as Error & { status: number }).status = 404;
    throw err;
  }

  const minimalMessage: LlmChatMessage = {
    id: data.messages.length + 1,
    content: reply,
    created_at: new Date().getTime(),
    sender: -1,
    sender_name: "LLM",
    sender_phone: "",
    sender_email: "",
    type: "assistant",
  };

  data.messages.push(minimalMessage);
  data.last_updated = new Date().toISOString();

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

// Monta um prompt para enviar à LLM com o histórico da conversa
function buildIntakePrompt(conversationId: number) {
  const filePath = path.join(STORAGE_DIR, `${conversationId}.json`);
  const data = readJsonSafe(filePath);
  if (!data) {
    const err = new Error("Conversa não encontrada");
    (err as Error & { status: number }).status = 404;
    throw err;
  }

  // Converte mensagens para o formato OpenAI
  const messages = data.messages.map((m: LlmChatMessage) => ({
    role: m.type,
    content: m.content,
  }));

  return {
    system: INTAKE_SYSTEM_PROMPT_PT,
    messages,
    meta: {
      conversationId,
      messagesCount: data.messages.length,
      lastUpdated: data.last_updated,
    },
  };
}

import OpenAI from 'openai';
export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

export async function getIntakeReply({
  system,
  messages
}: {
  system: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>
}) {
  const response = await openai.chat.completions.create({
    model: DEFAULT_MODEL,
    messages: [
      { role: 'system', content: system },
      ...messages
    ],
  });

  const text = response.choices[0]?.message?.content || "";

  return { text, raw: response };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // if (!auth(req, res)) {
  //   return;
  // }

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const result = saveMessagePayloadyConversation(req.body as WebhookPayload);
  const prompt = buildIntakePrompt(result.conversationId);

  const reply = await getIntakeReply({ system: prompt.system, messages: prompt.messages });

  await saveLlmReplyIntoConversation(result.conversationId, reply.text);

  console.log('prompt', prompt);
  console.log('reply', reply);

  return res.status(200).json({ ok: true, conversationId: result.conversationId, reply });
}
