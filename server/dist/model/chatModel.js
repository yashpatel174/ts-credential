import { model, Schema } from "mongoose";
const chatSchema = new Schema({
    groupId: { type: Schema.Types.ObjectId, ref: "Groups" },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    receiverId: { type: Schema.Types.ObjectId, ref: "User" },
    message: { type: String, required: true },
    timeStamp: { type: Date, default: Date.now },
});
export const Chat = model("Chat", chatSchema);
