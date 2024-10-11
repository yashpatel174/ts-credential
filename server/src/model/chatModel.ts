import { model, Schema, Document } from "mongoose";

interface ChatDocument extends Document {
  groupId: Schema.Types.ObjectId;
  senderId: Schema.Types.ObjectId;
  receiverId: Schema.Types.ObjectId;
  message: string;
  timeStamp: Date;
  sender: boolean;
}

const chatSchema = new Schema<ChatDocument>({
  senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  groupId: { type: Schema.Types.ObjectId, ref: "Group" },
  receiverId: { type: Schema.Types.ObjectId, ref: "User" },
  message: { type: String, required: true },
  timeStamp: { type: Date, default: Date.now },
  sender: { type: Boolean, default: false },
});

export const Chat = model<ChatDocument>("Chat", chatSchema);
