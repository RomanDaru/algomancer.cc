# Algomancy.online: integračný plán a TODO

Dátum: 2026-09-20

Stav: zdokumentované produktové rozhodnutia a návrh architektúry. Používateľ samostatne odsúhlasil lokálnu prípravu detailu decku: texty osobnej kópie a taby `Deck / Stats / Results`. Tieto UI úpravy sú implementované; `Results` zatiaľ obsahuje iba informáciu o nedostupnom sledovaní výsledkov. Serverová integrácia, nový výsledkový model, prijímač a prepojenie účtov sa nezačali. Pre ne najprv doplníme potrebné odpovede a odsúhlasíme implementačný rozsah.

## 1. Cieľ a hranice

Hráč tvorí a upravuje deck na Algomancer.cc a hrá na Algomancy.online. Výsledky a štatistiky na detaile patria konkrétnemu decku, nie pilotovi. Verejný deck zbiera aj overené výsledky anonymných hráčov bez prepojenia účtov. Voliteľné prepojenie účtov môže navyše umožniť osobné Game Logs; nesmie byť podmienkou zaznamenania výsledku verejného decku.

Podľa používateľa už Algomancy.online podporuje import vložením odkazu na verejný Algomancer deck. Vývojár druhej platformy následne potvrdil, že z odkazu vyberie deck ID a načíta `https://www.algomancer.cc/api/decks/<id>`. Import teda podľa jeho vyjadrenia používa existujúce API, nie parsovanie HTML. Túto funkciu nebudeme automaticky nahrádzať novým exportom. Správanie importu zatiaľ nebolo nezávisle otestované.

Obe platformy si ponechajú vlastné prihlasovanie. „Login with Algomancer“ nie je súčasťou aktuálneho rozsahu. Prepojenie účtov nie je podmienkou importu verejného decku ani hrania.

Serverové integračné práce zostávajú v dokumentačnej fáze, bez nových endpointov, modelov, migrácií, integračného modulu, zmien NextAuth či živého prijímača výsledkov. Odsúhlasená príprava UI zahŕňa texty osobnej kópie a oddelenie existujúceho obsahu detailu do tabov, s pripraveným miestom pre Results.

## 2. Dohodnuté produktové pravidlá

| Oblasť | Dohoda |
| --- | --- |
| Automatický import | Prepínač a prepojenie sa týkajú prípadného osobného importu do Game Logs. Verejné deckové výsledky od nich nezávisia. |
| Priradenie výsledku | Výsledok na detaile patrí decku, s ktorým sa hralo. Nepotrebujeme identifikovať pilota a autorovi decku tým nepribudne osobná odohraná hra. |
| Verejné štatistiky decku | Všetky platne importované hry s verejným deckom prispievajú do jeho verejných súhrnných štatistík bez ohľadu na súkromie logu alebo hráčovu voľbu komunitného zdieľania. |
| Súkromie logov | Nové automatické Game Logs sú predvolene súkromné. Verejný súhrn decku sám osebe nezverejňuje log, identitu hráča, poznámky ani zoznam jeho hier. |
| Ostatné komunitné štatistiky | Existujúce nastavenie používateľa zostáva relevantné. Povinné započítanie vyššie je dohodnuté pre verejné štatistiky použitého verejného decku, nie ako plošné zverejnenie všetkých údajov. |
| Osobná kópia | Kópia má nové deck ID a vlastníka, samostatné štatistiky a nepreberá históriu pôvodného decku. Používateľ ju môže nastaviť ako súkromnú. |
| Súkromná kópia | Cieľom je hranie s vlastnou súkromnou kópiou a jej osobnými štatistikami. Technický prenos do hry musí byť osobitne autorizovaný; samotný verejný odkaz nesmie odhaliť súkromný deck. |
| Zmena na Algomancy.online | Ak odohrané zloženie nezodpovedá importovanej verzii od nás, automatický výsledok sa nezapíše. |
| Porovnávacia verzia | Porovnáva sa verzia importovaná pred hrou, nie aktuálny obsah decku pri doručení výsledku. Neskoršia úprava na Algomancer nesmie zneplatniť už odohranú platnú hru. |
| História | Zachováme všetky verzie od zavedenia verzovania. Staršie výsledky zostávajú pri príslušnej verzii; plánované zobrazenie umožní všetky alebo aktuálnu verziu. |
| Spätná väzba | Každá používateľská integračná akcia aj výsledok spracovania musí vysvetliť, čo sa stalo alebo nestalo a prečo. Odmietnutý import nesmie potichu zmiznúť. |

Rozhodnutie o verejných štatistikách decku výslovne nahrádza skorší návrh podmieňovať ich hráčovým súhlasom s komunitnými štatistikami. Rozhranie musí tento rozdiel jasne vysvetliť ešte pred zapnutím automatického importu.

„Všetky hry“ zahŕňa aj platné výsledky anonymných a neprepojených hráčov s verejným deckom, nezávisle od osobného prepínača importu. Partner musí potvrdiť výsledok a odohrané zloženie; anonymný hráč neznamená neoverený zdroj výsledku. Kvalifikácia prerušených hier zostáva otvorená.

### Detail decku: Deck / Stats / Results

Najnovšie rozhodnutie používateľa: presne tri taby `Deck`, `Stats`, `Results`, bez prepínača `My results / Public results` a bez filtrovania podľa pilota. Verejný deck ukazuje svoje verejné výsledky a súhrny; súkromný deck svoje výsledky a súhrny iba oprávnenému vlastníkovi. Kto chce oddelenú osobnú históriu, vytvorí si vlastnú súkromnú kópiu s novým deck ID. Toto rozhodnutie nahrádza skorší návrh hráčskych pohľadov na detaile decku.

Obsah tabov je upresnený používateľom: `Deck` obsahuje decklist, obrázky kariet, sideboard, opis a prípadné video; po presunutí štatistík využíva celú dostupnú šírku. `Stats` obsahuje výhradne dnešnú sekciu `Deck Statistics` (existujúci komponent `DeckStats`, analýza zloženia decku); na širokej obrazovke rozloženú do dvoch stĺpcov bez zmeny výpočtov. `Results` je určený odohraným výsledkom; prípadné súhrny úspešnosti patria sem, nie do `Stats`. Žiadne pridávanie win rate, výhier či prehier do tabu `Stats`.

Taby sú implementované ako samostatná prezentačná úprava. Predvolený je `Deck`, fungujú šípky a Home/End, nastavenie zobrazenia kariet zostáva pri prepínaní zachované. Export obrázka aj z iného tabu zobrazí Deck a zachytí decklist. `Results` zatiaľ uvádza `Results tracking for this deck is not available yet.` Bez fiktívnych nulových štatistík, nových výsledkových požiadaviek alebo tlačidla na neimplementovaný zápis. Všetky taby sú za existujúcou kontrolou prístupu k decku. Budúce deckové výsledky nesmú zverejniť identitu hráča, jeho súkromné poznámky alebo osobný Game Log.

## 3. Zistený stav repozitára

Preskúmaný bol lokálny kód v `algomancer.gg`, nie produkčná databáza. Následne bol staticky preskúmaný aj verejný repozitár druhej platformy; výsledky a presný commit sú v časti 4. Produkčné nasadenie partnera nebolo overené.

| Oblasť | Súčasný stav a dôsledok |
| --- | --- |
| Prihlasovanie | NextAuth v4, Google a email/heslo, MongoDB, JWT sessions. Existujúce správanie nemeníme. |
| Deck model | Main deck a sideboard obsahujú `cardId` a `quantity`. Model nemá uloženú históriu revízií ani explicitný herný formát. |
| Deck API | Kontroluje prístup k súkromným deckom, ale detail vracia aj údaje o autorovi a interné polia. Nie je to minimálny integračný kontrakt. |
| Serializácia | Odstraňuje `viewedBy` a `likedBy`; nenahrádza explicitný zoznam povolených integračných polí. |
| Exporty | Text a TTS JSON podporujú main deck aj sideboard. Neznáme karty môžu vynechať; túto vlastnosť nepreberať do overovania herného decku. |
| ID kariet | Aplikačné `Card.id` pochádza z `originalId`, nie z MongoDB `_id`. Príklad: `a-fast-pile-of-rocks`. Niektoré importné skripty odvodzujú ID z názvu. |
| Pravidlá kariet | Existuje `rulesVersion`, ale samotné číslo nezaručuje dostupnosť historického obsahu pravidiel. |
| Kopírovanie deckov | Overené staticky: tlačidlo vytvára nové ID pod prihláseným používateľom, predvolene súkromné, s main deckom aj sideboardom a bez prevzatia výsledkov. UI však používa všeobecné POST `/api/decks`, nie samostatný copy endpoint; detaily nižšie. |
| Game Logs | Jeden záznam patrí jednému hráčovi. Výsledky sú `win`, `loss`, `draw`; formáty `constructed`, `live_draft`; typy hier `1v1`, `2v2`, `ffa`, `custom`. |
| Chýbajúce integračné údaje | Game Logs nemajú externé match ID, pôvod, overenie ani nemennú revíziu decku. |
| Vytvorenie logu | Validácia, súkromie, elementy a achievementy sú čiastočne v API route. Samotné volanie `gameLogService.createGameLog` nezabezpečí celý dnešný postup. |
| Štatistiky | Agregácie počítajú hráčske logy, nie jedinečné fyzické zápasy. Dvaja účastníci môžu predstavovať dva výsledky jednej hry. |
| Súkromie štatistík | Dnešné agregácie používajú `isPublic` a `includeInCommunityStats`. Nové pravidlo verejných štatistík decku vyžaduje cielenú úpravu, nie plošné obídenie súkromia. |

Kľúčové súbory:

- [Autentifikácia](../../app/api/auth/[...nextauth]/route.ts)
- [Deck model](../../app/lib/db/models/Deck.ts), [Card model](../../app/lib/db/models/Card.ts)
- [Deck API](../../app/api/decks/[id]/route.ts), [copy API](../../app/api/decks/[id]/copy/route.ts)
- [Deck service](../../app/lib/services/deckService.ts), [serializácia](../../app/lib/utils/deckSerialization.ts)
- [TTS export](../../app/api/tts/export/[id]/route.ts), [textový export a menu](../../app/components/DeckOptionsMenu.tsx)
- [GameLog model](../../app/lib/db/models/GameLog.ts), [GameLog typy](../../app/lib/types/gameLog.ts)
- [Vytvorenie logu](../../app/api/game-logs/route.ts), [úpravy logu](../../app/api/game-logs/[id]/route.ts)
- [GameLog service](../../app/lib/services/gameLogService.ts), [agregácie](../../app/lib/db/services/gameLogStatsDbService.ts)
- [Nastavenie používateľa](../../app/api/user/profile/route.ts)

## 4. Čo ukazuje dodaný JSON

### Overenie existujúceho „Copy Deck“ na Algomancer

Statická kontrola 2026-09-20: `DeckOptionsMenu.handleCopyDeck` posiela nový payload do POST `/api/decks`. Server vyžaduje prihlásenie a vlastníka nastaví zo session. Databázová služba vytvorí nový dokument s novým ID. UI nastavuje `isPublic: false`, názov s `(Copy)` a prenáša main deck, sideboard, opis, badges aj YouTube URL. Likes/views sa neprenášajú; existujúce Game Logs zostávajú viazané na pôvodné deck ID. Po úspechu sa otvorí detail novej kópie. Toto už funkčne zodpovedá osobnej súkromnej kópii; automatické online logy tým ešte nevznikajú.

Samostatný POST `/api/decks/[id]/copy` existuje, ale toto tlačidlo ho nepoužíva. Tento endpoint číta zdroj zo servera, overuje jeho verejnosť/vlastníctvo, používa názov `(Copy from {owner})` a YouTube URL vynechá. Pred prípadným zjednotením treba vedome dohodnúť tieto rozdiely; zmena textu tlačidla nevyžaduje zmenu endpointu.

Samostatne odsúhlasená a implementovaná úprava textov: tlačidlo `Make a personal copy`, priebeh `Creating your copy…`, potvrdenie `Private copy saved to your decks.` Pri položke je viditeľné vysvetlenie: `Creates a private copy in your account. Existing game results are not copied.` API, prenášané údaje a presmerovanie sa nemenili. Správanie kopírovania bolo overené čítaním kódu, nie vytvorením decku v produkcii.

### Potvrdenie spôsobu importu od partnera

Dňa 2026-09-20 používateľ sprostredkoval odpoveď vývojára: „The import fetches `https://www.algomancer.cc/api/decks/<id>` from the link. It just pulls the link to find the ID, then uses the API“.

Tým bola zodpovedaná otázka API verzus HTML aj konkrétna adresa. Následná kontrola repozitára nižšie dopĺňa používané polia, serverový fetch a spracovanie sideboardu aj chýb. Samotná správa nepotvrdzovala podporu účtov alebo výsledkov.

Existujúci endpoint už má externého konzumenta. Pri budúcich zmenách zachovať jeho kompatibilitu alebo s partnerom dohodnúť migráciu. Prípadný minimálny verzovaný kontrakt navrhnúť podľa skutočných potrieb; nový endpoint nie je automatickou podmienkou pokračovania. Toto potvrdenie nemení potrebu revízií a overenia odohraného zloženia pre automatické výsledky.

### Dodaná ukážka exportu

Používateľ poskytol export `Aristocrats` s označením `format: algomancy-deck`, `version: 1`, 15 názvami kariet po 2 kusy (30 kariet). Obsahuje aj `description`, `author`, `cover`, `coverImage`, `source`, `visibility`, vlastné UUID `id`, `url`, časové údaje a `generator.app: algomancy.online`.

- Export pracuje s názvami kariet a množstvami. Nedokazuje, aké ID používa ich engine interne.
- `source` odkazuje na Algomancer deck `6a899bdec6cbe670c03742f7`.
- UUID exportu je odlišné od nášho deck ID; pravdepodobne identifikuje ich kópiu.
- `version: 1` označuje formát, nie doloženú revíziu decku.
- Nie je uvedený sideboard, herný formát, hash obsahu ani verzia pravidiel. Ich podporu nemožno z tejto jednej ukážky vylúčiť ani potvrdiť.
- Odkazy `localhost:5177` naznačujú vývojový export; nie sú použiteľné ako produkčné integračné adresy.
- `author` nie je identita hráča a nesmie slúžiť na prepojenie účtov.
- Vložený text obsahoval HTML entity medzier a markdownové odkazy. Pred použitím ako testovacej vzorky potrebujeme pôvodný JSON bez formátovania chatu.

Ukážka je dôkaz existujúceho exportného formátu, nie dohodnutý kontrakt pre výsledky či účty. Opis a autor nie sú potrebné na prenos minimálnych herných dát.

### Overenie verejného repozitára partnera

Zdroj: [Mycheze/algomancy-online-client](https://github.com/Mycheze/algomancy-online-client), vetva `master`, commit `473866987bd9201535afdc209f05abe494831436`, kontrola 2026-09-20. Ide o statickú kontrolu kódu, nie spustenie testov, bezpečnostný audit celej aplikácie alebo potvrdenie nasadenej verzie. Partnerove závislosti ani programy neboli spustené.

#### Import a karty — potvrdené kódom

- Fetch vykonáva **Node server** v `importDeckUrl`, s timeoutom 15 sekúnd, bez odovzdania našich session cookies. Cieľová doména je pevne určená. Z tohto serverového fetchu nevyplýva potreba meniť naše CORS pre prehliadač.
- Číta `deck.name`, `deck.description`, `deck.cards[].cardId/quantity`, `deck.sideboard[].cardId/quantity`, `cards[].id/name` a `user.username`. Z ID zostaví kanonický odkaz na pôvodný deck.
- Naše card ID najprv prevedie cez `cards[]` na názov. Názov (alebo záložný slug) normalizuje na malé písmená bez znakov mimo `a-z0-9` a vyhľadá v zozname podporovaných kariet enginu. `CardName` je reťazec; prenos vlastných univerzálnych ID nie je súčasťou súčasného importu.
- Main deck s nepodporovanými kartami sa môže uložiť po ich vynechaní, s upozornením. Herná legalita sa kontroluje samostatne. Tento tolerantný import **nie je dôkaz presnej zhody** pre naše automatické štatistiky.
- Náš `sideboard` sa mení na ich `maybe` (**maybeboard**): odložené karty, ktoré sa nevkladajú do hry. Nepodporované karty z tejto časti sa vynechávajú bez upozornenia. Preto nemožno automaticky predpokladať herný sideboarding ani vyžadovať jeho hash ako hash odohranej zostavy.
- Neúspešné HTTP odpovede a chýbajúci main deck vyvolajú chybu; kolekčný endpoint ju vracia ako `{ ok: false, error }`. Reálny produkčný test súkromného decku ešte zostáva otvorený.
- Import vytvára kópiu s vlastným UUID a zdrojovým odkazom. `updateDeck` umožňuje meniť karty a zdrojový odkaz pritom neodstraňuje. **Samotný `source`/`url` preto nepotvrdzuje, že deck zostal nezmenený.**
- `createDeck` štandardne nastavuje novovytvorené decky ako verejné a používa ho aj import do kolekcie. Pre budúci prenos našich súkromných deckov treba dohodnúť osobitné spracovanie viditeľnosti; existujúci import nemožno iba rozšíriť o prístup k súkromnému obsahu.

Zdroje: [decks.ts](https://github.com/Mycheze/algomancy-online-client/blob/473866987bd9201535afdc209f05abe494831436/client/server/decks.ts), [api-decks.ts](https://github.com/Mycheze/algomancy-online-client/blob/473866987bd9201535afdc209f05abe494831436/client/server/api-decks.ts), [collection.ts](https://github.com/Mycheze/algomancy-online-client/blob/473866987bd9201535afdc209f05abe494831436/client/server/collection.ts).

#### Účty — potvrdené kódom

- Majú vlastné účty s UUID, username/heslo a hosťovské účty. Heslá spracúva `scrypt`; sessions používajú náhodné bearer tokeny. UI drží token v localStorage. Tieto tokeny nepotrebujeme a nebudeme ich prenášať do Algomancer.
- Účty, sessions a história sa ukladajú do JSON súboru. Rozdiel oproti našej MongoDB nebráni serverovej integrácii.
- Už existuje prepojenie s Discordom: prihlásený hráč vytvorí jednorazový kód s platnosťou 10 minút, bot ho uplatní a účet možno odpojiť. Je to existujúci základ skúseností s prepájaním, **nie hotový Algomancer/OAuth protokol**. Jeho kódy, bot token a endpointy nepreberať bez samostatnej dohody.
- V preskúmaných serverových súboroch sa nenašla hotová integrácia účtov Algomancer ani OAuth/OIDC provider pre tento účel.

Zdroje: [accounts.ts](https://github.com/Mycheze/algomancy-online-client/blob/473866987bd9201535afdc209f05abe494831436/client/server/accounts.ts), [account.ts](https://github.com/Mycheze/algomancy-online-client/blob/473866987bd9201535afdc209f05abe494831436/client/ui/account.ts), [link.ts](https://github.com/Mycheze/algomancy-online-client/blob/473866987bd9201535afdc209f05abe494831436/client/server/link.ts), [api-link.ts](https://github.com/Mycheze/algomancy-online-client/blob/473866987bd9201535afdc209f05abe494831436/client/server/api-link.ts).

#### Hry a výsledky — potvrdené kódom

- Server má `Room` s herným kódom, hráčskymi UUID podľa seat, počiatočnými decklistami, lokálnymi deck ID, výsledkom a meraním `matchMs`. `setRoomDeck` uloží kópiu zoznamu kariet pred začiatkom constructed hry. To je vhodnejší podklad než neskorší obsah editovateľnej kolekcie.
- `recordFinishedGame` volá `recordLiveGame`; história má game code, `finished`, `winner`, hráčov, režim, ťahy a voliteľné trvanie či vzdanie. Existuje aj synchronizácia uložených hier vrátane nedokončených. Nie všetky uložené riadky preto predstavujú finálny výsledok.
- Režimy enginu sú `shared`, `draft`, `constructed`; hlavná preskúmaná štruktúra miestnosti má dve hráčske pozície. Nepredpokladať automatickú zhodu s našimi `live_draft`, `2v2`, `ffa` alebo `custom`.
- Interná história nahrádza záznam s rovnakým game code. Kód ráta s undo a opätovným dokončením hry; nestačí poslať prvý koniec ako navždy nemenný výsledok. Potrebujeme politiku finality alebo verziované opravy a zrušenia.
- Pri historických hrách `importGame` a `claimSeats` môžu priradiť hráča aj podľa mena. Pre overený import na našej strane požadovať UUID autentifikovaného hráča zachytené počas hry; nepreberať takéto dodatočné priradenie ako rovnocenný dôkaz identity.
- Vzdanie má vlastné kategórie: turn <= 1 `walkover` nezapočítaný do bežných štatistík, turn 2 `early` s osobitnými pravidlami, neskôr `normal`. Ide o ich správanie, nie ešte schválené pravidlo Algomancer.
- `hooks.ts` obsahuje infraštruktúru udalostí pre Discord bot vrátane typu `game.finished`. Ide o obmedzenú pamäťovú frontu/replay ring s možným zahadzovaním, nie hotové trvanlivé doručovanie výsledkov Algomancer. Typ udalosti navyše neobsahuje kompletnú väzbu hráčov a našich revízií.

Zdroje: [rooms.ts](https://github.com/Mycheze/algomancy-online-client/blob/473866987bd9201535afdc209f05abe494831436/client/server/rooms.ts), [main.ts](https://github.com/Mycheze/algomancy-online-client/blob/473866987bd9201535afdc209f05abe494831436/client/server/main.ts), [history.ts](https://github.com/Mycheze/algomancy-online-client/blob/473866987bd9201535afdc209f05abe494831436/client/server/history.ts), [concession.ts](https://github.com/Mycheze/algomancy-online-client/blob/473866987bd9201535afdc209f05abe494831436/client/server/concession.ts), [hooks.ts](https://github.com/Mycheze/algomancy-online-client/blob/473866987bd9201535afdc209f05abe494831436/client/server/hooks.ts).

#### Dopad na plán

Nie je potrebné od partnera znovu zisťovať, či vôbec má server, účty, UUID alebo históriu hier. Potrebujeme dohodnúť rozšírenie existujúceho systému na oboch stranách: zachovanie našej revízie pri importe a štarte hry, bezpečné prepojenie, stabilnú externú identitu zápasu, finálnosť/opravovanie výsledkov a spoľahlivé doručovanie.

Odporúčaná prvá podporovaná vetva je štandardný constructed duel s nezmeneným importovaným main deckom; ide zatiaľ o návrh, nie schválené zúženie rozsahu. Význam maybeboardu a jeho vplyv na revíziu treba dohodnúť pred implementáciou hashovania.

## 5. Navrhovaná architektúra — zatiaľ bez implementácie

### 5.1 Izolovaný integračný modul

Navrhované umiestnenie: `app/lib/integrations/algomancyOnline/`. Má obsahovať len potrebnú logiku konkrétneho partnera. Žiadna nová mikroservisa ani všeobecný framework providerov.

Interné herné dáta oddeliť od partnerovho transportného formátu. Prípadný výstup bude explicitne zostavený z povolených polí: verzia kontraktu, deck ID, revízia/hash, dohodnutý herný formát, main deck a sideboard s identifikátormi a množstvami. Presné názvy a tvar polí zostávajú otvorené.

Verejný prenos nesmie závisieť od session vlastníka ani exportovať súkromný deck. Nekopírovať celý MongoDB dokument. Nevystavovať user ID, emaily, session JWT, cookies, interné review údaje či identifikátory návštevníkov.

Najprv overiť fungujúci import; nový endpoint vytvoriť iba vtedy, ak ho dohodnutý kontrakt potrebuje. Prípadné tlačidlo „Play on Algomancy.online“ závisí od ich podporovanej cieľovej URL.

### 5.2 Revízie a identita kariet

Oddeliť verziu prenosového formátu, revíziu zloženia decku a verziu herných pravidiel.

Navrhnúť nemenné revízie s deck ID, normalizovaným main deckom a sideboardom, časom vzniku a deterministickým hashom herného obsahu. Hash nemá závisieť od poradia položiek, opisu, autora, likes či views. Presný rozsah hashu vrátane formátu a pravidiel musí byť dohodnutý.

Samotný hash neuchová históriu. Odohrané zloženie musí zostať dostupné aj po úprave decku. Revízia neudeľuje verejný prístup; jej dostupnosť musí rešpektovať súkromie decku.

Existujúci deck dostane pri zavedení počiatočnú revíziu. Staršie zloženia a väzby starých manuálnych logov nemožno spätne vymyslieť; zostanú neznáme, ak neexistuje spoľahlivý zdroj.

ID kariet majú zostať stabilné pri premenovaní. Mapovanie názvov alebo externých ID má byť explicitné a kontrolované; žiadne nejednoznačné či približné párovanie. Chýbajúca karta spôsobí zrozumiteľné odmietnutie, nie zmenšenie decku.

Treba dohodnúť, či sa kontroluje registrované zloženie main + sideboard pred zápasom alebo aj legálne presuny medzi hrami série. Legálny sideboarding nesmie byť omylom vyhodnotený ako nepovolená úprava.

### 5.3 Prepojenie účtov

Navrhnúť samostatnú kolekciu spojení: lokálny používateľ, provider, stabilné externé user ID, stav, čas prepojenia/odpojenia a nastavenie automatického importu. Kardinalitu a unikátne indexy potvrdiť pred implementáciou; odporúčaný základ je jeden aktívny účet daného providera na lokálneho používateľa a opačne.

Dočasné pokusy o prepojenie oddeliť od hotového spojenia. Krátko platné jednorazové kódy ukladať bezpečne (napríklad hash), viazať ich na konkrétny pokus, partnera a povolenú návratovú adresu. Platnosť kontrolovať pri použití a kód spotrebovať atomicky; samotné automatické mazanie expirovaných záznamov nestačí.

Bezpečnostný kontrakt musí zabezpečiť kontrolu oboch účtov, ochranu proti podvrhnutému prepojeniu, replay a zámene účtov, overenie partnerovho servera a jasné potvrdenie používateľa. Pri OAuth variante použiť aktuálne ochrany authorization-code flow vrátane PKCE a väzby na začatú reláciu.

Nikdy nezdieľať heslá, NextAuth JWT ani cookies a nespájať účty len podľa emailu. Aktívne spojenie automaticky neudeľuje prístup ku všetkým súkromným deckom. Odpojenie musí zastaviť ďalšie oprávnené importy; správanie rozpracovaných a oneskorených doručení treba dohodnúť.

Referencie: [OAuth Security BCP, RFC 9700](https://www.rfc-editor.org/info/rfc9700/), [OAuth 2.0, RFC 6749](https://www.rfc-editor.org/info/rfc6749/). Konkrétny protokol nie je schválený.

### 5.4 Výsledky a existujúce Game Logs

Aktualizovaný návrh postupu: overený vstup partnera → validácia a deduplikácia → kontrola decku a odohranej revízie → uloženie výsledku decku bez povinnej identity pilota → voliteľné vytvorenie osobného Game Logu, iba pri platnom spojení a povolenom osobnom importe → evidencia výsledku spracovania. Prístup k súkromnému decku musí byť osobitne autorizovaný.

Dôležitý dôsledok: existujúci GameLog vyžaduje `userId`, preto doň nemožno anonymné výsledky uložiť tak, že im priradíme autora decku alebo fiktívneho používateľa. Pred implementáciou treba navrhnúť spoločný model herného výsledku s voliteľnou väzbou na osobné Game Logs. Výsledok sa má počítať iba raz, aj keď má aj osobný log; zdieľať výpočty, nevytvárať dve nezávislé pravdy o jednej hre. Presný model zatiaľ nie je schválený.

Presný payload a spôsob autentifikácie prijímača zostávajú otvorené. Výsledok poslaný prehliadačom bez overenia partnerovým serverom nemožno označiť ako overený online výsledok.

Budúci dátový návrh musí reprezentovať:

- provider, externé match ID a prípadne game ID v sérii;
- voliteľnú identitu hráča a väzbu na spojenie pre osobný Game Log; deckový výsledok ich nevyžaduje;
- zdroj (`manual` oproti online integrácii) a rozsah overenia pôvodu;
- deck ID, nemennú revíziu a kontrolu zhody;
- výsledok hráča oddelený od spôsobu ukončenia zápasu;
- stav spracovania, čas, zrozumiteľný dôvod odmietnutia a identifikáciu doručenia;
- prípadné opravy výsledku a ich verziu.

Názvy polí a umiestnenie medzi GameLog a samostatný záznam spracovania nie sú finálne. Cieľom je rozšíriť existujúci systém, nie zaviesť konkurenčnú databázu štatistík.

Deduplikácia musí fungovať aj bez user ID. Navrhovaný kľúč je provider, stabilné ID hry a hráčska pozícia (`seat`), s deck ID a revíziou v zázname. Seat rozlišuje dve účasti rovnakého decku v jednej hre bez identifikovania pilota. Presnú jednotku počítania pri takomto zápase ešte dohodnúť. Osobný log musí odkazovať na ten istý výsledok a nesmie sa započítať druhýkrát.

Spoločný postup tvorby logu má zachovať validáciu, súkromie, odvodené údaje a achievementy bez duplicít pri opakovanom importe. Elementy odohranej hry neodvodzovať z neskôr zmeneného decku. Bežný editovací endpoint nesmie umožniť sfalšovať overené herné polia.

Verejné súhrny decku majú započítať všetky oprávnené importované výsledky podľa dohody v časti 2, ale nesmú tým obísť prístupové pravidlá detailov logov. Súkromné decky a ich revízie sa nesmú objaviť vo verejných odpovediach.

### 5.5 Informácie pre používateľa

Navrhnúť dostupný stav spojenia, prepínača a spracovania hier. Rozlíšiť úspech, čakanie/opakovanie, už spracovanú hru a odmietnutie. Uviesť konkrétny dôvod a ďalší krok, ak existuje: nezhoda decku, nepodporovaná karta, vypnutý import, zrušené spojenie alebo nepodporovaný typ výsledku.

Používateľské hlásenia nesmú obsahovať tajomstvá, payloady iných hráčov ani interné stack traces. Udalosti musia byť dostupné aj pri asynchrónnom spracovaní, nie iba ako krátky toast po kliknutí. Formu a dobu uchovania histórie ešte dohodnúť.

## 6. Otvorené otázky pred príslušnou implementáciou

### Pre vývojára Algomancy.online

1. Potvrdené kódom: serverový fetch existujúceho API a používané polia (časť 4). Je preskúmaný commit zhodný s produkciou? Kde spoločne otestujeme kompatibilitu a prístupové chyby?
2. Potvrdené kódom: mapovanie cez normalizovaný názov. Dohodneme uchovanie našich ID/revízie alebo explicitné mapovanie? Ako budeme koordinovať premenovania, nové sady a verzie pravidiel?
3. Vie zachovať naše deck ID a revíziu pri importe a potvrdiť skutočné registrované zloženie pri začatí hry?
4. Potvrdené kódom: náš sideboard je nehrateľný maybeboard. Má jeho zmena ovplyvniť oprávnenosť zápisu? Aká bude prvá podporovaná herná jednotka a ktoré režimy zahrnieme?
5. Potvrdené kódom: UUID účtov, serverové prihlasovanie a Discord linking. Aký samostatný protokol a callback adresy dohodneme pre Algomancer? Povoliť prepojenie hosťov alebo iba registrovaných účtov?
6. Vie server dôveryhodne posielať výsledky? Aké budú autentifikácia, rotácia kľúčov, payload, identifikátory, retry a opravy výsledkov?
7. Ako prevedieme existujúce `finished`, `winner`, concession kategórie a timeouty do nášho kontraktu? Kedy je výsledok finálny a ako partner oznámi undo, opravu alebo zrušenie? Ako odlíšime autentifikovanú účasť od historického priradenia podľa mena?
8. Ako bezpečne odovzdať vlastný súkromný deck bez verejného sprístupnenia? Vie obmedziť jeho následné zdieľanie?
9. Vie preniesť a rešpektovať odpojenie účtu a zmeny oprávnení? Aký údaj potrebuje na identifikáciu spojenia bez emailu a nášho session tokenu?

### Produktové otázky, ktoré ešte neboli rozhodnuté

- Jeden alebo viac externých účtov na používateľa; riešenie konfliktu a opätovného prepojenia.
- Import iba budúcich hier alebo aj histórie; správanie pri vypnutí importu počas hry a oneskorenom doručení po odpojení.
- Ktoré ukončenia sa započítavajú: vzdanie, timeout, disconnect, abandoned. Nedokončenú hru nepreklasifikovať automaticky na remízu.
- Zahrnutie anonymných a neprepojených hier verejného decku je dohodnuté; otvorený zostáva technický kontrakt doručovania a deduplikácie bez identity pilota.
- Či verejné súhrny decku používajú rovnaké pravidlo aj pre staré/manuálne logy. Aktuálna dohoda sa týka online importu.
- Správanie pri zmene verejného decku na súkromný, jeho zmazaní a prístupe k historickým revíziám.
- Úpravy a mazanie overených výsledkov, opravy od partnera a zabránenie obnove zmazaného logu pri retry.
- Rozsah údajov o súperoch, najmä pri neprepojenom alebo súkromnom účte.
- Presné pravidlá sideboardingu, verzií pravidiel a filtra „aktuálna verzia“.
- Podoba histórie importov, notifikácií a doba uchovania prevádzkových údajov.

Tieto otázky neblokujú dnešnú dokumentáciu. Blokujú len implementačné kroky, ktoré od odpovede závisia.

## 7. TODO v odporúčanom poradí

Nezaškrtnuté integračné body sú budúca práca. Samostatne autorizované a dokončené prípravné UI úpravy sú označené nižšie.

### 0. Dohoda a kontrakt

- [x] Dohodnúť tri taby `Deck / Stats / Results` a deckové výsledky bez prepínača podľa pilota, vrátane anonymných hier verejného decku.
- [x] Upresniť obsah tabov: `Stats` je iba existujúce `Deck Statistics`; `Deck` získa viac priestoru pre obrázky a decklist; odohrané výsledky patria do `Results`.
- [ ] Navrhnúť model výsledku decku bez povinného `userId`, s voliteľnou väzbou na osobný Game Log.
- [x] Preskúmať relevantný existujúci kód a dodanú ukážku exportu.
- [x] Zapísať prijaté rozhodnutia, návrhy a neznáme body oddelene.
- [x] Získať potvrdenie partnera o spôsobe importu: ID z odkazu → existujúce `/api/decks/<id>`; bez parsovania HTML podľa jeho vyjadrenia.
- [ ] Získať odpovede partnera a pôvodné ukážky decku, identity a výsledku.
- [x] Staticky preskúmať partnerov repozitár a zistiť používané polia, serverový fetch, maybeboard, identity účtov a existujúcu históriu hier (commit v časti 4).
- [ ] Dohodnúť uchovanie kompatibility existujúceho importu a konkrétne rozšírenia na partnerovej strane.
- [ ] Uzavrieť význam maybeboardu pri kontrole zhody, finalitu/opravovanie výsledkov a dôkaz autentifikovanej účasti bez párovania podľa mena.
- [ ] Overiť existujúci import verejného decku, sideboard a odmietnutie súkromného decku v dohodnutom testovacom prostredí.
- [ ] Dohodnúť prvú podporovanú hernú jednotku/formát a výsledné stavy.
- [ ] Uzavrieť kontrakt identity kariet, revízií a spôsob potvrdenia skutočného decku.
- [ ] Odsúhlasiť konkrétny rozsah prvej implementácie s používateľom.

Podmienka pokračovania: poznáme potrebné zmeny existujúceho importu a nemusíme hádať formát partnera.

### 1. Decky a revízie ako základ

- [ ] Navrhnúť a odsúhlasiť nemenné revízie, hash a prístupové pravidlá histórie.
- [ ] Overiť všetky cesty tvorby a zmeny decku vrátane kopírovania a sideboardu.
- [ ] Zaviesť počiatočné revízie existujúcich deckov a tvorbu ďalších pri zmene herného obsahu.
- [ ] Zaviesť minimálny izolovaný adaptér alebo export len v rozsahu vyžadovanom dohodnutým importom.
- [ ] Zachovať stabilné ID kariet; pridať mapovanie iba ak je potrebné.
- [ ] Overiť existujúcu osobnú kópiu: nové ID, vlastník, obe zóny, voľba súkromia a žiadna prevzatá história výsledkov.
- [x] Staticky overiť dnešné tlačidlo Copy Deck: nové ID a vlastník, súkromná kópia, main + sideboard, bez prevzatia Game Logs; identifikovať rozdiel oproti copy endpointu.
- [x] Po odsúhlasení upraviť pomenovanie, priebeh, potvrdenie a vysvetlenie osobnej kópie; bez zmeny logiky kopírovania a bez závislosti od partnera.
- [ ] Otestovať deterministický hash, zmeny obsahu, neznáme karty, izoláciu kópií a neprístupnosť súkromných deckov/revízií.

Podmienka pokračovania: importovaná herná zostava má jednoznačnú zachovanú identitu a jej zmeny vieme spoľahlivo zistiť.

### 2. Prepojenie účtov a oprávnenia

Táto fáza je potrebná pre osobné Game Logs a autorizované súkromné decky; nie je podmienkou verejných deckových výsledkov. Ich vývoj môže pokračovať nezávisle po dohode výsledkového kontraktu.

- [ ] Schváliť protokol, kardinalitu, životný cyklus spojenia a indexy.
- [ ] Implementovať overenie oboch účtov, jednorazové pokusy a ochrany proti podvrhnutiu/replay.
- [ ] Pridať pripojenie, odpojenie a prepínač automatického importu s jasnými pravidlami súkromia a verejných deckových štatistík.
- [ ] Doriešiť autorizovaný prenos vlastného súkromného decku pre osobné hranie; nesprístupniť ho verejnému importu.
- [ ] Otestovať expirácie, súbeh, konflikt účtov, odpojenie a zachovanie existujúceho NextAuth správania.

Podmienka pokračovania: partnerovu identitu vieme bezpečne priradiť ku konkrétnemu používateľovi a poznáme jeho aktuálne oprávnenia.

### 3. Výsledky a spoločný postup Game Logs

- [ ] Schváliť payload, autentifikáciu servera, retry, opravy, ukončenia hier a politiku mazania.
- [ ] Vyčleniť potrebnú spoločnú aplikačnú logiku tvorby logu bez zmeny správania manuálneho zápisu.
- [ ] Pridať integračné údaje, databázovú deduplikáciu a evidenciu spracovania.
- [ ] Implementovať prijímač až s odsúhlaseným kontraktom; vždy overovať zdroj a odohranú revíziu. Spojenie a osobný prepínač kontrolovať iba pre osobné Game Logs, nie ako podmienku výsledku verejného decku.
- [ ] Pri nezhode nevytvoriť Game Log; uložiť bezpečný a zrozumiteľný výsledok spracovania pre používateľa.
- [ ] Ošetriť overené polia pri ručnej úprave a opakované vykonanie achievementov.
- [ ] Spolu s prijímačom dodať používateľovi informácie o úspechu, čakaní, duplicite a odmietnutí.
- [ ] Otestovať súbežné duplicity, zmenu decku počas hry, nezhodu, neprepojeného hráča, vypnutie/odpojenie, oneskorené udalosti a dohodnuté ukončenia.

Podmienka pokračovania: jeden platný výsledok vytvorí najviac jeden záznam na hernú účasť decku, voliteľný osobný log ho nezdvojí a každé spracovanie má dohľadateľný stav.

### 4. Štatistiky a používateľské dokončenie

- [x] Zaviesť tri taby `Deck / Stats / Results`: existujúce `Deck Statistics` je v `Stats`, `Deck` využíva celú šírku a `Results` obsahuje pravdivý stav nedostupnosti. Bez výsledkového backendu a bez zmeny výpočtov Stats.
- [ ] Napojiť Results na odsúhlasený model a zdroj výsledkov po príslušnej implementácii.
- [ ] Pridať označenie manuálneho/online výsledku a rozsahu overenia.
- [ ] Zaviesť verejné agregáty verejného decku zo všetkých oprávnených importovaných hier bez zverejnenia súkromných logov.
- [ ] Zachovať osobné štatistiky hráča a oddelené štatistiky jeho súkromnej kópie.
- [ ] Pridať rozlíšenie verzií decku a zobrazenie všetkých/aktuálnej verzie.
- [ ] Jasne rozlíšiť počet zápasov a hráčskych výsledkov; vyriešiť zápas dvoch používateľov rovnakého decku.
- [ ] Otestovať súkromie všetkých verejných odpovedí, zmeny viditeľnosti a správnosť agregácií.
- [ ] Prípadné tlačidlo „Play on Algomancy.online“ napojiť na dohodnutý existujúci import.

Podmienka pokračovania: výsledky sa zobrazujú podľa dohodnutých pravidiel a verejné agregácie neodhaľujú súkromné detaily.

### 5. Spoločné overenie a vydanie

- [ ] Prejsť celý postup s partnerom v testovacom prostredí: verejný deck, cudzí deck, osobná súkromná kópia, prepojenie, výsledok, retry a odpojenie.
- [ ] Overiť migrácie/indexy, limity vstupov, prevádzkové chyby a možnosť zastaviť import bez narušenia loginu či manuálnych Game Logs.
- [ ] Dokončiť používateľské texty a prevádzkovú dokumentáciu.
- [ ] Vydať integráciu až po spoločnom overení a odsúhlasení vydania.

Prijímač výsledkov z fázy 3 nezapínať používateľom skôr, než sú hotové potrebné pravidlá súkromia, štatistiky a spätná väzba z fázy 4. Poradie vyjadruje závislosti implementácie, nie povinné samostatné produkčné vydania.

## 8. Overenie zmien

- Kontrola voči rozhodnutiam používateľa vrátane poslednej zmeny verejných štatistík decku.
- Kontrola lokálnych odkazov a `git diff --check`.
- Pôvodné dokumentačné zmeny boli bez aplikačných testov a buildu.
- Následná odsúhlasená úprava textov Copy Deck: kontrola diffu a `git diff --check`; cielený ESLint zablokovaný chýbajúcim lokálnym balíkom `eslint-plugin-react-hooks`. Logika kopírovania sa nemenila; bez nových testov pre samotné texty.
- Príprava tabov: 4 cielené Jest testy prešli (obsah tabov, klávesnica, zachovanie zobrazenia a export z Results, odmietnutie súkromného decku). Cielený ESLint má rovnaký lokálny blokátor; `git diff --check` prešlo.
- Vizuálna kontrola tabov v lokálnom Chrome pri šírkach 1440 a 390 px s testovacími API odpoveďami: bez chýb stránky a vodorovného pretekania mobilného layoutu. Overené rozloženie kariet, grafov a prázdneho Results; bez zápisov do produkcie.
