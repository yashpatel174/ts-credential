import { model, Schema } from "mongoose";
const chatSchema = new Schema({
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    groupId: { type: Schema.Types.ObjectId, ref: "Group" },
    receiverId: { type: Schema.Types.ObjectId, ref: "User" },
    message: { type: String, required: true },
    timeStamp: { type: Date, default: Date.now },
});
export const Chat = model("Chat", chatSchema);
