import { Router } from "express";
import jwt from "jsonwebtoken";
import { verifyCivicToken } from "../utils/verifyCivic";
import { CitizenModel } from "../models/citizen.model";
import bcrypt from "bcryptjs";

const router = Router();

// POST /api/v1/auth/civic
router.post("/auth/civic", async (req: any, res: any) => {
  try {
    const { civicToken } = req.body;
    if (!civicToken) {
      return res.status(400).json({ message: "Missing civicToken" });
    }

    console.log("Civic token received, attempting verification...");

    // verify civic token
    const payload = await verifyCivicToken(civicToken);
    console.log("Token verified, payload:", payload);

    // pick common fields from payload
    const civicId = payload.sub;
    const email = payload.email || payload.preferred_username;
    const fullName = payload.name || `${payload.given_name || ""} ${payload.family_name || ""}`.trim() || email || "Civic User";

    if (!email) {
      return res.status(400).json({ message: "No email found in Civic token" });
    }

    // find or create citizen - fix the query to handle both email and civicId
    let citizen = await CitizenModel.findOne({ 
      $or: [{ email: email }, { civicId: civicId }] 
    }).exec();

    if (!citizen) {
      const randomPassword = Math.random().toString(36).slice(-12);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      citizen = new CitizenModel({
        fullName,
        email,
        password: hashedPassword,
        phonenumber: "",
        civicId,
        isVerified: true,
      });

      await citizen.save();
      console.log("New citizen created with Civic ID:", civicId);
    } else {
      // Update existing citizen - use type assertion to avoid TypeScript errors
      const citizenDoc = citizen as any;
      
      // Only update civicId if it doesn't exist
      if (civicId && !citizenDoc.civicId) {
        citizenDoc.civicId = civicId;
      }
      
      citizenDoc.isVerified = true;
      if (!citizenDoc.fullName && fullName) citizenDoc.fullName = fullName;
      await citizenDoc.save();
      console.log("Existing citizen updated with Civic ID:", civicId);
    }

    // sign JWT
    const token = jwt.sign(
      { id: (citizen as any)._id, role: "citizen" }, 
      process.env.JWT_PASSWORD || "dev_jwt", 
      { expiresIn: "1d" }
    );

    return res.json({
      token,
      user: {
        id: (citizen as any)._id,
        fullName: (citizen as any).fullName,
        email: (citizen as any).email,
        phonenumber: (citizen as any).phonenumber,
        role: "citizen",
        isVerified: (citizen as any).isVerified || true,
      },
    });
  } catch (err: any) {
    console.error("Civic exchange error:", err);
    
    // Handle duplicate key error specifically
    if (err.code === 11000) {
      // Try to find the existing user and return a token for them
      try {
        const email = err.keyValue?.email;
        if (email) {
          const existingCitizen = await CitizenModel.findOne({ email }).exec();
          if (existingCitizen) {
            const token = jwt.sign(
              { id: existingCitizen._id, role: "citizen" }, 
              process.env.JWT_PASSWORD || "dev_jwt", 
              { expiresIn: "1d" }
            );
            
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
      } catch (fallbackError) {
        console.error("Fallback error:", fallbackError);
      }
    }
    
    return res.status(401).json({ 
      message: "Invalid Civic token / verification failed", 
      error: err.message 
    });
  }
});

export default router;