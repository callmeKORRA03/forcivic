import jwt, { JwtPayload } from 'jsonwebtoken';

/**
 * Fallback verification method that just decodes the token without verification
 * WARNING: This is not secure for production use
 */
export async function verifyCivicTokenFallback(token: string): Promise<JwtPayload> {
  try {
    const decoded = jwt.decode(token, { complete: true });
    
    if (!decoded) {
      throw new Error('Invalid token: unable to decode');
    }
    
    // For development, we'll just return the payload without verification
    console.warn('WARNING: Using fallback token verification. This is not secure for production!');
    
    return decoded.payload as JwtPayload;
  } catch (err: any) {
    console.error('Error in fallback token verification:', err);
    throw new Error(`Token verification failed: ${err.message}`);
  }
}