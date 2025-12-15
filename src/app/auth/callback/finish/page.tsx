// src/app/auth/callback/finish/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthCallbackFinish() {
  const router = useRouter();

  useEffect(() => {
    // Read the redirect URL from sessionStorage (includes query params like ?mode=walkin)
    const redirectTo = sessionStorage.getItem("redirectAfterLogin") || "/";

    // Clear the stored redirect
    sessionStorage.removeItem("redirectAfterLogin");

    // Redirect to the intended destination
    router.replace(redirectTo);
  }, [router]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "#08080c",
        color: "white",
        fontFamily: "'Rajdhani', sans-serif",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "3px solid rgba(255, 7, 58, 0.2)",
            borderTopColor: "#ff073a",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            margin: "0 auto 16px",
          }}
        />
        <p style={{ fontSize: "14px", color: "#9ca3af" }}>
          Redirecting...
        </p>
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
