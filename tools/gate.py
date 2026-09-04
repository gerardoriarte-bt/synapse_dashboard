#!/usr/bin/env python3
"""La puerta · nada se da por terminado sin que pase · F0.11

    python3 tools/gate.py          la puerta entera
    npm run verify                 lo mismo

**Dos convenciones de salida, y mezclarlas ya dejó pasar errores.**

  NUESTRAS herramientas salen con **0** conforme, **1** violación y **2**
  BLOQUEADO — que significa «no hay contra qué comparar todavía». El 2 no
  rompe la puerta pero **se cuenta aparte**, porque un chequeo que pasa por
  falta de fuente miente sobre su cobertura, y un verde que incluye mentiras
  deja de servir para decidir.

  Las AJENAS no siguen esa convención: `tsc` sale con 2 cuando hay errores de
  tipo. Leído como BLOQUEADO, eso dejaba pasar dos errores de tipos con la
  puerta en verde — pasó en v2. Para ellas, **cualquier código distinto de
  cero es rojo**.

Códigos: 0 conforme (con o sin bloqueados) · 1 hay algo en rojo.
"""
import pathlib
import subprocess
import sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent

# (nombre, comando, propia). `propia` decide con qué convención se lee la salida.
CHEQUEOS = [
    ("typecheck", ["npm", "run", "--silent", "typecheck"], False),
    ("lint", ["npm", "run", "--silent", "lint"], False),
    ("design-lint", [sys.executable, "tools/design-lint.py"], True),
    ("spec-anclas", [sys.executable, "tools/spec-anclas.py"], True),
    ("contract-drift", [sys.executable, "tools/contract-drift.py"], True),
    ("token-drift", [sys.executable, "tools/token-drift.py"], True),
    ("contraste", [sys.executable, "tools/contraste.py"], True),
    ("test", ["npm", "run", "--silent", "test"], False),
    ("build", ["npm", "run", "--silent", "build"], False),
]


def main():
    rojos, bloqueados = [], []

    for nombre, comando, propia in CHEQUEOS:
        # `flush` antes de cada subproceso: sin él Python bufferea su propia
        # salida y el subproceso escribe directo al terminal, así que los
        # encabezados aparecen todos juntos al final y no arriba de lo que
        # nombran. Un reporte cuyo encabezado no está sobre su salida es peor
        # que ninguno: hace atribuir un hallazgo al chequeo equivocado.
        print(f"── {nombre}", flush=True)
        codigo = subprocess.run(comando, cwd=RAIZ).returncode
        if propia:
            if codigo == 1:
                rojos.append(nombre)
            elif codigo >= 2:
                bloqueados.append(nombre)
        elif codigo != 0:
            rojos.append(nombre)
        print()

    print("═" * 60)
    if rojos:
        print(f"verify ✗ {len(rojos)} en rojo: {', '.join(rojos)}")
        if bloqueados:
            print(f"         {len(bloqueados)} bloqueado(s): {', '.join(bloqueados)}")
        return 1

    if bloqueados:
        print(f"verify ✓ conforme · {len(bloqueados)} chequeo(s) BLOQUEADO(s): {', '.join(bloqueados)}")
        print("         Un bloqueado NO es un verde: es un chequeo que no verificó")
        print("         nada por falta de fuente. Se cuenta para que no se olvide.")
        return 0

    print("verify ✓ conforme · ningún chequeo bloqueado")
    return 0


if __name__ == "__main__":
    sys.exit(main())
