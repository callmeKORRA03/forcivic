"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyCivicToken = verifyCivicToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Simple verification for development - in production, use proper JWKS verification
function verifyCivicToken(token) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // For development, we'll just decode the token without verification
            // In production, you should implement proper JWKS verification
            const decoded = jsonwebtoken_1.default.decode(token, { complete: true });
            if (!decoded) {
                throw new Error('Invalid token: unable to decode');
            }
            // Return the payload directly for development
            // WARNING: In production, you must verify the token signature
            return decoded.payload;
        }
        catch (err) {
            console.error('Error decoding Civic token:', err);
            throw new Error(`Token decoding failed: ${err.message}`);
        }
    });
}
