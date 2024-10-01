import { Document, Schema, model } from "mongoose";

interface IGroups extends Document {
  groupName: string;
  members: [Schema.Types.ObjectId];
}

const groupSchema = new Schema<IGroups>({
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

export default model<IGroups>("Groups", groupSchema);
