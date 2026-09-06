import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import RegisterProject from "./pages/RegisterProject.jsx";
import MrvVerification from "./pages/MrvVerification.jsx";
import Credits from "./pages/Credits.jsx";

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/register-project" element={<ProtectedRoute roles={["owner"]}><RegisterProject /></ProtectedRoute>} />
        <Route path="/mrv" element={<ProtectedRoute roles={["verifier", "regulator"]}><MrvVerification /></ProtectedRoute>} />
        <Route path="/credits" element={<ProtectedRoute><Credits /></ProtectedRoute>} />
      </Routes>
    </>
  );
}
