export interface LlmChatConversation {
  messages: LlmChatMessage[];
  last_updated: string | null;
}

export interface LlmChatMessage {
  id: number;
  content: string;
  created_at: number;
  sender: number;
  sender_name: string;
  sender_phone: string;
  sender_email: string;
  type: "user" | "assistant";
}

export interface IntakePrompt {
  system: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  meta: {
    conversationId: number;
    messagesCount: number;
    lastUpdated: string | null;
  };
}

export interface IntakeReply {
  text: string;
  isComplete: boolean;
  currentStep?: number;
  fluxo?: string;
  raw: unknown;
}

export interface CommandHandlerResult {
  success: boolean;
  message: string;
}
