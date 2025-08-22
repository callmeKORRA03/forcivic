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

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Check multiple places for the token
  let token: string | null = null;
  
  // 1. Check Authorization header
  const authHeader = req.headers["authorization"];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }
  
  // 2. Check cookies
  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  
  // 3. Check query parameters
  if (!token && req.query && req.query.token) {
    token = req.query.token as string;
  }

  console.log("Token found:", token ? "Yes" : "No");

  if (!token) {
    console.log("No token provided");
    res.status(401).json({
      message: "Authorization token is required",
    });
    return;
  }

  // JWT_PASSWORD is expected to be set in the environment variables
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_PASSWORD!
    ) as DecodedToken;

    console.log("Decoded JWT:", decoded);
    
    if (decoded.role === "citizen") {
      req.citizenId = decoded.id;
    } else if (decoded.role === "admin") {
      req.adminId = decoded.id;
    }
    req.role = decoded.role;
    next();
  } catch (e) {
    console.error("Error verifying JWT:", e);
    res.status(403).json({
      message: "Invalid token or expired",
    });
  }
};