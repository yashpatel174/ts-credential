import axios from "axios";

const API_URL = "http://localhost:8080/group";

export const createGroup = async (groupData: { groupName: string; members: string[] }) => {
  return await axios.post(`${API_URL}/create`, groupData, { withCredentials: true });
};

export const addUser = async (groupId: string, userId: string) => {
  return await axios.post(`${API_URL}/${groupId}/addUser`, { userId }, { withCredentials: true });
};

export const removeUser = async (groupId: string, userId: string) => {
  return await axios.post(`${API_URL}/${groupId}/removeUser`, { userId }, { withCredentials: true });
};

export const deleteGroup = async (groupId: string) => {
  return await axios.delete(`${API_URL}/${groupId}`, { withCredentials: true });
};

export const fetchGroups = () => {
  return axios.get(`${API_URL}`);
};
