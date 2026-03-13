"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ROUND_DURATIONS } from "@/types";

interface AudioPlayerProps {
  previewUrl: string;
  round: number; // 0-indexed
  onEnded?: () => void;
}

type PlayerState = "idle" | "loading" | "playing" | "paused" | "error";

export default function AudioPlayer({ previewUrl, round, onEnded }: AudioPlayerProps) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const bufferRef = useRef<AudioBuffer | null>(null);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [playerState, setPlayerState] = useState<PlayerState>("idle");
  const [progress, setProgress] = useState(0);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const clipDuration = ROUND_DURATIONS[round];

  // Preload audio buffer whenever previewUrl changes
  useEffect(() => {
    bufferRef.current = null;
    setPlayerState("idle");
    setProgress(0);

    let cancelled = false;

    async function loadBuffer() {
      setPlayerState("loading");
      try {
        const res = await fetch(`/api/audio-proxy?url=${encodeURIComponent(previewUrl)}`);
        if (!res.ok) throw new Error("Failed to fetch audio");
        const arrayBuffer = await res.arrayBuffer();
        if (cancelled) return;

        if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
          audioCtxRef.current = new AudioContext();
        }
        const decoded = await audioCtxRef.current.decodeAudioData(arrayBuffer);
        if (cancelled) return;
        bufferRef.current = decoded;
        setPlayerState("idle");
      } catch (err) {
        if (!cancelled) {
          console.error("Audio load error:", err);
          setPlayerState("error");
        }
      }
    }

    loadBuffer();
    return () => { cancelled = true; };
  }, [previewUrl]);

  const stopPlayback = useCallback(() => {
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    if (sourceRef.current) {
      try { sourceRef.current.stop(); } catch {}
      sourceRef.current = null;
    }
    setProgress(0);
    setPlayerState("idle");
  }, []);

  const play = useCallback(async () => {
    if (!bufferRef.current) return;
    stopPlayback();

    // Resume AudioContext if suspended (browser policy)
    if (audioCtxRef.current?.state === "suspended") {
      await audioCtxRef.current.resume();
    }
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }

    const source = audioCtxRef.current.createBufferSource();
    source.buffer = bufferRef.current;
    source.connect(audioCtxRef.current.destination);
    source.start(0);
    sourceRef.current = source;
    startTimeRef.current = Date.now();
    setPlayerState("playing");
    setProgress(0);

    // Progress bar update
    progressIntervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      setProgress(Math.min(elapsed / clipDuration, 1));
    }, 50);

    // Stop after clip duration
    stopTimerRef.current = setTimeout(() => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      try { source.stop(); } catch {}
      sourceRef.current = null;
      setProgress(1);
      setPlayerState("idle");
      onEnded?.();
    }, clipDuration * 1000);
  }, [clipDuration, stopPlayback, onEnded]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPlayback();
      audioCtxRef.current?.close();
    };
  }, [stopPlayback]);

  const isPlaying = playerState === "playing";
  const isLoading = playerState === "loading";
  const isError = playerState === "error";

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className="bg-indigo-500 h-3 rounded-full transition-all duration-100"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <div className="flex items-center gap-3 text-sm text-gray-500">
        <span>{clipDuration}s clip</span>
        <span>•</span>
        <span>Round {round + 1} of {ROUND_DURATIONS.length}</span>
      </div>

      {/* Play button */}
      <button
        onClick={isPlaying ? stopPlayback : play}
        disabled={isLoading || isError || !bufferRef.current}
        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-semibold rounded-full transition-colors shadow-md"
      >
        {isLoading ? (
          <>
            <LoadingSpinner />
            Loading…
          </>
        ) : isError ? (
          "Audio unavailable"
        ) : isPlaying ? (
          <>
            <StopIcon />
            Stop
          </>
        ) : (
          <>
            <PlayIcon />
            {progress > 0 ? "Play Again" : "Play Clip"}
          </>
        )}
      </button>
    </div>
  );
}

function PlayIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path d="M5.25 3A2.25 2.25 0 003 5.25v9.5A2.25 2.25 0 005.25 17h9.5A2.25 2.25 0 0017 14.75v-9.5A2.25 2.25 0 0014.75 3h-9.5z" />
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}
