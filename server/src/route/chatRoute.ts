import express from "express";
import { getMessage, sendMessage } from "../controller/chatController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
const router = express.Router();

router.get("/:currentUserId/:selectedUserId/:selectedGroupId?", authMiddleware, getMessage);
router.post("/send", authMiddleware, sendMessage);

export default router;
