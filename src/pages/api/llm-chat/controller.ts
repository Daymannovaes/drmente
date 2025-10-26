import type { WebhookPayload } from "./webhook-payload.entity";
import { handleCommandRequest } from "./commands";
import {
  buildIntakePrompt,
  saveLlmReplyIntoConversation,
  saveMessagePayloadConversation,
} from "./redis";
import {
  completeConversationAndNotifyDoctor,
  getIntakeReply,
  sendMessageToChatwoot,
} from "./services";
import type { CommandHandlerResult, IntakeReply } from "./types";

export type ControllerResult =
  | { type: "command"; payload: CommandHandlerResult }
  | { type: "llm"; payload: { conversationId: number; reply: IntakeReply } };

export async function handleLlmChatWebhook(payload: WebhookPayload): Promise<ControllerResult> {
  const commandResult = await handleCommandRequest(payload);

  if (commandResult) {
    return { type: "command", payload: commandResult };
  }

  const { conversationId } = await saveMessagePayloadConversation(payload);
  const prompt = await buildIntakePrompt(conversationId);

  const reply = await getIntakeReply({ system: prompt.system, messages: prompt.messages });

  await saveLlmReplyIntoConversation(conversationId, reply.text);

  if (reply.isComplete) {
    await completeConversationAndNotifyDoctor(payload);
  }

  console.log("prompt", prompt);
  console.log("reply", reply);

  await sendMessageToChatwoot(process.env.CW_ACCOUNT_ID!, conversationId, reply.text);

  return { type: "llm", payload: { conversationId, reply } };
}
