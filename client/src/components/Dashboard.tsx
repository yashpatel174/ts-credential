import { FC, useEffect, useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { Link } from "react-router-dom";

interface DashboardData {
  result: {
    currentUser: {
      userName: string;
    };
    otherUsers: [object];
  };
}

const Dashboard: FC = () => {
  const [userName, setUserName] = useState<string>("");
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get("http://localhost:8080/user/dashboard");
        setUserName(response.data.result.currentUser);
        setUsers(response.data.result.otherUsers);
        // setGroup(response.data.result.group);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div className="mx-4">
      <div className="row">
        <h1 className="text-center mb-4">{userName}</h1>
        <div className="col-3">
          <h1 className="text-center mb-4">Users</h1>
          <ul className="list-unstyled">
            {users?.map((user) => (
              <li
                // key={user}
                className="bg-white border rounded shadow-sm mb-3 p-3"
              >
                <Link
                  to={user}
                  className="mt-2 text-dark"
                >
                  {user}
                </Link>
              </li>
            ))}
          </ul>
          <hr />
          <h1 className="text-center mb-4">Groups</h1>
          {/* <ul className="list-unstyled">
            {groups
              ? groups.map((item) => (
                  <li
                    key={item.id}
                    className="bg-white border rounded shadow-sm mb-3 p-3"
                  >
                    <div className="mt-2 text-dark">{item}</div>
                  </li>
                ))
              : null}
          </ul> */}
        </div>
        <div className="col-9">
          <h3>Right Column</h3>
          <p>This is the right column with 9 parts.</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
