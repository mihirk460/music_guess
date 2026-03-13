import { NextRequest, NextResponse } from "next/server";

// Proxy Deezer audio previews to avoid browser CORS restrictions
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  // Only allow Deezer CDN URLs
  if (!url.startsWith("https://cdns-preview") && !url.includes("dzcdn.net")) {
    return NextResponse.json({ error: "Only Deezer preview URLs are allowed" }, { status: 403 });
  }

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch audio" }, { status: res.status });
    }

    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": res.headers.get("Content-Type") || "audio/mpeg",
        "Content-Length": String(buffer.byteLength),
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err) {
    console.error("Audio proxy error:", err);
    return NextResponse.json({ error: "Proxy error" }, { status: 500 });
  }
}
