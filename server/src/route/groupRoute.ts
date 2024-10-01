import express from "express";
import { createGroup, userList, addUser } from "../controller/groupController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();
router.post("/create", authMiddleware, createGroup);
router.get("/user-list", authMiddleware, userList);
router.get("/add-user", authMiddleware, addUser);

export default router;
