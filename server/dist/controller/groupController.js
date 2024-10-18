import { Types } from "mongoose";
import userModel from "../model/userModel.js";
import groupSchema from "../model/groupModel.js";
import { response } from "../utils/utils.js";
import { message } from "../utils/messages.js";
const userList = async (req, res) => {
    try {
        const userId = req.user?._id;
        const { groupId } = req.query;
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
        }
        else {
            users = await userModel.find({ _id: { $ne: userId } });
        }
        return response(res, message.user_list, 200, users);
    }
    catch (error) {
        return response(res, "", 500, error.message);
    }
};
const groupData = async (req, res) => {
    try {
        const users = await groupSchema.find({});
        if (!users)
            return response(res, message.no_user, 404);
        return response(res, message.user_details_fetch, 200, users);
    }
    catch (error) {
        return response(res, message.data_error, 500, error.message);
    }
};
const createGroup = async (req, res) => {
    try {
        const { groupName, members } = req.body;
        const userId = req.user?._id;
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
        const existingGroup = await groupSchema.findOne({ groupName });
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
        const user = await userModel.findById(userId);
        if (!user)
            return response(res, "User not found", 404);
        user.groups?.push(newGroup._id);
        await user.save();
        await Promise.all(memberIds.map(async (m) => {
            try {
                const member = await userModel.findById(m);
                if (member && !member.groups?.includes(newGroup._id)) {
                    member.groups?.push(newGroup._id);
                    await member.save();
                }
            }
            catch (err) {
                console.error(`Failed to update member ${m}:`, err.message);
            }
        }));
        return response(res, message.group_created, 201, newGroup);
    }
    catch (error) {
        return response(res, message.err_grp_create, 500, error.message);
    }
};
const groupDetails = async (req, res) => {
    try {
        const { _id } = req.params;
        const group = await groupSchema.findById(_id).populate("members");
        if (!group)
            return response(res, message.err_grp_info, 500);
        return response(res, message.user_data, 200, group);
    }
    catch (error) {
        console.log(error.message);
        return res.status(500).send({
            error: error.message,
        });
    }
};
const addUser = async (req, res) => {
    try {
        const { _id, members } = req.body;
        const adminId = req.user?._id;
        const group = await groupSchema.findById(_id);
        if (!group)
            return response(res, message.no_group, 404);
        if (group.admin.toString() !== adminId.toString()) {
            return response(res, message.admin_add, 403);
        }
        const users = await userModel.find({ _id: { $in: members } });
        if (users.length === 0) {
            return response(res, message.no_user_to_add, 404);
        }
        const newMemberIds = users
            .filter((user) => !group.members?.includes(user._id))
            .map((user) => user._id);
        if (newMemberIds.length === 0) {
            return response(res, message.already_member, 400);
        }
        group.members = [...group.members, ...newMemberIds];
        await group.save();
        await Promise.all(newMemberIds.map(async (userId) => {
            const user = await userModel.findById(userId);
            if (user && !user.groups?.includes(_id)) {
                user.groups?.push(_id);
                await user.save();
            }
        }));
        return response(res, message.user_added, 200);
    }
    catch (error) {
        return response(res, message.err_add_user, 500, error.message);
    }
};
const removeUser = async (req, res) => {
    try {
        const { groupId, userId } = req.body;
        const adminId = req.user?._id;
        const group = await groupSchema.findById({ _id: groupId });
        if (!group)
            return response(res, message.no_group, 404);
        if (!group.admin.equals(adminId)) {
            return response(res, message.admin_remove, 403);
        }
        const user = await userModel.findById(userId);
        if (!user)
            return response(res, message.no_user, 404);
        group.members = group.members.filter((memberId) => memberId.toString() !== userId);
        user.groups = user.groups.filter((groupId) => groupId.toString() != group._id);
        if (group.members.length === 0 || group.members.length < 1) {
            await groupSchema.findOneAndDelete({ _id: group._id });
            await userModel.findOneAndUpdate({ groups: groupId }, { $pull: { groups: groupId } }, { new: true });
            return response(res, message.member_removed, 200);
        }
        else {
            await group.save();
            await user.save();
            return response(res, message.user_removed, 200);
        }
    }
    catch (error) {
        console.log(error.message);
        return response(res, message.err_remove_user, 500, error.message);
    }
};
const selfRemove = async (req, res) => {
    try {
        const { groupId } = req.params;
        if (!groupId || !Types.ObjectId.isValid(groupId)) {
            return response(res, message.invalid_groupId, 400);
        }
        const userId = req.user?._id;
        const group = await groupSchema.findOne({ _id: groupId });
        if (!group)
            return response(res, message.no_group, 404);
        const user = await userModel.findById(userId);
        if (!user)
            return response(res, message.no_user, 404);
        group.members = group.members.filter((memberId) => memberId.toString() !== userId.toString());
        user.groups = user.groups.filter((groupDetails) => groupDetails.toString() !== groupId);
        if (group.members.length === 0 || group.members.length < 1) {
            await groupSchema.findOneAndDelete({ _id: groupId });
            await userModel.findOneAndUpdate({ groups: groupId }, { $pull: { groups: groupId } }, { new: true });
            return response(res, message.removed_member, 200);
        }
        else {
            await group.save();
            await user.save();
            return response(res, `You are removed from the group "${group.groupName}" successfully!`, 200);
        }
    }
    catch (error) {
        console.log(error.message);
        return response(res, message.delete_err, 500, error.message);
    }
};
const deleteGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const adminId = req.user?._id;
        const group = await groupSchema.findById(groupId);
        if (!group)
            return response(res, message.no_group, 404);
        if (group.admin.toString() !== adminId.toString()) {
            return response(res, message.admin_delete, 403);
        }
        if (group.members.length > 0)
            return response(res, message.grp_member);
        const deletedGroup = await groupSchema.deleteOne({ _id: groupId });
        if (!deletedGroup)
            return response(res, message.no_grp_del);
        await userModel.updateMany({ groups: groupId }, { $pull: { groups: groupId } });
        return response(res, message.grp_del, 200);
    }
    catch (error) {
        return response(res, message.err_del_grp, 500, error.message);
    }
};
export { userList, createGroup, groupData, groupDetails, addUser, removeUser, deleteGroup, selfRemove };
