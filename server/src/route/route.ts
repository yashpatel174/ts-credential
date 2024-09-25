import express from "express";
import {
  login,
  logout,
  register,
  dashboard,
  resetPassword,
  requestPasswordReset,
} from "../controller/credentialController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/dashboard", authMiddleware, dashboard);
router.post("/logout", logout);
router.post("/forgot-password", requestPasswordReset);
router.post("/reset-password/:token", resetPassword);

export default router;
