import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import userRoute from "./route/userRoute.js";
import chatRoute from "./route/chatRoute.js";
import session from "express-session";
const app = express();
dotenv.config();
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "development",
        maxAge: 24 * 60 * 60 * 1000,
    },
}));
// *Routes
app.use("/user", userRoute);
app.use("/chat", chatRoute);
mongoose.connect(process.env.DB).then(() => console.log("Database connected successfully!"));
const port = parseInt(process.env.PORT) || 8080;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
