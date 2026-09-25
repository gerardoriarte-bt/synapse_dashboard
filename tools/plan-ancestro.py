#!/usr/bin/env python3
"""plan-ancestro · los identificadores del plan == los de `tareas-front-back.md`

    python3 tools/plan-ancestro.py     ·     npm run plan:ancestro

── POR QUÉ EXISTE ───────────────────────────────────────────────────────────

`tareas-front-back.md` es el ANCESTRO COMÚN de los dos planes. El front lo tiene
acá y el backend en la raíz de `synapse-api-go`, **byte a byte iguales** —mismo
md5, verificado el 2026-09-14—. `plan-de-trabajo.md` declara desde su primera
línea que «se conservan sus identificadores `B*` / `F*` para no perder el hilo».

Esa promesa no la verificaba nadie, y el 2026-09-14 apareció por qué importa: el
documento del backend RENUMERÓ desde `B1.4` en adelante y comprimió 19 tareas de
Fase 1 en 14. Con los códigos ya cargados en la plataforma de seguimiento, «B1.13»
pasó a significar dos cosas distintas según quién lo leyera — «presentación
opcional» de un lado y «sincronizar catálogo» del otro.

**Un identificador que significa dos cosas es peor que dos identificadores**: el
ticket se lee, se entiende al revés y nadie se entera hasta que alguien entrega
otra cosa.

── QUÉ VERIFICA ─────────────────────────────────────────────────────────────

Que todo ID del ancestro siga existiendo acá, de una de dos formas:

  · con TAREA PROPIA — un encabezado `### B1.13 ⬜ …`
  · ABSORBIDO — sin encabezado, pero nombrado en el texto de la tarea que se lo
    comió. `F1.17` y `F1.22` viven adentro de `F1.13h`, y está escrito en su
    título. Eso es legítimo: el traslado de `render/` se partió distinto.

Lo que NO se acepta es que un ID del ancestro **desaparezca sin dejar dicho
dónde fue**. Ahí es donde una tarea se pierde en silencio.

Los `➕` nuestros —los que el ancestro no tiene— se cuentan y se informan, no se
marcan: agregar tareas es normal, reasignar identificadores no.

Códigos: 0 conforme · 1 hay IDs perdidos · 2 BLOQUEADO (falta el ancestro).
"""
import pathlib
import re
import sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent
ANCESTRO = RAIZ / "tareas-front-back.md"
PLAN = RAIZ / "plan-de-trabajo.md"

# `- [ ] **B1.13** Incluir `Presentacion` opcional: …`
EN_ANCESTRO = re.compile(r"^- \[[ x]\] \*\*([BF]\d+\.\d+)\*\*")
# `### ➕ B1.13 ⬜ Presentacion opcional`  ·  también `####` y sufijo `a`–`j`
ENCABEZADO = re.compile(r"^#{3,4} (?:➕ )?([BF]\d+\.\d+[a-j]?) (?:✅|⚠️|⬜|🕓) ")


def main() -> int:
    if not ANCESTRO.exists():
        print(f"plan-ancestro ⊘ BLOQUEADO · falta {ANCESTRO.name}")
        return 2
    if not PLAN.exists():
        print(f"plan-ancestro ⊘ BLOQUEADO · falta {PLAN.name}")
        return 2

    texto_ancestro = ANCESTRO.read_text(encoding="utf-8")
    texto_plan = PLAN.read_text(encoding="utf-8")

    del_ancestro = [m.group(1) for l in texto_ancestro.split("\n") if (m := EN_ANCESTRO.match(l))]
    con_tarea = {m.group(1) for l in texto_plan.split("\n") if (m := ENCABEZADO.match(l))}

    # La raíz sin sufijo: `F1.13a` sostiene a `F1.13`.
    raices = {re.sub(r"[a-j]$", "", i) for i in con_tarea}

    propios, absorbidos, perdidos = [], [], []
    for ident in del_ancestro:
        if ident in con_tarea or ident in raices:
            propios.append(ident)
        # Nombrado en algún lado del plan: alguien escribió dónde fue a parar.
        elif re.search(rf"\b{re.escape(ident)}\b", texto_plan):
            absorbidos.append(ident)
        else:
            perdidos.append(ident)

    nuevos = len(con_tarea) - len(propios)

    if perdidos:
        print(f"plan-ancestro ✗ {len(perdidos)} identificador(es) del ancestro sin rastro")
        print("  Una tarea del ancestro que no está acá y que nadie nombra se perdió")
        print("  en silencio. O se le hace encabezado, o se dice qué tarea la absorbió.")
        print()
        for ident in perdidos:
            linea = next(
                (l for l in texto_ancestro.split("\n") if EN_ANCESTRO.match(l) and ident in l), ""
            )
            titulo = re.sub(r".*?\*\*.*?\*\* ", "", linea)[:70]
            print(f"  {ident:8} {titulo}")
        return 1

    # ── Y NINGUNO SE USA DOS VECES · agregado el 2026-09-25 ─────────────────
    #
    # **Este chequeo miraba hacia afuera y no hacia adentro.** Comparaba los
    # identificadores del plan contra el ancestro y no se enteraba de que el
    # plan usara uno dos veces. El 2026-09-25 se abrió una tarea como `B4.16`
    # y ese identificador **ya existía** —«Declarar el gráfico en el layout»—:
    # dos tareas distintas con el mismo nombre, y ninguna herramienta lo vio.
    #
    # Lo agarró un `sort | uniq -d` a mano, que es como se agarra una vez.
    #
    # **Una tarea se reconoce por su marcador de estado**, que es lo que la
    # separa de un título de sección: `### B4.8 y B4.9 escritas el…` nombra dos
    # identificadores y no es una tarea de ninguno.
    import collections

    # **Sobre la LISTA de encabezados, no sobre `con_tarea`**, que es un `set` y
    # colapsa justo lo que hay que detectar. La primera versión de este chequeo
    # miraba el set y **no cazó la mutación de prueba** — es la misma clase de
    # error que busca: dos cosas que parecen la misma.
    del_plan = [m.group(1) for l in texto_plan.split("\n") if (m := ENCABEZADO.match(l))]
    repetidos = [i for i, n in collections.Counter(del_plan).items() if n > 1]
    if repetidos:
        print(f"plan-ancestro ✗ {len(repetidos)} identificador(es) usados por DOS tareas")
        for ident in sorted(repetidos):
            print(f"  {ident} · dos tareas distintas lo declaran")
        print("  Un identificador es una dirección: dos tareas con la misma se")
        print("  pisan en el CSV, en la página y en todo lo que cite una de ellas.")
        return 1

    print(
        f"plan-ancestro ✓ {len(del_ancestro)} identificadores del ancestro conservados"
        f" · {len(propios)} con tarea propia, {len(absorbidos)} absorbidos"
        f" · {nuevos} agregados por el plan · sin repetidos"
    )
    if absorbidos:
        print(f"  absorbidos: {', '.join(absorbidos)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
