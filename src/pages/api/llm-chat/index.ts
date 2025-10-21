import { WebhookPayload } from "./webhook-payload.entity";
import { VercelRequest, VercelResponse } from "@vercel/node";
import { getRedisClient } from "@/lib/redis";

import axios from "axios";

export const cw = axios.create({
  baseURL: process.env.CW_BASE_URL,
  headers: {
    "api_access_token": process.env.CW_API_TOKEN!,
    "Content-Type": "application/json",
  },
});

async function sendMessageToChatwoot(accountId: string, conversationId: number, text: string) {
  await cw.post(`/api/v1/accounts/${accountId}/conversations/${conversationId}/messages`, {
    content: text,
    message_type: "outgoing",
  });
}

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

// Redis key prefix for conversations
const CONVERSATION_KEY_PREFIX = "llm-chat:conversation:";

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
- Não responda nenhuma pergunta que fugir do escopo do assunto de renovação de receitas. Se a pergunta não estiver relacionada a renovação de receitas, responda que não temos informações sobre o assunto.

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

// Utilitário para ler conversa do Redis
async function getConversationFromRedis(conversationId: number): Promise<LlmChatConversation | null> {
  try {
    const redis = getRedisClient();
    const key = `${CONVERSATION_KEY_PREFIX}${conversationId}`;
    const raw = await redis.get(key);

    if (!raw) {
      return null;
    }

    return JSON.parse(raw);
  } catch (error) {
    console.error('Error reading from Redis:', error);
    return null;
  }
}

// Utilitário para salvar conversa no Redis
async function saveConversationToRedis(conversationId: number, conversation: LlmChatConversation): Promise<void> {
  try {
    const redis = getRedisClient();
    const key = `${CONVERSATION_KEY_PREFIX}${conversationId}`;
    const value = JSON.stringify(conversation);

    // Set with 7 days expiration (in seconds)
    await redis.setex(key, 7 * 24 * 60 * 60, value);
  } catch (error) {
    console.error('Error saving to Redis:', error);
    throw error;
  }
}

// Salva (ou cria) a conversa no Redis, anexando a nova mensagem
async function saveMessagePayloadConversation(webhookPayload: WebhookPayload) {
  const conversationId = webhookPayload?.conversation?.id;
  if (!conversationId) {
    const err = new Error("conversation.id ausente no payload");
    (err as Error & { status: number }).status = 400;
    throw err;
  }

  const existing = await getConversationFromRedis(conversationId) || {
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

  await saveConversationToRedis(conversationId, existing);

  return { conversationId };
}

async function saveLlmReplyIntoConversation(conversationId: number, reply: string) {
  const data = await getConversationFromRedis(conversationId);
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

  await saveConversationToRedis(conversationId, data);
}

// Monta um prompt para enviar à LLM com o histórico da conversa
async function buildIntakePrompt(conversationId: number) {
  const data = await getConversationFromRedis(conversationId);
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
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

async function getIntakeReply({
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
  console.error('about to call the LLM', req.method);
  // if (!auth(req, res)) {
  //   return;
  // }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return false;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const handled = await handleRequest(req.body as WebhookPayload);
    if (handled) {
      return res.status(200).json({ ok: true, conversationId: req.body.conversation.id, reply: { text: handled.message } });
    }

    const result = await saveMessagePayloadConversation(req.body as WebhookPayload);
    const prompt = await buildIntakePrompt(result.conversationId);

    const reply = await getIntakeReply({ system: prompt.system, messages: prompt.messages });

    await saveLlmReplyIntoConversation(result.conversationId, reply.text);

    console.log('prompt', prompt);
    console.log('reply', reply);

    await sendMessageToChatwoot(process.env.CW_ACCOUNT_ID!, result.conversationId, reply.text);

    return res.status(200).json({ ok: true, conversationId: result.conversationId, reply });
  } catch (error) {
    console.error('Error handling request:', error);
    const status = (error as Error & { status?: number }).status || 500;
    return res.status(status).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}

async function handleRequest(payload: WebhookPayload): Promise<{ success: boolean; message: string } | false> {
  const conversationId = payload?.conversation?.id;
  if (!conversationId) {
    const err = new Error("conversation.id ausente no payload");
    (err as Error & { status: number }).status = 400;
    throw err;
  }
  // If message is outgoing, save to Redis and return
  if (payload.message_type === 'outgoing') {
    console.log('outgoing message - ignoring');
    return { success: false, message: "Outgoing message - ignoring" };
  }

  // Check if message is [command] reset
  const messageContent = payload?.content.trim().toLowerCase();
  if (messageContent === '[command] reset') {
    const redis = await getRedisClient();
    const key = `${CONVERSATION_KEY_PREFIX}${conversationId}`;
    await redis.del(key);

    await sendMessageToChatwoot(process.env.CW_ACCOUNT_ID!, conversationId, "[command] reset - ok.");
    return { success: true, message: "[command] reset - ok." };
  }

  // Check if message is [command] activate chatbot
  if (messageContent === '[command] chatbot on') {
    const redis = await getRedisClient();
    const key = `chatbot_active:${conversationId}`;
    await redis.set(key, '1');

    await sendMessageToChatwoot(process.env.CW_ACCOUNT_ID!, conversationId, "[command] chatbot activated.");
    return { success: true, message: "[command] chatbot activated." };
  }
  // Check if message is [command] activate chatbot
  if (messageContent === '[command] chatbot off') {
    const redis = await getRedisClient();
    const key = `chatbot_active:${conversationId}`;
    await redis.set(key, '0');

    await sendMessageToChatwoot(process.env.CW_ACCOUNT_ID!, conversationId, "[command] chatbot deactivated.");
    return { success: true, message: "[command] chatbot deactivated." };
  }

  // Check if chatbot is active
  const redis = await getRedisClient();
  const key = `chatbot_active:${conversationId}`;
  const chatbotActive = await redis.get(key);
  if (chatbotActive !== '1') {
    console.log('chatbot not active - ignoring');
    return { success: false, message: "Chatbot is not active." };
  } else {
    console.log('chatbot active - processing');
  }

  return false;
}
