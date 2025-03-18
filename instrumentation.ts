"use server";

export async function register() {
  if (process.env.NEXT_PUBLIC_USE_TWOFA === "true" && process.env.NEXT_RUNTIME === "nodejs") {
    const { generateSecret } = await import("./utils/2fa");
    generateSecret();
  }
}
