#!/usr/bin/env python3
"""Genera `src/tokens/tokens.css` y `tokens.ts` desde el `.pen` · F0.12

    python3 tools/gen-tokens.py [--check]

**El `.pen` es la fuente. Este script no decide valores: los traduce.** Si un
token está mal se corrige en el `.pen` y se regenera; editar la salida a mano se
pierde en la próxima corrida, que es deriva silenciosa.

── POR QUÉ LA PROSA VIVE ACÁ ─────────────────────────────────────────────────

`tokens.css` son ~195 líneas y casi la mitad es prosa: por qué `@theme static`
no es opcional, de dónde sale cada tamaño de la escala tipográfica, y **los
marcadores `§ANCLA:RADIO-1` y `§ANCLA:TIPO-2`, que `spec-anclas` lee del
archivo**. Un generador que escribe el archivo entero se los lleva puestos y la
puerta se pone roja en dos anclas.

Las salidas eran tres —mover la prosa al generador, partir el archivo en uno
generado y uno escrito a mano, o respetar bloques marcados— y se eligió la
primera. La razón: **el generador ya es el lugar donde vive el porqué de cada
traducción.** El comentario que explica que el tracking va en `em` y no en px
está describiendo una decisión de este script; tenerlo en el CSS lo dejaba lejos
del código que la toma. Las otras dos salidas dejan dos archivos que hay que
mantener sincronizados, que es el problema que el generador viene a resolver.

── LAS CUATRO TRADUCCIONES ───────────────────────────────────────────────────

Ninguna decide un valor. Todas son de formato, y todas están verificadas por
`token-drift`:

  · **El espacio de nombres de Tailwind.** El `.pen` dice `panel`, el CSS dice
    `--color-panel`, porque es el prefijo lo que hace que exista `bg-panel`.

  · **La unidad, que no es la misma para todos.** Un tamaño va en px, un
    tracking en em —para que escale con el tamaño, que es lo que hace que
    0.12em signifique lo mismo a 9 y a 10— y una altura de línea sin unidad.

  · **El respaldo tipográfico.** El `.pen` guarda una familia sola; en CSS eso
    deja la página sin texto si la fuente no cargó. Se emite el nombre del
    `.pen` PRIMERO y detrás la pila.

  · **`sp-1..6` colapsa a `--spacing`.** El `.pen` declara los seis pasos;
    Tailwind los deriva de uno solo. El script verifica que la escala siga
    siendo 4·N antes de colapsarla — si alguien pusiera `sp-3 = 14`, `p-3`
    dejaría de ser ese valor y el colapso mentiría.

Códigos: 0 escrito (o sin cambios con --check) · 1 hay deriva (--check).
"""
import json
import os
import pathlib
import re
import sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent
DESTINO = RAIZ / "src" / "tokens"


def fuente(variable, nombre):
    if os.environ.get(variable):
        return pathlib.Path(os.environ[variable]).expanduser()
    local = RAIZ / "design" / nombre
    return local if local.exists() else RAIZ.parent / "synapse_v2" / "design" / nombre


PEN = fuente("SYNAPSE_PEN", "Synapse_v2.pen")

AVISO = "GENERADO por tools/gen-tokens.py desde design/Synapse_v2.pen · NO EDITAR A MANO"
BASE_ESPACIADO = 4

# La pila de respaldo. No son tokens: son la red bajo el token cuando la fuente
# no cargó. El primer nombre de cada pila sale siempre del `.pen`.
RESPALDO = {
    "font-display": "ui-sans-serif, system-ui, sans-serif",
    "font-body": "ui-sans-serif, system-ui, sans-serif",
    "font-mono": "ui-monospace, 'SF Mono', Menlo, monospace",
}

# (prefijo en el `.pen`, prefijo en el CSS, unidad, prosa que encabeza la
# sección). El ORDEN es el del archivo emitido, y es a propósito que no sea el
# del `.pen`: así reordenar variables en el diseño no reordena el CSS.
SECCIONES = [
    ("font-", "--font-", None, "  /* Tipografía. */"),
    ("ts-", "--text-", "px", """  /* Escala tipográfica · §2.3 de design.md.

     §ANCLA:TIPO-2 · «Ningún otro tamaño mono.» La escala mono tiene CUATRO
     roles y son estos cuatro: nota 9, label 10, cifra 11, celda 12. Lo que los
     separa no es el tamaño sino si el texto es un rótulo o una cifra —«un
     rótulo se abre para leerse a tamaño chico, una cifra no, porque el tracking
     separa los dígitos y rompe la comparación de columna a columna»—, y por eso
     el tracking va con los dos primeros y con ninguno de los otros dos.

     Los tres tamaños que no son mono no salen de una tabla de §2.3 —design.md
     no los declara— sino del censo de nodos del `.pen`: cuerpo 13 (98 nodos),
     título de panel 15 en display (26 nodos), título de superficie 20. Están
     anotados en docs/F1.28-escala-tipografica.md con esa procedencia, que no es
     la misma que la de los mono. */"""),
    ("tk-", "--tracking-", "em", """  /* Tracking en `em` y no en px, que es lo que lo hace un token y no una
     medida: el `.pen` guarda 1.2 sobre el label de 10px y 1.08 sobre la nota
     de 9px, y los dos son el mismo 0.12em. Declarado una vez, sirve a los dos.

     `rotulo` cubre los dos roles de rótulo —label y nota—; `titulo` es el
     -0.02em que §2.3 le da a Space Grotesk. El KPI lleva el suyo, más apretado:
     en el `.pen` sus nodos están en -1.1px sobre 40px, que es el valor modal de
     siete de trece. El port lo trajo como -0.01em, que no salía de ninguna
     fuente. La propuesta de normalizarlo está en B0.9, pregunta 10. */"""),
    ("lh-", "--leading-", "", """  /* Altura de línea sin unidad, que es como se multiplica por el tamaño en vez
     de fijarlo. */"""),
    ("r-", "--radius-", "px", """  /* Radio · 10px en paneles (`rounded-xl`), 2px en barras y bullets
     (`rounded-xs`).
     §ANCLA:RADIO-1 · §2.1 de design.md: «Radio. 10px en paneles, 2px en barras
     y bullets de datos. Sin excepciones.» */"""),
    ("brand-", "--color-brand-", None, """  /* Marca · §1.5 los excluye del producto. Existen para la hoja de
     identidad; ninguna pantalla los referencia. */"""),
]

PROSA_ESPACIADO = """  /* Espaciado. La escala del `.pen` es 4·N, que es exactamente la de
     Tailwind con base 4px: `p-6` son los 24px de padding interno de panel. */"""

PROSA_SUPERFICIES = """  /* Superficies, texto y washes · valores de TEMA OSCURO, que es el defecto:
     sin atributo la consola se ve como el `.pen`, cuyas pantallas están
     fijadas a Mode:Dark. */"""

PROSA_FAMILIAS = """  /* Familias cromáticas. Solo para datos: la familia se lee del catálogo y
     NUNCA se elige en el componente · regla dura 1 de design.md. */"""

CABECERA = f"""/* {AVISO}
 *
 * Los tokens del `.pen`, traducidos al espacio de nombres de Tailwind v4.
 * `--color-*` genera las utilidades de color (`bg-panel`, `text-ink`,
 * `border-w2`, `stroke-c-grid`), `--font-*` y `--text-*` las de tipografía y
 * `--radius-*` las de radio. El nombre del token no cambia: solo se le antepone
 * el espacio que Tailwind exige para generar la utilidad.
 *
 * El porqué de cada traducción está en la cabecera del generador, no acá: es
 * una decisión de ese script y tenerla lejos del código que la toma fue lo que
 * F0.12 vino a arreglar.
 */

@import 'tailwindcss';
@import './fonts.css';
@import './base.css';

/* `static` NO es opcional acá. Sin él Tailwind v4 poda del `:root` toda
   variable que ninguna utilidad mencione por escrito, y las rampas de familia
   se arman en RUNTIME —`var(--color-fam-${{familia}}-1)` desde el plot, con la
   familia que vino del catálogo—, así que el escáner no las ve nunca.
   Verificado el 2026-08-31: sin `static` sobrevivían 6 de 43 tokens, y el tema
   oscuro se quedaba sin una sola familia cromática. El bloque de tema claro sí
   sobrevivía, porque es CSS plano fuera de `@theme`: el resultado era que los
   colores de datos existían en claro y no en oscuro. */"""


def leer():
    """(por_tema, planos), conservando el orden del `.pen` dentro de cada uno."""
    variables = json.loads(PEN.read_text(encoding="utf-8"))["variables"]
    por_tema, planos = {}, {}
    for nombre, var in variables.items():
        valor = var["value"]
        if isinstance(valor, list):
            por_tema[nombre] = {e["theme"]["Mode"]: e["value"] for e in valor}
        else:
            planos[nombre] = (var["type"], valor)
    return por_tema, planos


def valor_css(nombre, tipo, valor, unidad):
    if tipo == "string":
        respaldo = RESPALDO.get(nombre)
        return f"'{valor}', {respaldo}" if respaldo else f"'{valor}'"
    if tipo == "number":
        return f"{valor}{unidad}"
    return str(valor).lower()


def declaraciones(pares):
    return "\n".join(f"  {k}: {v};" for k, v in pares)


def espaciado(planos):
    """Verifica la escala 4·N y la colapsa en `--spacing`."""
    pasos = {n: v for n, (_, v) in planos.items() if n.startswith("sp-")}
    for nombre, valor in sorted(pasos.items()):
        esperado = BASE_ESPACIADO * int(nombre.split("-")[1])
        if valor != esperado:
            raise SystemExit(
                f"✗ '{nombre}' vale {valor} y no {esperado}: la escala del `.pen` dejó de "
                f"ser 4·N, así que `--spacing: {BASE_ESPACIADO}px` ya no la deriva. "
                f"No se colapsa a ciegas."
            )
    return f"  --spacing: {BASE_ESPACIADO}px;"


def generar_css(por_tema, planos):
    partes = [CABECERA, "@theme static {"]

    usados = set()
    for prefijo, destino, unidad, prosa in SECCIONES:
        pares = [
            (destino + n[len(prefijo):], valor_css(n, t, v, unidad))
            for n, (t, v) in planos.items()
            if n.startswith(prefijo)
        ]
        if not pares:
            continue
        usados.update(n for n in planos if n.startswith(prefijo))
        # El espaciado va entre el radio y la marca, donde lo dejó el port.
        if destino == "--color-brand-":
            partes.append(PROSA_ESPACIADO)
            partes.append(espaciado(planos) + "\n")
            usados.update(n for n in planos if n.startswith("sp-"))
        partes.append(prosa)
        partes.append(declaraciones(pares) + "\n")

    sobran = set(planos) - usados
    if sobran:
        raise SystemExit(
            f"✗ el `.pen` trae {sorted(sobran)}, que no encaja en ninguna sección. "
            f"Un token sin sección se perdería en silencio: agregarla en SECCIONES."
        )

    superficies = [(k, v) for k, v in por_tema.items() if not k.startswith("fam-")]
    familias = [(k, v) for k, v in por_tema.items() if k.startswith("fam-")]

    partes.append(PROSA_SUPERFICIES)
    partes.append(declaraciones([(f"--color-{k}", v["Dark"].lower()) for k, v in superficies]) + "\n")
    partes.append(PROSA_FAMILIAS)
    partes.append(declaraciones([(f"--color-{k}", v["Dark"].lower()) for k, v in familias]))
    partes.append("}")

    partes.append("""
/* Los mismos nombres, otros valores. El switcher entero es
   `document.documentElement.dataset.theme = tema` — ni un byte más de JS.

   Va SIN `@layer`, así que gana sobre el `@layer theme` que emite `@theme`
   sin necesidad de `!important`. No hay bloque para `dark` porque el defecto
   ya es oscuro: al quitar `data-theme="light"` vuelven los valores de :root. */
:root[data-theme='light'] {""")
    partes.append(
        declaraciones([(f"--color-{k}", v["Light"].lower()) for k, v in por_tema.items()])
    )
    partes.append("}")
    return "\n".join(partes) + "\n"


def generar_ts(por_tema):
    superficies = [k for k in por_tema if not k.startswith("fam-")]
    union = "\n".join(f"  | '{n}'" for n in superficies)
    return f"""// {AVISO}
//
// Espejo en TypeScript de `tokens.css`. Existe para que un token se pueda
// nombrar desde TS sin escribir la cadena suelta: la familia llega del catálogo
// y el plot construye `var(--color-fam-${{familia}}-1)`, así que el nombre del
// token es parte del contrato y no un detalle de CSS.

/** Color de superficie, texto o borde. Invierte con el tema. */
export type TokenColor =
{union}

/** Los cinco escalones de una familia. El 1 es el trazo principal. */
export type FamilyStep = 0 | 1 | 2 | 3 | 4

/** La custom property de un escalón de familia.
 *
 *  Es la ÚNICA forma en que un plot debería pedir color: recibe la familia del
 *  catálogo y no sabe cuál le tocó · regla dura 1 de design.md. */
export function familyVar(family: string, step: FamilyStep = 1): string {{
  return `var(--color-fam-${{family}}-${{step}})`
}}
"""


def main():
    if not PEN.exists():
        print("gen-tokens ⊘ no hay `.pen`")
        print(f"  buscado en: {PEN}")
        return 2

    por_tema, planos = leer()
    salidas = {
        DESTINO / "tokens.css": generar_css(por_tema, planos),
        DESTINO / "tokens.ts": generar_ts(por_tema),
    }
    total = len(por_tema) + len(planos)

    if "--check" in sys.argv:
        deriva = [r for r, texto in salidas.items() if not r.exists() or r.read_text(encoding="utf-8") != texto]
        if deriva:
            print(f"gen-tokens ✗ {len(deriva)} archivo(s) difieren de lo que emite el `.pen`")
            for r in deriva:
                print(f"  ✗ {r.relative_to(RAIZ)}")
            print("\n  Se corrige con `npm run gen:tokens`. Si el cambio era intencional,")
            print("  va en el `.pen` o en este generador — no en la salida.")
            return 1
        print(f"gen-tokens ✓ {total} tokens · la salida coincide con el `.pen`")
        return 0

    for ruta, texto in salidas.items():
        ruta.write_text(texto, encoding="utf-8")
    print(f"gen-tokens ✓ {total} tokens · {len(por_tema)} con tema · {len(planos)} fijos")
    for ruta in salidas:
        print(f"  → {ruta.relative_to(RAIZ)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
