# Kalkulator delegacji BOBRTECH

Prosta aplikacja www, która sprawdza, czy koszt hotelu w delegacji mieści się w limicie noclegu.
To projekt szkoleniowy: firma BOBRTECH i jej polityka są fikcyjne.

## Co robi

Podajesz:

- lokalizację (kategorię limitu),
- liczbę nocy,
- cenę hotelu za dobę w walucie limitu (PLN albo EUR).

Kalkulator pokazuje limit za dobę i łącznie, koszt hotelu łącznie, różnicę (koszt − limit)
oraz procent przekroczenia limitu. Gdy przekroczenie jest większe niż 10% limitu, wyświetla
komunikat: „Wymaga zgody dyrektora pionu w systemie Delegatka”.

| Lokalizacja | Limit za dobę |
| --- | --- |
| Polska – standard | 450 zł |
| Warszawa, Kraków, Gdańsk, Wrocław | 520 zł |
| Zagranica – standard | 160 EUR |
| Szwecja, Norwegia, Dania | 210 EUR |

Czego kalkulator nie robi:

- nie liczy diet, bo polityka odsyła w tym zakresie do przepisów i nie podaje kwot,
- nie przelicza kursów walut,
- nie zapisuje ani nie wysyła wpisanych danych.

## Jak uruchomić

Otwórz plik `index.html` dwuklikiem w przeglądarce. Nie trzeba niczego instalować,
uruchamiać serwera ani łączyć się z internetem.

## Pliki

- `index.html` – formularz i miejsce na wynik,
- `style.css` – wygląd (także tryb ciemny),
- `app.js` – limity i obliczenia.

## Skąd są zasady

Zasady pochodzą z fikcyjnej polityki szkoleniowej BOBRTECH **HR-POL-03 v3.0 §3**.
Wszystkie limity i próg zgody (10%) są w jednym obiekcie `POLITYKA_NOCLEGU` w pliku `app.js`.
Żeby zmienić zasady, edytuj tylko ten obiekt; lista lokalizacji w formularzu powstaje z niego.
