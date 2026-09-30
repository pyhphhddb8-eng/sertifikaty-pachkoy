import test from "node:test";
import assert from "node:assert/strict";
import { prochitat } from "../tools/zagruzka.mjs";

for (const put of ["index.html", "p/index.html"]) {
  test(put + ": шрифты вшиты, а не подгружаются", () => {
    const html = prochitat(put);
    const blok = html.match(
      /\/\* ШРИФТЫ: начало \*\/([\s\S]*?)\/\* ШРИФТЫ: конец \*\//,
    )[1];
    // Prettier разворачивает правила на строки — сравниваем без пробелов.
    const pravila = (blok.match(/@font-face\s*\{[^}]*\}/g) || []).map((p) =>
      p.replace(/\s+/g, ""),
    );
    assert.equal(pravila.length, 3);
    assert.ok(
      pravila.some(
        (p) =>
          p.includes('"CormorantGaramond"') &&
          p.includes("font-weight:500700;"),
      ),
    );
    assert.ok(
      pravila.some(
        (p) => p.includes('"PTSans"') && p.includes("font-weight:400;"),
      ),
    );
    assert.ok(
      pravila.some(
        (p) => p.includes('"PTSans"') && p.includes("font-weight:700;"),
      ),
    );
    for (const p of pravila)
      assert.match(
        p,
        /src:url\(data:font\/woff2;base64,[A-Za-z0-9+/=]+\)format\("woff2"\)/,
      );
  });
}
