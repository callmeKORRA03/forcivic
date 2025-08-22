// backend/src/routes/civicAuth.route.ts
import { Router } from "express";
import jwt from "jsonwebtoken";
import { verifyCivicToken } from "../utils/verifyCivic";
import { CitizenModel } from "../models/citizen.model";
import bcrypt from "bcryptjs";

const router = Router();

// Simple in-memory fallback map (for no-DB mode). Not persisted across restarts.
const inMemoryUsers: Record<string, any> = {};

// POST /api/v1/auth/civic
router.post("/auth/civic", async (req: any, res: any) => {
  try {
    const { civicToken } = req.body;
    if (!civicToken) return res.status(400).json({ message: "Missing civicToken" });

    // verify civic token (throws if invalid)
    const payload: any = await verifyCivicToken(civicToken);

    // pick common fields from payload
    const civicId = payload.sub ?? null;
    const email = payload.email ?? payload.preferred_username ?? null;
    const fullName =
      payload.name ??
      `${payload.given_name ?? ""} ${payload.family_name ?? ""}`.trim() ??
      email ??
      "Civic User";

    // Attempt DB operations, but wrap in try/catch so we can fallback
    let citizen: any = null;
    let usedDb = false;

    try {
      // Only run DB queries if model is available
      if (CitizenModel && typeof CitizenModel.findOne === "function") {
        // try lookups by email / civicId
        if (email) {
          citizen = await CitizenModel.findOne({ email }).exec();
        }
        if (!citizen && civicId) {
          citizen = await CitizenModel.findOne({ civicId }).exec();
        }

        // create citizen if not found
        if (!citizen) {
          const randomPassword = Math.random().toString(36).slice(-12);
          const hashedPassword = await bcrypt.hash(randomPassword, 10);

          const newCitizen = new CitizenModel({
            fullName,
            email,
            password: hashedPassword,
            phonenumber: "",
            civicId,
            isVerified: true,
          });

          citizen = await newCitizen.save();
        } else {
          // update citizen fields if missing
          (citizen as any).civicId = (citizen as any).civicId || civicId;
          (citizen as any).isVerified = true;
          if (!citizen.fullName) citizen.fullName = fullName;
          await citizen.save();
        }

        usedDb = true;
      }
    } catch (dbErr) {
      console.warn("[civicAuth] DB operation failed — falling back to in-memory user.", dbErr);
      citizen = null; // ensure fallback created below
      usedDb = false;
    }

    // If DB wasn't used or citizen still null, create an in-memory user object
    if (!usedDb || !citizen) {
      // create a stable in-memory id using civicId if present
      const id = civicId ? `civic-${civicId}` : `temp-${Date.now()}-${Math.floor(Math.random() * 9999)}`;

      // if an in-memory user exists for this id, reuse it
      if (inMemoryUsers[id]) {
        citizen = inMemoryUsers[id];
      } else {
        citizen = {
          _id: id,
          fullName,
          email,
          phonenumber: "",
          civicId,
          isVerified: true,
        };
        inMemoryUsers[id] = citizen;
        console.info("[civicAuth] created in-memory user:", id);
      }
    }

    // sign JWT with server secret (use env JWT_PASSWORD)
    const jwtSecret = process.env.JWT_PASSWORD || "dev_jwt_secret";
    const token = jwt.sign({ id: citizen._id ?? citizen._id ?? citizen.id ?? civicId, role: "citizen" }, jwtSecret, {
      expiresIn: "1d",
    });

    return res.json({
      token,
      user: {
        id: citizen._id ?? citizen.id ?? null,
        fullName: citizen.fullName,
        email: citizen.email,
        phonenumber: citizen.phonenumber,
        role: "citizen",
        isVerified: citizen.isVerified ?? true,
      },
    });
  } catch (err: any) {
    console.error("Civic exchange error:", err);
    return res.status(401).json({ message: "Invalid Civic token / verification failed", error: err?.message ?? err });
  }
});

export default router;
