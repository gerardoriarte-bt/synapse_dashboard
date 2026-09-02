#!/usr/bin/env python3
"""token-drift · `src/tokens/tokens.css` == las variables del `.pen` · F0.11

**Por qué no compara contra el generador.** En v2 este chequeo regenera en
memoria con `tools/gen-tokens.py` y compara byte a byte. Acá ese generador
todavía no está reapuntado —es F0.12—, así que la comparación es **por
variable**: cada una de las 57 del `.pen` tiene que estar en `tokens.css` con su
valor, en los dos temas. Es una cobertura menor que la del byte a byte —no
detecta que cambie un comentario— y mayor que nada, que es lo que hay hoy.

Cuando F0.12 cierre, este chequeo se reemplaza por el de v2 y esta nota se borra.

**La traducción de espacio de nombres es de formato, no de valor.** Tailwind v4
genera la utilidad a partir del prefijo de la variable, así que el token del
`.pen` no se llama igual en el CSS. Las cuatro correspondencias están abajo, en
`ESPACIOS`, y son parte de lo que el chequeo verifica: un token que no encaja en
ninguna se reporta, no se ignora.

**`sp-1..6` es el único caso que no es 1:1.** El `.pen` declara los seis pasos;
Tailwind los deriva de `--spacing`, así que el CSS lleva uno solo. El chequeo
verifica que la escala del `.pen` siga siendo 4·N, que es lo que hace válido el
colapso — si alguien pusiera `sp-3 = 14`, `p-3` dejaría de ser ese valor y el
colapso mentiría.

Códigos: 0 conforme · 1 drift · 2 BLOQUEADO (falta el `.pen`).
"""
import json
import os
import pathlib
import re
import sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent
CSS = RAIZ / "src" / "tokens" / "tokens.css"

# El `.pen` vive en el repositorio archivado, que sigue siendo la fuente de las
# reglas de producto. Se puede reapuntar sin editar el script.
PEN = pathlib.Path(
    os.environ.get("SYNAPSE_PEN", RAIZ.parent / "synapse_v2" / "design" / "Synapse_v2.pen")
).expanduser()

# (prefijo del .pen, prefijo en el CSS). El orden importa: `brand-` antes que el
# genérico de color, porque los dos son colores.
ESPACIOS = [
    ("font-", "--font-"),
    ("r-", "--radius-"),
    ("brand-", "--color-brand-"),
]

BASE_ESPACIADO = 4


def variables_del_pen():
    datos = json.loads(PEN.read_text(encoding="utf-8"))["variables"]
    por_tema, planos = {}, {}
    for nombre, var in datos.items():
        valor = var["value"]
        if isinstance(valor, list):
            por_tema[nombre] = {e["theme"]["Mode"]: e["value"] for e in valor}
        else:
            planos[nombre] = (var["type"], valor)
    return por_tema, planos


def variables_del_css():
    """Devuelve (oscuro, claro). El oscuro es `@theme static`, que es el defecto;
    el claro es el bloque `[data-theme='light']`, que es CSS plano fuera de
    `@theme` — por eso se leen por separado y no con un solo regex."""
    texto = CSS.read_text(encoding="utf-8")

    def bloque(inicio):
        i = texto.index(inicio)
        fin = texto.index("\n}", i)
        return dict(re.findall(r"(--[a-z0-9-]+)\s*:\s*([^;]+);", texto[i:fin]))

    return bloque("@theme static {"), bloque(":root[data-theme='light'] {")


def normalizar_color(v):
    return v.strip().lower()


def familia_principal(valor):
    """El primer nombre de la pila. El `.pen` guarda una familia sin respaldo;
    en CSS una familia sola deja la página sin texto si la fuente no cargó, así
    que se emite el nombre del `.pen` PRIMERO y detrás la pila. Lo que este
    chequeo fija es ese primero."""
    primero = valor.split(",")[0].strip()
    return primero.strip("'\"")


def main():
    if not PEN.exists():
        print("token-drift ⊘ BLOQUEADO · no hay `.pen` contra qué comparar")
        print(f"  buscado en: {PEN}")
        print("  Vive en el repositorio archivado gerardoriarte-bt/Synapse-v2.")
        print("  Reapuntar con SYNAPSE_PEN=/ruta/al/Synapse_v2.pen")
        return 2

    if not CSS.exists():
        print(f"token-drift ⊘ BLOQUEADO · falta {CSS.relative_to(RAIZ)}")
        return 2

    por_tema, planos = variables_del_pen()
    oscuro, claro = variables_del_css()
    fallas = []

    # ── los 39 de tema ───────────────────────────────────────────────────────
    for nombre, valores in por_tema.items():
        clave = f"--color-{nombre}"
        for modo, bloque, etiqueta in (
            ("Dark", oscuro, "@theme static"),
            ("Light", claro, "[data-theme='light']"),
        ):
            esperado = normalizar_color(valores[modo])
            actual = bloque.get(clave)
            if actual is None:
                fallas.append(f"{clave} falta en {etiqueta} · el `.pen` lo declara para {modo}")
            elif normalizar_color(actual) != esperado:
                fallas.append(f"{clave} en {etiqueta}: {actual.strip()} ≠ {esperado} del `.pen`")

    # ── los 18 planos ────────────────────────────────────────────────────────
    espaciado = {}
    for nombre, (tipo, valor) in planos.items():
        if nombre.startswith("sp-"):
            espaciado[nombre] = valor
            continue

        clave = None
        for prefijo, destino in ESPACIOS:
            if nombre.startswith(prefijo):
                clave = destino + nombre[len(prefijo):]
                break
        if clave is None:
            fallas.append(f"'{nombre}' del `.pen` no encaja en ningún espacio de nombres conocido")
            continue

        actual = oscuro.get(clave)
        if actual is None:
            fallas.append(f"{clave} falta en tokens.css · el `.pen` declara '{nombre}'")
        elif tipo == "string":
            if familia_principal(actual) != valor:
                fallas.append(
                    f"{clave}: la familia principal es '{familia_principal(actual)}' "
                    f"y el `.pen` dice '{valor}'"
                )
        elif tipo == "number":
            if actual.strip() != f"{valor}px":
                fallas.append(f"{clave}: {actual.strip()} ≠ {valor}px del `.pen`")
        elif normalizar_color(actual) != normalizar_color(valor):
            fallas.append(f"{clave}: {actual.strip()} ≠ {normalizar_color(valor)} del `.pen`")

    # ── el colapso de la escala de espaciado ─────────────────────────────────
    for nombre, valor in sorted(espaciado.items()):
        paso = int(nombre.split("-")[1])
        if valor != BASE_ESPACIADO * paso:
            fallas.append(
                f"'{nombre}' vale {valor} y no {BASE_ESPACIADO * paso}: la escala del `.pen` "
                f"dejó de ser 4·N, así que `--spacing: {BASE_ESPACIADO}px` ya no la deriva"
            )
    base = oscuro.get("--spacing", "").strip()
    if base != f"{BASE_ESPACIADO}px":
        fallas.append(f"--spacing es '{base}' y la escala del `.pen` arranca en {BASE_ESPACIADO}")

    # ── tokens en el CSS que el `.pen` no declara ────────────────────────────
    conocidos = {f"--color-{n}" for n in por_tema}
    conocidos |= {"--spacing"}
    for nombre in planos:
        if nombre.startswith("sp-"):
            continue
        for prefijo, destino in ESPACIOS:
            if nombre.startswith(prefijo):
                conocidos.add(destino + nombre[len(prefijo):])
                break
    for clave in sorted(set(oscuro) - conocidos):
        fallas.append(f"{clave} está en tokens.css y el `.pen` no lo declara")

    total = len(por_tema) + len(planos)
    if fallas:
        print(f"token-drift ✗ {len(fallas)} diferencia(s) sobre {total} tokens del `.pen`")
        for f in fallas:
            print(f"  ✗ {f}")
        print()
        print("  Un token se corrige en el `.pen` y se trae; editarlo solo acá es")
        print("  deriva silenciosa. F0.12 reapunta el generador para que llegue solo.")
        return 1

    print(f"token-drift ✓ {total} tokens · tokens.css == {PEN.name} en tema oscuro y claro")
    return 0


if __name__ == "__main__":
    sys.exit(main())
