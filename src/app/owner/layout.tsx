// src/app/owner/layout.tsx
import type { Metadata } from 'next';

// Force dynamic rendering for owner pages
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Owner Dashboard | BookMyGame",
  description: "Manage your gaming cafe business",
  manifest: "/owner-manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BMG Owner",
  },
};

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
