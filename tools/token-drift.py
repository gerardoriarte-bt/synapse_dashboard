#!/usr/bin/env python3
"""token-drift · `src/tokens/` == lo que el `.pen` emite · F0.11, cerrado por F0.12

    python3 tools/token-drift.py

**Byte a byte contra el generador, desde el 2026-09-03.** Hasta F0.12 este
chequeo comparaba variable por variable, porque `tools/gen-tokens.py` no estaba
reapuntado y no había contra qué regenerar: se verificaba que cada variable del
`.pen` estuviera en el CSS con su valor, en los dos temas. Servía —confirmó que
el port a mano de los 57 no tenía deriva— pero era una cobertura menor, y la
diferencia no es teórica:

  · No veía un COMENTARIO cambiado. Y en `tokens.css` la prosa no es decorado:
    lleva `§ANCLA:RADIO-1` y `§ANCLA:TIPO-2`, que `spec-anclas` lee del archivo.
  · No veía el ORDEN ni el agrupamiento.
  · Repetía la traducción de espacios de nombres en dos lugares. Un error en la
    traducción entraba igual, porque el chequeo y el generador se equivocaban de
    la misma manera.

Ahora regenera en memoria y compara el texto entero. Lo que el generador escribe
es la única definición de qué es correcto, y hay un solo lugar donde puede estar
mal.

Códigos: 0 conforme · 1 drift · 2 BLOQUEADO (falta el `.pen`).
"""
import importlib.util
import pathlib
import sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent


def generador():
    """El generador se importa, no se reimplementa. El guion del nombre de
    archivo impide un `import` normal, y renombrarlo sería peor: `gen-tokens.py`
    es como lo llama `package.json` y como está escrito en toda la documentación."""
    ruta = RAIZ / "tools" / "gen-tokens.py"
    spec = importlib.util.spec_from_file_location("gen_tokens", ruta)
    if spec is None or spec.loader is None:
        raise SystemExit(f"✗ no se pudo cargar {ruta}")
    modulo = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(modulo)
    return modulo


def main():
    gen = generador()

    if not gen.PEN.exists():
        print("token-drift ⊘ BLOQUEADO · no hay `.pen` contra qué comparar")
        print(f"  buscado en: {gen.PEN}")
        print("  Vive en `design/`, o en el repositorio archivado gerardoriarte-bt/Synapse-v2.")
        print("  Reapuntar con SYNAPSE_PEN=/ruta/al/Synapse_v2.pen")
        return 2

    por_tema, planos = gen.leer()
    esperado = {
        gen.DESTINO / "tokens.css": gen.generar_css(por_tema, planos),
        gen.DESTINO / "tokens.ts": gen.generar_ts(por_tema),
    }

    fallas = []
    for ruta, texto in esperado.items():
        if not ruta.exists():
            fallas.append((ruta, "no existe"))
            continue
        actual = ruta.read_text(encoding="utf-8")
        if actual == texto:
            continue
        # La primera línea que difiere, que es lo único accionable: el diff
        # entero de un archivo de 195 líneas no ayuda a nadie.
        a, b = actual.splitlines(), texto.splitlines()
        n = next((i for i in range(max(len(a), len(b))) if a[i:i + 1] != b[i:i + 1]), 0)
        fallas.append((
            ruta,
            f"difiere desde la línea {n + 1}\n"
            f"      hay:  {(a[n] if n < len(a) else '«fin de archivo»').strip()}\n"
            f"      va:   {(b[n] if n < len(b) else '«fin de archivo»').strip()}",
        ))

    total = len(por_tema) + len(planos)
    if fallas:
        print(f"token-drift ✗ {len(fallas)} archivo(s) no coinciden con los {total} tokens del `.pen`")
        for ruta, detalle in fallas:
            print(f"  ✗ {ruta.relative_to(RAIZ)} {detalle}")
        print()
        print("  Se corrige con `npm run gen:tokens`. Si el cambio era intencional,")
        print("  va en el `.pen` o en el generador — nunca en la salida, que se pisa.")
        return 1

    print(f"token-drift ✓ {total} tokens · src/tokens/ == {gen.PEN.name}, byte a byte")
    return 0


if __name__ == "__main__":
    sys.exit(main())
