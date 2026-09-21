# Aktualizácie kariet z obrázkov

Potvrdené používateľom 2026-09-20. Táto legenda slúži na prípravu a kontrolu údajov; obrázky ani tento dokument samy nespúšťajú import do databázy.

## Čítanie údajov

- Veľké číslo vľavo hore je mana cost. Malé symboly elementov pri coste určujú affinity a ich počet, vrátane Dark a Light. Affinity neodvodzovať iba z farby rámu či príslušnosti k setu.
- Hlavný typ, podtyp a atribúty ukladať oddelene: napríklad `Nature Unit` má `mainType: Unit`, `subType: Nature`; `Flying`, `Unaware` a ďalšie viditeľné atribúty patria do `typeAndAttributes.attributes`.
- Plus v šesťuholníku označuje **Augment**. `1x` pri Augmente znamená, že tento Augment efekt sa môže spustiť len raz. Bez ďalšieho podkladu nepridávať reset „za kolo“ alebo „za hru“.
- Kruhové šípky označujú **Graft**; jednotka v tomto symbole označuje **Graft 1**. `Augment 1x` a `Graft 1` sú odlišné mechaniky.
- Súčasný model ukladá schopnosti ako text. Pri prepise zachovať označenia `AUGMENT:`, `AUGMENT 1X:`, `GRAFT:` a `GRAFT1:` spolu s presným pravidlovým textom. Ide o popis karty, nie implementáciu herného enginu.
- Nečitateľné symboly alebo údaje označiť na kontrolu; neznámu affinity nezamieňať za potvrdenú nulu. Pri kompletnej zmene skontrolovať aj odstránenie pôvodných schopností a atribútov.

## Názov súboru a dátum zdrojovej zmeny

- Názov dodaného obrázka obsahuje meno karty a dátum/čas jej poslednej zmeny podľa autora podkladu. Nie je to automaticky EXIF ani čas uloženia súboru do nášho projektu.
- `Sarcophage_30-12_11-26.jpg` znamená podľa potvrdenia používateľa **30. december 2025, 11:26**. Rok bol doplnený používateľom; pri ďalších súboroch bez roka ho nemožno hádať.
- Odporúčaný budúci názov: `Sarcophage_2025-12-30_11-26.jpg`. Pôvodný súbor sa touto zmenou nepremenúva.
- Časové pásmo zdrojového času zatiaľ nebolo určené. Bez neho neprevádzať údaj na UTC ani nepridávať `Z`.
- Zdrojový dátum uchovať v podkladoch k importu. Je oddelený od interného ID karty, `rulesVersion` a času aktualizácie v našej databáze. Samotný dátum nerozhoduje, ktorú kartu nový obrázok nahrádza.

## Podpora a hranice súčasnej prípravy

- Model, admin formulár a výpočty affinity podporujú `fire`, `water`, `earth`, `wood`, `metal`, `dark`, `light`. Chýbajúce hodnoty starších záznamov sa pri výpočtoch správajú ako nula; skutočné chýbajúce údaje musí doplniť kontrolovaný import.
- Zmena affinity cez admin aktualizáciu je zmena pravidiel: zvýši `rulesVersion` a označí dotknuté decky na kontrolu. Nové hodnoty sa nedopĺňajú automaticky do existujúcich kariet.
- Doterajší `scripts/algomancy-extractor/extract.js` vytvára zámerne neúplné záznamy bez affinity, schopností a atribútov. Jeho výstup nie je vhodný na úplné prepísanie existujúcich kariet. Overená dávka nižšie má vlastný kontrolovaný postup.
- Pri premenovaní alebo úplnom prepracovaní treba potvrdiť väzbu starej a novej karty. Pred importom pripraviť porovnanie a uchovať pôvodné údaje. Príprava z 2026-09-20 karty nemenila; aktualizácia desiatich kariet prebehla 2026-09-21.

## Dokončená dávka 2026-09-21

Podklad: [presný prepis, zdrojové dátumy a SHA-256 obrázkov](../scripts/card-updates/2026-09-21.json). Všetkých desať existujúcich záznamov bolo aktualizovaných v nakonfigurovanej databáze, s pôvodným `originalId`, MongoDB `_id` a poradovým indexom. `rulesVersion` stúplo z 1 na 2. Nové obrázky sú na samostatných adresách v Cloudinary; pôvodné obrázky zostali zachované.

| Karta | Cost | Power/Defense | Affinity | Timing / atribúty |
| --- | --- | --- | --- | --- |
| Sarcophage | 3 | 2/4 | Dark 1 | Virus |
| Stalwart Sentinel | 1 | 1/1 | Light 1 | Standard |
| Debt Plant | 3 | 3/2 | Light 1, Wood 1 | Standard |
| Deathcoil Construct | 5 | 3/2 | Light 1, Metal 1 | Standard |
| Blob of the Dark Order | 4 | 3/4 | Light 1 | Standard |
| Greed Angel | 2 | 3/3 | Light 2 | Standard, Flying |
| Feed to Hooba | 2 | — | Light 1 | Battle, Spell |
| Deferral Drone | 2 | 2/2 | Light 1, Metal 1 | Standard |
| Tithe Enforcer | 7 | 4/6 | Light 2 | Haste, Flying |
| Proph | 2 | 2/1 | Light 2 | Standard |

- Prepísané sú celé schopnosti vrátane rozlíšenia `AUGMENT 1X` a `GRAFT1`. Graft zostáva na mieste za podmienkou spustenia. Tithe Enforcer nemá ďalší pravidlový text; Piercing na Blob of the Dark Order je iba dočasne udelená schopnosť, nie trvalý atribút.
- Flying je samostatný atribút Greed Angel a Tithe Enforcer. Detail karty teraz zobrazuje atribúty aj textovo. Admin ponúka aj existujúcu hodnotu komplexnosti `Complex`.
- Dvojitá šípka v texte Debt Plant je rozpísaná ako „the haste step“. Zlatý symbol znamená `Complex`; Sarcophage, Debt Plant a Deathcoil Construct majú túto hodnotu. Význam oboch symbolov potvrdzuje [manuál vydavateľa](https://calebgannon.com/wp-content/uploads/Algomancy-manual-copy.pdf), časti Haste a Anatomy of an Algomancy Card.
- Názov a identifikátor setu zostávajú pôvodné (`Unknown Set` / `unknown`): konkrétny názov expanzie nebol dodanými obrázkami jednoznačne stanovený.
- Zdrojový rok Sarcophage je potvrdený ako 2025. Štyri súbory s `12-8-26` majú rok 2026. Stalwart Sentinel, Feed to Hooba, Deferral Drone, Tithe Enforcer a Proph majú zatiaľ `year: null`; dátum ani časové pásmo sa neodhadovali. To neblokuje použitie nových údajov kariet.
- Dvanásť dotknutých deckov (11 verejných) dostalo existujúce `needsReview` a príslušné `reviewFlags`, vrátane kariet v sideboarde. Ich zloženie, vlastníctvo, viditeľnosť a výsledky sa tým nemenia.
- Lokálna záloha pôvodných kariet, stavu kontroly deckov, manifestu, adries obrázkov a výsledku transakcie je v `backups/2026-09-21-card-images-1789962223831/`. Zálohy zostávajú mimo Gitu. Pri prípadnej obnove meniť iba dotknuté polia a najprv skontrolovať neskoršie úpravy; neprepisovať celé decky.

### Opakovateľný postup

[Importný skript](../scripts/apply-card-image-update.cjs) vyžaduje presnú zhodu ID a názvu existujúcej karty, kontroluje hash lokálneho obrázka a validuje výsledok schémou karty. Predvolený režim iba číta. Zdrojové JPG musia byť lokálne v `public/images/cards/`; nie sú súčasťou Gitu.

```powershell
node scripts/apply-card-image-update.cjs scripts/card-updates/2026-09-21.json
node scripts/apply-card-image-update.cjs scripts/card-updates/2026-09-21.json --apply
node --test scripts/apply-card-image-update.test.cjs
```

Režim `--apply` používa existujúce MongoDB a Cloudinary nastavenia. Uloží zálohu, nahrá obrázky bez prepisovania pôvodných a zapíše karty aj označenie deckov v jednej databázovej transakcii. Ak sa karta medzitým zmenila, zápis odmietne. Opakovanie identickej dávky nepridáva revízie ani duplicitné označenia. Dávka je určená pre skontrolované karty s rovnakým názvom, elementom a timingom; nie je to univerzálny importér ľubovoľných zmien.

CLI beží mimo Next requestu, preto samo neinvaliduje jeho cache. Lokálny preview bol reštartovaný s novou fetch cache; pôvodná cache bola presunutá do zálohy. Po aktualizácii boli skontrolované lokálne aj verejné `/api/cards`: všetkých desať kariet už vracalo nové údaje a adresy obrázkov. Budúce CLI aktualizácie musia tiež overiť obnovu cache (bežná platnosť katalógu je jedna hodina, alebo ju invaliduje autentifikovaná admin úprava).

Overenie: integračné testy transakcie, návratu pri chybe, odmietnutia zmeneného/chýbajúceho záznamu a opakovania; testy admin formulára, affinity a existujúcej aktualizačnej služby; porovnanie API s manifestom; presná zhoda všetkých desiatich stiahnutých Cloudinary originálov s hashmi dodaných JPG; kontrola zachovaných ID a označenia deckov. Dáta a obrázky sú aktualizované online; zmeny aplikačného kódu zostávajú lokálne do vydania.
