// frontend/src/components/CivicAuthHandler.tsx
import React, { useEffect } from "react";
import { useUser } from "@civic/auth/react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

type BackendResp = {
  token?: string | null;
  accessToken?: string | null;
  jwt?: string | null;
  user?: Record<string, any> | null;
};

const CivicAuthHandler: React.FC = () => {
  // Keep the full civic object so we can call signOut/logout methods if needed
  const civic = useUser();
  const { user: civicUser, idToken } = civic ?? ({} as any);
  // useAuth provides setAuthFromServer in your context
  const { user: authUser, setAuthFromServer } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // only act when Civic has a token and user, and our app user isn't set yet
    if (!idToken || !civicUser || authUser) return;

    let mounted = true;
    let cancelled = false;

    const exchangeToken = async () => {
      try {
        const apiUrl =
          import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";
        const resp = await axios.post<BackendResp>(
          `${apiUrl}/auth/civic`,
          { civicToken: idToken },
          { withCredentials: true }
        );

        const data = resp.data ?? {};
        // prefer common fields for JWT/token
        const token = data.token ?? data.jwt ?? data.accessToken ?? null;
        const userData = data.user ?? null;

        // set auth in context if available; otherwise fall back to localStorage
        if (typeof setAuthFromServer === "function") {
          setAuthFromServer(token as string, userData);
        } else {
          if (token) localStorage.setItem("token", token as string);
          else localStorage.removeItem("token");

          if (userData) localStorage.setItem("user", JSON.stringify(userData));
          else localStorage.removeItem("user");
        }

        if (!mounted || cancelled) return;

        // redirect based on role (defensive: userData may be null)
        const role =
          (userData && (userData as any).role) ||
          (authUser && (authUser as any).role);
        if (role === "citizen") navigate("/citizen");
        else navigate("/admin");
      } catch (err) {
        console.error("Civic token exchange failed:", err);

        // optional: attempt to sign out Civic session (non-fatal)
        try {
          if (civic && typeof (civic as any).signOut === "function") {
            await (civic as any).signOut();
          } else if (civic && typeof (civic as any).logout === "function") {
            await (civic as any).logout();
          }
        } catch (e) {
          console.warn("Civic signOut error (non-fatal):", e);
        }
      }
    };

    exchangeToken();

    return () => {
      mounted = false;
      cancelled = true;
    };
    // include setAuthFromServer in deps (it's stable in your context)
  }, [idToken, civicUser, authUser, setAuthFromServer, navigate, civic]);

  return null;
};

export default CivicAuthHandler;
