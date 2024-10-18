import { Server } from "socket.io";
import groupSchema from "../model/groupModel.js";
import userSchema from "../model/userModel.js";
import http from "http";
import app from "express";
import { Chat } from "../model/chatModel.js";
import { required, response } from "../utils/utils.js";
import { message as msg } from "../utils/messages.js";
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
    },
});
io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);
    // Handle private room join for 1-1 chat
    socket.on("join_private_room", (roomId) => {
        socket.join(roomId);
        console.log(`User with ID: ${socket.id} joined private room: ${roomId}`);
    });
    // Handle sending a private message in 1-1 chat
    socket.on("private_message", (data) => {
        const { roomId, message } = data;
        io.to(roomId).emit("receive_private_message", message);
    });
    // Handle joining a group chat
    socket.on("join_group", (groupName) => {
        socket.join(groupName);
        console.log(`User with ID: ${socket.id} joined group: ${groupName}`);
    });
    // Handle sending message in a group chat
    socket.on("group_message", (data) => {
        const { groupName, message } = data;
        io.to(groupName).emit("receive_group_message", message);
    });
    // Handle user disconnect
    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});
server.listen(4000, () => {
    console.log("Server is running on port 4000");
});
const messageHandler = async (req, res) => {
    try {
        const { currentUserId, type, selectedId } = req.params;
        let messages;
        if (type === "user") {
            messages = await Chat.find({
                $or: [
                    { senderId: currentUserId, receiverId: selectedId },
                    { senderId: selectedId, receiverId: currentUserId },
                ],
            }).sort({ timeStampo: 1 });
        }
        else if (type === "group") {
            messages = await Chat.find({ groupId: selectedId }).sort({ timeStamp: 1 });
            console.log(messages, "messages");
        }
        else {
            return response(res, msg.no_msg, 404);
        }
        messages.forEach((message) => {
            if ((message.senderId.toString(), message.senderId.toString() === currentUserId.toString())) {
                message.sender = true;
            }
            else {
                message.sender = false;
            }
        });
        return response(res, msg.message_received, 200, { messages });
    }
    catch (error) {
        return response(res, msg.data_error, 500, error.message);
    }
};
const details = async (req, res) => {
    try {
        const { _id, type } = req.params;
        let user;
        if (type === "user") {
            user = await userSchema.findById(_id).populate("groups");
            if (!user)
                response(res, msg.no_user, 404);
        }
        else if (type === "group") {
            user = await groupSchema.findById(_id).populate("admin members");
        }
        else {
            response(res, msg.no_data, 404);
        }
        return response(res, msg.data_received, 200, { user });
    }
    catch (error) {
        return response(res, msg.data_error, 500, error.message);
    }
};
const deleteMessage = async (req, res) => {
    try {
        const { messageId, senderId } = req.params;
        required(res, { messageId }, { senderId });
        const userId = req.user._id;
        const message = await Chat.findOne({ _id: messageId, senderId: userId });
        if (!message)
            return response(res, msg.no_msg, 404);
        await Chat.findOneAndDelete({ _id: message._id });
        const groupId = message.groupId ? message.groupId.toString() : undefined;
        const messageSenderId = message.senderId.toString();
        const messageReceiverId = message.receiverId.toString();
        if (groupId) {
            io.to(groupId).emit("message_deleted", { messageId });
        }
        else {
            io.to(messageSenderId).emit("message_deleted", { messageId });
            io.to(messageReceiverId).emit("message_deleted", { messageId });
        }
        return response(res, msg.del_msg, 200);
    }
    catch (error) {
        return response(res, msg.msg_del_err, 500, error.message);
    }
};
const sendMessage = async (req, res) => {
    try {
        const { senderId, receiverId, message, groupId } = req.body;
        let newMessage;
        if (groupId) {
            const group = await groupSchema.findById(groupId);
            if (!group)
                return response(res, msg.no_group, 404);
            const groupMessage = new Chat({
                senderId,
                groupId,
                message,
            });
            newMessage = await groupMessage.save();
            io.to(groupId).emit("group_message", newMessage);
        }
        else {
            const userMessage = new Chat({
                senderId,
                receiverId,
                message,
            });
            newMessage = await userMessage.save();
            io.to(senderId).emit("private_message", newMessage);
            io.to(receiverId).emit("private_message", newMessage);
        }
        return response(res, "", 201, newMessage);
    }
    catch (error) {
        return response(res, msg.err_send_msg, 500, error.message);
    }
};
export { messageHandler, sendMessage, deleteMessage, details };
