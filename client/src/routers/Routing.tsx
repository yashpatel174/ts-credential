import React, { useEffect, FC } from "react";
import { BrowserRouter as Router, Route, Routes, useNavigate } from "react-router-dom";
import AuthProvider from "../components/AuthProvider";
import Header from "../components/Header";
import Footer from "../components/Footer";
import HomePage from "../components/HomePage";
import Login from "../components/Login";
import Register from "../components/Register";
import ResetPassword from "../components/ResetPassword";
import Dashboard from "../components/Dashboard";
import NoPage from "../components/NoPage";
import Private from "../components/Private";
import ForgotPassword from "../components/ForgotPassword";

const Routing: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AuthCheck />
        <Header />
        <Routes>
          <Route
            path="/"
            element={<HomePage />}
          />
          <Route
            path="/login"
            element={<Login />}
          />
          <Route
            path="/register"
            element={<Register />}
          />
          <Route
            path="/forgot-password"
            element={<ForgotPassword />}
          />
          <Route
            path="/reset-password/:token"
            element={<ResetPassword />}
          />
          <Route
            path="/dashboard"
            element={<Private element={<Dashboard />} />}
          />
          <Route
            path="*"
            element={<NoPage />}
          />
        </Routes>
        <Footer />
      </Router>
    </AuthProvider>
  );
};

const AuthCheck: FC = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/dashboard");
    } else {
      const currentPath = window.location.pathname;
      navigate(currentPath);
    }
  }, [navigate]);
  return null;
};

export default Routing;
