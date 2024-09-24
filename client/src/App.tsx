import React, { FC } from "react";
import "./App.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Routing from "./routers/Routing";
import "bootstrap/dist/css/bootstrap.min.css";

const App: FC = () => {
  return (
    <>
      <Routing />
      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        draggable
      />
    </>
  );
};

export default App;
