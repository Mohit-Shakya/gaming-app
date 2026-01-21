import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export function useOwnerAuth() {
  const router = useRouter();
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [ownerUsername, setOwnerUsername] = useState<string>("Owner");
  const [allowed, setAllowed] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    async function checkRole() {
      const ownerSession = localStorage.getItem("owner_session");
      if (!ownerSession) {
        setCheckingRole(false);
        router.push("/owner/login");
        return;
      }

      let sessionUserId: string;
      let sessionUsername: string;
      try {
        const session = JSON.parse(ownerSession);
        if (Date.now() - session.timestamp > 24 * 60 * 60 * 1000) {
          localStorage.removeItem("owner_session");
          router.push("/owner/login");
          return;
        }
        sessionUserId = session.userId;
        sessionUsername = session.username || "Owner";
        setOwnerUsername(sessionUsername);
      } catch (err) {
        localStorage.removeItem("owner_session");
        router.push("/owner/login");
        return;
      }

      try {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", sessionUserId)
          .single();

        if (profileError) throw profileError;

        const role = profile?.role?.toLowerCase();
        if (role === "owner" || role === "admin" || role === "super_admin") {
          setAllowed(true);
          setOwnerId(sessionUserId);
        } else {
          localStorage.removeItem("owner_session");
          router.push("/owner/login");
        }
      } catch (err) {
        console.error("Error checking role:", err);
        localStorage.removeItem("owner_session");
        router.push("/owner/login");
      } finally {
        setCheckingRole(false);
      }
    }

    checkRole();
  }, [router]);

  return { ownerId, ownerUsername, allowed, checkingRole };
}
