import React, { useEffect, useRef, useState, useCallback, memo, useContext } from "react";
import io from "socket.io-client";
import { Badge, IconButton, TextField, Snackbar } from "@mui/material";
import { Button } from "@mui/material";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import styles from "../styles/videoComponent.module.css";
import CallEndIcon from "@mui/icons-material/CallEnd";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import StopScreenShareIcon from "@mui/icons-material/StopScreenShare";
import ChatIcon from "@mui/icons-material/Chat";
import SendIcon from "@mui/icons-material/Send";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import server from "../environment";
import { AuthContext } from "../contexts/AuthContext";

const server_url = server;
var connections = {};
const peerConfigConnections = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
  ],
};

// ─── FIX 2: Memoized VideoTile — re-renders nahi hoga jab sirf messages change hon ───
const VideoTile = memo(({ socketId, stream }) => {
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
      <video ref={ref} autoPlay playsInline data-socket={socketId} style={{ display: hasVideo ? "block" : "none" }} />
      {!hasVideo && (
        <div style={{
          width: "100%", height: "100%", minWidth: "200px", minHeight: "150px",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          background: "linear-gradient(135deg, #12122a, #1a1a35)", color: "#8888aa",
          fontFamily: "Inter, sans-serif", borderRadius: "14px", padding: "12px",
        }}>
          <div style={{
            width: "48px", height: "48px", borderRadius: "50%",
            background: "linear-gradient(135deg, #6c63ff, #00d4aa)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "white", fontWeight: 700, fontSize: "1.1rem", marginBottom: "6px",
          }}>
            👤
          </div>
          <span style={{ fontSize: "0.8rem", color: "#e8e8f0" }}>Participant</span>
        </div>
      )}
    </div>
  );
});

// ─── FIX 2: Memoized ChatPanel — videos ko affect nahi karta ───
const ChatPanel = memo(({ messages, message, onMessageChange, onSend }) => {
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
            <p style={{ color: "#8888aa", fontSize: "0.85rem", textAlign: "center", marginTop: "1rem" }}>
              No messages yet
            </p>
          ) : (
            messages.map((item, index) => (
              <div key={index} style={{ marginBottom: "12px", marginLeft: "8px" }}>
                <p style={{ fontWeight: 600, fontSize: "0.82rem", color: "#6c63ff", marginBottom: "2px" }}>
                  {item.sender}
                </p>
                {/* FIX 1: text color explicitly white */}
                <p style={{ fontSize: "0.9rem", color: "#e8e8f0", wordBreak: "break-word" }}>
                  {item.data}
                </p>
              </div>
            ))
          )}
        </div>
        <div className={styles.chattingArea}>
          {/* FIX 1: TextField with explicit white text color */}
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

export default function VideoMeetComponent() {
  var socketRef = useRef();
  let socketIdRef = useRef();
  let localVideoref = useRef();
  const videoRef = useRef([]);

  let [videoAvailable, setVideoAvailable] = useState(true);
  let [audioAvailable, setAudioAvailable] = useState(true);
  let [video, setVideo] = useState(false);
  let [audio, setAudio] = useState();
  let [screen, setScreen] = useState();
  let [showModal, setModal] = useState(true);
  let [screenAvailable, setScreenAvailable] = useState();
  let [messages, setMessages] = useState([]);
  let [message, setMessage] = useState("");
  let [newMessages, setNewMessages] = useState(0);
  let [askForUsername, setAskForUsername] = useState(true);
  let [username, setUsername] = useState("");
  let [videos, setVideos] = useState([]);
  let [peerLeft, setPeerLeft] = useState(false);
  let [callEnded, setCallEnded] = useState(false);
  let [copyToast, setCopyToast] = useState(false);

  const { addToUserHistory } = useContext(AuthContext);
  const roomCode = window.location.pathname.replace(/^\/+|\/+$/g, "").split("?")[0];

  const handleCopyLink = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      setCopyToast(true);
    } catch {
      /* ignore copy error */
    }
  };

  useEffect(() => {
    getPermissions();

    if (roomCode && addToUserHistory) {
      addToUserHistory(roomCode).catch(() => {});
    }

    return () => {
      try {
        let tracks = window.localStream?.getTracks();
        tracks?.forEach((t) => t.stop());
      } catch { /* ignore */ }
      try {
        let tracks = localVideoref.current?.srcObject?.getTracks();
        tracks?.forEach((t) => t.stop());
      } catch { /* ignore */ }
      for (let id in connections) {
        try { connections[id].close(); delete connections[id]; } catch { /* ignore */ }
      }
      if (socketRef.current) {
        try { socketRef.current.emit("leave-call"); } catch { /* ignore */ }
        socketRef.current.disconnect();
      }
    };
  }, []);

  const getPermissions = async () => {
    try {
      const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true });
      setVideoAvailable(!!videoPermission);
      // BUG FIX: stop the temporary permission-check stream so camera light doesn't stay on
      videoPermission.getTracks().forEach((track) => track.stop());

      const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioAvailable(!!audioPermission);
      // BUG FIX: stop the temporary permission-check stream
      audioPermission.getTracks().forEach((track) => track.stop());

      setScreenAvailable(!!navigator.mediaDevices.getDisplayMedia);

      const userMediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      if (userMediaStream) {
        window.localStream = userMediaStream;
        if (localVideoref.current) {
          localVideoref.current.srcObject = userMediaStream;
        }
      }
    } catch {
      // Camera/mic permission denied or unavailable — app still works without them
    }
  };

  useEffect(() => {
    if (video !== undefined && audio !== undefined) {
      getUserMedia();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video, audio]);

  let getMedia = () => {
    setVideo(videoAvailable);
    setAudio(audioAvailable);
    connectToSocketServer();
  };

  let getUserMediaSuccess = (stream) => {
    try {
      window.localStream.getTracks().forEach((track) => track.stop());
    } catch { /* ignore */ }

    window.localStream = stream;
    localVideoref.current.srcObject = stream;

    for (let id in connections) {
      if (id === socketIdRef.current) continue;
      connections[id].addStream(window.localStream);
      connections[id].createOffer().then((description) => {
        connections[id].setLocalDescription(description).then(() => {
          socketRef.current.emit("signal", id, JSON.stringify({ sdp: connections[id].localDescription }));
        }).catch((e) => console.log(e));
      });
    }

    stream.getTracks().forEach((track) => {
      track.onended = () => {
        setVideo(false);
        setAudio(false);
        try {
          let tracks = localVideoref.current.srcObject.getTracks();
          tracks.forEach((t) => t.stop());
        } catch { /* ignore */ }

        let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
        window.localStream = blackSilence();
        localVideoref.current.srcObject = window.localStream;

        for (let id in connections) {
          connections[id].addStream(window.localStream);
          connections[id].createOffer().then((description) => {
            connections[id].setLocalDescription(description).then(() => {
              socketRef.current.emit("signal", id, JSON.stringify({ sdp: connections[id].localDescription }));
            }).catch((e) => console.log(e));
          });
        }
      };
    });
  };

  let getUserMedia = () => {
    if ((video && videoAvailable) || (audio && audioAvailable)) {
      navigator.mediaDevices
        .getUserMedia({ video: video, audio: audio })
        .then(getUserMediaSuccess)
        .catch((e) => console.log(e));
    } else {
      try {
        let tracks = localVideoref.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      } catch { /* ignore */ }
    }
  };

  let getDislayMedia = () => {
    if (screen) {
      if (navigator.mediaDevices.getDisplayMedia) {
        navigator.mediaDevices
          .getDisplayMedia({ video: true, audio: true })
          .then(getDislayMediaSuccess)
          .catch((e) => console.log(e));
      }
    } else {
      // BUG FIX: when user turns OFF screen share, restore camera/mic feed
      getUserMedia();
    }
  };

  let getDislayMediaSuccess = (stream) => {
    try {
      window.localStream.getTracks().forEach((track) => track.stop());
    } catch { /* ignore */ }

    window.localStream = stream;
    localVideoref.current.srcObject = stream;

    for (let id in connections) {
      if (id === socketIdRef.current) continue;
      connections[id].addStream(window.localStream);
      connections[id].createOffer().then((description) => {
        connections[id].setLocalDescription(description).then(() => {
          socketRef.current.emit("signal", id, JSON.stringify({ sdp: connections[id].localDescription }));
        }).catch((e) => console.log(e));
      });
    }

    stream.getTracks().forEach((track) => {
      track.onended = () => {
        setScreen(false);
        try {
          let tracks = localVideoref.current.srcObject.getTracks();
          tracks.forEach((t) => t.stop());
        } catch { /* ignore */ }
        let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
        window.localStream = blackSilence();
        localVideoref.current.srcObject = window.localStream;
        getUserMedia();
      };
    });
  };

  let gotMessageFromServer = (fromId, message) => {
    var signal = JSON.parse(message);
    if (fromId !== socketIdRef.current) {
      if (signal.sdp) {
        connections[fromId]
          .setRemoteDescription(new RTCSessionDescription(signal.sdp))
          .then(() => {
            if (signal.sdp.type === "offer") {
              connections[fromId].createAnswer().then((description) => {
                connections[fromId].setLocalDescription(description).then(() => {
                  socketRef.current.emit("signal", fromId, JSON.stringify({ sdp: connections[fromId].localDescription }));
                }).catch((e) => console.log(e));
              }).catch((e) => console.log(e));
            }
          }).catch((e) => console.log(e));
      }
      if (signal.ice) {
        connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch((e) => console.log(e));
      }
    }
  };

  let connectToSocketServer = () => {
    socketRef.current = io.connect(server_url, { secure: false });
    socketRef.current.on("signal", gotMessageFromServer);

    socketRef.current.on("connect", () => {
      socketRef.current.emit("join-call", window.location.href);
      socketIdRef.current = socketRef.current.id;

      socketRef.current.on("chat-message", addMessage);

      socketRef.current.on("user-left", (id) => {
        // Close the peer connection
        if (connections[id]) {
          connections[id].close();
          delete connections[id];
        }

        // Remove their video tile
        const updated = videoRef.current.filter((v) => v.socketId !== id);
        videoRef.current = updated;
        setVideos(updated);

        if (updated.length === 0) {
          // KEY FIX: no other participants left -> end MY call automatically too
          setCallEnded(true);
          setTimeout(() => {
            try {
              let tracks = localVideoref.current?.srcObject?.getTracks();
              tracks?.forEach((track) => track.stop());
            } catch { /* ignore */ }
            if (socketRef.current) socketRef.current.disconnect();
            window.location.href = "/home";
          }, 2500);
        } else {
          // Others still in the call -> just show a banner
          setPeerLeft(true);
          setTimeout(() => setPeerLeft(false), 4000);
        }
      });

      socketRef.current.on("user-joined", (id, clients) => {
        clients.forEach((socketListId) => {
          if (socketListId === socketIdRef.current) return;

          if (!connections[socketListId]) {
            connections[socketListId] = new RTCPeerConnection(peerConfigConnections);

            connections[socketListId].onicecandidate = (event) => {
              if (event.candidate != null) {
                socketRef.current.emit("signal", socketListId, JSON.stringify({ ice: event.candidate }));
              }
            };

            connections[socketListId].onconnectionstatechange = () => {
              const state = connections[socketListId]?.connectionState;

              if (state === "failed") {
                if (connections[socketListId]) {
                  try { connections[socketListId].close(); } catch { /* ignore */ }
                  delete connections[socketListId];
                }
                const updated = videoRef.current.filter((v) => v.socketId !== socketListId);
                videoRef.current = updated;
                setVideos(updated);
              } else if (state === "disconnected") {
                setTimeout(() => {
                  const conn = connections[socketListId];
                  if (conn && conn.connectionState === "disconnected") {
                    try { conn.close(); } catch { /* ignore */ }
                    delete connections[socketListId];
                    const updated = videoRef.current.filter((v) => v.socketId !== socketListId);
                    videoRef.current = updated;
                    setVideos(updated);
                  }
                }, 5000);
              }
            };

            connections[socketListId].onaddstream = (event) => {
              let videoExists = videoRef.current.find((v) => v.socketId === socketListId);
              if (videoExists) {
                setVideos((prev) => {
                  const updated = prev.map((v) =>
                    v.socketId === socketListId ? { ...v, stream: event.stream } : v
                  );
                  videoRef.current = updated;
                  return updated;
                });
              } else {
                let newVideo = {
                  socketId: socketListId,
                  stream: event.stream,
                  autoplay: true,
                  playsinline: true,
                };
                setVideos((prev) => {
                  const updated = [...prev, newVideo];
                  videoRef.current = updated;
                  return updated;
                });
              }
            };

            if (window.localStream !== undefined && window.localStream !== null) {
              try { connections[socketListId].addStream(window.localStream); } catch { /* ignore */ }
            } else {
              let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
              window.localStream = blackSilence();
              try { connections[socketListId].addStream(window.localStream); } catch { /* ignore */ }
            }
          }
        });

        if (id === socketIdRef.current) {
          for (let id2 in connections) {
            if (id2 === socketIdRef.current) continue;
            try { connections[id2].addStream(window.localStream); } catch { /* ignore */ }
            connections[id2].createOffer().then((description) => {
              connections[id2].setLocalDescription(description).then(() => {
                socketRef.current.emit("signal", id2, JSON.stringify({ sdp: connections[id2].localDescription }));
              }).catch((e) => console.log(e));
            });
          }
        }
      });
    });
  };

  let silence = () => {
    let ctx = new AudioContext();
    let oscillator = ctx.createOscillator();
    let dst = oscillator.connect(ctx.createMediaStreamDestination());
    oscillator.start();
    ctx.resume();
    return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
  };

  let black = ({ width = 640, height = 480 } = {}) => {
    let canvas = Object.assign(document.createElement("canvas"), { width, height });
    canvas.getContext("2d").fillRect(0, 0, width, height);
    let stream = canvas.captureStream();
    return Object.assign(stream.getVideoTracks()[0], { enabled: false });
  };

  let handleVideo = () => setVideo(!video);
  let handleAudio = () => setAudio(!audio);

  useEffect(() => {
    if (screen !== undefined) getDislayMedia();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  let handleScreen = () => setScreen(!screen);

  // ─── FIX 3: handleEndCall — proper full cleanup before leaving ───
  let handleEndCall = () => {
    try {
      let tracks = localVideoref.current?.srcObject?.getTracks();
      tracks?.forEach((track) => track.stop());
    } catch { /* ignore */ }

    for (let id in connections) {
      try { connections[id].close(); delete connections[id]; } catch { /* ignore */ }
    }

    // KEY FIX: emit leave-call first so server notifies others IMMEDIATELY
    // then wait 300ms before disconnecting so the event reaches server
    if (socketRef.current) {
      socketRef.current.emit("leave-call");
      setTimeout(() => {
        socketRef.current.disconnect();
        window.location.href = "/home";
      }, 300);
    } else {
      window.location.href = "/home";
    }
  };

  // FIX 2: useCallback so ChatPanel doesn't re-render on video state change
  const handleMessage = useCallback((e) => {
    setMessage(e.target.value);
  }, []);

  const addMessage = useCallback((data, sender, socketIdSender) => {
    if (!data?.trim()) return;
    setMessages((prev) => [...prev, { sender, data: data.trim() }]);
    if (socketIdSender !== socketIdRef.current) {
      setNewMessages((prev) => prev + 1);
    }
  }, []);

  const sendMessage = useCallback(() => {
    if (!message.trim()) return;
    socketRef.current.emit("chat-message", message.trim(), username);
    setMessage("");
  }, [message, username]);

  let connect = () => {
    if (!username || !username.trim()) return;
    setAskForUsername(false);
    getMedia();
  };

  return (
    <div>
      {askForUsername ? (
        <div style={{
          padding: "40px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "20px",
          minHeight: "100vh",
          background: "linear-gradient(135deg, #0d0d1a 0%, #12122a 100%)",
          justifyContent: "center",
        }}>
          <h2 style={{
            fontFamily: "Space Grotesk, sans-serif",
            fontSize: "2rem", fontWeight: 700,
            background: "linear-gradient(90deg, #6c63ff, #00d4aa)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>
            Enter Lobby — NexMeet
          </h2>

          <TextField
            label="Your Name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && connect()}
            variant="outlined"
            sx={{
              width: "280px",
              "& .MuiOutlinedInput-root": {
                color: "#ffffff",
                borderRadius: "10px",
                "& fieldset": { borderColor: "rgba(108,99,255,0.4)" },
                "&:hover fieldset": { borderColor: "#6c63ff" },
                "&.Mui-focused fieldset": { borderColor: "#6c63ff" },
              },
              "& .MuiInputLabel-root": { color: "#8888aa" },
              "& .MuiInputLabel-root.Mui-focused": { color: "#6c63ff" },
              "& .MuiInputBase-input": { color: "#ffffff" },
            }}
          />

          <Button
            variant="contained"
            onClick={connect}
            sx={{
              background: "linear-gradient(135deg, #6c63ff, #00d4aa)",
              borderRadius: "10px",
              padding: "10px 32px",
              textTransform: "none",
              fontWeight: 600,
              fontSize: "1rem",
              boxShadow: "0 8px 25px rgba(108,99,255,0.35)",
            }}
          >
            Join Call
          </Button>

          <video
            style={{
              borderRadius: "14px",
              border: "2px solid rgba(108,99,255,0.4)",
              maxWidth: "400px",
              width: "100%",
              marginTop: "8px",
            }}
            ref={localVideoref}
            autoPlay
            muted
          />
        </div>
      ) : (
        <div className={styles.meetVideoContainer}>
          {/* Top Info Bar with Shareable Meeting Code & Copy Link */}
          <div style={{
            position: "absolute",
            top: "16px",
            left: "16px",
            zIndex: 40,
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "rgba(18, 18, 42, 0.75)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(108, 99, 255, 0.3)",
            borderRadius: "12px",
            padding: "6px 14px",
            color: "white",
            fontFamily: "Inter, sans-serif",
          }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "0.72rem", color: "#8888aa" }}>Meeting Code</span>
              <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#00d4aa" }}>{roomCode}</span>
            </div>

            <Button
              onClick={handleCopyLink}
              size="small"
              startIcon={<ContentCopyIcon style={{ fontSize: "15px" }} />}
              sx={{
                background: "rgba(108, 99, 255, 0.25)",
                color: "white",
                borderRadius: "8px",
                textTransform: "none",
                fontSize: "0.78rem",
                fontWeight: 600,
                border: "1px solid rgba(108,99,255,0.4)",
                "&:hover": { background: "linear-gradient(135deg, #6c63ff, #00d4aa)" },
              }}
            >
              Copy Link
            </Button>
          </div>

          {/* KEY FIX: Call Ended overlay — auto-redirect when alone */}
          {callEnded && (
            <div style={{
              position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
              background: "rgba(13,13,26,0.97)",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              gap: "14px", zIndex: 200, fontFamily: "Inter, sans-serif",
              color: "white", textAlign: "center",
            }}>
              <h2 style={{
                fontFamily: "Space Grotesk, sans-serif", fontSize: "1.9rem", fontWeight: 700,
                background: "linear-gradient(90deg, #6c63ff, #00d4aa)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              }}>
                Call Ended
              </h2>
              <p style={{ color: "#8888aa", fontSize: "0.95rem" }}>
                The other participant has left the meeting.
              </p>
              <p style={{ color: "#666688", fontSize: "0.8rem" }}>
                Redirecting to home...
              </p>
              <Button
                variant="contained"
                onClick={() => { window.location.href = "/home"; }}
                sx={{
                  background: "linear-gradient(135deg, #6c63ff, #00d4aa)",
                  borderRadius: "10px", padding: "8px 28px",
                  textTransform: "none", fontWeight: 600, marginTop: "8px",
                }}
              >
                Go to Home Now
              </Button>
            </div>
          )}

          {/* FIX 2: ChatPanel is memoized — video tiles won't flicker */}
          {showModal && (
            <ChatPanel
              messages={messages}
              message={message}
              onMessageChange={handleMessage}
              onSend={sendMessage}
            />
          )}

          {/* Control Buttons */}
          <div className={styles.buttonContainers}>
            <IconButton
              onClick={handleVideo}
              sx={{
                background: video ? "rgba(108,99,255,0.2)" : "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "50%", width: 52, height: 52,
                color: video ? "#6c63ff" : "white",
              }}
            >
              {video ? <VideocamIcon /> : <VideocamOffIcon />}
            </IconButton>

            <IconButton
              onClick={handleEndCall}
              sx={{
                background: "#ff4444",
                borderRadius: "50%", width: 56, height: 56,
                color: "white",
                "&:hover": { background: "#cc0000" },
              }}
            >
              <CallEndIcon />
            </IconButton>

            <IconButton
              onClick={handleAudio}
              sx={{
                background: audio ? "rgba(108,99,255,0.2)" : "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "50%", width: 52, height: 52,
                color: audio ? "#6c63ff" : "white",
              }}
            >
              {audio ? <MicIcon /> : <MicOffIcon />}
            </IconButton>

            {screenAvailable && (
              <IconButton
                onClick={handleScreen}
                sx={{
                  background: screen ? "rgba(0,212,170,0.2)" : "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "50%", width: 52, height: 52,
                  color: screen ? "#00d4aa" : "white",
                }}
              >
                {screen ? <ScreenShareIcon /> : <StopScreenShareIcon />}
              </IconButton>
            )}

            <Badge badgeContent={newMessages} color="error" max={99}>
              <IconButton
                onClick={() => { setModal(!showModal); setNewMessages(0); }}
                sx={{
                  background: showModal ? "rgba(108,99,255,0.2)" : "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "50%", width: 52, height: 52,
                  color: showModal ? "#6c63ff" : "white",
                }}
              >
                <ChatIcon />
              </IconButton>
            </Badge>
          </div>

          {/* Peer Left Banner */}
          {peerLeft && (
            <div style={{
              position: "absolute",
              top: "20px",
              left: "50%",
              transform: "translateX(-50%)",
              background: "rgba(255, 68, 68, 0.9)",
              color: "white",
              padding: "10px 24px",
              borderRadius: "10px",
              fontFamily: "Inter, sans-serif",
              fontWeight: 600,
              fontSize: "0.95rem",
              zIndex: 50,
              boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
              animation: "fadeIn 0.3s ease",
            }}>
              👤 A participant has left the call
            </div>
          )}

          {/* Local Video (PiP) */}
          <video className={styles.meetUserVideo} ref={localVideoref} autoPlay muted />

          {/* FIX 2: Each VideoTile is memoized — won't re-render on chat state change */}
          <div className={`${styles.conferenceView}`}>
            {videos.map((v) => (
              <VideoTile key={v.socketId} socketId={v.socketId} stream={v.stream} />
            ))}
          </div>
        </div>
      )}

      <Snackbar
        open={copyToast}
        autoHideDuration={3000}
        onClose={() => setCopyToast(false)}
        message="🔗 Invite link copied to clipboard! Share it with others to join."
      />
    </div>
  );
}
