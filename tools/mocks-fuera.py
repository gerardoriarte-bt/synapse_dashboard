#!/usr/bin/env python3
"""Ningún archivo de `src/` importa un mock · F0.8, ahora verificada

    python3 tools/mocks-fuera.py     ·     npm run mocks-fuera

── POR QUÉ APARECE ESTE CHEQUEO ──────────────────────────────────────────────

F0.8 —«sacar mocks y defaults del bundle»— estaba **cumplida por construcción**:
los handlers de MSW viven en `tests/`, fuera de `src/`, y la garantía era que
**no existe ruta de import** desde una superficie hasta un mock. Nada la hacía
cumplir porque nada podía romperla sin que se notara.

El 2026-09-15 apareció un segundo directorio de mocks —`dev/`, el modo
`npm run dev:mock`— y con él la primera forma barata de romperla: un
`if (import.meta.env.DEV) import('../../dev/mocks/browser')` dentro de `src/`
compila, funciona en desarrollo, y deja el bundle de producción a merced de que
el tree-shaking haga lo que creemos.

**Una garantía que depende de que nadie escriba una línea es una convención, no
una garantía.** Esto la vuelve verificable.

── QUÉ MIRA ──────────────────────────────────────────────────────────────────

Cualquier `import`/`export ... from` o `import(...)` en `src/**` cuyo destino
caiga —por ruta relativa o por alias— dentro de `tests/` o `dev/`.

**`import type` tampoco vale**, y no es una exageración: un tipo no llega al
bundle, pero un import de tipo desde un mock significa que el mock se volvió la
fuente de una forma que debería declarar el contrato.

Códigos: 0 conforme · 1 hay una ruta · 2 BLOQUEADO (falta `src/`).
"""
# Python 3.9 en esta máquina · sin esto, `pathlib.Path | None` revienta al
# definir la función. Misma razón que en `tools/humo.py`.
from __future__ import annotations

import pathlib
import re
import sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent
SRC = RAIZ / "src"
PROHIBIDOS = ("tests", "dev")

# `from '…'`, `import '…'` e `import('…')` — las tres formas que crean una ruta.
IMPORTS = re.compile(r"""(?:from|import)\s*\(?\s*['"]([^'"]+)['"]""")


def destino(archivo: pathlib.Path, especificador: str) -> pathlib.Path | None:
    """A qué carpeta del repositorio apunta, o `None` si es un paquete."""
    if especificador.startswith("@/"):
        return SRC / especificador[2:]
    if especificador.startswith("."):
        return (archivo.parent / especificador).resolve()
    return None


def main() -> int:
    if not SRC.is_dir():
        print("mocks-fuera ⊘ BLOQUEADO · falta src/")
        return 2

    rutas: list[str] = []
    archivos = [p for p in SRC.rglob("*") if p.suffix in {".ts", ".tsx"} and p.is_file()]

    for archivo in archivos:
        for esp in IMPORTS.findall(archivo.read_text(encoding="utf-8")):
            d = destino(archivo, esp)
            if d is None:
                continue
            try:
                relativa = d.relative_to(RAIZ)
            except ValueError:
                # Sale del repositorio · es otro problema y no el de este chequeo.
                continue
            if relativa.parts and relativa.parts[0] in PROHIBIDOS:
                rutas.append(f"{archivo.relative_to(RAIZ)} → {esp}")

    print(f"mocks-fuera · {len(archivos)} archivos de src/")

    if rutas:
        print(f"mocks-fuera ✗ {len(rutas)} ruta(s) desde src/ hasta un mock")
        for r in rutas:
            print(f"  {r}")
        print()
        print("  **F0.8 dice que los mocks no entran al bundle**, y la garantía es")
        print("  que no exista esta ruta. Si hace falta datos falsos en desarrollo,")
        print("  el camino es una ENTRADA APARTE —`dev/main.tsx` con su propio")
        print("  html— y no un import condicionado dentro de `src/`.")
        return 1

    print("mocks-fuera ✓ ninguna · tests/ y dev/ siguen sin ruta desde src/")
    return 0


if __name__ == "__main__":
    sys.exit(main())
