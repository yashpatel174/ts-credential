import axios from "axios";
import React, { FormEvent, useState } from "react";
import { toast } from "react-toastify";

const ForgotPassword = () => {
  const [email, setEmail] = useState<string>("");

  const handleForgotPassword = async (e: FormEvent<HTMLButtonElement>) => {
    e.preventDefault();

    const validateEmail = (email: string): boolean => {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailPattern.test(email);
    };

    if (!email.trim()) {
      return toast.error("Enter your email id!");
    }

    if (email && !validateEmail(email)) {
      return toast.error("Invalid email id!");
    }

    try {
      const response = await axios.post("http://localhost:8080/user/forgot-password", { email });

      if (response.data && response.data.message) {
        toast.success(response.data.message);
      } else {
        toast.error("An error occurred while logging in.");
      }
    } catch (error: any) {
      if (error.response && error.response.data) {
        const errorMessage: string = error.response.data.message || "An error occurred!";
        toast.error(errorMessage);
      } else {
        toast.error("Server error. Please try again later.");
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
                  className="text-center text-black mb-4"
                  style={{ fontSize: "2rem" }}
                >
                  Forgot Password
                </h1>
                <form noValidate>
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
                      placeholder="Enter your email address."
                    />
                  </div>
                  <div className="text-center">
                    <button
                      type="submit"
                      onClick={handleForgotPassword}
                      className="btn btn-warning w-100 bg-black text-white border-2 border-white"
                    >
                      Forgot Password
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

export default ForgotPassword;
