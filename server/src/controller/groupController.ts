import { Request, Response } from "express";
import { Types } from "mongoose";
import userModel, { IUsers } from "../model/userModel.js";
import groupSchema, { IGroups } from "../model/groupModel.js";
import { response } from "../utils/utils.js";
import { message } from "../utils/messages.js";

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
        return res.status(404).json({ message: message.no_group });
      }

      const existingMembers = group.members;

      users = await userModel.find({
        _id: { $ne: userId, $nin: existingMembers },
      });
    } else {
      users = await userModel.find({ _id: { $ne: userId } });
    }

    return response(res, message.user_list, 200, users);
  } catch (error) {
    return response(res, "", 500, (error as Error).message);
  }
};

const groupData = async (req: Request, res: Response): Promise<Response> => {
  try {
    const users = await groupSchema.find({});
    if (!users) return response(res, message.no_user, 404);
    return response(res, message.user_details_fetch, 200, users);
  } catch (error) {
    return response(res, message.data_error, 500, (error as Error).message);
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
      return response(res, message.member_warn, 400);
    }

    const flattenedMembers = members.map((member) => new Types.ObjectId(member));

    const users = await userModel.find({ _id: { $in: flattenedMembers } });
    if (!users || users.length === 0) {
      return response(res, message.no_user, 404);
    }

    const memberIds = users.map((user) => user._id);

    const existingGroup: IGroups | null = await groupSchema.findOne({ groupName });
    if (existingGroup) {
      return response(res, message.already_group, 400);
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

    return response(res, message.group_created, 201, newGroup);
  } catch (error) {
    return response(res, message.err_grp_create, 500, (error as Error).message);
  }
};

const groupDetails = async (req: GroupRole, res: Response): Promise<Response> => {
  try {
    const { _id } = req.params;

    const group = await groupSchema.findById(_id).populate("members");
    if (!group) return response(res, message.err_grp_info, 500);

    return response(res, message.user_data, 200, group);
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
    if (!group) return response(res, message.no_group, 404);

    if (group.admin.toString() !== adminId.toString()) {
      return response(res, message.admin_add, 403);
    }

    const users = await userModel.find({ _id: { $in: members } });
    if (users.length === 0) {
      return response(res, message.no_user_to_add, 404);
    }

    const newMemberIds = users
      .filter((user) => !group.members?.includes(user._id as Types.ObjectId))
      .map((user) => user._id as Types.ObjectId);

    if (newMemberIds.length === 0) {
      return response(res, message.already_member, 400);
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

    return response(res, message.user_added, 200);
  } catch (error) {
    return response(res, message.err_add_user, 500, (error as Error).message);
  }
};

const removeUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { groupId, userId }: { groupId: string; userId: string } = req.body;
    const adminId: Types.ObjectId = req.user?._id as Types.ObjectId;

    const group = await groupSchema.findById({ _id: groupId });
    if (!group) return response(res, message.no_group, 404);

    if (!group.admin.equals(adminId)) {
      return response(res, message.admin_remove, 403);
    }

    const user = await userModel.findById(userId);
    if (!user) return response(res, message.no_user, 404);

    group.members = group.members.filter((memberId) => memberId.toString() !== userId);
    user.groups = user.groups.filter((groupId) => groupId.toString() != group._id);

    if (group.members.length === 0 || group.members.length < 1) {
      await groupSchema.findOneAndDelete({ _id: group._id });
      await userModel.findOneAndUpdate({ groups: groupId }, { $pull: { groups: groupId } }, { new: true });

      return response(res, message.member_removed, 200);
    } else {
      await group.save();
      await user.save();
      return response(res, message.user_removed, 200);
    }
  } catch (error) {
    console.log((error as Error).message);
    return response(res, message.err_remove_user, 500, (error as Error).message);
  }
};

const selfRemove = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { groupId } = req.params as GroupQuery;

    if (!groupId || !Types.ObjectId.isValid(groupId)) {
      return response(res, message.invalid_groupId, 400);
    }

    const userId: Types.ObjectId = req.user?._id as Types.ObjectId;

    const group: IGroups | null = await groupSchema.findOne({ _id: groupId });
    if (!group) return response(res, message.no_group, 404);

    const user: IUsers | null = await userModel.findById(userId);
    if (!user) return response(res, message.no_user, 404);

    group.members = group.members.filter((memberId) => memberId.toString() !== userId.toString());
    user.groups = user.groups.filter((groupDetails) => groupDetails.toString() !== groupId);

    if (group.members.length === 0 || group.members.length < 1) {
      await groupSchema.findOneAndDelete({ _id: groupId });
      await userModel.findOneAndUpdate({ groups: groupId }, { $pull: { groups: groupId } }, { new: true });
      return response(res, message.removed_member, 200);
    } else {
      await group.save();
      await user.save();
      return response(res, `You are removed from the group "${group.groupName}" successfully!`, 200);
    }
  } catch (error) {
    console.log((error as Error).message);
    return response(res, message.delete_err, 500, (error as Error).message);
  }
};

const deleteGroup = async (req: DeleteGroupRequest, res: Response): Promise<Response> => {
  try {
    const { groupId } = req.params;
    const adminId: Types.ObjectId = req.user?._id as Types.ObjectId;

    const group: IGroups | null = await groupSchema.findById(groupId);
    if (!group) return response(res, message.no_group, 404);

    if (group.admin.toString() !== adminId.toString()) {
      return response(res, message.admin_delete, 403);
    }

    if (group.members.length > 0) return response(res, message.grp_member);

    const deletedGroup = await groupSchema.deleteOne({ _id: groupId });
    if (!deletedGroup) return response(res, message.no_grp_del);

    await userModel.updateMany({ groups: groupId }, { $pull: { groups: groupId } });

    return response(res, message.grp_del, 200);
  } catch (error) {
    return response(res, message.err_del_grp, 500, (error as Error).message);
  }
};

export { userList, createGroup, groupData, groupDetails, addUser, removeUser, deleteGroup, selfRemove };
