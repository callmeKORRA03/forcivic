// backend/src/utils/verifyCivic.ts
import jwksClient from "jwks-rsa";
import jwt, { JwtPayload } from "jsonwebtoken";

/**
 * Verify a Civic-issued JWT using JWKS.
 * Set CIVIC_JWKS_URI in .env if Civic publishes a different location.
 */
const CIVIC_JWKS_URI =
  process.env.CIVIC_JWKS_URI || "https://auth.civic.com/.well-known/jwks.json";

const client = jwksClient({
  jwksUri: CIVIC_JWKS_URI,
  timeout: 30000,
});

function getKey(header: any, callback: any) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    const signingKey = (key as any).getPublicKey();
    callback(null, signingKey);
  });
}

/**
 * Verify token and return decoded payload or throw.
 */
export async function verifyCivicToken(token: string): Promise<JwtPayload | string> {
  return new Promise((resolve, reject) => {
    jwt.verify(token, getKey as any, { algorithms: ["RS256"] }, (err, decoded) => {
      if (err) return reject(err);
      resolve(decoded as JwtPayload);
    });
  });
}
