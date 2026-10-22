import { RouterProvider } from "react-router-dom";
import { router } from "./app.routes.jsx";
import { AuthProvider } from "./features/auth/auth.context.jsx";
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <RouterProvider router={router} />
      </div>
    </AuthProvider>
  );
}

export default App;
