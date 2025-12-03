// src/app/admin/cafes/new/page.tsx
import CafeForm from "@/components/admin/CafeForm";

export default function NewCafePage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <CafeForm mode="create" />
    </main>
  );
}