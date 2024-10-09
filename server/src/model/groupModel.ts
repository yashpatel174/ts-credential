import { Document, Schema, model, Types } from "mongoose";

export interface IGroups extends Document {
  groupName: string;
  members: Types.ObjectId[];
  admin: Schema.Types.ObjectId;
}

const groupSchema = new Schema<IGroups>({
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

const Group = model<IGroups>("Group", groupSchema);
export default Group;
