import express, { Application } from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import route from "./route/userRoute.js";
import session from "express-session";

const app: Application = express();

dotenv.config();

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  session({
    secret: process.env.SECRET_KEY as string,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "development",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

// *Routes
app.use("/user", route);

mongoose.connect(process.env.DB as string).then(() => console.log("Database connected successfully!"));

const port: number = parseInt(process.env.PORT as string) || 8080;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
