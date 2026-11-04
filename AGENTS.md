<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
# Zeno
- Firebase (client SDK) handles auth + Firestore at users/{uid}/transactions and users/{uid}/settings/budgets; config lives in src/lib/firebase.ts — user chose Firebase.
- Gemini is called from a server function with GEMINI_API_KEY — key stays server-side.
