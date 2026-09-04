#!/usr/bin/env python3
"""La carga diferida, verificada sobre el OUTPUT DEL BUILD · F5.12

    npm run build && python3 tools/carga-diferida.py

**Sobre el build y no sobre la función, y esa es toda la diferencia.**
`registry.test.tsx` ya verifica que `preloadBodies` deduplique y no reviente:
eso prueba la función. Lo que decide si el usuario descarga cinco cuerpos o
quince es si el bundler los separó, y eso solo se ve en `dist/`.

**Cómo falla esto en la vida real.** Nadie escribe «cargá los quince». Lo que
pasa es que alguien importa un cuerpo de forma normal —para una prueba de tipos,
para reusar una constante, para un `instanceof`— y Vite, que ve un import
estático, lo mete en el chunk principal. El `lazy()` del registro sigue ahí y ya
no sirve para nada: el código viaja igual. **El síntoma es que el chunk
desaparece de `dist/assets/`**, y por eso lo que se cuenta es la existencia de
un chunk por cuerpo.

Sin `dist/` sale 2 (BLOQUEADO) en vez de pasar: un chequeo que aprueba porque no
hay nada que mirar miente sobre su cobertura.

Códigos: 0 conforme · 1 hay un cuerpo sin chunk propio · 2 BLOQUEADO.
"""
import pathlib
import re
import sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent
CUERPOS = RAIZ / "src" / "render" / "bodies"
DIST = RAIZ / "dist" / "assets"

# El chunk de entrada. Todo lo que quede acá adentro viaja en la primera carga.
ENTRADA = "index-"


def main():
    if not DIST.exists():
        print("carga-diferida ⊘ BLOQUEADO · no hay `dist/`, corré `npm run build` antes")
        return 2

    fuentes = sorted(p.stem for p in CUERPOS.glob("*Body.tsx"))
    if not fuentes:
        print("carga-diferida ⊘ BLOQUEADO · no hay cuerpos en src/render/bodies/")
        return 2

    chunks = [p.name for p in DIST.glob("*.js")]
    entrada = [c for c in chunks if c.startswith(ENTRADA)]

    fallas = []
    for cuerpo in fuentes:
        # El chunk que Vite emite lleva el nombre del módulo y un hash.
        propio = [c for c in chunks if re.fullmatch(rf"{cuerpo}-[\w-]+\.js", c)]
        if not propio:
            fallas.append(
                f"{cuerpo} no tiene chunk propio · se fue al bundle principal y "
                f"su `lazy()` dejó de servir"
            )

    if not entrada:
        fallas.append(f"no se encontró el chunk de entrada `{ENTRADA}*.js`")

    if fallas:
        print(f"carga-diferida ✗ {len(fallas)} de {len(fuentes)} cuerpos no se separan")
        for f in fallas:
            print(f"  ✗ {f}")
        print()
        print("  Casi siempre es un import ESTÁTICO de un cuerpo desde algo que")
        print("  entra al bundle principal. El registro lo carga con `lazy()`;")
        print("  alcanza un `import { XBody } from '...'` en cualquier otro lado.")
        return 1

    peso = sum((DIST / c).stat().st_size for c in chunks if c not in entrada and "Body-" in c)
    print(
        f"carga-diferida ✓ {len(fuentes)} cuerpos en {len(fuentes)} chunks · "
        f"{peso // 1024} KB que NO viajan en la primera carga"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
