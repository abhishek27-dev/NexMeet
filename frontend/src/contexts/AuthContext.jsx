/* eslint-disable react-refresh/only-export-components */
import axios from "axios";
import httpStatus from "http-status";
import { createContext } from "react";
import { useNavigate } from "react-router-dom";
import server from "../environment";

export const AuthContext = createContext({});

const client = axios.create({
  baseURL: `${server}/api/v1/users`,
});

export const AuthProvider = ({ children }) => {
  const router = useNavigate();

  const handleRegister = async (name, username, password) => {
    try {
      let request = await client.post("/register", {
        name: name,
        username: username,
        password: password,
      });
      if (request.status === httpStatus.CREATED) {
        return request.data.message;
      }
    } catch (err) {
      throw err?.response?.data?.message || "Registration failed";
    }
  };

  const handleLogin = async (username, password) => {
    try {
      let request = await client.post("/login", {
        username: username,
        password: password,
      });

      if (request.status === httpStatus.OK) {
        localStorage.setItem("token", request.data.token);
        router("/home");
      }
    } catch (err) {
      throw err?.response?.data?.message || "Login failed";
    }
  };

  const getHistoryOfUser = async () => {
    const token = localStorage.getItem("token");
    if (!token) return [];
    try {
      let request = await client.get("/get_all_activity", {
        params: { token },
      });
      return request.data || [];
    } catch {
      return [];
    }
  };

  const addToUserHistory = async (meetingCode) => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
      let request = await client.post("/add_to_activity", {
        token: token,
        meeting_code: meetingCode,
      });
      return request;
    } catch {
      // Return null silently if user is guest or token is expired
      return null;
    }
  };

  const handleLogout = async () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        await client.post("/logout", { token });
      } catch {
        /* ignore logout network errors */
      }
    }
    localStorage.removeItem("token");
    router("/");
  };

  const data = {
    addToUserHistory,
    getHistoryOfUser,
    handleRegister,
    handleLogin,
    handleLogout,
  };

  return <AuthContext.Provider value={data}>{children}</AuthContext.Provider>;
};

