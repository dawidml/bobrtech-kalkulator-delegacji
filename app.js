'use strict';

/*
 * Kalkulator delegacji BOBRTECH – moduł: limit noclegu.
 *
 * Źródło zasad: [HR-POL-03 v3.0 §3] – fikcyjna polityka szkoleniowa firmy BOBRTECH.
 * Wszystkie limity noclegu i próg zgody dyrektora są w jednym obiekcie POLITYKA_NOCLEGU.
 * Zmiana polityki = zmiana tylko tego obiektu (lista lokalizacji w formularzu powstaje z niego).
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

/* ---------- Start ---------- */

// W przeglądarce uruchom formularz; w Node.js tylko udostępnij funkcje do testów.
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', uruchomFormularz);
  } else {
    uruchomFormularz();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    POLITYKA_NOCLEGU,
    parsujKwoteNaSetne,
    obliczNocleg,
    formatujKwote,
    formatujProcentPrzekroczenia,
  };
}
