import { createServerFn } from "@tanstack/react-start";

interface Input {
  month: string;
  income: number;
  expenses: number;
  balance: number;
  byCategory: Record<string, number>;
  budgets: Record<string, number>;
  recent: { type: string; amount: number; category: string; note: string; date: string }[];
}

// Check for Gemini API key - try multiple env var names
const GEMINI_KEY =
  process.env["GEMINI_API_KEY"] ||
  process.env["GOOGLE_API_KEY"] ||
  process.env["VITE_GEMINI_API_KEY"];

export const analyzeSpending = createServerFn({ method: "POST" })
  .inputValidator((input: Input) => {
    if (!input || typeof input.month !== "string") throw new Error("Invalid input");
    return { ...input, recent: (input.recent ?? []).slice(0, 60) };
  })
  .handler(async ({ data }) => {
    const key = GEMINI_KEY ?? process.env["GOOGLE_API_KEY"];
    if (!key)
      return {
        ok: false as const,
        text: "Gemini API key not configured. Ask admin to set GEMINI_API_KEY env var.",
      };
    const prompt = `You are Zeno, a friendly money coach for Nigerian undergraduate students. Amounts are in Naira (₦).
Analyse this student's spending for ${data.month} and reply in markdown with exactly these sections:
## Summary (2-3 sentences)
## Spending patterns (3 bullets)
## Ways to cut unnecessary spending (4 practical, Nigeria-campus-specific tips, e.g. cooking vs buying food, data bundles, transport)
## Next month target (one concrete number-based goal)
Keep it short, warm and practical.

Data: ${JSON.stringify(data)}`;
    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      },
    );
    if (!res.ok) {
      const msg =
        res.status === 429
          ? "Gemini is busy right now. Try again in a minute."
          : res.status === 403
            ? "The Gemini API isn't enabled for this key's Google Cloud project yet."
            : `Gemini error (${res.status}).`;
      return { ok: false as const, text: msg };
    }
    const json = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
    return { ok: true as const, text: text || "No insights returned." };
  });
