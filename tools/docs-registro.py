#!/usr/bin/env python3
"""Los documentos de `docs/` están registrados en el plan · el oráculo

    python3 tools/docs-registro.py     ·     npm run docs-registro

── POR QUÉ ──────────────────────────────────────────────────────────────────

El 2026-09-14 había **cuatro documentos** diciendo qué le falta al backend, y el
más viejo anunciaba como faltantes ocho rutas que ya estaban servidas. Nadie lo
hizo a propósito: cada uno se escribió para una conversación distinta y ninguno
declaró su rol, así que todos parecían vigentes.

**Agregar un documento es legítimo. Agregarlo sin decir qué rol cumple no**, y
eso es lo único que este chequeo pide.

── LA LISTA BLANCA VIVE EN EL PLAN ──────────────────────────────────────────

En `plan-de-trabajo.md`, sección «Registro de documentos». Se lee de ahí y no de
una constante acá: **una lista blanca que vive en el verificador es una segunda
fuente**, justo lo que este chequeo existe para evitar.

Reporta dos cosas, y las dos importan:

  · un archivo en `docs/` que ningún patrón cubre — se agregó sin declarar rol
  · un patrón del registro que no cubre ningún archivo — quedó apuntando a algo
    que ya no está, y el registro empieza a mentir

Códigos: 0 conforme · 1 hay deriva · 2 BLOQUEADO (falta el plan o `docs/`).
"""
import fnmatch
import pathlib
import re
import sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent
PLAN = RAIZ / "plan-de-trabajo.md"
DOCS = RAIZ / "docs"


def patrones_del_plan(texto: str) -> list[str]:
    """Las filas de la tabla que sigue al encabezado del registro."""
    i = texto.find("### Registro de documentos")
    if i < 0:
        return []
    bloque = texto[i : texto.find("\n## ", i) if "\n## " in texto[i:] else len(texto)]
    return re.findall(r"^\| `([^`]+)` \|", bloque, re.M)


def main() -> int:
    if not PLAN.exists():
        print("docs-registro ⊘ BLOQUEADO · falta plan-de-trabajo.md")
        return 2
    if not DOCS.is_dir():
        print("docs-registro ⊘ BLOQUEADO · falta docs/")
        return 2

    patrones = patrones_del_plan(PLAN.read_text(encoding="utf-8"))
    if not patrones:
        print("docs-registro ⊘ BLOQUEADO · el plan no declara «Registro de documentos»")
        return 2

    archivos = [
        p.relative_to(RAIZ).as_posix()
        for p in DOCS.rglob("*")
        if p.is_file() and not p.name.startswith(".")
    ]

    sin_registrar, usados = [], set()
    for a in archivos:
        cubierto = [p for p in patrones if fnmatch.fnmatch(a, p)]
        if cubierto:
            usados.update(cubierto)
        else:
            sin_registrar.append(a)

    huerfanos = [p for p in patrones if p not in usados and not p.startswith("docs/backdocs")]

    if sin_registrar or huerfanos:
        print(f"docs-registro ✗ {len(sin_registrar)} sin registrar · {len(huerfanos)} patrón(es) sin archivo")
        for a in sin_registrar:
            print(f"  sin rol declarado   {a}")
            print("                      → agregarlo al «Registro de documentos» del plan")
        for p in huerfanos:
            print(f"  patrón sin archivo  {p}")
            print("                      → el registro apunta a algo que ya no está")
        return 1

    print(f"docs-registro ✓ {len(archivos)} documentos, {len(patrones)} patrones · todos con rol declarado")
    return 0


if __name__ == "__main__":
    sys.exit(main())
