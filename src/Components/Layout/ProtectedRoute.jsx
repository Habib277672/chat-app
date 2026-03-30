import React from "react";
import { Navigate } from "react-router-dom";

export const ProtectedRoute = ({ session, loading, children }) => {
  if (loading) {
    return <p>{""}</p>;
  }

  if (!session) {
    return <Navigate to="/" replace />;
  }

  return children;
};
