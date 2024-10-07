import { model, Schema, Document } from "mongoose";

interface ChatDocument extends Document {
  groupId: Schema.Types.ObjectId;
  senderId: Schema.Types.ObjectId;
  receiverId: Schema.Types.ObjectId;
  message: string;
  timeStamp: Date;
}

const chatSchema = new Schema<ChatDocument>({
  groupId: { type: Schema.Types.ObjectId, ref: "Groups" },
  senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  receiverId: { type: Schema.Types.ObjectId, ref: "User" },
  message: { type: String, required: true },
  timeStamp: { type: Date, default: Date.now },
});

export const Chat = model<ChatDocument>("Chat", chatSchema);
