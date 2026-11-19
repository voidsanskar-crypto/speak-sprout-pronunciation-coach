<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules (SpeakUp)
- All learner progress lives in localStorage via `src/hooks/use-progress.ts` (useSyncExternalStore); pure rules live in `src/lib/progress.ts` so they stay testable. No sign-in or database by design.
- Speech uses browser APIs only (SpeechSynthesis for audio, Web Speech recognition for the mic) in `src/lib/speech.ts` and `src/hooks/use-speech-recorder.ts`; scoring is local fuzzy matching in `src/lib/scoring.ts`.
- Each seed phrase stores IPA as one space-separated token per word; `src/lib/progress.test.ts` enforces the alignment.
- Translations come from Lovable AI via the `translatePhrases` server function, one phrase at a time, cached per language in localStorage — so any language works without hand-written copies.
