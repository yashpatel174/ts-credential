import { Schema, model } from "mongoose";
import bcrypt from "bcrypt";
const userSchema = new Schema({
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
    groups: {
        type: [Schema.Types.ObjectId],
        ref: "Group",
        default: [],
    },
    resetToken: String,
    resetTokenExpiration: Date,
});
userSchema.pre("save", async function (next) {
    if (this.isModified("password") || this.isNew) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});
const userModel = model("Users", userSchema);
export default userModel;
