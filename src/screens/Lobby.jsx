import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCallback } from "react";
import { useSocket } from "../context/SocketProvider";
import { v4 as uuidv4 } from "uuid";

const Lobby = () => {
  const { socket } = useSocket();
  const [roomId, setRoomId] = useState("");
  const navigate = useNavigate()

  const handleJoinRomm = useCallback((data) => {
    const { uid, roomId } = data;
    navigate(`/room/${roomId}`)
  }, [navigate]);

  useEffect(() => {
    socket.on("join-room", handleJoinRomm);
    return () => {
      socket.off('join-room',handleJoinRomm);
    };
  }, [handleJoinRomm, socket]);

  const handleSubmitForm = useCallback(
    (e) => {
      e.preventDefault();
      const uid = uuidv4();
      socket.emit("join-room", { uid, roomId });
      setRoomId("");
    },
    [roomId, socket]
  );

  return (
    <div>
      <h1>Lobby</h1>

      <form onSubmit={handleSubmitForm}>
        <label htmlFor="roomId">Room Id</label>
        <input
          type="text"
          name="roomId"
          id="roomId"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        />
        <button type="submit">Join Room</button>
      </form>
    </div>
  );
};

export default Lobby;
