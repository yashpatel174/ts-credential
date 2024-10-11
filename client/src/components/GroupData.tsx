import axios from "axios";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

interface UserDataProps {
  _id: string;
}

interface Group {
  _id: string;
  groupName: string;
  members: string[];
  admin: string;
}

const GroupData: React.FC<UserDataProps> = ({ _id }) => {
  const [name, setName] = useState<string | undefined>();
  const [email, setEmail] = useState<string | undefined>();
  const [members, setMembers] = useState<Group[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = sessionStorage.getItem("token");
        if (!token) {
          toast.error("Token not provided");
          return;
        }

        const response = await axios.get(`http://localhost:8080/user/details/${_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const result = response.data.result;
        console.log(result, "Result");

        setName(result?.userName);
        setEmail(result?.email);
        setMembers(result?.members);
      } catch (error) {
        console.log((error as Error).message);
      }
    };

    if (_id) {
      fetchData();
    }
  }, [_id]);

  return (
    <div
      className="container max-vh-50"
      style={{ height: "76vh", color: "#ff803d" }}
    >
      {name || email || members.length > 0 ? (
        <>
          <h1 className="mt-2 text-white">{name}</h1>
          <div>
            <h1>
              <span className="text-white">UserName:</span> {name}
            </h1>
            <h3>
              <span className="text-white">Email Id:</span> {email}
            </h3>
            <h3 className="text-white">Members:</h3>
            <ul className="list-unstyled">
              {members?.map((m) => (
                <li
                  key={m._id}
                  className="border rounded shadow-sm mb-2 p-2 text-center text-white"
                  style={{ backgroundColor: "#ff803e", cursor: "pointer", width: "10%" }}
                >
                  {/* {m.userName} */}
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

export default GroupData;
