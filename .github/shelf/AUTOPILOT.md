# SHELF AUTOPILOT, file version v1.01 (2026-10-03) | the Director's switch for the shelf merge bot

The snailcade half of THE STUDIO RUNS ON ITS OWN, part 2 (the Director's answer "A" on studio issue 321; studio doc 13 section 15.2). This public repository holds no token for the private studio, so its switch lives here, beside the bot, not in the studio's `studio/AUTOPILOT.md`. One line below, `shelfmerge: on` or `shelfmerge: off`, and nothing else on that line. Written by the Director, or by the Studio Head on his word (studio doc 13 section 11: `.github/shelf/` is the Studio Head's).

shelfmerge: on

What it does:
- `shelfmerge` **on:** `.github/shelf/shelf-merge.js` merges a seat's shelf pull request on its own when it only adds new versioned builds under `test/<slug>/` (a claude/ branch of this repository, nothing changed, moved or deleted, no build holding a login, key or token), then starts the shelf bot. Anything else (the front end, a title's folder, a lab, `test/index.html`) waits for the Director, with one comment saying why. The seat keeps the order: its shelf pull request opens only after its studio pull request merged. **off:** the bot merges and comments nothing; its run summary in the Actions tab says what it would do.

VERSION HISTORY (append only)
- v1.01 (2026-10-03): `shelfmerge: on`, the Director's word (2026-10-03: "Switch ON now: mergebot (this repo) and shelfmerge (snailcade)").
- v1.00 (2026-10-03): first cut, `shelfmerge: off` (part 2; the Director turns it on).
