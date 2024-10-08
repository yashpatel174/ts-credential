import { FC, useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import Group from "./Group";
import { Link } from "react-router-dom";

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
  groupId?: string;
  message: string;
  receiverId?: string;
  _id?: string;
}

const Dashboard: FC = () => {
  const [userName, setUserName] = useState<string>("");
  const [users, setUsers] = useState<{ userName: string; userId: string }[]>([]);
  const [groups, setGroups] = useState<{ groupName: string; _id: string }[]>([]);
  const [selectedUser, setSelectedUser] = useState<{ userName: string; userId: string } | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<{ groupName: string; _id: string } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  const [isGroup, setIsGroup] = useState<boolean>(false);

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
        setUsers(otherUsers || []);
        setGroups(groups || []);
      } catch (error) {
        console.error("Error fetching users and groups:", error);
      }
    };

    fetchUsersAndGroups();
  }, []);

  const handleUserClick = (user: { userName: string; userId: string }) => {
    if (isGroup) {
      setSelectedId(null);
    } else {
      setSelectedUser(user);
      setSelectedId(user.userId);
      loadChatMessages(user.userId, "");
    }
  };

  const handleGroupClickk = (group: { groupName: string; _id: string }) => {
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
        ...(isGroup && selectedGroup ? { groupId: selectedGroup._id } : {}),
        ...(selectedUser ? { receiverId: selectedUser.userId } : {}),
      };

      if (!selectedId) {
        return toast.error("No user or group selected.");
      }

      const response = await axios.post("http://localhost:8080/chat/send", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMessages((prevMessages) => [...prevMessages, response.data.messages]);
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
          <h1 className="text-center mb-4">Users</h1>
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
              <h1 className="text-center mb-4">Groups</h1>
              <ul className="list-unstyled">
                {groups?.map((group) => (
                  <li
                    key={group._id}
                    className="border rounded shadow-sm mb-2 p-2 text-center text-white"
                    style={{ backgroundColor: "#ff803e", cursor: "pointer" }}
                    onClick={() => handleGroupClickk(group)}
                  >
                    {group.groupName}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
        <div className="bg-black col-10 px-4">
          <h5 className="text-white p-3 mb-2">
            <Link
              className="text-white text-decoration-none"
              to={linkDestination}
            >
              {selectedId ? `Chat with ${selectedName}` : selectedName}
            </Link>
          </h5>
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
              const isUserMessage = msg.senderId === currentUser?.userId;

              return (
                <div
                  key={idx}
                  className={`mb-2 d-flex ${isUserMessage ? "justify-content-end" : "justify-content-start"}`}
                >
                  <div
                    className={`p-2 rounded ${isUserMessage ? "bg-danger text-white" : "bg-light text-dark"}`}
                    style={{ maxWidth: "75%", wordWrap: "break-word" }}
                  >
                    <p className="mb-0">{msg.message}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="d-flex flex-column justify-content-end bg-dark p-3 h-full">
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
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
