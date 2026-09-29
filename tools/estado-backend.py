#!/usr/bin/env python3
"""plan-de-trabajo.md → docs/ESTADO-BACKEND.md · qué sabemos del backend, y cuándo

**Contesta una pregunta que ningún otro archivo contesta: contra qué commit suyo
está verificada cada tarea `B*`, y si ese commit sigue siendo el último.**

── POR QUÉ HACÍA FALTA ──────────────────────────────────────────────────────

`docs/ESTADO.md` da el avance y avisa, con razón, que el número del backend «está
bajo y no refleja al backend»: sólo se mueve cuando el front lo verifica contra el
servicio corriendo. Pero para **re-verificar** hace falta saber contra qué se
verificó cada una, y eso vivía dentro de 99 bloques de prosa.

`backend-drift` sí lo hace, pero **por RUTA del cable**, no por tarea. Son dos
preguntas distintas: una es «¿el cable describe el servicio?» y la otra «¿lo que
damos por hecho sigue siendo cierto?».

**El 2026-09-29 la segunda costó cinco pedidos falsos.** Este archivo existe para
que la próxima vez se vea de un vistazo.

── DE DÓNDE SALE CADA DATO ──────────────────────────────────────────────────

Del encabezado de cada tarea y del primer commit que su bloque cite, en una línea
de «Verificado…» o en una marca «Medido contra `sha`». **No interpreta nada**: si
una tarea no cita commit, dice que no lo cita.

La referencia —cuál es «el último»— sale del cable de consola, igual que en
`para-backend`: es donde `backend-drift` deja escrita su conclusión, y leerla
evita que esta herramienta necesite red.

Códigos: 0 siempre que el plan exista · 2 BLOQUEADO si falta.
"""
import pathlib
import re
import sys
from collections import Counter

RAIZ = pathlib.Path(__file__).resolve().parent.parent
PLAN = RAIZ / "plan-de-trabajo.md"
CABLE = RAIZ / "contracts" / "synapse-console-wire.yaml"
DESTINO = RAIZ / "docs" / "ESTADO-BACKEND.md"

# **`➕` marca una tarea que agregamos nosotros**, que no viene del ancestro.
ENCABEZADO = re.compile(r"^#{3,4} (➕ )?(B\d+\.\d+) (\S+) (.*)$")
VERIFICADO = re.compile(r"[Vv]erificad[oa].{0,120}?`([0-9a-f]{7,8})`", re.S)
MEDIDO = re.compile(r"\*\*Medido contra `([0-9a-f]{7,8})` el (\d{4}-\d{2}-\d{2})\*\*")
FECHA = re.compile(r"[Vv]erificad[oa] el (\d{4}-\d{2}-\d{2})")
# Fecha y commit del MISMO renglón de verificación · se cruzan para ordenar.
FECHA_COMMIT = re.compile(
    r"[Vv]erificad[oa] el (\d{4}-\d{2}-\d{2})[^\n]{0,140}?`([0-9a-f]{7,8})`")

FASES = {
    "0": "Fundamentos",
    "1": "Catálogo y materialización",
    "2": "Estados y cache",
    "3": "Chat",
    "4": "Admin y builder",
    "5": "Multi-dashboard",
    "6": "Cierre",
}


def referencia() -> "str | None":
    """El último commit suyo que leímos · `None` si el cable no está de acuerdo.

    Mismo criterio que `para-backend`: sólo el cable de consola y sólo si sus
    rutas coinciden. Si no coinciden, `backend-drift` está en rojo y **no hay
    contra qué comparar** — se dice, en vez de elegir la más común.
    """
    if not CABLE.exists():
        return None
    vistos = set(re.findall(r"x-verificado-en:\s*([0-9a-f]{7,40})",
                            CABLE.read_text(encoding="utf-8")))
    return vistos.pop() if len(vistos) == 1 else None


def leer():
    texto = PLAN.read_text(encoding="utf-8")
    tareas, actual = [], None
    for linea in texto.split("\n"):
        m = ENCABEZADO.match(linea)
        if m:
            actual = {
                "nuestra": bool(m.group(1)),
                "id": m.group(2),
                "estado": m.group(3),
                # El título se corta en el `·`, que es donde empieza el candado
                # o el matiz — acá interesa qué es la tarea, no su detalle.
                "titulo": re.sub(r"`|\*\*", "", m.group(4)).split(" · ")[0].strip(),
                "cuerpo": [],
                "espera": False,
            }
            tareas.append(actual)
        elif actual is not None:
            actual["cuerpo"].append(linea)
            if linea.startswith("**Espera del backend.**"):
                actual["espera"] = True
    for t in tareas:
        cuerpo = "\n".join(t["cuerpo"])
        # **El MÁS RECIENTE, no el primero.** Una tarea acumula verificaciones —
        # B4.2 tiene tres— y la primera que aparece suele ser la más vieja,
        # porque las nuevas se escriben arriba o abajo sin orden fijo. Tomar la
        # primera hacía que una tarea remedida hoy figurara contra un commit de
        # hace dos semanas, que es justo lo contrario de lo que este archivo
        # existe para mostrar.
        pares = [(f, c) for f, c in FECHA_COMMIT.findall(cuerpo)]
        pares += [(f, c) for c, f in MEDIDO.findall(cuerpo)]
        if pares:
            fecha, commit = max(pares)
            t["commit"], t["fecha"] = commit, fecha
        else:
            ver = VERIFICADO.search(cuerpo)
            t["commit"] = ver.group(1) if ver else None
            t["fecha"] = None
        del t["cuerpo"]
    # Los encabezados de sección que empiezan con `B4.8 y B4.9 …` no son tareas:
    # su «estado» no es ninguno de los cinco símbolos. Se descartan acá y no en
    # el patrón, que si se aprieta más deja de leer tareas reales.
    return [t for t in tareas if t["estado"] in ("✅", "⚠️", "⬜", "🕓", "➖")]


def render(tareas, ref) -> str:
    o = []
    o.append("# Estado del backend · qué sabemos y contra qué\n")
    o.append(
        "> **GENERADO** desde `plan-de-trabajo.md` con `npm run plan`. Se pisa\n"
        "> entero en cada corrida.\n"
    )
    o.append(
        "\n**Este archivo NO dice cuánto hizo el backend.** Dice **qué verificamos\n"
        "nosotros y contra qué commit suyo**, que es otra cosa — y es la que hace\n"
        "falta para re-verificar. Para su avance real está\n"
        "`docs/dynamic-dashboard-backend.md` en su repositorio.\n"
    )

    hechas = [t for t in tareas if t["estado"] == "✅"]
    parcial = [t for t in tareas if t["estado"] == "⚠️"]
    con_commit = [t for t in hechas + parcial if t["commit"]]
    al_dia = [t for t in con_commit if ref and t["commit"] == ref]

    # **La tercera fila es la que faltaba.** Un `⬜` de backend NO quiere decir
    # «no está hecho»: quiere decir «no lo verificamos». Y son dos cosas muy
    # distintas — su propio plan da 65 de 69 hechas, así que la mayoría de
    # nuestros `⬜` son deuda NUESTRA de verificación, no trabajo suyo pendiente.
    esperando = [t for t in tareas if t["estado"] == "⬜" and t["espera"]]
    sin_mirar = [t for t in tareas if t["estado"] == "⬜" and not t["espera"]]

    o.append("\n## En una línea\n")
    o.append("| | |\n|---|---|")
    o.append(f"| Tareas `B*` en el plan | **{len(tareas)}** |")
    o.append(f"| Verificadas por nosotros · ✅ o ⚠️ | **{len(hechas) + len(parcial)}** |")
    o.append(f"| De ésas, **contra el último commit** | **{len(al_dia)}** |")
    o.append(f"| ⬜ Esperando algo de ellos | **{len(esperando)}** |")
    o.append(f"| ⬜ **Que NUNCA verificamos** | **{len(sin_mirar)}** |")
    if ref:
        o.append(f"| El último commit que leímos | `{ref}` |")
    else:
        o.append("| El último commit que leímos | **no se sabe** · el cable no coincide consigo mismo |")
    o.append("")

    if ref:
        viejas = [t for t in con_commit if t["commit"] != ref]
        if viejas:
            o.append(
                f"\n## ⚠️ {len(viejas)} verificadas contra un commit anterior\n\n"
                "**No quiere decir que estén mal: quiere decir que no lo sabemos.**\n"
                "Una tarea `B*` afirma algo del servicio, y el servicio cambia.\n"
                "Re-verificar una es leer su criterio y medirlo de nuevo.\n"
            )
            o.append("\n| Tarea | | Verificada contra | Cuándo |\n|---|---|---|---|")
            for t in sorted(viejas, key=lambda x: (x["id"][1], int(x["id"].split(".")[1]))):
                o.append(f"| **{t['id']}** · {t['titulo']} | {t['estado']} "
                         f"| `{t['commit']}` | {t['fecha'] or '—'} |")
            o.append("")

    if sin_mirar:
        o.append(
            f"\n## ⬜ {len(sin_mirar)} que nunca verificamos · y NO quiere decir que falten\n\n"
            "**Un `⬜` de backend dice «no lo miramos», no «no está hecho».** Nuestro\n"
            "plan sólo mueve una `B*` cuando el front la verifica contra el servicio\n"
            "corriendo, así que este número es **deuda nuestra de verificación**.\n\n"
            "Para contrastar: su propio plan —`docs/dynamic-dashboard-backend.md`\n"
            "en su repositorio— declara **65 de 69 hechas**, con cuatro abiertas y\n"
            "tres de ellas de cache opcional. **Las listas no son la misma** y los\n"
            "identificadores no coinciden, así que los números no se restan; pero\n"
            "la distancia dice de qué lado está el trabajo pendiente.\n\n"
            "**El número que sí es nuestro y sí es un compromiso** son las que\n"
            f"esperan algo de ellos: **{len(esperando)}**, y salen en `PARA-BACKEND.md`.\n"
        )

    o.append("\n## Todas, por fase\n")
    for fase, nombre in FASES.items():
        de_fase = [t for t in tareas if t["id"][1] == fase]
        if not de_fase:
            continue
        n_ok = sum(1 for t in de_fase if t["estado"] == "✅")
        o.append(f"\n### Fase {fase} · {nombre} — {n_ok} de {len(de_fase)}\n")
        o.append("| | Tarea | Verificada contra | Cuándo |\n|---|---|---|---|")
        for t in sorted(de_fase, key=lambda x: int(x["id"].split(".")[1])):
            marca = t["commit"] or "—"
            if ref and t["commit"] and t["commit"] != ref:
                marca = f"`{t['commit']}` ⚠"
            elif t["commit"]:
                marca = f"`{t['commit']}`"
            propia = " ➕" if t["nuestra"] else ""
            o.append(f"| {t['estado']} | **{t['id']}**{propia} · {t['titulo']} "
                     f"| {marca} | {t['fecha'] or '—'} |")
        o.append("")

    o.append(
        "\n---\n\n## Cómo se lee\n\n"
        "- **`—` en una `⬜`** es correcto: no hay nada que verificar todavía.\n"
        "- **`—` en una `✅` o `⚠️`** sería un hueco, y hoy no hay ninguno. Dos\n"
        "  tareas cerradas no citan commit **y declaran por qué**: `B0.5` porque\n"
        "  produce un documento y no una ruta, `B1.18` porque cita el resultado\n"
        "  medido —`created=6 updated=4`— que es mejor evidencia que un hash.\n"
        "- **`➕`** marca una tarea que agregamos nosotros, no del ancestro.\n"
        "- **`⚠` junto al commit** dice que se verificó contra uno anterior al\n"
        "  último que leímos. No es un error: es lo que hay que re-mirar primero.\n"
    )
    return "\n".join(o) + "\n"


def main() -> int:
    if not PLAN.exists():
        print("estado-backend ⊘ BLOQUEADO · no está `plan-de-trabajo.md`")
        return 2
    tareas = leer()
    ref = referencia()
    DESTINO.write_text(render(tareas, ref), encoding="utf-8")
    con = [t for t in tareas if t["estado"] in ("✅", "⚠️") and t["commit"]]
    viejas = [t for t in con if ref and t["commit"] != ref]
    estado = "✓" if not viejas else "⚠"
    print(f"estado-backend {estado} {len(tareas)} tareas `B*`"
          f" · {len(con)} verificadas"
          f" · {len(con) - len(viejas)} contra {ref or 'sin referencia'}")
    if viejas:
        print(f"  {len(viejas)} contra un commit anterior · se listan en el archivo")
    print(f"  → {DESTINO.relative_to(RAIZ)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
