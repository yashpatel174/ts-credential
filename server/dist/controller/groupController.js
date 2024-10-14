import { Types } from "mongoose";
import userModel from "../model/userModel.js";
import groupSchema from "../model/groupModel.js";
import { response } from "../utils/utils.js";
const userList = async (req, res) => {
    try {
        const userId = req.user?._id;
        const { groupId } = req.query;
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
        }
        else {
            users = await userModel.find({ _id: { $ne: userId } });
        }
        return response(res, "List of users received successfully!", 200, users);
    }
    catch (error) {
        return res.status(500).send({
            error: error.message,
        });
    }
};
const groupData = async (req, res) => {
    try {
        const users = await groupSchema.find({});
        if (!users)
            return response(res, "User not found", 404);
        return response(res, "User details fetched successfully!", 200, users);
    }
    catch (error) {
        return response(res, "Erorr while getting data!", 500, error.message);
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
            return res.status(400).json({ message: "At least 1 other member is required to create a group." });
        }
        const flattenedMembers = members.map((member) => new Types.ObjectId(member));
        const users = await userModel.find({ _id: { $in: flattenedMembers } });
        if (!users || users.length === 0) {
            return res.status(404).json({ message: "Users not found" });
        }
        const memberIds = users.map((user) => user._id);
        const existingGroup = await groupSchema.findOne({ groupName });
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
        return res.status(201).json({ message: "Group created successfully!", group: newGroup });
    }
    catch (error) {
        console.error(error.message, "Error in group creation");
        return res.status(500).json({ message: "Error creating group", error });
    }
};
const groupDetails = async (req, res) => {
    try {
        const { _id } = req.params;
        const group = await groupSchema.findById(_id).populate("members");
        if (!group)
            return response(res, "Erorr while getting group information!", 500);
        return response(res, "User data fetched successfully!", 200, group);
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
        const { _id, userId } = req.body;
        const adminId = req.user?._id;
        const group = await groupSchema.findById(_id);
        if (!group)
            return response(res, "Group not found", 404);
        if (group.admin.toString() !== adminId.toString()) {
            return response(res, "Only the admin can add members", 403);
        }
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        if (!group.members?.includes(user._id)) {
            group.members?.push(user._id);
            await group.save();
            user.groups?.push(_id);
            await user.save();
        }
        return response(res, "User added to the group", 200, group);
    }
    catch (error) {
        return res.status(500).json({ message: "Error adding user to group!", error: error.message });
    }
};
const removeUser = async (req, res) => {
    try {
        const { groupId, userId } = req.body;
        const adminId = req.user?._id;
        const group = await groupSchema.findById(groupId);
        if (!group)
            return response(res, "Group not found!", 404);
        if (group.admin.toString() !== adminId.toString()) {
            return response(res, "Only the group admin can remove users!", 403);
        }
        group.members = group.members.filter((memberId) => memberId.toString() !== userId.toString());
        await group.save();
        const user = await userModel.findById(userId);
        if (!user)
            return response(res, "User not found", 404);
        user.groups = user.groups.filter((gId) => gId.toString() !== groupId.toString());
        await user.save();
        return response(res, "User removed from the group", 200);
    }
    catch (error) {
        return res.status(500).json({ message: "Error removing user from the group!", error: error.message });
    }
};
const selfRemove = async (req, res) => {
    try {
        const { groupId } = req.params;
        console.log(groupId);
        console.log(req.body);
        if (!groupId || !Types.ObjectId.isValid(groupId)) {
            return res.status(400).json({ message: "Invalid or missing groupId" });
        }
        const userId = req.user?._id;
        const group = await groupSchema.findOne({ _id: groupId });
        console.log(group);
        if (!group)
            return response(res, "Group not found!", 404);
        const user = await userModel.findById(userId);
        if (!user)
            return response(res, "User not found", 404);
        group.members = group.members.filter((memberId) => memberId.toString() !== userId.toString());
        user.groups = user.groups.filter((groupDetails) => groupDetails.toString() !== groupId);
        if (group.members.length === 0 || group.members.length < 1) {
            groupSchema.findOneAndDelete({ _id: groupId });
        }
        if (group.members.length === 0) {
            await groupSchema.findOneAndDelete({ _id: groupId });
            return response(res, "You are removed from the group successfully!", 200);
        }
        else {
            await group.save();
            await user.save();
            return response(res, `You are removed from the group "${group.groupName}" successfully!`, 200);
        }
    }
    catch (error) {
        console.log(error.message);
        return response(res, "Error while deleting group", 500, error.message);
    }
};
const deleteGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const adminId = req.user?._id;
        const group = await groupSchema.findById(groupId);
        if (!group)
            return response(res, "Group not found!", 404);
        if (group.admin.toString() !== adminId.toString()) {
            return res.status(403).json({ message: "Only the group admin can delete the group" });
        }
        if (group.members.length > 0)
            return response(res, "Group can't be deleted as it contains members");
        const deletedGroup = await groupSchema.deleteOne({ _id: groupId });
        if (!deletedGroup)
            return response(res, "Group is not deleted!");
        await userModel.updateMany({ groups: groupId }, { $pull: { groups: groupId } });
        return response(res, "Group deleted successfully!", 200);
    }
    catch (error) {
        return res.status(500).json({ message: "Error while deleting group!", error: error.message });
    }
};
export { userList, createGroup, groupData, groupDetails, addUser, removeUser, deleteGroup, selfRemove };
