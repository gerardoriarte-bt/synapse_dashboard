#!/usr/bin/env python3
"""Cada pantalla dibujada en el `.pen` tiene quien la declare.

    python3 tools/pen-pantallas.py     ·     npm run pen-pantallas

── POR QUÉ EXISTE ───────────────────────────────────────────────────────────

**Porque la regla escrita ya falló dos veces, con la corrección puesta.**

Hasta el 2026-09-15 `CLAUDE.md` describía el `.pen` como «los tokens, la fuente
de `tokens.css`», y con esa lectura se construyeron diez pantallas de admin y
builder sin abrirlo. Se corrigió la línea, se escribió una auditoría y se cerró
el inventario.

El 2026-09-21 volvió a pasar: `C3 · Chat expandido`, `C3 · Chat · historial
colapsado` y `A2 · Ficha de cliente` estaban dibujadas, se construyeron tres
pantallas encima y no se abrió ninguna. **La advertencia estaba escrita y no
alcanzó** — así que la regla deja de ser una promesa y pasa a ser un chequeo.

Es el mismo razonamiento que `docs-registro`: no verifica que el documento sea
bueno, verifica que exista alguien que lo declare. Acá no se verifica que la
pantalla se parezca al dibujo —eso lo hace un humano mirando— sino que **nadie
pueda construir sin haber mirado**, porque para pasar la puerta hay que escribir
qué archivo la implementa o por qué todavía no.

── QUÉ VERIFICA ─────────────────────────────────────────────────────────────

1. Toda pantalla `A*`, `B*` o `C*` del `.pen` aparece en el registro del plan.
2. Toda fila del registro que nombra archivos: los archivos existen.
3. Y cada uno lleva el ancla `§PEN:<id>` con el id de esa pantalla, que es lo
   que obliga a abrir el dibujo: el ancla se escribe mirándolo.
4. El registro no nombra pantallas que el `.pen` no dibuja — una fila que sobra
   es una que quedó después de que el diseño la borrara.

── LO QUE NO HACE ───────────────────────────────────────────────────────────

**No compara el dibujo con la pantalla.** Eso no se automatiza: el 2026-09-21 la
auditoría encontró que la hoja del chat mide 480 donde el `.pen` dibuja 940, y
ninguna máquina iba a decir eso. Lo que este chequeo garantiza es que la
comparación **se haya hecho**, y que su resultado esté escrito.
"""

from __future__ import annotations

import os
import pathlib
import re
import sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent
PLAN = RAIZ / "plan-de-trabajo.md"
ENCABEZADO = "### Registro de pantallas del `.pen`"

# `Consola · C3 · Chat expandido` y `A2 · Ficha de cliente` son los dos formatos
# que el `.pen` usa para nombrar una pantalla.
PANTALLA = re.compile(r"^(?:Consola · )?([ABC]\d)\b")


def pen() -> pathlib.Path | None:
    """El mismo orden que `token-drift`: la variable gana, después `design/`, y
    al final el repositorio hermano archivado — para que un checkout viejo no
    se rompa."""
    env = os.environ.get("SYNAPSE_PEN")
    if env:
        p = pathlib.Path(env)
        return p if p.is_file() else None
    aca = RAIZ / "design" / "Synapse_v2.pen"
    if aca.is_file():
        return aca
    hermano = RAIZ.parent / "synapse_v2" / "design" / "Synapse_v2.pen"
    return hermano if hermano.is_file() else None


def pantallas_del_pen(ruta: pathlib.Path) -> list[str]:
    import json

    d = json.loads(ruta.read_text(encoding="utf-8"))
    return [
        c["name"]
        for c in d.get("children", [])
        if c.get("type") == "frame" and PANTALLA.match(c.get("name", ""))
    ]


def registro_del_plan(texto: str) -> dict[str, str]:
    """Las filas `| `nombre` | quién |` que siguen al encabezado."""
    i = texto.find(ENCABEZADO)
    if i < 0:
        return {}
    # **Corta en el próximo encabezado de CUALQUIER nivel**, y no solo en `##`.
    # El registro de documentos viene justo después y es `###`: con el corte a
    # `##` este bloque se comía sus quince filas y las reportaba como pantallas
    # que el `.pen` no dibuja.
    cortes = [c for c in (texto.find("\n## ", i + 1), texto.find("\n### ", i + 1)) if c > 0]
    bloque = texto[i : min(cortes) if cortes else len(texto)]
    filas = re.findall(r"^\| `([^`]+)` \| (.+?) \|\s*$", bloque, re.M)
    return {nombre: quien.strip() for nombre, quien in filas}


def main() -> int:
    ruta = pen()
    if ruta is None:
        print("pen-pantallas ⊘ BLOQUEADO · no se encontró Synapse_v2.pen")
        print("  se busca en SYNAPSE_PEN, design/ y el repositorio hermano")
        return 2
    if not PLAN.exists():
        print("pen-pantallas ⊘ BLOQUEADO · falta plan-de-trabajo.md")
        return 2

    dibujadas = pantallas_del_pen(ruta)
    registro = registro_del_plan(PLAN.read_text(encoding="utf-8"))
    if not registro:
        print(f"pen-pantallas ⊘ BLOQUEADO · falta «{ENCABEZADO}» en el plan")
        return 2

    fallas: list[str] = []

    for nombre in dibujadas:
        if nombre not in registro:
            fallas.append(
                f"«{nombre}» está dibujada y no está en el registro.\n"
                f"       Abrí el dibujo, comparalo con lo construido y declarala."
            )

    for nombre in registro:
        if nombre not in dibujadas:
            fallas.append(f"«{nombre}» está en el registro y el `.pen` no la dibuja.")

    # Las filas que nombran archivos: tienen que existir y llevar el ancla.
    for nombre, quien in registro.items():
        if nombre not in dibujadas:
            continue
        m = PANTALLA.match(nombre)
        ident = m.group(1) if m else ""
        for archivo in re.findall(r"`(src/[^`]+\.tsx?)`", quien):
            f = RAIZ / archivo
            if not f.is_file():
                fallas.append(f"«{nombre}» nombra `{archivo}`, que no existe.")
                continue
            if f"§PEN:{ident}" not in f.read_text(encoding="utf-8"):
                fallas.append(
                    f"`{archivo}` implementa «{nombre}» y no lleva el ancla "
                    f"`§PEN:{ident}`.\n"
                    f"       El ancla se escribe mirando el dibujo. Ese es el punto."
                )

    if fallas:
        print(f"pen-pantallas ✗ {len(fallas)} pantalla(s) sin declarar\n")
        for f in fallas:
            print(f"  ✗ {f}")
        print(f"\n  El registro vive en {PLAN.name}, bajo «{ENCABEZADO[4:]}».")
        return 1

    conArchivo = sum(1 for q in registro.values() if "`src/" in q)
    print(
        f"pen-pantallas ✓ {len(dibujadas)} pantallas dibujadas · "
        f"{conArchivo} con archivo y ancla · {len(dibujadas) - conArchivo} declaradas sin construir"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
