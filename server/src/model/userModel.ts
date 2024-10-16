import { Document, Schema, model, Types } from "mongoose";
import bcrypt from "bcrypt";

export interface IUsers extends Document {
  userName: string;
  email: string;
  password: string;
  resetToken?: string;
  resetTokenExpiration?: Date;
  groups: Types.ObjectId[];
}

const userSchema = new Schema<IUsers>({
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
  groups: {
    type: [Schema.Types.ObjectId],
    ref: "Group",
    default: [],
  },
  resetToken: String,
  resetTokenExpiration: Date,
});

userSchema.pre<IUsers>("save", async function (next) {
  if (this.isModified("password") || this.isNew) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

const userModel = model<IUsers>("Users", userSchema);
export default userModel;
