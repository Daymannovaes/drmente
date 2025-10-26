import { beforeEach, describe, expect, it, vi } from "vitest";
import type { WebhookPayload } from "@/pages/api/llm-chat/webhook-payload.entity";

const mocks = vi.hoisted(() => {
  const createMock = vi.fn();
  return {
    createMock,
    openAIConstructor: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: createMock,
        },
      },
    })),
    setChatbotActiveForConversation: vi.fn(),
  };
});

vi.mock("openai", () => ({
  default: mocks.openAIConstructor,
}));

vi.mock("@/pages/api/llm-chat/redis", () => ({
  setChatbotActiveForConversation: mocks.setChatbotActiveForConversation,
}));

import {
  completeConversationAndNotifyDoctor,
  cw,
  getIntakeReply,
  sendMessageToChatwoot,
} from "@/pages/api/llm-chat/services";

const { createMock, setChatbotActiveForConversation } = mocks;

describe("llm-chat services", () => {
  beforeEach(() => {
    process.env.CW_ACCOUNT_ID = "25";
    process.env.CW_API_TOKEN = "token";
    process.env.CW_BASE_URL = "https://cw.example.com";
    process.env.OPENAI_API_KEY = "openai";

    vi.clearAllMocks();
  });

  it("sends messages to Chatwoot", async () => {
    const postSpy = vi.spyOn(cw, "post").mockResolvedValueOnce({} as never);

    await sendMessageToChatwoot("25", 123, "Olá");

    expect(postSpy).toHaveBeenCalledWith(
      "/api/v1/accounts/25/conversations/123/messages",
      expect.objectContaining({ content: "Olá", message_type: "outgoing" })
    );

    postSpy.mockRestore();
  });

  it("ignores Chatwoot errors without throwing", async () => {
    const postSpy = vi.spyOn(cw, "post").mockRejectedValueOnce(new Error("network"));

    await expect(sendMessageToChatwoot("25", 123, "Olá")).resolves.toBeUndefined();

    postSpy.mockRestore();
  });

  it("parses intake replies from OpenAI", async () => {
    const openAiResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              message: "Resposta",
              conversation_complete: true,
              current_step: 3,
              fluxo: "1",
            }),
          },
        },
      ],
    };

    createMock.mockResolvedValueOnce(openAiResponse);

    const reply = await getIntakeReply({
      system: "prompt",
      messages: [{ role: "user", content: "Olá" }],
    });

    expect(reply.text).toBe("Resposta");
    expect(reply.isComplete).toBe(true);
    expect(reply.currentStep).toBe(3);
    expect(reply.fluxo).toBe("1");
    expect(reply.raw).toBe(openAiResponse);
  });

  it("deactivates the chatbot and notifies doctors when the conversation is complete", async () => {
    const postSpy = vi.spyOn(cw, "post").mockResolvedValue({} as never);

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
        id: 555,
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

    await completeConversationAndNotifyDoctor(payload);

    expect(setChatbotActiveForConversation).toHaveBeenCalledWith(payload.conversation.id, false);
    expect(postSpy).toHaveBeenCalledTimes(2);
    expect(postSpy.mock.calls.map((call) => call[0])).toEqual([
      "/api/v1/accounts/25/conversations/4/messages",
      "/api/v1/accounts/25/conversations/32/messages",
    ]);

    postSpy.mockRestore();
  });
});
