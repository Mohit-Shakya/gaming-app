// src/app/admin/layout.tsx
/**
 * Admin Layout - Excludes the main site navbar and footer
 * Provides a clean, dedicated admin interface
 */

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
