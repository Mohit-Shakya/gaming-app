// src/hooks/useProfileComplete.ts
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import useUser from "@/hooks/useUser";

type ProfileStatus = {
  isComplete: boolean;
  isLoading: boolean;
  profile: {
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    dob: string | null;
  } | null;
};

/**
 * Hook to check if user's profile is complete (onboarding done)
 * 
 * @param redirectToOnboarding - If true, automatically redirects incomplete profiles to /onboarding
 * @returns ProfileStatus object with isComplete, isLoading, and profile data
 */
export default function useProfileComplete(redirectToOnboarding: boolean = false): ProfileStatus {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileStatus["profile"]>(null);

  useEffect(() => {
    async function checkProfile() {
      // If still loading user, wait
      if (userLoading) return;

      // If no user, not complete
      if (!user) {
        setIsComplete(false);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("first_name, last_name, phone, date_of_birth, onboarding_complete")
          .eq("id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error checking profile:", error);
          setIsComplete(false);
          setIsLoading(false);
          return;
        }

        const complete = data?.onboarding_complete === true;
        
        setProfile(data ? {
          firstName: data.first_name,
          lastName: data.last_name,
          phone: data.phone,
          dob: data.date_of_birth,
        } : null);
        
        setIsComplete(complete);

        // Redirect to onboarding if not complete and redirect is enabled
        if (!complete && redirectToOnboarding) {
          // Save current path to redirect back after onboarding
          if (typeof window !== "undefined") {
            sessionStorage.setItem("redirectAfterOnboarding", window.location.pathname);
          }
          router.push("/onboarding");
        }

      } catch (err) {
        console.error("Error:", err);
        setIsComplete(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkProfile();
  }, [user, userLoading, redirectToOnboarding, router]);

  return { isComplete, isLoading, profile };
}