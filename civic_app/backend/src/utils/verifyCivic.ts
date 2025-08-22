import jwt, { JwtPayload } from 'jsonwebtoken';

// Simple verification for development - in production, use proper JWKS verification
export async function verifyCivicToken(token: string): Promise<JwtPayload> {
  try {
    // For development, we'll just decode the token without verification
    // In production, you should implement proper JWKS verification
    const decoded = jwt.decode(token, { complete: true });
    
    if (!decoded) {
      throw new Error('Invalid token: unable to decode');
    }
    
    // Return the payload directly for development
    // WARNING: In production, you must verify the token signature
    return decoded.payload as JwtPayload;
  } catch (err: any) {
    console.error('Error decoding Civic token:', err);
    throw new Error(`Token decoding failed: ${err.message}`);
  }
}