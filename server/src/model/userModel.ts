import { Document, Schema, model } from "mongoose";
import bcrypt from "bcrypt";

interface Iusers extends Document {
  userName: string;
  email: string;
  password: string;
  role: "user" | "admin";
  resetToken: string;
  resetTokenExpiration: string;
  groups: [String];
}

const userSchema = new Schema<Iusers>({
  userName: {
    type: String,
    unique: true,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    unique: true,
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  groups: [String],
  resetToken: String,
  resetTokenExpiration: Date,
});

userSchema.pre<Iusers>("save", async function (next) {
  if (this.isModified("password") || this.isNew) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

export default model<Iusers>("Users", userSchema);
