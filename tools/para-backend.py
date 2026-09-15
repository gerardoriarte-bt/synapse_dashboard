#!/usr/bin/env python3
"""plan-de-trabajo.md → docs/PARA-BACKEND.md

El `.md` del plan es la FUENTE. Este documento se genera desde él y **se pisa
entero en cada corrida**: editarlo a mano es trabajo que se pierde.

── POR QUÉ SE GENERA Y NO SE ESCRIBE ────────────────────────────────────────

Porque la versión escrita a mano se venció sin que nadie lo notara. La del
2026-09-04 anunciaba como faltantes «ocho rutas que el contrato no declara», y
para el 2026-09-14 el backend ya servía todas — pero el documento seguía ahí,
diciendo que faltaban. **Un documento para otro equipo que miente es peor que no
tenerlo**: se lee, se planifica contra él, y el error aparece semanas después.

La regla es la misma que ya rige para `plan-tareas.csv`: lo que se le pide al
backend vive **en la tarea que lo espera**, y de ahí sale el documento. Así no
puede haber una tarea desbloqueada cuyo pedido siga publicado.

── EL MARCADOR ──────────────────────────────────────────────────────────────

Dentro del cuerpo de una tarea, una línea:

    **Espera del backend.** <qué falta> · <por qué bloquea>

Se recoge con el ID de la tarea, su estado y su equipo. Una tarea en `✅` con
marcador es una contradicción y el chequeo la reporta: si se cerró, ya no espera.

Códigos: 0 conforme · 1 hay marcadores en tareas cerradas · 2 BLOQUEADO.
"""
import pathlib
import re
import subprocess
import sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent
PLAN = RAIZ / "plan-de-trabajo.md"
DESTINO = RAIZ / "docs" / "PARA-BACKEND.md"

ENCABEZADO = re.compile(r"^#{3,4} (➕ )?([BF]\d+\.\d+[a-j]?) (✅|⚠️|⬜|🕓) (.+)$")
ESPERA = re.compile(r"^\*\*Espera del backend\.\*\*\s*(.+)$")
ESTADOS = {"✅": "hecho", "⚠️": "parcial", "⬜": "pendiente", "🕓": "diferida"}


def rama_actual() -> str:
    """La rama de verdad, no una escrita a mano.

    Decía `main` y el trabajo vive en otra: alguien iba a ir a mirar y no iba a
    encontrar nada. Es el mismo modo de falla que el documento entero existe para
    evitar — un dato que fue cierto una vez y se quedó escrito."""
    r = subprocess.run(
        ["git", "branch", "--show-current"], capture_output=True, text=True, cwd=RAIZ
    )
    return r.stdout.strip() or "(rama desconocida)"


def recolectar(texto: str):
    """Recorre el plan llevando la última tarea vista, y le cuelga sus esperas."""
    tareas, actual = [], None
    for linea in texto.split("\n"):
        m = ENCABEZADO.match(linea)
        if m:
            actual = {
                "id": m.group(2),
                "estado": ESTADOS[m.group(3)],
                "titulo": re.sub(r"`|\*\*", "", m.group(4)).split(" · 🔒")[0].strip(),
                "lado": "backend" if m.group(2)[0] == "B" else "front",
                "esperas": [],
            }
            tareas.append(actual)
            continue
        e = ESPERA.match(linea)
        if e and actual is not None:
            actual["esperas"].append(e.group(1).strip())
    return [t for t in tareas if t["esperas"]]


def render(tareas, hechas) -> str:
    o = []
    o.append("# Lo que el front necesita del backend\n")
    o.append(
        "> **GENERADO.** Sale de `plan-de-trabajo.md` con `npm run plan` y se pisa\n"
        "> entero en cada corrida — editarlo a mano es trabajo que se pierde. Lo que\n"
        "> se pide vive **en la tarea que lo espera**, así que una tarea que se\n"
        "> desbloquea saca su pedido de acá sola.\n"
    )
    o.append(
        "\nCada punto dice **qué falta y por qué bloquea**, con el identificador de la\n"
        "tarea que está esperando. Los identificadores son los de\n"
        "`tareas-front-back.md`, el **ancestro común de los dos planes** — verificado\n"
        "en cada corrida de la puerta con `npm run plan:ancestro`.\n"
    )

    if hechas:
        o.append("\n---\n\n## Lo que ya está de nuestro lado\n")
        o.append(
            f"No hace falta que esperen nada de estas para probar: están en la rama\n"
            f"`{rama_actual()}` del repositorio del front, con prueba y con la puerta en\n"
            "verde.\n"
        )
        for t in hechas:
            o.append(f"- **{t['id']}** · {t['titulo']}")

    pend = [t for t in tareas if t["estado"] != "hecho"]
    o.append(f"\n---\n\n## Lo que esperamos · {len(pend)} pedido(s)\n")
    if not pend:
        o.append("Nada. El front no está esperando ningún campo ni ninguna ruta.\n")
    for t in pend:
        o.append(f"\n### {t['id']} · {t['titulo']}")
        o.append(f"\n*Estado de la tarea: {t['estado']}.*\n")
        for e in t["esperas"]:
            o.append(f"\n{e}\n")

    o.append(
        "\n---\n\n## Cómo avisar que algo llegó\n\n"
        "No hace falta tocar este archivo. Con decirlo alcanza: el front quita el\n"
        "marcador de la tarea, la desbloquea y este documento se regenera sin ese\n"
        "punto. **Si un pedido sigue acá, es que sigue faltando.**\n"
    )
    return "\n".join(o) + "\n"


def main() -> int:
    if not PLAN.exists():
        print(f"para-backend ⊘ BLOQUEADO · falta {PLAN.name}")
        return 2

    texto = PLAN.read_text(encoding="utf-8")
    tareas = recolectar(texto)

    # Una tarea cerrada que sigue pidiendo algo es una contradicción: o no estaba
    # cerrada, o el pedido ya se cumplió y nadie lo sacó. Las dos se arreglan acá
    # y no en el documento generado.
    contradictorias = [t for t in tareas if t["estado"] == "hecho"]

    # Las de integración ya cerradas, para que sepan qué pueden probar.
    hechas = [
        {"id": m.group(2), "titulo": re.sub(r"`|\*\*", "", m.group(4)).strip()}
        for l in texto.split("\n")
        if (m := ENCABEZADO.match(l)) and m.group(3) == "✅" and re.fullmatch(r"F1\.(3[2-9]|4[01])", m.group(2))
    ]

    DESTINO.write_text(render(tareas, hechas), encoding="utf-8")

    if contradictorias:
        print(f"para-backend ✗ {len(contradictorias)} tarea(s) cerradas que siguen pidiendo algo")
        for t in contradictorias:
            print(f"  {t['id']:8} {t['titulo'][:56]}")
        print("  O la tarea no estaba cerrada, o el pedido ya se cumplió y quedó el marcador.")
        return 1

    print(
        f"para-backend ✓ {len(tareas)} tarea(s) esperan al backend"
        f" · {sum(len(t['esperas']) for t in tareas)} pedido(s)"
        f" · {len(hechas)} de integración cerradas"
    )
    print(f"  → {DESTINO.relative_to(RAIZ)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
