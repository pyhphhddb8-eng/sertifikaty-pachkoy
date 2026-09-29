import test from "node:test";
import assert from "node:assert/strict";
import { zagruzit } from "../tools/zagruzka.mjs";

const { O, Y } = zagruzit();
const pustoj = () => Y.pustojReestr(Y.SHABLON);

test("пустой реестр знает курсы школы и не содержит выдач", () => {
  assert.deepEqual(pustoj(), {
    shkola: "Школа керамики «Обжиг»",
    kursy: {
      GK: "Гончарный круг: основы",
      RL: "Ручная лепка",
      GL: "Глазури и обжиг",
    },
    vydano: [],
  });
});

test("сколько разных участников, столько сертификатов и номеров подряд", () => {
  const { imena } = Y.razobratSpisok(
    "Иванова Анна\n\nиванова  анна\nПетров Пётр\nЛи Ян",
  );
  const v = Y.vydat({
    imena,
    kodKursa: "GK",
    data: "2026-09-27",
    nachatS: 5,
    reestr: pustoj(),
  });
  assert.deepEqual(
    v.sertifikaty.map((s) => s.imya),
    ["Иванова Анна", "Петров Пётр", "Ли Ян"],
  );
  assert.deepEqual(
    v.sertifikaty.map((s) => O.razobrat(s.nomer).poryadkovyj),
    [5, 6, 7],
  );
  assert.ok(v.sertifikaty.every((s) => O.razobrat(s.nomer).ok));
});

test("реестр содержит все выданные номера и ни одного имени", () => {
  const imena = [
    "Иванова Анна",
    "Петров Пётр",
    "Белова-Заречная Ксения Игоревна",
  ];
  const v = Y.vydat({
    imena,
    kodKursa: "RL",
    data: "2026-09-27",
    nachatS: 1,
    reestr: pustoj(),
  });
  const tekst = Y.reestrVTekst(v.reestr);
  for (const s of v.sertifikaty)
    assert.ok(tekst.includes('"' + s.nomer + '"'), s.nomer);
  for (const imya of imena) {
    assert.ok(!tekst.includes(imya), imya);
    assert.ok(!tekst.includes(imya.split(" ")[0]), imya);
  }
  assert.deepEqual(Object.keys(v.reestr.vydano[0]).sort(), [
    "data",
    "kurs",
    "nomer",
  ]);
});

test("новая пачка дописывается к старому реестру, нумерация продолжается", () => {
  const pervaya = Y.vydat({
    imena: ["А Б", "В Г"],
    kodKursa: "GK",
    data: "2026-09-27",
    nachatS: 1,
    reestr: pustoj(),
  });
  const staryj = Y.prochitatReestr(Y.reestrVTekst(pervaya.reestr));
  assert.equal(Y.sleduyushchijNomer(staryj, 2026, "GK"), 3);
  assert.equal(Y.sleduyushchijNomer(staryj, 2026, "RL"), 1);
  assert.equal(Y.sleduyushchijNomer(staryj, 2027, "GK"), 1);
  const vtoraya = Y.vydat({
    imena: ["Д Е"],
    kodKursa: "GK",
    data: "2026-10-15",
    nachatS: 3,
    reestr: staryj,
  });
  assert.equal(vtoraya.reestr.vydano.length, 3);
  assert.deepEqual(
    vtoraya.reestr.vydano.map((z) => z.nomer),
    [...vtoraya.reestr.vydano.map((z) => z.nomer)].sort(),
  );
});

test("номер, который уже есть в реестре, второй раз не выдаётся", () => {
  const pervaya = Y.vydat({
    imena: ["А Б"],
    kodKursa: "GK",
    data: "2026-09-27",
    nachatS: 1,
    reestr: pustoj(),
  });
  assert.throws(
    () =>
      Y.vydat({
        imena: ["В Г"],
        kodKursa: "GK",
        data: "2026-09-28",
        nachatS: 1,
        reestr: pervaya.reestr,
      }),
    /уже есть в реестре. Начните нумерацию с 2/,
  );
});

test("предел пачки — 50 участников", () => {
  const imena = (n) =>
    Array.from({ length: n }, (_, i) => "Участник " + (i + 1));
  assert.equal(Y.PREDEL, 50);
  assert.equal(
    Y.vydat({
      imena: imena(50),
      kodKursa: "GK",
      data: "2026-09-27",
      nachatS: 1,
      reestr: pustoj(),
    }).sertifikaty.length,
    50,
  );
  assert.throws(
    () =>
      Y.vydat({
        imena: imena(51),
        kodKursa: "GK",
        data: "2026-09-27",
        nachatS: 1,
        reestr: pustoj(),
      }),
    /предел пачки — 50/,
  );
});

test("ошибки ввода называются словами", () => {
  const v = (d) => () =>
    Y.vydat({
      imena: ["А Б"],
      kodKursa: "GK",
      data: "2026-09-27",
      nachatS: 1,
      reestr: pustoj(),
      ...d,
    });
  assert.throws(v({ imena: [] }), /пуст/);
  assert.throws(v({ kodKursa: "ZZ" }), /Неизвестный курс/);
  assert.throws(v({ nachatS: 999, imena: ["А", "Б"] }), /не хватит/);
  assert.throws(v({ nachatS: 0 }), /от 1/);
  assert.throws(v({ data: "" }), /ГГГГ-ММ-ДД/);
});

test("чужой или испорченный файл реестра не принимается", () => {
  assert.throws(() => Y.prochitatReestr("не json"), /не JSON/);
  assert.throws(() => Y.prochitatReestr('{"a":1}'), /не файл реестра/);
  assert.throws(
    () => Y.prochitatReestr('{"kursy":{},"vydano":[{"nomer":"26GK0019"}]}'),
    /испорченный номер/,
  );
});
