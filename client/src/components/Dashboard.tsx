import { FC, useEffect, useState, useRef, MouseEvent } from "react";
import { toast } from "react-toastify";
import axios, { AxiosResponse } from "axios";
import Group from "./Group";
import { AiFillDelete } from "react-icons/ai";
import UserData from "./UserData";
import GroupData from "./GroupData";

interface Message {
  senderId: string;
  groupId?: string;
  receiverId?: string;
  _id: string;
  message: string;
  timestamp: string;
}

interface SendMessagePayload {
  senderId: string;
  receiverId?: string;
  message: string;
  groupId?: string;
  sender: boolean;
}

interface Grouper {
  _id: string;
  groupName: string;
}

const Dashboard: FC = () => {
  const [userName, setUserName] = useState<string>("");
  const [groupName, setGroupName] = useState<string>("");
  const [users, setUsers] = useState<{ userName: string; userId: string }[]>([]);
  const [groups, setGroups] = useState<{ groupName: string; _id: string }[]>([]);
  const [selectedUser, setSelectedUser] = useState<{ userName: string; userId: string } | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<{ userName: string; userId: string }[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<{ groupName: string; groupId: string; _id: string } | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Grouper | null>(null);
  const [grouping, setGrouping] = useState<Grouper[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  const [isGroup, setIsGroup] = useState<boolean>(false);
  const [usersData, setUsersData] = useState<boolean>(false);
  const [groupsData, setGroupsData] = useState<boolean>(false);
  const [msgIcon, setMsgIcon] = useState<boolean>(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const selectedName = selectedUser?.userName ?? selectedGroup?.groupName ?? "No user or group selected";

  useEffect(() => {
    const fetchUsersAndGroups = async () => {
      try {
        const token = sessionStorage.getItem("token");

        if (!token) {
          console.error("No token found, please login!");
          return;
        }

        const response = await axios.get("http://localhost:8080/user/dashboard", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const { currentUser, otherUsers, groups } = response.data.result;
        setUserName(currentUser.userName || "");
        setGroupName(groups.groupName || "");
        setUsers(otherUsers || []);
        setGroups(groups || []);
      } catch (error) {
        console.error("Error fetching users and groups:", error);
      }
    };

    fetchUsersAndGroups();
  }, []);

  const handleUserClick = (user: { userName: string; userId: string }) => {
    setSelectedGroup(null);
    if (isGroup || groupsData) {
      setSelectedUsers((prev) => {
        if (prev.find((u) => u.userId === user.userId)) {
          return prev.filter((u) => u.userId !== user.userId);
        } else {
          return [...prev, user];
        }
      });
    } else {
      setSelectedUser(user);
      loadChatMessages(user.userId, "");
    }
  };

  const handleGroupClick = (group: any) => {
    setSelectedUser(null);
    setSelectedGroup(group);
    setSelectedId(group._id);
    loadChatMessages("", group._id);
  };

  const loadChatMessages = async (selectedUserId?: string, selectedGroupId?: string) => {
    try {
      const token = sessionStorage.getItem("token");
      if (!token) {
        return toast.error("No authentication token found.");
      }

      const dashboard = await axios.get("http://localhost:8080/user/dashboard", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const currentUser = dashboard.data.result.currentUser;
      if (!currentUser || !currentUser.userId) {
        return toast.error("Current user not found");
      }

      const currentUserId = currentUser.userId;

      const type = selectedUserId ? "user" : "group";
      const selectedId = selectedUserId || selectedGroupId;

      const response = await axios.get(`http://localhost:8080/chat/${currentUserId}/${type}/${selectedId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMessages(response.data.result.messages);
    } catch (error) {
      console.error("Error loading messages", (error as Error).message);
      toast.error("Failed to load messages.");
    }
  };

  const sendMessage = async () => {
    try {
      const token = sessionStorage.getItem("token");
      if (!token) {
        toast.error("No token found.");
        return;
      }

      const res = await axios.get("http://localhost:8080/user/dashboard", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const currentUser = res.data.result.currentUser;
      if (!currentUser || !currentUser.userId) {
        return toast.error("Current user not found");
      }

      const currentUserId = currentUser.userId;

      const payload: SendMessagePayload = {
        senderId: currentUserId,
        message: newMessage,
        sender: true,
        ...(selectedGroup ? { groupId: selectedGroup._id } : {}),
        ...(selectedUser ? { receiverId: selectedUser.userId } : {}),
      };

      if (!selectedUser && !selectedGroup) {
        toast.error("Please select a user or a group to send the message.");
        return;
      }

      const response = await axios.post("http://localhost:8080/chat/send", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const savedMessage = response.data;

      setMessages((prevMessages) => [...prevMessages, savedMessage]);
      setNewMessage("");
      toast.success("Message sent!");
    } catch (error) {
      console.error("Error sending message:", (error as Error).message);
      toast.error("Failed to send message.");
    }
  };

  const toggleGroup = () => {
    setIsGroup((prev) => !prev);
    setGroupsData((prev) => !prev);
    setSelectedId(null);
    setSelectedUser(null);
    setSelectedGroup(null);
    setUsersData(false);
  };

  const toggleSMS = () => {
    setMsgIcon((prev) => !prev);
  };

  const toggleData = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (selectedUser) {
      setUsersData((prev) => !prev);
      setGroupsData(false);
    } else if (selectedGroup) {
      setGroupsData((prev) => !prev);
      setUsersData(false);
    }
  };

  const handleDeleteGroup = async (groupId: string): Promise<void> => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      toast.error("Token not found");
      return;
    }

    try {
      const response: AxiosResponse<{ message: string }> = await axios.delete(
        `http://localhost:8080/group/delete/${groupId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success(response.data.message);
      setGrouping(grouping.filter((group) => group._id !== groupId));
      if (selectedGroup?.groupId === groupId) {
        setSelectedGroup(null);
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Failed to delete group");
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("An unknown error occurred");
      }
    }
  };

  const handleDeleteMessage = async (messageId: string, userId: string): Promise<void> => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      toast.error("Token not found");
      return;
    }

    try {
      const response: AxiosResponse<{ message: string }> = await axios.delete(
        `http://localhost:8080/chat/delete/${messageId}/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success(response.data.message);
      setGrouping(grouping.filter((message) => message._id !== messageId));
      if (selectedMessage?._id === messageId) {
        setSelectedMessage(null);
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Failed to delete group");
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("An unknown error occurred");
      }
    }
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div>
      <div className="d-flex justify-content-center align-items-center w-full">
        <div
          style={{ width: "90%" }}
          className="d-flex justify-content-between"
        >
          <h1 className="text-center my-2">{userName}</h1>
          <button
            className="bg-black text-white rounded-lg border-0 my-2 px-3"
            style={{ fontSize: "1rem", borderRadius: "20px" }}
            onClick={toggleGroup}
          >
            {isGroup ? "Chatting Room" : "Create Group"}
          </button>
        </div>
      </div>
      <div className="row min-vh-75 m-0">
        <div className="col-2 bg-black text-white px-4">
          <h1 className="text-center my-2">Users</h1>
          <ul className="list-unstyled">
            {users?.map((user) => (
              <li
                key={user.userId}
                className="border rounded shadow-sm mb-2 p-2 text-center text-white"
                style={{ backgroundColor: "#ff803e", cursor: "pointer" }}
                onClick={() => handleUserClick(user)}
              >
                {user.userName}
              </li>
            ))}
          </ul>
          <hr />
          {!isGroup && (
            <>
              <h1 className="text-center my-2">Groups</h1>
              <ul className="list-unstyled">
                {groups?.map((group) => (
                  <li
                    key={group._id}
                    className="border rounded shadow-sm mb-2 p-2 text-center text-white"
                    style={{ backgroundColor: "#ff803e", cursor: "pointer" }}
                    onClick={() => handleGroupClick(group)}
                  >
                    {group.groupName}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
        <div className="bg-black col-10 px-4 max-vh-50">
          {isGroup ? (
            <Group selectedUsers={selectedUsers} />
          ) : usersData && selectedUser ? (
            <UserData userId={selectedUser?.userId as string} />
          ) : groupsData ? (
            <GroupData
              selectedUsers={selectedUsers}
              groupId={selectedGroup?._id as string}
            />
          ) : (
            <>
              <div className="d-flex justify-content-between align-items-start">
                <h5 className="text-white p-3 mb-2">
                  <button
                    className="text-white text-decoration-none bg-black border-0"
                    onClick={toggleData}
                  >
                    {selectedName ? `Chat with ${selectedName}` : "Select a user or group"}
                  </button>
                </h5>
                {selectedGroup ? (
                  <AiFillDelete
                    className="text-white mt-3"
                    style={{ fontSize: "20px" }}
                    onClick={() => handleDeleteGroup(selectedGroup._id)}
                  />
                ) : null}
              </div>
              <div
                className="overflow-auto mb-2"
                style={{ height: "50vh" }}
                ref={chatContainerRef}
              >
                {messages.map((msg: any, idx) => {
                  if (!msg || !msg.senderId) {
                    console.log(msg);

                    return null;
                  }

                  const currentUser = users.find((u) => u.userName === userName);
                  const currentGroup = groups.find((g) => g.groupName === groupName);
                  const isUserMessage = msg.senderId === currentUser?.userId;
                  const isGroupMessage = msg.senderId === currentGroup?._id;
                  const messageStyle: any = {
                    padding: "0.5rem",
                    borderRadius: "0.25rem",
                    backgroundColor: isUserMessage || isGroupMessage ? "white" : "#ff803e",
                    color: isUserMessage || isGroupMessage ? "dark" : "#ff803e",
                    maxWidth: "75%",
                    wordWrap: "break-word",
                  };

                  return (
                    <div
                      key={idx}
                      className={`mb-2 d-flex ${msg.sender ? "justify-content-end" : "justify-content-start"}`}
                    >
                      <div
                        className={`p-2 rounded ${
                          isUserMessage || isGroupMessage ? "bg-danger text-white" : "bg-light text-dark"
                        }`}
                        style={messageStyle}
                        onClick={toggleSMS}
                      >
                        <p className="mb-0">{msg.message}</p>
                      </div>
                      {msgIcon && msg.sender ? (
                        <AiFillDelete
                          className="text-white mt-2 "
                          style={{ fontSize: "20px", marginLeft: "5px" }}
                          onClick={() => handleDeleteMessage(msg._id, msg.senderId)}
                        />
                      ) : null}
                    </div>
                  );
                })}
              </div>

              <div className="d-flex flex-column justify-content-end bg-dark p-3 h-full rounded">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage();
                  }}
                >
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="form-control mb-2"
                    placeholder="Type your message..."
                  />
                  <button
                    type="submit"
                    className="btn btn-primary"
                  >
                    Send
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
