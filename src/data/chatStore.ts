import { getMongoDb } from "./mongodb.js";

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  role: ChatRole;
  content: string;
  createdAt: string;
};

type PersistedChat = {
  requestId: string;
  userId: string;
  messages: ChatMessage[];
  updatedAt: string;
};

export class ChatStore {
  async getConversation(requestId: string, userId: string): Promise<ChatMessage[]> {
    const db = await getMongoDb();
    const doc = await db.collection<PersistedChat>("analysis_chats").findOne({ requestId, userId });
    return doc?.messages ?? [];
  }

  async appendMessages(requestId: string, userId: string, newMessages: ChatMessage[]): Promise<ChatMessage[]> {
    const current = await this.getConversation(requestId, userId);
    const merged = [...current, ...newMessages].slice(-30);

    const db = await getMongoDb();
    await db.collection<PersistedChat>("analysis_chats").updateOne(
      { requestId, userId },
      {
        $set: {
          requestId,
          userId,
          messages: merged,
          updatedAt: new Date().toISOString()
        }
      },
      { upsert: true }
    );

    return merged;
  }
}
