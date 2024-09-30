import { Request, Response } from "express";
import roomSchema from "../model/roomModel.js";
import userSchema from "../model/userModel.js";
import { required, response } from "../utils/utils.js";
import { message } from "../utils/messages.js";

interface Rooms extends Request {
  roomName: string;
  members: [string];
}

const members = async (req: Request, res: Response): Promise<Response> => {
  try {
    const users = await userSchema.find({});
    return response(res, "Successfully get the list of users", 200, users);
  } catch (error) {
    return res.status(500).send({
      message: "Error while getting users",
      error: (error as Error).message,
    });
  }
};

const createRoom = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { roomName, selectedUsers } = req.body;

    if (!selectedUsers || selectedUsers.length === 0) {
      return response(res, "No users selected to add.", 404);
    }

    const room = await roomSchema.findOne(roomName);
    if (room) return response(res, message.exist_room);

    const existMember = await roomSchema.find({ members: [selectedUsers._id] });
    if (!existMember) return response(res, "This user is already member of this group!");

    const newRoom = new roomSchema({ roomName, members: [selectedUsers] });
    await newRoom.save();

    return response(res, message.room_created, 200, newRoom);
  } catch (error) {
    return res.status(500).send({
      message: "Error while creating room",
      error: (error as Error).message,
    });
  }
};

const addUsers = async (req: Request, res: Response): Promise<Response> => {
  try {
  } catch (error) {
    return res.status(500).send({
      message: "Error while adding users to the room!",
      error: (error as Error).message,
    });
  }
};

export { createRoom };
