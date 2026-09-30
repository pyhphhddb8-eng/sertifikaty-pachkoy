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
