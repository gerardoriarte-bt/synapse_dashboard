#!/usr/bin/env python3
"""contract-drift · `src/api/generated.ts` == `contracts/synapse-api.yaml` · F0.11

Regenera sobre una copia y compara. Una edición a mano en el archivo generado se
pierde en la próxima corrida de `npm run gen:api` y hasta entonces el front cree
un contrato que el backend no firmó — que es la forma más silenciosa de romperse.

**Este chequeo no modifica lo que verifica.** Genera en un directorio temporal,
nunca sobre el árbol. En v2 se generaba encima y se restauraba después, y eso
deja una ventana en la que un Ctrl-C te deja el archivo del otro lado.

**En v2 esta mitad salía BLOQUEADO** porque el yaml se mudó acá el 2026-09-01.
Portarlo es lo que la desbloquea: la fuente y el generado viven en el mismo
repositorio, así que la comparación por fin tiene contra qué correr.

Códigos: 0 conforme · 1 drift · 2 BLOQUEADO (falta el yaml, el generado o npx).
"""
import pathlib
import subprocess
import sys
import tempfile

RAIZ = pathlib.Path(__file__).resolve().parent.parent
YAML = RAIZ / "contracts" / "synapse-api.yaml"
GENERADO = RAIZ / "src" / "api" / "generated.ts"


def primeras_diferencias(esperado, actual, tope=5):
    """Las primeras líneas que difieren, con su número. Un diff entero de 2.000
    líneas no ayuda: lo que hace falta es saber por dónde empezar a mirar."""
    a, b = esperado.splitlines(), actual.splitlines()
    salida = []
    for n in range(max(len(a), len(b))):
        linea_a = a[n] if n < len(a) else "«el archivo termina acá»"
        linea_b = b[n] if n < len(b) else "«el archivo termina acá»"
        if linea_a != linea_b:
            salida.append((n + 1, linea_b.strip(), linea_a.strip()))
            if len(salida) == tope:
                break
    return salida


def main():
    if not YAML.exists():
        print(f"contract-drift ⊘ BLOQUEADO · falta {YAML.relative_to(RAIZ)}")
        return 2
    if not GENERADO.exists():
        print(f"contract-drift ⊘ BLOQUEADO · falta {GENERADO.relative_to(RAIZ)}")
        print("  correr: npm run gen:api")
        return 2

    with tempfile.TemporaryDirectory() as tmp:
        destino = pathlib.Path(tmp) / "generated.ts"
        r = subprocess.run(
            ["npx", "--no-install", "openapi-typescript", str(YAML), "-o", str(destino)],
            cwd=RAIZ,
            capture_output=True,
            text=True,
        )
        if r.returncode != 0 or not destino.exists():
            salida = (r.stderr or r.stdout).strip().splitlines()
            print("contract-drift ⊘ BLOQUEADO · el generador no corrió")
            for linea in salida[-3:]:
                print(f"  {linea}")
            print("  correr: npm install")
            return 2

        esperado = destino.read_text(encoding="utf-8")

    actual = GENERADO.read_text(encoding="utf-8")
    if actual == esperado:
        lineas = len(actual.splitlines())
        print(f"contract-drift ✓ {lineas} líneas · generated.ts == {YAML.name}")
        return 0

    print("contract-drift ✗ generated.ts difiere del yaml")
    print("  editado a mano, o el yaml cambió sin regenerar. Correr: npm run gen:api")
    print()
    for n, hay, deberia in primeras_diferencias(esperado, actual):
        print(f"  línea {n}")
        print(f"    hay:     {hay}")
        print(f"    debería: {deberia}")
    return 1


if __name__ == "__main__":
    sys.exit(main())
