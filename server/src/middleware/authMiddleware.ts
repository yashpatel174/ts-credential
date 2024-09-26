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

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Cast req to AuthRequest
    const authReq = req as AuthRequest;

    const token = authReq.headers.authorization
      ? authReq.headers.authorization.replace("Bearer ", "")
      : authReq.session.token;
    if (!token) return res.send({ message: "Token not provided or invalid token!" });

    const decoded: any = JWT.verify(token, process.env.SECRET_KEY as string);

    const user = await credentialModel.findById(decoded._id);
    if (!user) return res.send({ message: "User not found." });

    authReq.token = token;
    authReq.user = user;

    next();
  } catch (error) {
    return res.status(500).send({ message: "Error while verifying token!" });
  }
};
