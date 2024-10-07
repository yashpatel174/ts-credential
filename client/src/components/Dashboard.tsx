import { FC, useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import Group from "./Group";

interface Message {
  senderId: string;
  receiverId?: string;
  groupId?: string;
  message: string;
  timestamp: string;
}

interface SendMessagePayload {
  senderId: string;
  message: string;
  receiverId?: string;
  groupId?: string;
}

const Dashboard: FC = () => {
  const [userName, setUserName] = useState<string>("");
  const [users, setUsers] = useState<{ userName: string; userId: string }[]>([]);
  const [groups, setGroups] = useState<{ groupName: string; groupId: string }[]>([]);
  const [selectedUser, setSelectedUser] = useState<{ userName: string; userId: string } | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<{ groupName: string; groupId: string } | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<{ userName: string; userId: string }[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  const [isGroup, setIsGroup] = useState<boolean>(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);

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
      setSelectedUsers((prev) => {
        if (prev.find((u) => u.userId === user.userId)) {
          return prev.filter((u) => u.userId !== user.userId);
        } else {
          return [...prev, user];
        }
      });
    } else {
      setSelectedUser(user);
      loadChatMessages(user.userId);
    }
  };

  const handleGroupClickk = (group: { groupName: string; groupId: string }) => {
    setSelectedGroup(group);
    loadChatMessages(group.groupId);
  };

  const loadChatMessages = async (selectedId: string, selectedGroupId?: string) => {
    try {
      const token = sessionStorage.getItem("token");
      if (!token) {
        return toast.error("No authentication token found.");
      }

      // Fetch current user details
      const userResponse = await axios.get("http://localhost:8080/user/dashboard", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const currentUser = userResponse.data.result.currentUser;
      if (!currentUser || !currentUser.userId) {
        return toast.error("Current user not found");
      }

      const currentUserId = currentUser.userId;

      // Construct the endpoint URL
      const endpointUrl = `http://localhost:8080/chat/${currentUserId}/${selectedId}${
        selectedGroupId ? `/${selectedGroupId}` : ""
      }`;

      // Make the API call to get messages
      const response = await axios.get(endpointUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Set messages from the response
      setMessages(response.data.result.messages || []);
    } catch (error) {
      console.log("Error loading messages", (error as Error).message);
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
        ...(isGroup && selectedGroup ? { groupId: selectedGroup.groupId } : {}),
        ...(selectedUser ? { receiverId: selectedUser.userId } : {}),
      };

      if (isGroup && selectedGroup) {
        // Sending message to the group
        payload.groupId = selectedGroup.groupId;
      } else if (selectedUser) {
        // Sending message to a single user
        payload.receiverId = selectedUser.userId;
      } else {
        toast.error("No user or group selected.");
        return;
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

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const toggleGroup = () => {
    setIsGroup((prev) => !prev);
  };

  return (
    <div>
      <div className="d-flex justify-content-center align-items-center w-full">
        <div
          style={{ width: "90%" }}
          className="d-flex justify-content-between"
        >
          <h1 className="text-center my-2">{userName}</h1>
          {isGroup ? (
            <button
              className="bg-black text-white rounded-lg border-0 my-2 px-3"
              style={{ fontSize: "1rem", borderRadius: "20px" }}
              onClick={toggleGroup}
            >
              Chatting Room
            </button>
          ) : (
            <button
              className="bg-black text-white rounded-lg border-0 my-2 px-3"
              style={{ fontSize: "1rem", borderRadius: "20px" }}
              onClick={toggleGroup}
            >
              Create Group
            </button>
          )}
        </div>
      </div>
      <div className="row min-vh-75">
        <div className="col-3 bg-black text-white px-4">
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
          {isGroup ? null : (
            <>
              <h1 className="text-center mb-4">Groups</h1>
              <ul className="list-unstyled">
                {groups?.map((group) => (
                  <li
                    key={group.groupId}
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
        <div className="bg-black col-9 pl-4">
          {isGroup ? (
            <Group selectedUsers={selectedUsers} />
          ) : (
            <>
              <div className="text-white p-3 mb-2">
                <h5>{selectedUser ? `Chat with ${selectedUser.userName}` : "Select a user to chat"}</h5>
              </div>
              <div
                className="max-vh-50 overflow-auto"
                style={{ height: "50vh" }}
                ref={chatContainerRef}
              >
                <div className="chat-message mb-2 px-2">
                  {messages.map((msg, idx) => {
                    if (!msg || !msg.senderId) {
                      return null;
                    }

                    const currentUser = users.find((u) => u.userName === userName);
                    const currentUserId = currentUser ? currentUser.userId : null;
                    const isUserMessage = msg.senderId === currentUserId;

                    return (
                      <div
                        key={idx}
                        className={`mb-2 d-flex ${isUserMessage ? "justify-content-end" : "justify-content-start"}`}
                      >
                        <div
                          className={`p-2 rounded ${isUserMessage ? "bg-danger text-white" : "bg-light text-dark"}`}
                          style={{
                            maxWidth: "75%",
                            wordWrap: "break-word",
                          }}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
