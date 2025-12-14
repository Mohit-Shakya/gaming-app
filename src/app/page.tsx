// src/app/page.tsx
// ✅ SERVER component – do NOT add "use client"

import { supabase } from "@/lib/supabaseClient";
import HomeClient from "@/components/HomeClient";
import type { Cafe } from "@/types/cafe";
import type { Metadata } from "next";

export const dynamic = "force-dynamic"; // avoid stale cache while building
export const revalidate = 0; // disable cache completely

export const metadata: Metadata = {
  title: "BookMyGame - Gaming Café Booking",
  description: "Book gaming cafés instantly across India",
};

export default async function HomePage() {
  const { data, error } = await supabase
    .from("cafes")
    .select("*")
    // 👇 only show active cafés on the public homepage
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(
      "[HomePage] Supabase error while loading cafes:",
      error.message,
      error.details
    );
  }

  const cafes = (data ?? []) as unknown as Cafe[];

  return <HomeClient cafes={cafes} />;
}