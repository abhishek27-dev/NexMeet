import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import VideoCallIcon from "@mui/icons-material/VideoCall";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { handleLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Please fill in both email/username and password.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await handleLogin({
        username: username.trim(),
        email: username.trim(),
        password: password.trim(),
      });

      if (result.success) {
        navigate("/");
      } else {
        setError(result.error || "Invalid credentials. Please try again.");
      }
    } catch (err) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 16px",
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(108,99,255,0.3)",
    borderRadius: "10px",
    color: "white",
    fontSize: "0.95rem",
    outline: "none",
    fontFamily: "Inter, sans-serif",
    marginBottom: "14px",
    boxSizing: "border-box",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0d0d1a 0%, #12122a 50%, #0d1a2a 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Inter, sans-serif",
        padding: "1rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background Glows */}
      <div
        style={{
          position: "fixed",
          top: "-100px",
          right: "-100px",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(108,99,255,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "fixed",
          bottom: "-50px",
          left: "-50px",
          width: "350px",
          height: "350px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,212,170,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(108,99,255,0.2)",
          borderRadius: "20px",
          padding: "2.5rem",
          width: "100%",
          maxWidth: "420px",
          backdropFilter: "blur(20px)",
          boxShadow: "0 25px 80px rgba(0,0,0,0.5)",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #6c63ff, #00d4aa)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px",
              boxShadow: "0 8px 24px rgba(108,99,255,0.4)",
            }}
          >
            <VideoCallIcon style={{ color: "white", fontSize: "1.8rem" }} />
          </div>
          <h2 style={{ color: "white", margin: 0, fontWeight: 700, fontSize: "1.6rem" }}>
            Welcome Back
          </h2>
          <p style={{ color: "#8888aa", margin: "6px 0 0", fontSize: "0.88rem" }}>
            Sign in to start and join meetings
          </p>
        </div>

        {error && (
          <div
            style={{
              background: "rgba(255,75,75,0.12)",
              border: "1px solid rgba(255,75,75,0.3)",
              color: "#ff6b6b",
              borderRadius: "10px",
              padding: "10px 14px",
              fontSize: "0.85rem",
              marginBottom: "16px",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label style={{ display: "block", color: "#aaaab8", fontSize: "0.82rem", marginBottom: "6px" }}>
            Username or Email
          </label>
          <input
            style={inputStyle}
            type="text"
            placeholder="Enter username or email"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={submitting}
          />

          <label style={{ display: "block", color: "#aaaab8", fontSize: "0.82rem", marginBottom: "6px" }}>
            Password
          </label>
          <input
            style={inputStyle}
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
          />

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: "100%",
              padding: "13px",
              marginTop: "8px",
              background: submitting
                ? "#555"
                : "linear-gradient(135deg, #6c63ff 0%, #00d4aa 100%)",
              border: "none",
              borderRadius: "10px",
              color: "white",
              fontWeight: 600,
              fontSize: "1rem",
              cursor: submitting ? "not-allowed" : "pointer",
              boxShadow: "0 8px 24px rgba(108,99,255,0.35)",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
          >
            {submitting ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <p style={{ textAlign: "center", color: "#8888aa", fontSize: "0.85rem", marginTop: "1.5rem" }}>
          Don't have an account?{" "}
          <Link to="/register" style={{ color: "#00d4aa", textDecoration: "none", fontWeight: 600 }}>
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
