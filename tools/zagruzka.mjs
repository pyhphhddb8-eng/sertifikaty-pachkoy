// Достаёт блоки <script id="…"> из страниц и выполняет их в Node.
// Код живёт только в HTML — тесты проверяют ровно то, что работает в браузере.
import { readFileSync } from "node:fs";
import vm from "node:vm";

const KOREN = new URL("../", import.meta.url);

export function prochitat(put) {
  return readFileSync(new URL(put, KOREN), "utf8");
}

export function blok(put, id) {
  const m = prochitat(put).match(
    new RegExp('<script id="' + id + '"[^>]*>([\\s\\S]*?)</script>'),
  );
  if (!m) throw new Error("В " + put + ' нет блока <script id="' + id + '">');
  return m[1];
}

let zagruzheno = null;

export function zagruzit() {
  if (!zagruzheno) {
    vm.runInThisContext(blok("index.html", "obshchee"), {
      filename: "index.html#obshchee",
    });
    if (prochitat("index.html").includes('<script id="yadro">')) {
      vm.runInThisContext(blok("index.html", "yadro"), {
        filename: "index.html#yadro",
      });
    }
    zagruzheno = { O: globalThis.Obshchee, Y: globalThis.Yadro };
  }
  return zagruzheno;
}
