import axios from "axios";
import React, { FC, FormEvent, useEffect, useState } from "react";
import { AiFillDelete } from "react-icons/ai";
import { toast } from "react-toastify";
import { Button, Form } from "react-bootstrap";
import { addUser, removeUser } from "../api";

interface User {
  userName: string;
  userId: string;
  _id?: string;
}

interface UserDataProps {
  groupId: string;
  selectedUsers: User[];
}

interface Group {
  _id: string;
  groupName: string;
  members: string[];
  admin: string;
  userName: string;
}

const GroupData: React.FC<UserDataProps> = ({ groupId, selectedUsers }) => {
  const [name, setName] = useState<string | undefined>();
  const [member, setMember] = useState<User[]>([]);
  const [admin, setAdmin] = useState<string>("");
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = sessionStorage.getItem("token");
        if (!token) {
          toast.error("Token not provided");
          return;
        }

        const response = await axios.get(`http://localhost:8080/chat/group/${groupId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const result = response.data.result.user;
        setName(result?.groupName);
        setMember(result?.members);
        setAdmin(result?.admin?.userName);
        setUsers(selectedUsers);
      } catch (error) {
        console.log((error as Error).message);
      }
    };

    if (groupId) {
      fetchData();
    }
  }, [groupId, selectedUsers]);

  const handleAddUsers = async (e: FormEvent) => {
    e.preventDefault();

    // Filter out already existing members
    const newUsers = selectedUsers.filter(
      (selectedUser) => !member.some((existingMember) => existingMember.userId === selectedUser.userId)
    );

    if (newUsers.length === 0) {
      toast.info("No new users to add.");
      return;
    }

    try {
      const response = await addUser({
        groupId,
        members: newUsers.map((user) => user.userId),
      });

      if (response.status === 200) {
        toast.success("New users added successfully to the group.");
        setMember((prevMembers) => [...prevMembers, ...newUsers]);
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
        setMember((prevMembers) => prevMembers.filter((member) => member.userId !== userId));
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
                {member?.map((m) => (
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
