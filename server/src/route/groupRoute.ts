import express from "express";
import { createGroup, userList, addUser, removeUser, deleteGroup, groupData } from "../controller/groupController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();
router.get("/user-list", authMiddleware, userList);
router.post("/create", authMiddleware, createGroup);
router.get("/details", authMiddleware, groupData);
router.post("/addUser", authMiddleware, addUser);
router.post("/removeUser", authMiddleware, removeUser);
router.delete("/groups/:groupId", authMiddleware, deleteGroup);

export default router;
