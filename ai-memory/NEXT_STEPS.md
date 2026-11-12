# Next steps

## Confirmed priorities
- [x] Inspect code and verify project state (2026-11-12).
- [x] Pierwsza funkcja: limit noclegu wg HR-POL-03 v3.0 §3 (`index.html`, `style.css`, `app.js`, `README.md`).
- [x] Druga sekcja: transport i rozliczenie wg HR-POL-03 v3.0 §4 i §6 (`POLITYKA_TRANSPORTU_I_ROZLICZENIA`,
  formularz w `index.html`, logika w `app.js`, `README.md`, `PROJECT_STATE.md`).

## In progress
None recorded.

## Blockers
None recorded.

## Suggestions (not confirmed)
- Dodać do repozytorium testy obliczeń bez zależności (np. `tests/nocleg.test.js` uruchamiany
  `node --test`) – funkcje z `app.js` są już eksportowane przez `module.exports` (także
  `ocenKlasePociagu` i `obliczTerminRozliczenia`).
- Diet nie liczyć, dopóki polityka nie poda kwot.
