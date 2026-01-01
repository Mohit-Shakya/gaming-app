"use client";

import { usePathname } from "next/navigation";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import LoadingBar from "@/components/LoadingBar";

export default function LayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');
  const isOwnerRoute = pathname?.startsWith('/owner');

  return (
    <>
      <LoadingBar />
      {!isAdminRoute && !isOwnerRoute && <Navbar />}
      {children}
      {!isAdminRoute && !isOwnerRoute && <Footer />}
    </>
  );
}
