"use client";

import { useCallback, useEffect, useReducer } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import AudioPlayer from "@/components/AudioPlayer";
import GuessInput from "@/components/GuessInput";
import { Song, ROUND_DURATIONS, GameState, GameStatus } from "@/types";

type Action =
  | { type: "SET_SONGS"; songs: Song[] }
  | { type: "GUESS"; guess: string; correct: boolean }
  | { type: "SKIP" }
  | { type: "REVEAL" }
  | { type: "NEXT_SONG" };

function scoreForRound(round: number): number {
  return ROUND_DURATIONS.length - round;
}

function pickRandom(songs: Song[], exclude?: Song): Song {
  const pool = exclude ? songs.filter((s) => s.id !== exclude.id) : songs;
  return pool[Math.floor(Math.random() * pool.length)];
}

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "SET_SONGS": {
      const song = pickRandom(action.songs);
      return { ...state, songs: action.songs, song, round: 0, status: "idle", guess: "", score: 0 };
    }
    case "GUESS": {
      if (action.correct) {
        return { ...state, status: "guessed", guess: action.guess, score: scoreForRound(state.round) };
      }
      return { ...state, guess: action.guess };
    }
    case "SKIP": {
      const nextRound = state.round + 1;
      if (nextRound >= ROUND_DURATIONS.length) {
        return { ...state, status: "revealed", score: 0 };
      }
      return { ...state, round: nextRound, guess: "" };
    }
    case "REVEAL":
      return { ...state, status: "revealed", score: 0 };
    case "NEXT_SONG": {
      const next = pickRandom(state.songs, state.song ?? undefined);
      return { ...state, song: next, round: 0, status: "idle", guess: "", score: 0 };
    }
    default:
      return state;
  }
}

const initialState: GameState = {
  song: null,
  songs: [],
  round: 0,
  status: "idle" as GameStatus,
  guess: "",
  score: 0,
};

export default function GameClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const genre = searchParams.get("genre");
  const vibe = searchParams.get("vibe");
  const genreLabel = searchParams.get("genreLabel") || genre || vibe || "Bollywood";
  const nickname = searchParams.get("nickname") || "Anonymous";

  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    async function fetchSongs() {
      let res: Response;
      if (genre) {
        res = await fetch(`/api/songs?genre=${encodeURIComponent(genre)}`);
      } else if (vibe) {
        res = await fetch("/api/vibe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vibe }),
        });
      } else {
        router.push("/");
        return;
      }

      if (!res.ok) {
        console.error("Failed to load songs");
        return;
      }
      const data: { songs: Song[] } = await res.json();
      if (data.songs?.length) {
        dispatch({ type: "SET_SONGS", songs: data.songs });
      }
    }
    fetchSongs();
  }, [genre, vibe, router]);

  useEffect(() => {
    if (state.status !== "guessed" && state.status !== "revealed") return;
    if (!state.song) return;

    fetch("/api/leaderboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nickname,
        score: state.score,
        genre: genre || `vibe:${vibe}`,
        genreLabel,
        songTitle: state.song.title,
        artist: state.song.artist,
        roundGuessed: state.status === "guessed" ? state.round + 1 : 0,
      }),
    }).catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);

  const handleGuess = useCallback(
    (guess: string) => {
      if (!state.song) return;
      const correct = guess.toLowerCase().trim() === state.song.title.toLowerCase().trim();
      dispatch({ type: "GUESS", guess, correct });
      if (!correct && state.round >= ROUND_DURATIONS.length - 1) {
        dispatch({ type: "REVEAL" });
      }
    },
    [state.song, state.round]
  );

  const handleSkip = useCallback(() => {
    dispatch({ type: "SKIP" });
  }, []);

  const isFinished = state.status === "guessed" || state.status === "revealed";

  if (!state.song) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500">Loading songs…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">
            Playing as <strong>{nickname}</strong>
          </p>
          <p className="text-sm text-gray-500">{genreLabel}</p>
        </div>
        <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
          ← Change genre
        </Link>
      </div>

      {/* Round progress indicators */}
      <div className="flex gap-1.5">
        {ROUND_DURATIONS.map((dur, i) => (
          <div
            key={i}
            className={`flex-1 h-2 rounded-full transition-colors ${
              i < state.round
                ? "bg-gray-200"
                : i === state.round
                ? isFinished
                  ? state.status === "guessed"
                    ? "bg-green-400"
                    : "bg-red-400"
                  : "bg-indigo-400"
                : "bg-gray-100"
            }`}
            title={`Round ${i + 1}: ${dur}s`}
          />
        ))}
      </div>

      {/* Audio player */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <AudioPlayer previewUrl={state.song.previewUrl} round={state.round} />
      </div>

      {/* Guess input or result */}
      {!isFinished ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <p className="text-sm text-gray-500 mb-3">
            Round {state.round + 1} of {ROUND_DURATIONS.length} · Listening to first{" "}
            <strong>{ROUND_DURATIONS[state.round]}s</strong>
          </p>
          {state.guess && (
            <p className="text-sm text-red-500 mb-2">
              ✗ &quot;{state.guess}&quot; is not correct. Try again or skip.
            </p>
          )}
          <GuessInput
            songs={state.songs}
            onGuess={handleGuess}
            onSkip={handleSkip}
            placeholder="Guess the song name…"
          />
        </div>
      ) : (
        <div
          className={`rounded-2xl border p-6 shadow-sm ${
            state.status === "guessed"
              ? "bg-green-50 border-green-200"
              : "bg-red-50 border-red-200"
          }`}
        >
          <div className="flex gap-4 items-start">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={state.song.coverUrl}
              alt={state.song.album}
              className="w-20 h-20 rounded-xl object-cover shadow flex-shrink-0"
            />
            <div className="min-w-0">
              {state.status === "guessed" ? (
                <p className="font-bold text-green-700 text-lg mb-1">
                  🎉 Correct! +{state.score} points
                </p>
              ) : (
                <p className="font-bold text-red-600 text-lg mb-1">Better luck next time!</p>
              )}
              <p className="font-semibold text-gray-800 truncate">{state.song.title}</p>
              <p className="text-sm text-gray-500">{state.song.artist}</p>
              <p className="text-xs text-gray-400">{state.song.album}</p>
            </div>
          </div>

          <div className="mt-4">
            <AudioPlayer previewUrl={state.song.previewUrl} round={ROUND_DURATIONS.length - 1} />
          </div>

          <div className="flex gap-3 mt-5">
            <button
              onClick={() => dispatch({ type: "NEXT_SONG" })}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors"
            >
              Next Song →
            </button>
            <Link
              href="/leaderboard"
              className="px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 font-semibold rounded-xl text-center transition-colors"
            >
              🏆 Leaderboard
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
