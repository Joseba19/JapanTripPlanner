"""
Recorta Shippori Mincho (titulares y kanji decorativos) a lo que usa la app.

La fuente completa pesa ~8,6 MB. Nos quedamos con el latín que necesita el español
y con los caracteres japoneses que aparecen en src/, así que pesa unas decenas de KB.

Uso (requiere `pip install fonttools brotli`):
    python scripts/subset-fonts.py ruta/a/ShipporiMincho-SemiBold.ttf

Vuelve a ejecutarlo si añades kanji nuevos a la interfaz. Los que falten se verán
con la fuente serif del sistema (Yu Mincho, Hiragino…), no se rompe nada.
Fuente original: https://github.com/google/fonts/tree/main/ofl/shipporimincho (licencia OFL).
"""

import re
import sys
from pathlib import Path

from fontTools import subset

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "fonts" / "shippori-mincho-600.woff2"

# Hiragana, katakana, kanji y puntuación japonesa
CJK = re.compile(r"[　-〿぀-ゟ゠-ヿ一-鿿＀-￯]")

LATIN = [
    *range(0x20, 0x7F),  # ASCII
    *range(0xA0, 0x100),  # Latin-1: á é í ó ú ñ ü ¿ ¡ …
    0x2013, 0x2014, 0x2018, 0x2019, 0x201C, 0x201D, 0x2026, 0x20AC,  # – — ‘ ’ “ ” … €
    0x00AB, 0x00BB, 0x00B7,  # « » ·
]


def used_cjk() -> list[str]:
    chars = set()
    for path in (ROOT / "src").rglob("*"):
        if path.suffix in {".js", ".jsx", ".css"}:
            chars.update(CJK.findall(path.read_text(encoding="utf-8")))
    return sorted(chars)


def main() -> None:
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    sys.stdout.reconfigure(encoding="utf-8")  # la consola de Windows no imprime kanji por defecto
    cjk = used_cjk()
    options = subset.Options()
    options.flavor = "woff2"
    options.layout_features = ["kern", "liga", "palt"]
    options.name_IDs = ["*"]
    options.notdef_outline = True

    font = subset.load_font(sys.argv[1], options)
    subsetter = subset.Subsetter(options)
    subsetter.populate(unicodes=LATIN + [ord(c) for c in cjk])
    subsetter.subset(font)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    subset.save_font(font, str(OUT), options)

    print(f"{len(cjk)} caracteres japoneses: {''.join(cjk)}")
    print(f"→ {OUT.relative_to(ROOT)} ({OUT.stat().st_size / 1024:.1f} KB)")


if __name__ == "__main__":
    main()
