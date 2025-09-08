import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Lobby from "./screens/Lobby";
import { SocketProvider } from "./context/SocketProvider";
import Room from "./screens/Room";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Lobby />,
  },
  {
    path: "room/:roomId",
    element: <Room />,
  },
]);

function App() {
  return (
    <SocketProvider>
      <main>
        <RouterProvider router={router} />
      </main>
    </SocketProvider>
  );
}

export default App;
