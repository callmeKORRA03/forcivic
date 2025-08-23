"use strict";
// import { Request, Response, NextFunction } from "express";
// import jwt from "jsonwebtoken";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function tokenPreview(t) {
    if (!t)
        return "(none)";
    const safe = t.length > 10 ? t.slice(0, 6) + "..." + t.slice(-4) : t;
    return `len=${t.length} preview=${safe}`;
}
const authMiddleware = (req, res, next) => {
    // Check multiple places for the token
    let token = null;
    // 1. Authorization header (preferred)
    const authHeader = req.headers["authorization"] || req.headers["Authorization"];
    if (authHeader) {
        const header = authHeader.trim();
        // Accept "Bearer <token>" or raw token
        if (header.toLowerCase().startsWith("bearer ")) {
            token = header.slice(7).trim();
        }
        else {
            token = header;
        }
    }
    // 2. cookies
    if (!token && req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }
    // 3. query param
    if (!token && req.query && req.query.token) {
        token = req.query.token;
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
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        console.debug("[authMiddleware] JWT verified; role:", decoded.role);
        if (decoded.role === "citizen") {
            req.citizenId = decoded.id;
        }
        else if (decoded.role === "admin") {
            req.adminId = decoded.id;
        }
        req.role = decoded.role;
        next();
    }
    catch (err) {
        console.error("[authMiddleware] Error verifying JWT:", err && err.message ? err.message : err);
        // respond with 401 for malformed/invalid/expired tokens
        res.status(401).json({ message: "Invalid or expired token" });
    }
};
exports.authMiddleware = authMiddleware;
