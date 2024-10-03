import { model, Schema, Document } from "mongoose";

interface ChatDocument extends Document {
  senderId: Schema.Types.ObjectId;
  receiverId: Schema.Types.ObjectId;
  message: string;
  timestamp: Date;
}

const chatSchema = new Schema<ChatDocument>({
  senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  receiverId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

export const Chat = model<ChatDocument>("Chat", chatSchema);
