import axios from "axios";
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";

const UserData = () => {
  const { _id } = useParams<{ _id: string }>();
  console.log(_id);
  const [user, setUser] = useState<{ user: string }>();
  const [name, setName] = useState<string | undefined>();
  const [email, setEmail] = useState<string | undefined>();
  const [groups, setGroups] = useState<string[]>([]);
  const [userData, setUserData] = useState<any>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = sessionStorage.getItem("token");
        if (!token) return toast.error("Token not provided");
        const response = await axios.get(`http://localhost:8080/user/details/${_id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUser(response.data.user);

        const result = response.data.result;
        setName(result.userName);
        setEmail(result.email);
        setGroups(result.groups);
        console.log(groups);
      } catch (error) {
        console.log((error as Error).message);
      }
    };

    if (_id) {
      fetchData();
    }
  }, [_id]);
  return (
    <div>
      {userData ? (
        <div>
          <h1 className="d-flex justify-content-center align-items-center">{name}</h1>
          <div>
            <h1>UserName: {_id}</h1>
            <p>Email: {email}</p>
            {groups?.map((g) => (
              <>
                <p>{g}</p>
              </>
            ))}
            <p>Email: {email}</p>
          </div>
        </div>
      ) : (
        <p>nothing to show</p>
      )}
    </div>
  );
};

export default UserData;
