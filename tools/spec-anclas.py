#!/usr/bin/env python3
"""spec-anclas · ata cada regla numérica de `design.md` al código y a su prueba · F0.11

**Por qué existe.** El 2026-08-20 se encontró que el colapso responsive no
implementaba §3.1 en tres formas distintas, y ninguna de las 184 pruebas lo veía.
La razón se repite: las pruebas se escribieron mirando el CÓDIGO, así que fijaban
lo que el código hacía en vez de lo que la spec pide. Una prueba escrita así pasa
siempre, incluso cuando el código está mal.

**Qué hace.** Cada ancla es una regla de `design.md` con su cita TEXTUAL, y
verifica tres cosas:

  1. **La cita sigue estando, palabra por palabra, en `design.md`.** Si alguien
     reescribe la regla, esto falla y obliga a releer lo que la implementa — que
     es el caso «la spec cambió y el código no», el que nadie nota.

  2. **El archivo que la implementa lleva el marcador `§ANCLA:<id>`**, así que
     desde el código se llega a la regla y al revés.

  3. **Existe una aserción**, y de las dos clases: una prueba en `tests/` que
     lleve el mismo marcador, o —para lo que no se puede ejecutar, como el valor
     de un token— un patrón estático sobre el archivo.

**Qué NO hace.** No verifica comportamiento: eso lo hacen las pruebas, donde cada
aserción se escribe leyendo la cita y no la implementación. Este chequeo es lo
que mantiene esas dos mitades atadas.

**Anclas pendientes.** Una regla citada que todavía nadie implementa se declara
igual, con la tarea que la va a cerrar. Se verifica su cita —que es lo que se
puede verificar hoy— y cuenta como BLOQUEADA, nunca como conforme. Omitirla sería
la única forma de perderla: una regla que no está escrita en ningún lado no la
reclama nadie.

Códigos: 0 conforme · 1 violación · 2 BLOQUEADO (falta `design.md`, o hay anclas
pendientes).
"""
import os
import pathlib
import re
import sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent

# `design.md` es normativo y vive en el repositorio archivado, que sigue siendo
# la fuente de las reglas de producto. Se reapunta sin editar el script.
SPEC = pathlib.Path(
    os.environ.get("SYNAPSE_DESIGN", RAIZ.parent / "synapse_v2" / "design" / "design.md")
).expanduser()

# ── Las anclas ───────────────────────────────────────────────────────────────
# `cita` se compara con los espacios normalizados, porque `design.md` envuelve a
# 96 columnas y un salto de línea no cambia lo que la regla dice.
ANCLAS = [
    dict(
        id="GRILLA-1",
        seccion="§4",
        cita="**12 columnas. Gap 16px. Fila base 80px.**",
        implementa=["src/render/grid.ts"],
    ),
    dict(
        id="GRILLA-2",
        seccion="§4",
        cita="alto = rowSpan × 80 + (rowSpan − 1) × 16",
        implementa=["src/render/grid.ts"],
    ),
    dict(
        id="RESP-1",
        seccion="§4",
        cita="por debajo de 1280px el grid colapsa a 6 columnas",
        implementa=["src/render/grid.ts"],
    ),
    dict(
        id="RESP-2",
        seccion="§4",
        cita="los spans se dividen a la mitad, redondeando hacia arriba",
        # `panelStyle` RECORTA con `Math.min(colSpan, columns)`, que no es lo
        # mismo: a seis columnas, un colSpan 4 debería quedar en 2 y queda en 4.
        # Coinciden solo cuando el span excede las columnas. F1.30 lo resuelve.
        pendiente="F1.30 · colapso responsive",
    ),
    dict(
        id="RESP-3",
        seccion="§4",
        cita="por debajo de 768px a 1 columna, orden de lectura según `colStart` + `orden`",
        # `columnsFor(767)` ya devuelve 1; el orden de lectura no lo ordena nadie.
        pendiente="F1.30 · colapso responsive",
    ),
    dict(
        id="COLOR-1",
        seccion="§2.2",
        cita="**Ámbar y amarillo: prohibidos.** Colisionan con el naranja de marca.",
        implementa=["tools/design-lint.py"],
        # La aserción ES el detector: L3 tiene que seguir buscando los cuatro.
        estatica=("tools/design-lint.py", r"amber\|yellow\|warn\|amarillo"),
    ),
    dict(
        id="COLOR-2",
        seccion="§2.1",
        cita="El naranja no es color de datos.",
        implementa=["tools/design-lint.py"],
        estatica=("tools/design-lint.py", r"fill\|stroke\|bg\|text\)-acc"),
    ),
    dict(
        id="RADIO-1",
        seccion="§2.1",
        cita="**Radio.** 10px en paneles, 2px en barras y bullets de datos. Sin excepciones.",
        implementa=["src/tokens/tokens.css"],
        estatica=(
            "src/tokens/tokens.css",
            r"--radius-xl:\s*10px;[\s\S]*|--radius-xs:\s*2px;[\s\S]*--radius-xl:\s*10px;",
        ),
    ),
    dict(
        id="TIPO-1",
        seccion="§2.3",
        cita="**siempre mayúsculas**, 10px, letter-spacing 0.12em",
        # El primitivo `Label` es lo que hace verificable «ningún número
        # desnudo»: sin él la regla es aspiracional. Cerrada por F1.13c.
        implementa=["src/render/primitives/Label.tsx"],
    ),
]

PRUEBAS = RAIZ / "tests"


def normalizar(s):
    return re.sub(r"\s+", " ", s).strip()


def texto_de_las_pruebas():
    if not PRUEBAS.exists():
        return ""
    return "".join(
        p.read_text(encoding="utf-8") for p in sorted(PRUEBAS.rglob("*.test.ts*"))
    )


def main():
    if not SPEC.exists():
        print("spec-anclas ⊘ BLOQUEADO · no hay `design.md` contra qué comparar")
        print(f"  buscado en: {SPEC}")
        print("  Vive en el repositorio archivado gerardoriarte-bt/Synapse-v2.")
        print("  Reapuntar con SYNAPSE_DESIGN=/ruta/al/design.md")
        return 2

    spec = normalizar(SPEC.read_text(encoding="utf-8"))
    pruebas = texto_de_las_pruebas()

    faltan_cita, faltan_marcador, faltan_prueba, faltan_estatica = [], [], [], []
    pendientes = []

    for a in ANCLAS:
        # La cita se verifica SIEMPRE, también en las pendientes: es lo único
        # que se puede verificar de una regla que todavía nadie implementó, y
        # es justo lo que detecta que la spec cambió mientras tanto.
        if normalizar(a["cita"]) not in spec:
            faltan_cita.append(a)
            continue

        if a.get("pendiente"):
            pendientes.append(a)
            continue

        for archivo in a["implementa"]:
            ruta = RAIZ / archivo
            if not ruta.exists() or f"§ANCLA:{a['id']}" not in ruta.read_text(encoding="utf-8"):
                faltan_marcador.append((a, archivo))

        if a.get("estatica") is not None:
            archivo, patron = a["estatica"]
            ruta = RAIZ / archivo
            if not ruta.exists() or re.search(patron, ruta.read_text(encoding="utf-8")) is None:
                faltan_estatica.append((a, archivo))
        elif f"§ANCLA:{a['id']}" not in pruebas:
            faltan_prueba.append(a)

    for a in faltan_cita:
        print(f"spec-anclas ✗ {a['id']} · la cita de {a['seccion']} ya no está en design.md")
        print(f"              «{a['cita']}»")
        print("              la regla cambió: hay que releer lo que la implementa")
    for a, archivo in faltan_marcador:
        print(f"spec-anclas ✗ {a['id']} · {archivo} no lleva el marcador §ANCLA:{a['id']}")
    for a in faltan_prueba:
        print(f"spec-anclas ✗ {a['id']} · sin prueba en tests/ que lleve §ANCLA:{a['id']}")
        print(f"              «{a['cita']}»")
        print("              la aserción se escribe DESDE la cita, no leyendo el código")
    for a, archivo in faltan_estatica:
        print(f"spec-anclas ✗ {a['id']} · {archivo} no cumple lo que dice {a['seccion']}")
        print(f"              «{a['cita']}»")

    rotas = faltan_cita or faltan_marcador or faltan_prueba or faltan_estatica
    ancladas = len(ANCLAS) - len(pendientes) - len(faltan_cita)

    if rotas:
        print()
        print(f"spec-anclas ✗ {len(ANCLAS)} reglas · {ancladas} ancladas")
        return 1

    print(f"spec-anclas · {len(ANCLAS)} reglas de design.md")
    print(f"  ✓ {ancladas} ancladas · cita, código y aserción")
    if pendientes:
        print(f"  ⏸ {len(pendientes)} citadas y SIN implementar:")
        for a in pendientes:
            print(f"      {a['id']}  {a['seccion']} · la cierra {a['pendiente']}")
            print(f"              «{a['cita']}»")
        print()
        print("spec-anclas ⊘ BLOQUEADO · hay reglas de design.md que nadie verifica todavía")
        return 2

    print(f"spec-anclas ✓ {len(ANCLAS)} reglas ancladas")
    return 0


if __name__ == "__main__":
    sys.exit(main())
