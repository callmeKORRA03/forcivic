// import { Request, Response, NextFunction } from "express";
// import jwt from "jsonwebtoken";

// interface DecodedToken {
//   id: string;
//   role: "admin" | "citizen";
// }

// declare global {
//   namespace Express {
//     interface Request {
//       citizenId?: string;
//       adminId?: string;
//       role?: "admin" | "citizen";
//     }
//   }
// }

// export const authMiddleware = (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): void => {
//   // Check multiple places for the token
//   let token: string | null = null;
  
//   // 1. Check Authorization header
//   const authHeader = req.headers["authorization"];
//   if (authHeader && authHeader.startsWith("Bearer ")) {
//     token = authHeader.split(" ")[1];
//   }
  
//   // 2. Check cookies
//   if (!token && req.cookies && req.cookies.token) {
//     token = req.cookies.token;
//   }
  
//   // 3. Check query parameters
//   if (!token && req.query && req.query.token) {
//     token = req.query.token as string;
//   }

//   console.log("Token found:", token ? "Yes" : "No");

//   if (!token) {
//     console.log("No token provided");
//     res.status(401).json({
//       message: "Authorization token is required",
//     });
//     return;
//   }

//   // JWT_PASSWORD is expected to be set in the environment variables
//   try {
//     const decoded = jwt.verify(
//       token,
//       process.env.JWT_PASSWORD!
//     ) as DecodedToken;

//     console.log("Decoded JWT:", decoded);
    
//     if (decoded.role === "citizen") {
//       req.citizenId = decoded.id;
//     } else if (decoded.role === "admin") {
//       req.adminId = decoded.id;
//     }
//     req.role = decoded.role;
//     next();
//   } catch (e) {
//     console.error("Error verifying JWT:", e);
//     res.status(403).json({
//       message: "Invalid token or expired",
//     });
//   }
// };

// backend/src/middlerware/auth.middleware.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface DecodedToken {
  id: string;
  role: "admin" | "citizen";
}

declare global {
  namespace Express {
    interface Request {
      citizenId?: string;
      adminId?: string;
      role?: "admin" | "citizen";
    }
  }
}

function tokenPreview(t: string | null | undefined) {
  if (!t) return "(none)";
  const safe = t.length > 10 ? t.slice(0, 6) + "..." + t.slice(-4) : t;
  return `len=${t.length} preview=${safe}`;
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Check multiple places for the token
  let token: string | null = null;

  // 1. Authorization header (preferred)
  const authHeader = (req.headers["authorization"] as string) || (req.headers["Authorization"] as string);
  if (authHeader) {
    const header = authHeader.trim();
    // Accept "Bearer <token>" or raw token
    if (header.toLowerCase().startsWith("bearer ")) {
      token = header.slice(7).trim();
    } else {
      token = header;
    }
  }

  // 2. cookies
  if (!token && req.cookies && (req.cookies as any).token) {
    token = (req.cookies as any).token;
  }

  // 3. query param
  if (!token && req.query && (req.query as any).token) {
    token = (req.query as any).token as string;
  }

  console.debug("[authMiddleware] Token found:", !!token, tokenPreview(token));

  if (!token) {
    res.status(401).json({ message: "Authorization token is required" });
    return;
  }

  const jwtSecret = process.env.JWT_PASSWORD;
  if (!jwtSecret) {
    console.error("[authMiddleware] Missing JWT_PASSWORD env! Cannot verify tokens.");
    res.status(500).json({ message: "Server misconfiguration (missing JWT secret)" });
    return;
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as DecodedToken;
    console.debug("[authMiddleware] JWT verified; role:", decoded.role);

    if (decoded.role === "citizen") {
      req.citizenId = decoded.id;
    } else if (decoded.role === "admin") {
      req.adminId = decoded.id;
    }
    req.role = decoded.role;
    next();
  } catch (err: any) {
    console.error("[authMiddleware] Error verifying JWT:", err && err.message ? err.message : err);
    // respond with 401 for malformed/invalid/expired tokens
    res.status(401).json({ message: "Invalid or expired token" });
  }
};
