"use client";

import { useState, useRef, useEffect } from "react";
import { Song } from "@/types";

interface GuessInputProps {
  songs: Song[];
  onGuess: (guess: string) => void;
  onSkip: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function GuessInput({
  songs,
  onGuess,
  onSkip,
  disabled = false,
  placeholder = "Type song name…",
}: GuessInputProps) {
  const [value, setValue] = useState("");
  const [suggestions, setSuggestions] = useState<Song[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const q = value.toLowerCase();
    const filtered = songs
      .filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.artist.toLowerCase().includes(q)
      )
      .slice(0, 8);
    setSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
    setHighlighted(-1);
  }, [value, songs]);

  function handleSelect(song: Song) {
    setValue(song.title);
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  }

  function handleSubmit() {
    if (!value.trim()) return;
    onGuess(value.trim());
    setValue("");
    setSuggestions([]);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      setHighlighted((h) => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      setHighlighted((h) => Math.max(h - 1, -1));
    } else if (e.key === "Enter") {
      if (highlighted >= 0 && suggestions[highlighted]) {
        handleSelect(suggestions[highlighted]);
      } else {
        handleSubmit();
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full px-4 py-3 border-2 border-gray-300 focus:border-indigo-500 rounded-xl text-base outline-none transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
          autoComplete="off"
        />

        {showSuggestions && (
          <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-xl shadow-lg mt-1 max-h-64 overflow-y-auto">
            {suggestions.map((song, i) => (
              <li
                key={song.id}
                onMouseDown={() => handleSelect(song)}
                className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-indigo-50 transition-colors ${
                  i === highlighted ? "bg-indigo-50" : ""
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={song.coverUrl}
                  alt={song.album}
                  className="w-9 h-9 rounded object-cover flex-shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{song.title}</p>
                  <p className="text-xs text-gray-500 truncate">{song.artist}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={disabled || !value.trim()}
          className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-semibold rounded-xl transition-colors"
        >
          Guess
        </button>
        <button
          onClick={onSkip}
          disabled={disabled}
          className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 font-semibold rounded-xl transition-colors"
        >
          Skip →
        </button>
      </div>
    </div>
  );
}
