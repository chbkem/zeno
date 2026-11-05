# Zeno
- Firebase (client SDK) handles auth + Firestore at users/{uid}/transactions and users/{uid}/settings/budgets; config lives in src/lib/firebase.ts — user chose Firebase.
- Gemini is called from a server function with GEMINI_API_KEY — key stays server-side.
