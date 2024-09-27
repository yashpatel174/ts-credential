import React, { useContext, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaBars } from "react-icons/fa";
import { AuthContext } from "./AuthProvider";

const Header: React.FC = () => {
  const [isNavOpen, setNavOpen] = useState<boolean>(false);
  const navigate = useNavigate();
  const location = useLocation();

  const authContext = useContext(AuthContext);
  if (!authContext) {
    throw new Error("Error while logging out.");
  }

  const { logout } = authContext;

  const login = location.pathname === "/login";
  const register = location.pathname === "/register";
  const homePage = location.pathname === "/";
  const forgot = location.pathname === "/forgot-password";

  const handleLogout = () => {
    localStorage.removeItem("token");
    logout();
    navigate("/login");
  };

  const toggleNav = () => {
    setNavOpen(!isNavOpen);
  };

  const isLoggedIn = !!localStorage.getItem("token");

  return (
    <>
      <header className="bg-black text-white d-flex justify-content-between align-items-center py-1">
        <div className="d-none d-md-flex w-75 justify-content-between align-items-center mx-auto">
          <Link
            to="/"
            className="d-flex flex-column justify-content-center align-items-center text-decoration-none"
          >
            <span className="fs-5 fw-bold text-white">
              <i> Registration </i>
            </span>
            <span className="fs-6 fw-light text-white">Pvt. Ltd.</span>
          </Link>

          <div className="d-flex align-items-center">
            {homePage || forgot ? (
              <>
                <Link
                  to="/login"
                  className="text-white text-decoration-none"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="text-white text-decoration-none ms-3"
                >
                  Register
                </Link>
              </>
            ) : (
              <>
                {isLoggedIn ? (
                  <button
                    onClick={handleLogout}
                    className="btn btn-link text-white text-decoration-none"
                  >
                    Logout
                  </button>
                ) : (
                  <>
                    {login && (
                      <Link
                        to="/register"
                        className="text-white text-decoration-none"
                      >
                        Register
                      </Link>
                    )}
                    {register && (
                      <Link
                        to="/login"
                        className="text-white text-decoration-none ms-3"
                      >
                        Login
                      </Link>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>

        <nav className="d-md-none w-100 d-flex justify-content-between align-items-center">
          <Link
            to="/"
            className="d-flex flex-column justify-content-center align-items-center text-decoration-none ms-2"
          >
            <span className="fs-5 fw-bold text-white">
              <i> Registration </i>
            </span>
            <span className="fs-6 fw-light text-white">Pvt. Ltd.</span>
          </Link>
          <button
            onClick={toggleNav}
            className="btn btn-link text-white text-decoration-none"
          >
            <FaBars style={{ fontSize: "24px" }} />
          </button>
        </nav>
      </header>

      {/* Mobile Navigation Menu */}
      <div className="d-flex justify-content-end">
        {isNavOpen && (
          <div className="d-md-none bg-black text-white w-50">
            <div className="text-center">
              {homePage || forgot ? (
                <ul className="list-unstyled">
                  <li>
                    <Link
                      to="/login"
                      className="text-white text-decoration-none"
                      onClick={() => setNavOpen(false)}
                    >
                      Login
                    </Link>
                  </li>
                  <span
                    className="d-block w-100 bg-white my-2"
                    style={{ height: "1px" }}
                  ></span>
                  <li>
                    <Link
                      to="/register"
                      className="text-white text-decoration-none"
                      onClick={() => setNavOpen(false)}
                    >
                      Register
                    </Link>
                  </li>
                </ul>
              ) : (
                <>
                  {isLoggedIn ? (
                    <button
                      onClick={handleLogout}
                      className="btn btn-link text-white text-decoration-none py-2"
                    >
                      Logout
                    </button>
                  ) : (
                    <>
                      {login && (
                        <Link
                          to="/register"
                          className="text-white text-decoration-none py-2"
                          onClick={() => setNavOpen(false)}
                        >
                          Register
                        </Link>
                      )}
                      {register && (
                        <Link
                          to="/login"
                          className="text-white text-decoration-none py-2"
                          onClick={() => setNavOpen(false)}
                        >
                          Login
                        </Link>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Header;
