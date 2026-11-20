import React, { useEffect, useRef, memo } from "react";
import SendIcon from "@mui/icons-material/Send";
import "../pages/VideoMeet.css";

export const ChatPanel = memo(({ messages, message, onMessageChange, onSend }) => {
  const displayRef = useRef();

  useEffect(() => {
    if (displayRef.current) {
      displayRef.current.scrollTop = displayRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="chat-room">
      <div className="chat-container">
        <h1 className="chat-header">Chat</h1>

        <div className="chat-display" ref={displayRef}>
          {messages.length === 0 ? (
            <p className="chat-empty-msg">No messages yet</p>
          ) : (
            messages.map((item, index) => (
              <div key={index} className="chat-message-row">
                <p className="chat-sender">{item.sender}</p>
                <p className="chat-msg-text">{item.data}</p>
              </div>
            ))
          )}
        </div>

        <div className="chat-input-area">
          <input
            type="text"
            className="chat-text-input"
            value={message}
            onChange={onMessageChange}
            onKeyDown={(e) => e.key === "Enter" && onSend()}
            placeholder="Type a message..."
          />
          <button
            type="button"
            className="chat-send-btn"
            onClick={onSend}
            title="Send Message"
          >
            <SendIcon style={{ fontSize: "20px" }} />
          </button>
        </div>
      </div>
    </div>
  );
});

export default ChatPanel;
