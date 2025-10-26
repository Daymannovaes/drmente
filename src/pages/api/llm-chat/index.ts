import type { VercelRequest, VercelResponse } from "@vercel/node";
import { WebhookPayload } from "./webhook-payload.entity";
import { handleLlmChatWebhook } from "./controller";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.error("about to call the LLM", req.method);

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return false;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const result = await handleLlmChatWebhook(req.body as WebhookPayload);

    if (result.type === "command") {
      const conversationId = (req.body as WebhookPayload)?.conversation?.id;
      return res
        .status(200)
        .json({ ok: true, conversationId, reply: { text: result.payload.message } });
    }

    const { conversationId, reply } = result.payload;

    return res.status(200).json({ ok: true, conversationId, reply });
  } catch (error) {
    console.error("Error handling request:", error);
    const status = (error as Error & { status?: number }).status || 500;
    return res.status(status).json({
      ok: false,
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
}
