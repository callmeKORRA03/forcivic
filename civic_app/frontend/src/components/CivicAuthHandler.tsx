// frontend/src/components/CivicAuthHandler.tsx
import { useEffect } from "react";
import { useUser } from "@civic/auth/react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const CivicAuthHandler = () => {
  const { user: civicUser, idToken } = useUser(); // Civic's user and token
  const { user: authUser, login } = useAuth(); // Your app's auth (assume login exists)
  const navigate = useNavigate();

  useEffect(() => {
    if (idToken && civicUser && !authUser) {
      // Only run if Civic signed in, but app user not set
      const exchangeToken = async () => {
        try {
          const response = await axios.post(
            `${import.meta.env.VITE_API_URL}/auth/civic`,
            { civicToken: idToken }
          );
          const { token, user: userData } = response.data;
          login(token, userData); // Set in your AuthContext
          navigate(userData.role === "citizen" ? "/citizen" : "/admin"); // Redirect
        } catch (error) {
          console.error("Civic token exchange failed:", error);
          // Optional: Sign out from Civic if failed
          // const { signOut } = useUser();
          // signOut();
        }
      };
      exchangeToken();
    }
  }, [idToken, civicUser, authUser, login, navigate]); // Dependencies to re-run only on changes

  return null; // Hidden component, no UI
};

export default CivicAuthHandler;
