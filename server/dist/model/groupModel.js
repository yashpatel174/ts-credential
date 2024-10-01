import { Schema, model } from "mongoose";
const groupSchema = new Schema({
    groupName: {
        type: String,
        required: true,
        unique: true,
    },
    members: [
        {
            type: Schema.Types.ObjectId,
            ref: "Users",
        },
    ],
});
export default model("Groups", groupSchema);
