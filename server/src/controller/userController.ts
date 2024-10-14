import userSchema, { IUsers } from "../model/userModel.js";
import groupSchema, { IGroups } from "../model/groupModel.js";
import { Types } from "mongoose";
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import JWT from "jsonwebtoken";
import nodemailer, { Transporter } from "nodemailer";
import dotenv from "dotenv";
import { required, response } from "../utils/utils.js";
import { message } from "../utils/messages.js";

dotenv.config();

declare module "express-session" {
  interface SessionData {
    token: string;
  }
}

interface UserTypes {
  userName: string;
  email: string;
  password: string;
  save(): Promise<UserTypes>;
}

interface User extends Request {
  email: string;
}

export interface CustomRequest extends Request {
  user?: {
    _id: Types.ObjectId;
    userName: string;
    role: string;
  };
}

const smtpHost: string = process.env.SMTP_HOST as string;
const smtpPort: number = parseInt(process.env.SMTP_PORT as string, 10);
const smtpSecure: boolean = process.env.SMTP_SECURE === "true";
const smtpUser: string = process.env.EMAIL as string;
const smtpPass: string = process.env.PASSWORD as string;

const register = async (req: Request<{}, {}, UserTypes>, res: Response): Promise<Response> => {
  try {
    const { userName, email, password } = req.body;
    required(res, { userName }, { email }, { password });

    const existingUser = await userSchema.findOne({ userName });
    if (existingUser) return response(res, message.exist_userName);

    const user = new userSchema({ userName, email, password });
    await user.save();

    return response(res, message.email_registered, 200, user);
  } catch (error) {
    return res.status(500).send({ message: message.error_in_register, error: (error as Error).message });
  }
};

const login = async (req: Request<{}, {}, UserTypes>, res: Response): Promise<Response> => {
  try {
    const { userName, password } = req.body;
    required(res, { userName }, { password });

    const existingUser = await userSchema.findOne({ userName });
    if (!existingUser) return response(res, message.no_username, 404);

    const isMatch = await bcrypt.compare(password, existingUser.password);
    if (!isMatch) return response(res, message.incorrect_password);

    const token = JWT.sign({ _id: existingUser._id }, process.env.SECRET_KEY as string, {
      expiresIn: process.env.EXPIRE,
    });

    req.session.token = token;

    return response(res, message.login, 200, token);
  } catch (error) {
    return res.status(500).send({ message: message.login_error, error: (error as Error).message });
  }
};

const dashboard = async (req: CustomRequest, res: Response): Promise<Response> => {
  try {
    const user = req.user;

    if (!user) {
      return response(res, message.user_error, 400);
    }

    const users = await userSchema.find({ _id: { $ne: user._id } });
    if (!users) return response(res, "Users not found!", 404);

    const userList = users.map((u) => ({ userName: u.userName, userId: u._id }));
    const groupList = await groupSchema.find({
      members: { $in: [user._id as Types.ObjectId] },
    });

    const groups = groupList.map((g) => ({ groupName: g.groupName, _id: g._id }));

    const responseData = {
      currentUser: { userName: user.userName, userId: user._id },
      otherUsers: userList,
      groups: groups,
    };

    return response(res, message.dashboard, 200, responseData);
  } catch (error) {
    return res.status(500).send({
      error: (error as Error).message,
    });
  }
};

const userDetails = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { _id } = req.params;

    const user = await userSchema.findById(_id).populate("groups");
    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    return res.status(200).json({
      message: "User data fetched successfully!",
      result: user,
    });
  } catch (error) {
    console.log((error as Error).message);
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
          return response(res, message.logout_error);
        }
        resolve();
      });
    });

    res.clearCookie("connect.sid");

    return response(res, message.logout);
  } catch (error) {
    return res.status(500).send({
      message: message.logout_fail,
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

const requestPasswordReset = async (req: Request, res: Response): Promise<Response> => {
  try {
    const requ = req as User;
    const { email } = requ.body;
    required(res, { email });

    const user = await userSchema.findOne({ email });
    if (!user) return response(res, message.no_email, 404);

    const token = JWT.sign({ _id: user._id }, process.env.SECRET_KEY as string, { expiresIn: "2m" });
    const resetLink = `${message.link}${token}`;

    await userSchema.findOneAndUpdate(
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
    return response(res, message.link_sent, 200, token);
  } catch (error) {
    return res.status(500).send({
      messaeg: message.mail_error,
      error: (error as Error).message,
    });
  }
};

const resetPassword = async (req: Request, res: Response): Promise<Response> => {
  try {
    const token: string = req.params.token;
    const { password, confirmPassword }: { password: string; confirmPassword: string } = req.body;

    if (!password) return response(res, message.password_required, 400);
    if (!confirmPassword) return response(res, message.confirm_password, 400);

    const secretKey = process.env.SECRET_KEY;
    if (!secretKey) {
      return response(res, message.server_config_err, 500);
    }

    const decoded = await new Promise<{ _id: string }>((resolve, reject) => {
      JWT.verify(token, secretKey, (err, decoded) => {
        if (err) {
          return reject(err);
        }
        resolve(decoded as { _id: string });
      });
    });
    if (!decoded) return response(res, message.no_token);

    const user = await userSchema.findById(decoded._id);
    if (!user) return response(res, message.no_email, 404);

    if (password !== confirmPassword) return response(res, message.no_match, 400);

    user.password = password;
    await user.save();

    return response(res, message.reset_password);
  } catch (error) {
    return res.status(401).send({ message: message.token_expired, error: (error as Error).message });
  }
};

export { register, login, dashboard, userDetails, logout, requestPasswordReset, resetPassword };
