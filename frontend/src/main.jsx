import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { Web3Provider } from "./context/Web3Context.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Web3Provider>
          <App />
        </Web3Provider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
