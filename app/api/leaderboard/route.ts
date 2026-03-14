import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { LeaderboardEntry } from "@/types";

export async function GET(req: NextRequest) {
  const genre = req.nextUrl.searchParams.get("genre");
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") || "20"), 50);

  try {
    const db = getAdminDb();
    let query = db.collection("leaderboard").orderBy("score", "desc").orderBy("timestamp", "asc");

    if (genre) {
      query = db
        .collection("leaderboard")
        .where("genre", "==", genre)
        .orderBy("score", "desc")
        .orderBy("timestamp", "asc") as typeof query;
    }

    const snapshot = await query.limit(limit).get();
    const entries: LeaderboardEntry[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<LeaderboardEntry, "id">),
    }));

    return NextResponse.json({ entries });
  } catch (err) {
    console.error("Error in GET /api/leaderboard:", err);
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  let entry: Omit<LeaderboardEntry, "id" | "timestamp">;
  try {
    entry = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!entry.nickname || !entry.genre || entry.score === undefined) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Sanitize nickname
  const nickname = String(entry.nickname).trim().slice(0, 30) || "Anonymous";

  try {
    const db = getAdminDb();
    const docRef = await db.collection("leaderboard").add({
      nickname,
      score: Number(entry.score),
      genre: entry.genre,
      genreLabel: entry.genreLabel || entry.genre,
      songTitle: entry.songTitle || "",
      artist: entry.artist || "",
      roundGuessed: Number(entry.roundGuessed),
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ id: docRef.id }, { status: 201 });
  } catch (err) {
    console.error("Error in POST /api/leaderboard:", err);
    return NextResponse.json({ error: "Failed to save score" }, { status: 500 });
  }
}
