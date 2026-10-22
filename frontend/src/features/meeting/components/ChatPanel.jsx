import React, { useEffect, useRef, memo } from "react";
import { TextField, IconButton } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import styles from "../../../styles/videoComponent.module.css";

export const ChatPanel = memo(({ messages, message, onMessageChange, onSend }) => {
  const displayRef = useRef();

  useEffect(() => {
    if (displayRef.current) {
      displayRef.current.scrollTop = displayRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className={styles.chatRoom}>
      <div className={styles.chatContainer}>
        <h1>Chat</h1>
        <div className={styles.chattingDisplay} ref={displayRef}>
          {messages.length === 0 ? (
            <p
              style={{
                color: "#8888aa",
                fontSize: "0.85rem",
                textAlign: "center",
                marginTop: "1rem",
              }}
            >
              No messages yet
            </p>
          ) : (
            messages.map((item, index) => (
              <div key={index} style={{ marginBottom: "12px", marginLeft: "8px" }}>
                <p
                  style={{
                    fontWeight: 600,
                    fontSize: "0.82rem",
                    color: "#6c63ff",
                    marginBottom: "2px",
                  }}
                >
                  {item.sender}
                </p>
                <p
                  style={{
                    fontSize: "0.9rem",
                    color: "#e8e8f0",
                    wordBreak: "break-word",
                  }}
                >
                  {item.data}
                </p>
              </div>
            ))
          )}
        </div>
        <div className={styles.chattingArea}>
          <TextField
            value={message}
            onChange={onMessageChange}
            onKeyDown={(e) => e.key === "Enter" && onSend()}
            label="Type a message"
            variant="outlined"
            size="small"
            fullWidth
            sx={{
              "& .MuiOutlinedInput-root": {
                color: "#ffffff",
                borderRadius: "8px",
                "& fieldset": { borderColor: "rgba(108,99,255,0.4)" },
                "&:hover fieldset": { borderColor: "#6c63ff" },
                "&.Mui-focused fieldset": { borderColor: "#6c63ff" },
              },
              "& .MuiInputLabel-root": { color: "#8888aa" },
              "& .MuiInputLabel-root.Mui-focused": { color: "#6c63ff" },
              "& .MuiInputBase-input": { color: "#ffffff" },
            }}
          />
          <IconButton
            onClick={onSend}
            sx={{
              background: "linear-gradient(135deg, #6c63ff, #00d4aa)",
              color: "white",
              borderRadius: "8px",
              padding: "8px",
              "&:hover": { opacity: 0.85 },
            }}
          >
            <SendIcon fontSize="small" />
          </IconButton>
        </div>
      </div>
    </div>
  );
});

export default ChatPanel;
