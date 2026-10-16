"""
Genera los iconos de la PWA en public/icons/: el sello hanko bermellón con 旅 sobre tinta sumi,
el mismo que la marca de la cabecera.

Uso (requiere `pip install pillow`):
    python scripts/make-icons.py

Usa la Shippori Mincho recortada de public/fonts (Pillow lee el WOFF2 directamente).
Se dibuja a 4× y se reduce, para que los bordes salgan suaves.
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
FONT = ROOT / "public" / "fonts" / "shippori-mincho-600.woff2"
OUT = ROOT / "public" / "icons"

SUMI = "#0f1014"
VERMILION = "#d9432a"
PAPER = "#fff7ec"
SCALE = 4


def stamp(size: int) -> Image.Image:
    """Sello cuadrado de `size` px (sin rotar) con borde interior y el kanji."""
    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    draw.rounded_rectangle((0, 0, size - 1, size - 1), radius=size * 0.17, fill=VERMILION)
    inset = size * 0.11
    draw.rounded_rectangle(
        (inset, inset, size - 1 - inset, size - 1 - inset),
        radius=size * 0.09,
        outline=PAPER,
        width=max(1, round(size * 0.045)),
    )
    font = ImageFont.truetype(str(FONT), round(size * 0.56))
    draw.text((size / 2, size / 2), "旅", font=font, fill=PAPER, anchor="mm")
    return layer


def icon(size: int, *, stamp_ratio: float, rounded: bool) -> Image.Image:
    big = size * SCALE
    canvas = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    background = ImageDraw.Draw(canvas)
    if rounded:
        background.rounded_rectangle((0, 0, big - 1, big - 1), radius=big * 0.22, fill=SUMI)
    else:
        background.rectangle((0, 0, big, big), fill=SUMI)

    seal = stamp(round(big * stamp_ratio)).rotate(6, resample=Image.BICUBIC, expand=True)
    canvas.alpha_composite(seal, ((big - seal.width) // 2, (big - seal.height) // 2))
    return canvas.resize((size, size), Image.LANCZOS)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    targets = {
        # "any": esquinas redondeadas propias, se muestran tal cual
        "pwa-192.png": icon(192, stamp_ratio=0.62, rounded=True),
        "pwa-512.png": icon(512, stamp_ratio=0.62, rounded=True),
        # maskable: fondo a sangre y el sello dentro de la zona segura (círculo del 80 %)
        "maskable-512.png": icon(512, stamp_ratio=0.5, rounded=False),
        # iOS redondea él solo y no admite transparencia
        "apple-touch-icon.png": icon(180, stamp_ratio=0.6, rounded=False).convert("RGB"),
    }
    for name, image in targets.items():
        path = OUT / name
        image.save(path, optimize=True)
        print(f"→ {path.relative_to(ROOT)} ({path.stat().st_size / 1024:.1f} KB)")


if __name__ == "__main__":
    main()
