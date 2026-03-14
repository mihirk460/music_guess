"use client";

import { LeaderboardEntry } from "@/types";

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  highlightNickname?: string;
}

export default function Leaderboard({ entries, highlightNickname }: LeaderboardProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400">
        No scores yet. Be the first to play!
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-4 py-3 text-left text-gray-500 font-medium w-10">#</th>
            <th className="px-4 py-3 text-left text-gray-500 font-medium">Player</th>
            <th className="px-4 py-3 text-left text-gray-500 font-medium">Song</th>
            <th className="px-4 py-3 text-left text-gray-500 font-medium">Genre</th>
            <th className="px-4 py-3 text-center text-gray-500 font-medium">Round</th>
            <th className="px-4 py-3 text-center text-gray-500 font-medium">Score</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {entries.map((entry, i) => {
            const isHighlighted =
              highlightNickname &&
              entry.nickname.toLowerCase() === highlightNickname.toLowerCase();
            return (
              <tr
                key={entry.id || i}
                className={isHighlighted ? "bg-indigo-50" : "hover:bg-gray-50"}
              >
                <td className="px-4 py-3 text-gray-400 font-mono">
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                </td>
                <td className="px-4 py-3 font-semibold text-gray-800">
                  {entry.nickname}
                  {isHighlighted && (
                    <span className="ml-1 text-xs text-indigo-500">(you)</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600 max-w-[180px] truncate">
                  <span className="font-medium">{entry.songTitle}</span>
                  {entry.artist && (
                    <span className="text-gray-400"> · {entry.artist}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500 max-w-[120px] truncate">
                  {entry.genreLabel}
                </td>
                <td className="px-4 py-3 text-center text-gray-500">
                  {entry.roundGuessed === 0 ? "—" : `Round ${entry.roundGuessed}`}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full font-bold text-sm ${
                      entry.score >= 5
                        ? "bg-green-100 text-green-700"
                        : entry.score >= 3
                        ? "bg-yellow-100 text-yellow-700"
                        : entry.score >= 1
                        ? "bg-orange-100 text-orange-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {entry.score}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
