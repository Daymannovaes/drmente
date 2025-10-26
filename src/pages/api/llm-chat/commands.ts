import type { WebhookPayload } from "./webhook-payload.entity";
import type { CommandHandlerResult } from "./types";
import {
  deleteConversationFromRedis,
  getChatbotActiveForConversation,
  getChatbotActiveGlobally,
  getChatbotAutoActivationThreshold,
  setChatbotActiveForConversation,
  setChatbotActiveGlobally,
  setChatbotAutoActivationThreshold,
} from "./redis";
import { sendMessageToChatwoot } from "./services";

export enum COMMANDS {
  RESET = "[command] reset",
  CHATBOT_ON_GLOBAL = "[command] chatbot global on",
  CHATBOT_OFF_GLOBAL = "[command] chatbot global off",
  CHATBOT_ON = "[command] chatbot on",
  CHATBOT_OFF = "[command] chatbot off",
  CHATBOT_ON_OTHER = "[command] chatbot on ",
  CHATBOT_OFF_OTHER = "[command] chatbot off ",
  CHATBOT_END_OTHER_instruction = `
    exemplo:
    [command] chatbot end (desliga o proprio chat)
    [command] chatbot end 32 (desliga o chat com id 32)
`,
  CHATBOT_THRESHOLD_SET = "[command] set threshold ",
  CHATBOT_THRESHOLD_SET_instruction = `
    exemplo:
    [command] set threshold 0.1 (define a probabilidade de 10% para ativar o chatbot)
`,
  CHATBOT_THRESHOLD_GET = "[command] get threshold",
  SHOW_COMMANDS = "[command] show commands",
}

export async function handleCommandRequest(payload: WebhookPayload): Promise<CommandHandlerResult | false> {
  const conversationId = payload?.conversation?.id;
  if (!conversationId) {
    const err = new Error("conversation.id ausente no payload");
    (err as Error & { status: number }).status = 400;
    throw err;
  }

  if (payload.message_type === "outgoing") {
    console.log("outgoing message - ignoring");
    return { success: false, message: "Outgoing message - ignoring" };
  }

  const messageContent = payload?.content?.trim().toLowerCase() ?? "";

  if (messageContent === COMMANDS.SHOW_COMMANDS) {
    await sendMessageToChatwoot(
      process.env.CW_ACCOUNT_ID!,
      conversationId,
      "Available commands:\n\n" + Object.values(COMMANDS).join("\n")
    );
    return { success: true, message: "Commands shown." };
  }

  if (messageContent === COMMANDS.CHATBOT_ON_GLOBAL) {
    await setChatbotActiveGlobally(true);
    await sendMessageToChatwoot(process.env.CW_ACCOUNT_ID!, conversationId, "[command] chatbot global activated.");
    return { success: true, message: "[command] chatbot global activated." };
  }

  if (messageContent === COMMANDS.CHATBOT_OFF_GLOBAL) {
    await setChatbotActiveGlobally(false);
    await sendMessageToChatwoot(process.env.CW_ACCOUNT_ID!, conversationId, "[command] chatbot global deactivated.");
    return { success: true, message: "[command] chatbot global deactivated." };
  }

  if (messageContent === COMMANDS.RESET) {
    await deleteConversationFromRedis(conversationId);
    await sendMessageToChatwoot(process.env.CW_ACCOUNT_ID!, conversationId, "[command] reset - ok.");
    return { success: true, message: "[command] reset - ok." };
  }

  if (messageContent === COMMANDS.CHATBOT_ON) {
    await setChatbotActiveForConversation(conversationId, true);
    await sendMessageToChatwoot(process.env.CW_ACCOUNT_ID!, conversationId, "[command] chatbot activated.");
    return { success: true, message: "[command] chatbot activated." };
  }

  if (messageContent === COMMANDS.CHATBOT_OFF) {
    await setChatbotActiveForConversation(conversationId, false);
    await sendMessageToChatwoot(process.env.CW_ACCOUNT_ID!, conversationId, "[command] chatbot deactivated.");
    return { success: true, message: "[command] chatbot deactivated." };
  }

  if (messageContent.startsWith(COMMANDS.CHATBOT_THRESHOLD_SET)) {
    const threshold = parseFloat(messageContent.replace(COMMANDS.CHATBOT_THRESHOLD_SET, ""));

    if (Number.isNaN(threshold)) {
      return { success: true, message: "Invalid threshold" };
    }

    await setChatbotAutoActivationThreshold(threshold);
    await sendMessageToChatwoot(
      process.env.CW_ACCOUNT_ID!,
      conversationId,
      "[command] chatbot threshold set to " + threshold
    );
    return { success: true, message: "[command] chatbot threshold set to " + threshold };
  }

  if (messageContent.startsWith(COMMANDS.CHATBOT_ON_OTHER)) {
    const conversationToOn = parseInt(messageContent.replace(COMMANDS.CHATBOT_ON_OTHER, ""), 10);

    if (Number.isNaN(conversationToOn)) {
      return { success: true, message: "Invalid conversation ID" };
    }

    await setChatbotActiveForConversation(conversationToOn, true);
    await sendMessageToChatwoot(
      process.env.CW_ACCOUNT_ID!,
      conversationId,
      "[command] chatbot on - " + conversationToOn
    );
    return { success: true, message: "[command] chatbot on - " + conversationToOn };
  }

  if (messageContent.startsWith(COMMANDS.CHATBOT_OFF_OTHER)) {
    const conversationToOff = parseInt(messageContent.replace(COMMANDS.CHATBOT_OFF_OTHER, ""), 10);

    if (Number.isNaN(conversationToOff)) {
      return { success: true, message: "Invalid conversation ID" };
    }

    await setChatbotActiveForConversation(conversationToOff, false);
    await sendMessageToChatwoot(
      process.env.CW_ACCOUNT_ID!,
      conversationId,
      "[command] chatbot off - " + conversationToOff
    );
    return { success: true, message: "[command] chatbot off - " + conversationToOff };
  }

  if (messageContent === COMMANDS.CHATBOT_THRESHOLD_GET) {
    const threshold = await getChatbotAutoActivationThreshold();
    await sendMessageToChatwoot(
      process.env.CW_ACCOUNT_ID!,
      conversationId,
      "[command] chatbot threshold get: " + threshold
    );
    return { success: true, message: "[command] chatbot threshold get - " + threshold };
  }

  const chatbotActiveGlobally = await getChatbotActiveGlobally();
  if (chatbotActiveGlobally !== "1") {
    console.log("chatbot not active globally - ignoring");
    return { success: false, message: "Chatbot is not active globally." };
  }

  const chatbotActiveForChat = await getChatbotActiveForConversation(conversationId);

  if (chatbotActiveForChat === null) {
    const threshold = await getChatbotAutoActivationThreshold();

    if (Math.random() < threshold) {
      await setChatbotActiveForConversation(conversationId, true);
      console.log("chatbot auto-activated for this chat", conversationId);
      return false;
    }

    await setChatbotActiveForConversation(conversationId, false);
    console.log("chatbot not auto-activated for this chat", conversationId);
    return { success: false, message: "Chatbot is not active." };
  }

  if (chatbotActiveForChat !== "1") {
    console.log("chatbot not active for this chat - ignoring", conversationId);
    return { success: false, message: "Chatbot is not active." };
  }

  console.log("chatbot active for this chat - processing", conversationId);
  return false;
}
