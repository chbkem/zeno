import { createServerFn } from "@tanstack/react-start";
import { GoogleGenAI } from "@google/genai";

interface Input {
  month: string;
  income: number;
  expenses: number;
  balance: number;
  byCategory: Record<string, number>;
  budgets: Record<string, number>;
  profile?: { monthlyBudget?: number; focusCategories?: string[] };
  recent: { type: string; amount: number; category: string; note: string; date: string }[];
}

// Gemini API key - server only. Supports the common env var names.
const GEMINI_KEY =
  process.env["GEMINI_API_KEY"] ||
  process.env["GOOGLE_API_KEY"] ||
  process.env["VITE_GEMINI_API_KEY"];

// Retired models are common (gemini-2.5-flash already is), so allow overriding
// without a code change.
const GEMINI_MODEL = process.env["GEMINI_MODEL"] || "gemini-3.6-flash";

function errorText(error: unknown, model: string): string {
  const status = (error as { status?: number }).status;
  if (status === 429) return "Gemini is busy right now. Try again in a minute.";
  if (status === 403)
    return "The Gemini API isn't enabled for this key's Google Cloud project yet.";
  if (status === 404) return `The ${model} model isn't available for this key.`;
  if (status === 503) return "Gemini is under heavy demand right now. Try again in a minute.";
  console.error("Gemini request failed", error);
  return "Couldn't reach Gemini. Try again.";
}

export const analyzeSpending = createServerFn({ method: "POST" })
  .inputValidator((input: Input) => {
    if (!input || typeof input.month !== "string") throw new Error("Invalid input");
    return { ...input, recent: (input.recent ?? []).slice(0, 60) };
  })
  .handler(async ({ data }) => {
    if (!GEMINI_KEY)
      return {
        ok: false as const,
        text: "Gemini API key not configured. Ask admin to set GEMINI_API_KEY env var.",
      };

    const budget = data.profile?.monthlyBudget ?? 0;
    const focus = data.profile?.focusCategories ?? [];
    const context = [
      budget > 0 ? `Monthly budget: ₦${budget.toLocaleString("en-NG")}` : "Monthly budget: not set",
      focus.length > 0 ? `Focus categories: ${focus.join(", ")}` : "Focus categories: not set",
    ].join(". ");

    const prompt = `You are Zeno, a friendly money coach for Nigerian undergraduate students. Amounts are in Naira (₦).
Analyse this student's spending for ${data.month} and reply in markdown with exactly these sections:
## Summary (2-3 sentences)
## Spending patterns (3 bullets)
## Ways to cut unnecessary spending (4 practical, Nigeria-campus-specific tips, e.g. cooking vs buying food, data bundles, transport)
## Next month target (one concrete number-based goal)
Keep it short, warm and practical.

Student profile: ${context}. Treat their monthly budget as the baseline for whether they are on track, pay extra attention to their focus categories, and use the budget in the next-month target.

Data: ${JSON.stringify(data)}`;

    const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });
    try {
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: { temperature: 0.7 },
      });
      const text = response.text?.trim();
      return { ok: true as const, text: text || "No insights returned." };
    } catch (error) {
      return { ok: false as const, text: errorText(error, GEMINI_MODEL) };
    }
  });
