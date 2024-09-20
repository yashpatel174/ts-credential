import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import credential from "./route/route.js";
const app = express();
dotenv.config();
app.use(cors());
app.use(express.json());
// *Routes
app.use("/user", credential);
mongoose.connect(process.env.DB).then(() => console.log("Database connected successfully!"));
const port = parseInt(process.env.PORT) || 8080;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
