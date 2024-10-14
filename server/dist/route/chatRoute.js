import express from "express";
import { sendMessage, messageHandler, deleteMessage, details } from "../controller/chatController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
const router = express.Router();
router.get("/:currentUserId/:type/:selectedId", authMiddleware, messageHandler);
router.get("/:type/:_id", authMiddleware, details);
router.post("/send", authMiddleware, sendMessage);
router.delete("/delete/:messageId/:senderId", authMiddleware, deleteMessage);
export default router;
