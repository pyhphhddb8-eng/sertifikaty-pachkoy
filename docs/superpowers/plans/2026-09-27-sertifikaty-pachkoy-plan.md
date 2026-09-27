# Генератор сертификатов пачкой — план работ

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Один самодостаточный HTML-файл, который из списка участников делает пачку сертификатов A4 (архив PNG, лист для печати, реестр номеров), и страница проверки сертификата по номеру.

**Architecture:** Вся логика живёт прямо в страницах, в блоках `<script id="…">`. Блок `obshchee` (номер, дата, поиск в реестре) одинаковый в генераторе и на странице проверки; блок `yadro` (разбор списка, кегль, шаблон и раскладка, архив, реестр) — только в генераторе. Тесты на Node читают эти блоки прямо из HTML и выполняют их — второго экземпляра кода нет. Сертификат рисуется на canvas по шаблону-данным в миллиметрах; раскладка отделена от рисования, поэтому проверяется без браузера.

**Tech Stack:** HTML + CSS + JavaScript без библиотек и сборки; Node 24 (`node --test`) для тестов; системный `/usr/bin/python3` с fontTools для разовой подрезки шрифтов; Playwright (MCP) для проверок в браузере; GitHub Pages для выкладки.

**Spec:** `docs/superpowers/specs/2026-09-27-sertifikaty-pachkoy-design.md`

## Global Constraints

- Генератор — один файл `index.html`: работает двойным щелчком с диска (`file://`) и без интернета. Ни npm, ни сборки, ни сторонних библиотек в готовых страницах.
- Внешних запросов ноль: ни одного `src`/`href`/`url()`/`fetch` наружу. Разрешены только обычные ссылки `<a href="https://…">`.
- Шрифты подрезаны и вшиты в страницы base64: Cormorant Garamond (заголовки, имя) и PT Sans (остальной текст), SIL OFL 1.1.
- Лист — A4 альбомный, 300 точек на дюйм: **3508 × 2480** пикселей. Координаты шаблона — в миллиметрах. Ничего ближе **10 мм** к краю листа.
- Номер — 8 знаков: год (2 цифры) + код курса (2 знака) + порядковый (3 цифры) + проверочный знак. Алфавит `0123456789ABCDEFGHJKLMNPQRSTUVWXYZ` (без I и O). Проверочный знак — Луна по модулю 34. Показывается как `26-GK-017-S`.
- Курсы примера: `GK` «Гончарный круг: основы», `RL` «Ручная лепка», `GL` «Глазури и обжиг».
- Реестр — `p/reestr.json`, формат `{ "shkola": "…", "kursy": { "GK": "…" }, "vydano": [ { "nomer": "26GK0015", "kurs": "GK", "data": "2026-09-27" } ] }`. **Имён в реестре нет никогда.**
- Пачка — не больше **50** участников.
- Обе страницы закрыты от поисковиков: `<meta name="robots" content="noindex, nofollow">` и `robots.txt` с `Disallow: /`.
- На обеих страницах пометка: школа вымышленная, имена и номера условные.
- Со страницы генератора — ссылка на работу `https://pyhphhddb8-eng.github.io/klinika-152fz/` («Комплект 152-ФЗ для сайта с онлайн-записью»).
- Имена в коде — транслитом, комментарии и тексты — по-русски, как в прошлых работах. Коммиты — по-русски, с последней строкой `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **После каждой правки файла срабатывает Prettier** (хук `~/.claude/hooks/format-after-edit.mjs`): кавычки в JS станут двойными, `<meta …>` — `<meta … />`, CSS и объекты разойдутся на строки. Код в плане — по смыслу. Перед каждой правкой перечитать файл и искать место по смыслу (например, строку `g.Yadro = {`), а не по точным отступам. Тесты написаны так, чтобы форматирование их не ломало. Файлы, которые пишут скрипты (`tools/shrift.py`, `tools/primer-reestra.mjs`), Prettier не трогает до следующей правки руками.
- Тесты: `node --test tests/` из корня проекта.
- Выкладка — только после «да» пользователя: GitHub Pages, аккаунт `pyhphhddb8-eng`, репозиторий `sertifikaty-pachkoy`.

## Карта файлов

| Файл                                              | Что в нём                                                                      |
| ------------------------------------------------- | ------------------------------------------------------------------------------ |
| `index.html`                                      | Генератор: оформление, форма, блоки `primer`, `obshchee`, `yadro`, `interfejs` |
| `p/index.html`                                    | Страница проверки: оформление, форма, блоки `obshchee`, `proverka`             |
| `p/reestr.json`                                   | Реестр примера — собирается скриптом из списка-примера                         |
| `robots.txt`, `.nojekyll`                         | Закрыть от поисковиков; Pages без Jekyll                                       |
| `tools/zagruzka.mjs`                              | Достаёт блоки `<script id>` из HTML и выполняет их — для тестов и скриптов     |
| `tools/primer-reestra.mjs`                        | Пересобирает `p/reestr.json` из списка-примера                                 |
| `tools/shrift.py`                                 | Качает, подрезает и вшивает шрифты в обе страницы                              |
| `tools/shrift-podpis.txt`, `tools/licenzii/*.txt` | Откуда шрифты, лицензии                                                        |
| `tests/*.test.mjs`                                | Тесты по одному на тему                                                        |

---

### Task 1: Каркас страниц и номер сертификата

**Files:**

- Create: `index.html`, `p/index.html`, `robots.txt`, `.nojekyll`, `tools/zagruzka.mjs`
- Modify: `.gitignore`
- Test: `tests/nomer.test.mjs`, `tests/stranicy.test.mjs`

**Interfaces:**

- Produces: `window.Obshchee = { ALFAVIT, kontrolnyjZnak(telo: string): string, sobrat(god: number, kodKursa: string, poryadkovyj: number): string, normalizovat(vvod): string, razobrat(vvod): {ok:true, nomer, god, kodKursa, poryadkovyj} | {ok:false, prichina:'format'|'kontrol', nomer}, krasivo(nomer): string, formatDaty(iso: 'ГГГГ-ММ-ДД'): string, najti(reestr, vvod): {sostoyanie:'vydan', nomer, kurs, data} | {sostoyanie:'net'|'oshibka', nomer} }`
- Produces: `tools/zagruzka.mjs` — `prochitat(put): string`, `blok(put, id): string`, `zagruzit(): { O: Obshchee, Y: Yadro | undefined }`
- Produces: в обеих страницах метки `/* ШРИФТЫ: начало */` … `/* ШРИФТЫ: конец */`, пустые `<style id="oformlenie">` и `<main class="stranica">` — их заполняют задачи 7, 8, 9.

- [ ] **Step 1: Загрузчик блоков для тестов**

`tools/zagruzka.mjs`:

```js
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
```

- [ ] **Step 2: Написать тесты номера**

`tests/nomer.test.mjs`:

```js
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
```

- [ ] **Step 3: Написать тесты страниц**

`tests/stranicy.test.mjs`:

```js
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
```

- [ ] **Step 4: Запустить — тесты падают**

Run: `cd ~/Progects/sertifikaty-pachkoy && node --test tests/`
Expected: FAIL — `ENOENT … index.html`.

- [ ] **Step 5: Каркас генератора с блоком `obshchee`**

`index.html`:

```html
<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex, nofollow" />
    <title>Сертификаты пачкой — школа «Обжиг»</title>
    <style>
      /* ШРИФТЫ: начало */
      /* ШРИФТЫ: конец */
    </style>
    <style id="oformlenie"></style>
  </head>
  <body>
    <main class="stranica">
      <p class="uslovno">Пример: школа вымышленная, имена и номера условные.</p>
    </main>
    <div class="listy" id="listy" aria-hidden="true"></div>
    <script id="obshchee">
      (function (g) {
        "use strict";
        // Алфавит номера: цифры и заглавная латиница без I и O — их путают с 1 и 0.
        const ALFAVIT = "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ";
        const N = ALFAVIT.length;
        const ZNAK = "[0-9A-HJ-NP-Z]";
        const FORMAT = new RegExp("^\\d{2}" + ZNAK + "{2}\\d{3}" + ZNAK + "$");
        const KOD_KURSA = new RegExp("^" + ZNAK + "{2}$");

        // Проверочный знак по схеме Луна для алфавита из N знаков: ловит любую
        // замену одного знака. Это защита от опечатки и от перебора соседних
        // номеров, а не от подделки.
        function kontrolnyjZnak(telo) {
          let summa = 0;
          let mnozhitel = 2;
          for (let i = telo.length - 1; i >= 0; i--) {
            const kod = ALFAVIT.indexOf(telo[i]);
            if (kod < 0)
              throw new Error("Недопустимый знак в номере: " + telo[i]);
            const x = kod * mnozhitel;
            summa += Math.floor(x / N) + (x % N);
            mnozhitel = mnozhitel === 2 ? 1 : 2;
          }
          return ALFAVIT[(N - (summa % N)) % N];
        }

        // Номер из восьми знаков: год (2), код курса (2), порядковый (3), проверочный (1).
        function sobrat(god, kodKursa, poryadkovyj) {
          if (!Number.isInteger(god) || god < 2000 || god > 2099) {
            throw new Error("Год выдачи вне 2000–2099: " + god);
          }
          if (!KOD_KURSA.test(kodKursa)) {
            throw new Error(
              "Код курса — два знака из алфавита номера: " + kodKursa,
            );
          }
          if (
            !Number.isInteger(poryadkovyj) ||
            poryadkovyj < 1 ||
            poryadkovyj > 999
          ) {
            throw new Error("Порядковый номер вне 1–999: " + poryadkovyj);
          }
          const telo =
            String(god - 2000).padStart(2, "0") +
            kodKursa +
            String(poryadkovyj).padStart(3, "0");
          return telo + kontrolnyjZnak(telo);
        }

        // Номер набирают руками: прощаем регистр, пробелы, дефисы и буквы-двойники.
        const DVOJNIKI = {
          O: "0",
          I: "1",
          А: "A",
          В: "B",
          Е: "E",
          К: "K",
          М: "M",
          Н: "H",
          О: "0",
          Р: "P",
          С: "C",
          Т: "T",
          Х: "X",
          У: "Y",
        };
        function normalizovat(vvod) {
          return String(vvod)
            .toUpperCase()
            .replace(/[\s\-‐–—_.№#]/g, "")
            .replace(/./g, (c) => DVOJNIKI[c] || c);
        }

        function razobrat(vvod) {
          const nomer = normalizovat(vvod);
          if (!FORMAT.test(nomer))
            return { ok: false, prichina: "format", nomer };
          if (kontrolnyjZnak(nomer.slice(0, 7)) !== nomer[7])
            return { ok: false, prichina: "kontrol", nomer };
          return {
            ok: true,
            nomer,
            god: 2000 + Number(nomer.slice(0, 2)),
            kodKursa: nomer.slice(2, 4),
            poryadkovyj: Number(nomer.slice(4, 7)),
          };
        }

        function krasivo(nomer) {
          return (
            nomer.slice(0, 2) +
            "-" +
            nomer.slice(2, 4) +
            "-" +
            nomer.slice(4, 7) +
            "-" +
            nomer[7]
          );
        }

        const MESYACY = [
          "января",
          "февраля",
          "марта",
          "апреля",
          "мая",
          "июня",
          "июля",
          "августа",
          "сентября",
          "октября",
          "ноября",
          "декабря",
        ];
        function formatDaty(iso) {
          const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
          if (!m || Number(m[2]) < 1 || Number(m[2]) > 12)
            throw new Error("Дата не в виде ГГГГ-ММ-ДД: " + iso);
          return (
            Number(m[3]) + " " + MESYACY[Number(m[2]) - 1] + " " + m[1] + " г."
          );
        }

        // Ответ страницы проверки. Имени в ответе нет — его нет и в реестре.
        function najti(reestr, vvod) {
          const r = razobrat(vvod);
          if (!r.ok) return { sostoyanie: "oshibka", nomer: r.nomer };
          const zapis = reestr.vydano.find((z) => z.nomer === r.nomer);
          if (!zapis) return { sostoyanie: "net", nomer: r.nomer };
          return {
            sostoyanie: "vydan",
            nomer: r.nomer,
            kurs: reestr.kursy[zapis.kurs] || zapis.kurs,
            data: zapis.data,
          };
        }

        g.Obshchee = {
          ALFAVIT,
          kontrolnyjZnak,
          sobrat,
          normalizovat,
          razobrat,
          krasivo,
          formatDaty,
          najti,
        };
      })(typeof window !== "undefined" ? window : globalThis);
    </script>
  </body>
</html>
```

- [ ] **Step 6: Каркас страницы проверки**

`p/index.html` — та же шапка документа, заголовок `<title>Проверка сертификата — школа «Обжиг»</title>`, те же метки шрифтов, пустой `<style id="oformlenie">`, `<main class="stranica">` с той же строкой `<p class="uslovno">Пример: школа вымышленная, номера условные.</p>`, **без** `<div class="listy">`, и блок `<script id="obshchee">` — копия блока из `index.html` символ в символ (скопировать командой, а не руками):

```bash
cd ~/Progects/sertifikaty-pachkoy && mkdir -p p && python3 - <<'EOF'
import re, pathlib
src = pathlib.Path('index.html').read_text(encoding='utf-8')
blok = re.search(r'<script id="obshchee">[\s\S]*?</script>', src).group(0)
html = f'''<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Проверка сертификата — школа «Обжиг»</title>
<style>
/* ШРИФТЫ: начало */
/* ШРИФТЫ: конец */
</style>
<style id="oformlenie">
</style>
</head>
<body>
<main class="stranica">
<p class="uslovno">Пример: школа вымышленная, номера условные.</p>
</main>
{blok}
</body>
</html>
'''
pathlib.Path('p/index.html').write_text(html, encoding='utf-8')
EOF
```

- [ ] **Step 7: robots, .nojekyll, .gitignore**

`robots.txt`:

```
User-agent: *
Disallow: /
```

`.nojekyll` — пустой файл. В `.gitignore` дописать:

```
tools/.shrift-vremenno/
proverka-vremenno/
```

- [ ] **Step 8: Запустить — тесты проходят**

Run: `node --test tests/`
Expected: PASS, все тесты `nomer` и `stranicy` зелёные.

- [ ] **Step 9: Commit**

```bash
git add index.html p/index.html robots.txt .nojekyll .gitignore tools/zagruzka.mjs tests/
git commit -m "Каркас страниц и номер сертификата с проверочным знаком

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Разбор списка участников

**Files:**

- Modify: `index.html` — добавить блок `<script id="yadro">` сразу после блока `obshchee`
- Test: `tests/spisok.test.mjs`

**Interfaces:**

- Consumes: `window.Obshchee`
- Produces: `window.Yadro = { PREDEL: 50, razobratSpisok(tekst): { imena: string[], povtory: string[] } }` — последующие задачи добавляют разделы в этот блок перед строкой `g.Yadro = {` и дописывают имена в объект экспорта.

- [ ] **Step 1: Написать тесты**

`tests/spisok.test.mjs`:

```js
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
  const r = Y.razobratSpisok("Иванова Анна\r\nПетров Пётр\r\n\r\n");
  assert.deepEqual(r.imena, ["Иванова Анна", "Петров Пётр"]);
});

test("точка в конце снимается, у инициала остаётся", () => {
  const r = Y.razobratSpisok("Иванова Анна.\nПетров А. Б.");
  assert.deepEqual(r.imena, ["Иванова Анна", "Петров А. Б."]);
});

test("пустой список — пусто", () => {
  assert.deepEqual(Y.razobratSpisok("\n \n\t\n"), { imena: [], povtory: [] });
});
```

- [ ] **Step 2: Запустить — падает**

Run: `node --test tests/spisok.test.mjs`
Expected: FAIL — `Cannot read properties of undefined (reading 'razobratSpisok')`.

- [ ] **Step 3: Блок `yadro` с разбором списка**

В `index.html` сразу после закрывающего `</script>` блока `obshchee` вставить:

```html
<script id="yadro">
  (function (g) {
    "use strict";
    const O = g.Obshchee;
    // Предел пачки: пятьдесят листов A4 в 300 точках на дюйм — и так ощутимый вес.
    const PREDEL = 50;

    /* ---------- Список участников ---------- */

    const ZAGOLOVKI = new Set([
      "фио",
      "имя",
      "участник",
      "участники",
      "фамилияимя",
      "фамилияимяотчество",
      "список",
    ]);

    function kluchImeni(imya) {
      return imya.toLowerCase().replace(/ё/g, "е").replace(/\s+/g, " ");
    }

    // Строка из таблицы приходит ячейками через табуляцию: номер строки, имя,
    // почта, телефон. Имя — это ячейки с буквами и без «@».
    function razobratStroku(stroka) {
      const yachejki = stroka
        .replace(/ /g, " ")
        .split("\t")
        .map((y) => y.trim())
        .filter((y) => /\p{L}/u.test(y) && !y.includes("@"));
      return yachejki
        .join(" ")
        .replace(/^(?:\d+[.)]|[-–—•*])\s*/, "")
        .replace(/[,;]+$/, "")
        .replace(/(?<=\p{L}{2})\.$/u, "")
        .replace(/\s+/g, " ")
        .trim();
    }

    function razobratSpisok(tekst) {
      const imena = [];
      const povtory = [];
      const vidennye = new Set();
      for (const stroka of String(tekst).split(/\r\n|\r|\n/)) {
        const imya = razobratStroku(stroka);
        if (!imya) continue;
        const kluch = kluchImeni(imya);
        if (ZAGOLOVKI.has(kluch.replace(/[\s.]/g, ""))) continue;
        if (vidennye.has(kluch)) {
          povtory.push(imya);
          continue;
        }
        vidennye.add(kluch);
        imena.push(imya);
      }
      return { imena, povtory };
    }

    g.Yadro = {
      PREDEL,
      razobratSpisok,
    };
  })(typeof window !== "undefined" ? window : globalThis);
</script>
```

- [ ] **Step 4: Запустить — проходит**

Run: `node --test tests/`
Expected: PASS все.

- [ ] **Step 5: Commit**

```bash
git add index.html tests/spisok.test.mjs
git commit -m "Разбор списка участников: таблица, письмо, повторы

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Размер листа и кегль имени

**Files:**

- Modify: `index.html` — раздел в блоке `yadro`
- Test: `tests/kegl.test.mjs`

**Interfaces:**

- Consumes: —
- Produces: `mmVPx(mm, dpi): number` (округлено), `ptVPx(pt, dpi): number`, `variantyRazryva(tekst): [string, string][]`, `podobratKegl(tekst, { shirina, maxPx, minPx, porogDvuhStrok }, izmerit(tekst, px) => number): { px, stroki: string[], melko: boolean }`

- [ ] **Step 1: Написать тесты**

`tests/kegl.test.mjs`:

```js
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
```

- [ ] **Step 2: Запустить — падает**

Run: `node --test tests/kegl.test.mjs`
Expected: FAIL — `Y.mmVPx is not a function`.

- [ ] **Step 3: Реализация**

В блоке `yadro` перед строкой `  g.Yadro = {` вставить:

```js
/* ---------- Бумага ---------- */

function mmVPx(mm, dpi) {
  return Math.round((mm / 25.4) * dpi);
}
function ptVPx(pt, dpi) {
  return (pt / 72) * dpi;
}

/* ---------- Кегль и перенос имени ---------- */

// Где имя можно перенести: на пробеле или после дефиса двойной фамилии.
function variantyRazryva(tekst) {
  const varianty = [];
  for (let i = 1; i < tekst.length - 1; i++) {
    if (tekst[i] === " ") {
      varianty.push([tekst.slice(0, i), tekst.slice(i + 1)]);
    } else if (
      tekst[i] === "-" &&
      /\p{L}/u.test(tekst[i - 1]) &&
      /\p{L}/u.test(tekst[i + 1])
    ) {
      varianty.push([tekst.slice(0, i + 1), tekst.slice(i + 1)]);
    }
  }
  return varianty;
}

// Кегль идёт вниз от наибольшего. Пока он крупный, имя стоит в одну строку;
// в две строки его пускаем, только когда кегль опустился до порога, — иначе
// длинное имя вышло бы крупнее короткого. За рамку имя не выходит никогда:
// ниже minPx кегль продолжает уменьшаться, но результат помечается «мелко».
// Разрыв выбирается целиком по всей строке, слова не переставляются.
function podobratKegl(tekst, ramka, izmerit) {
  const { shirina, maxPx, minPx, porogDvuhStrok } = ramka;
  const razryvy = variantyRazryva(tekst);
  const shag = Math.max(1, Math.round(maxPx / 100));
  for (let px = maxPx; px >= 1; px -= shag) {
    if (izmerit(tekst, px) <= shirina)
      return { px, stroki: [tekst], melko: px < minPx };
    if (px > maxPx * porogDvuhStrok) continue;
    let luchshij = null;
    for (const [a, b] of razryvy) {
      const w = Math.max(izmerit(a, px), izmerit(b, px));
      if (w <= shirina && (!luchshij || w < luchshij.w))
        luchshij = { w, stroki: [a, b] };
    }
    if (luchshij) return { px, stroki: luchshij.stroki, melko: px < minPx };
  }
  return { px: 1, stroki: [tekst], melko: true };
}
```

Экспорт заменить на:

```js
g.Yadro = {
  PREDEL,
  razobratSpisok,
  mmVPx,
  ptVPx,
  variantyRazryva,
  podobratKegl,
};
```

- [ ] **Step 4: Запустить — проходит**

Run: `node --test tests/`
Expected: PASS все.

- [ ] **Step 5: Commit**

```bash
git add index.html tests/kegl.test.mjs
git commit -m "Кегль имени под длину и перенос двойных фамилий

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Шаблон сертификата, раскладка и рисование

**Files:**

- Modify: `index.html` — раздел в блоке `yadro`
- Test: `tests/raskladka.test.mjs`

**Interfaces:**

- Consumes: `Obshchee.formatDaty`, `Obshchee.krasivo`, `mmVPx`, `ptVPx`, `podobratKegl`
- Produces:
  - `SHABLON` — объект-данные (см. код), `SHABLON.kursy: {kod, nazvanie}[]`, `SHABLON.shrifty = { zagolovok: 'Cormorant Garamond', tekst: 'PT Sans' }`
  - `razmerLista(shablon): { shirina: 3508, vysota: 2480 }`
  - `raskladka(shablon, { imya, kurs, data, nomer }, izmerit(tekst, px, semejstvo, ves) => number): { shirina, vysota, ops: Op[], imya: { px, stroki, melko } }`, где `Op` — `{tip:'zalivka'|'ramka'|'liniya'|'krug'|'tekst', …}`
  - `zaPolem(raskl, shablon, izmerit): string[]` — что вылезло за безопасное поле
  - `izmeritCanvas(ctx)` → функция `izmerit`; `narisovat(ctx, raskl)` — только в браузере

- [ ] **Step 1: Написать тесты**

`tests/raskladka.test.mjs`:

```js
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
```

- [ ] **Step 2: Запустить — падает**

Run: `node --test tests/raskladka.test.mjs`
Expected: FAIL — `Cannot read properties of undefined (reading …)` на `Y.SHABLON`.

- [ ] **Step 3: Реализация**

В блоке `yadro` перед `  g.Yadro = {` вставить:

```js
function razmerLista(shablon) {
  return {
    shirina: mmVPx(shablon.list.shirinaMm, shablon.list.dpi),
    vysota: mmVPx(shablon.list.vysotaMm, shablon.list.dpi),
  };
}

/* ---------- Шаблон ---------- */

// Шаблон — данные: координаты в миллиметрах от левого верхнего угла листа,
// y у текста — базовая линия. Поменять школу или поле можно здесь,
// не трогая рисование.
const SHABLON = {
  list: { shirinaMm: 297, vysotaMm: 210, dpi: 300 },
  // Принтер не печатает у самого края листа: ничего не ставим ближе 10 мм.
  bezopasnoePoleMm: 10,
  cveta: {
    fon: "#fbf7f1",
    glavnyj: "#8a4b2a",
    tekst: "#2b211c",
    tihij: "#76675d",
  },
  shrifty: { zagolovok: "Cormorant Garamond", tekst: "PT Sans" },
  shkola: {
    nazvanie: "Школа керамики «Обжиг»",
    rukovoditel: "А. В. Гончарова",
  },
  kursy: [
    { kod: "GK", nazvanie: "Гончарный круг: основы" },
    { kod: "RL", nazvanie: "Ручная лепка" },
    { kod: "GL", nazvanie: "Глазури и обжиг" },
  ],
  adresProverki: "pyhphhddb8-eng.github.io/sertifikaty-pachkoy/p",
  elementy: [
    { tip: "zalivka", cvet: "fon" },
    { tip: "ramka", otstupMm: 12, tolshinaMm: 0.9, cvet: "glavnyj" },
    { tip: "ramka", otstupMm: 15, tolshinaMm: 0.3, cvet: "glavnyj" },
    {
      tip: "tekst",
      tekst: "{shkola}",
      propisnye: true,
      xMm: 148.5,
      yMm: 36,
      kegelPt: 13,
      shrift: "tekst",
      ves: 700,
      cvet: "glavnyj",
    },
    {
      tip: "tekst",
      tekst: "Сертификат",
      propisnye: true,
      xMm: 148.5,
      yMm: 64,
      kegelPt: 54,
      shrift: "zagolovok",
      ves: 600,
      cvet: "tekst",
    },
    {
      tip: "tekst",
      tekst: "об окончании курса",
      xMm: 148.5,
      yMm: 80,
      kegelPt: 15,
      shrift: "tekst",
      ves: 400,
      cvet: "tihij",
    },
    {
      tip: "tekst",
      tekst: "«{kurs}»",
      xMm: 148.5,
      yMm: 95,
      kegelPt: 24,
      shirinaMm: 230,
      shrift: "zagolovok",
      ves: 600,
      cvet: "glavnyj",
    },
    {
      tip: "tekst",
      tekst: "выдан",
      xMm: 148.5,
      yMm: 110,
      kegelPt: 14,
      shrift: "tekst",
      ves: 400,
      cvet: "tihij",
    },
    {
      tip: "imya",
      xMm: 148.5,
      centrMm: 134,
      shirinaMm: 235,
      maxPt: 44,
      minPt: 24,
      porogDvuhStrok: 0.8,
      mezhdustrochie: 1.1,
      shrift: "zagolovok",
      ves: 600,
      cvet: "tekst",
    },
    {
      tip: "liniya",
      x1Mm: 118.5,
      x2Mm: 178.5,
      yMm: 154,
      tolshinaMm: 0.3,
      cvet: "glavnyj",
    },
    {
      tip: "tekst",
      tekst: "{data}",
      xMm: 62,
      yMm: 171,
      kegelPt: 13,
      shrift: "tekst",
      ves: 700,
      cvet: "tekst",
    },
    {
      tip: "liniya",
      x1Mm: 34,
      x2Mm: 90,
      yMm: 174,
      tolshinaMm: 0.25,
      cvet: "tihij",
    },
    {
      tip: "tekst",
      tekst: "дата выдачи",
      xMm: 62,
      yMm: 179,
      kegelPt: 9.5,
      shrift: "tekst",
      ves: 400,
      cvet: "tihij",
    },
    {
      tip: "krug",
      xMm: 148.5,
      yMm: 172,
      rMm: 13,
      tolshinaMm: 0.25,
      punktir: true,
      cvet: "tihij",
    },
    {
      tip: "tekst",
      tekst: "М. П.",
      xMm: 148.5,
      yMm: 174,
      kegelPt: 10,
      shrift: "tekst",
      ves: 400,
      cvet: "tihij",
    },
    {
      tip: "tekst",
      tekst: "{rukovoditel}",
      xMm: 235,
      yMm: 171,
      kegelPt: 13,
      shrift: "tekst",
      ves: 700,
      cvet: "tekst",
    },
    {
      tip: "liniya",
      x1Mm: 207,
      x2Mm: 263,
      yMm: 174,
      tolshinaMm: 0.25,
      cvet: "tihij",
    },
    {
      tip: "tekst",
      tekst: "руководитель школы",
      xMm: 235,
      yMm: 179,
      kegelPt: 9.5,
      shrift: "tekst",
      ves: 400,
      cvet: "tihij",
    },
    {
      tip: "tekst",
      tekst: "№ {nomer} · проверка: {adres}",
      xMm: 148.5,
      yMm: 192,
      kegelPt: 10,
      shrift: "tekst",
      ves: 400,
      cvet: "tihij",
    },
  ],
};

/* ---------- Раскладка: шаблон + данные → список действий рисования ---------- */

// izmerit(tekst, px, semejstvo, ves) → ширина текста в пикселях.
// dannye: { imya, kurs (название), data ('ГГГГ-ММ-ДД'), nomer (8 знаков) }.
function raskladka(shablon, dannye, izmerit) {
  const dpi = shablon.list.dpi;
  const mm = (v) => (v / 25.4) * dpi;
  const { shirina, vysota } = razmerLista(shablon);
  const znacheniya = {
    shkola: shablon.shkola.nazvanie,
    rukovoditel: shablon.shkola.rukovoditel,
    adres: shablon.adresProverki,
    kurs: dannye.kurs,
    data: O.formatDaty(dannye.data),
    nomer: O.krasivo(dannye.nomer),
  };
  const podstavit = (s) =>
    s.replace(/\{(\w+)\}/g, (_, k) => {
      if (!(k in znacheniya))
        throw new Error("В шаблоне неизвестное поле {" + k + "}");
      return znacheniya[k];
    });
  const cvet = (e) => shablon.cveta[e.cvet];
  const shriftOp = (e) => ({
    shrift: shablon.shrifty[e.shrift],
    ves: e.ves,
    cvet: cvet(e),
  });
  const izmeritDlya = (e) => (t, px) =>
    izmerit(t, px, shablon.shrifty[e.shrift], e.ves);

  const ops = [];
  let imya = null;
  for (const e of shablon.elementy) {
    switch (e.tip) {
      case "zalivka":
        ops.push({
          tip: "zalivka",
          x: 0,
          y: 0,
          w: shirina,
          h: vysota,
          cvet: cvet(e),
        });
        break;
      case "ramka": {
        const o = mm(e.otstupMm);
        ops.push({
          tip: "ramka",
          x: o,
          y: o,
          w: shirina - 2 * o,
          h: vysota - 2 * o,
          tolshina: mm(e.tolshinaMm),
          cvet: cvet(e),
        });
        break;
      }
      case "liniya":
        ops.push({
          tip: "liniya",
          x1: mm(e.x1Mm),
          y1: mm(e.yMm),
          x2: mm(e.x2Mm),
          y2: mm(e.yMm),
          tolshina: mm(e.tolshinaMm),
          cvet: cvet(e),
        });
        break;
      case "krug":
        ops.push({
          tip: "krug",
          x: mm(e.xMm),
          y: mm(e.yMm),
          r: mm(e.rMm),
          tolshina: mm(e.tolshinaMm),
          punktir: !!e.punktir,
          cvet: cvet(e),
        });
        break;
      case "tekst": {
        let tekst = podstavit(e.tekst);
        if (e.propisnye) tekst = tekst.toUpperCase();
        let px = ptVPx(e.kegelPt, dpi);
        if (e.shirinaMm) {
          px = podobratKegl(
            tekst,
            {
              shirina: mm(e.shirinaMm),
              maxPx: px,
              minPx: px * 0.6,
              porogDvuhStrok: 0,
            },
            izmeritDlya(e),
          ).px;
        }
        ops.push({
          tip: "tekst",
          tekst,
          x: mm(e.xMm),
          y: mm(e.yMm),
          px,
          ...shriftOp(e),
        });
        break;
      }
      case "imya": {
        imya = podobratKegl(
          dannye.imya,
          {
            shirina: mm(e.shirinaMm),
            maxPx: ptVPx(e.maxPt, dpi),
            minPx: ptVPx(e.minPt, dpi),
            porogDvuhStrok: e.porogDvuhStrok,
          },
          izmeritDlya(e),
        );
        const shagStroki = imya.px * e.mezhdustrochie;
        // 0,35 кегля — поправка от середины строчных букв к базовой линии.
        const bazovaya = mm(e.centrMm) + imya.px * 0.35;
        imya.stroki.forEach((s, i) => {
          const y = bazovaya + (i - (imya.stroki.length - 1) / 2) * shagStroki;
          ops.push({
            tip: "tekst",
            tekst: s,
            x: mm(e.xMm),
            y,
            px: imya.px,
            ...shriftOp(e),
          });
        });
        break;
      }
      default:
        throw new Error("Неизвестный элемент шаблона: " + e.tip);
    }
  }
  return { shirina, vysota, ops, imya };
}

// Что вылезло за безопасное поле. Пустой список — лист печатается целиком.
function zaPolem(raskl, shablon, izmerit) {
  const pole = (shablon.bezopasnoePoleMm / 25.4) * shablon.list.dpi;
  const vylezli = [];
  for (const op of raskl.ops) {
    let k;
    if (op.tip === "zalivka") continue;
    if (op.tip === "ramka") {
      const t = op.tolshina / 2;
      k = { l: op.x - t, r: op.x + op.w + t, v: op.y - t, n: op.y + op.h + t };
    } else if (op.tip === "liniya") {
      const t = op.tolshina / 2;
      k = {
        l: Math.min(op.x1, op.x2),
        r: Math.max(op.x1, op.x2),
        v: Math.min(op.y1, op.y2) - t,
        n: Math.max(op.y1, op.y2) + t,
      };
    } else if (op.tip === "krug") {
      const r = op.r + op.tolshina / 2;
      k = { l: op.x - r, r: op.x + r, v: op.y - r, n: op.y + r };
    } else {
      const w = izmerit(op.tekst, op.px, op.shrift, op.ves);
      k = {
        l: op.x - w / 2,
        r: op.x + w / 2,
        v: op.y - op.px * 0.8,
        n: op.y + op.px * 0.25,
      };
    }
    if (
      k.l < pole ||
      k.v < pole ||
      k.r > raskl.shirina - pole ||
      k.n > raskl.vysota - pole
    ) {
      vylezli.push(op.tip === "tekst" ? "текст «" + op.tekst + "»" : op.tip);
    }
  }
  return vylezli;
}

/* ---------- Рисование на canvas (только в браузере) ---------- */

function shriftCanvas(px, semejstvo, ves) {
  return ves + " " + px + 'px "' + semejstvo + '"';
}

function izmeritCanvas(ctx) {
  return (tekst, px, semejstvo, ves) => {
    ctx.font = shriftCanvas(px, semejstvo, ves);
    return ctx.measureText(tekst).width;
  };
}

function narisovat(ctx, raskl) {
  ctx.save();
  for (const op of raskl.ops) {
    if (op.tip === "zalivka") {
      ctx.fillStyle = op.cvet;
      ctx.fillRect(op.x, op.y, op.w, op.h);
    } else if (op.tip === "ramka") {
      ctx.strokeStyle = op.cvet;
      ctx.lineWidth = op.tolshina;
      ctx.setLineDash([]);
      ctx.strokeRect(op.x, op.y, op.w, op.h);
    } else if (op.tip === "liniya") {
      ctx.strokeStyle = op.cvet;
      ctx.lineWidth = op.tolshina;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(op.x1, op.y1);
      ctx.lineTo(op.x2, op.y2);
      ctx.stroke();
    } else if (op.tip === "krug") {
      ctx.strokeStyle = op.cvet;
      ctx.lineWidth = op.tolshina;
      ctx.setLineDash(op.punktir ? [op.tolshina * 6, op.tolshina * 4] : []);
      ctx.beginPath();
      ctx.arc(op.x, op.y, op.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (op.tip === "tekst") {
      ctx.fillStyle = op.cvet;
      ctx.font = shriftCanvas(op.px, op.shrift, op.ves);
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(op.tekst, op.x, op.y);
    }
  }
  ctx.restore();
}
```

Экспорт:

```js
g.Yadro = {
  PREDEL,
  razobratSpisok,
  mmVPx,
  ptVPx,
  variantyRazryva,
  podobratKegl,
  razmerLista,
  SHABLON,
  raskladka,
  zaPolem,
  izmeritCanvas,
  narisovat,
};
```

- [ ] **Step 4: Запустить — проходит**

Run: `node --test tests/`
Expected: PASS все.

- [ ] **Step 5: Commit**

```bash
git add index.html tests/raskladka.test.mjs
git commit -m "Шаблон сертификата в миллиметрах, раскладка и проверка поля печати

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Архив ZIP без сжатия

**Files:**

- Modify: `index.html` — раздел в блоке `yadro`
- Test: `tests/zip.test.mjs`

**Interfaces:**

- Consumes: `Obshchee.krasivo`
- Produces: `crc32(Uint8Array): number`, `vesZip([{imya, razmer}]): number`, `sobratZip([{imya, dannye: Uint8Array}], kogda?: Date): Uint8Array`, `imyaFajla(nomer, imya): string`

- [ ] **Step 1: Написать тесты**

`tests/zip.test.mjs`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { writeFileSync, mkdtempSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { zagruzit } from "../tools/zagruzka.mjs";

const { Y } = zagruzit();
const enc = new TextEncoder();
const FAJLY = [
  {
    imya: "26-GK-001-5 Иванова Анна.png",
    dannye: new Uint8Array([137, 80, 78, 71, 1, 2, 3]),
  },
  { imya: "b.txt", dannye: enc.encode("привет") },
  { imya: "пусто.txt", dannye: new Uint8Array(0) },
];

function vVremennyj(bajty) {
  const put = join(mkdtempSync(join(tmpdir(), "sertifikaty-")), "a.zip");
  writeFileSync(put, bajty);
  return put;
}

test("CRC-32 по контрольному значению", () => {
  assert.equal(Y.crc32(enc.encode("123456789")), 0xcbf43926);
  assert.equal(Y.crc32(new Uint8Array(0)), 0);
});

test("вес архива известен до сборки и совпадает с собранным", () => {
  const z = Y.sobratZip(FAJLY, new Date(2026, 8, 27, 10, 30));
  assert.equal(
    Y.vesZip(FAJLY.map((f) => ({ imya: f.imya, razmer: f.dannye.length }))),
    z.length,
  );
});

test("архив читает Python: имена с кириллицей и содержимое на месте", () => {
  const put = vVremennyj(Y.sobratZip(FAJLY, new Date(2026, 8, 27, 10, 30)));
  const vyvod = execFileSync(
    "/usr/bin/python3",
    [
      "-c",
      [
        "import zipfile, sys, json, base64",
        "z = zipfile.ZipFile(sys.argv[1])",
        "assert z.testzip() is None",
        "print(json.dumps([[i.filename, base64.b64encode(z.read(i)).decode()] for i in z.infolist()]))",
      ].join("\n"),
      put,
    ],
    { encoding: "utf8" },
  );
  assert.deepEqual(
    JSON.parse(vyvod),
    FAJLY.map((f) => [f.imya, Buffer.from(f.dannye).toString("base64")]),
  );
});

test("архив проходит системную проверку unzip", () => {
  const put = vVremennyj(Y.sobratZip(FAJLY));
  execFileSync("unzip", ["-tq", put]); // бросит, если код выхода не 0
});

test("имя файла — номер и имя, без запрещённых знаков", () => {
  assert.equal(
    Y.imyaFajla("26GK017S", "Иванова Анна"),
    "26-GK-017-S Иванова Анна.png",
  );
  assert.equal(Y.imyaFajla("26GK017S", 'А/Б: "В"'), "26-GK-017-S АБ В.png");
});
```

- [ ] **Step 2: Запустить — падает**

Run: `node --test tests/zip.test.mjs`
Expected: FAIL — `Y.crc32 is not a function`.

- [ ] **Step 3: Реализация**

В блоке `yadro` перед `  g.Yadro = {` вставить:

```js
/* ---------- Архив ZIP без сжатия ---------- */

// PNG уже сжаты, поэтому архив без сжатия: файлы кладутся как есть.
const CRC_TABLICA = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(bajty) {
  let c = 0xffffffff;
  for (let i = 0; i < bajty.length; i++)
    c = CRC_TABLICA[(c ^ bajty[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function dosVremya(d) {
  return {
    vremya:
      (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1),
    data:
      ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(),
  };
}

// Вес архива до того, как он собран: заголовки плюс сами файлы.
// fajly: [{ imya, razmer }]
function vesZip(fajly) {
  const enc = new TextEncoder();
  let ves = 22;
  for (const f of fajly) {
    const n = enc.encode(f.imya).length;
    ves += 30 + n + f.razmer + 46 + n;
  }
  return ves;
}

// fajly: [{ imya, dannye: Uint8Array }] → Uint8Array архива.
// Флаг 0x0800 говорит архиватору, что имена в UTF-8 — иначе кириллица
// в именах файлов превращается в кракозябры.
function sobratZip(fajly, kogda) {
  const enc = new TextEncoder();
  const { vremya, data } = dosVremya(kogda || new Date());
  const itog = new Uint8Array(
    vesZip(fajly.map((f) => ({ imya: f.imya, razmer: f.dannye.length }))),
  );
  const dv = new DataView(itog.buffer);
  const katalog = [];
  let p = 0;
  for (const f of fajly) {
    const imya = enc.encode(f.imya);
    const crc = crc32(f.dannye);
    katalog.push({ imya, crc, razmer: f.dannye.length, smeshchenie: p });
    dv.setUint32(p, 0x04034b50, true);
    dv.setUint16(p + 4, 20, true);
    dv.setUint16(p + 6, 0x0800, true);
    dv.setUint16(p + 8, 0, true);
    dv.setUint16(p + 10, vremya, true);
    dv.setUint16(p + 12, data, true);
    dv.setUint32(p + 14, crc, true);
    dv.setUint32(p + 18, f.dannye.length, true);
    dv.setUint32(p + 22, f.dannye.length, true);
    dv.setUint16(p + 26, imya.length, true);
    dv.setUint16(p + 28, 0, true);
    itog.set(imya, p + 30);
    itog.set(f.dannye, p + 30 + imya.length);
    p += 30 + imya.length + f.dannye.length;
  }
  const nachaloKataloga = p;
  for (const k of katalog) {
    dv.setUint32(p, 0x02014b50, true);
    dv.setUint16(p + 4, 20, true);
    dv.setUint16(p + 6, 20, true);
    dv.setUint16(p + 8, 0x0800, true);
    dv.setUint16(p + 10, 0, true);
    dv.setUint16(p + 12, vremya, true);
    dv.setUint16(p + 14, data, true);
    dv.setUint32(p + 16, k.crc, true);
    dv.setUint32(p + 20, k.razmer, true);
    dv.setUint32(p + 24, k.razmer, true);
    dv.setUint16(p + 28, k.imya.length, true);
    dv.setUint16(p + 30, 0, true);
    dv.setUint16(p + 32, 0, true);
    dv.setUint16(p + 34, 0, true);
    dv.setUint16(p + 36, 0, true);
    dv.setUint32(p + 38, 0, true);
    dv.setUint32(p + 42, k.smeshchenie, true);
    itog.set(k.imya, p + 46);
    p += 46 + k.imya.length;
  }
  dv.setUint32(p, 0x06054b50, true);
  dv.setUint16(p + 4, 0, true);
  dv.setUint16(p + 6, 0, true);
  dv.setUint16(p + 8, katalog.length, true);
  dv.setUint16(p + 10, katalog.length, true);
  dv.setUint32(p + 12, p - nachaloKataloga, true);
  dv.setUint32(p + 16, nachaloKataloga, true);
  dv.setUint16(p + 20, 0, true);
  return itog;
}

function imyaFajla(nomer, imya) {
  return O.krasivo(nomer) + " " + imya.replace(/[\\/:*?"<>|]/g, "") + ".png";
}
```

Экспорт:

```js
g.Yadro = {
  PREDEL,
  razobratSpisok,
  mmVPx,
  ptVPx,
  variantyRazryva,
  podobratKegl,
  razmerLista,
  SHABLON,
  raskladka,
  zaPolem,
  izmeritCanvas,
  narisovat,
  crc32,
  vesZip,
  sobratZip,
  imyaFajla,
};
```

- [ ] **Step 4: Запустить — проходит**

Run: `node --test tests/`
Expected: PASS все.

- [ ] **Step 5: Commit**

```bash
git add index.html tests/zip.test.mjs
git commit -m "Архив ZIP без сжатия своим кодом, вес известен заранее

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Реестр и выдача номеров

**Files:**

- Modify: `index.html` — раздел в блоке `yadro`
- Test: `tests/reestr.test.mjs`

**Interfaces:**

- Consumes: `Obshchee.sobrat`, `razobrat`, `krasivo`, `formatDaty`; `PREDEL`
- Produces: `pustojReestr(shablon): Reestr`, `prochitatReestr(tekst): Reestr` (бросает понятную ошибку), `sleduyushchijNomer(reestr, god, kodKursa): number`, `vydat({ imena, kodKursa, data, nachatS, reestr }): { sertifikaty: {imya, nomer}[], reestr: Reestr }`, `reestrVTekst(reestr): string`

- [ ] **Step 1: Написать тесты**

`tests/reestr.test.mjs`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { zagruzit } from "../tools/zagruzka.mjs";

const { O, Y } = zagruzit();
const pustoj = () => Y.pustojReestr(Y.SHABLON);

test("пустой реестр знает курсы школы и не содержит выдач", () => {
  assert.deepEqual(pustoj(), {
    shkola: "Школа керамики «Обжиг»",
    kursy: {
      GK: "Гончарный круг: основы",
      RL: "Ручная лепка",
      GL: "Глазури и обжиг",
    },
    vydano: [],
  });
});

test("сколько разных участников, столько сертификатов и номеров подряд", () => {
  const { imena } = Y.razobratSpisok(
    "Иванова Анна\n\nиванова  анна\nПетров Пётр\nЛи Ян",
  );
  const v = Y.vydat({
    imena,
    kodKursa: "GK",
    data: "2026-09-27",
    nachatS: 5,
    reestr: pustoj(),
  });
  assert.deepEqual(
    v.sertifikaty.map((s) => s.imya),
    ["Иванова Анна", "Петров Пётр", "Ли Ян"],
  );
  assert.deepEqual(
    v.sertifikaty.map((s) => O.razobrat(s.nomer).poryadkovyj),
    [5, 6, 7],
  );
  assert.ok(v.sertifikaty.every((s) => O.razobrat(s.nomer).ok));
});

test("реестр содержит все выданные номера и ни одного имени", () => {
  const imena = [
    "Иванова Анна",
    "Петров Пётр",
    "Белова-Заречная Ксения Игоревна",
  ];
  const v = Y.vydat({
    imena,
    kodKursa: "RL",
    data: "2026-09-27",
    nachatS: 1,
    reestr: pustoj(),
  });
  const tekst = Y.reestrVTekst(v.reestr);
  for (const s of v.sertifikaty)
    assert.ok(tekst.includes('"' + s.nomer + '"'), s.nomer);
  for (const imya of imena) {
    assert.ok(!tekst.includes(imya), imya);
    assert.ok(!tekst.includes(imya.split(" ")[0]), imya);
  }
  assert.deepEqual(Object.keys(v.reestr.vydano[0]).sort(), [
    "data",
    "kurs",
    "nomer",
  ]);
});

test("новая пачка дописывается к старому реестру, нумерация продолжается", () => {
  const pervaya = Y.vydat({
    imena: ["А Б", "В Г"],
    kodKursa: "GK",
    data: "2026-09-27",
    nachatS: 1,
    reestr: pustoj(),
  });
  const staryj = Y.prochitatReestr(Y.reestrVTekst(pervaya.reestr));
  assert.equal(Y.sleduyushchijNomer(staryj, 2026, "GK"), 3);
  assert.equal(Y.sleduyushchijNomer(staryj, 2026, "RL"), 1);
  assert.equal(Y.sleduyushchijNomer(staryj, 2027, "GK"), 1);
  const vtoraya = Y.vydat({
    imena: ["Д Е"],
    kodKursa: "GK",
    data: "2026-10-15",
    nachatS: 3,
    reestr: staryj,
  });
  assert.equal(vtoraya.reestr.vydano.length, 3);
  assert.deepEqual(
    vtoraya.reestr.vydano.map((z) => z.nomer),
    [...vtoraya.reestr.vydano.map((z) => z.nomer)].sort(),
  );
});

test("номер, который уже есть в реестре, второй раз не выдаётся", () => {
  const pervaya = Y.vydat({
    imena: ["А Б"],
    kodKursa: "GK",
    data: "2026-09-27",
    nachatS: 1,
    reestr: pustoj(),
  });
  assert.throws(
    () =>
      Y.vydat({
        imena: ["В Г"],
        kodKursa: "GK",
        data: "2026-09-28",
        nachatS: 1,
        reestr: pervaya.reestr,
      }),
    /уже есть в реестре. Начните нумерацию с 2/,
  );
});

test("предел пачки — 50 участников", () => {
  const imena = (n) =>
    Array.from({ length: n }, (_, i) => "Участник " + (i + 1));
  assert.equal(Y.PREDEL, 50);
  assert.equal(
    Y.vydat({
      imena: imena(50),
      kodKursa: "GK",
      data: "2026-09-27",
      nachatS: 1,
      reestr: pustoj(),
    }).sertifikaty.length,
    50,
  );
  assert.throws(
    () =>
      Y.vydat({
        imena: imena(51),
        kodKursa: "GK",
        data: "2026-09-27",
        nachatS: 1,
        reestr: pustoj(),
      }),
    /предел пачки — 50/,
  );
});

test("ошибки ввода называются словами", () => {
  const v = (d) => () =>
    Y.vydat({
      imena: ["А Б"],
      kodKursa: "GK",
      data: "2026-09-27",
      nachatS: 1,
      reestr: pustoj(),
      ...d,
    });
  assert.throws(v({ imena: [] }), /пуст/);
  assert.throws(v({ kodKursa: "ZZ" }), /Неизвестный курс/);
  assert.throws(v({ nachatS: 999, imena: ["А", "Б"] }), /не хватит/);
  assert.throws(v({ nachatS: 0 }), /от 1/);
  assert.throws(v({ data: "" }), /ГГГГ-ММ-ДД/);
});

test("чужой или испорченный файл реестра не принимается", () => {
  assert.throws(() => Y.prochitatReestr("не json"), /не JSON/);
  assert.throws(() => Y.prochitatReestr('{"a":1}'), /не файл реестра/);
  assert.throws(
    () => Y.prochitatReestr('{"kursy":{},"vydano":[{"nomer":"26GK0019"}]}'),
    /испорченный номер/,
  );
});
```

- [ ] **Step 2: Запустить — падает**

Run: `node --test tests/reestr.test.mjs`
Expected: FAIL — `Y.pustojReestr is not a function`.

- [ ] **Step 3: Реализация**

В блоке `yadro` перед `  g.Yadro = {` вставить:

```js
/* ---------- Реестр ---------- */

// Реестр: { shkola, kursy: { КОД: название }, vydano: [{ nomer, kurs, data }] }.
// Имён в нём нет: он лежит в открытом доступе.
function pustojReestr(shablon) {
  return {
    shkola: shablon.shkola.nazvanie,
    kursy: Object.fromEntries(shablon.kursy.map((k) => [k.kod, k.nazvanie])),
    vydano: [],
  };
}

function prochitatReestr(tekst) {
  let r;
  try {
    r = JSON.parse(tekst);
  } catch (e) {
    throw new Error("Файл реестра не читается: это не JSON");
  }
  if (!r || typeof r.kursy !== "object" || !Array.isArray(r.vydano)) {
    throw new Error("Это не файл реестра: в нём нет списка выданных номеров");
  }
  for (const z of r.vydano) {
    if (!z || !O.razobrat(String(z.nomer)).ok)
      throw new Error("В реестре испорченный номер: " + (z && z.nomer));
  }
  return r;
}

function sleduyushchijNomer(reestr, god, kodKursa) {
  let max = 0;
  for (const z of reestr.vydano) {
    const r = O.razobrat(z.nomer);
    if (r.ok && r.god === god && r.kodKursa === kodKursa)
      max = Math.max(max, r.poryadkovyj);
  }
  return max + 1;
}

// Выдать номера пачке. Возвращает сертификаты (имя + номер) и новый реестр:
// старые записи плюс новые, без имён.
function vydat({ imena, kodKursa, data, nachatS, reestr }) {
  if (imena.length === 0) throw new Error("Список участников пуст");
  if (imena.length > PREDEL) {
    throw new Error(
      "В списке " +
        imena.length +
        " участников, предел пачки — " +
        PREDEL +
        ". Разбейте список на части.",
    );
  }
  if (!Object.prototype.hasOwnProperty.call(reestr.kursy, kodKursa))
    throw new Error("Неизвестный курс: " + kodKursa);
  O.formatDaty(data);
  const god = Number(data.slice(0, 4));
  if (!Number.isInteger(nachatS) || nachatS < 1)
    throw new Error("Нумерация начинается с целого числа от 1");
  if (nachatS + imena.length - 1 > 999)
    throw new Error(
      "Порядковых номеров не хватит: по курсу за год их не больше 999",
    );
  const zanyato = new Set(reestr.vydano.map((z) => z.nomer));
  const sertifikaty = imena.map((imya, i) => ({
    imya,
    nomer: O.sobrat(god, kodKursa, nachatS + i),
  }));
  const povtor = sertifikaty.find((s) => zanyato.has(s.nomer));
  if (povtor) {
    throw new Error(
      "Номер " +
        O.krasivo(povtor.nomer) +
        " уже есть в реестре. Начните нумерацию с " +
        sleduyushchijNomer(reestr, god, kodKursa) +
        ".",
    );
  }
  const vydano = reestr.vydano
    .concat(sertifikaty.map((s) => ({ nomer: s.nomer, kurs: kodKursa, data })))
    .sort((a, b) => (a.nomer < b.nomer ? -1 : a.nomer > b.nomer ? 1 : 0));
  return {
    sertifikaty,
    reestr: { shkola: reestr.shkola, kursy: reestr.kursy, vydano },
  };
}

function reestrVTekst(reestr) {
  return JSON.stringify(reestr, null, 2) + "\n";
}
```

Экспорт:

```js
g.Yadro = {
  PREDEL,
  razobratSpisok,
  mmVPx,
  ptVPx,
  variantyRazryva,
  podobratKegl,
  razmerLista,
  SHABLON,
  raskladka,
  zaPolem,
  izmeritCanvas,
  narisovat,
  crc32,
  vesZip,
  sobratZip,
  imyaFajla,
  pustojReestr,
  prochitatReestr,
  sleduyushchijNomer,
  vydat,
  reestrVTekst,
};
```

- [ ] **Step 4: Запустить — проходит**

Run: `node --test tests/`
Expected: PASS все.

- [ ] **Step 5: Commit**

```bash
git add index.html tests/reestr.test.mjs
git commit -m "Реестр без имён: выдача номеров, продолжение нумерации, защита от повторов

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Шрифты, вшитые в страницы

**Files:**

- Create: `tools/shrift.py`, `tools/shrift-podpis.txt`, `tools/licenzii/OFL-CormorantGaramond.txt`, `tools/licenzii/OFL-PTSans.txt`
- Modify: `index.html`, `p/index.html` — блок между метками `ШРИФТЫ`
- Test: `tests/shrifty.test.mjs`

**Interfaces:**

- Produces: в обеих страницах `@font-face` для `"Cormorant Garamond"` (font-weight `500 700`) и `"PT Sans"` (400 и 700), источник только `data:font/woff2;base64,…`.

Набор знаков не берётся из текста страницы, как в `otchet-proverka`: имена участников заранее неизвестны. Берём целиком латиницу, Latin-1, кириллицу (с украинскими и белорусскими буквами) и типографские знаки.

- [ ] **Step 1: Написать тест**

`tests/shrifty.test.mjs`:

```js
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
```

- [ ] **Step 2: Запустить — падает**

Run: `node --test tests/shrifty.test.mjs`
Expected: FAIL — `0 !== 3`.

- [ ] **Step 3: Скрипт подрезки**

`tools/shrift.py`:

```python
#!/usr/bin/python3
"""Разовая подготовка шрифтов: скачать, подрезать, вшить в обе страницы.

Запуск: /usr/bin/python3 tools/shrift.py
(fontTools и brotli есть именно у системного Python macOS.)

Набор знаков фиксированный, а не по тексту страницы: имена участников
заранее неизвестны, поэтому берём латиницу, Latin-1, всю основную
кириллицу и типографские знаки. Результат пишется между метками
/* ШРИФТЫ: начало */ и /* ШРИФТЫ: конец */ в index.html и p/index.html.
"""
import base64
import pathlib
import re
import subprocess
import sys
import urllib.request

from fontTools.ttLib import TTFont

KOREN = pathlib.Path(__file__).resolve().parent.parent
VREMENNO = KOREN / "tools" / ".shrift-vremenno"
LICENZII = KOREN / "tools" / "licenzii"
STRANICY = [KOREN / "index.html", KOREN / "p" / "index.html"]
GF = "https://raw.githubusercontent.com/google/fonts/main/ofl/"

ISTOCHNIKI = {
    "cormorant.ttf": GF + "cormorantgaramond/CormorantGaramond%5Bwght%5D.ttf",
    "ptsans-400.ttf": GF + "ptsans/PT_Sans-Web-Regular.ttf",
    "ptsans-700.ttf": GF + "ptsans/PT_Sans-Web-Bold.ttf",
}
LICENZII_ISTOCHNIKI = {
    "OFL-CormorantGaramond.txt": GF + "cormorantgaramond/OFL.txt",
    "OFL-PTSans.txt": GF + "ptsans/OFL.txt",
}

NABOR = "".join(
    [chr(c) for c in range(0x20, 0x7F)]
    + [chr(c) for c in range(0xA0, 0x100)]
    + [chr(c) for c in range(0x400, 0x460)]
    + ["Ґ", "ґ"]
    + list("‐–—‘’‚“”„…•№·")
)
# Без этих знаков сертификат не собрать — их отсутствие в шрифте — ошибка.
OBYAZATELNYE = (
    "абвгдеёжзийклмнопрстуфхцчшщъыьэюяАБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ"
    "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ-.,:«»№— "
)


def skachat(adres, kuda):
    if not kuda.exists():
        print("Качаю", adres, file=sys.stderr)
        with urllib.request.urlopen(adres) as otvet:
            kuda.write_bytes(otvet.read())
    return kuda


def podrezat(ishodnyj, imya):
    rezultat = VREMENNO / imya
    subprocess.run(
        [
            sys.executable, "-m", "fontTools.subset", str(ishodnyj),
            f"--text={NABOR}",
            "--layout-features=kern,liga",
            "--flavor=woff2",
            "--no-hinting",
            f"--output-file={rezultat}",
        ],
        check=True,
    )
    cmap = TTFont(rezultat).getBestCmap()
    net = [c for c in OBYAZATELNYE if ord(c) not in cmap]
    if net:
        raise SystemExit(f"{imya}: в шрифте нет знаков {''.join(net)!r}")
    print(f"{imya}: {rezultat.stat().st_size / 1024:.1f} КБ", file=sys.stderr)
    return rezultat


def pravilo(semejstvo, ves, fajl):
    kod = base64.b64encode(fajl.read_bytes()).decode("ascii")
    return (
        f'@font-face{{font-family:"{semejstvo}";font-style:normal;'
        f"font-weight:{ves};font-display:block;"
        f'src:url(data:font/woff2;base64,{kod}) format("woff2")}}'
    )


def main():
    VREMENNO.mkdir(exist_ok=True)
    LICENZII.mkdir(exist_ok=True)
    syrye = {imya: skachat(adres, VREMENNO / imya) for imya, adres in ISTOCHNIKI.items()}
    for imya, adres in LICENZII_ISTOCHNIKI.items():
        skachat(adres, LICENZII / imya)

    # Cormorant переменный: сужаем ось начертания до 500–700.
    suzhennyj = VREMENNO / "cormorant-500-700.ttf"
    subprocess.run(
        [sys.executable, "-m", "fontTools.varLib.instancer", str(syrye["cormorant.ttf"]),
         "wght=500:700", "-o", str(suzhennyj)],
        check=True, stdout=subprocess.DEVNULL,
    )
    css = "\n".join([
        pravilo("Cormorant Garamond", "500 700", podrezat(suzhennyj, "cormorant.woff2")),
        pravilo("PT Sans", "400", podrezat(syrye["ptsans-400.ttf"], "ptsans-400.woff2")),
        pravilo("PT Sans", "700", podrezat(syrye["ptsans-700.ttf"], "ptsans-700.woff2")),
    ])
    for stranica in STRANICY:
        html = stranica.read_text(encoding="utf-8")
        novyj, n = re.subn(
            r"/\* ШРИФТЫ: начало \*/[\s\S]*?/\* ШРИФТЫ: конец \*/",
            lambda _: "/* ШРИФТЫ: начало */\n" + css + "\n/* ШРИФТЫ: конец */",
            html,
        )
        if n != 1:
            raise SystemExit(f"{stranica}: не нашёл меток ШРИФТЫ")
        stranica.write_text(novyj, encoding="utf-8")
        print(f"{stranica.relative_to(KOREN)}: {len(novyj) / 1024:.0f} КБ", file=sys.stderr)


if __name__ == "__main__":
    main()
```

`font-display:block` — намеренно: canvas должен рисовать вшитым шрифтом, а не запасным.

- [ ] **Step 4: Запустить скрипт и тест**

Run: `/usr/bin/python3 tools/shrift.py && node --test tests/`
Expected: скрипт печатает размеры трёх woff2 (ожидаемо десятки КБ каждый); все тесты PASS.

- [ ] **Step 5: Подпись шрифтов**

`tools/shrift-podpis.txt` — записать по фактическому выводу скрипта:

```
Шрифты: Cormorant Garamond и PT Sans, SIL Open Font License 1.1 (тексты — tools/licenzii/)
Источник: github.com/google/fonts — ofl/cormorantgaramond/CormorantGaramond[wght].ttf,
          ofl/ptsans/PT_Sans-Web-Regular.ttf, ofl/ptsans/PT_Sans-Web-Bold.ttf
Cormorant: ось wght сужена до 500–700
Набор: латиница, Latin-1, кириллица U+0400–045F и Ґґ, типографские знаки
Размеры после подрезки: <вписать из вывода скрипта>
Подрезка: /usr/bin/python3 tools/shrift.py
Дата подрезки: 27.09.2026
```

- [ ] **Step 6: Commit**

```bash
git add tools/shrift.py tools/shrift-podpis.txt tools/licenzii index.html p/index.html tests/shrifty.test.mjs
git commit -m "Шрифты подрезаны и вшиты в обе страницы

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Генератор — форма, рисование пачки, архив, лист для печати

Перед вёрсткой загрузить скилл `landing-visual-craft` и сверить с ним оформление ниже (контраст, отступы, фокус, 360 пикселей). Если скилл требует правок — внести, не меняя id элементов: на них завязан код.

**Files:**

- Modify: `index.html` — `<style id="oformlenie">`, `<main class="stranica">`, новые блоки `<script id="primer">` и `<script id="interfejs">`

**Interfaces:**

- Consumes: всё из `Obshchee` и `Yadro`
- Produces: элементы с id `kurs`, `data`, `spisok`, `schet`, `fajlReestra`, `reestrStatus`, `nachatS`, `oshibka`, `sdelat`, `itog`, `itogZagolovok`, `progress`, `skachatArhiv`, `pechat`, `skachatReestr`, `preduprezhdenie`, `prevyu`, `listy` — на них опираются проверки в задаче 10. Блок `<script id="primer" type="text/plain">` — список-пример, его читает `tools/primer-reestra.mjs` в задаче 9.

- [ ] **Step 1: Оформление**

Содержимое `<style id="oformlenie">`:

```css
:root {
  --fon: #f5efe7;
  --karta: #fffcf8;
  --tekst: #2b211c;
  --tihij: #6b5d53;
  --liniya: #e2d6c8;
  --glavnyj: #8a4b2a;
  --glavnyj-temnee: #6c3920;
  --glavnyj-svetlyj: #f3e6dc;
  --oshibka: #a3261b;
  --oshibka-fon: #fbeae7;
  --vnimanie-fon: #fff4dc;
  --radius: 12px;
  --ten: 0 1px 2px rgba(43, 33, 28, 0.06), 0 8px 24px rgba(43, 33, 28, 0.06);
}
*,
*::before,
*::after {
  box-sizing: border-box;
}
html {
  -webkit-text-size-adjust: 100%;
}
body {
  margin: 0;
  background: var(--fon);
  color: var(--tekst);
  font:
    400 17px/1.55 "PT Sans",
    system-ui,
    -apple-system,
    "Segoe UI",
    sans-serif;
}
.stranica {
  max-width: 960px;
  margin: 0 auto;
  padding: 40px 16px 64px;
  display: grid;
  gap: 24px;
}
h1,
h2 {
  font-family: "Cormorant Garamond", Georgia, serif;
  font-weight: 600;
  line-height: 1.1;
  margin: 0;
  text-wrap: balance;
}
h1 {
  font-size: clamp(40px, 7vw, 64px);
}
h2 {
  font-size: 30px;
}
p {
  margin: 0;
}
.shapka {
  display: grid;
  gap: 12px;
}
.shapka__metka {
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 13px;
  color: var(--glavnyj);
}
.shapka__podvodka {
  font-size: 19px;
  max-width: 40em;
}
.uslovno {
  font-size: 14px;
  color: var(--tihij);
}
.karta {
  background: var(--karta);
  border: 1px solid var(--liniya);
  border-radius: var(--radius);
  box-shadow: var(--ten);
  padding: 24px;
}
.forma form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
.pole {
  display: grid;
  gap: 6px;
  align-content: start;
  min-width: 0;
}
.pole--shirokoe {
  grid-column: 1/-1;
}
label,
summary {
  font-weight: 700;
  font-size: 15px;
}
input,
select,
textarea {
  font: inherit;
  color: inherit;
  background: #fff;
  border: 1px solid #c9b9a9;
  border-radius: 8px;
  padding: 10px 12px;
  width: 100%;
  min-width: 0;
}
input[type="file"] {
  padding: 8px;
}
textarea {
  resize: vertical;
  min-height: 220px;
  line-height: 1.5;
}
input:focus-visible,
select:focus-visible,
textarea:focus-visible,
button:focus-visible,
summary:focus-visible,
a:focus-visible {
  outline: 3px solid var(--glavnyj);
  outline-offset: 2px;
}
.podskazka {
  font-size: 14px;
  color: var(--tihij);
}
.podskazka--oshibka {
  color: var(--oshibka);
  font-weight: 700;
}
details summary {
  cursor: pointer;
  color: var(--glavnyj-temnee);
}
details[open] summary {
  margin-bottom: 12px;
}
.knopka {
  font: inherit;
  font-weight: 700;
  border: 0;
  border-radius: 8px;
  padding: 12px 20px;
  min-height: 48px;
  background: var(--glavnyj);
  color: #fff;
  cursor: pointer;
  transition: background-color 0.15s;
}
.knopka:hover {
  background: var(--glavnyj-temnee);
}
.knopka:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.knopka--vtoraya {
  background: var(--glavnyj-svetlyj);
  color: var(--glavnyj-temnee);
}
.knopka--vtoraya:hover {
  background: #ead6c8;
}
.forma .knopka {
  grid-column: 1/-1;
  justify-self: start;
}
.oshibka {
  grid-column: 1/-1;
  background: var(--oshibka-fon);
  color: var(--oshibka);
  border-radius: 8px;
  padding: 12px 14px;
  font-weight: 700;
}
.itog {
  display: grid;
  gap: 16px;
}
.progress {
  color: var(--tihij);
}
.dejstviya {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.preduprezhdenie {
  background: var(--vnimanie-fon);
  border-radius: 8px;
  padding: 12px 14px;
  font-size: 15px;
}
.prevyu {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}
.prevyu li {
  display: grid;
  gap: 4px;
  font-size: 14px;
  align-content: start;
}
.prevyu img {
  width: 100%;
  height: auto;
  border: 1px solid var(--liniya);
  border-radius: 6px;
  background: #fff;
}
.prevyu__imya {
  font-weight: 700;
  overflow-wrap: anywhere;
}
.prevyu__nomer {
  color: var(--tihij);
  font-variant-numeric: tabular-nums;
}
.prevyu__vnimanie {
  color: var(--oshibka);
}
.poyasnenie {
  display: grid;
  gap: 12px;
}
.poyasnenie h2 {
  font-size: 26px;
  margin-top: 8px;
}
.poyasnenie p {
  max-width: 44em;
}
a {
  color: var(--glavnyj-temnee);
  text-underline-offset: 3px;
}
.podval {
  font-size: 13px;
  color: var(--tihij);
}
@media (max-width: 640px) {
  .stranica {
    padding-top: 24px;
  }
  .forma form {
    grid-template-columns: 1fr;
  }
  .karta {
    padding: 18px;
  }
  .dejstviya .knopka {
    width: 100%;
  }
}
@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
  }
}
/* Лист для печати: на экране не виден, при печати виден только он.
   Поля листа нулевые: картинка сама A4, а рамка сертификата стоит
   в 12 мм от края — дальше, чем принтер не допечатывает. */
.listy {
  display: none;
}
@page {
  size: A4 landscape;
  margin: 0;
}
@media print {
  body {
    background: #fff;
  }
  .stranica {
    display: none;
  }
  .listy {
    display: block;
  }
  .list {
    width: 297mm;
    height: 210mm;
    overflow: hidden;
    break-after: page;
    page-break-after: always;
  }
  .list:last-child {
    break-after: auto;
    page-break-after: auto;
  }
  .list img {
    display: block;
    width: 297mm;
    height: 210mm;
  }
}
```

- [ ] **Step 2: Разметка**

Содержимое `<main class="stranica">` заменить на:

```html
<header class="shapka">
  <p class="shapka__metka">Школа керамики «Обжиг»</p>
  <h1>Сертификаты пачкой</h1>
  <p class="shapka__podvodka">
    Вставьте список участников потока — получите сертификаты комплектом: архив
    картинок, лист для печати и реестр, по которому любой сертификат проверяется
    по номеру.
  </p>
  <p class="uslovno">Пример: школа вымышленная, имена и номера условные.</p>
</header>

<section class="karta forma" aria-label="Данные для сертификатов">
  <form id="forma" novalidate>
    <div class="pole">
      <label for="kurs">Курс</label>
      <select id="kurs"></select>
    </div>
    <div class="pole">
      <label for="data">Дата выдачи</label>
      <input id="data" type="date" required />
    </div>
    <div class="pole pole--shirokoe">
      <label for="spisok">Участники — по одному в строке</label>
      <textarea
        id="spisok"
        rows="10"
        spellcheck="false"
        aria-describedby="schet"
      ></textarea>
      <p class="podskazka" id="schet" aria-live="polite"></p>
      <p class="podskazka">
        Можно вставить столбец из таблицы или список из письма: номера строк,
        почту и телефоны инструмент уберёт сам, повторы тоже.
      </p>
    </div>
    <details class="pole pole--shirokoe">
      <summary>
        Сертификаты уже выдавали? Продолжить нумерацию по реестру
      </summary>
      <div class="pole">
        <label for="fajlReestra"
          >Текущий reestr.json со страницы проверки</label
        >
        <input id="fajlReestra" type="file" accept=".json,application/json" />
        <p class="podskazka" id="reestrStatus" aria-live="polite">
          Старые номера останутся в новом реестре, новые продолжат нумерацию.
        </p>
      </div>
    </details>
    <div class="pole">
      <label for="nachatS">Первый порядковый номер</label>
      <input
        id="nachatS"
        type="number"
        min="1"
        max="999"
        step="1"
        value="1"
        required
      />
    </div>
    <p class="oshibka" id="oshibka" role="alert" hidden></p>
    <button class="knopka" type="submit" id="sdelat">
      Сделать сертификаты
    </button>
  </form>
</section>

<section class="karta itog" id="itog" hidden aria-labelledby="itogZagolovok">
  <h2 id="itogZagolovok">Готово</h2>
  <p class="progress" id="progress" aria-live="polite"></p>
  <div class="dejstviya">
    <button class="knopka" type="button" id="skachatArhiv" disabled>
      Скачать архив
    </button>
    <button class="knopka knopka--vtoraya" type="button" id="pechat" disabled>
      Лист для печати / PDF
    </button>
    <button
      class="knopka knopka--vtoraya"
      type="button"
      id="skachatReestr"
      disabled
    >
      Скачать реестр
    </button>
  </div>
  <p class="preduprezhdenie" id="preduprezhdenie" hidden></p>
  <p class="podskazka">
    Лист для печати: в окне печати выберите принтер или «Сохранить как PDF»,
    масштаб 100 %. Реестр положите рядом со страницей проверки на сайте школы
    вместо старого.
  </p>
  <ul class="prevyu" id="prevyu"></ul>
</section>

<section class="karta poyasnenie" aria-labelledby="proNomer">
  <h2 id="proNomer">Что значит номер</h2>
  <p>
    Номер из восьми знаков: год, код курса, порядковый номер и проверочный знак.
    На странице проверки по нему видно, что сертификат с таким номером выдан, —
    по какому курсу и когда.
  </p>
  <p>
    Проверочный знак считается от остальных семи. Измените одну цифру — номер
    перестанет сходиться, поэтому соседний номер не подставить.
    <strong>От подделки номер не защищает:</strong> картинку может перерисовать
    кто угодно. Он даёт способ проверить сертификат, не обращаясь к его
    владельцу.
  </p>
  <h2>Почему в реестре нет имён</h2>
  <p>
    Реестр лежит на сайте школы в открытом доступе, а список фамилий в открытом
    доступе — публикация персональных данных: на неё нужно согласие каждого
    участника. Проверяющему имя не нужно — оно на сертификате, который он держит
    в руках.
  </p>
  <p>
    Как устроить согласие и документы, когда сайт всё-таки собирает данные, — в
    соседней работе:
    <a href="https://pyhphhddb8-eng.github.io/klinika-152fz/"
      >комплект 152-ФЗ для сайта с онлайн-записью</a
    >.
  </p>
  <h2>Где живёт список участников</h2>
  <p>
    Только в этом окне. Страница никуда его не отправляет и работает без
    интернета: её можно сохранить на диск и открывать двойным щелчком.
  </p>
  <p class="podval">
    Шрифты Cormorant Garamond и PT Sans — SIL Open Font License 1.1, вшиты в
    страницу.
  </p>
</section>
```

- [ ] **Step 3: Список-пример**

Перед блоком `<script id="obshchee">` вставить (намеренно неудобные имена; все вымышленные):

```html
<script id="primer" type="text/plain">
  ФИО
  1. Иванова Анна Сергеевна
  2. Ли Ян
  3. Анна-Марина Константинопольская-Преображенская Святославовна
  4. Белова-Заречная Ксения Игоревна
  5. Петров Пётр
  6. петров петр
  7. Мамедов Эльчин Рашид оглы
  8. Ёлкина Мария-Луиза
</script>
```

- [ ] **Step 4: Блок интерфейса**

После блока `yadro` вставить:

```html
<script id="interfejs">
  (function () {
    "use strict";
    const O = window.Obshchee;
    const Y = window.Yadro;
    const S = Y.SHABLON;
    const $ = (id) => document.getElementById(id);
    const KNOPKI = ["skachatArhiv", "pechat", "skachatReestr"];

    let reestr = Y.pustojReestr(S);
    let reestrZagruzhen = false;
    let gotovo = null;
    let ssylki = [];

    function segodnya() {
      const d = new Date();
      return (
        d.getFullYear() +
        "-" +
        String(d.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(d.getDate()).padStart(2, "0")
      );
    }

    function sklonenie(n, formy) {
      const d = n % 100;
      const e = n % 10;
      if (d >= 11 && d <= 14) return formy[2];
      if (e === 1) return formy[0];
      if (e >= 2 && e <= 4) return formy[1];
      return formy[2];
    }

    function megabajty(bajty) {
      return (bajty / 1048576).toFixed(1).replace(".", ",") + " МБ";
    }

    function pokazatOshibku(tekst) {
      $("oshibka").textContent = tekst;
      $("oshibka").hidden = false;
    }

    function obnovitSchet() {
      const { imena, povtory } = Y.razobratSpisok($("spisok").value);
      let tekst = "Участников: " + imena.length;
      if (povtory.length) tekst += ". Повторы убраны: " + povtory.join(", ");
      const lishnie = imena.length > Y.PREDEL;
      if (lishnie)
        tekst +=
          ". Это больше предела в " + Y.PREDEL + " — разбейте список на части";
      $("schet").textContent = tekst;
      $("schet").classList.toggle("podskazka--oshibka", lishnie);
    }

    function obnovitNachalo() {
      if (!reestrZagruzhen || !$("data").value) return;
      $("nachatS").value = Y.sleduyushchijNomer(
        reestr,
        Number($("data").value.slice(0, 4)),
        $("kurs").value,
      );
    }

    // Canvas молча берёт запасной шрифт, если вшитый ещё не загружен:
    // грузим явно и проверяем, что грани шрифта действительно нашлись.
    async function zagruzitShrifty() {
      for (const f of [
        '600 100px "Cormorant Garamond"',
        '400 100px "PT Sans"',
        '700 100px "PT Sans"',
      ]) {
        const grani = await document.fonts.load(f);
        if (!grani.length) throw new Error("не загрузился шрифт " + f);
      }
    }

    function vBlob(holst) {
      return new Promise((ok, ne) =>
        holst.toBlob(
          (b) => (b ? ok(b) : ne(new Error("картинка не собралась"))),
          "image/png",
        ),
      );
    }

    function dobavitPrevyu(s, url, mini, melko, vylezli) {
      const li = document.createElement("li");
      const img = document.createElement("img");
      img.src = url;
      img.width = mini.width;
      img.height = mini.height;
      img.alt = "Сертификат: " + s.imya;
      const imya = document.createElement("p");
      imya.className = "prevyu__imya";
      imya.textContent = s.imya;
      const nomer = document.createElement("p");
      nomer.className = "prevyu__nomer";
      nomer.textContent = "№ " + O.krasivo(s.nomer);
      li.append(img, imya, nomer);
      const zamechaniya = [];
      if (melko)
        zamechaniya.push(
          "Имя очень длинное, кегль мельче обычного — посмотрите лист",
        );
      if (vylezli.length)
        zamechaniya.push("За полем печати: " + vylezli.join(", "));
      for (const z of zamechaniya) {
        const p = document.createElement("p");
        p.className = "prevyu__vnimanie";
        p.textContent = z;
        li.append(p);
      }
      $("prevyu").append(li);
    }

    function dobavitList(s, url) {
      const list = document.createElement("div");
      list.className = "list";
      const img = document.createElement("img");
      img.src = url;
      img.alt = "Сертификат: " + s.imya;
      list.append(img);
      $("listy").append(list);
    }

    async function sdelat(vydacha, kodKursa, data) {
      await zagruzitShrifty();
      ssylki.forEach((u) => URL.revokeObjectURL(u));
      ssylki = [];
      gotovo = null;
      KNOPKI.forEach((id) => {
        $(id).disabled = true;
      });
      $("prevyu").replaceChildren();
      $("listy").replaceChildren();
      $("preduprezhdenie").hidden = true;
      $("itogZagolovok").textContent = "Рисую…";
      $("itog").hidden = false;

      const { shirina, vysota } = Y.razmerLista(S);
      const holst = document.createElement("canvas");
      holst.width = shirina;
      holst.height = vysota;
      const ctx = holst.getContext("2d");
      const izmerit = Y.izmeritCanvas(ctx);
      // Превью рисуем отдельной маленькой картинкой: пятьдесят листов
      // в полном размере на экране съели бы память браузера.
      const mini = document.createElement("canvas");
      mini.width = 600;
      mini.height = Math.round((600 * vysota) / shirina);
      const miniCtx = mini.getContext("2d");
      const kurs = vydacha.reestr.kursy[kodKursa];
      const vsego = vydacha.sertifikaty.length;
      const fajly = [];

      for (let i = 0; i < vsego; i++) {
        const s = vydacha.sertifikaty[i];
        $("progress").textContent = "Рисую " + (i + 1) + " из " + vsego + "…";
        const raskl = Y.raskladka(
          S,
          { imya: s.imya, kurs, data, nomer: s.nomer },
          izmerit,
        );
        ctx.clearRect(0, 0, shirina, vysota);
        Y.narisovat(ctx, raskl);
        const blob = await vBlob(holst);
        const bolshaya = URL.createObjectURL(blob);
        miniCtx.drawImage(holst, 0, 0, mini.width, mini.height);
        const malenkaya = URL.createObjectURL(await vBlob(mini));
        ssylki.push(bolshaya, malenkaya);
        fajly.push({ imya: Y.imyaFajla(s.nomer, s.imya), blob });
        dobavitPrevyu(
          s,
          malenkaya,
          mini,
          raskl.imya.melko,
          Y.zaPolem(raskl, S, izmerit),
        );
        dobavitList(s, bolshaya);
      }

      gotovo = { fajly, reestr: vydacha.reestr, kodKursa, data };
      const ves = Y.vesZip(
        fajly.map((f) => ({ imya: f.imya, razmer: f.blob.size })),
      );
      $("itogZagolovok").textContent =
        "Готово: " +
        vsego +
        " " +
        sklonenie(vsego, ["сертификат", "сертификата", "сертификатов"]);
      $("progress").textContent =
        "Архив: " +
        vsego +
        " " +
        sklonenie(vsego, ["файл", "файла", "файлов"]) +
        ", " +
        megabajty(ves) +
        ". Каждый лист — " +
        shirina +
        " × " +
        vysota +
        " точек: A4 при 300 точках на дюйм.";
      $("skachatArhiv").textContent = "Скачать архив · " + megabajty(ves);
      if (!reestrZagruzhen) {
        $("preduprezhdenie").textContent =
          "В реестре только эта пачка. Если сертификаты уже выдавали, загрузите " +
          "текущий reestr.json в форме выше и сделайте пачку заново — иначе старые номера пропадут со страницы проверки.";
        $("preduprezhdenie").hidden = false;
      }
      KNOPKI.forEach((id) => {
        $(id).disabled = false;
      });
    }

    function skachat(blob, imya) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = imya;
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    }

    for (const k of S.kursy) {
      const o = document.createElement("option");
      o.value = k.kod;
      o.textContent = k.nazvanie;
      $("kurs").append(o);
    }
    $("data").value = segodnya();
    $("spisok").value = $("primer").textContent.trim();
    obnovitSchet();

    $("spisok").addEventListener("input", obnovitSchet);
    $("kurs").addEventListener("change", obnovitNachalo);
    $("data").addEventListener("change", obnovitNachalo);

    $("fajlReestra").addEventListener("change", async () => {
      const fajl = $("fajlReestra").files[0];
      if (!fajl) return;
      try {
        const prochitannyj = Y.prochitatReestr(await fajl.text());
        // Курсы шаблона, которых ещё нет в старом реестре, добавляются.
        prochitannyj.kursy = Object.assign(
          {},
          Y.pustojReestr(S).kursy,
          prochitannyj.kursy,
        );
        reestr = prochitannyj;
        reestrZagruzhen = true;
        const n = reestr.vydano.length;
        $("reestrStatus").textContent =
          "В реестре " +
          n +
          " " +
          sklonenie(n, ["номер", "номера", "номеров"]) +
          ". Нумерация продолжится после последнего по выбранному курсу и году.";
        obnovitNachalo();
      } catch (e) {
        reestr = Y.pustojReestr(S);
        reestrZagruzhen = false;
        $("reestrStatus").textContent = e.message;
      }
    });

    $("forma").addEventListener("submit", async (e) => {
      e.preventDefault();
      $("oshibka").hidden = true;
      const kodKursa = $("kurs").value;
      const data = $("data").value;
      let vydacha;
      try {
        if (!data) throw new Error("Укажите дату выдачи");
        vydacha = Y.vydat({
          imena: Y.razobratSpisok($("spisok").value).imena,
          kodKursa,
          data,
          nachatS: Number($("nachatS").value),
          reestr,
        });
      } catch (err) {
        pokazatOshibku(err.message);
        return;
      }
      $("sdelat").disabled = true;
      try {
        await sdelat(vydacha, kodKursa, data);
      } catch (err) {
        $("itog").hidden = true;
        pokazatOshibku("Не получилось нарисовать сертификаты: " + err.message);
      } finally {
        $("sdelat").disabled = false;
      }
    });

    $("skachatArhiv").addEventListener("click", async () => {
      if (!gotovo) return;
      const fajly = await Promise.all(
        gotovo.fajly.map(async (f) => ({
          imya: f.imya,
          dannye: new Uint8Array(await f.blob.arrayBuffer()),
        })),
      );
      skachat(
        new Blob([Y.sobratZip(fajly)], { type: "application/zip" }),
        "sertifikaty-" + gotovo.kodKursa + "-" + gotovo.data + ".zip",
      );
    });

    $("skachatReestr").addEventListener("click", () => {
      if (gotovo)
        skachat(
          new Blob([Y.reestrVTekst(gotovo.reestr)], {
            type: "application/json",
          }),
          "reestr.json",
        );
    });

    $("pechat").addEventListener("click", () => window.print());
  })();
</script>
```

- [ ] **Step 5: Тесты не сломались**

Run: `node --test tests/`
Expected: PASS все (в том числе «ни одного внешнего запроса» — ссылка на klinika-152fz стоит в `<a>`).

- [ ] **Step 6: Быстрая проверка в браузере**

Запустить сервер в фоне: `cd ~/Progects/sertifikaty-pachkoy && python3 -m http.server 8765` (Bash, `run_in_background`).
Через Playwright MCP: открыть `http://localhost:8765/`, нажать «Сделать сертификаты», дождаться текста «Готово: 7 сертификатов» (в примере 8 строк, повтор «петров петр» убран). Выполнить в странице:

```js
[...document.querySelectorAll(".prevyu__vnimanie")].map((p) => p.textContent);
```

Expected: пустой массив (ни одного «за полем печати»; «мелко» тоже не ожидается). Сделать скриншот первого превью крупно (`browser_take_screenshot` элемента `.prevyu li:nth-child(3) img`) и посмотреть: имя в две строки, рамка целая, шрифт с засечками (не системный).

- [ ] **Step 7: Commit**

```bash
git add index.html
git commit -m "Генератор: форма, пачка на canvas, превью, архив, реестр, лист для печати

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Реестр примера и страница проверки

**Files:**

- Create: `tools/primer-reestra.mjs`, `p/reestr.json`
- Modify: `p/index.html` — `<style id="oformlenie">`, `<main class="stranica">`, новый блок `<script id="proverka">`
- Test: `tests/primer.test.mjs`

**Interfaces:**

- Consumes: `Yadro.razobratSpisok`, `vydat`, `pustojReestr`, `reestrVTekst`; `Obshchee.najti`, `krasivo`, `formatDaty`; блок `primer` из `index.html`
- Produces: `p/reestr.json` — выдача примера: курс `GK`, дата `2026-09-27`, номера с 1.

- [ ] **Step 1: Написать тест**

`tests/primer.test.mjs`:

```js
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
```

- [ ] **Step 2: Запустить — падает**

Run: `node --test tests/primer.test.mjs`
Expected: FAIL — `Cannot find module …/tools/primer-reestra.mjs`.

- [ ] **Step 3: Скрипт реестра примера**

`tools/primer-reestra.mjs`:

```js
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
```

Run: `node tools/primer-reestra.mjs`
Expected: `p/reestr.json: 7 номеров`.

- [ ] **Step 4: Оформление страницы проверки**

Содержимое `<style id="oformlenie">` в `p/index.html`:

```css
:root {
  --fon: #f5efe7;
  --karta: #fffcf8;
  --tekst: #2b211c;
  --tihij: #6b5d53;
  --liniya: #e2d6c8;
  --glavnyj: #8a4b2a;
  --glavnyj-temnee: #6c3920;
  --ok: #2e6a3a;
  --ok-fon: #e8f3ea;
  --oshibka: #a3261b;
  --oshibka-fon: #fbeae7;
  --radius: 12px;
  --ten: 0 1px 2px rgba(43, 33, 28, 0.06), 0 8px 24px rgba(43, 33, 28, 0.06);
}
*,
*::before,
*::after {
  box-sizing: border-box;
}
html {
  -webkit-text-size-adjust: 100%;
}
body {
  margin: 0;
  background: var(--fon);
  color: var(--tekst);
  font:
    400 17px/1.55 "PT Sans",
    system-ui,
    -apple-system,
    "Segoe UI",
    sans-serif;
}
.stranica {
  max-width: 720px;
  margin: 0 auto;
  padding: 40px 16px 64px;
  display: grid;
  gap: 24px;
}
h1,
h2 {
  font-family: "Cormorant Garamond", Georgia, serif;
  font-weight: 600;
  line-height: 1.1;
  margin: 0;
  text-wrap: balance;
}
h1 {
  font-size: clamp(40px, 7vw, 56px);
}
h2 {
  font-size: 28px;
}
p {
  margin: 0;
}
.shapka {
  display: grid;
  gap: 12px;
}
.shapka__metka {
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 13px;
  color: var(--glavnyj);
}
.shapka__podvodka {
  font-size: 19px;
}
.uslovno,
.podskazka {
  font-size: 14px;
  color: var(--tihij);
}
.karta {
  background: var(--karta);
  border: 1px solid var(--liniya);
  border-radius: var(--radius);
  box-shadow: var(--ten);
  padding: 24px;
}
.forma {
  display: grid;
  gap: 10px;
}
label {
  font-weight: 700;
  font-size: 15px;
}
.stroka {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
input {
  flex: 1 1 220px;
  min-width: 0;
  font: inherit;
  font-size: 20px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: inherit;
  background: #fff;
  border: 1px solid #c9b9a9;
  border-radius: 8px;
  padding: 10px 12px;
}
input::placeholder {
  text-transform: none;
  letter-spacing: 0;
  color: #9a8b80;
}
input:focus-visible,
button:focus-visible,
a:focus-visible {
  outline: 3px solid var(--glavnyj);
  outline-offset: 2px;
}
.knopka {
  font: inherit;
  font-weight: 700;
  border: 0;
  border-radius: 8px;
  padding: 12px 20px;
  min-height: 48px;
  background: var(--glavnyj);
  color: #fff;
  cursor: pointer;
  transition: background-color 0.15s;
}
.knopka:hover {
  background: var(--glavnyj-temnee);
}
.ssylka {
  font: inherit;
  background: none;
  border: 0;
  padding: 0;
  color: var(--glavnyj-temnee);
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
  font-variant-numeric: tabular-nums;
}
.otvet {
  border-radius: var(--radius);
  padding: 20px 24px;
  display: grid;
  gap: 6px;
  border: 1px solid transparent;
}
.otvet h2 {
  font-size: 28px;
}
.otvet--vydan {
  background: var(--ok-fon);
  border-color: #b9d8bf;
}
.otvet--vydan h2 {
  color: var(--ok);
}
.otvet--net,
.otvet--oshibka {
  background: var(--oshibka-fon);
  border-color: #efc4bd;
}
.otvet--net h2,
.otvet--oshibka h2 {
  color: var(--oshibka);
}
.poyasnenie {
  display: grid;
  gap: 12px;
}
.poyasnenie h2 {
  font-size: 24px;
  margin-top: 8px;
}
a {
  color: var(--glavnyj-temnee);
  text-underline-offset: 3px;
}
.podval {
  font-size: 13px;
  color: var(--tihij);
}
@media (max-width: 640px) {
  .stranica {
    padding-top: 24px;
  }
  .karta {
    padding: 18px;
  }
  .knopka {
    width: 100%;
  }
}
@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
  }
}
```

- [ ] **Step 5: Разметка страницы проверки**

Содержимое `<main class="stranica">` в `p/index.html`:

```html
<header class="shapka">
  <p class="shapka__metka">Школа керамики «Обжиг»</p>
  <h1>Проверка сертификата</h1>
  <p class="shapka__podvodka">
    Введите номер с сертификата — восемь знаков. Дефисы и пробелы можно не
    ставить.
  </p>
  <p class="uslovno">Пример: школа вымышленная, номера условные.</p>
</header>

<form id="forma" class="karta forma" novalidate>
  <label for="nomer">Номер сертификата</label>
  <div class="stroka">
    <input
      id="nomer"
      name="n"
      autocomplete="off"
      autocapitalize="characters"
      spellcheck="false"
      placeholder="например, 26-GK-001-5"
      maxlength="24"
    />
    <button class="knopka" type="submit">Проверить</button>
  </div>
  <p class="podskazka" id="primer" hidden>
    Номер из примера:
    <button type="button" class="ssylka" id="primerNomer"></button>
  </p>
</form>

<section class="otvet" id="otvet" aria-live="polite" hidden></section>

<section class="karta poyasnenie" aria-labelledby="chtoPokazyvaet">
  <h2 id="chtoPokazyvaet">Что показывает проверка</h2>
  <p>
    Что школа действительно выдала сертификат с этим номером, — по какому курсу
    и когда. Имени владельца здесь нет: реестр открыт всем, а список фамилий в
    открытом доступе — публикация персональных данных. Имя вы видите на самом
    сертификате.
  </p>
  <h2>Чего проверка не показывает</h2>
  <p>
    Подлинности самой картинки. Номер не защищает от подделки: сертификат можно
    перерисовать. Последний знак номера — проверочный: он не даёт подобрать
    соседний номер, но и только.
  </p>
  <p class="podval">
    Сертификаты сделаны <a href="../">генератором сертификатов пачкой</a>.
  </p>
</section>
```

- [ ] **Step 6: Блок проверки**

После блока `obshchee` в `p/index.html`:

```html
<script id="proverka">
  (function () {
    "use strict";
    const O = window.Obshchee;
    const $ = (id) => document.getElementById(id);
    let reestr = null;

    // Реестр лежит рядом со страницей; своего адреса у него нет.
    const zagruzka = fetch("reestr.json", { cache: "no-cache" })
      .then((o) => {
        if (!o.ok) throw new Error("HTTP " + o.status);
        return o.json();
      })
      .then((r) => {
        reestr = r;
        if (r.vydano.length) {
          $("primerNomer").textContent = O.krasivo(r.vydano[0].nomer);
          $("primer").hidden = false;
        }
      })
      .catch(() => {
        reestr = null;
      });

    function otvet(vid, zagolovok, stroki) {
      const h = document.createElement("h2");
      h.textContent = zagolovok;
      const abzacy = stroki.map((t) => {
        const p = document.createElement("p");
        p.textContent = t;
        return p;
      });
      $("otvet").className = "otvet otvet--" + vid;
      $("otvet").replaceChildren(h, ...abzacy);
      $("otvet").hidden = false;
    }

    async function proverit(vvod) {
      await zagruzka;
      if (!reestr) {
        otvet("oshibka", "Реестр школы не загрузился", [
          "Проверьте интернет и попробуйте ещё раз.",
        ]);
        return;
      }
      const r = O.najti(reestr, vvod);
      if (r.sostoyanie === "vydan") {
        otvet("vydan", "Сертификат № " + O.krasivo(r.nomer) + " выдан", [
          "Курс: " + r.kurs,
          "Дата выдачи: " + O.formatDaty(r.data),
          "Имя владельца здесь не показывается — сверьте его с сертификатом.",
        ]);
      } else if (r.sostoyanie === "net") {
        otvet("net", "Такой сертификат не выдавался", [
          "Номер " +
            O.krasivo(r.nomer) +
            " набран без ошибок, но в реестре школы его нет.",
        ]);
      } else {
        otvet("oshibka", "В номере ошибка", [
          "В номере восемь знаков: две цифры года, две латинские буквы курса, три цифры и проверочный знак. Букв O и I в номерах нет — это цифры 0 и 1.",
        ]);
      }
    }

    $("forma").addEventListener("submit", (e) => {
      e.preventDefault();
      proverit($("nomer").value);
    });
    $("primerNomer").addEventListener("click", () => {
      $("nomer").value = $("primerNomer").textContent;
      proverit($("nomer").value);
    });
    const izAdresa = new URLSearchParams(location.search).get("n");
    if (izAdresa) {
      $("nomer").value = izAdresa;
      proverit(izAdresa);
    }
  })();
</script>
```

- [ ] **Step 7: Тесты**

Run: `node --test tests/`
Expected: PASS все, включая `stranicy` (блок `obshchee` в двух страницах по-прежнему одинаковый; `fetch('reestr.json')` — не внешний).

- [ ] **Step 8: Проверка в браузере**

Сервер из задачи 8 (`http://localhost:8765/`). Через Playwright MCP открыть `http://localhost:8765/p/`:

1. Нажать кнопку номера-примера → ответ «Сертификат № 26-GK-001-5 выдан», курс «Гончарный круг: основы», «27 сентября 2026 г.».
2. Ввести `26-GK-500-` + любой знак, при котором ответ «Такой сертификат не выдавался» (посчитать настоящий знак в консоли: `Obshchee.sobrat(2026,'GK',500)`), — ответ «не выдавался».
3. Ввести `26GK0019` → «В номере ошибка».
4. Открыть `http://localhost:8765/p/?n=26gk0015` → сразу ответ «выдан».

- [ ] **Step 9: Commit**

```bash
git add tools/primer-reestra.mjs p/reestr.json p/index.html tests/primer.test.mjs
git commit -m "Страница проверки по номеру и реестр примера без имён

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Приёмка в браузере, скриншоты, README

Всё из раздела спеки «Что проверяется — в браузере» плюс «открыт двойным щелчком». Временные файлы — в `proverka-vremenno/` (в `.gitignore`).

**Files:**

- Modify: `README.md`
- Create: `proverka-vremenno/*` (не в git)

- [ ] **Step 1: Архив скачивается и распаковывается**

Playwright, `http://localhost:8765/`: «Сделать сертификаты», дождаться «Готово: 7 сертификатов». Через `browser_run_code_unsafe`:

```js
async (page) => {
  const [d] = await Promise.all([
    page.waitForEvent("download"),
    page.click("#skachatArhiv"),
  ]);
  await d.saveAs(
    "/Users/dmitrijvolkov/Progects/sertifikaty-pachkoy/proverka-vremenno/arhiv.zip",
  );
  return d.suggestedFilename();
};
```

Затем:

```bash
cd ~/Progects/sertifikaty-pachkoy/proverka-vremenno && unzip -tq arhiv.zip && /usr/bin/python3 - <<'EOF'
import zipfile, struct
z = zipfile.ZipFile('arhiv.zip')
for i in z.infolist():
    b = z.read(i)
    w, h = struct.unpack('>II', b[16:24])
    print(i.filename, w, h, len(b) // 1024, 'КБ')
print('файлов:', len(z.infolist()))
EOF
```

Expected: `No errors`; 7 файлов, у каждого `3508 2480`; имена вида `26-GK-001-5 Иванова Анна Сергеевна.png`. Вес архива в кнопке совпадает с размером файла (`ls -l`).

- [ ] **Step 2: Реестр скачивается и совпадает с реестром примера**

Тем же способом скачать `#skachatReestr` в `proverka-vremenno/reestr.json`, если на странице выбрана дата 2026-09-27 (поставить её в поле `#data` перед «Сделать»). Run: `diff proverka-vremenno/reestr.json p/reestr.json`
Expected: без различий.

- [ ] **Step 3: Лист для печати — по сертификату на лист, рамка целая**

```js
async (page) => {
  await page.emulateMedia({ media: "print" });
  await page.pdf({
    path: "/Users/dmitrijvolkov/Progects/sertifikaty-pachkoy/proverka-vremenno/list.pdf",
    preferCSSPageSize: true,
    printBackground: true,
  });
  await page.emulateMedia({ media: "screen" });
  return "ok";
};
```

```bash
cd ~/Progects/sertifikaty-pachkoy/proverka-vremenno && /usr/bin/python3 -c "import re;print('листов:', len(re.findall(rb'/Type\s*/Page\b', open('list.pdf','rb').read())))" && sips -s format png list.pdf --out list-1.png >/dev/null && sips -g pixelWidth -g pixelHeight list-1.png
```

Expected: `листов: 7`; первая страница альбомная. Посмотреть `list-1.png` (Read): двойная рамка видна целиком со всех четырёх сторон, отступ от края листа есть. Если листов больше 7 (пустые между сертификатами) — поменять в печатных правилах `height:210mm` у `.list` и `.list img` на `209.5mm`, повторить шаг.

- [ ] **Step 4: Пятьдесят участников и предел**

В странице:

```js
document.getElementById("spisok").value = Array.from(
  { length: 50 },
  (_, i) => "Участникова Участница " + (i + 1),
).join("\n");
document.getElementById("spisok").dispatchEvent(new Event("input"));
const t0 = performance.now();
document.getElementById("sdelat").click();
```

Дождаться «Готово: 50 сертификатов», записать время и вес из `#progress`. Повторить шаг 3 — ожидать `листов: 50` без падения вкладки. Если печать 50 листов в 300 точек падает или идёт дольше минуты — сообщить пользователю и предложить лист для печати в 200 точек (архив остаётся 300); без его решения не менять.
Затем 51 строку → в `#schet` красная пометка о пределе, по «Сделать» — ошибка «предел пачки — 50», сертификатов нет.

- [ ] **Step 5: Поле печати с настоящими шрифтами**

В странице (после генерации примера):

```js
const c = document.createElement("canvas").getContext("2d");
const iz = Yadro.izmeritCanvas(c);
[
  "Ли Ян",
  "Анна-Марина Константинопольская-Преображенская Святославовна",
  "Мамедов Эльчин Рашид оглы",
  "Я".repeat(60),
].map((imya) => [
  imya,
  Yadro.zaPolem(
    Yadro.raskladka(
      Yadro.SHABLON,
      {
        imya,
        kurs: "Гончарный круг: основы",
        data: "2026-09-27",
        nomer: Obshchee.sobrat(2026, "GK", 1),
      },
      iz,
    ),
    Yadro.SHABLON,
    iz,
  ),
]);
```

Expected: у всех пустой список.

- [ ] **Step 6: 360 пикселей, консоль, сеть**

`browser_resize` 360×800 на `/` (после генерации) и на `/p/` (после проверки номера):

```js
document.documentElement.scrollWidth <= window.innerWidth;
```

Expected: `true` на обеих. `browser_console_messages` — ни одной ошибки и предупреждения. `browser_network_requests` — все адреса `http://localhost:8765/…`, `blob:` или `data:`; ни одного чужого домена.

- [ ] **Step 7: Открыт с диска двойным щелчком**

Playwright: открыть `file:///Users/dmitrijvolkov/Progects/sertifikaty-pachkoy/index.html`, «Сделать сертификаты», дождаться «Готово: 7 сертификатов», скачать архив (как в шаге 1, в `proverka-vremenno/arhiv-file.zip`), `unzip -tq`. Проверить консоль — чисто. Дополнительно: `open -a Safari ~/Progects/sertifikaty-pachkoy/index.html` и попросить пользователя глазами подтвердить, что в Safari с диска страница рисует сертификаты (Safari — частый браузер на маках школы).

- [ ] **Step 8: Скриншоты для пользователя**

Скриншоты Playwright в `proverka-vremenno/`: генератор после пачки (1440 ширина, вся страница), крупно третий сертификат (длинное имя), страница проверки с ответом «выдан», генератор на 360. Показать пользователю (Read файлов) вместе с `list-1.png`.

- [ ] **Step 9: README**

В `README.md` раздел «Состояние на 27.09.2026» заменить на фактическое состояние и добавить раздел:

```markdown
## Как проверить и пересобрать

Нужны только Node 24 и системный Python macOS — ни npm, ни установки пакетов.

Тесты:

    node --test tests/

Посмотреть у себя:

    python3 -m http.server 8765

генератор — http://localhost:8765/, проверка — http://localhost:8765/p/.
Генератор работает и открытым с диска двойным щелчком; страница проверки —
только по адресу: ей нужен соседний файл реестра.

Пересобрать реестр примера после правки списка-примера в index.html:

    node tools/primer-reestra.mjs

Заново подрезать и вшить шрифты:

    /usr/bin/python3 tools/shrift.py

## Как устроено

Код живёт прямо в страницах, в блоках `<script id="…">`. `obshchee` —
номер и поиск в реестре, одинаковый в обеих страницах (тест следит).
`yadro` — разбор списка, кегль, шаблон, архив, реестр. Тесты выполняют
эти блоки из HTML — второго экземпляра кода нет.

Шаблон сертификата — данные в миллиметрах (`SHABLON` в блоке `yadro`).
Поменять школу, курсы или поле — правка шаблона, а не рисования.
```

- [ ] **Step 10: Тесты, коммит, журнал**

Run: `node --test tests/` — PASS все.

```bash
git add README.md index.html p/index.html
git commit -m "Приёмка в браузере, README: как проверить и пересобрать

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

Обновить `~/Obsidian/Brain/index.md`: что сделано, что дальше (правки пользователя, выкладка), дата. В `~/Obsidian/Brain/decisions.md` — решения: номер с проверочным знаком Луна по модулю 34; реестр без имён; ZIP своим кодом без сжатия; печать через браузер.

**Здесь остановиться и показать результат пользователю (шаг «Правки» из CLAUDE.md).** Выкладка — только после его «да».

---

### Task 11: Выкладка на GitHub Pages (после «да» пользователя)

Загрузить скилл `deploy-static-ru` и следовать ему; ниже — минимум.

**Files:** —

- [ ] **Step 1: Репозиторий и Pages**

```bash
cd ~/Progects/sertifikaty-pachkoy && gh repo create pyhphhddb8-eng/sertifikaty-pachkoy --public --source . --push
```

```bash
gh api -X POST repos/pyhphhddb8-eng/sertifikaty-pachkoy/pages -f 'source[branch]=main' -f 'source[path]=/'
```

- [ ] **Step 2: Проверка живого адреса**

Дождаться сборки (`gh api repos/pyhphhddb8-eng/sertifikaty-pachkoy/pages/builds/latest --jq .status` → `built`), затем:

```bash
for u in "" p/ p/reestr.json robots.txt; do printf "%s " "$u"; curl -s -o /dev/null -w "%{http_code}\n" "https://pyhphhddb8-eng.github.io/sertifikaty-pachkoy/$u"; done
curl -s https://pyhphhddb8-eng.github.io/sertifikaty-pachkoy/ | grep -c 'noindex, nofollow'
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" https://pyhphhddb8-eng.github.io/sertifikaty-pachkoy/p
```

Expected: четыре `200`; `1`; адрес с сертификата `…/p` отдаёт перенаправление на `…/p/`.

- [ ] **Step 3: Проверка в браузере по живому адресу**

Playwright: генератор по живому адресу делает пачку; `…/p/?n=26-GK-001-5` → «выдан»; сеть — только `pyhphhddb8-eng.github.io`, `blob:`, `data:`; консоль чистая.

- [ ] **Step 4: README и журнал**

В README — живые адреса и состояние «Собрано, проверено и выложено». Commit + push. Обновить `~/Obsidian/Brain/index.md`.
