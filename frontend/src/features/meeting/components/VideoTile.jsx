import React, { useEffect, useRef, useState, memo } from "react";
import "../pages/VideoMeet.css";

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
    <div className="video-tile">
      <video
        ref={ref}
        autoPlay
        playsInline
        data-socket={socketId}
        style={{ display: hasVideo ? "block" : "none" }}
      />
      {!hasVideo && (
        <div className="video-tile-placeholder">
          <div className="video-tile-avatar">👤</div>
          <span className="video-tile-label">Participant</span>
        </div>
      )}
    </div>
  );
});

export default VideoTile;
