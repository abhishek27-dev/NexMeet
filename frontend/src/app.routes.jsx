import { createBrowserRouter } from "react-router-dom";
import Landing from "./features/meeting/pages/Landing";
import Authentication from "./features/auth/pages/Authentication";
import Home from "./features/meeting/pages/Home";
import History from "./features/meeting/pages/History";
import VideoMeet from "./features/meeting/pages/VideoMeet";
import Protected from "./features/auth/components/Protected";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Landing />,
  },
  {
    path: "/auth",
    element: <Authentication />,
  },
  {
    path: "/home",
    element: <Home />,
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
    element: <VideoMeet />,
  },
]);

export default router;
