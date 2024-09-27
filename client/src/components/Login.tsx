import { FC, useContext, useState, FormEvent } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { AuthContext } from "./AuthProvider";

const Login: FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const navigate = useNavigate();

  const authContext = useContext(AuthContext);
  if (!authContext) {
    throw new Error("AuthContext must be used within an AuthProvider");
  }

  const { login } = authContext;

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const validateEmail = (email: string): boolean => {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailPattern.test(email);
    };

    if (!email.trim() && !password.trim()) {
      return toast.error("Email & password are required!");
    }
    if (!email.trim()) {
      return toast.error("Email is required!");
    }
    if (email && !validateEmail(email)) {
      return toast.error("Invalid email id!");
    }
    if (!password.trim()) {
      return toast.error("Password is required!");
    }

    try {
      const response = await axios.post("http://localhost:8080/user/login", { email, password });

      if (response.data && response.data.result) {
        const token: string = response.data.result;
        localStorage.setItem("token", token);
        login(token);
        toast.success(response.data.message);
        navigate("/dashboard");
      } else {
        toast.error(response.data.message || "An error occurred!");
      }
    } catch (error: any) {
      if (error.response) {
        const errorMessage: string = error.response.data.message || "An error occurred!";
        toast.error(errorMessage);
      } else {
        toast.error("Something went wrong. Please try again!");
      }
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-6 col-xl-4">
            <div
              className="card text-black border-2 border-black shadow-lg"
              style={{ backgroundColor: "#ff803e" }}
            >
              <div className="card-body">
                <h1
                  className="text-center mb-4"
                  style={{ color: "#000", fontSize: "2rem" }}
                >
                  Login
                </h1>
                <form
                  onSubmit={handleLogin}
                  noValidate
                >
                  <div className="mb-3">
                    <label
                      htmlFor="email"
                      className="form-label text-black"
                      style={{ fontSize: "1rem" }}
                    >
                      Email
                    </label>
                    <input
                      type="text"
                      className="form-control bg-white text-black"
                      id="email"
                      name="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label
                      htmlFor="password"
                      className="form-label text-black"
                      style={{ fontSize: "1rem" }}
                    >
                      Password
                    </label>
                    <input
                      type="password"
                      className="form-control bg-white text-black"
                      id="password"
                      name="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <p
                      className="text-black text-start text-sm-end"
                      style={{ marginTop: "5px", fontSize: "0.875rem" }}
                    >
                      Don't you have an account?{" "}
                      <Link
                        to="/register"
                        className="text-decoration-none"
                      >
                        Register
                      </Link>{" "}
                    </p>
                  </div>
                  <div className="text-center d-flex flex-column flex-sm-row">
                    <button
                      type="submit"
                      className="btn btn-warning w-100 bg-black text-white border-2 border-white mb-2 mb-sm-0"
                      style={{ fontSize: "1rem" }}
                    >
                      Login
                    </button>
                    <Link
                      to="/forgot-password"
                      className="btn btn-warning w-100 bg-black text-white border-2 border-white mt-2 mt-sm-0 ms-sm-2"
                      style={{ fontSize: "1rem" }}
                    >
                      Forgot password
                    </Link>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
