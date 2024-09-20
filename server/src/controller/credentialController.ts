import credentialSchema from "../model/credentialModel.js";
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import JWT from "jsonwebtoken";
import nodemailer, { Transporter } from "nodemailer";
import { promisify } from "util";
import dotenv from "dotenv";

dotenv.config();

interface UserTypes {
  email: string;
  password: string;
  save(): Promise<UserTypes>;
}

interface User {
  email: string;
}

interface CustomRequest extends Request {
  user: User;
}

interface DecodedToken {
  _id: string;
}

const smtpHost: string = process.env.SMTP_HOST as string;
const smtpPort: number = parseInt(process.env.SMTP_PORT as string, 10);
const smtpSecure: boolean = process.env.SMTP_SECURE === "true";
const smtpUser: string = process.env.EMAIL as string;
const smtpPass: string = process.env.PASSWORD as string;

const register = async (req: Request<{}, {}, UserTypes>, res: Response): Promise<Response> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.send({ message: "Emaill & Password are required" });

    const existingUser = await credentialSchema.findOne({ email });
    if (existingUser) return res.send({ message: "This email is already registered!" });

    const user = new credentialSchema({ email, password });
    await user.save();

    return res.status(200).send({ message: "Email registered successfully" });
  } catch (error) {
    return res.status(500).send({ message: "Error while registering email.", error: (error as Error).message });
  }
};

const login = async (req: Request<{}, {}, UserTypes>, res: Response): Promise<Response> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.send({ message: "Emaill & Password are required" });

    const existingUser = await credentialSchema.findOne({ email });
    if (!existingUser) return res.send({ message: "This email is not registered!" });

    const isMatch = await bcrypt.compare(password, existingUser.password);
    if (!isMatch) {
      return res.send({ messgae: "Invalid username or password." });
    }

    const token = JWT.sign({ _id: existingUser._id }, process.env.SECRET_KEY as string, {
      expiresIn: process.env.EXPIRE,
    });

    return res.send({ message: "User logged in successfully!", token: token });
  } catch (error) {
    return res.status(500).send({ message: "Error while Logging in the user.", error: (error as Error).message });
  }
};

const dashboard = async (req: CustomRequest, res: Response): Promise<Response> => {
  try {
    const { user } = req;
    return res.send({ message: "Welcome to the dashboard!", email: user.email });
  } catch (error) {
    return res.status(500).send({ message: "Error while fetching data, try again!", error: (error as Error).message });
  }
};

const logout = async (req: Request, res: Response): Promise<Response> => {
  try {
    await new Promise<void>((resolve, reject) => {
      req.session.destroy((err) => {
        if (err) {
          return reject(new Error("Error while logging out!"));
        }
        resolve();
      });
    });

    res.clearCookie("connect.sid");

    return res.send({ message: "Logged out successfully!" });
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
    if (!email) return res.send({ message: "Email is required!" });

    const user = await credentialSchema.findOne({ email });
    if (!user) return res.send({ message: "This email is not registerd!" });

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
    return res.send({ message: "Link has been sent successfully!", token: token });
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
    const { newPassword, confirmPassword }: { newPassword?: string; confirmPassword?: string } = req.body;

    if (!newPassword) return res.status(400).send({ message: "Password is required." });
    if (!confirmPassword) return res.status(400).send({ message: "Confirm password is required." });

    const secretKey = process.env.SECRET_KEY;
    if (!secretKey) {
      return res.status(500).send({ message: "Server configuration error." });
    }

    const decoded = await new Promise<{ _id: string }>((resolve, reject) => {
      JWT.verify(token, secretKey, (err, decoded) => {
        if (err) {
          return reject(err);
        }
        resolve(decoded as { _id: string });
      });
    });
    if (!decoded) return res.status(401).send({ message: "Invalid token or token not found." });

    const user = await credentialSchema.findById(decoded._id);
    if (!user) return res.status(404).send({ message: "This email is not registered!" });

    if (newPassword !== confirmPassword) return res.status(400).send({ message: "Passwords do not match." });

    user.password = newPassword;
    await user.save();

    return res.status(200).send({ message: "Password has been reset successfully." });
  } catch (error) {
    return res.status(401).send({ message: "Invalid or expired token." });
  }
};

export { register, login, dashboard, logout, requestPasswordReset, resetPassword };
