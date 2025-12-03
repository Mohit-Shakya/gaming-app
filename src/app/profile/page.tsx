// src/app/page.tsx
import CafeList from "@/components/CafeList";
import { supabase } from "@/lib/supabaseClient";

export default async function HomePage() {
  // 1️⃣ Get cafes from Supabase table "cafes"
  const { data: cafes, error } = await supabase
    .from("cafes")
    .select("id, name, address");

  // 2️⃣ If there is any error, log it
  if (error) {
    console.error("Error loading cafes:", error.message);
  }

  // 3️⃣ Render the page
  return (
    <main className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-4xl md:text-5xl font-bold mb-3">
        Find a gaming café near you
      </h1>
      <p className="text-gray-400 mb-6">
        Browse gaming cafés, check their pricing, and soon you'll be able to
        book seats in a few taps.
      </p>

      {/* 👉 now using real data from Supabase */}
      <CafeList cafes={cafes ?? []} />
    </main>
  );
}
