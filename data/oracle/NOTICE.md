# What is in `data/`, and whose it is

The code in this repository is under the MIT licence in the root `LICENSE`.
**This directory is not.** Nearly everything here is the work of
[Caleb Gannon](https://calebgannon.com/), the designer of Algomancy, and it is
included with his permission for this fan project, on one condition: that he
is credited. That credit is this file, the attribution page in the client, and
the line at the bottom of every README.

| what | whose |
|---|---|
| `cards/*.jpg` — the 528 card scans, base set and Light & Dark | Caleb Gannon's card art and card text |
| `cards/AlgomancyCards-OracleText.json` — the card transcription | his text; the base set transcribed by him, the expansion transcribed from his scans by this project, and corrected in place since |
| `rules/` — the Manual, the 2023 Rulebook, the glossary, the strategy guide, the dev-logs and articles | his rulebooks and his writing, mirrored from calebgannon.com and algomancy.io |
| `rulings/` — his answers to rules questions on the community Discord, curated | his words |
| `corpus/`, and the client's `printed.json` and `catalogue.json` | derived from the above by this project's build scripts; the same terms apply |
| `icons/` — element pips, cost circles and keyword markers | his glyphs, plus a few drawn to match them (the cost circles and the once marker) |

Everything derived from this directory in the running software — the card
art the client shows, the text the bot quotes, the reminder text under a
glossary term — is his under the same terms.

## What that means if you fork this

- Keep the credit. The attribution page and this notice stay.
- Do not sell, repackage or redistribute the art or the rules text on their
  own. The permission covers a free fan tool, not a product.
- Anything beyond that is a question for Caleb, not for this project.

## Buy the game

Algomancy is free to play here, has no economy, and makes nobody any money.
It exists because the physical game is good. Buy
[the base game](https://shop.calebgannon.com/products/algomancy-the-base-game),
or at least [the print-and-play](https://shop.calebgannon.com/products/algomancy-print-and-play-edition),
which is cheap and supports the designer.

## Other people's work in this repository

- The bundled starter decks in `client/server/default-decks.json` were built by
  **aramsunat** on [algomancer.cc](https://algomancer.cc/), with a link back to
  each.
- The sound cues in `client/ui/sfx/` are from Kenney's Interface Sounds pack,
  CC0 (`client/ui/sfx/LICENSE-kenney.txt`).
