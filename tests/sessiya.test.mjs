import test from "node:test";
import assert from "node:assert/strict";
import { zagruzit } from "../tools/zagruzka.mjs";

const { O, Y } = zagruzit();
const pustoj = () => Y.pustojReestr(Y.SHABLON);
const DATA = "2026-09-27";
const poryadkovye = (sertifikaty) =>
  sertifikaty.map((s) => O.razobrat(s.nomer).poryadkovyj);

test("новая сессия: реестр как есть, прошлой пачки нет", () => {
  const r = pustoj();
  assert.deepEqual(Y.novayaSessiya(r), {
    reestr: r,
    doPoslednej: null,
    poslednyaya: null,
  });
});

test("две пачки подряд: в реестре обе, ничего не потерялось", () => {
  let s = Y.novayaSessiya(pustoj());
  const gk = Y.pachkaVSessii(
    s,
    { imena: ["А Б", "В Г", "Д Е"], kodKursa: "GK", data: DATA, nachatS: 1 },
    false,
  );
  s = gk.sessiya;
  const rl = Y.pachkaVSessii(
    s,
    { imena: ["Ж З", "И К"], kodKursa: "RL", data: DATA, nachatS: 1 },
    false,
  );
  s = rl.sessiya;
  const nomera = s.reestr.vydano.map((z) => z.nomer);
  assert.equal(nomera.length, 5);
  for (const x of gk.sertifikaty.concat(rl.sertifikaty))
    assert.ok(nomera.includes(x.nomer), x.nomer);
  assert.deepEqual(s.poslednyaya, {
    kodKursa: "RL",
    data: DATA,
    nachatS: 1,
    chislo: 2,
  });
  assert.equal(s.doPoslednej, gk.sessiya.reestr);
});

test("после пачки GK из трёх с 1 следующий номер GK — 4", () => {
  const { sessiya } = Y.pachkaVSessii(
    Y.novayaSessiya(pustoj()),
    { imena: ["А Б", "В Г", "Д Е"], kodKursa: "GK", data: DATA, nachatS: 1 },
    false,
  );
  assert.equal(Y.sleduyushchijNomer(sessiya.reestr, 2026, "GK"), 4);
});

test("переделать пачку после опечатки: те же номера, старые записи пачки ушли, прежние пачки на месте", () => {
  let s = Y.novayaSessiya(pustoj());
  const rl = Y.pachkaVSessii(
    s,
    { imena: ["Ж З", "И К"], kodKursa: "RL", data: DATA, nachatS: 1 },
    false,
  );
  s = rl.sessiya;
  const s2 = Y.pachkaVSessii(
    s,
    { imena: ["Иванва Анна", "Петров Пётр"], kodKursa: "GK", data: DATA, nachatS: 5 },
    false,
  );
  const zanovo = Y.pachkaVSessii(
    s2.sessiya,
    // Начало из аргументов не важно: берётся начало прошлой пачки.
    { imena: ["Иванова Анна", "Петров Пётр"], kodKursa: "GK", data: DATA, nachatS: 7 },
    true,
  );
  assert.deepEqual(poryadkovye(zanovo.sertifikaty), [5, 6]);
  assert.deepEqual(
    zanovo.sertifikaty.map((x) => x.nomer),
    s2.sertifikaty.map((x) => x.nomer),
  );
  assert.equal(zanovo.sertifikaty[0].imya, "Иванова Анна");
  assert.equal(
    zanovo.sessiya.reestr.vydano.length,
    s2.sessiya.reestr.vydano.length,
  );
  for (const x of rl.sertifikaty)
    assert.ok(zanovo.sessiya.reestr.vydano.some((z) => z.nomer === x.nomer));
  assert.equal(zanovo.sessiya.doPoslednej, s.reestr);
  assert.equal(zanovo.sessiya.doPoslednej, s2.sessiya.doPoslednej);
  assert.equal(zanovo.sessiya.poslednyaya.nachatS, 5);
});

test("переделанная пачка другой датой: записи старой даты пропадают", () => {
  const s = Y.pachkaVSessii(
    Y.novayaSessiya(pustoj()),
    { imena: ["А Б", "В Г"], kodKursa: "GK", data: DATA, nachatS: 1 },
    false,
  ).sessiya;
  const z = Y.pachkaVSessii(
    s,
    { imena: ["А Б", "В Г"], kodKursa: "GK", data: "2026-09-28", nachatS: 1 },
    true,
  );
  assert.deepEqual(
    z.sessiya.reestr.vydano.map((x) => x.data),
    ["2026-09-28", "2026-09-28"],
  );
});

test("переделать без прошлой пачки нельзя", () => {
  assert.throws(
    () =>
      Y.pachkaVSessii(
        Y.novayaSessiya(pustoj()),
        { imena: ["А Б"], kodKursa: "GK", data: DATA, nachatS: 1 },
        true,
      ),
    /[А-Яа-я]/,
  );
});

test("в реестре сессии нет имён", () => {
  const imena = ["Иванова Анна", "Петров Пётр", "Белова-Заречная Ксения"];
  let s = Y.novayaSessiya(pustoj());
  s = Y.pachkaVSessii(
    s,
    { imena, kodKursa: "GK", data: DATA, nachatS: 1 },
    false,
  ).sessiya;
  s = Y.pachkaVSessii(
    s,
    { imena: ["Сидоров Олег"], kodKursa: "RL", data: DATA, nachatS: 1 },
    false,
  ).sessiya;
  const tekst = Y.reestrVTekst(s.reestr);
  for (const imya of imena.concat("Сидоров Олег")) {
    assert.ok(!tekst.includes(imya), imya);
    assert.ok(!tekst.includes(imya.split(" ")[0]), imya);
  }
});
