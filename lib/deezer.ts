import { Song } from "@/types";

interface DeezerTrack {
  id: number;
  title: string;
  preview: string;
  artist: { name: string };
  album: { title: string; cover_medium: string };
}

interface DeezerSearchResponse {
  data: DeezerTrack[];
  error?: { message: string; code: number };
}

export async function searchTracks(query: string, limit = 50): Promise<Song[]> {
  const url = `https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=${limit}&output=json`;
  const res = await fetch(url, { next: { revalidate: 3600 } });

  if (!res.ok) {
    throw new Error(`Deezer API error: ${res.status}`);
  }

  const data: DeezerSearchResponse = await res.json();

  if (data.error) {
    throw new Error(`Deezer error ${data.error.code}: ${data.error.message}`);
  }

  // Filter tracks that have a preview URL
  return (data.data || [])
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

export async function searchSingleTrack(title: string, artist: string): Promise<Song | null> {
  const query = `${title} ${artist}`;
  const songs = await searchTracks(query, 5);
  return songs.length > 0 ? songs[0] : null;
}
