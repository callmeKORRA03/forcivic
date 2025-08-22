"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authMiddleware = (req, res, next) => {
    // Check multiple places for the token
    let token = null;
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
        token = req.query.token;
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
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_PASSWORD);
        console.log("Decoded JWT:", decoded);
        if (decoded.role === "citizen") {
            req.citizenId = decoded.id;
        }
        else if (decoded.role === "admin") {
            req.adminId = decoded.id;
        }
        req.role = decoded.role;
        next();
    }
    catch (e) {
        console.error("Error verifying JWT:", e);
        res.status(403).json({
            message: "Invalid token or expired",
        });
    }
};
exports.authMiddleware = authMiddleware;
