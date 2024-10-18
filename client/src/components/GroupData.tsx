import axios from "axios";
import React, { FC, FormEvent, useEffect, useState } from "react";
import { AiFillDelete } from "react-icons/ai";
import { toast } from "react-toastify";
import { Button, Form } from "react-bootstrap";
import { addUser, removeUser } from "../api";

interface User {
  _id: string;
  userName: string;
  role: string;
}

interface UserDataProps {
  groupId: string;
  selectedUsers: User[];
  name: string;
  member: User[];
  admin: string;
  users: User[];
  setMember: string;
}

const GroupData: React.FC<UserDataProps> = (props) => {
  const { groupId, users, name, member, admin } = props;
  console.log(groupId, "groupId");

  const handleAddUsers = async (e: FormEvent) => {
    e.preventDefault();

    const newUsers = users.filter(
      (user: any) => !member.some((existingMember: any) => existingMember.userId === user.userId)
    );

    if (newUsers.length === 0) {
      toast.info("No new users to add.");
      return;
    }

    try {
      const response = await addUser({
        groupId,
        members: newUsers.map((user: any) => user.userId),
      });

      if (response.status === 200) {
        toast.success("New users added successfully to the group.");
      }
    } catch (error) {
      toast.error("Error adding users to the group! Please try again.");
    }
  };

  const handleRemoveUser = async (e: FormEvent, userId: string) => {
    e.preventDefault();
    try {
      const response = await removeUser(groupId, userId);
      if (response.status === 200) {
        toast.success("User removed from the group successfully.");
      }
    } catch (error) {
      toast.error("Only admin can remove users.");
      console.error((error as Error).message);
    }
  };

  return (
    <div
      className="container max-vh-50"
      style={{ height: "76vh", color: "#ff803d" }}
    >
      {name || member.length > 0 ? (
        <>
          <Form onSubmit={handleAddUsers}>
            <h1 className="mt-2 text-white">{name}</h1>
            <div>
              <div className="d-flex justify-content-between">
                <h1>
                  <span className="text-white">GroupName:</span> {name}
                </h1>
                <Button
                  className="bg-white rounded-lg border-0 my-2 px-4 py-2"
                  style={{ fontSize: "1rem", borderRadius: "20px", color: "#ff803e" }}
                  type="submit"
                >
                  Save
                </Button>
              </div>
              <h3>
                <span className="text-white">Admin:</span> {admin}
              </h3>
              <Form.Label className="text-white">Members:</Form.Label>
              <ul className="list-unstyled">
                {member?.map((m: any) => (
                  <div
                    className="d-flex"
                    key={m.userId}
                  >
                    <li
                      className="border rounded shadow-sm mb-2 p-2 text-center text-white"
                      style={{ backgroundColor: "#ff803e", cursor: "pointer", width: "10%" }}
                    >
                      <span>{m.userName}</span>
                    </li>
                    <AiFillDelete
                      className="text-white mt-2"
                      style={{ fontSize: "20px", marginLeft: "10px" }}
                      onClick={(e) => (m._id ? handleRemoveUser(e, m._id) : console.error("User ID is undefined"))}
                    />
                  </div>
                ))}
              </ul>
            </div>
          </Form>
        </>
      ) : (
        <p>Nothing to show</p>
      )}
    </div>
  );
};

export default GroupData;
