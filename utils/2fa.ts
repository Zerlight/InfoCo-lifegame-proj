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

// In-memory storage for session tokens and expiration times
const sessionStore: Record<string, number> = {};

/**
 * Generates a random session token.
 */
const generateSessionToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
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
    const sessionToken = generateSessionToken();
    const expirationTime = Date.now() + VALID_DURATION;

    // Store the session token and its expiration time in memory
    sessionStore[sessionToken] = expirationTime;

    return sessionToken;
  }
  return null;
};

/**
 * Validates a session token.
 */
export const validateSessionToken = async (token: string): Promise<boolean> => {
  const expirationTime = sessionStore[token];
  if (expirationTime && expirationTime > Date.now()) {
    return true;
  }

  // Remove expired token from the store
  delete sessionStore[token];
  return false;
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
