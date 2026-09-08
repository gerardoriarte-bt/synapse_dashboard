#!/usr/bin/env python3
"""Contraste WCAG de los pares que el producto realmente pinta · F5.11

    python3 tools/contraste.py

§1.4 pide «contraste de `dim` sobre `panel` en los dos temas, a 10 px». Está
ampliado a los pares que de verdad aparecen en pantalla, porque revisar solo el
que se sospecha deja pasar el que no.

**Los tokens NO se editan desde acá.** Salen del `.pen`, los emite
`gen-tokens.py` y los vigila `token-drift`. Este chequeo DIAGNOSTICA; arreglar
una desviación es una decisión de diseño y se toma en el `.pen`.

── QUÉ CAMBIA RESPECTO DEL DE v2 ─────────────────────────────────────────────

  · **El espacio de nombres.** Acá el token es `--color-dim`, no `--dim`. Los
    pares se escriben con el nombre del producto y la traducción vive en un solo
    lugar, igual que `ESPACIOS` en `token-drift`.

  · **Los bloques de tema son otros.** v2 tenía `:root` + dos bloques de tema;
    acá el oscuro ES `@theme static` —el defecto— y el claro es CSS plano fuera
    de `@theme`.

  · **El fondo puede ser una PILA, y esto es nuevo.** Un wash no es un fondo: es
    una capa sobre uno. La pestaña activa y el hilo activo del riel se pintan
    `bg-w2` sobre la superficie, así que el texto no va sobre `elev` sino sobre
    `w2` compuesto sobre `elev`. Medir contra `elev` a secas mide un fondo que
    nadie ve. Se resuelve componiendo de abajo hacia arriba.

Salida: 0 conforme —las desviaciones REGISTRADAS se imprimen como pendientes de
diseño—, 1 si aparece una nueva o si una registrada cambió de valor.
"""
# Python 3.9 en esta máquina: sin esto, `str | list[str]` se evalúa al importar
# y revienta. Mismo motivo por el que lo lleva `plan-diff.py`.
from __future__ import annotations

import pathlib
import re
import sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent
CSS = RAIZ / "src" / "tokens" / "tokens.css"

# Texto normal. Los `Label` del producto son mono 10px, que es texto chico: el
# umbral de 3:1 para «texto grande» no aplica a nada de lo que medimos acá.
UMBRAL = 4.5

# El prefijo que Tailwind exige. El par se escribe `dim`, el CSS dice
# `--color-dim`. La traducción está acá y en ningún otro lado.
PREFIJO = "--color-"

# ── Desviaciones registradas ─────────────────────────────────────────────────
# Van acá y no en un comentario disperso para que se cuenten y se vean juntas.
# El diccionario estaba vacío en v2 y esa es la forma correcta de tenerlo: así
# la próxima desviación se ve sola. Esta es la primera, y la encontró el port en
# su primera corrida.
#
# **`dim` sobre `w3` sobre `panel`, tema oscuro: 4.17 contra 4.5.** Es el badge
# de `DegradedBadge`, que es un `<Label>` —mono 10px, `dim`— sobre `bg-w3` en la
# cabecera del panel.
#
# Lo importante es POR QUÉ no se veía: `dim` sobre `panel` da 5.04 y pasa. Es el
# wash lo que lo hunde, y el chequeo de v2 medía contra la superficie sin la
# capa encima, así que habría dicho «conforme». En tema claro da 4.60, que pasa
# raspando.
#
# NO se arregla acá ni en `tokens.css`: los tokens salen del `.pen`. Las salidas
# son subir la luminosidad de `dim`, bajar el alfa de `w3`, o que el badge deje
# de usar `dim`. Las tres son decisiones de diseño y las tres tocan más cosas
# que este badge. Abierta como pregunta 13 de B0.9.
REGISTRADAS: dict[tuple[str, str, str], float] = {
    ("oscuro", "dim", "w3/panel"): 4.17,
}

# (frente, fondo, qué es). El fondo puede ser una pila: `['w2', 'elev']` es w2
# sobre elev, de arriba hacia abajo, que es como se lee en el JSX.
PARES: list[tuple[str, str | list[str], str]] = [
    ("dim", "panel", "Label mono 10px sobre panel"),
    ("dim", "bg", "Label mono 10px sobre el lienzo"),
    ("dim", "elev", "Label sobre superficie elevada"),
    ("dim", "dock", "Label sobre el navbar"),
    ("ink", "panel", "Texto de cuerpo sobre panel"),
    ("ink", "bg", "Texto sobre el lienzo"),
    ("ink", "elev", "Texto de la hoja de chat sobre superficie elevada"),
    # El logotipo se pinta con `ink` por máscara, así que su contraste se mide
    # como el de cualquier otro elemento y no es una excepción de marca.
    ("ink", "dock", "Logotipo del navbar"),
    ("acc", "panel", "CTA, enlaces y cifras resaltadas sobre panel"),
    ("acc", "dock", "CTA del navbar"),
    ("on-acc", "acc", "Texto dentro del botón naranja"),
    # Un estado hover que no se lee es tan inservible como uno que no se ve: el
    # cursor está encima justo cuando hay que leerlo.
    ("acc-hover", "panel", "«Ver detalle» del panel, con el cursor encima"),
    # El caso que §1.4 persigue de verdad: mono 10px, en `dim`, sobre un wash.
    # `DegradedBadge` es `<Label>` sobre `bg-w3` en la cabecera del panel.
    ("dim", ["w3", "panel"], "Badge de degradado · mono 10px sobre wash"),
    # Los activos del producto, todos sobre un wash. Ver la cabecera.
    ("ink", ["w2", "dock"], "Pestaña activa · texto sobre wash sobre el navbar"),
    ("ink", ["w2", "elev"], "Hilo activo del riel · texto sobre wash"),
    ("ink", ["w2", "panel"], "Botón de superficie sobre wash sobre panel"),
]


def bloque(css: str, selector: str) -> dict[str, str]:
    m = re.search(re.escape(selector) + r"\s*\{(.*?)\n\}", css, re.S)
    if m is None:
        return {}
    return dict(re.findall(r"--([\w-]+):\s*(#[0-9A-Fa-f]{6,8})", m.group(1)))


def rgba(h: str) -> tuple[tuple[int, int, int], float]:
    h = h.lstrip("#")
    canales = (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))
    return canales, (int(h[6:8], 16) / 255 if len(h) == 8 else 1.0)


def sobre(frente: str, fondo: tuple[float, float, float]) -> tuple[float, float, float]:
    """Compone `frente` sobre un fondo ya resuelto.

    Un token con alfa no tiene color propio: `--color-w2` es `#ffffff0f`, un 6%
    de blanco. Preguntar «cuánto contrasta w2» no significa nada hasta saber
    contra qué está."""
    (fr, fv, fb), a = rgba(frente)
    br, bv, bb = fondo
    return (fr * a + br * (1 - a), fv * a + bv * (1 - a), fb * a + bb * (1 - a))


def resolver(pila: list[str], tokens: dict[str, str]) -> tuple[float, float, float]:
    """La pila llega de arriba hacia abajo; se compone al revés, desde el fondo
    opaco. El último tiene que ser opaco o no hay contra qué componer."""
    base, _ = rgba(tokens[pila[-1]])
    color = (float(base[0]), float(base[1]), float(base[2]))
    for capa in reversed(pila[:-1]):
        color = sobre(tokens[capa], color)
    return color


def luminancia(c: tuple[float, float, float]) -> float:
    def canal(v: float) -> float:
        v /= 255
        return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4

    r, g, b = (canal(x) for x in c)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contraste(frente: str, pila: list[str], tokens: dict[str, str]) -> float:
    fondo = resolver(pila, tokens)
    a, b = luminancia(sobre(tokens[frente], fondo)), luminancia(fondo)
    hi, lo = max(a, b), min(a, b)
    return (hi + 0.05) / (lo + 0.05)


def main() -> int:
    if not CSS.exists():
        print(f"contraste ⊘ BLOQUEADO · falta {CSS.relative_to(RAIZ)}")
        return 2

    css = CSS.read_text(encoding="utf-8")
    temas = {
        # El oscuro ES `@theme static`: sin atributo de tema, la consola se ve
        # como el `.pen`. El claro solo redefine, así que hereda lo que no toca.
        "oscuro": bloque(css, "@theme static"),
        "claro": {**bloque(css, "@theme static"), **bloque(css, ":root[data-theme='light']")},
    }
    if not temas["oscuro"]:
        print("contraste ⊘ BLOQUEADO · no se pudo leer `@theme static` de tokens.css")
        return 2

    nuevas: list[str] = []
    pendientes: list[str] = []
    movidas: list[str] = []
    medidos = 0

    for tema, crudos in temas.items():
        tokens = {n[len(PREFIJO) - 2:]: v for n, v in crudos.items() if f"--{n}".startswith(PREFIJO)}
        for frente, fondo, que in PARES:
            pila = [fondo] if isinstance(fondo, str) else fondo
            faltan = [t for t in [frente, *pila] if t not in tokens]
            if faltan:
                nuevas.append(f"{tema}: falta el token {', '.join(faltan)}")
                continue

            medidos += 1
            r = round(contraste(frente, pila, tokens), 2)
            if r >= UMBRAL:
                continue

            etiqueta = " sobre ".join([frente, *pila])
            registrada = REGISTRADAS.get((tema, frente, "/".join(pila)))
            if registrada is None:
                nuevas.append(f"{tema}: {r:.2f}  {etiqueta}  ·  {que}")
            elif abs(registrada - r) > 0.01:
                movidas.append(f"{tema}: {etiqueta} pasó de {registrada:.2f} a {r:.2f}")
            else:
                pendientes.append(f"{tema}: {r:.2f}  {etiqueta}  ·  {que}")

    for p in pendientes:
        print(f"contraste PENDIENTE DE DISEÑO · {p}")
    if pendientes:
        print("contraste · los tokens salen del `.pen`; arreglarlo es decisión de diseño.")
    for m in movidas:
        print(f"contraste ✗ {m}")
    for n in nuevas:
        print(f"contraste ✗ desviación NUEVA · {n}")

    if nuevas or movidas:
        print()
        print("  Un token NO se corrige acá ni en `tokens.css`: se corrige en el `.pen`")
        print("  y se regenera con `npm run gen:tokens`.")
        return 1

    print(f"contraste ✓ {medidos - len(pendientes)} pares sobre {UMBRAL}:1 · los dos temas")
    return 0


if __name__ == "__main__":
    sys.exit(main())
