import React, { useEffect, useRef, useState, useCallback } from "react";
import io from "socket.io-client";
import { Badge, Snackbar } from "@mui/material";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import CallEndIcon from "@mui/icons-material/CallEnd";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import StopScreenShareIcon from "@mui/icons-material/StopScreenShare";
import ChatIcon from "@mui/icons-material/Chat";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

import "./VideoMeet.css";
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
        /* Phase 1: Lobby Screen */
        <div className="lobby-screen">
          <h2 className="lobby-title">Enter Lobby — NexMeet</h2>

          <input
            type="text"
            className="lobby-input"
            placeholder="Your Name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && connect()}
          />

          <button type="button" className="lobby-join-btn" onClick={connect}>
            Join Call
          </button>

          <video
            className="lobby-preview-video"
            ref={localVideoref}
            autoPlay
            muted
          />
        </div>
      ) : (
        /* Phase 2: Active Meeting Room */
        <div className="meet-video-container">
          {/* Top Bar: Meeting Code & Copy Link */}
          <div className="meet-top-bar">
            <div className="meet-code-info">
              <span className="meet-code-label">Meeting Code</span>
              <span className="meet-code-val">{roomCode}</span>
            </div>

            <button
              type="button"
              className="meet-copy-btn"
              onClick={handleCopyLink}
              title="Copy invite link"
            >
              <ContentCopyIcon style={{ fontSize: "14px" }} />
              Copy Link
            </button>
          </div>

          {/* Chat Panel Component */}
          {showModal && (
            <ChatPanel
              messages={messages}
              message={message}
              onMessageChange={handleMessage}
              onSend={sendMessage}
            />
          )}

          {/* Bottom Meeting Controls Bar */}
          <div className="meet-controls-bar">
            <button
              type="button"
              className={`meet-control-btn ${video ? "active" : ""}`}
              onClick={handleVideo}
              title={video ? "Turn camera off" : "Turn camera on"}
            >
              {video ? <VideocamIcon /> : <VideocamOffIcon />}
            </button>

            <button
              type="button"
              className="meet-end-btn"
              onClick={handleEndCall}
              title="End call"
            >
              <CallEndIcon />
            </button>

            <button
              type="button"
              className={`meet-control-btn ${audio ? "active" : ""}`}
              onClick={handleAudio}
              title={audio ? "Mute mic" : "Unmute mic"}
            >
              {audio ? <MicIcon /> : <MicOffIcon />}
            </button>

            {screenAvailable && (
              <button
                type="button"
                className={`meet-control-btn ${screen ? "screen-active" : ""}`}
                onClick={handleScreen}
                title={screen ? "Stop sharing" : "Share screen"}
              >
                {screen ? <ScreenShareIcon /> : <StopScreenShareIcon />}
              </button>
            )}

            <Badge badgeContent={newMessages} color="error" max={99}>
              <button
                type="button"
                className={`meet-control-btn ${showModal ? "active" : ""}`}
                onClick={() => {
                  setModal(!showModal);
                  setNewMessages(0);
                }}
                title="Toggle chat"
              >
                <ChatIcon />
              </button>
            </Badge>
          </div>

          {/* Participant left notification */}
          {peerLeft && (
            <div className="meet-peer-left-banner">
              👤 A participant has left the call
            </div>
          )}

          {/* Local User Floating Video (PIP) */}
          <video
            className="meet-user-video"
            ref={localVideoref}
            autoPlay
            muted
          />

          {/* Conference Video Tiles */}
          <div className="conference-grid">
            {videos.map((v) => (
              <VideoTile
                key={v.socketId}
                socketId={v.socketId}
                stream={v.stream}
              />
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
