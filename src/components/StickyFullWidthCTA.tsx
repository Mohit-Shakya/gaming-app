"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

type Props = {
  href: string;
  label?: string;
  ariaLabel?: string;
};

export default function StickyFullWidthCTA({ href, label = "Book Your Session", ariaLabel }: Props) {
  const [bottom, setBottom] = useState<number>(16);

  useEffect(() => {
    let raf = 0;

    const update = () => {
      const footer = document.querySelector("footer");
      if (!footer) {
        setBottom(16);
        return;
      }

      const rect = footer.getBoundingClientRect();
      const overlap = Math.max(0, window.innerHeight - rect.top);
      const extra = Math.ceil(overlap);

      // Add a small buffer so CTA sits above footer
      setBottom(16 + extra + 8);
    };

    const onScrollOrResize = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);

    const mo = new MutationObserver(onScrollOrResize);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
      mo.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div style={{ position: "fixed", left: 16, right: 16, bottom, zIndex: 1100, display: "flex", justifyContent: "center", pointerEvents: "auto" }}>
      <Link
        href={href}
        aria-label={ariaLabel ?? label}
        style={{
          width: "100%",
          maxWidth: "960px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "12px",
          borderRadius: "14px",
          background: "linear-gradient(135deg, #ff073a 0%, #ff3366 50%)",
          color: "#fff",
          textDecoration: "none",
          fontFamily: "'Orbitron', sans-serif",
          fontWeight: 800,
          fontSize: 16,
        }}
      >
        {label}
      </Link>

      <style jsx>{`
        a:hover { transform: translateY(-3px); box-shadow: 0 8px 32px rgba(255,7,58,0.16); }
        @media (max-width: 420px) {
          a { padding: 10px 14px; font-size: 15px }
        }
      `}</style>
    </div>
  );
}
