import { useContext, useEffect } from "react";
import { AuthContext } from "../auth.context";
import { login, register, logout, getMe } from "../services/auth.api";

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  const { user, setUser, loading, setLoading } = context;

  const handleLogin = async ({ username, email, password }) => {
    setLoading(true);
    try {
      const data = await login({ username, email, password });
      if (data?.token) {
        localStorage.setItem("token", data.token);
      }
      if (data?.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);
      }
      return { success: true, user: data.user, message: data.message };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async ({ username, email, password }) => {
    setLoading(true);
    try {
      const data = await register({ username, email, password });
      if (data?.token) {
        localStorage.setItem("token", data.token);
      }
      if (data?.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);
      }
      return { success: true, user: data.user, message: data.message };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkUserSession = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const data = await getMe();
        if (data?.user) {
          setUser(data.user);
          localStorage.setItem("user", JSON.stringify(data.user));
        } else {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkUserSession();
  }, [setUser, setLoading]);

  return {
    user,
    loading,
    isAuthenticated: Boolean(user || localStorage.getItem("token")),
    handleLogin,
    handleRegister,
    handleLogout,
  };
};

export default useAuth;
