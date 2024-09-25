import credentialModel from "../model/credentialModel.js";
import JWT from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
export const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization ? req.headers.authorization.replace("Bearer ", "") : req.session.token;
        if (!token)
            return res.send({ message: "Token not provided or invalid token!" });
        const decoded = JWT.verify(token, process.env.SECRET_KEY);
        const user = await credentialModel.findById(decoded._id);
        if (!user)
            return res.send({ message: "User not found." });
        req.token = token;
        req.user = user;
        next();
    }
    catch (error) {
        return res.status(500).send({ message: "Error while verifying token!" });
    }
};
