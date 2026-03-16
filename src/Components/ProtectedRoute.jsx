// ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, allowedRoles }) => {
  // Check the correct key stored in localStorage
  const token = localStorage.getItem("authToken") || localStorage.getItem("token");
  const userRole = localStorage.getItem("userRole") || "user";

  if (!token) {
    // Not logged in → redirect
    return <Navigate to="/login" replace />;
  }

  // Role-based protection
  const lowerUserRole = (userRole || "user").toLowerCase().trim();
  const lowerAllowedRoles = (allowedRoles || []).map(r => r.toLowerCase().trim());

  if (allowedRoles && !lowerAllowedRoles.includes(lowerUserRole)) {
    // Role not authorized → redirect to their specific dashboard or home
    if (lowerUserRole === "admin") return <Navigate to="/admin-dashboard" replace />;
    if (lowerUserRole === "volunteer") return <Navigate to="/volunteer-portal" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  // Logged in and authorized → render page
  return children;
};

export default ProtectedRoute;