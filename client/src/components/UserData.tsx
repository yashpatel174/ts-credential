import axios from "axios";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

// Define the type for the user data structure
interface UserDataType {
  userName: string;
  email: string;
  groups: string[];
}

interface UserDataProps {
  userId: string;
}

const UserData: React.FC<UserDataProps> = ({ userId }) => {
  const [name, setName] = useState<string | undefined>();
  const [email, setEmail] = useState<string | undefined>();
  const [groups, setGroups] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = sessionStorage.getItem("token");
        if (!token) {
          toast.error("Token not provided");
          return;
        }

        const response = await axios.get<{ result: UserDataType }>(`http://localhost:8080/user/details/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
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

  return (
    <div>
      {name || email || groups.length > 0 ? (
        <>
          <h1 className="d-flex justify-content-center align-items-center">{name}</h1>
          <div>
            <h1>UserName: {name}</h1>
            <p>Email: {email}</p>
            <h3>Groups:</h3>
            {groups?.map((g, index) => (
              <p key={index}>{g}</p>
            ))}
          </div>
        </>
      ) : (
        <p>Nothing to show</p>
      )}
    </div>
  );
};

export default UserData;
