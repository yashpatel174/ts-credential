import axios from "axios";
import { toast } from "react-toastify";

const API_URL = "http://localhost:8080/group";

const token: string | null = sessionStorage.getItem("token");

export const createGroup = async (groupData: { groupName: string; members: string[] }) => {
  try {
    return await axios.post(`${API_URL}/create`, groupData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      withCredentials: true,
    });
  } catch (error) {
    toast.error("Error in creating group!");
  }
};

export const addUser = async (groupData: { groupId: string; members: string[] }) => {
  return await axios.post(`${API_URL}/addUser`, groupData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    withCredentials: true,
  });
};

export const removeUser = async (groupId: string, userId: string) => {
  return await axios.post(
    `${API_URL}/removeUser`,
    { groupId, userId },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      withCredentials: true,
    }
  );
};

export const deleteGroup = async (groupId: string) => {
  return await axios.delete(`${API_URL}/${groupId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    withCredentials: true,
  });
};

export const fetchGroups = () => {
  return axios.get(`${API_URL}`);
};
