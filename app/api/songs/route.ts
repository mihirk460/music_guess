import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { searchTracks } from "@/lib/deezer";
import { PRESET_GENRES } from "@/types";

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function GET(req: NextRequest) {
  const genre = req.nextUrl.searchParams.get("genre");

  if (!genre) {
    return NextResponse.json({ error: "Missing genre parameter" }, { status: 400 });
  }

  const genreDef = PRESET_GENRES.find((g) => g.slug === genre);
  if (!genreDef) {
    return NextResponse.json({ error: "Unknown genre" }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    const docRef = db.collection("songs").doc(genre);
    const doc = await docRef.get();

    if (doc.exists) {
      const data = doc.data()!;
      const updatedAt = new Date(data.updatedAt).getTime();
      if (Date.now() - updatedAt < CACHE_TTL_MS) {
        return NextResponse.json({ songs: data.songs });
      }
    }

    // Fetch fresh from Deezer
    const songs = await searchTracks(genreDef.searchQuery, 50);

    if (songs.length === 0) {
      return NextResponse.json({ error: "No songs found for this genre" }, { status: 404 });
    }

    await docRef.set({
      genre,
      label: genreDef.label,
      songs,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ songs });
  } catch (err) {
    console.error("Error in /api/songs:", err);
    return NextResponse.json({ error: "Failed to fetch songs" }, { status: 500 });
  }
}
