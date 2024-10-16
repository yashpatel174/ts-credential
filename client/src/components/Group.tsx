import { FC, useState, FormEvent } from "react";
import { createGroup } from "../api";
import { toast } from "react-toastify";
import { Button, Form } from "react-bootstrap";

interface User {
  userName: string;
  userId: string;
}

export interface GroupProps {
  selectedUsers: User[];
}

const Group: FC<GroupProps> = ({ selectedUsers }) => {
  const [groupName, setGroupName] = useState<string>("");

  const handleCreateGroup = async (e: FormEvent) => {
    e.preventDefault();

    if (selectedUsers.length < 2) {
      toast.error("At least two members are required.");
      return;
    }

    const token = sessionStorage.getItem("token");
    if (!token) {
      toast.error("User is not authenticated! Please log in.");
      return;
    }

    try {
      const response = await createGroup({
        groupName,
        members: selectedUsers.map((user) => user.userId),
      });

      if (!response || response.data.error) {
        toast.error("Group not created, please try again!");
      } else {
        toast.success("Group created successfully!");
        setGroupName("");
      }
    } catch (error) {
      console.log((error as Error).message);
    }
  };

  return (
    <div
      className="container max-vh-50 overflow-auto"
      style={{ height: "76vh" }}
    >
      <h1 className="text-white mt-2">Group Management</h1>
      <Form
        onSubmit={handleCreateGroup}
        className="mb-4"
      >
        <Form.Group controlId="formGroupName max-w-50 overflow-auto">
          <Form.Label className="text-white">Group Name</Form.Label>
          <Form.Control
            type="text"
            value={groupName}
            className="w-25"
            onChange={(e) => setGroupName(e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group controlId="formGroupMembers mt-4">
          <Form.Label className="text-white">Members</Form.Label>
          {selectedUsers.map((user, index) => (
            <div
              key={index}
              className="d-flex mb-2 text-center justify-content-sapce-between"
              style={{ width: "10vw" }}
            >
              <span className="form-control">{user.userName}</span>
            </div>
          ))}
        </Form.Group>
        <Button
          variant="primary"
          type="submit"
        >
          Create Group
        </Button>
      </Form>
    </div>
  );
};

export default Group;
