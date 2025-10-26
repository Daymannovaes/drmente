import { beforeEach, describe, expect, it, vi } from "vitest";
import type { WebhookPayload } from "@/pages/api/llm-chat/webhook-payload.entity";

const redisStore = new Map<string, string>();

const redisMock = {
  get: vi.fn(async (key: string) => (redisStore.has(key) ? redisStore.get(key)! : null)),
  set: vi.fn(async (key: string, value: string) => {
    redisStore.set(key, value);
    return "OK";
  }),
  setex: vi.fn(async (key: string, _ttl: number, value: string) => {
    redisStore.set(key, value);
    return "OK";
  }),
  del: vi.fn(async (key: string) => {
    const existed = redisStore.delete(key);
    return existed ? 1 : 0;
  }),
};

vi.mock("@/lib/redis", () => ({
  getRedisClient: () => redisMock,
}));

import {
  buildIntakePrompt,
  getChatbotActiveForConversation,
  getChatbotActiveGlobally,
  getChatbotAutoActivationThreshold,
  saveLlmReplyIntoConversation,
  saveMessagePayloadConversation,
  setChatbotActiveForConversation,
  setChatbotActiveGlobally,
  setChatbotAutoActivationThreshold,
} from "@/pages/api/llm-chat/redis";
import { getConversationKey } from "@/pages/api/llm-chat/redis";

const basePayload: WebhookPayload = {
  account: { id: 1, name: "Test" },
  additional_attributes: {},
  content_attributes: {},
  content_type: "text",
  content: "Olá, tudo bem?",
  conversation: {
    additional_attributes: {},
    can_reply: true,
    channel: "whatsapp",
    contact_inbox: { source_id: "source" },
    id: 123,
    inbox_id: 1,
    messages: [],
    labels: [],
    meta: {
      sender: {
        additional_attributes: {},
        custom_attributes: {},
        email: "user@example.com",
        id: 1,
        name: "User",
        phone_number: "+55 11 99999-9999",
        thumbnail: "",
        blocked: false,
      },
      assignee: {
        id: 1,
        name: "Agent",
        available_name: "Agent",
        avatar_url: "",
        type: "agent",
        availability_status: null,
        thumbnail: "",
      },
      team: null,
      hmac_verified: true,
    },
    status: "open",
    custom_attributes: {},
    snoozed_until: null,
    unread_count: 0,
    first_reply_created_at: "",
    priority: null,
    waiting_since: 0,
    agent_last_seen_at: 0,
    contact_last_seen_at: 0,
    last_activity_at: 0,
    timestamp: 0,
    created_at: 0,
    updated_at: 0,
  },
  created_at: new Date().toISOString(),
  id: 555,
  inbox: { id: 1, name: "Inbox" },
  message_type: "incoming",
  private: false,
  sender: {
    additional_attributes: {},
    custom_attributes: {},
    email: "user@example.com",
    id: 1,
    identifier: null,
    name: "User",
    phone_number: "+55 11 99999-9999",
    thumbnail: "",
    blocked: false,
    type: "contact",
  },
  source_id: "source",
  event: "message_created",
};

describe("llm-chat redis helpers", () => {
  beforeEach(() => {
    redisStore.clear();
    vi.clearAllMocks();
  });

  it("persists the inbound message and builds the intake prompt", async () => {
    await saveMessagePayloadConversation(basePayload);

    const conversationKey = getConversationKey(basePayload.conversation.id);
    expect(redisStore.has(conversationKey)).toBe(true);

    const prompt = await buildIntakePrompt(basePayload.conversation.id);

    expect(prompt.system).toBeTruthy();
    expect(prompt.messages).toHaveLength(1);
    expect(prompt.messages[0]).toEqual({ role: "user", content: basePayload.content });
  });

  it("appends assistant replies to the stored conversation", async () => {
    await saveMessagePayloadConversation(basePayload);
    await saveLlmReplyIntoConversation(basePayload.conversation.id, "Resposta do bot");

    const prompt = await buildIntakePrompt(basePayload.conversation.id);

    expect(prompt.messages).toHaveLength(2);
    expect(prompt.messages[1]).toEqual({ role: "assistant", content: "Resposta do bot" });
  });

  it("manages chatbot activation flags using redis", async () => {
    await setChatbotActiveGlobally(true);
    await setChatbotActiveForConversation(basePayload.conversation.id, true);
    await setChatbotAutoActivationThreshold(0.25);

    await expect(getChatbotActiveGlobally()).resolves.toBe("1");
    await expect(getChatbotActiveForConversation(basePayload.conversation.id)).resolves.toBe("1");
    await expect(getChatbotAutoActivationThreshold()).resolves.toBeCloseTo(0.25);
  });
});
