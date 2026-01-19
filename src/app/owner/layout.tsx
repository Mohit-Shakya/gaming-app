// src/app/owner/layout.tsx
import type { Metadata } from 'next';

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
