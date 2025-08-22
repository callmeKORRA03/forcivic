import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const API = (
  import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1"
).replace(/\/+$/, "");

export default function CivicRedirectHandler() {
  const navigate = useNavigate();
  const { setAuthFromServer } = useAuth();
  const [hasAttempted, setHasAttempted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only attempt once
    if (hasAttempted) return;
    setHasAttempted(true);

    const handleCivicRedirect = async () => {
      try {
        console.log("Starting Civic authentication process...");

        // Check if we already have a valid token
        const token = localStorage.getItem("token");
        const userStr = localStorage.getItem("user");

        if (token && userStr) {
          const user = JSON.parse(userStr);
          console.log("Found existing auth, redirecting to:", user.role);

          if (typeof setAuthFromServer === "function") {
            setAuthFromServer(token, user);
          }

          const target = user.role === "admin" ? "/admin" : "/citizen";
          navigate(target, { replace: true });
          return;
        }

        // Wait a moment for Civic to populate the token
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Try to get token from Civic
        const civic = (window as any).civic;
        if (!civic) {
          console.error("Civic object not found");
          setError("Civic authentication failed. Please try again.");
          setTimeout(() => navigate("/", { replace: true }), 3000);
          return;
        }

        console.log("Civic object found, attempting to get token");

        let civicToken: string | null = null;

        // Try different methods to get the token
        try {
          if (typeof civic.getAccessToken === "function") {
            civicToken = await civic.getAccessToken();
          }
        } catch (e) {
          console.log("getAccessToken failed, trying other methods");
        }

        if (!civicToken) {
          try {
            if (typeof civic.getIdToken === "function") {
              civicToken = await civic.getIdToken();
            }
          } catch (e) {
            console.log("getIdToken failed, trying other methods");
          }
        }

        if (!civicToken && civic.accessToken) {
          civicToken = civic.accessToken;
        }

        if (!civicToken && civic.idToken) {
          civicToken = civic.idToken;
        }

        if (!civicToken) {
          // Check localStorage for Civic token
          for (const key of Object.keys(localStorage)) {
            if (
              key.includes("civic") ||
              key.includes("auth") ||
              key.includes("token")
            ) {
              const value = localStorage.getItem(key);
              if (value && value.includes("eyJ") && value.length > 100) {
                civicToken = value;
                break;
              }
            }
          }
        }

        if (civicToken) {
          console.log("Civic token found, exchanging with backend");

          const res = await fetch(`${API}/auth/civic`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ civicToken }),
            credentials: "include",
          });

          if (res.ok) {
            const data = await res.json();
            const jwt = data.jwt || data.token;
            const serverUser = data.user;

            if (jwt) {
              // Store token and user data
              localStorage.setItem("token", jwt);
              if (serverUser)
                localStorage.setItem("user", JSON.stringify(serverUser));

              // Update auth context
              if (typeof setAuthFromServer === "function") {
                setAuthFromServer(jwt, serverUser);
              }

              // Redirect to appropriate dashboard
              const target =
                serverUser?.role === "admin" ? "/admin" : "/citizen";
              navigate(target, { replace: true });
              return;
            } else {
              setError("Authentication failed: No token received");
            }
          } else {
            const errorText = await res.text();
            console.error("Token exchange failed:", res.status, errorText);
            setError(`Authentication failed: ${errorText}`);
          }
        } else {
          console.warn("No Civic token found after authentication");
          setError(
            "No authentication token found. Please try signing in again."
          );
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setError("An unexpected error occurred during authentication.");
      }

      // If we get here, auth failed
      setTimeout(() => navigate("/", { replace: true }), 3000);
    };

    handleCivicRedirect();
  }, [navigate, setAuthFromServer, hasAttempted]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">Authentication Error</div>
          <p className="text-gray-600">{error}</p>
          <p className="text-gray-500 mt-2">Redirecting to home page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
}
