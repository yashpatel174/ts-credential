import credentialSchema from "../model/credentialModel.js";
import bcrypt from "bcrypt";
import JWT from "jsonwebtoken";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { required, response } from "../utils/utils.js";
import { message } from "../utils/messages.js";
dotenv.config();
const smtpHost = process.env.SMTP_HOST;
const smtpPort = parseInt(process.env.SMTP_PORT, 10);
const smtpSecure = process.env.SMTP_SECURE === "true";
const smtpUser = process.env.EMAIL;
const smtpPass = process.env.PASSWORD;
const register = async (req, res) => {
    try {
        const { email, password } = req.body;
        required(res, { email }, { password });
        const existingUser = await credentialSchema.findOne({ email });
        if (existingUser)
            return response(res, message.exist_email);
        const user = new credentialSchema({ email, password });
        await user.save();
        return response(res, message.email_registered, 200, user);
    }
    catch (error) {
        return res.status(500).send({ message: message.error_in_register, error: error.message });
    }
};
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        required(res, { email }, { password });
        const existingUser = await credentialSchema.findOne({ email });
        if (!existingUser)
            return response(res, message.no_email, 404);
        const isMatch = await bcrypt.compare(password, existingUser.password);
        if (!isMatch)
            return response(res, message.incorrect_password);
        const token = JWT.sign({ _id: existingUser._id }, process.env.SECRET_KEY, {
            expiresIn: process.env.EXPIRE,
        });
        req.session.token = token;
        return response(res, message.login, 200, token);
    }
    catch (error) {
        return res.status(500).send({ message: message.login_error, error: error.message });
    }
};
const dashboard = async (req, res) => {
    try {
        const requ = req;
        if (!requ.user || Object.keys(requ.user).length === 0) {
            return response(res, message.user_error, 400);
        }
        const user = requ.user;
        return response(res, message.dashboard, 200, user.email);
    }
    catch (error) {
        return res.status(500).send({
            error: error.message,
        });
    }
};
const logout = async (req, res) => {
    try {
        await new Promise((resolve, reject) => {
            req.session.destroy((err) => {
                if (err) {
                    return response(res, message.logout_error);
                }
                resolve();
            });
        });
        res.clearCookie("connect.sid");
        return response(res, message.logout);
    }
    catch (error) {
        return res.status(500).send({
            message: message.logout_fail,
            error: error.message,
        });
    }
};
let transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
        user: smtpUser,
        pass: smtpPass,
    },
});
const requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;
        required(res, { email });
        const user = await credentialSchema.findOne({ email });
        if (!user)
            return response(res, message.no_email, 404);
        const token = JWT.sign({ _id: user._id }, process.env.SECRET_KEY, { expiresIn: "2m" });
        const resetLink = `${message.link}${token}`;
        await credentialSchema.findOneAndUpdate({ email }, {
            $set: {
                resetToken: token,
                resetTokenExpiration: Date.now() + 2 * 60 * 1000,
            },
        });
        await transporter.sendMail({
            from: process.env.EMAIL,
            to: email,
            subject: "Password Reset",
            text: `Click on the following link to reset your password: ${resetLink}`,
        });
        return response(res, message.link_sent, 200, token);
    }
    catch (error) {
        return res.status(500).send({
            messaeg: message.mail_error,
            error: error.message,
        });
    }
};
const resetPassword = async (req, res) => {
    try {
        const token = req.params.token;
        const { password, confirmPassword } = req.body;
        if (!password)
            return response(res, message.password_required, 400);
        if (!confirmPassword)
            return response(res, message.confirm_password, 400);
        const secretKey = process.env.SECRET_KEY;
        if (!secretKey) {
            return response(res, message.server_config_err, 500);
        }
        const decoded = await new Promise((resolve, reject) => {
            JWT.verify(token, secretKey, (err, decoded) => {
                if (err) {
                    return reject(err);
                }
                resolve(decoded);
            });
        });
        if (!decoded)
            return response(res, message.no_token);
        const user = await credentialSchema.findById(decoded._id);
        if (!user)
            return response(res, message.no_email, 404);
        if (password !== confirmPassword)
            return response(res, message.no_match, 400);
        user.password = password;
        await user.save();
        return response(res, message.reset_password);
    }
    catch (error) {
        return res.status(401).send({ message: message.token_expired, error: error.message });
    }
};
export { register, login, dashboard, logout, requestPasswordReset, resetPassword };
