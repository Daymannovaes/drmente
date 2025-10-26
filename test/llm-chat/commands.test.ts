import { beforeEach, describe, expect, it, vi } from "vitest";
import type { WebhookPayload } from "@/pages/api/llm-chat/webhook-payload.entity";

const mocks = vi.hoisted(() => ({
  sendMessageToChatwoot: vi.fn(),
  deleteConversationFromRedis: vi.fn(),
  getChatbotActiveForConversation: vi.fn(),
  getChatbotActiveGlobally: vi.fn(),
  getChatbotAutoActivationThreshold: vi.fn(),
  setChatbotActiveForConversation: vi.fn(),
  setChatbotActiveGlobally: vi.fn(),
  setChatbotAutoActivationThreshold: vi.fn(),
}));

vi.mock("@/pages/api/llm-chat/services", () => ({
  sendMessageToChatwoot: mocks.sendMessageToChatwoot,
}));

vi.mock("@/pages/api/llm-chat/redis", () => ({
  deleteConversationFromRedis: mocks.deleteConversationFromRedis,
  getChatbotActiveForConversation: mocks.getChatbotActiveForConversation,
  getChatbotActiveGlobally: mocks.getChatbotActiveGlobally,
  getChatbotAutoActivationThreshold: mocks.getChatbotAutoActivationThreshold,
  setChatbotActiveForConversation: mocks.setChatbotActiveForConversation,
  setChatbotActiveGlobally: mocks.setChatbotActiveGlobally,
  setChatbotAutoActivationThreshold: mocks.setChatbotAutoActivationThreshold,
}));

import { COMMANDS, handleCommandRequest } from "@/pages/api/llm-chat/commands";

const {
  sendMessageToChatwoot,
  deleteConversationFromRedis,
  getChatbotActiveForConversation,
  getChatbotActiveGlobally,
  getChatbotAutoActivationThreshold,
  setChatbotActiveForConversation,
  setChatbotActiveGlobally,
  setChatbotAutoActivationThreshold,
} = mocks;

const basePayload: WebhookPayload = {
  account: { id: 1, name: "Test" },
  additional_attributes: {},
  content_attributes: {},
  content_type: "text",
  content: "Olá",
  conversation: {
    additional_attributes: {},
    can_reply: true,
    channel: "whatsapp",
    contact_inbox: { source_id: "source" },
    id: 321,
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
  id: 1,
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

describe("llm-chat command handler", () => {
  beforeEach(() => {
    process.env.CW_ACCOUNT_ID = "10";

    vi.clearAllMocks();
    deleteConversationFromRedis.mockResolvedValue(undefined);
    getChatbotActiveForConversation.mockResolvedValue("1");
    getChatbotActiveGlobally.mockResolvedValue("1");
    getChatbotAutoActivationThreshold.mockResolvedValue(0.1);
    setChatbotActiveForConversation.mockResolvedValue(undefined);
    setChatbotActiveGlobally.mockResolvedValue(undefined);
    setChatbotAutoActivationThreshold.mockResolvedValue(undefined);
  });

  it("ignores outgoing messages", async () => {
    const payload: WebhookPayload = { ...basePayload, message_type: "outgoing" };

    const result = await handleCommandRequest(payload);

    expect(result).toEqual({ success: false, message: "Outgoing message - ignoring" });
    expect(sendMessageToChatwoot).not.toHaveBeenCalled();
  });

  it("responds with the list of available commands", async () => {
    const payload: WebhookPayload = { ...basePayload, content: COMMANDS.SHOW_COMMANDS };

    const result = await handleCommandRequest(payload);

    expect(result).toEqual({ success: true, message: "Commands shown." });
    expect(sendMessageToChatwoot).toHaveBeenCalledWith(
      process.env.CW_ACCOUNT_ID,
      payload.conversation.id,
      expect.stringContaining("Available commands")
    );
  });

  it("blocks conversations when the chatbot is globally disabled", async () => {
    getChatbotActiveGlobally.mockResolvedValue("0");

    const result = await handleCommandRequest({ ...basePayload, content: "mensagem" });

    expect(result).toEqual({ success: false, message: "Chatbot is not active globally." });
    expect(getChatbotActiveForConversation).not.toHaveBeenCalled();
  });

  it("auto-activates a conversation when threshold condition is met", async () => {
    getChatbotActiveForConversation.mockResolvedValueOnce(null);
    getChatbotAutoActivationThreshold.mockResolvedValue(0.9);

    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.1);

    const result = await handleCommandRequest({ ...basePayload, content: "olá" });

    expect(result).toBe(false);
    expect(setChatbotActiveForConversation).toHaveBeenCalledWith(basePayload.conversation.id, true);

    randomSpy.mockRestore();
  });

  it("keeps the chatbot disabled when threshold is not met", async () => {
    getChatbotActiveForConversation.mockResolvedValueOnce(null);
    getChatbotAutoActivationThreshold.mockResolvedValue(0.2);

    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.9);

    const result = await handleCommandRequest({ ...basePayload, content: "olá" });

    expect(result).toEqual({ success: false, message: "Chatbot is not active." });
    expect(setChatbotActiveForConversation).toHaveBeenCalledWith(basePayload.conversation.id, false);

    randomSpy.mockRestore();
  });
});
