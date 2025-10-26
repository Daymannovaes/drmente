import { getRedisClient } from "@/lib/redis";
import type { WebhookPayload } from "./webhook-payload.entity";
import {
  CHATBOT_CONVERSATION_KEY_PREFIX,
  CHATBOT_GLOBAL_STATUS_KEY,
  CHATBOT_THRESHOLD_KEY,
  CONVERSATION_KEY_PREFIX,
  DEFAULT_CHATBOT_AUTO_ACTIVATION_THRESHOLD,
  INTAKE_SYSTEM_PROMPT_PT,
} from "./constants";
import type { IntakePrompt, LlmChatConversation, LlmChatMessage } from "./types";

export function getConversationKey(conversationId: number): string {
  return `${CONVERSATION_KEY_PREFIX}${conversationId}`;
}

export function getChatbotConversationKey(conversationId: number): string {
  return `${CHATBOT_CONVERSATION_KEY_PREFIX}${conversationId}`;
}

export async function getConversationFromRedis(conversationId: number): Promise<LlmChatConversation | null> {
  try {
    const redis = getRedisClient();
    const raw = await redis.get(getConversationKey(conversationId));

    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as LlmChatConversation;
  } catch (error) {
    console.error("Error reading from Redis:", error);
    return null;
  }
}

export async function saveConversationToRedis(conversationId: number, conversation: LlmChatConversation): Promise<void> {
  try {
    const redis = getRedisClient();
    const value = JSON.stringify(conversation);

    await redis.setex(getConversationKey(conversationId), 7 * 24 * 60 * 60, value);
  } catch (error) {
    console.error("Error saving to Redis:", error);
    throw error;
  }
}

export async function deleteConversationFromRedis(conversationId: number): Promise<void> {
  const redis = getRedisClient();
  await redis.del(getConversationKey(conversationId));
}

export async function saveMessagePayloadConversation(webhookPayload: WebhookPayload) {
  const conversationId = webhookPayload?.conversation?.id;
  if (!conversationId) {
    const err = new Error("conversation.id ausente no payload");
    (err as Error & { status: number }).status = 400;
    throw err;
  }

  const existing = (await getConversationFromRedis(conversationId)) || {
    messages: [],
    last_updated: null,
  } satisfies LlmChatConversation;

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

export async function saveLlmReplyIntoConversation(conversationId: number, reply: string) {
  const data = await getConversationFromRedis(conversationId);
  if (!data) {
    const err = new Error("Conversa não encontrada");
    (err as Error & { status: number }).status = 404;
    throw err;
  }

  const minimalMessage: LlmChatMessage = {
    id: data.messages.length + 1,
    content: reply,
    created_at: Date.now(),
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

export async function buildIntakePrompt(conversationId: number): Promise<IntakePrompt> {
  const data = await getConversationFromRedis(conversationId);
  if (!data) {
    const err = new Error("Conversa não encontrada");
    (err as Error & { status: number }).status = 404;
    throw err;
  }

  const messages = data.messages.map((message) => ({
    role: message.type,
    content: message.content,
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

export async function setChatbotActiveGlobally(active: boolean): Promise<void> {
  const redis = getRedisClient();
  await redis.set(CHATBOT_GLOBAL_STATUS_KEY, active ? "1" : "0");
}

export async function getChatbotActiveGlobally(): Promise<string | null> {
  const redis = getRedisClient();
  return redis.get(CHATBOT_GLOBAL_STATUS_KEY);
}

export async function setChatbotActiveForConversation(conversationId: number, active: boolean): Promise<void> {
  const redis = getRedisClient();
  await redis.set(getChatbotConversationKey(conversationId), active ? "1" : "0");
}

export async function getChatbotActiveForConversation(conversationId: number): Promise<string | null> {
  const redis = getRedisClient();
  return redis.get(getChatbotConversationKey(conversationId));
}

export async function setChatbotAutoActivationThreshold(threshold: number): Promise<void> {
  const redis = getRedisClient();
  await redis.set(CHATBOT_THRESHOLD_KEY, threshold.toString());
}

export async function getChatbotAutoActivationThreshold(): Promise<number | null> {
  const redis = getRedisClient();
  const value = await redis.get(CHATBOT_THRESHOLD_KEY);

  if (value === null) {
    return null;
  }

  const parsed = parseFloat(value);

  return Number.isNaN(parsed) ? DEFAULT_CHATBOT_AUTO_ACTIVATION_THRESHOLD : parsed;
}
