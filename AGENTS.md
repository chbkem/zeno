# Zeno
- Firebase (client SDK) handles auth + Firestore at users/{uid}/transactions, users/{uid}/settings/budgets and users/{uid}/settings/profile (onboarding monthly budget + focus categories, editable in Settings); config lives in src/lib/firebase.ts — user chose Firebase.
- Gemini is called from a server function (src/lib/ai.functions.ts) using the official @google/genai SDK with GEMINI_API_KEY — key stays server-side; model defaults to gemini-3.6-flash and can be overridden with GEMINI_MODEL (older models like gemini-2.5-flash are retired).
