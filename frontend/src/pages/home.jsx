import React, { useContext, useState } from "react";
import withAuth from "../utils/withAuth";
import { useNavigate } from "react-router-dom";
import "../App.css";
import { Button, IconButton, TextField, Snackbar } from "@mui/material";
import RestoreIcon from "@mui/icons-material/Restore";
import VideoCallIcon from "@mui/icons-material/VideoCall";
import LogoutIcon from "@mui/icons-material/Logout";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import AddBoxIcon from "@mui/icons-material/AddBox";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import LoginIcon from "@mui/icons-material/Login";
import { AuthContext } from "../contexts/AuthContext";

function HomeComponent(props) {
  let navigate = useNavigate();
  const isAuth = props.isAuthenticated || Boolean(localStorage.getItem("token"));
  const [mode, setMode] = useState(0); // 0 = Create, 1 = Join
  const [meetingCode, setMeetingCode] = useState("");
  const [snackbarMsg, setSnackbarMsg] = useState("");
  const { addToUserHistory, handleLogout } = useContext(AuthContext);

  const generateRandomCode = () => {
    const randomStr = Math.random().toString(36).substring(2, 8);
    const code = `nex-${randomStr}`;
    setMeetingCode(code);
    setSnackbarMsg(`Generated Code: ${code}`);
  };

  const parseCodeFromInput = (input) => {
    let clean = input.trim();
    if (!clean) return "";
    try {
      if (clean.startsWith("http://") || clean.startsWith("https://")) {
        const urlObj = new URL(clean);
        clean = urlObj.pathname.replace(/^\//, "");
      }
    } catch {
      /* ignore invalid url parse */
    }
    return clean;
  };

  const handleStartCall = async () => {
    const code = parseCodeFromInput(meetingCode);
    if (!code) {
      setSnackbarMsg("Please enter or generate a meeting code");
      return;
    }

    try {
      await addToUserHistory(code);
    } catch {
      /* ignore history error */
    }

    navigate(`/${code}`);
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0d0d1a 0%, #12122a 100%)" }}>
      {/* Navbar */}
      <div className="navBar">
        <div style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }} onClick={() => navigate("/")}>
          <img src="/favicon.png" alt="NexMeet logo" style={{ width: "32px", height: "32px", borderRadius: "8px", objectFit: "cover" }} />
          <h2 style={{ margin: 0 }}>NexMeet</h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {isAuth ? (
            <>
              <IconButton
                onClick={() => navigate("/history")}
                style={{ color: "#8888aa" }}
                title="Meeting History"
              >
                <RestoreIcon />
              </IconButton>
              <span style={{ color: "#8888aa", fontSize: "0.85rem" }}>History</span>
              <Button
                onClick={handleLogout}
                startIcon={<LogoutIcon />}
                style={{
                  color: "#8888aa",
                  marginLeft: "12px",
                  textTransform: "none",
                  fontSize: "0.9rem",
                }}
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <span style={{
                background: "rgba(108,99,255,0.15)",
                border: "1px solid rgba(108,99,255,0.3)",
                color: "#00d4aa",
                padding: "4px 10px",
                borderRadius: "20px",
                fontSize: "0.78rem",
                fontWeight: 600,
              }}>
                👤 Guest Mode
              </span>
              <Button
                onClick={() => navigate("/auth")}
                startIcon={<LoginIcon />}
                sx={{
                  background: "linear-gradient(135deg, #6c63ff, #00d4aa)",
                  color: "white",
                  borderRadius: "8px",
                  padding: "6px 16px",
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  marginLeft: "8px",
                }}
              >
                Sign In
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="meetContainer">
        <div className="leftPanel">
          <div style={{ width: "100%" }}>
            <h2 style={{ marginBottom: "1.5rem" }}>
              {mode === 0 ? (
                <>Create a <span>New Meeting</span> Room</>
              ) : (
                <>Join an <span>Existing Meeting</span></>
              )}
            </h2>

            {/* Mode Selector Tabs */}
            <div style={{
              display: "flex", background: "rgba(255,255,255,0.05)",
              borderRadius: "12px", padding: "4px", marginBottom: "1.5rem",
              border: "1px solid rgba(108,99,255,0.2)",
            }}>
              <button
                onClick={() => { setMode(0); setMeetingCode(""); }}
                style={{
                  flex: 1, padding: "10px", border: "none", borderRadius: "10px",
                  cursor: "pointer", fontFamily: "Inter, sans-serif",
                  fontWeight: 600, fontSize: "0.9rem", transition: "all 0.2s",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                  background: mode === 0 ? "linear-gradient(135deg, #6c63ff, #00d4aa)" : "transparent",
                  color: mode === 0 ? "white" : "#8888aa",
                }}
              >
                <AddBoxIcon style={{ fontSize: "18px" }} />
                Create Room
              </button>

              <button
                onClick={() => { setMode(1); setMeetingCode(""); }}
                style={{
                  flex: 1, padding: "10px", border: "none", borderRadius: "10px",
                  cursor: "pointer", fontFamily: "Inter, sans-serif",
                  fontWeight: 600, fontSize: "0.9rem", transition: "all 0.2s",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                  background: mode === 1 ? "linear-gradient(135deg, #6c63ff, #00d4aa)" : "transparent",
                  color: mode === 1 ? "white" : "#8888aa",
                }}
              >
                <MeetingRoomIcon style={{ fontSize: "18px" }} />
                Join Room
              </button>
            </div>

            {/* Action Box */}
            <div style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(108,99,255,0.2)",
              borderRadius: "16px",
              padding: "1.5rem",
              backdropFilter: "blur(10px)",
            }}>
              {mode === 0 ? (
                /* Create Room Mode */
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <TextField
                      onChange={(e) => setMeetingCode(e.target.value)}
                      value={meetingCode}
                      label="Enter Custom Code or Generate One"
                      variant="outlined"
                      fullWidth
                      onKeyDown={(e) => e.key === "Enter" && handleStartCall()}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          color: "white",
                          borderRadius: "10px",
                          "& fieldset": { borderColor: "rgba(108,99,255,0.4)" },
                          "&:hover fieldset": { borderColor: "#6c63ff" },
                          "&.Mui-focused fieldset": { borderColor: "#6c63ff" },
                        },
                        "& .MuiInputLabel-root": { color: "#8888aa" },
                        "& .MuiInputLabel-root.Mui-focused": { color: "#6c63ff" },
                      }}
                    />
                    <Button
                      onClick={generateRandomCode}
                      variant="outlined"
                      title="Generate Instant Code"
                      startIcon={<AutoAwesomeIcon />}
                      sx={{
                        borderColor: "rgba(0,212,170,0.5)",
                        color: "#00d4aa",
                        borderRadius: "10px",
                        textTransform: "none",
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                        "&:hover": {
                          borderColor: "#00d4aa",
                          background: "rgba(0,212,170,0.1)",
                        },
                      }}
                    >
                      Random Code
                    </Button>
                  </div>

                  <Button
                    onClick={handleStartCall}
                    variant="contained"
                    startIcon={<VideoCallIcon />}
                    sx={{
                      background: "linear-gradient(135deg, #6c63ff, #00d4aa)",
                      borderRadius: "10px",
                      padding: "13px",
                      textTransform: "none",
                      fontWeight: 600,
                      fontSize: "1rem",
                      boxShadow: "0 8px 25px rgba(108,99,255,0.35)",
                      "&:hover": { opacity: 0.9 },
                    }}
                  >
                    Start & Create Room
                  </Button>

                  <p style={{ color: "#8888aa", fontSize: "0.82rem", lineHeight: "1.4", margin: 0 }}>
                    💡 Creating a room generates a shareable link that you can easily copy and send to your team.
                  </p>
                </div>
              ) : (
                /* Join Room Mode */
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <TextField
                    onChange={(e) => setMeetingCode(e.target.value)}
                    value={meetingCode}
                    label="Enter Meeting Code or Invite Link"
                    variant="outlined"
                    fullWidth
                    onKeyDown={(e) => e.key === "Enter" && handleStartCall()}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        color: "white",
                        borderRadius: "10px",
                        "& fieldset": { borderColor: "rgba(108,99,255,0.4)" },
                        "&:hover fieldset": { borderColor: "#6c63ff" },
                        "&.Mui-focused fieldset": { borderColor: "#6c63ff" },
                      },
                      "& .MuiInputLabel-root": { color: "#8888aa" },
                      "& .MuiInputLabel-root.Mui-focused": { color: "#6c63ff" },
                    }}
                  />

                  <Button
                    onClick={handleStartCall}
                    variant="contained"
                    startIcon={<MeetingRoomIcon />}
                    sx={{
                      background: "linear-gradient(135deg, #6c63ff, #00d4aa)",
                      borderRadius: "10px",
                      padding: "13px",
                      textTransform: "none",
                      fontWeight: 600,
                      fontSize: "1rem",
                      boxShadow: "0 8px 25px rgba(108,99,255,0.35)",
                      "&:hover": { opacity: 0.9 },
                    }}
                  >
                    Join Room Now
                  </Button>

                  <p style={{ color: "#8888aa", fontSize: "0.82rem", lineHeight: "1.4", margin: 0 }}>
                    🔗 Paste the code (e.g. <code>nex-8a2f1c</code>) or full URL provided by the host.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rightPanel">
          <img src="/logo3.png" alt="Video call illustration" />
        </div>
      </div>

      <Snackbar
        open={Boolean(snackbarMsg)}
        autoHideDuration={3000}
        onClose={() => setSnackbarMsg("")}
        message={snackbarMsg}
      />
    </div>
  );
}

const AuthenticatedHome = withAuth(HomeComponent);
export default AuthenticatedHome;
