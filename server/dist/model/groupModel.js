import { Schema, model } from "mongoose";
const groupSchema = new Schema({
    groupName: {
        type: String,
        required: true,
        unique: true,
    },
    members: {
        type: [Schema.Types.ObjectId],
        ref: "Users",
    },
    admin: {
        type: Schema.Types.ObjectId,
        ref: "Users",
        required: true,
    },
});
const Group = model("Groups", groupSchema);
export default Group;
