import express from "express";
import { createGroup, userList, groupList, addUser, removeUser, deleteGroup } from "../controller/groupController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();
router.get("/user-list", authMiddleware, userList);
router.get("/", authMiddleware, groupList);
router.post("/create", authMiddleware, createGroup);
router.post("/addUser", authMiddleware, addUser);
router.post("/removeUser", authMiddleware, removeUser);
router.delete("/groups/:groupId", authMiddleware, deleteGroup);

export default router;
