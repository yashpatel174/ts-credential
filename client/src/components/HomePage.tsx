import React from "react";

const HomePage: React.FC = () => {
  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100">
      <div
        className="card text-center bg-white shadow"
        style={{ width: "100%", maxWidth: "300px" }}
      >
        <div className="card-body">
          <h1
            className="m-4"
            style={{ color: "#ff803e" }}
          >
            Homepage
          </h1>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
