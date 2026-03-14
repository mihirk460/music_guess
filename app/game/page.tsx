import { Suspense } from "react";
import GameClient from "./GameClient";

export default function GamePage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500">Loading…</p>
        </div>
      }
    >
      <GameClient />
    </Suspense>
  );
}
