import credentialModel from "../model/credentialModel.js";
import JWT from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
export const authMiddleware = async (req, res, next) => {
    try {
        // Cast req to AuthRequest
        const authReq = req;
        const token = authReq.headers.authorization
            ? authReq.headers.authorization.replace("Bearer ", "")
            : authReq.session.token;
        if (!token)
            return res.send({ message: "Token not provided or invalid token!" });
        const decoded = JWT.verify(token, process.env.SECRET_KEY);
        const user = await credentialModel.findById(decoded._id);
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
