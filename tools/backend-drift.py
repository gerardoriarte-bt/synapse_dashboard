#!/usr/bin/env python3
"""¿El backend se movió desde la última vez que lo verificamos?

    python3 tools/backend-drift.py     ·     npm run backend-drift

── POR QUÉ NO ESTÁ EN LA PUERTA ─────────────────────────────────────────────

Necesita red y el `gh` del usuario. Un chequeo así saldría BLOQUEADO en cualquier
CI y en cualquier máquina sin credenciales, y **la puerta de este repositorio
sale verde SIN bloqueados** — meterlo ahí convertiría el ⊘ en ruido de todos los
días, que es como se deja de mirar un chequeo.

Se corre a mano: al empezar una jornada de integración, antes de informar
avances, y dentro de la skill `auditoria-plan`.

── QUÉ COMPARA ──────────────────────────────────────────────────────────────

El commit que `contracts/synapse-console-wire.yaml` declara adentro —el que se
transcribió— contra la cabeza actual de su rama. **El yaml ya lleva esa línea**
desde F1.32, así que no hace falta una segunda anotación que se olvide de
actualizar.

── QUÉ NO HACE ──────────────────────────────────────────────────────────────

**No actualiza nada.** Avisa que se movieron; decidir qué hacer con eso es
trabajo de una persona, y la regla del plan es explícita: el estado de una tarea
`B*` se mueve **después de verificar contra el servicio**, no cuando su rama
avanza. Un commit suyo puede ser un README.

Códigos: 0 sin deriva · 1 se movieron · 2 BLOQUEADO (sin `gh`, sin red, o el
yaml no declara el commit).
"""
import pathlib
import re
import subprocess
import sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent
CABLE = RAIZ / "contracts" / "synapse-console-wire.yaml"
REPO = "AntPack-dev/synapse-api-go"


def main() -> int:
    if not CABLE.exists():
        print(f"backend-drift ⊘ BLOQUEADO · falta {CABLE.name}")
        return 2

    texto = CABLE.read_text(encoding="utf-8")
    m_commit = re.search(r"^#\s+commit\s+([0-9a-f]{40})", texto, re.M)
    m_rama = re.search(r"^#\s+rama\s+(\S+)", texto, re.M)
    if not m_commit or not m_rama:
        print("backend-drift ⊘ BLOQUEADO · el cable no declara rama y commit")
        print(f"  {CABLE.name} tiene que llevar las dos líneas de procedencia")
        return 2

    nuestro, rama = m_commit.group(1), m_rama.group(1)

    # ── LA VERIFICACIÓN ES POR RUTA · 2026-09-25 ────────────────────────────
    #
    # Antes esto miraba una sola línea `commit`, y eso lo dejaba **rojo
    # permanente**: al reverificar tres rutas contra un commit nuevo, mover la
    # línea habría dicho que las nueve estaban al día, así que no se movía. Ocho
    # días después seguía sonando, ya como paisaje, y el backend agregó siete
    # formas de valor que nadie miró — al punto de mandarles un mensaje diciendo
    # que no las tenían.
    #
    # El chequeo no fallaba. Lo que fallaba es que sólo sabía decir «sí» o «no»
    # sobre un archivo que se verifica de a pedazos, así que la única forma de
    # ponerlo en verde era mentir. Con la marca por ruta el número BAJA a medida
    # que se reverifica, y un rojo que se mueve se sigue leyendo.
    rutas = re.findall(
        r"^  (/[^\n]*?):\n    x-verificado-en:\s*([0-9a-f]{7,40})", texto, re.M
    )
    if not rutas:
        print("backend-drift ⊘ BLOQUEADO · ninguna ruta declara `x-verificado-en`")
        print("  cada ruta del cable lleva el commit contra el que se leyó")
        return 2

    r = subprocess.run(
        ["gh", "api", f"repos/{REPO}/commits/{rama}", "--jq", ".sha + \"\\t\" + .commit.author.date + \"\\t\" + (.commit.message | split(\"\\n\")[0])"],
        capture_output=True,
        text=True,
    )
    if r.returncode != 0 or not r.stdout.strip():
        detalle = (r.stderr or "sin salida").strip().splitlines()
        print("backend-drift ⊘ BLOQUEADO · no se pudo consultar el repositorio")
        for l in detalle[-2:]:
            print(f"  {l}")
        print("  necesita `gh auth login` y red · NO es un fallo del front")
        return 2

    suyo, fecha, mensaje = (r.stdout.strip().split("\t") + ["", ""])[:3]

    atrasadas = [(r, c) for r, c in rutas if not suyo.startswith(c)]
    al_dia = len(rutas) - len(atrasadas)

    if not atrasadas:
        print(f"backend-drift ✓ sin deriva · las {len(rutas)} rutas leídas contra {suyo[:7]} ({fecha[:10]})")
        return 0

    print(f"backend-drift ✗ {len(atrasadas)} de {len(rutas)} rutas sin reverificar · {rama}")
    print(f"  ahora en      {suyo[:7]}  ({fecha[:10]})  {mensaje[:56]}")
    if al_dia:
        print(f"  al día        {al_dia} ruta(s)")
    print()
    for r, c in atrasadas:
        print(f"   {c:8} {r}")
    print()
    print("  Qué hacer, y en este orden:")
    print("   1. Ver qué cambió · gh api repos/%s/compare/%s...%s" % (REPO, atrasadas[0][1], suyo[:7]))
    print("   2. Leer la ruta contra su código y corregir el cable si difiere")
    print("   3. Mover SOLO el `x-verificado-en` de las rutas que releíste")
    print()
    print("  **El número baja de a una.** No hace falta reverificar las nueve para")
    print("  que esto deje de mentir: cada ruta releída lo achica, y un rojo que se")
    print("  mueve se sigue leyendo. El anterior era binario y se quedó ocho días")
    print("  en el mismo rojo hasta que dejó de mirarse.")
    print()
    print("  **Que se hayan movido NO mueve ninguna tarea `B*`.** El estado de una")
    print("  tarea de backend se cambia después de verificar contra el servicio,")
    print("  no cuando su rama avanza: un commit suyo puede ser un README.")
    return 1


if __name__ == "__main__":
    sys.exit(main())
