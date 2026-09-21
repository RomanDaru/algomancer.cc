# Kontrola oracle exportu

Administrácia: `/admin/oracle-review` (záložka **Oracle review**). Prístup má iba prihlásený administrátor. Zdrojom je dodaný snapshot Algomancy.online z 2026-09-21 v `data/oracle/2026-09-21.json`; nejde o živú synchronizáciu s partnerom ani Discordom. Priložené pôvodné README a NOTICE zachovávajú pôvod a autorstvo dát.

Lokálne používaj `http://localhost:3000/admin/oracle-review` a Google prihlásenie. Vývojový server musí bežať na rovnakej adrese ako lokálne `NEXTAUTH_URL` (`npm run dev -- --hostname localhost --port 3000`). Predchádzajúci odkaz `127.0.0.1:3210` sa nezhodoval s Google callbackom `http://localhost:3000/api/auth/callback/google`. Po zjednotení adresy používateľ potvrdil funkčné prihlásenie; prihlasovanie ani admin oprávnenia sa nemenili.

## Použitie

1. Vyber kartu zo zoznamu alebo ju vyhľadaj podľa názvu/ID. Filter **With differences** obmedzí zoznam na návrhy s rozdielmi.
2. Porovnaj aktuálny obrázok, stĺpec **Current catalog** a upraviteľný návrh. Zlaté označenie upozorňuje na rozdiel. Kliknutím otvoríš obrázok v plnej veľkosti. Export neobsahuje nové obrázky; zobrazený obrázok je z Algomancer a môže byť starší než oracle text.
3. Oprav jednotlivé polia alebo pravidlový text. Poznámka slúži na vysvetlenie opravy alebo toho, čo treba overiť. Pôvodný text so symbolmi a upozornenia sú pod obrázkom.
4. **Approve draft & next** schváli upravený návrh; **Keep current & next** odmietne prebratie návrhu pre túto kartu; **Check later & next** ju odloží. Schválené a odložené karty sú dostupné cez filter. Ďalšia úprava schváleného návrhu zruší jeho schválenie.
5. **Download backup** uloží celý postup, aj rozpracované/odložené položky. **Restore backup** ho obnoví. **Download approved** uloží len platné schválené návrhy pre neskorší kontrolovaný import.

Schválenie **nemení živý katalóg, obrázky ani decky**. Ide o prípravu údajov, nie o publikovanie. Export návrhov nie je payload pre existujúce Card API a nesmie sa doň posielať priamo.

## Ukladanie a zastarané návrhy

Postup sa priebežne ukladá do localStorage tohto prehliadača, oddelene podľa administrátora a SHA-256 obsahu zdrojového snapshotu. Nie je uložený na serveri a automaticky sa neprenesie na iné zariadenie. Zálohu treba stiahnuť pred vymazaním dát prehliadača alebo zmenou zariadenia/originu (napr. `localhost` a `127.0.0.1` majú rôzne úložiská).

Pri nedostupnom/plnom úložisku editor výslovne hlási, že zmeny zostali iba v otvorenej záložke. Poškodenú uloženú kontrolu automaticky neprepíše. Zmenu z inej otvorenej záložky zachytí a vyžiada obnovenie uloženého postupu; aktuálny stav sa dá najprv stiahnuť.

Stránka načíta aktuálny katalóg pri otvorení/obnovení. Návrh uchováva pôvodné kontrolované polia, obrázok a rulesVersion. Ak sa tieto údaje zmenili, schválenie prestane platiť a treba znovu porovnať aktuálnu verziu. Otvorená stránka nesleduje zmeny databázy v reálnom čase. Budúci import musí opäť overiť aktuálny stav oproti tomuto základu tesne pred zápisom.

## Význam údajov

- Párovanie používa iba presné `algomancer_id`. Export má 536 položiek; pri kontrole aktuálneho katalógu bolo spárovaných 511 a zvyšných 25 bolo bez ID. Duplicitné/neznáme ID sa tiež vyčlenia; nevytvárajú sa automaticky nové karty.
- Prophecy je samostatná alternatívna cena: mana, affinity a podmienka naplnenia. Plný mana cost zostáva samostatne. Pravidlá sa neprepisujú domysleným názvom zóny ani jednotným časovaním. Alternatívna cena nemusí byť číselne nižšia než plná cena.
- Hodnoty `X` a nulová Prophecy cena sa zachovávajú. Prázdne štatistiky nejednotiek nie sú konvertované na vymyslené herné hodnoty.
- `Augment 1X` a `Graft1` sú rozdielne mechaniky. Prenášané atribúty Augmentu sú samostatné pole. Flying a ďalšie atribúty nie sú súčasťou subtype.
- Set a complexity predvolene zostávajú naše; štítky exportu nie sú spoľahlivou náhradou. Pri Resource/Token sa predvolene zachováva naša klasifikácia. Sporné combat stats spellov sa nepreberajú. Tieto prípady majú upozornenie.
- Text sa nečistí agresívnym odstraňovaním zátvoriek/symbolov; nevyjasnený zápis treba skontrolovať a upraviť ručne.

## Publikovanie schváleného súboru

Model, editor a zobrazenie podporujú explicitné `X`, samostatnú Prophecy cenu/podmienku, Prismite affinity a prenášané atribúty Augmentu. `Spell Unit` na detaile zobrazuje power/defense. Vyhľadávanie rozlišuje `mana:0`, `mana:X` a `prophecy:0`; hľadá aj text podmienky Prophecy. Mana curve používa plnú cenu karty, s oddeleným stĺpcom X.

Kontrolovaný import pre tento konkrétny schválený súbor:

```sh
node scripts/apply-oracle-review.cjs
node scripts/apply-oracle-review.cjs --apply
```

Prvý príkaz iba číta databázu. Druhý je publikačný zápis a patrí až za nasadenie kompatibilného kódu. CLI overí presný hash schváleného súboru, zdrojový batch, všetkých 340 schválení, ich baseline, obrázok a rulesVersion. V transakcii opäť kontroluje súbeh. Pred zápisom uloží úplné pôvodné dokumenty kariet, dotknuté review polia deckov a plán zmien ako BSON EJSON do ignorovaného `backups/oracle-import-<čas>/`. Karty aj označenia deckov sa zapíšu spoločne; chyba zruší celú transakciu. Opakovanie tej istej úspešnej dávky nevykoná ďalšie zmeny. Ak bola karta po importe ručne upravená, opakovanie ju odmietne prepísať.

Import nemení ID, obrázky, vlastníkov, viditeľnosť, zoznamy kariet v deckoch ani Game Logs. Zachová používateľovu opravu Animated Spark. Odstráni iba známe značky formátovania, rozbalí kompaktné affinity ceny a zachová význam zátvoriek/volieb. Pôvodný schválený text a Prophecy podmienka zostávajú v `oracleImport`; pôvodný JSON je nezmenený a `.gitattributes` chráni jeho bajty pred normalizáciou riadkov Gitom.

Po zápise treba obnoviť serverovú cache katalógu aj stránku `/cards` a porovnať produkčné API s plánom. Nasadenie samotného kódu neznamená import databázy. Stav konkrétneho vydania je v changelogu. Prístupové údaje sú iba v lokálnom prostredí; zálohy sa necommitujú. Obnovu z BSON zálohy vykonať iba po porovnaní s aktuálnymi dokumentmi, aby neprepísala novšie ručné zmeny.

## Overenie

- Jednotkové testy: samostatná Prophecy vrátane nuly, X, špeciálne typy/štatistiky, Augment/Graft, stale schválenia a validácia záloh.
- UI testy: oprava → schválenie → obnova, poznámky/odloženie, zrušenie schválenia po úprave, chyby ukladania a izolácia nejednoznačných ID.
- Serverová stránka: autorizácia pred čítaním katalógu; iba read-only načítanie pre administrátora.
- Lokálna kontrola prehliadačom: desktop/mobil, Prophecy, záloha a jej obnova; bez zápisov do Card API.

## Kontrola používateľom schváleného súboru — 2026-09-21 (stav pred importom)

Skontrolovaný súbor: [oracle-approved-drafts.json](../app/cards/oracle-approved-drafts.json). SHA-256 pôvodných bajtov: `18a1e7336e210774ed311967720cfe7bd2cd8c2541243533631ade74f74ad972`. Súbor zostal nezmenený.

Porovnanie používa dodaný oracle snapshot z 2026-09-21, aktuálne odpovede lokálneho `/api/cards` a verejného `https://www.algomancer.cc/api/cards` (verejný katalóg načítaný 2026-09-21 17:19:56 UTC). Kontrola neposielala žiadne aktualizácie kariet do API ani databázy. Výsledok nepotvrdzuje zhodu s prípadnými novšími zmenami partnera mimo dodaného snapshotu.

### Výsledok

- JSON je platný, bez duplicitných kľúčov. Formát, verzia, `purpose: review-only`, identita zdrojového snapshotu a validácia všetkých položiek prešli.
- Obsahuje **340 položiek**, všetky so stavom `approved`, s existujúcimi a jednoznačnými ID.
- Pri **žiadnej** z nich sa oproti uloženému základu nezmenili kontrolované polia, obrázok ani `rulesVersion`.
- Všetkých **171 zostávajúcich kariet** katalógu sa už zhoduje s návrhom vytvoreným reviewerom. Export teda pokrýva všetky zistené rozdiely v rámci 511 spárovaných kariet. Pri týchto 171 kartách export neobsahuje rozhodnutie používateľa; zhodu potvrdzuje porovnanie údajov.
- **339 schválených návrhov** je totožných s návrhom zo zdroja. Pri **Animated Spark** používateľ upravil `nontoken` na `non-token`; táto úprava zostáva zachovaná.
- Lokálny a verejný katalóg sa zhodujú v porovnávaných poliach, obrázkoch a revíziách. **Všetkých 340 schválených návrhov sa ešte líši od živého katalógu.** Schválenie a stiahnutie súboru nezrealizovalo import.
- Zhodou so zdrojovým návrhom sa myslí dohodnutý prevod v revieweri: naše set/complexity a osobitná klasifikácia helperov sa zachovávajú, sporné štatistiky spellov sa nepreberajú. Nejde o slepé prepísanie všetkých polí partnerovho JSON. Jeho 25 položiek bez nášho ID je mimo tejto dávky.

### Rozsah pripravených zmien

Počty sa prekrývajú: jedna karta môže meniť viac polí.

| Pole | Počet kariet |
| --- | ---: |
| Pravidlový text | 274 |
| Affinity | 99 |
| Podtypy | 85 |
| Prenášané atribúty Augmentu | 23 |
| Atribúty | 13 |
| Mana cost | 12 |
| Hlavný typ (`Unit` → `Spell Unit`) | 12 |
| Prophecy | 8 |
| Názov | 1 |
| Power/defense | 1 |

Pravidlový text sa doplní na 151 doteraz prázdnych kartách. Pri 73 z 274 textových rozdielov ide iba o medzery/riadkovanie; počet rozdielov nie je počtom zmien herných pravidiel. Jedenásť mana nákladov sa spresní z `0` na `X`, Collect Remains zo `4` na `2`. Generic Unit má návrh `X/X`. Názov Counter Theif sa opraví na Counter Thief, pričom ID `counter-theif` zostane rovnaké. Všetkých osem Prophecy cien a podmienok je zachovaných, vrátane nulovej ceny The Foretold.

### Technické body pred importom

1. Doplniť živé uloženie, admin editáciu, zobrazenie, filtrovanie a výpočty pre `X`, Prophecy a prenášané atribúty Augmentu. Dnešné číselné polia nemožno iba prepísať reťazcom `X` a Prophecy nemá vlastné pole v živom modeli.
2. Doriešiť reprezentáciu `prismite` affinity v 18 schválených návrhoch vrátane helperov. Živý model dnes definuje len sedem ostatných elementov; import ju nesmie ticho zahodiť alebo automaticky zlúčiť s iným elementom.
3. Overiť používanie `Spell Unit` vo všetkých spotrebiteľoch. Typ existuje, ale dnešné CardDetails nezobrazuje combat stats kartám, ktorých hlavný typ obsahuje `Spell`; samotné preklasifikovanie 12 kariet by tým skrylo ich štatistiky.
4. Správne spracovať zvyšnú symbolovú notáciu. V 32 schválených pravidlových textoch sú hranaté alebo zložené zátvorky; veľa z nich je zámerná cena či voľba. Nemať všeobecné pravidlo „odstrániť všetky zátvorky“. Konkrétne zvyšky `{i1}` sú na Floral Singularity, Void Memory a Wither and Bloom; Nothyr obsahuje `{Battle}`. Prophecy Divine Intervention navyše obsahuje `[Haste]`. Pred publikovaním použiť jednoznačné textové/symbolové zobrazenie bez straty významu a zachovať schválený zdrojový text.
5. Pri následnom importe opäť porovnať základ so živými údajmi, vytvoriť zálohu, zachovať stabilné ID/obrázky a použiť existujúce verzovanie a označenie dotknutých deckov. Toto overenie je prípravou, nie vykonaním importu.

Úplné rozdiely po kartách a oba načítané katalógy sú uložené lokálne v ignorovanom `backups/oracle-review-audit-2026-09-21/`; súhrn tejto kontroly je v tomto dokumente. Aplikačný kód sa pri kontrole nemenil; build ani aplikačné testy neboli potrebné.
