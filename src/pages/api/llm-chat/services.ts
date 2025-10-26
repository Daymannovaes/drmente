import axios from "axios";
import OpenAI from "openai";
import type { WebhookPayload } from "./webhook-payload.entity";
import type { IntakeReply } from "./types";
import { DOCTOR_NOTIFICATION_RECIPIENTS } from "./constants";
import { setChatbotActiveForConversation } from "./redis";

export const cw = axios.create({
  baseURL: process.env.CW_BASE_URL,
  headers: {
    api_access_token: process.env.CW_API_TOKEN!,
    "Content-Type": "application/json",
  },
});

export async function sendMessageToChatwoot(accountId: string, conversationId: number, text: string) {
  try {
    await cw.post(`/api/v1/accounts/${accountId}/conversations/${conversationId}/messages`, {
      content: text,
      message_type: "outgoing",
    });
  } catch (error) {
    console.error("Error sending message to Chatwoot:", error);
  }
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

interface IntakeResponse {
  message: string;
  conversation_complete: boolean;
  current_step?: number;
  fluxo?: string;
}

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function getIntakeReply({
  system,
  messages,
}: {
  system: string;
  messages: ChatMessage[];
}): Promise<IntakeReply> {
  const response = await openai.chat.completions.create({
    model: DEFAULT_MODEL,
    messages: [{ role: "system", content: system }, ...messages],
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
              description: "A mensagem que será enviada ao paciente",
            },
            conversation_complete: {
              type: "boolean",
              description:
                "true se todas as 9 perguntas foram respondidas, dados pessoais coletados e comprovante de pagamento recebido",
            },
            current_step: {
              type: "number",
              description: "Número da pergunta atual (1-9)",
            },
            fluxo: {
              type: "string",
              description: "Fluxo de perguntas: 1 ou 2",
            },
          },
          required: ["message", "conversation_complete", "current_step", "fluxo"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content || "{}";
  const parsed = JSON.parse(content) as IntakeResponse;

  return {
    text: parsed.message,
    isComplete: parsed.conversation_complete,
    currentStep: parsed.current_step,
    fluxo: parsed.fluxo,
    raw: response,
  };
}

export async function completeConversationAndNotifyDoctor(message: WebhookPayload) {
  const conversationId = message?.conversation?.id;
  if (!conversationId) {
    return;
  }

  await setChatbotActiveForConversation(conversationId, false);
  await notifyDoctorAboutFinishedConversation(message);
}

export async function notifyDoctorAboutFinishedConversation(message: WebhookPayload) {
  const conversationId = message?.conversation?.id;
  const senderName = message?.sender?.name;
  const senderPhone = message?.sender?.phone_number;

  for (const doctorId of DOCTOR_NOTIFICATION_RECIPIENTS) {
    await sendMessageToChatwoot(
      process.env.CW_ACCOUNT_ID!,
      doctorId,
      `Conversa terminada com o chatbot.
ID da conversa: ${conversationId}
Nome do paciente: ${senderName}
Telefone do paciente: ${senderPhone}
`
    );
  }
}
