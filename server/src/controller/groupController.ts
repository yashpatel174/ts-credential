import { Request, Response } from "express";
import { Types } from "mongoose";
import userModel, { IUsers } from "../model/userModel.js";
import groupSchema, { IGroups } from "../model/groupModel.js";
import { required, response } from "../utils/utils.js";
import { message } from "../utils/messages.js";
import { ParamsDictionary } from "express-serve-static-core";
import { CustomRequest } from "./userController.js";
interface GroupParams extends ParamsDictionary {
  groupId: string;
}

interface GroupQuery {
  groupId?: string;
}

interface DeleteGroupRequest extends Request {
  params: {
    groupId: string;
  };
}

interface User {
  _id: Types.ObjectId;
  userName: string;
  role: string;
  groups: Types.ObjectId[];
}

interface GroupRole extends Request {
  group?: {
    _id: Types.ObjectId;
  };
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

const groupData = async (req: Request, res: Response): Promise<Response> => {
  try {
    const users = await groupSchema.find({});
    if (!users) return response(res, "User not found", 404);
    return response(res, "User details fetched successfully!", 200, users);
  } catch (error) {
    return response(res, "Erorr while getting data!", 500, (error as Error).message);
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
    if (!user) return response(res, "User not found", 404);

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

const groupDetails = async (req: GroupRole, res: Response): Promise<Response> => {
  try {
    const { _id } = req.params;

    const group = await groupSchema.findById(_id).populate("members");
    if (!group) return response(res, "Erorr while getting group information!", 500);

    return response(res, "User data fetched successfully!", 200, group);
  } catch (error) {
    console.log((error as Error).message);
    return res.status(500).send({
      error: (error as Error).message,
    });
  }
};

const addUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { _id, members }: { _id: Types.ObjectId; members: Types.ObjectId[] } = req.body;
    const adminId: Types.ObjectId = req.user?._id as Types.ObjectId;

    const group: IGroups | null = await groupSchema.findById(_id);
    if (!group) return res.status(404).json({ message: "Group not found" });

    if (group.admin.toString() !== adminId.toString()) {
      return res.status(403).json({ message: "Only the admin can add members" });
    }

    const users = await userModel.find({ _id: { $in: members } });
    if (users.length === 0) {
      return res.status(404).json({ message: "No valid users found to add" });
    }

    const newMemberIds = users
      .filter((user) => !group.members?.includes(user._id as Types.ObjectId))
      .map((user) => user._id as Types.ObjectId);

    if (newMemberIds.length === 0) {
      return res.status(400).json({ message: "All users are already members of the group" });
    }

    group.members = [...group.members, ...newMemberIds];
    await group.save();

    await Promise.all(
      newMemberIds.map(async (userId: Types.ObjectId) => {
        const user: IUsers | null = await userModel.findById(userId);
        if (user && !user.groups?.includes(_id)) {
          user.groups?.push(_id);
          await user.save();
        }
      })
    );

    return res.status(200).json({ message: "Users added to the group", group });
  } catch (error) {
    return res.status(500).json({ message: "Error adding users to the group", error: (error as Error).message });
  }
};

const removeUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { groupId, userId }: { groupId: string; userId: string } = req.body;
    const adminId: Types.ObjectId = req.user?._id as Types.ObjectId;

    const group = await groupSchema.findById({ _id: groupId });
    if (!group) return response(res, "Group not found!", 404);

    if (!group.admin.equals(adminId)) {
      return response(res, "Only the group admin can remove users!", 403);
    }

    const user = await userModel.findById(userId);
    if (!user) return response(res, "User not found", 404);

    group.members = group.members.filter((memberId) => memberId.toString() !== userId);
    user.groups = user.groups.filter((groupId) => groupId != group._id);

    await group.save();
    await user.save();

    return response(res, "User removed from the group", 200);
  } catch (error) {
    console.log((error as Error).message);
    return res.status(500).json({ message: "Error removing user from the group!", error: (error as Error).message });
  }
};

const selfRemove = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { groupId } = req.params as GroupQuery;
    console.log(groupId);
    console.log(req.body);

    if (!groupId || !Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ message: "Invalid or missing groupId" });
    }

    const userId: Types.ObjectId = req.user?._id as Types.ObjectId;

    const group: IGroups | null = await groupSchema.findOne({ _id: groupId });
    console.log(group);
    if (!group) return response(res, "Group not found!", 404);

    const user: IUsers | null = await userModel.findById(userId);
    if (!user) return response(res, "User not found", 404);

    group.members = group.members.filter((memberId) => memberId.toString() !== userId.toString());
    user.groups = user.groups.filter((groupDetails) => groupDetails.toString() !== groupId);

    if (group.members.length === 0 || group.members.length < 1) {
      groupSchema.findOneAndDelete({ _id: groupId });
    }

    if (group.members.length === 0) {
      await groupSchema.findOneAndDelete({ _id: groupId });
      return response(res, "You are removed from the group successfully!", 200);
    } else {
      await group.save();
      await user.save();
      return response(res, `You are removed from the group "${group.groupName}" successfully!`, 200);
    }
  } catch (error) {
    console.log((error as Error).message);
    return response(res, "Error while deleting group", 500, (error as Error).message);
  }
};

const deleteGroup = async (req: DeleteGroupRequest, res: Response): Promise<Response> => {
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

export { userList, createGroup, groupData, groupDetails, addUser, removeUser, deleteGroup, selfRemove };
