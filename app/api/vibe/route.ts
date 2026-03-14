import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { getSongsForVibe } from "@/lib/gemini";
import { searchSingleTrack } from "@/lib/deezer";
import { Song } from "@/types";

function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

export async function POST(req: NextRequest) {
  let vibe: string;
  try {
    const body = await req.json();
    vibe = body.vibe?.trim();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!vibe || vibe.length < 3) {
    return NextResponse.json({ error: "Vibe must be at least 3 characters" }, { status: 400 });
  }

  const slug = slugify(vibe);
  const db = getAdminDb();
  const docRef = db.collection("vibe_cache").doc(slug);

  try {
    // Check cache
    const cached = await docRef.get();
    if (cached.exists) {
      return NextResponse.json({ songs: cached.data()!.songs, cached: true });
    }

    // Get song suggestions from Gemini
    const suggestions = await getSongsForVibe(vibe);

    if (suggestions.length === 0) {
      return NextResponse.json({ error: "No songs found for this vibe" }, { status: 404 });
    }

    // Resolve each suggestion to a Deezer track (run in batches of 5 to be polite)
    const songs: Song[] = [];
    for (let i = 0; i < suggestions.length; i += 5) {
      const batch = suggestions.slice(i, i + 5);
      const results = await Promise.all(
        batch.map((s) => searchSingleTrack(s.title, s.artist))
      );
      results.forEach((s) => { if (s) songs.push(s); });
    }

    if (songs.length === 0) {
      return NextResponse.json({ error: "Could not find Deezer previews for suggested songs" }, { status: 404 });
    }

    // Cache result
    await docRef.set({
      vibe,
      slug,
      songs,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ songs, cached: false });
  } catch (err) {
    console.error("Error in /api/vibe:", err);
    return NextResponse.json({ error: "Failed to process vibe" }, { status: 500 });
  }
}
