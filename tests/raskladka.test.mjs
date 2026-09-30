import test from "node:test";
import assert from "node:assert/strict";
import { zagruzit } from "../tools/zagruzka.mjs";

const { O, Y } = zagruzit();
// Шире настоящих шрифтов — с запасом.
const izmerit = (t, px) => t.length * px * 0.6;
const IMENA = [
  "Ли Ян",
  "Иванова Анна Сергеевна",
  "Анна-Марина Константинопольская-Преображенская Святославовна",
  "Белова-Заречная Ксения Игоревна",
];
const dannye = (imya) => ({
  imya,
  kurs: "Гончарный круг: основы",
  data: "2026-09-27",
  nomer: O.sobrat(2026, "GK", 17),
});

test("лист — A4 альбомный при 300 точках на дюйм", () => {
  assert.deepEqual(Y.razmerLista(Y.SHABLON), { shirina: 3508, vysota: 2480 });
  const r = Y.raskladka(Y.SHABLON, dannye("Ли Ян"), izmerit);
  assert.equal(r.shirina, 3508);
  assert.equal(r.vysota, 2480);
});

for (const imya of IMENA) {
  test("всё внутри безопасного поля: " + imya, () => {
    const r = Y.raskladka(Y.SHABLON, dannye(imya), izmerit);
    assert.deepEqual(Y.zaPolem(r, Y.SHABLON, izmerit), []);
  });
}

test("на листе имя, курс, дата, номер и адрес проверки; подстановки не остались", () => {
  const r = Y.raskladka(Y.SHABLON, dannye("Иванова Анна Сергеевна"), izmerit);
  const teksty = r.ops.filter((o) => o.tip === "tekst").map((o) => o.tekst);
  assert.ok(teksty.includes("Иванова Анна Сергеевна"));
  assert.ok(teksty.includes("«Гончарный круг: основы»"));
  assert.ok(teksty.includes("27 сентября 2026 г."));
  assert.ok(
    teksty.some(
      (t) => t.includes("26-GK-017-S") && t.includes(Y.SHABLON.adresProverki),
    ),
  );
  assert.ok(
    teksty.every((t) => !/[{}]/.test(t)),
    teksty.join(" | "),
  );
});

test("длинное имя разложено в две строки меньшим кеглем", () => {
  const korotkoe = Y.raskladka(Y.SHABLON, dannye("Ли Ян"), izmerit);
  const dlinnoe = Y.raskladka(Y.SHABLON, dannye(IMENA[2]), izmerit);
  assert.equal(dlinnoe.imya.stroki.length, 2);
  assert.ok(dlinnoe.imya.px < korotkoe.imya.px);
  const stroki = dlinnoe.ops.filter(
    (o) => o.tip === "tekst" && dlinnoe.imya.stroki.includes(o.tekst),
  );
  assert.equal(stroki.length, 2);
  assert.ok(stroki[1].y > stroki[0].y);
});

test("zaPolem замечает элемент у самого края", () => {
  const shablon = structuredClone(Y.SHABLON);
  shablon.elementy.push({
    tip: "tekst",
    tekst: "за краем",
    xMm: 3,
    yMm: 100,
    kegelPt: 12,
    shrift: "tekst",
    ves: 400,
    cvet: "tekst",
  });
  const r = Y.raskladka(shablon, dannye("Ли Ян"), izmerit);
  assert.deepEqual(Y.zaPolem(r, shablon, izmerit), ["текст «за краем»"]);
});

test("неизвестное поле в шаблоне — ошибка, а не пустое место", () => {
  const shablon = structuredClone(Y.SHABLON);
  shablon.elementy.push({
    tip: "tekst",
    tekst: "{nesushchestvuet}",
    xMm: 148,
    yMm: 100,
    kegelPt: 12,
    shrift: "tekst",
    ves: 400,
    cvet: "tekst",
  });
  assert.throws(
    () => Y.raskladka(shablon, dannye("Ли Ян"), izmerit),
    /nesushchestvuet/,
  );
});
