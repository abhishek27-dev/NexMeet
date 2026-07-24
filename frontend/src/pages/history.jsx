import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { IconButton } from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import VideoCallIcon from "@mui/icons-material/VideoCall";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";

export default function History() {
  const { getHistoryOfUser } = useContext(AuthContext);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const routeTo = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const history = await getHistoryOfUser();
        setMeetings(history);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  let formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
    });
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0d0d1a 0%, #12122a 100%)",
      fontFamily: "Inter, sans-serif",
      color: "white",
    }}>
      {/* Navbar */}
      <div style={{
        display: "flex", alignItems: "center", gap: "12px",
        padding: "1rem 2rem",
        background: "#12122a",
        borderBottom: "1px solid rgba(108,99,255,0.2)",
      }}>
        <IconButton onClick={() => routeTo("/home")} style={{ color: "#6c63ff" }}>
          <HomeIcon />
        </IconButton>
        <h2 style={{
          fontFamily: "Space Grotesk, sans-serif", fontSize: "1.4rem",
          background: "linear-gradient(90deg, #6c63ff, #00d4aa)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
        }}>NexMeet</h2>
        <span style={{ color: "#8888aa", fontSize: "0.9rem", marginLeft: "4px" }}>/ Meeting History</span>
      </div>

      {/* Content */}
      <div style={{ padding: "2rem", maxWidth: "700px", margin: "0 auto" }}>
        <h3 style={{ fontSize: "1.4rem", fontWeight: 600, marginBottom: "1.5rem", color: "#e8e8f0" }}>
          Your Past Meetings
        </h3>

        {loading ? (
          <p style={{ color: "#8888aa", textAlign: "center", marginTop: "4rem" }}>Loading...</p>
        ) : meetings.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "4rem 2rem",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(108,99,255,0.15)",
            borderRadius: "16px",
          }}>
            <VideoCallIcon style={{ fontSize: "3rem", color: "#6c63ff", marginBottom: "1rem" }} />
            <p style={{ color: "#8888aa" }}>No meetings yet. Start your first call!</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {meetings.map((e, i) => (
              <div
                key={e._id || i}
                onClick={() => routeTo(`/${e.meetingCode}`)}
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(108,99,255,0.2)",
                  borderRadius: "12px",
                  padding: "1rem 1.4rem",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  transition: "all 0.2s",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{
                    width: "40px", height: "40px", borderRadius: "10px",
                    background: "linear-gradient(135deg, #6c63ff22, #00d4aa22)",
                    border: "1px solid rgba(108,99,255,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <VideoCallIcon style={{ color: "#6c63ff", fontSize: "20px" }} />
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: "0.95rem" }}>{e.meetingCode}</p>
                    <p style={{ color: "#8888aa", fontSize: "0.8rem" }}>Meeting Code</p>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#8888aa", fontSize: "0.85rem" }}>
                    <CalendarTodayIcon style={{ fontSize: "14px" }} />
                    {formatDate(e.date)}
                  </div>
                  <span style={{
                    color: "#00d4aa", fontSize: "0.82rem", fontWeight: 600,
                    background: "rgba(0,212,170,0.1)", padding: "4px 10px", borderRadius: "6px",
                    border: "1px solid rgba(0,212,170,0.3)",
                  }}>
                    Rejoin →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
