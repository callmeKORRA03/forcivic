import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { useUser } from "@civic/auth/react";

type AppUser = {
  id?: string;
  fullName?: string;
  email?: string;
  role?: string;
  isVerified?: boolean;
  [k: string]: any;
};

type AuthContextType = {
  user: AppUser | null;
  token: string | null;
  loading: boolean;
  logout: () => Promise<void>;
  setAuthFromServer: (jwt: string, user: AppUser) => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  logout: async () => {},
  setAuthFromServer: () => {},
});

export const useAuth = () => useContext(AuthContext);

async function obtainCivicToken(civic: any): Promise<string | null> {
  if (!civic) return null;
  try {
    if (typeof civic.getAccessToken === "function") {
      const t = await civic.getAccessToken();
      if (t) return t;
    }
    if (typeof civic.getIdToken === "function") {
      const t = await civic.getIdToken();
      if (t) return t;
    }
    if (typeof civic.idToken === "string" && civic.idToken.length)
      return civic.idToken;
    if (typeof civic.accessToken === "string" && civic.accessToken.length)
      return civic.accessToken;
    const user = civic.user ?? civic;
    if (user) {
      if (typeof user.idToken === "string" && user.idToken.length)
        return user.idToken;
      if (typeof user.accessToken === "string" && user.accessToken.length)
        return user.accessToken;
    }
    return null;
  } catch (err) {
    console.warn("obtainCivicToken error:", err);
    return null;
  }
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AppUser | null>(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("token")
  );
  const [loading, setLoading] = useState<boolean>(true);

  const civic = useUser();
  useEffect(() => {
    console.debug("[AuthContext] civic object changed:", civic);
  }, [civic]);

  const API_URL =
    import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";

  useEffect(() => {
    setLoading(false);
  }, []);

  useEffect(() => {
    let mounted = true;
    let alreadyExchanged = false;

    async function exchangeIfNeeded() {
      try {
        if (!civic) return;
        if (localStorage.getItem("token")) {
          console.debug(
            "[AuthContext] token present in localStorage; skipping exchange"
          );
          return;
        }
        setLoading(true);
        const civicToken = await obtainCivicToken(civic);
        if (!civicToken) {
          console.debug("[AuthContext] no civic token available");
          setLoading(false);
          return;
        }
        if (alreadyExchanged) {
          setLoading(false);
          return;
        }
        alreadyExchanged = true;

        console.info("[AuthContext] exchanging civic token with backend...");
        const resp = await fetch(`${API_URL}/auth/civic`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ civicToken }),
          credentials: "include",
        });

        if (!resp.ok) {
          const text = await resp.text();
          console.error(
            "[AuthContext] civic exchange failed:",
            resp.status,
            text
          );
          setLoading(false);
          return;
        }

        const data = await resp.json();
        const appJwt = data.jwt ?? data.token ?? data.accessToken ?? null;
        const serverUser = data.user ?? null;

        if (!appJwt) {
          console.error("[AuthContext] No JWT returned from backend:", data);
          setLoading(false);
          return;
        }

        localStorage.setItem("token", appJwt);
        if (serverUser)
          localStorage.setItem("user", JSON.stringify(serverUser));
        else localStorage.removeItem("user");

        if (!mounted) return;
        setToken(appJwt);
        setUser(serverUser);
        console.info("[AuthContext] exchange succeeded");
      } catch (err) {
        console.error("[AuthContext] exchange error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    exchangeIfNeeded();
    return () => {
      mounted = false;
    };
  }, [civic, API_URL]);

  const logout = useMemo(
    () => async (): Promise<void> => {
      try {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setToken(null);
        setUser(null);
        try {
          if (civic && typeof (civic as any).signOut === "function") {
            await (civic as any).signOut();
          } else if (civic && typeof (civic as any).logout === "function") {
            await (civic as any).logout();
          }
        } catch (e) {
          console.warn("Civic signOut error (non-fatal):", e);
        }
      } catch (e) {
        console.error("Logout error:", e);
      }
    },
    [civic]
  );

  const setAuthFromServer = (jwt: string, userObj: AppUser) => {
    if (jwt) {
      localStorage.setItem("token", jwt);
      setToken(jwt);
    } else {
      localStorage.removeItem("token");
      setToken(null);
    }

    if (userObj) {
      localStorage.setItem("user", JSON.stringify(userObj));
      setUser(userObj);
    } else {
      localStorage.removeItem("user");
      setUser(null);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    logout,
    setAuthFromServer,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
