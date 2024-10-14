import { Server } from "socket.io";
import groupSchema from "../model/groupModel.js";
import userSchema from "../model/userModel.js";
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
            messages = await Chat.find({ senderId: currentUserId, groupId: selectedId });
        }
        else {
            return response(res, "Message not found", 404);
        }
        messages.forEach((message) => {
            if ((message.senderId.toString(), message.senderId.toString() === currentUserId.toString())) {
                console.log(currentUserId, "currentUserId");
                message.sender = true;
            }
            else {
                message.sender = false;
            }
        });
        return response(res, "Messages received successfully!", 200, { messages });
    }
    catch (error) {
        return response(res, "Error while fetching data", 500, error.message);
    }
};
const details = async (req, res) => {
    try {
        const { _id, type } = req.params;
        let user;
        if (type === "user") {
            user = await userSchema.findById(_id).populate("groups");
            if (!user)
                response(res, "User not found", 404);
        }
        else if (type === "group") {
            user = await groupSchema.findById(_id).populate("admin members");
        }
        else {
            response(res, "No data found", 404);
        }
        return response(res, "Data received successfully", 200, { user });
    }
    catch (error) {
        return response(res, "Error while getting data", 500, error.message);
    }
};
const deleteMessage = async (req, res) => {
    try {
        const { messageId, senderId } = req.params;
        required(res, { messageId }, { senderId });
        const userId = req.user._id;
        const message = await Chat.findOne({ _id: messageId, senderId: userId });
        if (!message)
            return response(res, "Message not found", 404);
        console.log(message, "message");
        await Chat.findOneAndDelete({ _id: message._id });
        return response(res, "Message deleted successfully!", 200);
    }
    catch (error) {
        return response(res, "Error while deleting message", 500, error.message);
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
export { messageHandler, sendMessage, deleteMessage, details };
