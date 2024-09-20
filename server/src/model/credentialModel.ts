import mongoose, { Document } from "mongoose";
import bcrypt from "bcrypt";

interface Icredentials extends Document {
  email: string;
  password: string;
  resetToken: string;
  resetTokenExpiration: string;
}

const credentialSchema: mongoose.Schema<Icredentials> = new mongoose.Schema({
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
  resetToken: String,
  resetTokenExpiration: Date,
});

credentialSchema.pre<Icredentials>("save", async function (next) {
  if (this.isModified("password") || this.isNew) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

export default mongoose.model<Icredentials>("Credentials", credentialSchema);
