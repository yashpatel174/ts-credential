import axios from "axios";
import React, { FormEvent, useEffect, useState } from "react";
import { AiFillDelete } from "react-icons/ai";
import { toast } from "react-toastify";
import { addUser } from "../api";

interface User {
  userName: string;
  userId: string;
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
  const [members, setMembers] = useState<Group[]>([]);
  const [id, setId] = useState<string>("");
  const [admin, setAdmin] = useState<string>("");

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
        setId(result._id);
        setName(result?.groupName);
        setMembers(result?.members);
        setAdmin(result?.admin?.userName);
      } catch (error) {
        console.log((error as Error).message);
      }
    };

    if (groupId) {
      fetchData();
    }
  }, [groupId]);

  const isAdmin = admin === sessionStorage.getItem("userName");

  const handleAddUsers = async (e: FormEvent) => {
    e.preventDefault();

    const token = sessionStorage.getItem("token");
    if (!token) {
      toast.error("User is not authenticated! Please log in.");
      return;
    }

    try {
      // const response = await addUser({
      //   groupId,
      //   members,
      // });
      // if (!response || response.data.error) {
      //   toast.error("Group not created, please try again!");
      // } else {
      //   toast.success("Group created successfully!");
      // }
    } catch (error) {
      toast.error("Error creating group! Please check your input and try again.");
    }
  };

  return (
    <div
      className="container max-vh-50"
      style={{ height: "76vh", color: "#ff803d" }}
    >
      {name || members.length > 0 ? (
        <>
          <h1 className="mt-2 text-white">{name}</h1>
          <div>
            <div className="d-flex justify-content-between">
              <h1>
                <span className="text-white">GroupName:</span> {name}
              </h1>
              {isAdmin ? (
                <button
                  className="bg-white rounded-lg border-0 my-2 px-4 py-2"
                  style={{ fontSize: "1rem", borderRadius: "20px", color: "#ff803e" }}
                  // onClick={toggleGroup}
                >
                  Add User
                </button>
              ) : null}
            </div>
            <h3>
              <span className="text-white">Admin:</span> {admin}
            </h3>
            <h3 className="text-white">Members:</h3>
            <ul className="list-unstyled">
              {members?.map((m) => (
                <div className="d-flex">
                  <li
                    key={id}
                    className="border rounded shadow-sm mb-2 p-2 text-center text-white"
                    style={{ backgroundColor: "#ff803e", cursor: "pointer", width: "10%" }}
                  >
                    <span>{m.userName}</span>
                  </li>
                  <AiFillDelete
                    className="text-white mt-2"
                    style={{ fontSize: "20px", marginLeft: "10px" }}
                    // onClick={() => handleDeleteGroup(selectedGroup?.groupId)}
                  />
                </div>
              ))}
            </ul>
          </div>
        </>
      ) : (
        <p>Nothing to show</p>
      )}
    </div>
  );
};

export default GroupData;
