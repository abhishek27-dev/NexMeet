/* eslint-disable no-unused-vars */
import React from "react";
import { Navigate } from "react-router-dom";

// BUG FIX: This file was missing entirely — home.jsx imports withAuth but it didn't exist
const withAuth = (Component) => {
  const AuthenticatedComponent = (props) => {
    const token = localStorage.getItem("token");
    return <Component {...props} isAuthenticated={Boolean(token)} />;
  };
  return AuthenticatedComponent;
};

export default withAuth;
