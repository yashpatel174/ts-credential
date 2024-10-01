import { Request, Response } from "express";
import groupSchema from "../model/groupModel.js";
import userSchema from "../model/userModel.js";
import { required, response } from "../utils/utils.js";
import { message } from "../utils/messages.js";

interface Iuser extends Request {
  user: {
    _id: string;
  };
}

const userList = async (req: Request, res: Response): Promise<Response> => {
  try {
    const requ = req as Iuser;
    const userId = requ.user._id;
    const { groupId } = requ.query;

    let users;

    if (groupId) {
      const group = await groupSchema.findById(groupId).select("members");
      if (!group) {
        return res.status(404).json({ message: "Group not found." });
      }

      const existingMembers = group.members;

      users = await userSchema.find({
        _id: { $ne: userId, $nin: existingMembers },
      });
    } else {
      users = await userSchema.find({ _id: { $ne: userId } });
    }

    return response(res, "List of users received successfully!", 200, users);
  } catch (error) {
    return res.status(500).send({
      error: (error as Error).message,
    });
  }
};

const createGroup = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { groupName, members, userId } = req.body;

    if (!members || members.length < 1) {
      return res.status(400).json({ message: "At least 1 other member is required to create a group." });
    }

    const updatedMembers = [...members, userId];

    const newGroup = new groupSchema({
      groupName,
      members: updatedMembers,
    });

    await newGroup.save();

    await userSchema.findByIdAndUpdate(userId, {
      $push: { groups: newGroup._id },
    });

    return res.status(201).json(newGroup);
  } catch (error) {
    return res.status(500).json({ message: "Error creating group", error });
  }
};

const addUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { groupId, userIdToAdd } = req.body;

    const group = await groupSchema.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found." });
    }

    if (group.members.includes(userIdToAdd)) {
      return res.status(400).json({ message: "User is already a member of the group." });
    }

    group.members.push(userIdToAdd);
    await group.save();

    return res.status(200).json({ message: "User added to group successfully!", group });
  } catch (error) {
    return res.status(500).json({ message: "Error adding user to group", error });
  }
};

interface RemoveUserRequestBody extends Request {
  groupId: string;
  userIdToRemove: string;
}

// const removeUser = async (req: RemoveUserRequestBody, res: Response): Promise<Response> => {
//   try {
//     const { groupId, userIdToRemove } = req.body;

//     const group = await groupSchema.findById(groupId);
//     if (!group) {
//       return res.status(404).json({ message: "Group not found." });
//     }

//     if (!group.members.includes(userIdToRemove)) {
//       return res.status(400).json({ message: "User is not a member of the group." });
//     }

//     group.members = group.members.filter((member: string) => member !== userIdToRemove);
//     await group.save();

//     return res.status(200).json({ message: "User removed from group successfully!", group });
//   } catch (error) {
//     return res.status(500).json({ message: "Error removing user from group", error });
//   }
// };

export { userList, createGroup, addUser };
