import * as React from "react";
import { AuthContext } from "../contexts/AuthContext";
import { Snackbar } from "@mui/material";
import VideoCallIcon from "@mui/icons-material/VideoCall";

export default function Authentication() {
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [formState, setFormState] = React.useState(0); // 0=login, 1=register
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const { handleRegister, handleLogin } = React.useContext(AuthContext);

  let handleAuth = async () => {
    setError("");
    if (formState === 0 && (!username.trim() || !password.trim())) {
      setError("Please fill in both username and password");
      return;
    }
    if (formState === 1 && (!name.trim() || !username.trim() || !password.trim())) {
      setError("Please fill in all fields (Full Name, Username, Password)");
      return;
    }

    setLoading(true);
    try {
      if (formState === 0) {
        await handleLogin(username.trim(), password.trim());
      } else {
        let result = await handleRegister(name.trim(), username.trim(), password.trim());
        setMessage(result || "Registration successful! Please sign in.");
        setOpen(true);
        setName("");
        setUsername("");
        setPassword("");
        setFormState(0);
      }
    } catch (err) {
      setError(typeof err === "string" ? err : (err?.response?.data?.message || err?.message || "Something went wrong"));
    } finally {
      setLoading(false);
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
    transition: "border 0.2s",
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
      }}
    >
      {/* Glow effects */}
      <div style={{
        position: "fixed", top: "-100px", right: "-100px",
        width: "500px", height: "500px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(108,99,255,0.12) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "fixed", bottom: "-50px", left: "-50px",
        width: "350px", height: "350px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(0,212,170,0.08) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{
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
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{
            width: "52px", height: "52px", borderRadius: "14px",
            background: "linear-gradient(135deg, #6c63ff, #00d4aa)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 12px",
          }}>
            <VideoCallIcon style={{ color: "white", fontSize: "28px" }} />
          </div>
          <h1 style={{
            fontFamily: "Space Grotesk, sans-serif",
            fontSize: "1.8rem", fontWeight: 700,
            background: "linear-gradient(90deg, #6c63ff, #00d4aa)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>NexMeet</h1>
          <p style={{ color: "#8888aa", fontSize: "0.9rem", marginTop: "4px" }}>
            {formState === 0 ? "Welcome back! Sign in to continue." : "Create your account to get started."}
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex", background: "rgba(255,255,255,0.05)",
          borderRadius: "10px", padding: "4px", marginBottom: "1.5rem",
        }}>
          {["Sign In", "Sign Up"].map((label, i) => (
            <button
              key={i}
              onClick={() => { setFormState(i); setError(""); }}
              style={{
                flex: 1, padding: "8px", border: "none", borderRadius: "8px",
                cursor: "pointer", fontFamily: "Inter, sans-serif",
                fontWeight: 600, fontSize: "0.9rem", transition: "all 0.2s",
                background: formState === i
                  ? "linear-gradient(135deg, #6c63ff, #00d4aa)"
                  : "transparent",
                color: formState === i ? "white" : "#8888aa",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Form */}
        <div>
          {formState === 1 && (
            <input
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle}
              onKeyDown={(e) => e.key === "Enter" && handleAuth()}
            />
          )}
          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={inputStyle}
            onKeyDown={(e) => e.key === "Enter" && handleAuth()}
          />
          <input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            onKeyDown={(e) => e.key === "Enter" && handleAuth()}
          />

          {error && (
            <p style={{
              color: "#ff6b6b", fontSize: "0.85rem",
              marginBottom: "12px", textAlign: "center",
            }}>{error}</p>
          )}

          <button
            onClick={handleAuth}
            disabled={loading}
            style={{
              width: "100%", padding: "13px",
              background: loading
                ? "rgba(108,99,255,0.5)"
                : "linear-gradient(135deg, #6c63ff, #00d4aa)",
              border: "none", borderRadius: "10px", color: "white",
              fontFamily: "Inter, sans-serif", fontWeight: 600,
              fontSize: "1rem", cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 8px 25px rgba(108,99,255,0.3)",
              transition: "opacity 0.2s, transform 0.2s",
            }}
          >
            {loading ? "Please wait..." : formState === 0 ? "Sign In" : "Create Account"}
          </button>
        </div>
      </div>

      <Snackbar
        open={open}
        autoHideDuration={3000}
        onClose={() => setOpen(false)}
        message={message}
      />
    </div>
  );
}
