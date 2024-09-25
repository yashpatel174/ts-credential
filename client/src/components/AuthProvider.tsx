import { FC, useState, createContext, ReactNode } from "react";
import { toast } from "react-toastify";

interface AuthContextType {
  auth: { token: string } | null;
  login: (token: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const AuthProvider: FC<AuthProviderProps> = ({ children }) => {
  const [auth, setAuth] = useState<{ token: string } | null>(() => {
    return sessionStorage.getItem("token") ? { token: sessionStorage.getItem("token")! } : null;
  });

  const login = (token: string) => {
    sessionStorage.setItem("token", token);
    setAuth({ token });
  };

  const logout = () => {
    sessionStorage.removeItem("token");
    toast.success("Logged out successfully!");
    setAuth(null);
  };

  return <AuthContext.Provider value={{ auth, login, logout }}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
