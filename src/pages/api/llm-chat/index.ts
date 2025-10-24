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
  try {
    await cw.post(`/api/v1/accounts/${accountId}/conversations/${conversationId}/messages`, {
      content: text,
      message_type: "outgoing",
    });
  } catch (error) {
    console.error('Error sending message to Chatwoot:', error);
  }
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
Você é o assistente oficial do Centro DrMente no WhatsApp. Sua missão é acolher, entender a necessidade do paciente e conduzi-lo até a triagem concluída e agendamento/pagamento.
Você não faz diagnóstico nem prescrição no chat. Você nunca afasta o paciente: sempre mantém o diálogo vivo, com empatia e convite ao próximo passo.

Tom e estilo
	•	Sempre empático, breve, claro e positivo.
	•	Use o nome do paciente quando disponível.
	•	Valide o que a pessoa sente (“Entendo…”, “Faz sentido…”, “Obrigado por compartilhar…”).
	•	Zero jargão técnico desnecessário.
	•	Responda mensagem por mensagem com acolhimento + avanço do fluxo.
	•	Nunca use caps lock, não faça promessas médicas.

**IMPORTANTE**: Você DEVE retornar suas respostas em formato JSON estruturado com os campos: message, conversation_complete, current_step, fluxo.

**Regras:**
- Pergunte **uma coisa por vez** e aguarde resposta. (respeite as regras do fluxo de perguntas)
- Use linguagem simples, tom empático e profissional.
- Se a pessoa não souber responder, ou se responder parcialmente, pergunte novamente o que falta, de forma suave e sem pressão.
- Caso apareça uma emergência (p.ex., ideação suicida, sintomas graves agudos), **oriente procurar atendimento médico imediato** (SAMU/UPA) e avise que um profissional da equipe será notificado.
- **Não faça diagnóstico, não ajuste dose, não prescreva.** Diga que a prescrição final depende do médico responsável.
- Se a pessoa perguntar sobre preço, diga é no valor de R$89,00. Em nova linha, retome a conversa de forma amigável e retorne aos passos do fluxo de perguntas.
- Se a pessoa perguntar como funciona, apenas diga que uma consulta será feita aqui mesmo por mensagem de whatsapp, e que após o pagamento enviaremos a receita digital, e basta apresentá-la em qualquer farmácia.
- Garantia/confiança: se perguntarem “como garanto que recebo a receita/serviço?”, diga:
“Você recebe tudo após atendimento médico. Somos uma empresa séria e trabalhamos com protocolos validados.”
-	Comunicação difícil / agressiva: seja empático: "Sinto muito que esteja passando por isso. Quero te ajudar."
- Se perguntar como funciona a consulta por chat (fluxo 2), diga que é uma consulta online, apenas por mensagem de whatsapp. Enviamos algumas perguntas, você responde, e prescrevemos o melhor tratamento.
- Não responda nenhuma pergunta que fugir do escopo do assunto de renovação de receitas. Se não souber responder, diga que vai chamar o médico para responder.
- Nunca termine uma conversa sem seguir a instrução final.

**Fluxo de perguntas (siga na ordem):**
1) "Olá, somos um centro médico para renovação de receitas. Qual o seu nome?"
2) "Você já faz algum tratamento?"
  -- INSTRUÇÃO: se a resposta for NÃO, pular para a pergunta do fluxo 2
3) "Qual remédio e dosagem você usa?"
4) "Desde quando usa este remédio?"
5) "Qual foi o diagnóstico na ocasião em que começou?"
6) "Você se sente satisfeito com o tratamento atual?"
7) "Tem algum sintoma novo, sintoma que tenha voltado ou agravado que sente que é importante compartilhar comigo?"
8) "Você tem bipolaridade ou esquizofrenia? Já foi internado em hospital psiquiátrico?"

FLUXO 2, quando a pessoa não faz tratamento:
  3) "Eu entendo, {NOME}. Estamos aqui justamente para te dar essa assistência. Podemos fazer uma consulta completa por chat e começar um novo tratamento eficaz e seguro para você. Pode ser?"
  -- INSTRUÇÃO: essa é a ÚLTIMA PERGUNTA DE TODAS. Após isso, terminar a conversa (conversation_complete=true) com a instrução final sobre o pagamento

**Controle de Estado (OBRIGATÓRIO):**
- Defina "current_step" com o número da pergunta atual (1-8)
- Defina "conversation_complete" como true quando todas as 8 perguntas forem respondidas
- Defina "conversation_complete" como true quando o fluxo 2 for concluído

**INSTRUÇÃO FINAL: Ao terminar (conversation_complete = true):**
Informe o próximo passo: após o pagamento, te encaminho para o médico, que prontamente avaliará as respostas e prosseguirá com o tratamento.
  "Para continuar eu só preciso:

    1- dos seus dados pessoais de nome completo, data de nascimento e cep (para confeccionar a receita médica)
    2- me enviar o comprovante de pagamento do valor de 89 reais no PIX 49.247.066/0001-70"
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

interface IntakeResponse {
  message: string;
  conversation_complete: boolean;
  current_step?: number; // 1-9 para as perguntas
  fluxo?: string; // 1 ou 2
}

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
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "intake_response",
        strict: true,
        schema: {
          type: "object",
          properties: {
            message: {
              type: "string",
              description: "A mensagem que será enviada ao paciente"
            },
            conversation_complete: {
              type: "boolean",
              description: "true se todas as 9 perguntas foram respondidas, dados pessoais coletados e comprovante de pagamento recebido"
            },
            current_step: {
              type: "number",
              description: "Número da pergunta atual (1-9)"
            },
            fluxo: {
              type: "string",
              description: "Fluxo de perguntas: 1 ou 2"
            },
          },
          required: ["message", "conversation_complete", "current_step", "fluxo"],
          additionalProperties: false
        }
      }
    }
  });

  const content = response.choices[0]?.message?.content || "{}";
  console.log('content', content);
  const parsed: IntakeResponse = JSON.parse(content);

  return {
    text: parsed.message,
    isComplete: parsed.conversation_complete,
    currentStep: parsed.current_step,
    fluxo: parsed.fluxo,
    raw: response
  };
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

    if (reply.isComplete) {
      await completeConversationAndNotifyDoctor(req.body as WebhookPayload);
    }

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

async function completeConversationAndNotifyDoctor(message: WebhookPayload) {
  const conversationId = message?.conversation?.id;

  const redis = await getRedisClient();
  const conversationKey = `chatbot_active:${conversationId}`;
  await redis.set(conversationKey, '0'); // deactivate chatbot for this conversation

  await notifyDoctorAboutFinishedConversation(message);
}

async function notifyDoctorAboutFinishedConversation(message: WebhookPayload) {
  const conversationId = message?.conversation?.id;
  const senderName = message?.sender?.name;
  const senderPhone = message?.sender?.phone_number;

  const doctors = [
    4,   // gabriel
    32, // dayman
  ];

  for (const doctorId of doctors) {
    await sendMessageToChatwoot(process.env.CW_ACCOUNT_ID!, doctorId, `Conversa terminada com o chatbot.
ID da conversa: ${conversationId}
Nome do paciente: ${senderName}
Telefone do paciente: ${senderPhone}
`);
  }
}

enum COMMANDS {
  RESET = '[command] reset',
  CHATBOT_ON_GLOBAL = '[command] chatbot global on',
  CHATBOT_OFF_GLOBAL = '[command] chatbot global off',
  CHATBOT_ON = '[command] chatbot on',
  CHATBOT_OFF = '[command] chatbot off',
  CHATBOT_ON_OTHER = '[command] chatbot on ',
  CHATBOT_OFF_OTHER = '[command] chatbot off ',
  CHATBOT_END_OTHER_instruction = `
    exemplo:
    [command] chatbot end (desliga o proprio chat)
    [command] chatbot end 32 (desliga o chat com id 32)
`,
  CHATBOT_THRESHOLD_SET = '[command] set threshold ',
  CHATBOT_THRESHOLD_SET_instruction = `
    exemplo:
    [command] set threshold 0.1 (define a probabilidade de 10% para ativar o chatbot)
`,
  CHATBOT_THRESHOLD_GET = '[command] get threshold',
  SHOW_COMMANDS = '[command] show commands',
}

async function handleRequest(payload: WebhookPayload): Promise<{ success: boolean; message: string } | false> {
  const conversationId = payload?.conversation?.id;
  if (!conversationId) {
    const err = new Error("conversation.id ausente no payload");
    (err as Error & { status: number }).status = 400;
    throw err;
  }

  const redis = await getRedisClient();


  // If message is outgoing, ignore it
  if (payload.message_type === 'outgoing') {
    console.log('outgoing message - ignoring');
    return { success: false, message: "Outgoing message - ignoring" };
  }

  // Check if message is [command] reset
  const messageContent = payload?.content.trim().toLowerCase();


  if (messageContent === COMMANDS.SHOW_COMMANDS) {
    await sendMessageToChatwoot(process.env.CW_ACCOUNT_ID!, conversationId, "Available commands:\n\n" + Object.values(COMMANDS).join('\n'));
    return { success: true, message: "Commands shown." };
  }

  if (messageContent === COMMANDS.CHATBOT_ON_GLOBAL) {
    await redis.set('chatbot_active_globally', '1');
    await sendMessageToChatwoot(process.env.CW_ACCOUNT_ID!, conversationId, "[command] chatbot global activated.");
    return { success: true, message: "[command] chatbot global activated." };
  }
  if (messageContent === COMMANDS.CHATBOT_OFF_GLOBAL) {
    await redis.set('chatbot_active_globally', '0');
    await sendMessageToChatwoot(process.env.CW_ACCOUNT_ID!, conversationId, "[command] chatbot global deactivated.");
    return { success: true, message: "[command] chatbot global deactivated." };
  }

  if (messageContent === COMMANDS.RESET) {
    const key = `${CONVERSATION_KEY_PREFIX}${conversationId}`;
    await redis.del(key);

    await sendMessageToChatwoot(process.env.CW_ACCOUNT_ID!, conversationId, "[command] reset - ok.");
    return { success: true, message: "[command] reset - ok." };
  }

  // Check if message is [command] activate chatbot
  if (messageContent === COMMANDS.CHATBOT_ON) {
    const key = `chatbot_active:${conversationId}`;
    await redis.set(key, '1');

    await sendMessageToChatwoot(process.env.CW_ACCOUNT_ID!, conversationId, "[command] chatbot activated.");
    return { success: true, message: "[command] chatbot activated." };
  }
  // Check if message is [command] activate chatbot
  if (messageContent === COMMANDS.CHATBOT_OFF) {
    const key = `chatbot_active:${conversationId}`;
    await redis.set(key, '0');

    await sendMessageToChatwoot(process.env.CW_ACCOUNT_ID!, conversationId, "[command] chatbot deactivated.");
    return { success: true, message: "[command] chatbot deactivated." };
  }

  if (messageContent.startsWith(COMMANDS.CHATBOT_THRESHOLD_SET)) {
    const threshold = parseFloat(messageContent.replace(COMMANDS.CHATBOT_THRESHOLD_SET, ''));
    if (isNaN(threshold)) {
      return { success: true, message: "Invalid threshold" };
    }
    await redis.set('chatbot_auto_activation_threshold', threshold.toString());
    await sendMessageToChatwoot(process.env.CW_ACCOUNT_ID!, conversationId, "[command] chatbot threshold set to " + threshold);
    return { success: true, message: "[command] chatbot threshold set to " + threshold };
  }
  if (messageContent.startsWith(COMMANDS.CHATBOT_ON_OTHER)) {
    const conversationToOn = parseInt(messageContent.replace(COMMANDS.CHATBOT_ON_OTHER, ''));
    console.log('conversationToOn', conversationToOn);
    if (isNaN(conversationToOn)) {
      return { success: true, message: "Invalid conversation ID" };
    }
    const conversationKey = `chatbot_active:${conversationToOn}`;
    await redis.set(conversationKey, '1');
    await sendMessageToChatwoot(process.env.CW_ACCOUNT_ID!, conversationId, "[command] chatbot on - " + conversationToOn);
    return { success: true, message: "[command] chatbot on - " + conversationToOn };
  }

  if (messageContent.startsWith(COMMANDS.CHATBOT_OFF_OTHER)) {
    const conversationToOff = parseInt(messageContent.replace(COMMANDS.CHATBOT_OFF_OTHER, ''));
    console.log('conversationToOff', conversationToOff);
    if (isNaN(conversationToOff)) {
      return { success: true, message: "Invalid conversation ID" };
    }
    const conversationKey = `chatbot_active:${conversationToOff}`;
    await redis.set(conversationKey, '0');
    await sendMessageToChatwoot(process.env.CW_ACCOUNT_ID!, conversationId, "[command] chatbot off - " + conversationToOff);
    return { success: true, message: "[command] chatbot off - " + conversationToOff };
  }

  if (messageContent === COMMANDS.CHATBOT_THRESHOLD_GET) {
    const threshold = await redis.get('chatbot_auto_activation_threshold');
    await sendMessageToChatwoot(process.env.CW_ACCOUNT_ID!, conversationId, "[command] chatbot threshold get: " + threshold);
    return { success: true, message: "[command] chatbot threshold get - " + threshold };
  }

  // disable chatbot globally
  const chatbotActiveGlobally = await redis.get('chatbot_active_globally');
  if (chatbotActiveGlobally !== '1') {
    console.log('chatbot not active globally - ignoring');
    return { success: false, message: "Chatbot is not active globally." };
  } else {
    console.log('chatbot active globally - processing');
  }

  // Check if chatbot is active
  const key = `chatbot_active:${conversationId}`;
  const chatbotActiveForChat = await redis.get(key);

  // For 10% of new chats, enable the chatbot by default
  if (chatbotActiveForChat === null) {
    let threshold: number | null = await redis.get('chatbot_auto_activation_threshold') as unknown as number;
    threshold = threshold ? parseFloat(threshold as unknown as string) : 0.1;

    if (Math.random() < threshold) {
      await redis.set(key, '1');
      console.log('chatbot auto-activated for this chat', key);
      console.log('chatbot active for this chat - processing');

      // return false to consider it not handled, so llm can take over
      return false;
    } else {
      await redis.set(key, '0');
      console.log('chatbot not auto-activated for this chat', key);
      console.log('chatbot not active - ignoring');

      return { success: false, message: "Chatbot is not active." };
    }
  }

  if (chatbotActiveForChat !== '1') {
    console.log('chatbot not active for this chat - ignoring', key);
    return { success: false, message: "Chatbot is not active." };
  } else {
    console.log('chatbot active for this chat - processing', key);
  }

  return false;
}
