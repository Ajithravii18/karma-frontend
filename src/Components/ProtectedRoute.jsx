// ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  // Check the correct key stored in localStorage
  const token = localStorage.getItem("authToken"); // matches Login.jsx

  if (!token) {
    // Not logged in → redirect
    return <Navigate to="/login" replace />;
  }

  // Logged in → render page
  return children;
};

export default ProtectedRoute;