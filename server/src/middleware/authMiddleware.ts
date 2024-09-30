import { Request, Response, NextFunction } from "express";
import userSchema from "../model/userModel.js";
import JWT from "jsonwebtoken";
import dotenv from "dotenv";
import { Session, SessionData } from "express-session";
import { response } from "utils/utils.js";

dotenv.config();

declare module "express-session" {
  interface SessionData {
    token: string;
  }
}

interface AuthRequest extends Request {
  session: Session & Partial<SessionData>;
  token: string;
  user: any;
}

interface Admin extends Request {
  user: {
    role: string;
  };
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;

    const token = authReq.headers.authorization
      ? authReq.headers.authorization.replace("Bearer ", "")
      : authReq.session.token;
    if (!token) return res.send({ message: "Token not provided or invalid token!" });

    const decoded: any = JWT.verify(token, process.env.SECRET_KEY as string);

    const user = await userSchema.findById(decoded._id);
    if (!user) return res.send({ message: "User not found." });

    authReq.token = token;
    authReq.user = user;

    next();
  } catch (error) {
    return res.status(500).send({ message: "Error while verifying token!" });
  }
};

export const isAdmin = async (req: Admin, res: Response, next: NextFunction) => {
  try {
    const admin = req.user.role === "admin";
    if (admin) {
      return next();
    } else {
      return response(res, "Only admin can access this route!");
    }
  } catch (error) {
    return res.status(500).send({ message: "Error while verifying Admin!" });
  }
};
