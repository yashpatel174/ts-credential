import userSchema from "../model/userModel.js";
import JWT from "jsonwebtoken";
import dotenv from "dotenv";
import { response } from "../utils/utils.js";
dotenv.config();
export const authMiddleware = async (req, res, next) => {
    try {
        const authReq = req;
        const token = authReq.headers.authorization
            ? authReq.headers.authorization.replace("Bearer ", "")
            : authReq.session.token;
        if (!token)
            return res.send({ message: "Token not provided or invalid token!" });
        const decoded = JWT.verify(token, process.env.SECRET_KEY);
        const user = await userSchema.findById(decoded._id);
        if (!user)
            return res.send({ message: "User not found." });
        authReq.token = token;
        authReq.user = user;
        next();
    }
    catch (error) {
        return res.status(500).send({ message: "Error while verifying token!" });
    }
};
export const isAdmin = async (req, res, next) => {
    try {
        const admin = req.user.role === "admin";
        if (admin) {
            return next();
        }
        else {
            return response(res, "Only admin can access this route!");
        }
    }
    catch (error) {
        return res.status(500).send({ message: "Error while verifying Admin!" });
    }
};
