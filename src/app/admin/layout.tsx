// src/app/admin/layout.tsx
/**
 * Admin Layout - Excludes the main site navbar and footer
 * Provides a clean, dedicated admin interface
 */
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Dashboard | BookMyGame",
  description: "Platform control center for BookMyGame administrators",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
