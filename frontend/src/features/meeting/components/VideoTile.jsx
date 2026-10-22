import React, { useEffect, useRef, useState, memo } from "react";
import styles from "../../../styles/videoComponent.module.css";

export const VideoTile = memo(({ socketId, stream }) => {
  const ref = useRef();
  const [hasVideo, setHasVideo] = useState(true);

  useEffect(() => {
    if (ref.current && stream) {
      ref.current.srcObject = stream;
      const vTracks = stream.getVideoTracks();
      if (vTracks.length === 0 || !vTracks[0].enabled) {
        setHasVideo(false);
      } else {
        setHasVideo(true);
      }
    }
  }, [stream]);

  return (
    <div className={styles.videoTile} style={{ position: "relative" }}>
      <video
        ref={ref}
        autoPlay
        playsInline
        data-socket={socketId}
        style={{ display: hasVideo ? "block" : "none" }}
      />
      {!hasVideo && (
        <div
          style={{
            width: "100%",
            height: "100%",
            minWidth: "200px",
            minHeight: "150px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #12122a, #1a1a35)",
            color: "#8888aa",
            fontFamily: "Inter, sans-serif",
            borderRadius: "14px",
            padding: "12px",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #6c63ff, #00d4aa)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: 700,
              fontSize: "1.1rem",
              marginBottom: "6px",
            }}
          >
            👤
          </div>
          <span style={{ fontSize: "0.8rem", color: "#e8e8f0" }}>
            Participant
          </span>
        </div>
      )}
    </div>
  );
});

export default VideoTile;
