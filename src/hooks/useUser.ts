"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type SupaUser = NonNullable<
  Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"]
>;

type UseUserResult = {
  user: SupaUser | null;
  loading: boolean;
};

export default function useUser(): UseUserResult {
  const [user, setUser] = useState<SupaUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadInitial = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (!isMounted) return;

        if (error) {
          // Ignore "Auth session missing!" error as it just means not logged in
          if (!error.message.includes("Auth session missing")) {
             console.error("[useUser] getUser error:", error);
          }
          setUser(null);
        } else {
          setUser(data.user ?? null);
        }
      } catch (err) {
        console.error("[useUser] unexpected error:", err);
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadInitial();

    // Listen for auth changes so navbar updates instantly
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}