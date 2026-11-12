# Technical decisions

Record only decisions supported by code, documentation or an explicit user statement.

## Entry template
- Date (YYYY-MM-DD):
- Decision:
- Rationale / evidence:
- Consequences:

## 2026-11-12 – Czysty HTML/CSS/JS bez zależności
- Decision: aplikacja to trzy pliki (`index.html`, `style.css`, `app.js`), zwykły `<script defer>`
  (nie moduł ES), bez frameworków i bez serwera.
- Rationale / evidence: wymóg zadania – otwieranie dwuklikiem. Moduły ES nie działają z `file://`.
- Consequences: brak `import`/`export`; funkcje są globalne w skrypcie, a dla Node.js eksportowane
  warunkowo przez `module.exports`.

## 2026-11-12 – Zasady noclegu w jednym obiekcie `POLITYKA_NOCLEGU`
- Decision: limity, próg zgody (10%) i treść komunikatu są tylko w `POLITYKA_NOCLEGU` w `app.js`
  z komentarzem o źródle [HR-POL-03 v3.0 §3]; `<select>` lokalizacji jest generowany z tego obiektu.
- Rationale / evidence: wymóg zadania; jedno miejsce zmiany przy nowej wersji polityki.
- Consequences: HTML nie zawiera kwot limitów; nowa kategoria = nowy wpis w `kategorie`.

## 2026-11-12 – Obliczenia na liczbach całkowitych (setne części waluty)
- Decision: kwoty są przeliczane na grosze/eurocenty już przy parsowaniu tekstu, a próg sprawdzany
  porównaniem całkowitym `przekroczenie * 100 > limit * progProcent`.
- Rationale / evidence: unika błędów zmiennoprzecinkowych na granicy 10% (np. 495 zł przy limicie
  450 zł to dokładnie 10% i nie wymaga zgody; 495,01 zł już wymaga).
- Consequences: gdy przekroczenie > 10%, ale po zaokrągleniu do 2 miejsc wyświetla się „10%”,
  UI pokazuje „ponad 10%”, żeby wynik nie przeczył komunikatowi.

## 2026-11-12 – „Większe niż 10%” = ściśle większe
- Decision: przekroczenie równe dokładnie 10% limitu nie pokazuje komunikatu o zgodzie dyrektora.
- Rationale / evidence: treść zadania: „Gdy przekroczenie jest większe niż 10% limitu”.
- Consequences: dla przekroczenia 0–10% UI pokazuje neutralny status „Limit przekroczony”
  bez dodatkowych reguł (polityka w zadaniu nie opisuje innych skutków).

## 2026-11-12 – Transport i rozliczenie w `POLITYKA_TRANSPORTU_I_ROZLICZENIA`
- Decision: próg 1 klasy pociągu (powyżej 3 h) i termin rozliczenia (14 dni kalendarzowych od
  powrotu) są w jednym obiekcie `POLITYKA_TRANSPORTU_I_ROZLICZENIA` obok `POLITYKA_NOCLEGU`,
  z komentarzem o źródłach [HR-POL-03 v3.0 §4] i [§6].
- Rationale / evidence: wymóg zadania – zasady w jednym obiekcie obok polityki noclegu.
- Consequences: dokładnie 3 h → bez 1 klasy; ostatni dzień rozliczenia = data powrotu + 14 dni
  (lokalna data kalendarzowa, bez przesunięć strefy czasowej).

## 2026-11-12 – Osobny formularz DOM dla transportu i rozliczenia
- Decision: sekcja „Transport i rozliczenie” ma własny formularz i `uruchomFormularzTransportu`,
  startowane razem z noclegiem przez `uruchomAplikacje`.
- Rationale / evidence: pola są niezależne od limitu noclegu; zachowanie stylu przeliczania na żywo.
- Consequences: nowe reguły §4/§6 nie mieszają się z walidacją nocy/ceny; funkcje czyste są
  eksportowane przez `module.exports` jak dotychczas.
