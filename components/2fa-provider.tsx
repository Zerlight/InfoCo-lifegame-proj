"use client";

import React, { useState, useEffect } from "react";
import { verify2fa, validateSessionToken } from "@/utils/2fa";
import GlobalLoading from "@/app/loading";

interface TwoFALayoutProps {
  children: React.ReactNode;
}

export function TwoFALayout({ children }: TwoFALayoutProps) {
  // 2FA switch based on environment variable
  const is2faEnabled = process.env.NEXT_PUBLIC_USE_TWOFA === "true";

  const [verified, setVerified] = useState<boolean | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const checkToken = async () => {
      if (verified === null) {
        const token = sessionStorage.getItem("InfoCo_2fa_token");
        if (token) {
          const result = await validateSessionToken(token);
          setVerified(result);
          if (!result) {
            sessionStorage.removeItem("InfoCo_2fa_token");
          }
        } else {
          setVerified(false);
        }
      }
    };
    checkToken();
  }, [verified]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await verify2fa(code);
    if (typeof result === "string" && result.length > 0) {
      sessionStorage.setItem("InfoCo_2fa_token", result);
      setVerified(true);
      setError("");
    } else {
      setVerified(false);
      setError("Invalid 2FA code");
    }
  };

  if (verified === null && is2faEnabled) return <GlobalLoading />;

  if (!verified && is2faEnabled) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2 p-5">
          <div className="px-3 text-md">
            <h2 className="text-foreground">访问此应用需要验证现场动态验证码</h2>
            <h2 className="text-foreground">
              Accessing this app requires onsite 2FA code verification
            </h2>
          </div>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter your code"
            className="border-2 border-foreground rounded-full py-2 px-4"
            required
            autoFocus
            autoComplete="false"
          />
          <button
            type="submit"
            className="bg-gray-900 text-white rounded-full py-2 px-4"
          >
            Verify
          </button>
          {error && <p className="text-red-500 font-bold px-3">{error}</p>}
        </form>
      </div>
    );
  }

  return <>{children}</>;
}
