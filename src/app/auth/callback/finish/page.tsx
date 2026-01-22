// src/app/auth/callback/finish/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallbackFinish() {
  const router = useRouter();

  useEffect(() => {
    async function checkProfileAndRedirect() {
      // 1. Get the session to ensure we are logged in
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        // 2. Check if the user has a phone number in their profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('phone')
          .eq('id', session.user.id)
          .single();

        // 3. Read the intended redirect URL
        const intendedRedirect = sessionStorage.getItem("redirectAfterLogin") || "/";
        sessionStorage.removeItem("redirectAfterLogin");

        // 4. If phone is missing, redirect to profile with a 'required' flag
        if (!profile?.phone) {
          // Store the intended URL so we can redirect back after they add their phone
          const returnUrl = encodeURIComponent(intendedRedirect);
          router.replace(`/profile?required=phone&returnUrl=${returnUrl}`);
          return;
        }

        // 5. Otherwise, go to the intended destination
        router.replace(intendedRedirect);
      } else {
        // Fallback if no session (shouldn't happen here usually)
        router.replace("/");
      }
    }

    checkProfileAndRedirect();
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
