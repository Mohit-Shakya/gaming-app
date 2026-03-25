import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export function useAdminAuth() {
  const router = useRouter();
  const [adminId, setAdminId] = useState<string | null>(null);
  const [adminUsername, setAdminUsername] = useState<string>("Admin");
  const [allowed, setAllowed] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function checkRole() {
      try {
        const res = await fetch("/api/admin/verify", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data.isAdmin) {
          if (!cancelled) {
            setAllowed(false);
            setCheckingRole(false);
          }
          router.replace("/admin/login");
          return;
        }

        if (!cancelled) {
          setAdminId(data.userId || null);
          setAdminUsername(data.username || "Admin");
          setAllowed(true);
          setCheckingRole(false);
        }
      } catch (err) {
        console.error("Error checking admin role:", err);
        if (!cancelled) {
          setAllowed(false);
          setCheckingRole(false);
        }
        router.replace("/admin/login");
      }
    }

    checkRole();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return { adminId, adminUsername, allowed, checkingRole };
}
