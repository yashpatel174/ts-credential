import { FC, useEffect, useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";

interface DashboardData {
  result: string;
}

const Dashboard: FC = () => {
  const [data, setData] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get<DashboardData>("http://localhost:8080/user/dashboard", {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        });

        setData(response.data.result);
      } catch (error: any) {
        if (error.response) {
          const errorMessage: string = error.response.data.message || "An error occurred!";
          toast.error(errorMessage);
        } else {
          toast.error("Something went wrong. Please try again!");
        }
      }
    };

    fetchData();
  }, []);

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100">
      <div className="card text-center bg-white shadow">
        <div className="card-body">
          <h3 className=" text-white bg-black p-1 border border-primary rounded">Welcome to the dashboard!</h3>
          <h2 className="text-black">Your email id is</h2>
          <h1 style={{ color: "#ff803e" }}>{data}</h1>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
