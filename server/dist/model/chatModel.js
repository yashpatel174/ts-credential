import { model, Schema } from "mongoose";
const chatSchema = new Schema({
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    receiverId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
});
export const Chat = model("Chat", chatSchema);
