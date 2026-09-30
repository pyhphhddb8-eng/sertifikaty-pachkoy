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
    "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ-.,:«»№—‘’“” "
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
