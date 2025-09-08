import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketProvider";
import peer from "../service/peer";

const Room = () => {
  const { socket } = useSocket();
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isCalling, setIsCalling] = useState(false); // ✅ calling overlay
  const remoteVideoRef = useRef(null);
  const localVideoRef = useRef(null);

  const navigate = useNavigate();

  const handleUserJoined = useCallback(({ uid, sid }) => {
    setRemoteSocketId(sid);
  }, []);

  const handleIncommingCall = useCallback(
    async ({ from, offer }) => {
      setRemoteSocketId(from);

      // No need to capture local stream here
      const answer = await peer.getAnswer(offer);
      socket.emit("call-accepted", { to: from, answer });
      setIsCalling(false);
    },
    [socket]
  );

  const handleCallAccepted = useCallback(async ({ answer }) => {
    await peer.setLocalDescription(answer);
    setIsCalling(false); // remove overlay when call connects
  }, []);

  const handleNegotiation = useCallback(
    () => async () => {
      if (!remoteSocketId) return;
      const offer = await peer.getOffer();
      socket.emit("peer:nego:needed", { offer, to: remoteSocketId });
    },
    [remoteSocketId, socket]
  );

  const handleNegotiationIncomming = useCallback(
    async ({ from, offer }) => {
      const ans = await peer.getAnswer(offer);
      socket.emit("peer:nego:done", { to: from, ans });
    },
    [socket]
  );

  const handleNegotiationFinal = useCallback(async ({ ans }) => {
    await peer.setLocalDescription(ans);
  }, []);

  useEffect(() => {
    const initLocalStream = async () => {
      if (!localStream) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });
        setLocalStream(stream);
        for (const track of stream.getTracks()) {
          peer.peer.addTrack(track, stream);
        }

        // Attach local video immediately
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      }
    };

    initLocalStream();
  }, []); // Run once when room loads

  useEffect(() => {
    peer.peer.addEventListener("negotiationneeded", handleNegotiation);
    return () => {
      peer.peer.removeEventListener("negotiationneeded", handleNegotiation);
    };
  }, [handleNegotiation]);

  useEffect(() => {
    const handleTrack = (ev) => {
      const [stream] = ev.streams;
      setRemoteStream(stream);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    };
    peer.peer.addEventListener("track", handleTrack);

    return () => {
      peer.peer.removeEventListener("track", handleTrack);
    };
  }, [remoteSocketId,socket]);

  useEffect(() => {
    socket.on("user-joined", handleUserJoined);
    socket.on("incomming-call", handleIncommingCall);
    socket.on("call-accepted", handleCallAccepted);
    socket.on("peer:nego:needed", handleNegotiationIncomming);
    socket.on("peer:nego:final", handleNegotiationFinal);

    return () => {
      socket.off("user-joined", handleUserJoined);
      socket.off("incomming-call", handleIncommingCall);
      socket.off("call-accepted", handleCallAccepted);
      socket.off("peer:nego:needed", handleNegotiationIncomming);
      socket.off("peer:nego:final", handleNegotiationFinal);
    };
  }, [
    handleCallAccepted,
    handleIncommingCall,
    handleNegotiationFinal,
    handleNegotiationIncomming,
    handleUserJoined,
    socket,
  ]);

  const handleEndCall = useCallback(() => {
    // Stop local tracks
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        track.stop();
        localStream.removeTrack(track);
      });
    }

    // Stop remote stream (optional cleanup)
    if (remoteStream) {
      remoteStream.getTracks().forEach((track) => {
        track.stop();

        remoteStream.removeTrack(track);
      });
    }

    // Close peer connection
    if (peer.peer) {
      peer.peer.close();
    }

    // Reset state
    setLocalStream(null);
    setRemoteStream(null);
    setIsCalling(false);
    // setRemoteSocketId(null);

    // Optionally tell the other peer
    socket.emit("end-call", { to: remoteSocketId });
    setRemoteSocketId(null);
    navigate("/");
  }, [localStream, remoteStream, socket, remoteSocketId, navigate]);

  useEffect(() => {
    socket.on("call-ended", () => {
      // Stop local tracks
      if (localStream) {
        localStream.getTracks().forEach((track) => {
          track.stop();
          localStream.removeTrack(track);
        });
      }

      // Stop remote stream (optional cleanup)
      if (remoteStream) {
        remoteStream.getTracks().forEach((track) => {
          track.stop();

          remoteStream.removeTrack(track);
        });
      }

      if (peer.peer) {
        peer.peer.close();
      }

      setLocalStream(null);
      setRemoteStream(null);
      setIsCalling(false);
      setRemoteSocketId(null);
      navigate("/");
    });

    return () => {
      socket.off("call-ended");
    };
  }, [localStream, navigate, remoteStream, socket]);

  const handleCallUser = useCallback(async () => {
    if (!remoteSocketId || !localStream) return;

    setIsCalling(true);
    const offer = await peer.getOffer();
    socket.emit("call-user", { to: remoteSocketId, offer });
  }, [remoteSocketId, socket, localStream]);

  const handleCancelCall = () => {
    setIsCalling(false);
    // optionally emit "cancel-call" to remote peer
  };

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // ===== STYLES =====
  const containerStyle = {
    position: "relative",
    width: "100%",
    height: "100vh",
    background: "#000",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  };

  const remoteVideoStyle = {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    backgroundColor: "#000",
  };

  const localVideoStyle = {
    position: "absolute",
    bottom: "20px",
    right: "20px",
    width: "200px",
    height: "150px",
    borderRadius: "10px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.5)",
    transform: "scaleX(-1)",
    objectFit: "cover",
    zIndex: 2,
  };

  const buttonStyle = {
    position: "absolute",
    top: "20px",
    right: "20px",
    padding: "10px 20px",
    borderRadius: "5px",
    border: "none",
    background: "#0078FF",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "bold",
    zIndex: 3,
  };

  const overlayStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.7)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    color: "#fff",
    zIndex: 5,
    fontSize: "24px",
  };

  const pulseStyle = {
    width: "100px",
    height: "100px",
    borderRadius: "50%",
    border: "4px solid #0078FF",
    animation: "pulse 1.5s infinite",
    marginBottom: "20px",
  };

  return (
    <div style={containerStyle}>
      {remoteStream ? (
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          style={remoteVideoStyle}
        />
      ) : (
        <p style={{ color: "#fff" }}>Waiting for someone to join...</p>
      )}

      {(localStream || remoteStream) && (
        <button
          style={{
            position: "absolute",
            bottom: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            padding: "10px 20px",
            borderRadius: "5px",
            border: "none",
            background: "red",
            color: "#fff",
            cursor: "pointer",
            fontWeight: "bold",
            zIndex: 3,
          }}
          onClick={handleEndCall}
        >
          End Call
        </button>
      )}

      {localStream && (
        <video ref={localVideoRef} autoPlay muted style={localVideoStyle} />
      )}

      {/* Call button only visible before streams are active */}
      {remoteSocketId && (
        <button style={buttonStyle} onClick={handleCallUser}>
          Call
        </button>
      )}

      {isCalling && (
        <div style={overlayStyle}>
          <div style={pulseStyle}></div>
          <p>Calling {remoteSocketId}...</p>
          <button
            style={{ ...buttonStyle, top: "auto", bottom: "50px" }}
            onClick={handleCancelCall}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.6; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Room;
