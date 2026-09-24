# SNAILCADE
README version v1.00 (2026-09-24). Fixed filename; the version lives on this line.

The public test shelf of Snail Attack Studios, served by GitHub Pages and unlisted.

**This repo holds published builds only, never source folders, docs or law.** Source, docs and law live in the studio's private repo; a build reaches this shelf only after its title publishes it there.

## Layout
| Path | What |
|---|---|
| `index.html` | GENERATED: every playable build under `test/`, with its link and an on-screen version badge. Never edit by hand. |
| `test/<slug>/<file>` | one published build, a byte identical copy of the studio's published file (sha256 checked at copy). Immutable: a new build is a new file; nothing is deleted. |
| `.nojekyll` | serves every file exactly as committed |

## Play
Open `https://kynchaturvedi.github.io/snailcade/` for the list, or a build directly at `https://kynchaturvedi.github.io/snailcade/test/<slug>/<file>`.
