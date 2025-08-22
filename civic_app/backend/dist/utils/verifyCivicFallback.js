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
exports.verifyCivicTokenFallback = verifyCivicTokenFallback;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
/**
 * Fallback verification method that just decodes the token without verification
 * WARNING: This is not secure for production use
 */
function verifyCivicTokenFallback(token) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const decoded = jsonwebtoken_1.default.decode(token, { complete: true });
            if (!decoded) {
                throw new Error('Invalid token: unable to decode');
            }
            // For development, we'll just return the payload without verification
            console.warn('WARNING: Using fallback token verification. This is not secure for production!');
            return decoded.payload;
        }
        catch (err) {
            console.error('Error in fallback token verification:', err);
            throw new Error(`Token verification failed: ${err.message}`);
        }
    });
}
