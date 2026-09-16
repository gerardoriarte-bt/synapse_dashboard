#!/usr/bin/env python3
"""plan-de-trabajo.md → docs/ESTADO.md · el estado del proyecto, para informar

**El documento que se consulta y se reenvía.** Sale del plan y se pisa entero en
cada `npm run plan`: no hay una segunda versión que mantener al día.

── POR QUÉ NO ALCANZABA CON LO QUE HABÍA ────────────────────────────────────

`plan-tareas.csv` tiene las 193 tareas pero no se lee: es para importar.
`tools/plan-synapse.html` se navega pero no se versiona ni se pega en un
mensaje. `CLAUDE.md` cuenta dónde retomar, que es otra pregunta — es para quien
va a escribir código, no para quien informa avances.

Lo que faltaba es **cuánto hay hecho, qué está bloqueado y qué se puede tomar
ahora**, en algo que se lee de arriba abajo y se manda por chat.

── DE DÓNDE SALE CADA NÚMERO ────────────────────────────────────────────────

De los encabezados del plan y de nada más. Una tarea `⬜` con `🔒` o con un
marcador `**Espera del backend.**` está bloqueada; una `⬜` sin ninguno de los
dos es tomable hoy. **Eso es todo el criterio**, y por eso el número no puede
discrepar del plan: no hay dónde ponerle otra cosa.

Códigos: 0 siempre que el plan exista · 2 BLOQUEADO si falta.
"""
import pathlib
import re
import sys
from collections import Counter, defaultdict

RAIZ = pathlib.Path(__file__).resolve().parent.parent
PLAN = RAIZ / "plan-de-trabajo.md"
DESTINO = RAIZ / "docs" / "ESTADO.md"

ENCABEZADO = re.compile(r"^#{3,4} (➕ )?([BF]\d+\.\d+[a-j]?) (✅|⚠️|⬜|🕓) (.+)$")
ESPERA = re.compile(r"^\*\*Espera del backend\.\*\*")
ESTADOS = {"✅": "hecho", "⚠️": "parcial", "⬜": "pendiente", "🕓": "diferida"}

FASES = {
    "back": {0: "Fundamentos", 1: "API de consola", 2: "Materialización",
             3: "Chat contextual", 4: "Admin y Builder", 5: "Multi-dashboard y pulido"},
    "front": {0: "Fundamentos", 1: "Consola y render/", 2: "Estados",
              3: "Chat contextual", 4: "Admin y Builder", 5: "Pruebas y pulido"},
}


def leer():
    texto = PLAN.read_text(encoding="utf-8")
    tareas, actual = [], None
    for linea in texto.split("\n"):
        m = ENCABEZADO.match(linea)
        if m:
            tid = m.group(2)
            titulo = m.group(4)
            actual = {
                "id": tid,
                "lado": "back" if tid[0] == "B" else "front",
                "fase": int(re.match(r"[BF](\d+)", tid).group(1)),
                "estado": ESTADOS[m.group(3)],
                "titulo": re.sub(r"`|\*\*", "", titulo).split(" · 🔒")[0].strip(),
                "bloqueada": "🔒" in titulo,
            }
            tareas.append(actual)
            continue
        if ESPERA.match(linea) and actual is not None:
            actual["bloqueada"] = True
    return tareas


def barra(hechas: int, total: int, ancho: int = 22) -> str:
    if total == 0:
        return " " * ancho
    lleno = round(ancho * hechas / total)
    return "█" * lleno + "·" * (ancho - lleno)


def render(tareas) -> str:
    o = ["# Estado del proyecto\n"]
    o.append(
        "> **GENERADO** desde `plan-de-trabajo.md` con `npm run plan`. Se pisa entero\n"
        "> en cada corrida: si un número de acá no cuadra con el plan, el que está mal\n"
        "> es este archivo y se arregla regenerándolo, no editándolo.\n"
    )

    tot = Counter(t["estado"] for t in tareas)
    n = len(tareas)
    cerradas = tot["hecho"]
    o.append(
        f"\n**{cerradas} de {n} tareas cerradas.** "
        f"{tot['parcial']} parciales · {tot['pendiente']} pendientes · "
        f"{tot['diferida']} diferidas.\n"
    )

    for lado, etiqueta in (("front", "Front"), ("back", "Backend")):
        suyas = [t for t in tareas if t["lado"] == lado]
        h = sum(1 for t in suyas if t["estado"] == "hecho")
        o.append(f"\n## {etiqueta} · {h} de {len(suyas)}\n")
        if lado == "back":
            o.append(
                "> ⚠️ **Este número está bajo y no refleja al backend.** El plan de acá\n"
                "> es la fuente del FRONT; el estado de las tareas `B*` solo se mueve\n"
                "> cuando el front lo verifica contra el servicio, y eso se hizo por\n"
                "> primera vez el 2026-09-14 y solo para las de Fase 1.\n"
                ">\n"
                "> El backend lleva su propio avance en\n"
                "> `docs/dynamic-dashboard-backend.md` de su repositorio, donde hay\n"
                "> mucho más marcado como hecho. **Para informar avance del backend hay\n"
                "> que mirar ahí, no acá** — y para cruzarlo, la tabla de equivalencias\n"
                "> de `docs/ESTADO-B1.13-B1.19-2026-09-14.md`, porque los\n"
                "> identificadores no coinciden.\n"
            )
        o.append("| Fase | Avance | Hechas | Parciales | Pendientes |")
        o.append("|---|---|---|---|---|")
        por_fase = defaultdict(list)
        for t in suyas:
            por_fase[t["fase"]].append(t)
        for fase in sorted(por_fase):
            f = por_fase[fase]
            c = Counter(x["estado"] for x in f)
            nombre = FASES[lado].get(fase, f"Fase {fase}")
            o.append(
                f"| {fase} · {nombre} | `{barra(c['hecho'], len(f))}` "
                f"| {c['hecho']}/{len(f)} | {c['parcial']} | {c['pendiente']} |"
            )

    # ── Lo tomable hoy ───────────────────────────────────────────────────────
    libres = [t for t in tareas if t["estado"] in ("pendiente", "parcial")
              and not t["bloqueada"] and t["lado"] == "front"]
    o.append(f"\n---\n\n## Se puede tomar hoy · {len(libres)} del front\n")
    if not libres:
        o.append("Nada del front está libre: todo lo pendiente espera algo.\n")
    for t in sorted(libres, key=lambda x: (x["fase"], x["id"])):
        o.append(f"- **{t['id']}** · {t['titulo']}")

    # ── Lo bloqueado ─────────────────────────────────────────────────────────
    trabadas = [t for t in tareas if t["bloqueada"] and t["estado"] != "hecho"]
    o.append(f"\n---\n\n## Bloqueadas · {len(trabadas)}\n")
    o.append(
        "Lo que el front espera del backend está detallado en\n"
        "[`PARA-BACKEND.md`](PARA-BACKEND.md), que también se genera desde el plan.\n"
    )
    for lado, etiqueta in (("front", "Front"), ("back", "Backend")):
        suyas = [t for t in trabadas if t["lado"] == lado]
        if not suyas:
            continue
        o.append(f"\n**{etiqueta}**\n")
        for t in sorted(suyas, key=lambda x: (x["fase"], x["id"])):
            o.append(f"- **{t['id']}** · {t['titulo']}")

    o.append(
        "\n---\n\n## Qué consultar para qué\n\n"
        "| Pregunta | Dónde |\n|---|---|\n"
        "| ¿Cómo va el proyecto? | **este archivo** |\n"
        "| ¿Qué le falta al backend? | `docs/PARA-BACKEND.md` |\n"
        "| ¿Qué hace exactamente una tarea? | `plan-de-trabajo.md` · la fuente |\n"
        "| ¿Qué sigue en el código? | `CLAUDE.md` · «Dónde retomar» |\n"
        "| ¿Qué hay que hacer en Snowflake? | `docs/snowflake/INSTRUCCION-ALTA-TENANT.md` |\n"
    )
    return "\n".join(o) + "\n"


def main() -> int:
    if not PLAN.exists():
        print(f"estado ⊘ BLOQUEADO · falta {PLAN.name}")
        return 2
    tareas = leer()
    DESTINO.write_text(render(tareas), encoding="utf-8")
    hechas = sum(1 for t in tareas if t["estado"] == "hecho")
    libres = sum(1 for t in tareas if t["estado"] in ("pendiente", "parcial")
                 and not t["bloqueada"] and t["lado"] == "front")
    print(f"estado ✓ {hechas}/{len(tareas)} cerradas · {libres} del front tomables hoy")
    print(f"  → {DESTINO.relative_to(RAIZ)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
