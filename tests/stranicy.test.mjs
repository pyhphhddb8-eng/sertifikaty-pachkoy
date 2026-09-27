import test from "node:test";
import assert from "node:assert/strict";
import { prochitat, blok } from "../tools/zagruzka.mjs";

const STRANICY = ["index.html", "p/index.html"];
const bezOtstupov = (s) =>
  s
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean)
    .join("\n");

test("блок obshchee одинаковый в генераторе и на странице проверки", () => {
  assert.equal(
    bezOtstupov(blok("p/index.html", "obshchee")),
    bezOtstupov(blok("index.html", "obshchee")),
  );
});

for (const put of STRANICY) {
  test(put + ": закрыта от поисковиков, язык русский", () => {
    const html = prochitat(put);
    assert.match(
      html,
      /<meta name="robots" content="noindex, nofollow"\s*\/?>/,
    );
    assert.match(html, /<html lang="ru">/);
    assert.match(html, /<meta charset="utf-8"\s*\/?>/);
  });

  test(put + ": ни одного внешнего запроса", () => {
    const html = prochitat(put);
    const plohie = [];
    for (const m of html.matchAll(
      /<(\w+)\b[^>]*\s(?:src|href)\s*=\s*["']?(?:https?:)?\/\//gi,
    )) {
      if (m[1].toLowerCase() !== "a") plohie.push(m[0]);
    }
    for (const m of html.matchAll(/(?<![\w])url\(\s*["']?(?!data:)[^)]*\)/g))
      plohie.push(m[0]);
    for (const m of html.matchAll(/@import|fetch\(\s*["'`](?:https?:)?\/\//g))
      plohie.push(m[0]);
    assert.deepEqual(plohie, []);
  });

  test(put + ": пометка про условный пример", () => {
    assert.match(prochitat(put), /школа вымышленная/);
  });
}

test("robots.txt закрывает сайт целиком", () => {
  assert.match(prochitat("robots.txt"), /User-agent: \*\s+Disallow: \//);
});
