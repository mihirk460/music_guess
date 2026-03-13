export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  previewUrl: string;
  coverUrl: string;
}

export interface Genre {
  slug: string;
  label: string;
  emoji: string;
  searchQuery: string;
}

export interface LeaderboardEntry {
  id?: string;
  nickname: string;
  score: number;
  genre: string;
  genreLabel: string;
  songTitle: string;
  artist: string;
  roundGuessed: number; // 1-6, or 0 if not guessed
  timestamp: string;
}

export type GameStatus = "idle" | "playing" | "guessed" | "revealed";

export interface GameState {
  song: Song | null;
  songs: Song[];
  round: number; // 0-indexed (0 = round 1)
  status: GameStatus;
  guess: string;
  score: number;
}

export const ROUND_DURATIONS = [1, 3, 7, 15, 24, 30]; // seconds per round

export const PRESET_GENRES: Genre[] = [
  {
    slug: "bollywood-party",
    label: "Bollywood Party",
    emoji: "🎉",
    searchQuery: "bollywood party hits",
  },
  {
    slug: "bollywood-romantic",
    label: "Romantic Bollywood",
    emoji: "💕",
    searchQuery: "bollywood romantic love songs",
  },
  {
    slug: "bollywood-dance",
    label: "Dance & Item Songs",
    emoji: "💃",
    searchQuery: "bollywood dance item songs",
  },
  {
    slug: "bollywood-90s",
    label: "90s Bollywood Classics",
    emoji: "📼",
    searchQuery: "90s bollywood hits classic",
  },
  {
    slug: "bollywood-2020s",
    label: "Latest Bollywood Hits",
    emoji: "🔥",
    searchQuery: "bollywood hits 2023 2024",
  },
  {
    slug: "bollywood-retro",
    label: "Bollywood Retro",
    emoji: "🎵",
    searchQuery: "bollywood retro classic 60s 70s 80s",
  },
];
