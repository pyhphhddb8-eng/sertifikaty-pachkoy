// Реестр примера для страницы проверки: выдача по списку-примеру из index.html.
// Запуск: node tools/primer-reestra.mjs
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { zagruzit, blok } from "./zagruzka.mjs";

export const PRIMER = { kodKursa: "GK", data: "2026-09-27", nachatS: 1 };

export function sobratReestrPrimera() {
  const { Y } = zagruzit();
  const { imena } = Y.razobratSpisok(blok("index.html", "primer"));
  return Y.vydat({ imena, ...PRIMER, reestr: Y.pustojReestr(Y.SHABLON) })
    .reestr;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { Y } = zagruzit();
  const reestr = sobratReestrPrimera();
  writeFileSync(
    new URL("../p/reestr.json", import.meta.url),
    Y.reestrVTekst(reestr),
  );
  console.log("p/reestr.json: " + reestr.vydano.length + " номеров");
}
