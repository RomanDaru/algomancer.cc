# Algomancy oracle text — an export for algomancer.cc

Generated 2026-09-21 from the Algomancy digital-client project
(<https://algomancy.online>). 536 cards.

**Read `NOTICE.md` first.** The card text and art are Caleb Gannon's work, used
with his permission for a free fan project on condition that he is credited.
That condition travels with this file.

## What this is for

Your `/api/cards` feed carries names, colours and images, and it is excellent at
those. What it does not carry — measured against it on 2026-09-21 — is:

| gap | your feed | this export |
|---|---|---|
| oracle text on the Light & Dark set | 9 of 163 | 164 of 166 |
| cards with a **dark** affinity pip | 1 | 86 |
| alternative-cost (Prophecy) banners | no field at all | 8, structured |
| X mana costs | flattened to `0` | preserved as `"X"` |

Everything here is transcribed **from the card scans**, then checked twice: once
by eye and once by a template matcher that reads the cost orb, the banner and
the timing glyph off all 527 images and reports where they disagree with the
text. It currently reports zero disagreements.

## How to join it

Every card that exists on algomancer.cc carries your own id in
`algomancer_id` (511 of them). A left join on that is the whole integration.

```js
const mine = await (await fetch('https://www.algomancer.cc/api/cards')).json()
const ours = require('./algomancy-oracle.json')
const byId = new Map(ours.map(c => [c.algomancer_id, c]))
const merged = mine.map(c => ({ ...c, oracle: byId.get(c.id) }))
```

## Fields

| field | |
|---|---|
| `name`, `algomancer_id`, `set` | identity; `algomancer_id` is null for the ~25 help cards, tokens and KSX promos you do not list |
| `mana_cost` | a string, because `"X"` is a real value |
| `affinity` | `{element: count}`, **including dark** |
| `affinity_string` | the same as printed pip letters — `l`=light, `d`=dark, `r`=fire, `g`=wood, `b`=water, `e`=earth, `m`=metal, `p`=prismite |
| `power`, `toughness` | null on non-units rather than `0` |
| `type_line` | as printed |
| `main_kind` | `unit` / `spell` / `resource` … |
| `timing` | `deploy` / `battle` / `haste` |
| `attributes` | Flying, Blessed, Piercing … |
| `virus`, `burst` | booleans — these print as type-line words, and you carry Virus in `timing.type` |
| `augment_transfers` | the attributes that TRANSFER when the card is applied as an augment mod. 23 cards. Printed as a cross glyph at the left of the type bar, which is why `type_line` shows a literal `[Augment]` on exactly those — that is the glyph, not a keyword |
| `text` | **canonical**, in our icon notation (see below) |
| `text_plain` | the same in words, for direct display |
| `alternative_cost` | the Prophecy banner, parsed: `{cost, mana, condition}` |
| `symbols_read_from_scan` | what the template matcher read off the image, independently of the text — useful as a second opinion |

## Two things to know about the text

**The notation.** `text` uses the icon vocabulary our client renders:
`[Augment]`, `[once]`, `[Switch1]` (the hexagon-of-arrows — you call it
`GRAFT1`), `[Switch]`, `[Haste]`, `[Battle]`, `{i}…{/i}` for italic reminder
text, `{/n}` for a line break, and `[e]`/`[l]`/… for element pips. `text_plain`
has all of that expanded, if you would rather not deal with it.

**Banners are not duplicated.** Where a card has a Prophecy banner, `text` keeps
it (it is canonical) but `text_plain` gives the body only, because
`alternative_cost` already carries it structured. **Ambush banners are the
exception** — `[Battle] Ambush [3b] …` is left inline in both, because nothing
here parses them into a field yet. There are 6 of those.

## Known-imperfect

- Two Light & Dark cards have no text because they print none.
- `complexity` is `Common` for the whole expansion — the real Simple/Complex
  glyph is read separately off the scans and is not merged in here.
- The expansion is pre-release, so treat it as provisional; it has moved
  eleven times since August and we now watch for that.
