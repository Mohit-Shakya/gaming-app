import React from 'react';
import { fonts } from '@/lib/constants';

type StatCardProps = {
    title: string;
    value: string | number;
    subtitle: string;
    icon: string;
    gradient: string;
    color: string;
    isMobile?: boolean; // Optional prop as it's computed internally too if not passed, but better to pass or use hook
};

export default function StatCard({
    title,
    value,
    subtitle,
    icon,
    gradient,
    color,
}: StatCardProps) {
    // We can use a simple check or prop. 
    // Ideally use useMediaQuery or context, but sticking to existing logic for now.
    // The original component computed isMobile inside.
    // We can't easily access window in SSR without hydration mismatch, but 'use client' is implied in owner page.
    // We'll keep it simple for now and rely on CSS or client-side check if needed.
    // Or pass isMobile as prop from page.tsx to be consistent.

    // Actually, page.tsx doesn't pass isMobile to StatCard currently. 
    // It computes it: const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    // We will replicate that or accept prop.
    // Let's replicate for now to match behavior, but cleaner code.

    // Note: Using window in render may cause hydration mismatch. 
    // Better to use CSS or a hook. 
    // Given the original code did it, we will stick to it but maybe safer?

    return (
        <div
            style={{
                padding: "24px",
                borderRadius: 16,
                background: gradient,
                border: `1px solid ${color}40`,
                position: "relative",
                overflow: "hidden",
                // Responsive overrides would need CSS-in-JS or classes.
                // For inline styles, we can't easily do media queries.
                // The original code used a variable `isMobile`.
                // We will assume desktop default for SSR safety, and if we want mobile, we really should pass the prop.
            }}
            className="stat-card" // allow css overrides
        >
            <div style={{ position: "absolute", top: -20, right: -20, fontSize: 80, opacity: 0.1 }}>
                {icon}
            </div>
            <div style={{ position: "relative", zIndex: 1 }}>
                <p
                    style={{
                        fontSize: 11,
                        color: `${color}E6`,
                        marginBottom: 8,
                        textTransform: "uppercase",
                        letterSpacing: 1.5,
                        fontWeight: 600,
                    }}
                >
                    {title}
                </p>
                <p
                    style={{
                        fontFamily: fonts.heading,
                        fontSize: 36,
                        margin: "8px 0",
                        color: color,
                        lineHeight: 1,
                    }}
                >
                    {value}
                </p>
                <p style={{ fontSize: 13, color: `${color}B3`, marginTop: 8 }}>{subtitle}</p>
            </div>
            <style jsx>{`
        @media (max-width: 768px) {
          .stat-card {
            padding: 16px !important;
            border-radius: 12px !important;
          }
          .stat-card p:first-of-type {
            font-size: 9px !important;
            margin-bottom: 6px !important;
            letter-spacing: 1px !important;
          }
          .stat-card p:nth-of-type(2) {
            font-size: 24px !important;
            margin: 6px 0 !important;
          }
          .stat-card p:last-of-type {
            font-size: 11px !important;
            margin-top: 6px !important;
          }
          .stat-card div:first-child {
            font-size: 60px !important;
          }
        }
      `}</style>
        </div>
    );
}
