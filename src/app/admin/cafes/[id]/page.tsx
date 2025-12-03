// src/app/admin/cafes/[id]/page.tsx
import { supabase } from "@/lib/supabaseClient";
import CafeForm from "@/components/admin/CafeForm";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditCafePage({ params }: PageProps) {
  const { id } = await params;

  const { data: cafe, error } = await supabase
    .from("cafes")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !cafe) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8">
        <p className="text-sm text-red-400">Café not found.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <CafeForm mode="edit" cafe={cafe} />
    </main>
  );
}