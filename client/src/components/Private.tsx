import React, { useContext, FC } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "./AuthProvider";

interface PrivateProps {
  element: JSX.Element;
}

const Private: FC<PrivateProps> = ({ element: Component }) => {
  const context = useContext(AuthContext);

  if (!context) {
    return null;
  }

  const { auth } = context;

  return auth ? Component : <Navigate to="/login" />;
};

export default Private;
