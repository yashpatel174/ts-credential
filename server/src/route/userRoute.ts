import express from "express";
import {
  login,
  logout,
  register,
  dashboard,
  resetPassword,
  requestPasswordReset,
  userDetails,
} from "../controller/userController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/dashboard", authMiddleware, dashboard);
router.get("/details/:_id", authMiddleware, userDetails);
router.post("/logout", logout);
router.post("/forgot-password", requestPasswordReset);
router.post("/reset-password/:token", resetPassword);

export default router;
