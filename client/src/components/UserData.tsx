import axios from "axios";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

interface UserDataProps {
  userId: string;
}

interface Group {
  _id: string;
  groupName: string;
  members: string[];
  admin: string;
}

const UserData: React.FC<UserDataProps> = ({ userId }) => {
  const [name, setName] = useState<string | undefined>();
  const [email, setEmail] = useState<string | undefined>();
  const [groups, setGroups] = useState<Group[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = sessionStorage.getItem("token");
        if (!token) {
          toast.error("Token not provided");
          return;
        }

        const response = await axios.get(`http://localhost:8080/user/details/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const result = response.data.result;
        console.log(result, "Result");

        setName(result?.userName);
        setEmail(result?.email);
        setGroups(result?.groups);
      } catch (error) {
        console.log((error as Error).message);
      }
    };

    if (userId) {
      fetchData();
    }
  }, [userId]);

  const openGmail = () => {
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${email}`, "_blank");
  };

  return (
    <div
      className="container max-vh-50"
      style={{ height: "76vh", color: "#ff803d" }}
    >
      {name || email || groups.length > 0 ? (
        <>
          <h1 className="mt-2 text-white">{name}</h1>
          <div>
            <h1>
              <span className="text-white">UserName:</span> {name}
            </h1>
            <h3>
              <span className="text-white">Email Id:</span> <span onClick={openGmail}>{email}</span>
            </h3>
            <h3 className="text-white">Groups:</h3>
            <ul className="list-unstyled">
              {groups?.map((g) => (
                <li
                  key={g._id}
                  className="border rounded shadow-sm mb-2 p-2 text-center text-white"
                  style={{ backgroundColor: "#ff803e", cursor: "pointer", width: "10%" }}
                >
                  {g.groupName}
                </li>
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

export default UserData;
