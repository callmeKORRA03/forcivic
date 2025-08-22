import { useEffect, useRef } from "react";
import { useUser } from "@civic/auth/react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const API = (
  import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1"
).replace(/\/+$/, "");

async function detectTokenFromSDK(civic: any): Promise<string | null> {
  if (!civic) return null;
  try {
    if (typeof civic.getAccessToken === "function") {
      try {
        const t = await civic.getAccessToken();
        if (t) return t;
      } catch (e) {}
    }
    if (typeof civic.getIdToken === "function") {
      try {
        const t = await civic.getIdToken();
        if (t) return t;
      } catch (e) {}
    }

    if (typeof civic.idToken === "string" && civic.idToken.length)
      return civic.idToken;
    if (typeof civic.accessToken === "string" && civic.accessToken.length)
      return civic.accessToken;

    const maybeUser = (civic as any).user ?? civic;
    if (maybeUser) {
      if (typeof maybeUser.idToken === "string" && maybeUser.idToken.length)
        return maybeUser.idToken;
      if (
        typeof maybeUser.accessToken === "string" &&
        maybeUser.accessToken.length
      )
        return maybeUser.accessToken;
    }

    return null;
  } catch (err) {
    console.warn("[CivicListener] detectTokenFromSDK error:", err);
    return null;
  }
}

export default function CivicListener() {
  const civic = useUser();
  const { user: appUser, setAuthFromServer } = useAuth();
  const navigate = useNavigate();

  const exchangedRef = useRef(false);
  const runningRef = useRef(false);
  const attemptsRef = useRef(0);
  const POLL_MS = 700;
  const MAX_ATTEMPTS = 18;

  useEffect(() => {
    async function tryExchange() {
      if (appUser) return;
      if (exchangedRef.current) return;
      if (attemptsRef.current >= MAX_ATTEMPTS) return;

      attemptsRef.current += 1;
      console.debug(
        `[CivicListener] attempt #${attemptsRef.current} to detect civic token...`
      );

      try {
        const civicToken = await detectTokenFromSDK(civic);
        if (!civicToken) return;

        exchangedRef.current = true;
        console.info("[CivicListener] exchanging civic token with backend...");

        const res = await fetch(`${API}/auth/civic`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ civicToken }),
          credentials: "include",
        });

        if (!res.ok) throw new Error(`Exchange failed ${res.status}`);

        const data = await res.json();
        const jwt = data.jwt ?? data.token ?? data.accessToken ?? null;
        const serverUser = data.user ?? null;

        if (!jwt) throw new Error("No JWT returned from backend");

        localStorage.setItem("token", jwt);
        if (serverUser)
          localStorage.setItem("user", JSON.stringify(serverUser));
        else localStorage.removeItem("user");

        if (typeof setAuthFromServer === "function") {
          setAuthFromServer(jwt, serverUser);
        }

        console.info("[CivicListener] exchange success — navigating");
        const target = serverUser?.role === "admin" ? "/admin" : "/citizen";
        navigate(target, { replace: true });
      } catch (err) {
        console.error("[CivicListener] exchange error:", err);
        exchangedRef.current = false;
      }
    }

    let timer: any;
    function startPolling() {
      if (runningRef.current) return;
      runningRef.current = true;
      timer = setInterval(async () => {
        if (
          exchangedRef.current ||
          appUser ||
          attemptsRef.current >= MAX_ATTEMPTS
        ) {
          clearInterval(timer);
          runningRef.current = false;
          return;
        }
        await tryExchange();
      }, POLL_MS);
    }

    startPolling();

    function onForceExchange() {
      console.debug("[CivicListener] received civic:forceExchange event");
      attemptsRef.current = 0;
      tryExchange();
    }
    window.addEventListener("civic:forceExchange", onForceExchange);

    tryExchange();

    return () => {
      clearInterval(timer);
      window.removeEventListener("civic:forceExchange", onForceExchange);
    };
  }, [civic, appUser, setAuthFromServer, navigate]);

  return null;
}
