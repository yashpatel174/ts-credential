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
            return response(res, "Token is not provided!", 404);
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
