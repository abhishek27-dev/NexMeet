import { createBrowserRouter, Navigate } from "react-router-dom";
import Landing from "./features/meeting/pages/Landing";
import Login from "./features/auth/pages/Login";
import Register from "./features/auth/pages/Register";
import Home from "./features/meeting/pages/Home";
import History from "./features/meeting/pages/History";
import VideoMeet from "./features/meeting/pages/VideoMeet";
import Protected from "./features/auth/components/Protected";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/auth",
    element: <Navigate to="/login" replace />,
  },
  {
    path: "/",
    element: (
      <Protected>
        <Home />
      </Protected>
    ),
  },
  {
    path: "/home",
    element: <Navigate to="/" replace />,
  },
  {
    path: "/history",
    element: (
      <Protected>
        <History />
      </Protected>
    ),
  },
  {
    path: "/:url",
    element: (
      <Protected>
        <VideoMeet />
      </Protected>
    ),
  },
]);

export default router;
