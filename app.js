'use strict';

/*
 * Kalkulator delegacji BOBRTECH – nocleg, transport i rozliczenie.
 *
 * Źródło zasad: fikcyjna polityka szkoleniowa firmy BOBRTECH [HR-POL-03 v3.0].
 * Limity noclegu i próg zgody dyrektora: POLITYKA_NOCLEGU [§3].
 * Klasa pociągu i termin rozliczenia: POLITYKA_TRANSPORTU_I_ROZLICZENIA [§4, §6].
 * Zmiana polityki = zmiana tylko tych obiektów (lista lokalizacji powstaje z POLITYKA_NOCLEGU).
 *
 * Kalkulator nie liczy diet: polityka odsyła w tym zakresie do przepisów i nie podaje kwot.
 */
const POLITYKA_NOCLEGU = {
  zrodlo: 'HR-POL-03 v3.0 §3',
  // Przekroczenie WIĘKSZE niż ten procent limitu wymaga zgody dyrektora pionu.
  progZgodyDyrektoraProcent: 10,
  komunikatZgody: 'Wymaga zgody dyrektora pionu w systemie Delegatka',
  // Limit za jedną dobę hotelową, w walucie limitu.
  kategorie: {
    'pl-standard': {
      nazwa: 'Polska – standard (pozostałe miejscowości)',
      limitZaDobe: 450,
      waluta: 'PLN',
    },
    'pl-duze-miasta': {
      nazwa: 'Polska – Warszawa, Kraków, Gdańsk, Wrocław',
      limitZaDobe: 520,
      waluta: 'PLN',
    },
    'zagranica-standard': {
      nazwa: 'Zagranica – standard (pozostałe kraje)',
      limitZaDobe: 160,
      waluta: 'EUR',
    },
    'zagranica-skandynawia': {
      nazwa: 'Zagranica – Szwecja, Norwegia, Dania',
      limitZaDobe: 210,
      waluta: 'EUR',
    },
  },
};

/*
 * Źródło zasad: [HR-POL-03 v3.0 §4] klasa pociągu, [HR-POL-03 v3.0 §6] termin rozliczenia.
 * Wszystkie progi transportu i rozliczenia są w jednym obiekcie POLITYKA_TRANSPORTU_I_ROZLICZENIA.
 */
const POLITYKA_TRANSPORTU_I_ROZLICZENIA = {
  zrodloKlasy: 'HR-POL-03 v3.0 §4',
  zrodloRozliczenia: 'HR-POL-03 v3.0 §6',
  // 1 klasa przysługuje tylko przy podróży trwającej POWYŻEJ tej liczby godzin (w jedną stronę).
  progPierwszejKlasyGodziny: 3,
  // Ostatni dzień na rozliczenie w Delegatce = data powrotu + ta liczba dni kalendarzowych.
  dniNaRozliczenie: 14,
};

/* ---------- Obliczenia (bez DOM, do testów) ---------- */

/**
 * Zamienia tekst kwoty („480”, „480,5”, „480.50”, „1 200,00”) na liczbę setnych części
 * waluty (grosze / eurocenty). Zwraca null, gdy tekst nie jest kwotą ≥ 0
 * z najwyżej dwoma miejscami po przecinku.
 */
function parsujKwoteNaSetne(tekst) {
  const oczyszczony = String(tekst).replace(/[\s ]/g, '');
  const dopasowanie = /^(\d+)(?:[.,](\d{1,2}))?$/.exec(oczyszczony);
  if (!dopasowanie) return null;
  const setne = Number(dopasowanie[1]) * 100 + Number((dopasowanie[2] || '').padEnd(2, '0'));
  return Number.isSafeInteger(setne) ? setne : null;
}

/**
 * Liczy limit noclegu i przekroczenie według [HR-POL-03 v3.0 §3].
 * Liczy na liczbach całkowitych (setne części waluty), żeby uniknąć błędów zaokrągleń.
 * Wszystkie kwoty w wyniku są w setnych częściach waluty limitu.
 */
function obliczNocleg(kategoriaId, liczbaNocy, cenaZaDobeSetne) {
  const kategoria = POLITYKA_NOCLEGU.kategorie[kategoriaId];
  if (!kategoria) {
    throw new Error(`Nieznana lokalizacja: ${kategoriaId}`);
  }
  if (!Number.isSafeInteger(liczbaNocy) || liczbaNocy < 1) {
    throw new RangeError('Liczba nocy musi być liczbą całkowitą, co najmniej 1.');
  }
  if (!Number.isSafeInteger(cenaZaDobeSetne) || cenaZaDobeSetne < 0) {
    throw new RangeError('Cena za dobę musi być kwotą nie mniejszą niż 0.');
  }

  const limitZaDobeSetne = kategoria.limitZaDobe * 100;
  const limitLacznieSetne = limitZaDobeSetne * liczbaNocy;
  const kosztLacznieSetne = cenaZaDobeSetne * liczbaNocy;
  if (!Number.isSafeInteger(kosztLacznieSetne * 100) || !Number.isSafeInteger(limitLacznieSetne * 100)) {
    throw new RangeError('Podane wartości są zbyt duże do obliczeń.');
  }

  const roznicaSetne = kosztLacznieSetne - limitLacznieSetne; // > 0 oznacza przekroczenie
  const przekroczenieSetne = Math.max(0, roznicaSetne);
  const prog = POLITYKA_NOCLEGU.progZgodyDyrektoraProcent;

  return {
    waluta: kategoria.waluta,
    limitZaDobeSetne,
    limitLacznieSetne,
    kosztLacznieSetne,
    roznicaSetne,
    procentPrzekroczenia: (przekroczenieSetne / limitLacznieSetne) * 100,
    czyPrzekroczony: roznicaSetne > 0,
    // Porównanie na liczbach całkowitych: przekroczenie / limit > prog / 100.
    wymagaZgodyDyrektora: przekroczenieSetne * 100 > limitLacznieSetne * prog,
  };
}

/* ---------- Formatowanie ---------- */

function formatujKwote(setne, waluta, { zeZnakiem = false, bezGroszy = false } = {}) {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: waluta,
    signDisplay: zeZnakiem ? 'exceptZero' : 'auto',
    minimumFractionDigits: bezGroszy ? 0 : 2,
    maximumFractionDigits: bezGroszy ? 0 : 2,
  }).format(setne / 100);
}

const FORMAT_PROCENTU = new Intl.NumberFormat('pl-PL', {
  style: 'percent',
  maximumFractionDigits: 2,
});

function formatujProcentPrzekroczenia(wynik) {
  const tekst = FORMAT_PROCENTU.format(wynik.procentPrzekroczenia / 100);
  // Np. 10,001% po zaokrągleniu wyglądałoby jak „10%”, choć to już ponad próg – doprecyzuj.
  const zaokraglony = Math.round(wynik.procentPrzekroczenia * 100) / 100;
  if (wynik.wymagaZgodyDyrektora && zaokraglony <= POLITYKA_NOCLEGU.progZgodyDyrektoraProcent) {
    return `ponad ${tekst}`;
  }
  return tekst;
}

/**
 * Parsuje czas podróży w godzinach („3”, „3,5”, „3.25”). Zwraca null przy błędzie.
 */
function parsujGodziny(tekst) {
  const oczyszczony = String(tekst).replace(/[\s ]/g, '').replace(',', '.');
  if (oczyszczony === '') return null;
  if (!/^\d+(?:\.\d+)?$/.test(oczyszczony)) return null;
  const godziny = Number(oczyszczony);
  return Number.isFinite(godziny) ? godziny : null;
}

/**
 * Czy przysługuje 1 klasa pociągu według [HR-POL-03 v3.0 §4]:
 * tylko gdy czas podróży w jedną stronę jest WIĘKSZY niż próg (domyślnie 3 h).
 */
function ocenKlasePociagu(czasGodzin) {
  if (typeof czasGodzin !== 'number' || !Number.isFinite(czasGodzin) || czasGodzin < 0) {
    throw new RangeError('Czas podróży musi być liczbą godzin nie mniejszą niż 0.');
  }
  const prog = POLITYKA_TRANSPORTU_I_ROZLICZENIA.progPierwszejKlasyGodziny;
  return {
    czasGodzin,
    progGodzin: prog,
    przyslugujePierwszaKlasa: czasGodzin > prog,
  };
}

/**
 * Parsuje datę z pola type="date" (YYYY-MM-DD) jako lokalną datę kalendarzową.
 * Zwraca null, gdy tekst nie jest poprawną datą.
 */
function parsujDateLokalna(tekst) {
  const dopasowanie = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(tekst).trim());
  if (!dopasowanie) return null;
  const rok = Number(dopasowanie[1]);
  const miesiac = Number(dopasowanie[2]);
  const dzien = Number(dopasowanie[3]);
  const data = new Date(rok, miesiac - 1, dzien);
  if (
    data.getFullYear() !== rok
    || data.getMonth() !== miesiac - 1
    || data.getDate() !== dzien
  ) {
    return null;
  }
  return data;
}

function formatujDate(data) {
  return new Intl.DateTimeFormat('pl-PL', { dateStyle: 'long' }).format(data);
}

/**
 * Liczy ostatni dzień na rozliczenie w Delegatce według [HR-POL-03 v3.0 §6]:
 * data powrotu + dniNaRozliczenie dni kalendarzowych.
 */
function obliczTerminRozliczenia(dataPowrotu) {
  if (!(dataPowrotu instanceof Date) || Number.isNaN(dataPowrotu.getTime())) {
    throw new RangeError('Data powrotu musi być poprawną datą.');
  }
  const dni = POLITYKA_TRANSPORTU_I_ROZLICZENIA.dniNaRozliczenie;
  const termin = new Date(
    dataPowrotu.getFullYear(),
    dataPowrotu.getMonth(),
    dataPowrotu.getDate() + dni,
  );
  return {
    dataPowrotu,
    dniNaRozliczenie: dni,
    ostatniDzienRozliczenia: termin,
  };
}

/* ---------- Formularz (DOM) ---------- */

const KOMUNIKAT_PUSTY = 'Uzupełnij liczbę nocy i cenę hotelu, aby zobaczyć wynik.';

function zbudujListeLokalizacji(select) {
  for (const [id, kategoria] of Object.entries(POLITYKA_NOCLEGU.kategorie)) {
    const limit = formatujKwote(kategoria.limitZaDobe * 100, kategoria.waluta, { bezGroszy: true });
    select.append(new Option(`${kategoria.nazwa} · ${limit} za dobę`, id));
  }
}

function odczytajLiczbeNocy(input) {
  if (input.validity.badInput) {
    return { wartosc: null, blad: 'Podaj liczbę nocy jako liczbę całkowitą, np. 3.' };
  }
  const tekst = input.value.trim();
  if (tekst === '') return { wartosc: null, blad: '' };
  if (!/^\d+$/.test(tekst) || Number(tekst) < 1) {
    return { wartosc: null, blad: 'Liczba nocy musi być liczbą całkowitą, co najmniej 1.' };
  }
  return { wartosc: Number(tekst), blad: '' };
}

function odczytajCene(input) {
  const tekst = input.value.trim();
  if (tekst === '') return { wartosc: null, blad: '' };
  const setne = parsujKwoteNaSetne(tekst);
  if (setne === null) {
    return { wartosc: null, blad: 'Podaj kwotę, np. 480 lub 480,50 (najwyżej 2 miejsca po przecinku).' };
  }
  return { wartosc: setne, blad: '' };
}

function pokazBlad(elementBledu, input, tekst) {
  elementBledu.textContent = tekst;
  elementBledu.hidden = !tekst;
  input.setAttribute('aria-invalid', tekst ? 'true' : 'false');
}

function uruchomFormularz() {
  const el = {
    formularz: document.getElementById('formularz-noclegu'),
    lokalizacja: document.getElementById('lokalizacja'),
    liczbaNocy: document.getElementById('liczba-nocy'),
    liczbaNocyBlad: document.getElementById('liczba-nocy-blad'),
    cena: document.getElementById('cena'),
    cenaBlad: document.getElementById('cena-blad'),
    cenaWaluta: document.getElementById('cena-waluta'),
    wynikPusty: document.getElementById('wynik-pusty'),
    wynik: document.getElementById('wynik'),
    limitDoba: document.getElementById('w-limit-doba'),
    limitLacznie: document.getElementById('w-limit-lacznie'),
    kosztLacznie: document.getElementById('w-koszt-lacznie'),
    roznica: document.getElementById('w-roznica'),
    procent: document.getElementById('w-procent'),
    status: document.getElementById('status'),
    statusTytul: document.getElementById('status-tytul'),
    statusOpis: document.getElementById('status-opis'),
    zrodlo: document.querySelectorAll('[data-zrodlo]'),
  };

  zbudujListeLokalizacji(el.lokalizacja);
  el.zrodlo.forEach((wezel) => { wezel.textContent = POLITYKA_NOCLEGU.zrodlo; });
  document.querySelectorAll('[data-zrodlo-klasy]').forEach((wezel) => {
    wezel.textContent = POLITYKA_TRANSPORTU_I_ROZLICZENIA.zrodloKlasy;
  });
  document.querySelectorAll('[data-zrodlo-rozliczenia]').forEach((wezel) => {
    wezel.textContent = POLITYKA_TRANSPORTU_I_ROZLICZENIA.zrodloRozliczenia;
  });

  function pokazStatus(wariant, tytul, opis) {
    el.status.className = `status status--${wariant}`;
    el.statusTytul.textContent = tytul;
    el.statusOpis.textContent = opis;
    el.status.hidden = false;
  }

  function pokazWynik(wynik, komunikat = KOMUNIKAT_PUSTY) {
    if (!wynik) {
      el.wynik.hidden = true;
      el.status.hidden = true;
      el.wynikPusty.textContent = komunikat;
      el.wynikPusty.hidden = false;
      return;
    }

    const waluta = wynik.waluta;
    el.limitDoba.textContent = formatujKwote(wynik.limitZaDobeSetne, waluta);
    el.limitLacznie.textContent = formatujKwote(wynik.limitLacznieSetne, waluta);
    el.kosztLacznie.textContent = formatujKwote(wynik.kosztLacznieSetne, waluta);
    el.roznica.textContent = formatujKwote(wynik.roznicaSetne, waluta, { zeZnakiem: true });
    el.procent.textContent = formatujProcentPrzekroczenia(wynik);
    el.wynikPusty.hidden = true;
    el.wynik.hidden = false;

    const prog = POLITYKA_NOCLEGU.progZgodyDyrektoraProcent;
    const zrodlo = POLITYKA_NOCLEGU.zrodlo;
    if (wynik.wymagaZgodyDyrektora) {
      pokazStatus('zgoda', POLITYKA_NOCLEGU.komunikatZgody,
        `Przekroczenie jest większe niż ${prog}% limitu [${zrodlo}].`);
    } else if (wynik.czyPrzekroczony) {
      pokazStatus('uwaga', 'Limit przekroczony',
        `Przekroczenie nie jest większe niż ${prog}% limitu – próg zgody dyrektora pionu nie został przekroczony [${zrodlo}].`);
    } else {
      pokazStatus('ok', 'Mieści się w limicie',
        `Koszt hotelu nie przekracza limitu noclegu [${zrodlo}].`);
    }
  }

  function aktualizuj() {
    const kategoria = POLITYKA_NOCLEGU.kategorie[el.lokalizacja.value];
    el.cenaWaluta.textContent = kategoria.waluta;

    const noce = odczytajLiczbeNocy(el.liczbaNocy);
    const cena = odczytajCene(el.cena);
    pokazBlad(el.liczbaNocyBlad, el.liczbaNocy, noce.blad);
    pokazBlad(el.cenaBlad, el.cena, cena.blad);

    if (noce.wartosc === null || cena.wartosc === null) {
      pokazWynik(null);
      return;
    }

    try {
      pokazWynik(obliczNocleg(el.lokalizacja.value, noce.wartosc, cena.wartosc));
    } catch (blad) {
      pokazWynik(null, blad.message);
    }
  }

  el.formularz.addEventListener('input', aktualizuj);
  el.formularz.addEventListener('change', aktualizuj);
  el.formularz.addEventListener('submit', (zdarzenie) => {
    zdarzenie.preventDefault();
    aktualizuj();
  });
  aktualizuj();
}

function odczytajCzasPociagu(input) {
  if (input.validity && input.validity.badInput) {
    return { wartosc: null, blad: 'Podaj czas podróży w godzinach, np. 2 lub 3,5.' };
  }
  const tekst = input.value.trim();
  if (tekst === '') return { wartosc: null, blad: '' };
  const godziny = parsujGodziny(tekst);
  if (godziny === null) {
    return { wartosc: null, blad: 'Podaj czas podróży w godzinach, np. 2 lub 3,5.' };
  }
  return { wartosc: godziny, blad: '' };
}

function odczytajDatePowrotu(input) {
  const tekst = input.value.trim();
  if (tekst === '') return { wartosc: null, blad: '' };
  const data = parsujDateLokalna(tekst);
  if (data === null) {
    return { wartosc: null, blad: 'Podaj poprawną datę powrotu z delegacji.' };
  }
  return { wartosc: data, blad: '' };
}

function uruchomFormularzTransportu() {
  const el = {
    formularz: document.getElementById('formularz-transportu'),
    czasPociagu: document.getElementById('czas-pociagu'),
    czasPociaguBlad: document.getElementById('czas-pociagu-blad'),
    statusKlasa: document.getElementById('status-klasa'),
    statusKlasaTytul: document.getElementById('status-klasa-tytul'),
    statusKlasaOpis: document.getElementById('status-klasa-opis'),
    dataPowrotu: document.getElementById('data-powrotu'),
    dataPowrotuBlad: document.getElementById('data-powrotu-blad'),
    statusRozliczenie: document.getElementById('status-rozliczenie'),
    statusRozliczenieTytul: document.getElementById('status-rozliczenie-tytul'),
    statusRozliczenieOpis: document.getElementById('status-rozliczenie-opis'),
  };

  function pokazStatusBloku(statusEl, tytulEl, opisEl, wariant, tytul, opis) {
    statusEl.className = `status status--${wariant}`;
    tytulEl.textContent = tytul;
    opisEl.textContent = opis;
    statusEl.hidden = false;
  }

  function ukryjStatus(statusEl) {
    statusEl.hidden = true;
  }

  function aktualizujKlase() {
    const odczyt = odczytajCzasPociagu(el.czasPociagu);
    pokazBlad(el.czasPociaguBlad, el.czasPociagu, odczyt.blad);
    if (odczyt.wartosc === null) {
      ukryjStatus(el.statusKlasa);
      return;
    }
    try {
      const wynik = ocenKlasePociagu(odczyt.wartosc);
      const zrodlo = POLITYKA_TRANSPORTU_I_ROZLICZENIA.zrodloKlasy;
      const prog = wynik.progGodzin;
      if (wynik.przyslugujePierwszaKlasa) {
        pokazStatusBloku(
          el.statusKlasa, el.statusKlasaTytul, el.statusKlasaOpis,
          'ok',
          'Przysługuje 1 klasa',
          `Podróż w jedną stronę trwa powyżej ${prog} godzin [${zrodlo}].`,
        );
      } else {
        pokazStatusBloku(
          el.statusKlasa, el.statusKlasaTytul, el.statusKlasaOpis,
          'uwaga',
          'Nie przysługuje 1 klasa',
          `1 klasa przysługuje tylko przy podróży trwającej powyżej ${prog} godzin [${zrodlo}].`,
        );
      }
    } catch (blad) {
      ukryjStatus(el.statusKlasa);
      pokazBlad(el.czasPociaguBlad, el.czasPociagu, blad.message);
    }
  }

  function aktualizujRozliczenie() {
    const odczyt = odczytajDatePowrotu(el.dataPowrotu);
    pokazBlad(el.dataPowrotuBlad, el.dataPowrotu, odczyt.blad);
    if (odczyt.wartosc === null) {
      ukryjStatus(el.statusRozliczenie);
      return;
    }
    try {
      const wynik = obliczTerminRozliczenia(odczyt.wartosc);
      const zrodlo = POLITYKA_TRANSPORTU_I_ROZLICZENIA.zrodloRozliczenia;
      pokazStatusBloku(
        el.statusRozliczenie, el.statusRozliczenieTytul, el.statusRozliczenieOpis,
        'ok',
        `Ostatni dzień na rozliczenie: ${formatujDate(wynik.ostatniDzienRozliczenia)}`,
        `${wynik.dniNaRozliczenie} dni kalendarzowych od powrotu (${formatujDate(wynik.dataPowrotu)}) w systemie Delegatka [${zrodlo}].`,
      );
    } catch (blad) {
      ukryjStatus(el.statusRozliczenie);
      pokazBlad(el.dataPowrotuBlad, el.dataPowrotu, blad.message);
    }
  }

  function aktualizuj() {
    aktualizujKlase();
    aktualizujRozliczenie();
  }

  el.formularz.addEventListener('input', aktualizuj);
  el.formularz.addEventListener('change', aktualizuj);
  el.formularz.addEventListener('submit', (zdarzenie) => {
    zdarzenie.preventDefault();
    aktualizuj();
  });
  aktualizuj();
}

function uruchomAplikacje() {
  uruchomFormularz();
  uruchomFormularzTransportu();
}

/* ---------- Start ---------- */

// W przeglądarce uruchom formularze; w Node.js tylko udostępnij funkcje do testów.
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', uruchomAplikacje);
  } else {
    uruchomAplikacje();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    POLITYKA_NOCLEGU,
    POLITYKA_TRANSPORTU_I_ROZLICZENIA,
    parsujKwoteNaSetne,
    obliczNocleg,
    formatujKwote,
    formatujProcentPrzekroczenia,
    parsujGodziny,
    ocenKlasePociagu,
    parsujDateLokalna,
    formatujDate,
    obliczTerminRozliczenia,
  };
}
