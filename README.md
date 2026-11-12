# Kalkulator delegacji BOBRTECH

[Historia promptów AI, które zbudowały ten projekt](https://dawidml.github.io/bobrtech-kalkulator-delegacji/).

Prosta aplikacja www do sprawdzenia limitu noclegu, klasy pociągu oraz terminu rozliczenia
delegacji. To projekt szkoleniowy: firma BOBRTECH i jej polityka są fikcyjne.

## Co robi

### Nocleg

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

### Transport i rozliczenie

- **Klasa pociągu** – podajesz czas podróży pociągiem w jedną stronę (w godzinach).
  1 klasa przysługuje tylko przy podróży trwającej powyżej 3 godzin.
- **Termin rozliczenia** – podajesz datę powrotu z delegacji. Kalkulator pokazuje ostatni dzień
  na rozliczenie w systemie Delegatka: 14 dni kalendarzowych od powrotu.

Czego kalkulator nie robi:

- nie liczy diet, bo polityka odsyła w tym zakresie do przepisów i nie podaje kwot,
- nie przelicza kursów walut,
- nie zapisuje ani nie wysyła wpisanych danych.

## Jak uruchomić

Otwórz plik `index.html` dwuklikiem w przeglądarce. Nie trzeba niczego instalować,
uruchamiać serwera ani łączyć się z internetem.

## Pliki

- `index.html` – formularze i miejsce na wyniki,
- `style.css` – wygląd (także tryb ciemny),
- `app.js` – limity, progi i obliczenia.

## Skąd są zasady

Zasady pochodzą z fikcyjnej polityki szkoleniowej BOBRTECH **HR-POL-03 v3.0**:

- nocleg i próg zgody (10%) – `POLITYKA_NOCLEGU` [§3],
- klasa pociągu i termin rozliczenia – `POLITYKA_TRANSPORTU_I_ROZLICZENIA` [§4, §6].

Oba obiekty są w pliku `app.js`. Żeby zmienić zasady, edytuj odpowiedni obiekt; lista lokalizacji
w formularzu noclegu powstaje z `POLITYKA_NOCLEGU`.

## Historia promptów (AI Prompt Timeline)

Strona [AI Prompt Timeline](https://dawidml.github.io/bobrtech-kalkulator-delegacji/) pokazuje każdy
prompt Claude Code i Cursora, który zbudował ten projekt, razem z commitem i diffem. Publikuje się
automatycznie przy `git push` (hook pre-push z AI Git Starter). Treść promptów pochodzi z lokalnej
bazy w `.git`, a eksport usuwa komunikaty aplikacji i ścieżki lokalne.
