import { Document, Schema, model } from "mongoose";

interface Irooms extends Document {
  roomName: string;
  members: [Schema.Types.ObjectId];
}

const roomSchema = new Schema<Irooms>({
  roomName: {
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

export default model<Irooms>("Rooms", roomSchema);
