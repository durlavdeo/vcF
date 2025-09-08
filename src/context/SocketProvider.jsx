/* eslint-disable react-refresh/only-export-components */
import { useContext } from "react";
import { useMemo, createContext } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = (props) => {
  const socket = useMemo(
    () => io("https://my-video-chat-zolz.onrender.com"),
    []
  );
  return (
    <SocketContext.Provider value={{ socket }}>
      {props.children}
    </SocketContext.Provider>
  );
};
