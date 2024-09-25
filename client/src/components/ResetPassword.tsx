import axios from "axios";
import { FormEvent, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

const ResetPassword = () => {
  const { token } = useParams<{ token: string }>();
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const navigate = useNavigate();

  const handleReset = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post(`http://localhost:8080/user/reset-password/${token}`, {
        password,
        confirmPassword,
      });

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
                  Reset Password
                </h1>
                <form
                  onSubmit={handleReset}
                  noValidate
                >
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
                  </div>
                  <div className="mb-3">
                    <label
                      htmlFor="confirmPassword"
                      className="form-label text-black"
                    >
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      className="form-control bg-white text-black"
                      id="password"
                      name="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="text-center">
                    <button
                      type="submit"
                      className="btn btn-warning w-100 bg-black text-white border-2 border-white"
                    >
                      Reset
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

export default ResetPassword;
