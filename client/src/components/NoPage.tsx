import { useNavigate } from "react-router-dom";

const NoPage = () => {
  const navigate = useNavigate();
  const redirect = () => {
    setTimeout(() => {
      navigate("/login");
    }, 2000);
  };
  redirect();
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
            Page Not Found
          </h1>
        </div>
      </div>
    </div>
  );
};

export default NoPage;
