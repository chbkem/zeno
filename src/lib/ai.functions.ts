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

export const analyzeSpending = createServerFn({ method: "POST" })
  .inputValidator((input: Input) => {
    if (!input || typeof input.month !== "string") throw new Error("Invalid input");
    return { ...input, recent: (input.recent ?? []).slice(0, 60) };
  })
  .handler(async ({ data }) => {
    const key = process.env["GEMINI_API_KEY"];
    if (!key) return { ok: false as const, text: "Gemini API key is not set up yet." };
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
      const msg = res.status === 429 ? "Gemini is busy right now. Try again in a minute." : `Gemini error (${res.status}).`;
      return { ok: false as const, text: msg };
    }
    const json = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
    return { ok: true as const, text: text || "No insights returned." };
  });
