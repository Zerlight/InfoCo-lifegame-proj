"use server";

import * as twofa from "node-2fa";
import crypto from "crypto";
import qrcode from "qrcode-terminal";

// Verification lasts for 10 minutes
const VALID_DURATION = 10 * 60 * 1000;

// Use a global variable so it persists between module instances
declare global {
  // eslint-disable-next-line no-var
  var TWOFA_SECRET: string | undefined;
}

const getSecret = (): string | undefined => globalThis.TWOFA_SECRET;
const setSecret = (secret: string): void => {
  globalThis.TWOFA_SECRET = secret;
};

// Stateless session token (HMAC signed JSON payload) to avoid loss across server instances
// Format: base64url(JSON.stringify({exp, iat, v:1})) + "." + base64url(HMAC_SHA256(payload, secret))
const SESSION_SIGN_SECRET = process.env.TWOFA_SESSION_SIGN_SECRET || "dev-session-sign-secret-change-me";

const base64url = (buf: Buffer) => buf.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

const signPayload = (payload: object): string => {
  const json = Buffer.from(JSON.stringify(payload));
  const sig = crypto.createHmac("sha256", SESSION_SIGN_SECRET).update(json).digest();
  return base64url(json) + "." + base64url(sig);
};

const verifySignedToken = (token: string): { exp: number; iat: number; v: number } | null => {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  try {
    const payloadB64 = parts[0].replace(/-/g, "+").replace(/_/g, "/");
    const sigB64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payloadBuf = Buffer.from(payloadB64, "base64");
    const sigBuf = Buffer.from(sigB64, "base64");
    const expected = crypto.createHmac("sha256", SESSION_SIGN_SECRET).update(payloadBuf).digest();
    if (!crypto.timingSafeEqual(expected, sigBuf)) return null;
    const data = JSON.parse(payloadBuf.toString());
    if (typeof data.exp !== "number" || Date.now() > data.exp) return null;
    return data;
  } catch {
    return null;
  }
};

/**
 * Verifies the 2FA code and generates a session token if valid.
 */
export const verify2fa = async (code: string): Promise<string | null> => {
  if (!code) {
    throw new Error("2FA code must be provided.");
  }
  const secret = getSecret();
  if (!secret) {
    throw new Error("2FA secret not initialized. Call generateSecret() first.");
  }
  const result = twofa.verifyToken(secret, code);
  if (result && result.delta === 0) {
  const now = Date.now();
  const sessionToken = signPayload({ iat: now, exp: now + VALID_DURATION, v: 1 });
  return sessionToken;
  }
  return null;
};

/**
 * Validates a session token.
 */
export const validateSessionToken = async (token: string): Promise<boolean> => {
  if (!token) return false;
  return !!verifySignedToken(token);
};

/**
 * Generates a new 2FA secret and prints the bind QR code.
 */
export const generateSecret = async (): Promise<void> => {
  const secretData = twofa.generateSecret({
    name: "InfoCo Life Game Project",
    account: "System",
  });
  console.log("2FA Secret (base32):", secretData.secret);
  console.log("OTPAuth URI:", secretData.uri);
  setSecret(secretData.secret);
  // Print QR code to the console
  qrcode.generate(secretData.uri, { small: true });
};
