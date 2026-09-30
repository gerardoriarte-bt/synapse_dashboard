#!/usr/bin/env python3
"""El vocabulario interno no se pinta · 2026-09-30

    python3 tools/copy-producto.py     ·     npm run copy-producto

── POR QUÉ EXISTE ───────────────────────────────────────────────────────────

**Porque se acumuló durante meses sin que nadie lo viera como un defecto.** La
auditoría de usabilidad del 2026-09-30 lo puso primero en su lista: siete
bloques «Faltan N cosas que §7.3 pide» renderizados como interfaz, citando
secciones de la spec, nombrando rutas del servicio y hablando de «el cable» en
la pantalla de un cliente.

La intención era buena y es la mejor costumbre de este repositorio —declarar lo
que falta en vez de esconderlo, que es la gramática de §8—. **El registro era el
equivocado**, y el arreglo fue cambiarle el idioma, no borrar la declaración.

**Y §7.3 lo dice como regla dura de toda la superficie de administración:**

    «El vocabulario de infraestructura no se muestra. Nombres de base, de rol
    técnico, de warehouse o de grant no aparecen en ninguna pantalla … mostrarla
    sugiere una acción que no existe y es una fuente de confusión, no de
    control.»

Acá se extiende a nuestra propia plomería, que es la misma clase: un
identificador de tarea, una ruta HTTP o una sección de la spec le piden al
lector un contexto que no tiene y una acción que no puede ejecutar.

── QUÉ MIRA, Y QUÉ NO ───────────────────────────────────────────────────────

**Sólo cadenas de `src/surfaces/`, y sólo las que pueden llegar al DOM.** Los
comentarios quedan fuera a propósito: ahí la razón técnica es exactamente lo que
hace falta, y es donde se la mudó. Un `import` tampoco es copy.

**Lo que NO puede hacer es decidir si una cadena se pinta.** Una cadena suelta
en un módulo de superficie puede ser una clave, un id o un mensaje de consola.
Por eso hay una lista de exenciones **con su razón escrita**, y no un umbral.

Códigos: 0 conforme · 1 hay vocabulario interno en una cadena · 2 BLOQUEADO.
"""

from __future__ import annotations

import pathlib
import re
import sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent
SUPERFICIES = RAIZ / "src" / "surfaces"

# Cada patrón con el nombre de lo que persigue, que es lo que se imprime.
PROHIBIDO = [
    (re.compile(r"§\s?\d"), "una sección de la spec"),
    (re.compile(r"\b[BFD]\d+\.\d+\b"), "un identificador de tarea"),
    (re.compile(r"/(?:admin|config|auth)/"), "una ruta del servicio"),
    (re.compile(r"\b(?:GET|POST|PUT|DELETE|PATCH)\s+/"), "un método HTTP"),
    (re.compile(r"\bel cable\b", re.I), "«el cable»"),
    (re.compile(r"\.pen\b"), "el archivo de diseño"),
    (re.compile(r"\bmake\s+[a-z-]+"), "un comando de consola"),
    (re.compile(r"\b(?:warehouse|grant|schema|snowflake_[a-z_]+)\b", re.I), "vocabulario de infraestructura"),
]

# ── LAS EXENCIONES, CADA UNA CON SU RAZÓN ────────────────────────────────────
#
# Una exención sin razón es un agujero; con razón es una decisión. Se comparan
# por SUBCADENA contra la línea, para que mover el código no las rompa.
EXENTAS = [
    # `Snowflake` como nombre propio del subprocesador es la excepción que §7.3
    # se hace a sí misma: «una obligación legal de nombrar a quién procesa el
    # dato — no una palanca operativa».
    "subprocesador",
    # El nombre del agente es del producto y lo eligió datos, no es plomería.
    "SYNAPSE_UA",
    # ── LAS DOS QUE EL `.pen` DIBUJA CON LA CITA ADENTRO ─────────────────────
    #
    # **Acá la regla de la casa manda al revés**, y por eso se eximen en vez de
    # reescribirse: «donde el `.pen` y `design.md` difieran, gana el `.pen` para
    # lo visual y **el literal de la UI**», y el agente no modifica el `.pen`.
    #
    # Los dos textos están dibujados con su `(§3.3)` y su `§5` adentro —
    # comprobado leyendo el archivo, no deducido—. Que el dibujo cite la spec en
    # copy de producto es una divergencia contra la decisión del 2026-09-30, y
    # **se levanta como propuesta a diseño en vez de resolverse en silencio**:
    # `docs/PROPUESTA-2026-09-30-citas-de-spec-en-el-pen.md`.
    #
    # La exención es por el TEXTO EXACTO: si alguien lo cambia, deja de coincidir
    # y el chequeo vuelve a saltar. Es lo que la hace una decisión y no un hueco.
    "ocultar no es permitir (§3.3)",
    "§5 gobierna esta lista",
]


def cadenas(texto: str):
    """Lo que puede llegar al DOM de un `.tsx`, con su línea.

    **Los comentarios se sacan antes** —ahí la razón técnica es exactamente lo
    que hace falta, y es adonde se la mudó— y también los `import`.

    ── Y EL TEXTO SUELTO ENTRE ETIQUETAS TAMBIÉN CUENTA · 2026-09-30 ───────────

    La primera versión miraba **sólo literales entre comillas**, y con eso se le
    escapaba lo más directo que existe: el texto escrito derecho dentro del JSX.

        <Note as="div">
          El backend no envía el payload · ocultar no es permitir (§3.3)
        </Note>

    Eso se pinta igual que una cadena y no lleva una sola comilla. **Lo encontró
    la auditoría de A2, no el chequeo** — que es la mitad del trabajo que un
    chequeo nuevo no hace todavía: cubrir la forma que su autor no usó.
    """
    sin_bloque = re.sub(r"/\*.*?\*/", lambda m: "\n" * m.group().count("\n"), texto, flags=re.S)
    sin_llaves = re.sub(r"\{/\*.*?\*/\}", lambda m: "\n" * m.group().count("\n"), sin_bloque, flags=re.S)
    for n, linea in enumerate(sin_llaves.splitlines(), 1):
        sin_linea = re.sub(r"//.*$", "", linea)
        if sin_linea.lstrip().startswith("import"):
            continue
        for m in re.finditer(r"'([^'\\]{6,})'|\"([^\"\\]{6,})\"|`([^`\\$]{6,})`", sin_linea):
            yield n, m.group(1) or m.group(2) or m.group(3), linea
        # **El texto suelto del JSX**: una línea que no abre etiqueta, no es
        # código y tiene letras. Es deliberadamente conservador —una línea que
        # empieza con `<`, `{`, `}` o una palabra clave se saltea— porque un
        # falso positivo acá cuesta más que un hueco: el chequeo está en la
        # puerta y nadie mantiene uno que grita.
        crudo = sin_linea.strip()
        if (
            len(crudo) >= 8
            and not crudo.startswith(("<", "{", "}", "/", "*", ")", "]"))
            and not re.match(r"^(?:const|let|var|return|export|import|function|if|for|type|interface|case)\b", crudo)
            and re.search(r"[A-Za-zÁÉÍÓÚÑáéíóúñ]{3}", crudo)
            and "=" not in crudo
            and ";" not in crudo
        ):
            yield n, crudo, linea


def main() -> int:
    if not SUPERFICIES.is_dir():
        print("copy-producto ⊘ BLOQUEADO · no existe src/surfaces/")
        return 2

    archivos = sorted(SUPERFICIES.rglob("*.tsx"))
    if not archivos:
        print("copy-producto ⊘ BLOQUEADO · no hay componentes en src/surfaces/")
        return 2

    fallas = []
    revisadas = 0
    for f in archivos:
        for n, cadena, linea in cadenas(f.read_text(encoding="utf-8")):
            revisadas += 1
            if any(e in linea for e in EXENTAS):
                continue
            for patron, que in PROHIBIDO:
                if patron.search(cadena):
                    rel = f.relative_to(RAIZ)
                    fallas.append(f"{rel}:{n} · {que} en una cadena\n       «{cadena[:96]}»")
                    break

    if fallas:
        print(f"copy-producto ✗ {len(fallas)} cadena(s) con vocabulario interno\n")
        for x in fallas:
            print(f"  ✗ {x}")
        print(
            "\n  Lo que falta SE SIGUE DECLARANDO: lo que cambia es a quién se le habla.\n"
            "  La razón técnica va al comentario, que es donde le sirve a quien lo\n"
            "  va a construir. Ver docs/AUDITORIA-2026-09-30-usabilidad.md §1.1."
        )
        return 1

    print(
        f"copy-producto ✓ {revisadas} cadenas de {len(archivos)} componentes · "
        f"ninguna nombra plomería"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
