import { GoogleGenerativeAI } from "@google/generative-ai";

export interface SongSuggestion {
  title: string;
  artist: string;
}

export async function getSongsForVibe(vibe: string): Promise<SongSuggestion[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `You are a Bollywood music expert.
List 25 Bollywood songs that match this vibe or mood: "${vibe}"

Rules:
- Only include actual Bollywood (Hindi film) songs
- Prefer songs that are well-known and popular
- Return ONLY a valid JSON array, no extra text, no markdown code blocks
- Each item must have exactly two fields: "title" and "artist"

Example format:
[{"title":"Dilwale Dulhania Le Jayenge","artist":"Udit Narayan"},{"title":"Tum Hi Ho","artist":"Arijit Singh"}]`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  // Strip any markdown code blocks if present
  const cleaned = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "").trim();

  try {
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) throw new Error("Expected array");
    return parsed.filter(
      (item): item is SongSuggestion =>
        typeof item?.title === "string" && typeof item?.artist === "string"
    );
  } catch {
    throw new Error(`Failed to parse Gemini response as JSON: ${cleaned.slice(0, 200)}`);
  }
}
