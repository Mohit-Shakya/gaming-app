import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
        
        // Optimistic UI: Immediately assume allowed and unblock data fetching
        setOwnerId(sessionUserId);
        setOwnerUsername(sessionUsername);
        setAllowed(true);
        setCheckingRole(false);
      } catch (err) {
        localStorage.removeItem("owner_session");
        router.push("/owner/login");
        return;
      }

      // Background validation. If this fails, retroactively kick them out.
      try {
        const res = await fetch('/api/owner/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: sessionUserId }),
        });

        const data = await res.json();

        if (!res.ok || !data.isOwner) {
          setAllowed(false);
          localStorage.removeItem("owner_session");
          router.push("/owner/login");
        }
      } catch (err) {
        console.error("Error checking role:", err);
      }
    }

    checkRole();
  }, [router]);

  return { ownerId, ownerUsername, allowed, checkingRole };
}
