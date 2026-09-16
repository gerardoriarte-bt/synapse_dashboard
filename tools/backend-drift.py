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

    if suyo == nuestro:
        print(f"backend-drift ✓ sin deriva · {rama} sigue en {nuestro[:7]} ({fecha[:10]})")
        return 0

    print(f"backend-drift ✗ el backend se movió · {rama}")
    print(f"  transcripto   {nuestro[:7]}")
    print(f"  ahora en      {suyo[:7]}  ({fecha[:10]})  {mensaje[:56]}")
    print()
    print("  Qué hacer, y en este orden:")
    print("   1. Ver qué cambió · gh api repos/%s/compare/%s...%s" % (REPO, nuestro[:7], suyo[:7]))
    print("   2. Si tocó `/config/*` o `/admin/*`, reverificar el cable y correr F1.39")
    print("   3. Actualizar la línea `commit` de synapse-console-wire.yaml")
    print()
    print("  **Que se hayan movido NO mueve ninguna tarea `B*`.** El estado de una")
    print("  tarea de backend se cambia después de verificar contra el servicio,")
    print("  no cuando su rama avanza: un commit suyo puede ser un README.")
    return 1


if __name__ == "__main__":
    sys.exit(main())
