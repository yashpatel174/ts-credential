import { Types } from "mongoose";

declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: Types.ObjectId;
        userName: string;
        role: string;
      };
      group?: {
        _id: Types.ObjectId;
      };
    }
  }
}
