import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { useAuth } from "./context/AuthContext.jsx";

import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import RegisterProject from "./pages/RegisterProject.jsx";
import Registry from "./pages/Registry.jsx";
import MrvVerification from "./pages/MrvVerification.jsx";
import Credits from "./pages/Credits.jsx";
import Home from "./pages/Home.jsx";

function HomeOrDashboard() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="route-loading">
        Loading Blue Carbon Registry…
      </div>
    );
  }

  return user ? <Dashboard /> : <Home />;
}

export default function App() {
  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/" element={<HomeOrDashboard />} />
        <Route
          path="/registry"
          element={
            <ProtectedRoute>
              <Registry />
            </ProtectedRoute>
          }
        />
        <Route
          path="/register-project"
          element={
            <ProtectedRoute roles={["owner"]}>
              <RegisterProject />
            </ProtectedRoute>
          }
        />

        <Route
          path="/mrv"
          element={
            <ProtectedRoute roles={["verifier"]}>
              <MrvVerification />
            </ProtectedRoute>
          }
        />

        <Route
          path="/credits"
          element={
            <ProtectedRoute roles={["regulator"]}>
              <Credits />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}