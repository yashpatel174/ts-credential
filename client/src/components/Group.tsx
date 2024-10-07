import { FC, useState, FormEvent } from "react";
import { createGroup } from "../api";
import { toast } from "react-toastify";
import { Button, Form } from "react-bootstrap";

interface User {
  userName: string;
  userId: string;
}

interface GroupProps {
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
    if (!token) toast.error("User is not authenticated!");
    console.log(token, "token");

    try {
      await createGroup({ groupName, members: selectedUsers.map((user) => user.userId) });
      if (!createGroup) toast.error("Group not created, please try again!");
      toast.success("Group created successfully!");
      setGroupName("");
    } catch (error) {
      toast.error("Error creating group!");
    }
  };

  return (
    <div className="container">
      <h1 className="text-white">Group Management</h1>
      <Form
        onSubmit={handleCreateGroup}
        className="mb-4"
      >
        <Form.Group controlId="formGroupName">
          <Form.Label className="text-white">Group Name</Form.Label>
          <Form.Control
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group controlId="formGroupMembers">
          <Form.Label className="text-white">Members</Form.Label>
          {selectedUsers.map((user, index) => (
            <div
              key={index}
              className="d-flex mb-2"
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
