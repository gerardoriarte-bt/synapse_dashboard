#!/usr/bin/env python3
"""Ningún gráfico del `.pen` cambia sin que alguien lo declare · 2026-09-28

    python3 tools/pen-graficos.py            ·  npm run pen-graficos
    python3 tools/pen-graficos.py --sellar   ·  vuelve a sellar tras revisarlo

── POR QUÉ EXISTE ───────────────────────────────────────────────────────────

`pen-pantallas` reconoce pantallas `A*`, `B*` y `C*`. **Los 43 gráficos de
«Synapse · Plots» no los miraba nadie**, y no era teórico: el 2026-09-28 la
sesión que dibuja movió el rótulo de `Plot/PRONÓSTICO` de (377, 46) a (300, 20)
y **tuvo que avisarlo a mano**, escribiéndolo en su commit con la nota «es un
gráfico cambiado y por eso se avisa: ningún chequeo mira los 43».

Un aviso que depende de que alguien se acuerde no es una garantía. Y el costo de
no verlo es concreto: un plot construido contra un dibujo viejo se ve bien.

── QUÉ VERIFICA, Y QUÉ NO ───────────────────────────────────────────────────

Tres cosas, y ninguna es «que el componente se parezca al dibujo» — eso no se
automatiza, igual que en `pen-pantallas`:

 1. **Ningún gráfico apareció** sin declararse.
 2. **Ninguno desapareció.**
 3. **Ninguno CAMBIÓ** · que es el caso que motivó esto.

La huella es del subárbol del frame: su geometría, sus colores, sus textos y sus
tamaños. **Se comparan los valores, no el JSON crudo**: reordenar claves o mover
el frame entero dentro del lienzo no debería pedir una revisión, y cambiar un
color o un rótulo sí.

── CÓMO SE ARREGLA UN ROJO ──────────────────────────────────────────────────

**Mirando el gráfico y volviendo a sellar**, que es el punto: `--sellar` es el
acto explícito que dice «lo vi y es lo que quiero». Mismo trato que
`contraste.py` le da a una desviación registrada — el chequeo no impide el
cambio, impide que pase sin que nadie lo note.
"""
from __future__ import annotations

import hashlib
import json
import os
import pathlib
import sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent
SELLO = RAIZ / "tools" / "pen-graficos.json"
PAGINA = "Synapse · Plots"


def pen() -> pathlib.Path | None:
    """El mismo orden que `token-drift` y `pen-pantallas`: la variable gana,
    después `design/`, y por último el repositorio hermano archivado."""
    v = os.environ.get("SYNAPSE_PEN")
    if v and pathlib.Path(v).exists():
        return pathlib.Path(v)
    for c in (
        RAIZ / "design" / "Synapse_v2.pen",
        RAIZ.parent / "synapse_v2" / "design" / "Synapse_v2.pen",
    ):
        if c.exists():
            return c
    return None


# Lo que se mira de cada nodo. **`x` e `y` NO están a propósito en el nodo
# raíz** —mover el gráfico dentro de la página no lo cambia— pero sí en los
# hijos, porque ahí la posición ES el dibujo: el defecto que motivó esto fue un
# rótulo movido.
CAMPOS = ("type", "name", "content", "fill", "stroke", "strokeWidth", "opacity",
          "width", "height", "x", "y", "fontSize", "fontFamily", "letterSpacing",
          "cornerRadius", "icon", "strokeDasharray")


def huella(nodo: dict, raiz: bool = False) -> str:
    def rec(n: dict, es_raiz: bool) -> list:
        saltar = {"x", "y"} if es_raiz else set()
        propio = [(k, n.get(k)) for k in CAMPOS if k not in saltar and n.get(k) is not None]
        return [propio, [rec(h, False) for h in (n.get("children") or [])]]

    crudo = json.dumps(rec(nodo, raiz), ensure_ascii=False, sort_keys=True)
    return hashlib.sha256(crudo.encode("utf-8")).hexdigest()[:16]


def graficos(ruta: pathlib.Path) -> dict[str, str]:
    d = json.loads(ruta.read_text(encoding="utf-8"))
    pagina = next((c for c in d.get("children", []) if c.get("name") == PAGINA), None)
    if pagina is None:
        return {}
    return {
        h["name"]: huella(h, raiz=True)
        for h in (pagina.get("children") or [])
        if h.get("type") == "frame" and h.get("name", "").startswith("Plot/")
    }


def main() -> int:
    ruta = pen()
    if ruta is None:
        print("pen-graficos ⊘ BLOQUEADO · no se encontró Synapse_v2.pen")
        return 2

    hoy = graficos(ruta)
    if not hoy:
        print(f"pen-graficos ⊘ BLOQUEADO · «{PAGINA}» no tiene gráficos `Plot/`")
        return 2

    if "--sellar" in sys.argv:
        SELLO.write_text(json.dumps(hoy, ensure_ascii=False, indent=2, sort_keys=True) + "\n")
        print(f"pen-graficos · sellados {len(hoy)} gráficos")
        return 0

    if not SELLO.exists():
        print("pen-graficos ⊘ BLOQUEADO · falta el sello · correr con --sellar")
        return 2

    sellado: dict[str, str] = json.loads(SELLO.read_text(encoding="utf-8"))
    nuevos = sorted(set(hoy) - set(sellado))
    idos = sorted(set(sellado) - set(hoy))
    cambiados = sorted(n for n in set(hoy) & set(sellado) if hoy[n] != sellado[n])

    for n in nuevos:
        print(f"  + {n}\n      gráfico NUEVO · declararlo y volver a sellar")
    for n in idos:
        print(f"  − {n}\n      gráfico BORRADO · si es a propósito, volver a sellar")
    for n in cambiados:
        print(f"  ~ {n}\n      CAMBIÓ · mirarlo antes de sellar · un plot construido")
        print("      contra el dibujo viejo se ve bien")

    total = len(nuevos) + len(idos) + len(cambiados)
    if total:
        print(f"\npen-graficos ✗ {total} gráfico(s) sin declarar · `--sellar` después de mirarlos")
        return 1

    print(f"pen-graficos ✓ {len(hoy)} gráficos · ninguno cambió sin declararse")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
