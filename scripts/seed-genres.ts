/**
 * One-time seed script to populate Firestore with songs for all preset genres.
 * Run with: npx ts-node --project tsconfig.json scripts/seed-genres.ts
 *
 * Requires environment variables set in .env.local
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { PRESET_GENRES } from "../types";

const app = initializeApp({
  credential: cert({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
});

const db = getFirestore(app);

interface DeezerTrack {
  id: number;
  title: string;
  preview: string;
  artist: { name: string };
  album: { title: string; cover_medium: string };
}

async function searchDeezer(query: string, limit = 50) {
  const url = `https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=${limit}`;
  const res = await fetch(url);
  const data = await res.json();
  return (data.data as DeezerTrack[])
    .filter((t) => t.preview)
    .map((t) => ({
      id: String(t.id),
      title: t.title,
      artist: t.artist.name,
      album: t.album.title,
      previewUrl: t.preview,
      coverUrl: t.album.cover_medium,
    }));
}

async function seed() {
  console.log("Seeding Firestore with preset genres…\n");

  for (const genre of PRESET_GENRES) {
    process.stdout.write(`Seeding ${genre.label} (${genre.slug})… `);
    const songs = await searchDeezer(genre.searchQuery, 50);
    if (songs.length === 0) {
      console.log("⚠️  No songs found");
      continue;
    }

    await db.collection("songs").doc(genre.slug).set({
      genre: genre.slug,
      label: genre.label,
      songs,
      updatedAt: new Date().toISOString(),
    });

    console.log(`✓ ${songs.length} songs`);

    // Throttle requests to be polite to Deezer API
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log("\nDone! All genres seeded.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
