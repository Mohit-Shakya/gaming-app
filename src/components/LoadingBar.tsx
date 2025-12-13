// src/components/LoadingBar.tsx
"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function LoadingBar() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(false);
  }, [pathname]);

  // Listen for link clicks to show loading
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a");

      if (link && link.href && link.href.startsWith(window.location.origin)) {
        const url = new URL(link.href);
        // Only show loading if navigating to a different page
        if (url.pathname !== window.location.pathname) {
          setLoading(true);
        }
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  if (!loading) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "3px",
        background: "linear-gradient(90deg, #ff073a, #00f0ff, #ff073a)",
        backgroundSize: "200% 100%",
        animation: "loading-bar 1.5s ease-in-out infinite",
        zIndex: 9999,
      }}
    >
      <style>{`
        @keyframes loading-bar {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </div>
  );
}
