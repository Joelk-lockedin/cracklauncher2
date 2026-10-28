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

- Keep uploaded High Seas HTML builds self-contained under public/games and launch them in an iframe; this preserves each version's original rendering and controls.
- Define game metadata and version order in src/lib/games.ts, newest first; launcher defaults and selectors must share this single source of truth.
- Use actual game screenshots for launcher covers, saved as small WebP files at src/assets/covers/<game id>.webp (games.ts resolves them by id); artwork must represent the playable builds and stay light so the library loads fast.
- Add Other games as one line in quickGames (src/lib/games.ts); files resolve by filename from src/lib/packed-games.json (gzip parts in public/games/packed/, launched through public/play.html), then src/assets/games/*.asset.json, then public/games. Missing covers get an automatic title card — keeps adding games fast.
- Never put a file over 10 MB in public/; big games are split into packed parts instead.
