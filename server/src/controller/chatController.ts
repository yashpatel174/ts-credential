import { Server } from "socket.io";
import groupSchema from "../model/groupModel.js";
import http from "http";
import app, { Request, Response } from "express";
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

const getMessage = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { currentUserId, selectedUserId, selectedGroupId } = req.params;

    const query: any = {};

    if (selectedGroupId) {
      query.groupId = selectedGroupId;
      console.log(selectedGroupId, "selectedGroupId");
    } else {
      query.$or = [
        { senderId: currentUserId, receiverId: selectedUserId },
        { senderId: selectedUserId, receiverId: currentUserId },
      ];
    }

    const messages = await Chat.find(query).sort({ timeStamp: 1 });

    return response(res, "Messages retrieved successfully", 200, { messages });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Error while getting messages!",
      error: (error as Error).message,
    });
  }
};

const sendMessage = async (req: Request, res: Response): Promise<Response> => {
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
    } else {
      const newMessage = new Chat({
        senderId,
        receiverId,
        message,
      });
      console.log(newMessage, "newMessage before save");
      const savedMessage = await newMessage.save();
      console.log(savedMessage, "savedMessage");
      console.log(newMessage, "newMessage after save");
      return response(res, "", 201, newMessage);
    }
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Error while sending message!",
      error: (error as Error).message,
    });
  }
};

export { getMessage, sendMessage };
