"use client";

import { useState } from "react";
import { PRESET_GENRES, Genre } from "@/types";

interface GenreSelectorProps {
  onSelect: (genre: Genre | null, customVibe?: string) => void;
  loading?: boolean;
}

export default function GenreSelector({ onSelect, loading }: GenreSelectorProps) {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [vibeInput, setVibeInput] = useState("");
  const [showVibeInput, setShowVibeInput] = useState(false);

  function handlePresetClick(genre: Genre) {
    setSelectedSlug(genre.slug);
    setShowVibeInput(false);
    setVibeInput("");
    onSelect(genre);
  }

  function handleCustomVibeSubmit() {
    if (vibeInput.trim().length < 3) return;
    setSelectedSlug("custom");
    onSelect(null, vibeInput.trim());
  }

  return (
    <div className="w-full flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-gray-700">Choose a vibe</h2>

      {/* Preset genre cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {PRESET_GENRES.map((genre) => (
          <button
            key={genre.slug}
            onClick={() => handlePresetClick(genre)}
            disabled={loading}
            className={`flex flex-col items-center gap-1 p-4 rounded-2xl border-2 transition-all font-medium text-sm shadow-sm hover:shadow-md disabled:opacity-50 ${
              selectedSlug === genre.slug && !showVibeInput
                ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                : "border-gray-200 bg-white text-gray-700 hover:border-indigo-300"
            }`}
          >
            <span className="text-2xl">{genre.emoji}</span>
            <span className="text-center leading-tight">{genre.label}</span>
          </button>
        ))}

        {/* Custom vibe card */}
        <button
          onClick={() => {
            setShowVibeInput(true);
            setSelectedSlug(null);
          }}
          disabled={loading}
          className={`flex flex-col items-center gap-1 p-4 rounded-2xl border-2 transition-all font-medium text-sm shadow-sm hover:shadow-md disabled:opacity-50 ${
            showVibeInput
              ? "border-purple-500 bg-purple-50 text-purple-700"
              : "border-dashed border-gray-300 bg-white text-gray-500 hover:border-purple-300"
          }`}
        >
          <span className="text-2xl">✨</span>
          <span className="text-center leading-tight">Custom Vibe</span>
        </button>
      </div>

      {/* Custom vibe input */}
      {showVibeInput && (
        <div className="flex flex-col gap-2 p-4 bg-purple-50 rounded-2xl border border-purple-200">
          <p className="text-sm text-purple-700 font-medium">
            Describe the vibe you&apos;re in the mood for:
          </p>
          <input
            type="text"
            value={vibeInput}
            onChange={(e) => setVibeInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCustomVibeSubmit()}
            placeholder="e.g. rainy day sad songs, late night drive, 2000s nostalgia…"
            className="w-full px-4 py-2.5 border border-purple-300 focus:border-purple-500 rounded-xl text-sm outline-none bg-white"
            autoFocus
          />
          <button
            onClick={handleCustomVibeSubmit}
            disabled={loading || vibeInput.trim().length < 3}
            className="py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white font-semibold rounded-xl text-sm transition-colors"
          >
            {loading ? "Curating playlist with AI…" : "Find Songs ✨"}
          </button>
          <p className="text-xs text-purple-500 text-center">
            Powered by Gemini AI + Deezer
          </p>
        </div>
      )}
    </div>
  );
}
