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
    ("auth-drift", [sys.executable, "tools/contract-drift.py", "--auth"], True),
    ("console-drift", [sys.executable, "tools/contract-drift.py", "--console-wire"], True),
    ("admin-drift", [sys.executable, "tools/contract-drift.py", "--admin-wire"], True),
    # **`plan --check` parsea sin escribir** · agregado el 2026-09-28. Estaba
    # afuera, y un cierre de tarea mal empezado dejó el plan sin parsear con la
    # puerta en verde: `PARA-BACKEND.md` no se podía regenerar y un pedido no
    # llegaba al documento que el backend lee. Una regla que la puerta no
    # comprueba no es una regla.
    ("plan", [sys.executable, "tools/plan-a-csv.py", "--check"], True),
    ("plan-ancestro", [sys.executable, "tools/plan-ancestro.py"], True),
    ("para-backend", [sys.executable, "tools/para-backend.py"], True),
    ("pen-pantallas", [sys.executable, "tools/pen-pantallas.py"], True),
    # El hermano de arriba para los 43 gráficos, que `pen-pantallas` no mira:
    # reconoce `A*`, `B*` y `C*` y la biblioteca de plots quedaba afuera.
    ("pen-graficos", [sys.executable, "tools/pen-graficos.py"], True),
    ("docs-registro", [sys.executable, "tools/docs-registro.py"], True),
    ("afirmaciones", [sys.executable, "tools/afirmaciones.py"], True),
    # **El vocabulario interno no se pinta** · desde el 2026-09-30. Nació de la
    # auditoría de usabilidad: siete bloques citando §7.3 y nombrando rutas del
    # servicio en la pantalla de un cliente, acumulados durante meses sin que
    # nadie los viera como un defecto. Al escribirlo encontró SEIS más.
    ("copy-producto", [sys.executable, "tools/copy-producto.py"], True),
    ("mocks-fuera", [sys.executable, "tools/mocks-fuera.py"], True),
    ("token-drift", [sys.executable, "tools/token-drift.py"], True),
    ("contraste", [sys.executable, "tools/contraste.py"], True),
    ("test", ["npm", "run", "--silent", "test"], False),
    ("build", ["npm", "run", "--silent", "build"], False),
    # DESPUÉS del build, y no es un detalle de orden: mira `dist/`. Antes
    # del build miraría el output de la corrida anterior, que es peor que
    # no mirar nada.
    ("carga-diferida", [sys.executable, "tools/carga-diferida.py"], True),
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
