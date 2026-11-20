import React, { useEffect, useState } from "react";
import { getUserHistory } from "../services/meeting.api";
import { useNavigate } from "react-router-dom";
import HomeIcon from "@mui/icons-material/Home";
import VideoCallIcon from "@mui/icons-material/VideoCall";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import "./History.css";

export default function History() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const history = await getUserHistory();
        setMeetings(history);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="history-page">
      {/* Top Navbar */}
      <div className="history-nav">
        <button
          className="history-back-btn"
          onClick={() => navigate("/")}
          title="Back to Home"
        >
          <HomeIcon />
        </button>
        <h2 className="history-nav-title">NexMeet</h2>
        <span className="history-nav-sub">/ Meeting History</span>
      </div>

      {/* History Content */}
      <div className="history-content">
        <h3 className="history-heading">Your Past Meetings</h3>

        {loading ? (
          <p className="history-loading">Loading...</p>
        ) : meetings.length === 0 ? (
          <div className="history-empty-card">
            <VideoCallIcon className="history-empty-icon" />
            <p className="history-empty-text">
              No meetings yet. Start your first call!
            </p>
          </div>
        ) : (
          <div className="history-list">
            {meetings.map((e, i) => (
              <div
                key={e._id || i}
                onClick={() => navigate(`/${e.meetingCode}`)}
                className="history-card"
              >
                <div className="history-card-left">
                  <div className="history-icon-badge">
                    <VideoCallIcon style={{ fontSize: "20px" }} />
                  </div>
                  <div>
                    <p className="history-code-title">{e.meetingCode}</p>
                    <p className="history-code-sub">Meeting Code</p>
                  </div>
                </div>

                <div className="history-card-right">
                  <div className="history-date">
                    <CalendarTodayIcon style={{ fontSize: "14px" }} />
                    <span>{formatDate(e.date)}</span>
                  </div>
                  <span className="history-rejoin-btn">Rejoin →</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
