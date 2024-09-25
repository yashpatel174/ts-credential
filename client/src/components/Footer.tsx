import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <>
      <footer className="bg-black text-white py-4">
        <div className="container">
          <div className="row text-center text-md-start">
            {/* Branding Section */}
            <div className="col-md-4 mb-3 mb-md-0 d-flex flex-column align-items-center align-items-md-start">
              <Link
                to="/"
                className="text-decoration-none text-white text-center"
              >
                <h5 className="fw-bold mb-1">
                  <i>Registration</i>
                </h5>
                <span className="fw-light">Pvt. Ltd.</span>
              </Link>
            </div>

            {/* Copyright Section */}
            <div className="col-md-4 mb-3 mb-md-0 d-flex flex-column justify-content-center align-items-center text-center">
              <p className="mb-0">
                &copy; {new Date().getFullYear()} Registration Pvt. Ltd. <br /> All Rights Reserved.
              </p>
            </div>

            {/* Navigation Links */}
            <div className="col-md-4 d-flex flex-column align-items-center align-items-md-end">
              <ul className="list-unstyled d-flex gap-3 mb-0">
                <li>
                  <Link
                    to="/login"
                    className="text-white text-decoration-none"
                  >
                    Login
                  </Link>
                </li>
                <li>
                  <Link
                    to="/register"
                    className="text-white text-decoration-none"
                  >
                    Register
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
