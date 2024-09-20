import express from "express";
import {
  login,
  logout,
  register,
  dashboard,
  resetPassword,
  requestPasswordReset,
} from "../controller/credentialController.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/dashboard", dashboard);
router.post("/logout", logout);
router.post("/forgot-password", requestPasswordReset);
router.post("/reset-password", resetPassword);

export default router;
