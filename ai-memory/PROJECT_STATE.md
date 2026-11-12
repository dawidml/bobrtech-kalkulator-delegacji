# Current project state

## Purpose
„Kalkulator delegacji BOBRTECH” – szkoleniowa aplikacja www (repozytorium „AI Coding Workspace”,
rozwijane na zmianę przez Claude Code i Cursor). Firma BOBRTECH i polityka HR-POL-03 są fikcyjne;
repozytorium będzie publiczne, więc bez danych osobowych i sekretów. Język UI i dokumentacji: polski.

## Stack and commands
- Czysty HTML/CSS/JS, bez frameworków, bez zależności, bez serwera i bez kroku budowania.
- Uruchomienie: dwuklik `index.html` (działa z `file://`, sprawdzone w headless Chromium).
- Brak testów w repozytorium. `app.js` eksportuje funkcje przez `module.exports` (tylko gdy istnieje
  `module`), więc da się je testować w Node.js: `require('./app.js')`.
- Commity robi hook AI Git Starter po każdej turze agenta (`.claude/settings.local.json`,
  `.cursor/hooks.json`) – agenci nie commitują ręcznie.

## Architecture
- `index.html` – formularz (lokalizacja, liczba nocy, cena za dobę) i sekcja wyniku.
- `style.css` – style z tokenami kolorów na `:root`, tryb ciemny przez `prefers-color-scheme`.
- `app.js`:
  - `POLITYKA_NOCLEGU` – jedyne źródło zasad [HR-POL-03 v3.0 §3]: limity 4 kategorii lokalizacji,
    próg zgody (10%), treść komunikatu. Lista `<select>` jest budowana z tego obiektu.
  - Czyste funkcje: `parsujKwoteNaSetne`, `obliczNocleg`, `formatujKwote`,
    `formatujProcentPrzekroczenia` (bez DOM).
  - `uruchomFormularz` – obsługa DOM, przeliczanie na żywo przy każdej zmianie pola.

## Implemented features
- Limit noclegu wg HR-POL-03 v3.0 §3: Polska standard 450 zł; Warszawa, Kraków, Gdańsk, Wrocław 520 zł;
  zagranica standard 160 EUR; Szwecja, Norwegia, Dania 210 EUR.
- Wynik: limit za dobę i łącznie, koszt hotelu łącznie, różnica (koszt − limit, ze znakiem),
  procent przekroczenia. Status: w limicie / przekroczony do 10% / > 10% →
  „Wymaga zgody dyrektora pionu w systemie Delegatka”.
- Walidacja: liczba nocy całkowita ≥ 1; cena ≥ 0, maks. 2 miejsca po przecinku, akceptuje przecinek,
  kropkę i spacje tysięcy.

## Known issues and limitations
- Nie liczy diet (polityka odsyła do przepisów i nie podaje kwot) – celowo.
- Nie przelicza walut: cenę trzeba podać w walucie limitu (PLN albo EUR).
- Nie zapisuje danych (brak localStorage/backendu).
- Panel przeglądarki aplikacji Claude otwiera lokalne pliki jako statyczny snapshot bez CSS/JS –
  do podglądu trzeba lokalnego serwera albo zwykłej przeglądarki.

## Last verified
2026-11-12 (Claude Code): testy obliczeń w Node.js (9 przypadków, m.in. granica dokładnie 10% i
10% + 0,01), test formularza w headless Chromium (12 scenariuszy, w tym błędne dane), podgląd
w trybie jasnym, ciemnym i na szerokości 375 px.
