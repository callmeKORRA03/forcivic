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
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const verifyCivic_1 = require("../utils/verifyCivic");
const citizen_model_1 = require("../models/citizen.model");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const router = (0, express_1.Router)();
// POST /api/v1/auth/civic
router.post("/auth/civic", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { civicToken } = req.body;
        if (!civicToken) {
            return res.status(400).json({ message: "Missing civicToken" });
        }
        console.log("Civic token received, attempting verification...");
        // verify civic token
        const payload = yield (0, verifyCivic_1.verifyCivicToken)(civicToken);
        console.log("Token verified, payload:", payload);
        // pick common fields from payload
        const civicId = payload.sub;
        const email = payload.email || payload.preferred_username;
        const fullName = payload.name || `${payload.given_name || ""} ${payload.family_name || ""}`.trim() || email || "Civic User";
        if (!email) {
            return res.status(400).json({ message: "No email found in Civic token" });
        }
        // find or create citizen - fix the query to handle both email and civicId
        let citizen = yield citizen_model_1.CitizenModel.findOne({
            $or: [{ email: email }, { civicId: civicId }]
        }).exec();
        if (!citizen) {
            const randomPassword = Math.random().toString(36).slice(-12);
            const hashedPassword = yield bcryptjs_1.default.hash(randomPassword, 10);
            citizen = new citizen_model_1.CitizenModel({
                fullName,
                email,
                password: hashedPassword,
                phonenumber: "",
                civicId,
                isVerified: true,
            });
            yield citizen.save();
            console.log("New citizen created with Civic ID:", civicId);
        }
        else {
            // Update existing citizen - use type assertion to avoid TypeScript errors
            const citizenDoc = citizen;
            // Only update civicId if it doesn't exist
            if (civicId && !citizenDoc.civicId) {
                citizenDoc.civicId = civicId;
            }
            citizenDoc.isVerified = true;
            if (!citizenDoc.fullName && fullName)
                citizenDoc.fullName = fullName;
            yield citizenDoc.save();
            console.log("Existing citizen updated with Civic ID:", civicId);
        }
        // sign JWT
        const token = jsonwebtoken_1.default.sign({ id: citizen._id, role: "citizen" }, process.env.JWT_PASSWORD || "dev_jwt", { expiresIn: "1d" });
        return res.json({
            token,
            user: {
                id: citizen._id,
                fullName: citizen.fullName,
                email: citizen.email,
                phonenumber: citizen.phonenumber,
                role: "citizen",
                isVerified: citizen.isVerified || true,
            },
        });
    }
    catch (err) {
        console.error("Civic exchange error:", err);
        // Handle duplicate key error specifically
        if (err.code === 11000) {
            // Try to find the existing user and return a token for them
            try {
                const email = (_a = err.keyValue) === null || _a === void 0 ? void 0 : _a.email;
                if (email) {
                    const existingCitizen = yield citizen_model_1.CitizenModel.findOne({ email }).exec();
                    if (existingCitizen) {
                        const token = jsonwebtoken_1.default.sign({ id: existingCitizen._id, role: "citizen" }, process.env.JWT_PASSWORD || "dev_jwt", { expiresIn: "1d" });
                        return res.json({
                            token,
                            user: {
                                id: existingCitizen._id,
                                fullName: existingCitizen.fullName,
                                email: existingCitizen.email,
                                phonenumber: existingCitizen.phonenumber,
                                role: "citizen",
                                isVerified: existingCitizen.isVerified || true,
                            },
                        });
                    }
                }
            }
            catch (fallbackError) {
                console.error("Fallback error:", fallbackError);
            }
        }
        return res.status(401).json({
            message: "Invalid Civic token / verification failed",
            error: err.message
        });
    }
}));
exports.default = router;
