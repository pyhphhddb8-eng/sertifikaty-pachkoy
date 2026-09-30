import test from "node:test";
import assert from "node:assert/strict";
import { zagruzit } from "../tools/zagruzka.mjs";

const { O } = zagruzit();

test("номер собирается по схеме: год, курс, порядковый, проверочный знак", () => {
  const n = O.sobrat(2026, "GK", 17);
  assert.equal(n, "26GK017S");
  assert.equal(O.krasivo(n), "26-GK-017-S");
  assert.deepEqual(O.razobrat(n), {
    ok: true,
    nomer: n,
    god: 2026,
    kodKursa: "GK",
    poryadkovyj: 17,
  });
  assert.equal(O.sobrat(2026, "GK", 1), "26GK0015");
});

test("проверочный знак сходится у каждого номера курса", () => {
  for (let i = 1; i <= 999; i++)
    assert.equal(O.razobrat(O.sobrat(2026, "RL", i)).ok, true, String(i));
});

test("подмена любого одного знака ломает проверку", () => {
  for (const n of [
    O.sobrat(2026, "GK", 17),
    O.sobrat(2031, "GL", 999),
    O.sobrat(2026, "RL", 1),
  ]) {
    for (let i = 0; i < 8; i++) {
      for (const c of O.ALFAVIT) {
        if (c === n[i]) continue;
        const poddelka = n.slice(0, i) + c + n.slice(i + 1);
        assert.equal(O.razobrat(poddelka).ok, false, poddelka);
      }
    }
  }
});

test("соседний номер со старым проверочным знаком не проходит", () => {
  const n = O.sobrat(2026, "GK", 17);
  assert.equal(O.razobrat(n.slice(0, 4) + "018" + n[7]).prichina, "kontrol");
});

test("набранное руками прощается: регистр, дефисы, пробелы, двойники", () => {
  assert.equal(O.razobrat(" 26-gk-017-s ").ok, true);
  assert.equal(O.razobrat("26GК017S").ok, true); // К кириллицей
  assert.equal(O.razobrat("26GK0I7S").ok, true); // I вместо 1
  assert.equal(O.razobrat("№ 26 GK 017 S").ok, true);
});

test("неверный формат — отдельная причина", () => {
  assert.equal(O.razobrat("26GK17").prichina, "format");
  assert.equal(O.razobrat("").prichina, "format");
  assert.equal(O.razobrat("26GK0019").prichina, "kontrol");
});

test("sobrat не собирает номер из негодных частей", () => {
  assert.throws(() => O.sobrat(2026, "GI", 1));
  assert.throws(() => O.sobrat(2026, "GK", 0));
  assert.throws(() => O.sobrat(2026, "GK", 1000));
  assert.throws(() => O.sobrat(1999, "GK", 1));
});

test("дата пишется по-русски", () => {
  assert.equal(O.formatDaty("2026-09-27"), "27 сентября 2026 г.");
  assert.equal(O.formatDaty("2027-01-01"), "1 января 2027 г.");
  assert.throws(() => O.formatDaty("27.09.2026"));
});

test("поиск в реестре: выдан, не выдан, ошибка — и без имени", () => {
  const nomer = O.sobrat(2026, "GK", 1);
  const reestr = {
    shkola: "Ш",
    kursy: { GK: "Гончарный круг: основы" },
    vydano: [{ nomer, kurs: "GK", data: "2026-09-27" }],
  };
  assert.deepEqual(O.najti(reestr, O.krasivo(nomer).toLowerCase()), {
    sostoyanie: "vydan",
    nomer,
    kurs: "Гончарный круг: основы",
    data: "2026-09-27",
  });
  assert.equal(O.najti(reestr, O.sobrat(2026, "GK", 2)).sostoyanie, "net");
  assert.equal(O.najti(reestr, "26GK0019").sostoyanie, "oshibka");
});
