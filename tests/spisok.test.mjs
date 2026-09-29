import test from "node:test";
import assert from "node:assert/strict";
import { zagruzit } from "../tools/zagruzka.mjs";

const { Y } = zagruzit();

test("из грязного списка остаются разные участники, по одному на сертификат", () => {
  const tekst = [
    "ФИО",
    "",
    "  Иванова   Анна  ",
    "1. Петров Пётр,",
    "иванова анна",
    "Петров Петр",
    "\t",
    "2\tСидоров-Белый Олег\tsidorov@example.ru\t+7 900 000-00-00",
    "Иванова А.",
    "— Ли Ян;",
  ].join("\n");
  const r = Y.razobratSpisok(tekst);
  assert.deepEqual(r.imena, [
    "Иванова Анна",
    "Петров Пётр",
    "Сидоров-Белый Олег",
    "Иванова А.",
    "Ли Ян",
  ]);
  assert.deepEqual(r.povtory, ["иванова анна", "Петров Петр"]);
});

test("переводы строк Windows и неразрывные пробелы", () => {
  const r = Y.razobratSpisok("Иванова Анна\r\nПетров Пётр\r\n\r\n");
  assert.deepEqual(r.imena, ["Иванова Анна", "Петров Пётр"]);
});

test("точка в конце снимается, у инициала остаётся", () => {
  const r = Y.razobratSpisok("Иванова Анна.\nПетров А. Б.");
  assert.deepEqual(r.imena, ["Иванова Анна", "Петров А. Б."]);
});

test("пустой список — пусто", () => {
  assert.deepEqual(Y.razobratSpisok("\n \n\t\n"), {
    imena: [],
    povtory: [],
  });
});

test("строка-шапка таблицы с номером, почтой и телефоном пропускается", () => {
  const r = Y.razobratSpisok(
    "№\tФИО\tEmail\tТелефон\n1\tИванова Анна\ta@b.ru\t+7 900",
  );
  assert.deepEqual(r.imena, ["Иванова Анна"]);
});
