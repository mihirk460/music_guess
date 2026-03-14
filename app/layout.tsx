import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Bollywood Heardle – Guess the Song",
  description: "A Heardle-style Bollywood music guessing game. Listen to short clips and guess the song!",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans bg-gradient-to-br from-indigo-50 via-white to-purple-50 min-h-screen">
        <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-20">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-bold text-indigo-700 text-lg">
              🎵 Bollywood Heardle
            </Link>
            <Link
              href="/leaderboard"
              className="text-sm text-gray-500 hover:text-indigo-600 transition-colors font-medium"
            >
              🏆 Leaderboard
            </Link>
          </div>
        </nav>
        <main className="max-w-2xl mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
