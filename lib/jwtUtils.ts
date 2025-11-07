import jwt, { SignOptions } from "jsonwebtoken"

/**
 * Ensure that the JWT_SECRET is defined in your .env.local file.
 * For this demonstration, a fallback dummy secret is provided.
 * **DO NOT** use a dummy secret in production.
 */
const secret: string = process.env.JWT_SECRET || "dummy-dev-secret"

/**
 * Creates an access token with the provided payload and expiration settings.
 * @param payload - The payload to include in the token (e.g., user information).
 * @param expiresIn - Time until token expiration (default is "1h").
 * @returns The signed JWT token.
 */
export function createAccessToken(
  payload: Record<string, unknown>,
  expiresIn: jwt.SignOptions['expiresIn'] = "1h"
): string {
  if (!secret) {
    throw new Error("JWT_SECRET is not defined.")
  }
  
  // Pass the expiration value inside an options object.
  const options: SignOptions = { expiresIn }
  return jwt.sign(payload, secret, options)
}
/**
 * Verifies the provided token using the secret.
 * @param token - The JWT token to be verified.
 * @returns The decoded payload if verification succeeds.
 * @throws Error if the token is invalid or expired.
 */
export function verifyAccessToken(token: string): any {
  if (!secret) {
    throw new Error("JWT_SECRET is not defined.")
  }

  try {
    return jwt.verify(token, secret)
  } catch (error) {
    throw new Error("Invalid or expired token")
  }
}
