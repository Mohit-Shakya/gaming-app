"use client";

import { useState } from "react";

type GalleryImage = {
  id: string;
  url: string;
  alt: string;
};

type CafeGalleryProps = {
  images: GalleryImage[];
};

export default function CafeGallery({ images }: CafeGalleryProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // If no images, show simple placeholders
  if (!images || images.length === 0) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="h-24 rounded-xl bg-neutral-900 border border-neutral-800" />
        <div className="h-24 rounded-xl bg-neutral-900 border border-neutral-800" />
        <div className="h-24 rounded-xl bg-neutral-900 border border-neutral-800" />
        <div className="h-24 rounded-xl bg-neutral-900 border border-neutral-800" />
        <div className="h-24 rounded-xl bg-neutral-900 border border-neutral-800" />
        <div className="h-24 rounded-xl bg-neutral-900 border border-neutral-800" />
      </div>
    );
  }

  const handlePrev = () => {
    if (openIndex === null) return;
    setOpenIndex((openIndex + images.length - 1) % images.length);
  };

  const handleNext = () => {
    if (openIndex === null) return;
    setOpenIndex((openIndex + 1) % images.length);
  };

  return (
    <>
      {/* Masonry layout */}
      <div className="columns-2 md:columns-3 gap-3 space-y-3">
        {images.map((img, index) => (
          <button
            key={img.id}
            type="button"
            onClick={() => setOpenIndex(index)}
            className="mb-3 w-full text-left break-inside-avoid overflow-hidden rounded-2xl bg-neutral-900 border border-neutral-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <img
              src={img.url}
              alt={img.alt}
              className="w-full h-auto object-cover block"
            />
          </button>
        ))}
      </div>

      {/* Full-screen lightbox */}
      {openIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center px-4">
          <button
            type="button"
            onClick={() => setOpenIndex(null)}
            className="absolute top-4 right-4 rounded-full bg-white/10 hover:bg-white/20 p-2 text-white text-xl"
          >
            ×
          </button>

          {/* Prev / Next arrows – big tap targets for mobile */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 p-3 text-white text-lg"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 p-3 text-white text-lg"
              >
                ›
              </button>
            </>
          )}

          <div className="max-w-3xl max-h-[85vh] w-full flex items-center justify-center">
            <img
              src={images[openIndex].url}
              alt={images[openIndex].alt}
              className="max-h-[85vh] w-auto max-w-full object-contain rounded-2xl"
            />
          </div>

          {/* Mobile next/prev (bottom buttons) */}
          {images.length > 1 && (
            <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-4 sm:hidden">
              <button
                type="button"
                onClick={handlePrev}
                className="rounded-full bg-white/15 px-4 py-2 text-xs text-white"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="rounded-full bg-white/15 px-4 py-2 text-xs text-white"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}