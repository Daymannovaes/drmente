import { beforeEach, describe, expect, it, vi } from "vitest";
import type { WebhookPayload } from "@/pages/api/llm-chat/webhook-payload.entity";

const mocks = vi.hoisted(() => ({
  handleCommandRequest: vi.fn(),
  buildIntakePrompt: vi.fn(),
  saveLlmReplyIntoConversation: vi.fn(),
  saveMessagePayloadConversation: vi.fn(),
  completeConversationAndNotifyDoctor: vi.fn(),
  getIntakeReply: vi.fn(),
  sendMessageToChatwoot: vi.fn(),
}));

vi.mock("@/pages/api/llm-chat/commands", () => ({
  handleCommandRequest: mocks.handleCommandRequest,
}));

vi.mock("@/pages/api/llm-chat/redis", () => ({
  buildIntakePrompt: mocks.buildIntakePrompt,
  saveLlmReplyIntoConversation: mocks.saveLlmReplyIntoConversation,
  saveMessagePayloadConversation: mocks.saveMessagePayloadConversation,
}));

vi.mock("@/pages/api/llm-chat/services", () => ({
  completeConversationAndNotifyDoctor: mocks.completeConversationAndNotifyDoctor,
  getIntakeReply: mocks.getIntakeReply,
  sendMessageToChatwoot: mocks.sendMessageToChatwoot,
}));

import { handleLlmChatWebhook } from "@/pages/api/llm-chat/controller";

const {
  handleCommandRequest,
  buildIntakePrompt,
  saveLlmReplyIntoConversation,
  saveMessagePayloadConversation,
  completeConversationAndNotifyDoctor,
  getIntakeReply,
  sendMessageToChatwoot,
} = mocks;

const payload: WebhookPayload = {
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
    id: 999,
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
  id: 10,
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

describe("llm-chat controller", () => {
  beforeEach(() => {
    process.env.CW_ACCOUNT_ID = "15";
    vi.clearAllMocks();
  });

  it("returns command responses without touching the LLM pipeline", async () => {
    handleCommandRequest.mockResolvedValueOnce({ success: true, message: "ok" });

    const result = await handleLlmChatWebhook(payload);

    expect(result).toEqual({ type: "command", payload: { success: true, message: "ok" } });
    expect(saveMessagePayloadConversation).not.toHaveBeenCalled();
  });

  it("processes the LLM workflow when no command is handled", async () => {
    handleCommandRequest.mockResolvedValueOnce(false);
    saveMessagePayloadConversation.mockResolvedValueOnce({ conversationId: payload.conversation.id });
    buildIntakePrompt.mockResolvedValueOnce({ system: "system", messages: [{ role: "user", content: "Olá" }] });
    const reply = { text: "Oi", isComplete: true, currentStep: 1, fluxo: "1", raw: {} };
    getIntakeReply.mockResolvedValueOnce(reply);

    const result = await handleLlmChatWebhook(payload);

    expect(saveMessagePayloadConversation).toHaveBeenCalledWith(payload);
    expect(buildIntakePrompt).toHaveBeenCalledWith(payload.conversation.id);
    expect(getIntakeReply).toHaveBeenCalledWith({ system: "system", messages: [{ role: "user", content: "Olá" }] });
    expect(saveLlmReplyIntoConversation).toHaveBeenCalledWith(payload.conversation.id, reply.text);
    expect(completeConversationAndNotifyDoctor).toHaveBeenCalledWith(payload);
    expect(sendMessageToChatwoot).toHaveBeenCalledWith(process.env.CW_ACCOUNT_ID, payload.conversation.id, reply.text);

    expect(result).toEqual({
      type: "llm",
      payload: { conversationId: payload.conversation.id, reply },
    });
  });
});
