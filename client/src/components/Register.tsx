import axios from "axios";
import { FC, useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const Register: FC = () => {
  const [userName, setUserName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const navigate = useNavigate();

  const handleRegister = async (e: FormEvent) => {
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
      const response = await axios.post("http://localhost:8080/user/register", { userName, email, password });

      if (response.data) {
        toast.success(response.data.message);
        navigate("/login");
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
                  Register
                </h1>
                <form
                  onSubmit={handleRegister}
                  noValidate
                >
                  <div className="mb-3">
                    <label
                      htmlFor="username"
                      className="form-label text-black"
                      style={{ fontSize: "1rem" }}
                    >
                      Username
                    </label>
                    <input
                      type="text"
                      className="form-control bg-white text-black"
                      id="username"
                      name="username"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      required
                    />
                  </div>
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
                      Already have an account?{" "}
                      <Link
                        to="/login"
                        className="text-decoration-none"
                      >
                        Login
                      </Link>{" "}
                    </p>
                  </div>
                  <div className="text-center">
                    <button
                      type="submit"
                      className="btn btn-warning w-100 bg-black text-white border-2 border-white"
                    >
                      Register
                    </button>
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

export default Register;
