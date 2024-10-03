import { Server } from "socket.io";
import http from "http";
import app from "express";
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
server.listen(3000, () => {
    console.log("Server is running on port 3000");
});
