import React, { useEffect, useRef, useState, useCallback } from "react";
import io from "socket.io-client";
import { Badge, IconButton, TextField, Snackbar, Button } from "@mui/material";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import CallEndIcon from "@mui/icons-material/CallEnd";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import StopScreenShareIcon from "@mui/icons-material/StopScreenShare";
import ChatIcon from "@mui/icons-material/Chat";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

import styles from "../../../styles/videoComponent.module.css";
import { API_BASE_URL } from "../../../services/api.client";
import { addToHistory } from "../services/meeting.api";
import { VideoTile } from "../components/VideoTile";
import { ChatPanel } from "../components/ChatPanel";

const server_url = API_BASE_URL;
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

export default function VideoMeet() {
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
  let [copyToast, setCopyToast] = useState(false);

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
    for (let id in connections) {
      try {
        connections[id].close();
        delete connections[id];
      } catch {
        /* ignore */
      }
    }

    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        if (parsed?.username) {
          setUsername(parsed.username);
        }
      }
    } catch {
      /* ignore storage parse */
    }

    getPermissions();

    if (roomCode) {
      addToHistory(roomCode).catch(() => {});
    }

    const currentVideoEl = localVideoref.current;

    return () => {
      try {
        let tracks = window.localStream?.getTracks();
        tracks?.forEach((t) => t.stop());
      } catch {
        /* ignore */
      }
      try {
        let tracks = currentVideoEl?.srcObject?.getTracks();
        tracks?.forEach((t) => t.stop());
      } catch {
        /* ignore */
      }
      for (let id in connections) {
        try {
          connections[id].close();
          delete connections[id];
        } catch {
          /* ignore */
        }
      }
      if (socketRef.current) {
        try {
          socketRef.current.emit("leave-call");
        } catch {
          /* ignore */
        }
        socketRef.current.disconnect();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getPermissions = async () => {
    let hasVideo = false;
    let hasAudio = false;

    try {
      const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true });
      hasVideo = !!videoPermission;
      videoPermission.getTracks().forEach((track) => track.stop());
    } catch {
      hasVideo = false;
    }

    try {
      const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true });
      hasAudio = !!audioPermission;
      audioPermission.getTracks().forEach((track) => track.stop());
    } catch {
      hasAudio = false;
    }

    setVideoAvailable(hasVideo);
    setAudioAvailable(hasAudio);
    setScreenAvailable(Boolean(navigator.mediaDevices?.getDisplayMedia));

    if (hasVideo || hasAudio) {
      try {
        const userMediaStream = await navigator.mediaDevices.getUserMedia({
          video: hasVideo,
          audio: hasAudio,
        });
        if (userMediaStream) {
          window.localStream = userMediaStream;
          if (localVideoref.current) {
            localVideoref.current.srcObject = userMediaStream;
          }
        }
      } catch (err) {
        console.warn("Could not acquire media stream:", err);
      }
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
    } catch {
      /* ignore */
    }

    window.localStream = stream;
    localVideoref.current.srcObject = stream;

    for (let id in connections) {
      if (id === socketIdRef.current) continue;
      connections[id].addStream(window.localStream);
      connections[id].createOffer().then((description) => {
        connections[id].setLocalDescription(description).then(() => {
          socketRef.current.emit(
            "signal",
            id,
            JSON.stringify({ sdp: connections[id].localDescription })
          );
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
        } catch {
          /* ignore */
        }

        let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
        window.localStream = blackSilence();
        localVideoref.current.srcObject = window.localStream;

        for (let id in connections) {
          connections[id].addStream(window.localStream);
          connections[id].createOffer().then((description) => {
            connections[id].setLocalDescription(description).then(() => {
              socketRef.current.emit(
                "signal",
                id,
                JSON.stringify({ sdp: connections[id].localDescription })
              );
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
      } catch {
        /* ignore */
      }
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
      getUserMedia();
    }
  };

  let getDislayMediaSuccess = (stream) => {
    try {
      window.localStream.getTracks().forEach((track) => track.stop());
    } catch {
      /* ignore */
    }

    window.localStream = stream;
    localVideoref.current.srcObject = stream;

    for (let id in connections) {
      if (id === socketIdRef.current) continue;
      connections[id].addStream(window.localStream);
      connections[id].createOffer().then((description) => {
        connections[id].setLocalDescription(description).then(() => {
          socketRef.current.emit(
            "signal",
            id,
            JSON.stringify({ sdp: connections[id].localDescription })
          );
        }).catch((e) => console.log(e));
      });
    }

    stream.getTracks().forEach((track) => {
      track.onended = () => {
        setScreen(false);
        try {
          let tracks = localVideoref.current.srcObject.getTracks();
          tracks.forEach((t) => t.stop());
        } catch {
          /* ignore */
        }
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
                  socketRef.current.emit(
                    "signal",
                    fromId,
                    JSON.stringify({ sdp: connections[fromId].localDescription })
                  );
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
      socketRef.current.emit("join-call", roomCode);
      socketIdRef.current = socketRef.current.id;

      socketRef.current.on("chat-message", addMessage);

      socketRef.current.on("user-left", (id) => {
        if (connections[id]) {
          try {
            connections[id].close();
          } catch {
            /* ignore */
          }
          delete connections[id];
        }

        const updated = videoRef.current.filter((v) => v.socketId !== id);
        videoRef.current = updated;
        setVideos(updated);

        setPeerLeft(true);
        setTimeout(() => setPeerLeft(false), 5000);
      });

      socketRef.current.on("user-joined", (id, clients) => {
        clients.forEach((socketListId) => {
          if (socketListId === socketIdRef.current) return;

          if (!connections[socketListId]) {
            connections[socketListId] = new RTCPeerConnection(peerConfigConnections);

            connections[socketListId].onicecandidate = (event) => {
              if (event.candidate != null) {
                socketRef.current.emit(
                  "signal",
                  socketListId,
                  JSON.stringify({ ice: event.candidate })
                );
              }
            };

            connections[socketListId].onconnectionstatechange = () => {
              const state = connections[socketListId]?.connectionState;

              if (state === "failed") {
                if (connections[socketListId]) {
                  try {
                    connections[socketListId].close();
                  } catch {
                    /* ignore */
                  }
                  delete connections[socketListId];
                }
                const updated = videoRef.current.filter((v) => v.socketId !== socketListId);
                videoRef.current = updated;
                setVideos(updated);
              } else if (state === "disconnected") {
                setTimeout(() => {
                  const conn = connections[socketListId];
                  if (conn && conn.connectionState === "disconnected") {
                    try {
                      conn.close();
                    } catch {
                      /* ignore */
                    }
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
              try {
                connections[socketListId].addStream(window.localStream);
              } catch {
                /* ignore */
              }
            } else {
              let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
              window.localStream = blackSilence();
              try {
                connections[socketListId].addStream(window.localStream);
              } catch {
                /* ignore */
              }
            }
          }
        });

        if (id === socketIdRef.current) {
          for (let id2 in connections) {
            if (id2 === socketIdRef.current) continue;
            try {
              connections[id2].addStream(window.localStream);
            } catch {
              /* ignore */
            }
            connections[id2].createOffer().then((description) => {
              connections[id2].setLocalDescription(description).then(() => {
                socketRef.current.emit(
                  "signal",
                  id2,
                  JSON.stringify({ sdp: connections[id2].localDescription })
                );
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

  let handleEndCall = () => {
    try {
      let tracks = localVideoref.current?.srcObject?.getTracks();
      tracks?.forEach((track) => track.stop());
    } catch {
      /* ignore */
    }

    for (let id in connections) {
      try {
        connections[id].close();
        delete connections[id];
      } catch {
        /* ignore */
      }
    }

    if (socketRef.current) {
      socketRef.current.emit("leave-call");
      setTimeout(() => {
        socketRef.current.disconnect();
        window.location.href = "/";
      }, 300);
    } else {
      window.location.href = "/";
    }
  };

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
        <div
          style={{
            padding: "40px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "20px",
            minHeight: "100vh",
            background: "linear-gradient(135deg, #0d0d1a 0%, #12122a 100%)",
            justifyContent: "center",
          }}
        >
          <h2
            style={{
              fontFamily: "Space Grotesk, sans-serif",
              fontSize: "2rem",
              fontWeight: 700,
              background: "linear-gradient(90deg, #6c63ff, #00d4aa)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
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
          {/* Top Info Bar */}
          <div
            style={{
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
            }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "0.72rem", color: "#8888aa" }}>Meeting Code</span>
              <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#00d4aa" }}>
                {roomCode}
              </span>
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

          {/* ChatPanel */}
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
                borderRadius: "50%",
                width: 52,
                height: 52,
                color: video ? "#6c63ff" : "white",
              }}
            >
              {video ? <VideocamIcon /> : <VideocamOffIcon />}
            </IconButton>

            <IconButton
              onClick={handleEndCall}
              sx={{
                background: "#ff4444",
                borderRadius: "50%",
                width: 56,
                height: 56,
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
                borderRadius: "50%",
                width: 52,
                height: 52,
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
                  borderRadius: "50%",
                  width: 52,
                  height: 52,
                  color: screen ? "#00d4aa" : "white",
                }}
              >
                {screen ? <ScreenShareIcon /> : <StopScreenShareIcon />}
              </IconButton>
            )}

            <Badge badgeContent={newMessages} color="error" max={99}>
              <IconButton
                onClick={() => {
                  setModal(!showModal);
                  setNewMessages(0);
                }}
                sx={{
                  background: showModal ? "rgba(108,99,255,0.2)" : "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "50%",
                  width: 52,
                  height: 52,
                  color: showModal ? "#6c63ff" : "white",
                }}
              >
                <ChatIcon />
              </IconButton>
            </Badge>
          </div>

          {/* Peer Left Banner */}
          {peerLeft && (
            <div
              style={{
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
              }}
            >
              👤 A participant has left the call
            </div>
          )}

          {/* Local Video */}
          <video className={styles.meetUserVideo} ref={localVideoref} autoPlay muted />

          {/* Conference View with VideoTile */}
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
