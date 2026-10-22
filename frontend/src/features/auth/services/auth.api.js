import api from "../../../services/api.client";

export async function register({ username, email, password }) {
  try {
    const response = await api.post("/api/v1/users/register", {
      username,
      email,
      password,
    });
    return response.data;
  } catch (err) {
    const message =
      err.response?.data?.message || err.message || "Registration failed";
    throw new Error(message);
  }
}

export async function login({ username, email, password }) {
  try {
    const response = await api.post("/api/v1/users/login", {
      username: username || email,
      email: email || username,
      password,
    });
    return response.data;
  } catch (err) {
    const message =
      err.response?.data?.message || err.message || "Login failed";
    throw new Error(message);
  }
}

export async function logout() {
  try {
    const response = await api.post("/api/v1/users/logout");
    return response.data;
  } catch (err) {
    console.error("Logout error:", err);
  }
}

export async function getMe() {
  try {
    const response = await api.get("/api/v1/users/get-me");
    return response.data;
  } catch {
    return null;
  }
}
