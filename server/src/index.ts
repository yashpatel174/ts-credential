import express, { Application } from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import credential from "./route/route.js";

const app: Application = express();

dotenv.config();

app.use(cors());
app.use(express.json());

// *Routes
app.use("/user", credential);

mongoose.connect(process.env.DB as string).then(() => console.log("Database connected successfully!"));

const port: number = parseInt(process.env.PORT as string) || 8080;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
