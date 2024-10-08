import { Server } from "socket.io";
import groupSchema from "../model/groupModel.js";
import http from "http";
import app from "express";
import { Chat } from "../model/chatModel.js";
import { response } from "../utils/utils.js";
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
const groupMessage = async (req, res) => {
    try {
        const { currentUserId, selectedGroupId } = req.params;
        const messages = await Chat.find({ groupId: selectedGroupId, senderId: currentUserId }).sort({ timeStamp: 1 });
        console.log(messages, "messages log in backend");
        return response(res, "Messages retrieved successfully", 200, messages);
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error while getting messages!",
            error: error.message,
        });
    }
};
const sendMessage = async (req, res) => {
    try {
        const { senderId, receiverId, message, groupId, sendToGroup } = req.body;
        if (sendToGroup && groupId) {
            const group = await groupSchema.findById(groupId);
            if (!group) {
                return res.status(404).send({
                    success: false,
                    message: "Group not found!",
                });
            }
            const groupMessage = new Chat({
                senderId,
                message,
                groupId,
            });
            const savedGroupMessage = await groupMessage.save();
            return response(res, "", 201, savedGroupMessage);
        }
        else {
            const newMessage = new Chat({
                senderId,
                receiverId,
                message,
            });
            const savedMessage = await newMessage.save();
            return response(res, "", 201, newMessage);
        }
    }
    catch (error) {
        return res.status(500).send({
            success: false,
            message: "Error while sending message!",
            error: error.message,
        });
    }
};
export { userMessage, groupMessage, sendMessage };
