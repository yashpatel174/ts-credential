import express from "express";
import { groupMessage, sendMessage, userMessage } from "../controller/chatController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
const router = express.Router();

router.get("/:currentUserId/:selectedUserId", authMiddleware, userMessage);
router.get("/:currentUserId/:selectedGroupId", authMiddleware, groupMessage);
router.post("/send", authMiddleware, sendMessage);

export default router;
