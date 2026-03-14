"use client";

import { useEffect, useState } from "react";
import Leaderboard from "@/components/Leaderboard";
import { LeaderboardEntry, PRESET_GENRES } from "@/types";
import Link from "next/link";

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState<string>("");

  useEffect(() => {
    setLoading(true);
    const url = selectedGenre
      ? `/api/leaderboard?genre=${encodeURIComponent(selectedGenre)}&limit=50`
      : "/api/leaderboard?limit=50";

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        setEntries(data.entries || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedGenre]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">🏆 Leaderboard</h1>
        <Link
          href="/"
          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
        >
          ← Play
        </Link>
      </div>

      {/* Genre filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedGenre("")}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            selectedGenre === ""
              ? "bg-indigo-600 text-white"
              : "bg-white border border-gray-200 text-gray-600 hover:border-indigo-300"
          }`}
        >
          All
        </button>
        {PRESET_GENRES.map((g) => (
          <button
            key={g.slug}
            onClick={() => setSelectedGenre(g.slug)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedGenre === g.slug
                ? "bg-indigo-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:border-indigo-300"
            }`}
          >
            {g.emoji} {g.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <Leaderboard entries={entries} />
      )}
    </div>
  );
}
