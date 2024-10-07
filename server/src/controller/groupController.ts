import { Request, Response } from "express";
import { Types } from "mongoose";
import userModel, { IUsers } from "../model/userModel.js";
import groupSchema, { IGroups } from "../model/groupModel.js";
import { required, response } from "../utils/utils.js";
import { message } from "../utils/messages.js";
import { ParamsDictionary } from "express-serve-static-core";
interface GroupParams extends ParamsDictionary {
  groupId: string;
}

interface GroupQuery {
  groupId?: string;
}

interface User {
  _id: Types.ObjectId;
  userName: string;
  role: string;
  groups: Types.ObjectId[];
}

interface CustomRequest extends Request {
  user: User;
}

const userList = async (req: Request<{}, {}, {}, GroupQuery>, res: Response): Promise<Response> => {
  try {
    const userId: Types.ObjectId = req.user?._id as Types.ObjectId;
    const { groupId } = req.query as GroupQuery;

    let users;

    if (groupId) {
      const group = await groupSchema.findById(groupId).select("members");
      if (!group) {
        return res.status(404).json({ message: "Group not found." });
      }

      const existingMembers = group.members;

      users = await userModel.find({
        _id: { $ne: userId, $nin: existingMembers },
      });
    } else {
      users = await userModel.find({ _id: { $ne: userId } });
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
    const { groupName, members }: { groupName: string; members: string[] } = req.body;
    const userId: Types.ObjectId = req.user?._id as Types.ObjectId;

    if (!userId) {
      return res.status(400).json({ message: "User not authenticated." });
    }

    if (!members || members.length < 1) {
      return res.status(400).json({ message: "At least 1 other member is required to create a group." });
    }

    const flattenedMembers = members.map((member) => new Types.ObjectId(member));

    const users = await userModel.find({ _id: { $in: flattenedMembers } });
    if (!users || users.length === 0) {
      return res.status(404).json({ message: "Users not found" });
    }

    console.log(flattenedMembers, "Found users:", users);

    const memberIds = users.map((user) => user._id);

    const existingGroup: IGroups | null = await groupSchema.findOne({ groupName });
    if (existingGroup) {
      return res.status(400).json({ message: "This group already exists!" });
    }

    if (!memberIds.includes(userId)) {
      memberIds.push(userId);
    }

    const newGroup = new groupSchema({
      groupName,
      members: memberIds,
      admin: userId,
    });
    await newGroup.save();

    const user: IUsers | null = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.groups?.push(newGroup._id as Types.ObjectId);
    await user.save();

    await Promise.all(
      (memberIds as Types.ObjectId[]).map(async (m: Types.ObjectId) => {
        try {
          const member: IUsers | null = await userModel.findById(m);
          if (member && !member.groups?.includes(newGroup._id as Types.ObjectId)) {
            member.groups?.push(newGroup._id as Types.ObjectId);
            await member.save();
          }
        } catch (err) {
          console.error(`Failed to update member ${m}:`, (err as Error).message);
        }
      })
    );

    return res.status(201).json({ message: "Group created successfully!", group: newGroup });
  } catch (error) {
    console.error((error as Error).message, "Error in group creation");
    return res.status(500).json({ message: "Error creating group", error });
  }
};

const addUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { groupId, userName }: { groupId: Types.ObjectId; userName: string } = req.body;
    const adminId: Types.ObjectId = req.user?._id as Types.ObjectId;

    const group: IGroups | null = await groupSchema.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found." });
    }

    if (group.admin.toString() !== adminId.toString()) {
      return response(res, "Only the admin can add members", 403);
    }

    const user: IUsers | null = await userModel.findOne({ userName });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (!group.members?.includes(user._id as Types.ObjectId)) {
      group.members?.push(user._id as Types.ObjectId);
      await group.save();

      user.groups?.push(groupId);
      await user.save();
    }

    return response(res, "User added to the group", 200, group);
  } catch (error) {
    return res.status(500).json({ message: "Error adding user to group!", error: (error as Error).message });
  }
};

const removeUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { groupId, userId }: { groupId: Types.ObjectId; userId: Types.ObjectId } = req.body;
    const adminId: Types.ObjectId = req.user?._id as Types.ObjectId;

    const group: IGroups | null = await groupSchema.findById(groupId);
    if (!group) return response(res, "Group not found!", 404);

    if (group.admin.toString() !== adminId.toString()) {
      return response(res, "Only the group admin can remove users!", 403);
    }

    group.members = group.members.filter((memberId) => memberId.toString() !== userId.toString());
    await group.save();

    const user: IUsers | null = await userModel.findById(userId);
    !user
      ? response(res, "User not found!", 404)
      : (user.groups = user.groups.filter((gId) => gId.toString() !== groupId.toString()));

    return response(res, "User removed from the group", 200);
  } catch (error) {
    return res.status(500).json({ message: "Error removing user from the group!", error: (error as Error).message });
  }
};

const deleteGroup = async (req: Request<GroupParams>, res: Response): Promise<Response> => {
  try {
    const { groupId } = req.params;
    const adminId: Types.ObjectId = req.user?._id as Types.ObjectId;

    const group: IGroups | null = await groupSchema.findById(groupId);
    if (!group) return response(res, "Group not found!", 404);

    if (group.admin.toString() !== adminId.toString()) {
      return res.status(403).json({ message: "Only the group admin can delete the group" });
    }

    if (group.members.length > 0) return response(res, "Group can't be deleted as it contains members");

    const deletedGroup = await groupSchema.deleteOne({ _id: groupId });
    if (!deletedGroup) return response(res, "Group is not deleted!");

    await userModel.updateMany({ groups: groupId }, { $pull: { groups: groupId } });

    return response(res, "Group deleted successfully!", 200);
  } catch (error) {
    return res.status(500).json({ message: "Error while deleting group!", error: (error as Error).message });
  }
};

export { userList, createGroup, addUser, removeUser, deleteGroup };
