import { FC, useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import Group from "./Group";
import { Link } from "react-router-dom";
import { AiFillDelete } from "react-icons/ai";

interface Message {
  senderId: string;
  groupId?: string;
  receiverId?: string;
  _id?: string;
  message: string;
  timestamp: string;
}

interface SendMessagePayload {
  senderId: string;
  receiverId?: string;
  message: string;
  groupId?: string;
}

const Dashboard: FC = () => {
  const [userName, setUserName] = useState<string>("");
  const [groupName, setGroupName] = useState<string>("");
  const [users, setUsers] = useState<{ userName: string; userId: string }[]>([]);
  const [groups, setGroups] = useState<{ groupName: string; _id: string }[]>([]);
  const [selectedUser, setSelectedUser] = useState<{ userName: string; userId: string } | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<{ userName: string; userId: string }[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<{ groupName: string; _id: string } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  const [isGroup, setIsGroup] = useState<boolean>(false);
  const [userData, setUserData] = useState<boolean>(false);
  const [grouping, setGrouping] = useState("");

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const selectedName = selectedUser?.userName ?? selectedGroup?.groupName ?? "No user or group selected";
  const linkDestination = selectedUser
    ? `/about/${selectedUser.userId}`
    : selectedGroup
    ? `/about/${selectedGroup._id}`
    : "";

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
    if (isGroup) {
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

      const response = await axios.get(
        `http://localhost:8080/chat/${currentUserId}/${selectedUserId ? selectedUserId : selectedGroupId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setMessages(response.data.result.messages);
    } catch (error) {
      console.error("Error loading messages", error);
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
        ...(selectedGroup ? { groupId: selectedGroup._id } : {}),
        ...(selectedUser ? { receiverId: selectedUser.userId } : {}),
      };

      // Check if we are sending to a group or a user
      if (!selectedUser && !selectedGroup) {
        toast.error("Please select a user or a group to send the message.");
        return;
      }

      console.log(payload, "payload");

      const response = await axios.post("http://localhost:8080/chat/send", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const savedMessage = response.data;

      console.log("Message sent:", savedMessage);
      setMessages((prevMessages) => [...prevMessages, savedMessage]);
      setNewMessage("");
      toast.success("Message sent!");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message.");
    }
  };

  const toggleGroup = () => {
    setIsGroup((prev) => !prev);
    setSelectedId(null);
    setSelectedUser(null);
    setSelectedGroup(null);
  };

  const toggleUserData = () => {
    setUserData((prev) => !prev);
  };

  const handleDelete = async () => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      toast.error("Token not found");
      return;
    }

    try {
      const response = await axios.delete("http://localhost:8080/group/delete", {
        headers: { Authorization: `Bearer ${token}` },
        data: { grouping },
      });

      toast.success(response.data.message);
    } catch (error) {
      toast.error((error as Error).message);
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
      <div className="row min-vh-75">
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
        <div className="bg-black col-10 px-4">
          {isGroup ? (
            <Group selectedUsers={selectedUsers} />
          ) : (
            <>
              <div className="d-flex justify-content-between align-items-start">
                <h5 className="text-white p-3 mb-2">
                  <Link
                    className="text-white text-decoration-none"
                    to={linkDestination}
                  >
                    {selectedId ? `Chat with ${selectedName}` : `Chat with ${selectedName}`}
                  </Link>
                </h5>
                <AiFillDelete
                  className="text-white mt-3"
                  style={{ fontSize: "20px" }}
                  onClick={() => handleDelete()}
                />
              </div>
              <div
                className="max-vh-50 overflow-auto"
                style={{ height: "50vh" }}
                ref={chatContainerRef}
              >
                {messages.map((msg, idx) => {
                  if (!msg || !msg.senderId) {
                    return null;
                  }

                  const currentUser = users.find((u) => u.userName === userName);
                  const currentGroup = groups.find((g) => g.groupName === groupName);
                  const isUserMessage = msg.senderId === currentUser?.userId;
                  const isGroupMessage = msg.senderId === currentGroup?._id;

                  return (
                    <div
                      key={idx}
                      className={`mb-2 d-flex ${isUserMessage ? "justify-content-end" : "justify-content-start"}`}
                    >
                      <div
                        className={`p-2 rounded ${
                          isUserMessage || isGroupMessage ? "bg-danger text-white" : "bg-light text-dark"
                        }`}
                        style={{ maxWidth: "75%", wordWrap: "break-word" }}
                      >
                        <p className="mb-0">{msg.message}</p>
                      </div>
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
