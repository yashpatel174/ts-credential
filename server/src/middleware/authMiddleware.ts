import { Request, Response, NextFunction } from "express";
import credentialModel from "../model/credentialModel.js";
import JWT from "jsonwebtoken";
import dotenv from "dotenv";
import { Session, SessionData } from "express-session";

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

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization ? req.headers.authorization.replace("Bearer ", "") : req.session.token;
    if (!token) return res.send({ message: "Token not provided or invalid token!" });

    const decoded: any = JWT.verify(token, process.env.SECRET_KEY as string);

    const user = await credentialModel.findById(decoded._id);
    if (!user) return res.send({ message: "User not found." });

    req.token = token;
    req.user = user;

    next();
  } catch (error) {
    return res.status(500).send({ message: "Error while verifying token!" });
  }
};
