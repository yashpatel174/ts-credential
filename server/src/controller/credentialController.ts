import credentialSchema from "../model/credentialModel.js";
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import JWT from "jsonwebtoken";
import nodemailer, { Transporter } from "nodemailer";
import dotenv from "dotenv";
import { required, response } from "../utils/utils.js";

dotenv.config();

declare module "express-session" {
  interface SessionData {
    token: string;
  }
}

interface UserTypes {
  email: string;
  password: string;
  save(): Promise<UserTypes>;
}

interface User {
  email: string;
}

interface CustomRequest extends Request {
  user: {
    email: string;
  };
}

const smtpHost: string = process.env.SMTP_HOST as string;
const smtpPort: number = parseInt(process.env.SMTP_PORT as string, 10);
const smtpSecure: boolean = process.env.SMTP_SECURE === "true";
const smtpUser: string = process.env.EMAIL as string;
const smtpPass: string = process.env.PASSWORD as string;

const register = async (req: Request<{}, {}, UserTypes>, res: Response): Promise<Response> => {
  try {
    const { email, password } = req.body;
    required(res, { email }, { password });

    const existingUser = await credentialSchema.findOne({ email });
    if (existingUser) return response(res, "This email is already registered!");

    const user = new credentialSchema({ email, password });
    await user.save();

    return response(res, "Email registered successfully!", 200, user);
  } catch (error) {
    return res.status(500).send({ message: "Error while registering email.", error: (error as Error).message });
  }
};

const login = async (req: Request<{}, {}, UserTypes>, res: Response): Promise<Response> => {
  try {
    const { email, password } = req.body;
    required(res, { email }, { password });

    const existingUser = await credentialSchema.findOne({ email });
    if (!existingUser) return response(res, "User not registered by this email");

    const isMatch = await bcrypt.compare(password, existingUser.password);
    if (!isMatch) return response(res, "Incorrect password.");

    const token = JWT.sign({ _id: existingUser._id }, process.env.SECRET_KEY as string, {
      expiresIn: process.env.EXPIRE,
    });

    req.session.token = token;

    return response(res, "User logged in successfully!", 200, token);
  } catch (error) {
    return res.status(500).send({ message: "Error while Logging in the user.", error: (error as Error).message });
  }
};

const dashboard = async (req: CustomRequest, res: Response): Promise<Response> => {
  try {
    if (!req.user || Object.keys(req.user).length === 0) {
      return response(res, "Error while getting user!", 400);
    }
    const user = req.user;
    return response(res, "Welcome to the dashboard!", 200, user.email);
  } catch (error) {
    return res.status(500).send({
      error: (error as Error).message,
    });
  }
};

const logout = async (req: Request, res: Response): Promise<Response> => {
  try {
    await new Promise<void>((resolve, reject) => {
      req.session.destroy((err) => {
        if (err) {
          return response(res, "Error while logging out!");
        }
        resolve();
      });
    });

    res.clearCookie("connect.sid");

    return response(res, "Logged out successfully!");
  } catch (error) {
    return res.status(500).send({
      message: "An error occurred during logout.",
      error: (error as Error).message,
    });
  }
};

let transporter: Transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpSecure,
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

const requestPasswordReset = async (req: Request<User>, res: Response): Promise<Response> => {
  try {
    const { email } = req.body;
    required(res, { email });

    const user = await credentialSchema.findOne({ email });
    if (!user) return response(res, "This email is not registered!");

    const token = JWT.sign({ _id: user._id }, process.env.SECRET_KEY as string, { expiresIn: "2m" });
    const resetLink = `http://localhost:3000/reset-password/${token}`;

    await credentialSchema.findOneAndUpdate(
      { email },
      {
        $set: {
          resetToken: token,
          resetTokenExpiration: Date.now() + 2 * 60 * 1000,
        },
      }
    );

    await transporter.sendMail({
      from: process.env.EMAIL,
      to: email,
      subject: "Password Reset",
      text: `Click on the following link to reset your password: ${resetLink}`,
    });
    return response(res, "Link has been sent successfully!", 200, token);
  } catch (error) {
    return res.status(500).send({
      messaeg: "error while sending mail!",
      error: (error as Error).message,
    });
  }
};

const resetPassword = async (req: Request, res: Response): Promise<Response> => {
  try {
    const token: string = req.params.token;
    const { password, confirmPassword }: { password?: string; confirmPassword?: string } = req.body;

    if (!password) return response(res, "Password is required!.", 400);
    if (!confirmPassword) return response(res, "Confirm password is required!.", 400);

    const secretKey = process.env.SECRET_KEY;
    if (!secretKey) {
      return response(res, "Server configuration error.", 500);
    }

    const decoded = await new Promise<{ _id: string }>((resolve, reject) => {
      JWT.verify(token, secretKey, (err, decoded) => {
        if (err) {
          return reject(err);
        }
        resolve(decoded as { _id: string });
      });
    });
    if (!decoded) return response(res, "Invalid token or token not found!");

    const user = await credentialSchema.findById(decoded._id);
    if (!user) return response(res, "This email is not registered!", 404);

    if (password !== confirmPassword) return response(res, "Passwords do not match.", 400);

    user.password = password;
    await user.save();

    return response(res, "Password has been reset successfully.");
  } catch (error) {
    return res.status(401).send({ message: "Invalid or expired token.", error: (error as Error).message });
  }
};

export { register, login, dashboard, logout, requestPasswordReset, resetPassword };
