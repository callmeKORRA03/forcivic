import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";
import { CivicAuthProvider } from "@civic/auth/react";
import { BrowserRouter } from "react-router-dom";
import CivicListener from "./components/CivicListener";

const clientId =
  import.meta.env.VITE_CIVIC_CLIENT_ID ??
  "cbcd7909-4dc4-408a-b179-74d66275e011";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CivicAuthProvider clientId={clientId}>
      <BrowserRouter>
        <AuthProvider>
          <CivicListener />
          <App />
        </AuthProvider>
      </BrowserRouter>
    </CivicAuthProvider>
  </StrictMode>
);
