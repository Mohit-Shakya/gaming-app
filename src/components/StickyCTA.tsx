"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

type Props = {
  href: string;
  label?: string;
  ariaLabel?: string;
};

export default function StickyCTA({ href, label = "Book Now", ariaLabel }: Props) {
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
      // overlap = how many pixels the footer is visible into the viewport
      const overlap = Math.max(0, window.innerHeight - rect.top);
      const extra = Math.ceil(overlap);

      // Add a small buffer of 12px
      setBottom(16 + extra + 8);
    };

    const onScrollOrResize = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);

    // Observe DOM changes (in case footer is injected later)
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
    <div style={{ position: "fixed", right: 16, bottom, zIndex: 1100, pointerEvents: "auto" }}>
      <Link href={href} aria-label={ariaLabel ?? label} style={{ textDecoration: "none" }}>
        <div
          role="button"
          className="sticky-cta"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 20px",
            borderRadius: 999,
            background: "linear-gradient(135deg, #ff073a 0%, #ff3366 50%, #ff073a 100%)",
            color: "#fff",
            boxShadow: "0 8px 28px rgba(255,7,58,0.22)",
            fontFamily: "'Orbitron', sans-serif",
            fontWeight: 800,
            fontSize: 16,
            letterSpacing: "0.6px",
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>{label}</span>
        </div>
      </Link>

      <style jsx>{`
        .sticky-cta {
          transition: transform 160ms ease, box-shadow 160ms ease, opacity 160ms ease;
        }
        .sticky-cta:focus,
        .sticky-cta:hover {
          transform: translateY(-4px);
          box-shadow: 0 14px 40px rgba(255,7,58,0.28);
        }

        @media (max-width: 420px) {
          .sticky-cta { padding: 10px 14px; font-size: 15px }
        }
      `}</style>
    </div>
  );
}
