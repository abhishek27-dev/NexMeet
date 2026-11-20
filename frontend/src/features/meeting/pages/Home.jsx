import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/hooks/useAuth";
import { addToHistory } from "../services/meeting.api";
import { Snackbar } from "@mui/material";
import RestoreIcon from "@mui/icons-material/Restore";
import VideoCallIcon from "@mui/icons-material/VideoCall";
import LogoutIcon from "@mui/icons-material/Logout";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import AddBoxIcon from "@mui/icons-material/AddBox";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import "./Home.css";

export default function Home() {
  const navigate = useNavigate();
  const { user, handleLogout } = useAuth();
  const [mode, setMode] = useState(0); // 0 = Create, 1 = Join
  const [meetingCode, setMeetingCode] = useState("");
  const [snackbarMsg, setSnackbarMsg] = useState("");

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
      await addToHistory(code);
    } catch {
      /* ignore history error */
    }

    navigate(`/${code}`);
  };

  return (
    <div className="home-page">
      {/* Top Navbar */}
      <div className="home-nav">
        <div className="home-nav-brand">
          <img
            src="/favicon.png"
            alt="NexMeet logo"
            className="home-nav-logo"
          />
          <h2 className="home-nav-title">NexMeet</h2>
        </div>

        <div className="home-nav-actions">
          {user?.username && (
            <span className="home-user-pill">👋 {user.username}</span>
          )}

          <button
            onClick={() => navigate("/history")}
            className="home-history-link"
            title="Meeting History"
          >
            <RestoreIcon style={{ fontSize: "20px" }} />
            <span>History</span>
          </button>

          <button onClick={handleLogout} className="home-logout-btn">
            <LogoutIcon style={{ fontSize: "18px" }} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Body Section */}
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
            <div className="home-mode-tabs">
              <button
                type="button"
                className={`home-tab-btn ${mode === 0 ? "active" : ""}`}
                onClick={() => { setMode(0); setMeetingCode(""); }}
              >
                <AddBoxIcon style={{ fontSize: "18px" }} />
                Create Room
              </button>

              <button
                type="button"
                className={`home-tab-btn ${mode === 1 ? "active" : ""}`}
                onClick={() => { setMode(1); setMeetingCode(""); }}
              >
                <MeetingRoomIcon style={{ fontSize: "18px" }} />
                Join Room
              </button>
            </div>

            {/* Mode Action Card */}
            <div className="home-action-card">
              {mode === 0 ? (
                /* Create Room Mode */
                <div className="home-form-body">
                  <div className="home-input-row">
                    <input
                      type="text"
                      className="home-text-input"
                      placeholder="Enter custom code or generate one"
                      value={meetingCode}
                      onChange={(e) => setMeetingCode(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleStartCall()}
                    />
                    <button
                      type="button"
                      className="home-random-code-btn"
                      onClick={generateRandomCode}
                      title="Generate Instant Code"
                    >
                      <AutoAwesomeIcon style={{ fontSize: "18px" }} />
                      Random Code
                    </button>
                  </div>

                  <button
                    type="button"
                    className="home-primary-btn"
                    onClick={handleStartCall}
                  >
                    <VideoCallIcon />
                    Start & Create Room
                  </button>

                  <p className="home-tip">
                    💡 Creating a room generates a shareable link that you can easily copy and send to your team.
                  </p>
                </div>
              ) : (
                /* Join Room Mode */
                <div className="home-form-body">
                  <input
                    type="text"
                    className="home-text-input"
                    placeholder="Enter Meeting Code or Invite Link"
                    value={meetingCode}
                    onChange={(e) => setMeetingCode(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleStartCall()}
                  />

                  <button
                    type="button"
                    className="home-primary-btn"
                    onClick={handleStartCall}
                  >
                    <MeetingRoomIcon />
                    Join Room Now
                  </button>

                  <p className="home-tip">
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
