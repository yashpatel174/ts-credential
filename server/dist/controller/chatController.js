import { Server } from "socket.io";
import groupSchema from "../model/groupModel.js";
import http from "http";
import app from "express";
import { Chat } from "../model/chatModel.js";
import { required, response } from "../utils/utils.js";
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
    },
});
io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);
    socket.on("joinRoom", ({ userId, targetUserId }) => {
        const room = `${userId}-${targetUserId}`;
        socket.join(room);
        socket.emit("roomJoined", { room, message: "You have joined the room" });
    });
    socket.on("sendMessage", ({ room, message }) => {
        io.to(room).emit("receiveMessage", message);
    });
    socket.on("disconnect", () => {
        console.log("Client disconnected!", socket.id);
    });
});
server.listen(5000, () => {
    console.log("Server is running on port 5000");
});
const userMessage = async (req, res) => {
    try {
        const { currentUserId, selectedUserId } = req.params;
        const messages = await Chat.find({
            $or: [
                { senderId: currentUserId, receiverId: selectedUserId },
                { senderId: selectedUserId, receiverId: currentUserId },
            ],
        }).sort({ timeStampo: 1 });
        messages.forEach((message) => {
            if ((message.senderId.toString(), message.senderId.toString() === currentUserId.toString())) {
                console.log(currentUserId, "currentUserId");
                message.sender = true;
            }
            else {
                message.sender = false;
            }
        });
        return response(res, "Messages retrieved successfully", 200, { messages });
    }
    catch (error) {
        return res.status(500).send({
            success: false,
            message: "Error while getting messages!",
            error: error.message,
        });
    }
};
const deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        required(res, { messageId });
        const message = await Chat.findById({ _id: messageId });
        if (!message)
            return response(res, "Message not found", 404);
        console.log(message, "message");
        await Chat.findOneAndDelete({ _id: messageId });
        return response(res, "Message deleted successfully!", 200);
    }
    catch (error) {
        return response(res, "Error while deleting message", 500, error.message);
    }
};
const groupMessage = async (req, res) => {
    try {
        const { currentUserId, selectedGroupId } = req.params;
        required(res, { currentUserId }, { selectedGroupId });
        const messages = await Chat.find({ senderId: currentUserId, groupId: selectedGroupId }).sort({ timeStamp: 1 });
        if (!messages || messages.length === 0)
            return response(res, "No data found", 404);
        console.log(messages, "messages log in backend");
        return response(res, "Messages retrieved successfully", 200, { messages });
    }
    catch (error) {
        console.log(error.message);
        return response(res, "Error while getting messages!", 500, error.message);
    }
};
const sendMessage = async (req, res) => {
    try {
        const { senderId, receiverId, message, groupId } = req.body;
        let newMessage;
        if (groupId) {
            const group = await groupSchema.findById(groupId);
            if (!group)
                return response(res, "Group not found!", 404);
            const groupMessage = new Chat({
                senderId,
                groupId,
                message,
            });
            newMessage = await groupMessage.save();
        }
        else {
            const userMessage = new Chat({
                senderId,
                receiverId,
                message,
            });
            newMessage = await userMessage.save();
        }
        return response(res, "", 201, newMessage);
    }
    catch (error) {
        return res.status(500).send({
            success: false,
            message: "Error while sending message!",
            error: error.message,
        });
    }
};
export { userMessage, groupMessage, sendMessage, deleteMessage };
