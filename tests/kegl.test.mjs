import test from "node:test";
import assert from "node:assert/strict";
import { zagruzit } from "../tools/zagruzka.mjs";

const { Y } = zagruzit();
// Условная ширина: полкегля на знак. Настоящая мерка — canvas в браузере.
const izmerit = (t, px) => t.length * px * 0.5;
const RAMKA = { shirina: 2800, maxPx: 170, minPx: 90, porogDvuhStrok: 0.8 };
const DLINNOE = "Анна-Марина Константинопольская-Преображенская Святославовна";

test("миллиметры и пункты в пиксели при 300 точках на дюйм", () => {
  assert.equal(Y.mmVPx(297, 300), 3508);
  assert.equal(Y.mmVPx(210, 300), 2480);
  assert.equal(Y.ptVPx(72, 300), 300);
});

test("короткое имя — наибольший кегль, одна строка", () => {
  assert.deepEqual(Y.podobratKegl("Иван Иванов", RAMKA, izmerit), {
    px: 170,
    stroki: ["Иван Иванов"],
    melko: false,
  });
});

test("имя в 60 знаков — кегль меньше и перенос в две строки", () => {
  assert.equal(DLINNOE.length, 60);
  const r = Y.podobratKegl(DLINNOE, RAMKA, izmerit);
  assert.ok(r.px < 170, "кегль " + r.px);
  assert.equal(r.stroki.length, 2);
  for (const s of r.stroki) assert.ok(izmerit(s, r.px) <= RAMKA.shirina, s);
  assert.equal(
    r.stroki.join("").replace(/\s/g, ""),
    DLINNOE.replace(/\s/g, ""),
  );
  assert.equal(r.melko, false);
});

test("двойная фамилия переносится по дефису, дефис остаётся в первой строке", () => {
  const r = Y.podobratKegl(
    "Белова-Заречная",
    { ...RAMKA, shirina: 500 },
    izmerit,
  );
  assert.deepEqual(r.stroki, ["Белова-", "Заречная"]);
});

test("порядок слов не меняется", () => {
  const r = Y.podobratKegl(
    "в соусе том ям очень длинное",
    { ...RAMKA, shirina: 1200 },
    izmerit,
  );
  assert.equal(r.stroki.join(" "), "в соусе том ям очень длинное");
});

test("длинное имя не крупнее короткого", () => {
  const imena = [
    "Ли Ян",
    "Иван Иванов",
    "Константин Константинопольский",
    "Анна-Марина Константинопольская-Преображенская",
    DLINNOE,
  ];
  const kegli = imena.map((i) => Y.podobratKegl(i, RAMKA, izmerit).px);
  for (let i = 1; i < kegli.length; i++)
    assert.ok(kegli[i] <= kegli[i - 1], kegli.join(" "));
});

test("слово без места для переноса не выходит за рамку, а помечается «мелко»", () => {
  const slovo = "Я".repeat(80);
  const r = Y.podobratKegl(slovo, RAMKA, izmerit);
  assert.ok(izmerit(r.stroki[0], r.px) <= RAMKA.shirina);
  assert.equal(r.melko, true);
});

test("варианты переноса — по пробелам и по дефису между буквами", () => {
  assert.deepEqual(Y.variantyRazryva("А-Б В"), [
    ["А-", "Б В"],
    ["А-Б", "В"],
  ]);
  assert.deepEqual(Y.variantyRazryva("-А"), []);
});
