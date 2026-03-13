"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import GenreSelector from "@/components/GenreSelector";
import { Genre, Song } from "@/types";

export default function HomePage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGenreSelect(genre: Genre | null, customVibe?: string) {
    const name = nickname.trim();
    if (!name) {
      setError("Please enter a nickname first.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      if (genre) {
        // Preset genre — just navigate, game page will fetch songs
        const params = new URLSearchParams({
          genre: genre.slug,
          genreLabel: genre.label,
          nickname: name,
        });
        router.push(`/game?${params.toString()}`);
      } else if (customVibe) {
        // Custom vibe — call vibe API first to validate + pre-warm cache
        const res = await fetch("/api/vibe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vibe: customVibe }),
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Failed to find songs for this vibe. Try a different one.");
          setLoading(false);
          return;
        }

        const data: { songs: Song[] } = await res.json();
        if (!data.songs?.length) {
          setError("No songs found for this vibe. Try a different one.");
          setLoading(false);
          return;
        }

        const params = new URLSearchParams({
          vibe: customVibe,
          genreLabel: customVibe,
          nickname: name,
        });
        router.push(`/game?${params.toString()}`);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Hero */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          🎵 Bollywood Heardle
        </h1>
        <p className="text-gray-500 text-lg">
          Guess the Bollywood song from a short clip. Fewer rounds = more points!
        </p>
      </div>

      {/* How to play */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <h2 className="font-semibold text-gray-700 mb-3">How to play</h2>
        <ol className="space-y-1.5 text-sm text-gray-600 list-decimal list-inside">
          <li>Listen to a short clip of a Bollywood song</li>
          <li>Type your guess — autocomplete will help</li>
          <li>Wrong? Skip to hear more of the song</li>
          <li>Guess in fewer rounds to score more points (max 6)</li>
          <li>Your score goes on the leaderboard!</li>
        </ol>
        <div className="mt-3 flex gap-2 flex-wrap">
          {[
            { label: "1s → 6 pts", color: "bg-green-100 text-green-700" },
            { label: "3s → 5 pts", color: "bg-green-100 text-green-700" },
            { label: "7s → 4 pts", color: "bg-yellow-100 text-yellow-700" },
            { label: "15s → 3 pts", color: "bg-yellow-100 text-yellow-700" },
            { label: "24s → 2 pts", color: "bg-orange-100 text-orange-700" },
            { label: "30s → 1 pt", color: "bg-orange-100 text-orange-700" },
          ].map((s) => (
            <span key={s.label} className={`text-xs px-2 py-1 rounded-full font-medium ${s.color}`}>
              {s.label}
            </span>
          ))}
        </div>
      </div>

      {/* Nickname input */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Your nickname
        </label>
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="Enter a nickname for the leaderboard"
          maxLength={30}
          className="w-full px-4 py-2.5 border-2 border-gray-200 focus:border-indigo-400 rounded-xl text-base outline-none transition-colors"
        />
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      </div>

      {/* Genre selector */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <GenreSelector onSelect={handleGenreSelect} loading={loading} />
        {loading && (
          <p className="mt-3 text-sm text-center text-indigo-500 animate-pulse">
            Building your playlist…
          </p>
        )}
      </div>
    </div>
  );
}
