import test from "node:test";
import assert from "node:assert/strict";
import { zagruzit, prochitat, blok } from "../tools/zagruzka.mjs";
import { PRIMER, sobratReestrPrimera } from "../tools/primer-reestra.mjs";

const { O, Y } = zagruzit();

test("реестр на сайте совпадает с выдачей по списку-примеру", () => {
  assert.equal(
    prochitat("p/reestr.json"),
    Y.reestrVTekst(sobratReestrPrimera()),
  );
});

test("в реестре примера нет ни одного имени из списка", () => {
  const tekst = prochitat("p/reestr.json");
  const { imena } = Y.razobratSpisok(blok("index.html", "primer"));
  assert.equal(imena.length, 7);
  for (const imya of imena) {
    assert.ok(!tekst.includes(imya), imya);
    assert.ok(!tekst.includes(imya.split(" ")[0]), imya);
  }
});

test("страница проверки находит настоящий номер и не находит выдуманный", () => {
  const reestr = JSON.parse(prochitat("p/reestr.json"));
  const nastoyashchij = O.sobrat(2026, PRIMER.kodKursa, 1);
  assert.equal(O.najti(reestr, O.krasivo(nastoyashchij)).sostoyanie, "vydan");
  assert.equal(
    O.najti(reestr, O.sobrat(2026, PRIMER.kodKursa, 500)).sostoyanie,
    "net",
  );
  assert.equal(
    O.najti(
      reestr,
      nastoyashchij.slice(0, 7) + (nastoyashchij[7] === "0" ? "1" : "0"),
    ).sostoyanie,
    "oshibka",
  );
});
