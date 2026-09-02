#!/usr/bin/env python3
"""design-lint · las 15 reglas de `handoff/design-lint.md`, sobre Tailwind · F0.11

No es un linter de estilo: no opina sobre formato, orden de imports ni nombres.
Verifica conformidad mecánica con §9 de `parametros-front.md` y nada más.

    python3 tools/design-lint.py

── QUÉ CAMBIA AL REAPUNTARLO A TAILWIND ──────────────────────────────────────

En v2 las reglas de color y tipografía se verificaban sobre `.module.css`: un
`#FF5A1F` o un `letter-spacing: 0.12em` estaban en una hoja de estilos y se leían
ahí. Acá el estilo vive en el atributo `class` del JSX, así que **cada detector
de color, alto y label mira utilidades**. Tres consecuencias concretas:

  · **La paleta por defecto de Tailwind es una fuga nueva.** `bg-slate-800` no es
    un hex y aun así se salta el sistema de tokens exactamente igual: no invierte
    con el tema y no sale del `.pen`. En v2 esta violación no podía existir
    —no había paleta ajena que usar—; acá está a una tecla de distancia y por eso
    L1 la persigue con el mismo rigor que a un hex literal.

  · **`bg-amber-400` hace de L3 una regla con dientes.** Ámbar y amarillo están
    prohibidos, y Tailwind los trae de fábrica.

  · **Los altos arbitrarios se escriben `h-[348px]`.** Es la misma violación que
    `height: 348px` y hay que buscarla en las dos formas.

── SOBRE LA COBERTURA ────────────────────────────────────────────────────────

Una regla cuyo ámbito no tiene un solo archivo **no informa nada**, y decir que
pasó sería mentir sobre lo que se verificó. Esas salen ⏸ SIN COBERTURA y el
chequeo termina en 2 (BLOQUEADO), no en 0. Hoy es el caso de casi todo `render/`,
que se llena con F1.13.

Excepciones: una línea puede llevar `design-lint-ok: LN · razón` y esa regla la
salta en esa línea, o en el comentario que la precede. **L1 no admite excepción**
y el comentario no la salva: si hace falta un color nuevo, se agrega como token.

Códigos: 0 conforme · 1 violación · 2 alguna regla sin cobertura.
"""
import pathlib
import re
import sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent
SRC = RAIZ / "src"
EXT = {".ts", ".tsx", ".css", ".js", ".jsx"}

SIN_EXCEPCION = {"L1"}

# Código generado. No se audita, y no por comodidad: un hallazgo acá apunta a un
# archivo que nadie puede corregir —la corrección va en la fuente— y su
# integridad ya la verifican `token-drift` y `contract-drift`, que comparan
# contra esa fuente. Auditarlo además produce hallazgos como «vocabulario de
# infraestructura» sobre la palabra `schema` de OpenAPI.
GENERADOS = ("tokens/tokens.", "api/generated.ts")

# span(1) = 96·1 − 16 = 80. Es la altura de panel más chica que existe.
FILA_MINIMA = 80

# La paleta que Tailwind trae de fábrica. Ninguna es token del `.pen`.
PALETA_AJENA = (
    "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|"
    "teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose"
)
PROP_COLOR = (
    "bg|text|border|fill|stroke|ring|from|via|to|outline|decoration|accent|"
    "caret|shadow|divide|placeholder"
)

REGLAS = []


def regla(id_, razon, ambito=(), excluir=()):
    def envoltura(fn):
        REGLAS.append((id_, razon, tuple(ambito), tuple(excluir), fn))
        return fn

    return envoltura


def sin_comentarios(texto):
    """Reemplaza el contenido de los comentarios por espacios, conservando los
    saltos de línea y las posiciones.

    Sin esto el lint se encuentra a sí mismo: un comentario que explica por qué
    algo NO es una violación queda reportado como violación. Los espacios
    conservan el número de línea, así que el hallazgo sigue apuntando al renglón
    correcto y el marcador `design-lint-ok:` se busca sobre el texto original."""
    salida = []
    i, n = 0, len(texto)
    comilla = None
    while i < n:
        c = texto[i]
        if comilla:
            salida.append(c)
            if c == "\\" and i + 1 < n:
                salida.append(texto[i + 1])
                i += 2
                continue
            if c == comilla:
                comilla = None
            i += 1
            continue
        if c in "\"'`":
            comilla = c
            salida.append(c)
            i += 1
            continue
        if texto.startswith("/*", i):
            fin = texto.find("*/", i + 2)
            fin = n if fin == -1 else fin + 2
            salida.append("".join(ch if ch == "\n" else " " for ch in texto[i:fin]))
            i = fin
            continue
        if texto.startswith("//", i):
            fin = texto.find("\n", i)
            fin = n if fin == -1 else fin
            salida.append(" " * (fin - i))
            i = fin
            continue
        salida.append(c)
        i += 1
    return "".join(salida)


def cadenas(texto):
    """(nº de línea, contenido, es_indice) de cada string literal del archivo.

    `es_indice` marca la forma `algo['clave']`, que es un acceso por corchetes y
    NUNCA una frase que alguien vaya a leer: `components['schemas']`,
    `Schemas['Metrica']`, `payload['valor']`. Las reglas que hablan de «strings
    visibles al usuario» —L7 y L11— las saltan.

    En v2 esta distinción no hacía falta porque el único archivo con esa forma
    era generado y quedaba fuera de auditoría. Acá `api/types.ts` se escribe a
    mano —le pone nombre a lo generado— y L11 lo marcaba por la palabra
    `schemas` de OpenAPI, que es justo el caso que la propia regla excluye."""
    for n, linea in enumerate(texto.splitlines(), 1):
        for m in re.finditer(
            r'"([^"\\]*(?:\\.[^"\\]*)*)"|\'([^\'\\]*(?:\\.[^\'\\]*)*)\'|`([^`]*)`', linea
        ):
            antes = linea[: m.start()].rstrip()
            despues = linea[m.end():].lstrip()
            es_indice = antes.endswith("[") and despues.startswith("]")
            yield n, next(g for g in m.groups() if g is not None), es_indice


def lineas(texto):
    return enumerate(texto.splitlines(), 1)


# ── L1 ────────────────────────────────────────────────────────────────────────
@regla(
    "L1",
    "reglas duras 1 y 2: un color fuera de tokens/ no invierte y desaparece en tema claro",
    excluir=("tokens/",),
)
def l1(ruta, texto):
    for n, linea in lineas(texto):
        for m in re.finditer(r"#[0-9A-Fa-f]{3,8}\b", linea):
            yield n, f"hex literal {m.group(0)} · todo color sale de src/tokens/"
        # La fuga que Tailwind agrega: su paleta de fábrica no sale del `.pen`,
        # no invierte con el tema y no la ve `token-drift`. Es la misma
        # violación que el hex, escrita más corto.
        m = re.search(rf"\b({PROP_COLOR})-({PALETA_AJENA})-\d{{2,3}}\b", linea)
        if m:
            yield n, (
                f"utilidad de la paleta de Tailwind '{m.group(0)}' · no es un token "
                "del .pen, no invierte con el tema y token-drift no la ve"
            )


# ── L2 ────────────────────────────────────────────────────────────────────────
@regla("L2", "regla dura 1: el naranja no es color de datos",
       ambito=("render/plots/", "render/bodies/"))
def l2(ruta, texto):
    """§ANCLA:COLOR-2 · §2.1 de design.md: «El naranja no es color de datos.»

    El acento vive en CTAs, estado activo y enlaces — no en una serie.

    Dos formas: dentro de una estructura de color (el array de la paleta de
    series) y como utilidad de Tailwind aplicada a una marca de datos
    —`fill-acc` en una barra, `stroke-acc` en una línea. El shell usa `acc`
    legítimamente para el CTA de drill-down y por eso queda fuera del ámbito."""
    for n, linea in lineas(texto):
        if re.search(r"(color|palet|serie|fill|scale|tono)\w*\s*[:=]", linea, re.I) and re.search(
            r"\b(acc|acc-hover|on-acc)\b|--acc", linea
        ):
            yield n, "el acento dentro de una estructura de color de datos"
            continue
        m = re.search(r"\b(fill|stroke|bg|text)-acc(-hover)?\b", linea)
        if m:
            yield n, f"'{m.group(0)}' sobre una marca de datos · el acento es de CTA"


# ── L3 ────────────────────────────────────────────────────────────────────────
@regla("L3", "regla dura 2: ámbar y amarillo colisionan con el naranja de marca")
def l3(ruta, texto):
    """§ANCLA:COLOR-1 · §2.2 de design.md: «Ámbar y amarillo: prohibidos.
    Colisionan con el naranja de marca.»

    `design-lint.md` define el ámbito como «referencia a TOKEN cuyo nombre
    contenga amber, yellow, warn, amarillo». El `warn` de esa lista es un token
    de color de aviso —el que el sistema no tiene— y no el método de consola:
    `console.warn(` es provablemente un log, no un color, y marcarlo empuja a
    escribir avisos con otro nombre para contentar al lint. Se excluye la
    llamada a método, nada más: `--color-warn`, `bg-warn` y `warnColor` siguen
    cayendo.
    """
    for n, linea in lineas(texto):
        for m in re.finditer(r"\b\w*(amber|yellow|warn|amarillo)\w*\b", linea, re.I):
            antes = linea[: m.start()].rstrip()
            despues = linea[m.end():].lstrip()
            if antes.endswith(".") and despues.startswith("("):
                continue
            yield n, f"referencia a '{m.group(0)}' · ámbar y amarillo están prohibidos"


# ── L4 ────────────────────────────────────────────────────────────────────────
@regla("L4", "regla dura 3: el signo comunica dirección · el color no")
def l4(ruta, texto):
    """Ámbito por nombre, como pide el documento: delta, variación,
    comparativo, trend."""
    if not re.search(r"delta|variacion|variación|comparativo|trend", ruta.name, re.I) and not (
        re.search(r"delta|comparativo", texto, re.I)
    ):
        return
    for n, linea in lineas(texto):
        # `x > 0 ? algo : otro` aplicado a algo que huele a color, en cualquiera
        # de sus dos escrituras: propiedad de estilo o utilidad de Tailwind.
        if re.search(r"(delta|valor|value|v)\s*[<>]\s*0\s*\?", linea) and re.search(
            r"color|fill|fam-|--acc|stroke|\btext-|\bbg-", linea, re.I
        ):
            yield n, "condicional de color según el signo del delta"


# ── L5 · dos detectores ───────────────────────────────────────────────────────
@regla("L5", "regla dura 5: sin BASE y sin PROCEDENCIA el panel no se renderiza",
       ambito=("render/Panel/",))
def l5_shell(ruta, texto):
    """El shell tiene que nombrar los cuatro campos de la anatomía obligatoria.
    Se verifica sobre el conjunto de `render/Panel/`, no archivo por archivo: la
    procedencia vive en su propio componente."""
    if ruta.name != "PanelShell.tsx":
        return
    vecinos = "".join(p.read_text(encoding="utf-8") for p in ruta.parent.glob("*.tsx"))
    for campo in ("base", "capa", "fuente", "frescura"):
        if campo not in vecinos:
            yield 1, f"el shell no nombra '{campo}' · la anatomía de §4.1 lo exige"


@regla("L5", "regla dura 5: un cuerpo sin shell pierde título, BASE y procedencia",
       ambito=("surfaces/",))
def l5_surfaces(ruta, texto):
    """Marca a quien RENDERIZA un cuerpo sin shell, no a quien importa de la
    carpeta.

    El detector de v2 buscaba cualquier `from '.../render/bodies/'` y eso
    produce un falso positivo en cuanto una superficie importa `preloadBodies`,
    que solo dispara la descarga del chunk y no puede renderizar nada. Pasó con
    `ConsoleContainer`, que precarga y delega el montaje en `PanelInGrid`.

    Lo que sí monta un cuerpo es `bodyFor()` o un `*Body` importado directo.
    """
    for n, linea in lineas(texto):
        importa = re.search(r"from\s+['\"][^'\"]*render/bodies", linea)
        if importa is None:
            continue
        monta = re.search(r"\bbodyFor\b|\b[A-Z]\w*Body\b", linea)
        if monta is None:
            continue
        if "PanelShell" not in texto and "<Panel" not in texto:
            yield n, "monta un cuerpo sin envolverlo en el shell"
        return


# ── L6 ────────────────────────────────────────────────────────────────────────
@regla("L6", "regla dura 4: ningún número desnudo · toda cifra pasa por <Value>",
       ambito=("render/bodies/",))
def l6(ruta, texto):
    """Un cuerpo que imprime una cifra sin `<Value>` la deja sin label.

    Se verifica por el import y no analizando cada expresión: si el cuerpo no
    trae `<Value>`, cualquier número que pinte está desnudo. Es la decisión de
    §4 que abarata el lint. Una cifra que el backend manda ya formateada —el
    pilar de `prosa`, que llega como «USD 4.28M»— cumple igual si va con
    `<Label>`: lo que se verifica es que pase por alguno de los dos caminos."""
    if not ruta.name.endswith("Body.tsx"):
        return
    if "Value" in texto or "Label" in texto:
        return
    if re.search(r"\{\s*\w+\.(v|valor|total|monto)\b", texto):
        yield 1, "pinta una cifra sin <Value> ni <Label> · quedaría desnuda"


# ── L7 ────────────────────────────────────────────────────────────────────────
@regla("L7", "regla dura 9: el layout se declara, no se escribe",
       ambito=("render/",), excluir=("render/plots/core/",))
def l7(ruta, texto):
    for n, linea in lineas(texto):
        if re.search(r"\[\s*(-?[\d.]+\s*,\s*){3,}-?[\d.]+\s*\]", linea):
            yield n, "array de más de tres números literales · el dato llega por props"
    for n, cadena, es_indice in cadenas(texto):
        if es_indice:
            continue
        m = re.search(r"\$[\d,.]{4,}|\b[\d.,]{4,}\s?%", cadena)
        if m:
            yield n, f"cifra formateada en el código: '{m.group(0)}'"


# ── L8 ────────────────────────────────────────────────────────────────────────
@regla("L8", "§3: toda altura de panel es un rowSpan · px = 96·N − 16",
       ambito=("render/", "surfaces/"))
def l8(ruta, texto):
    def reportable(px):
        # Por debajo de 80 no puede ser la altura de un panel: `span(1)` ya son
        # 80px. Lo que hay ahí abajo son bullets, barras de esqueleto, bordes y
        # el `min-height: 0` de flexbox. Y `px % 96 == 80` es un span válido
        # escrito a mano: L8 igual lo prefiere vía grid.ts, pero no es un bug.
        return px >= FILA_MINIMA and px % 96 != 80

    for n, linea in lineas(texto):
        # Forma 1 · propiedad de estilo.
        #   (?<![\w-])  · `line-height: 1.05` no es una altura de 1px
        #   solo `:`    · `height="12"` es un atributo de SVG, no una altura de
        #                 panel
        #   sin `%`     · `height: 100%` es relativo al contenedor, que es justo
        #                 lo que la grilla quiere. Igual `100vh`, que es la
        #                 ventana: las dos se leían como 100px
        m = re.search(
            r"(?<![\w-])(height|min-height|max-height|minHeight|maxHeight|alto)"
            r"\s*:\s*['\"]?(\d+)(px|%|vh|vw|rem|em|ch)?['\"]?",
            linea,
        )
        if m and m.group(3) in (None, "px") and reportable(int(m.group(2))):
            yield n, f"altura literal {m.group(2)}px · toda altura pasa por grid.ts"

        # Forma 2 · el valor arbitrario de Tailwind, que es como se escribe acá.
        for m in re.finditer(r"\b(?:min-|max-)?h-\[(\d+)px\]", linea):
            if reportable(int(m.group(1))):
                yield n, f"utilidad '{m.group(0)}' · toda altura pasa por grid.ts"


# ── L9 ────────────────────────────────────────────────────────────────────────
@regla("L9", "§4: un kpi a 12 columnas es un error de composición")
def l9(ruta, texto):
    """Los spans de cada tipo salen de la tabla de bloques y los valida el
    backend en `layout:validate`. Lo que el lint verifica es que **nadie los
    escriba a mano** en el front: un rango duplicado se separa del contrato en
    cuanto el contrato cambia."""
    if "blocks" in ruta.name.lower():
        return
    for n, linea in lineas(texto):
        if re.search(r"colSpan\s*:\s*\[\s*\d+\s*,\s*\d+\s*\]", linea):
            yield n, "rango de span escrito a mano · sale de /config/blocks, que es el contrato"


# ── L10 ───────────────────────────────────────────────────────────────────────
@regla("L10", "regla dura 6: un pronóstico sin banda no se publica", ambito=("render/",))
def l10(ruta, texto):
    """Todo lo que toca `serieConBanda` o `escalarConIntervalo` tiene que nombrar
    la banda. Un plot que acepta esas formas y no dibuja `lo`/`hi` es una
    estimación puntual disfrazada."""
    if "serieConBanda" not in texto and "escalarConIntervalo" not in texto:
        return
    if "Band" in texto or ("lo" in texto and "hi" in texto) or "intervalo" in texto.lower():
        return
    yield 1, "acepta una forma con intervalo y no nombra la banda"


# ── L11 ───────────────────────────────────────────────────────────────────────
@regla("L11", "regla dura 10: se declara la consecuencia, no la plomería")
def l11(ruta, texto):
    """Solo texto que llega a pantalla. `components['schemas']` es un índice de
    tipo y no una frase que alguien vaya a leer."""
    patron = re.compile(r"warehouse|snowflake_role|grant|DB_BT_|schema|private_key|kms", re.I)
    for n, cadena, es_indice in cadenas(texto):
        if es_indice:
            continue
        m = patron.search(cadena)
        if m:
            yield n, (
                f"vocabulario de infraestructura '{m.group(0)}' en un string visible · "
                "excepción: la lista de subprocesadores de A2, que es obligación legal"
            )


# ── L12 ───────────────────────────────────────────────────────────────────────
@regla("L12", "regla dura 11: una cifra fuera de Synapse pierde BASE, procedencia y dirección",
       ambito=("surfaces/console/",))
def l12(ruta, texto):
    patron = re.compile(
        r"window\.print|@media print|toBlob|toDataURL|downloadURI|saveAs|application/pdf|text/csv"
    )
    for n, linea in lineas(texto):
        m = patron.search(linea)
        if m:
            yield n, f"'{m.group(0)}' · la consola del cliente no exporta ni imprime"


# ── L13 ───────────────────────────────────────────────────────────────────────
@regla("L13", "un panel se ancla a un metricId, jamás a un SQL")
def l13(ruta, texto):
    for n, cadena, _ in cadenas(texto):
        if re.search(r"\bSELECT\b.+\bFROM\b", cadena, re.I):
            yield n, "SQL en un string · el panel se ancla a un metricId"


# ── L14 ───────────────────────────────────────────────────────────────────────
@regla("L14", "render/ recibe datos por props: es lo que deja al panel servir mock, API y builder",
       ambito=("render/",))
def l14(ruta, texto):
    """`import type` NO cuenta, y no es una excepción tolerada: es la regla.

    El panel recibe el payload por props y la forma de esas props es `Payload`,
    que vive en `api/types.ts`. Sin importar ese tipo no hay manera de tiparlo.
    Lo que la frontera impide es la dependencia en tiempo de ejecución —el
    cliente, el fetch, el cache—, y un `import type` se borra al compilar: con
    `verbatimModuleSyntax` ni siquiera llega al bundle."""
    for n, linea in lineas(texto):
        if re.search(r"^\s*import\s+type\b", linea):
            continue
        if re.search(r"""from\s+['"](\.\./)*api[/'"]|from\s+['"]@/api""", linea):
            yield n, "import de valor desde api/ · render/ no cruza esa frontera"


# ── L15 ───────────────────────────────────────────────────────────────────────
@regla("L15", "regla dura 4 y §2.3: todo label es mono, mayúsculas y 0.12em",
       ambito=("render/",), excluir=("render/primitives/", "render/plots/core/"))
def l15(ruta, texto):
    """`<Label>` es el único camino para un label.

    NO alcanza con buscar `0.12em`: §2.3 le da ese mismo tratamiento a badges y
    botones —«VER DETALLE», «RECONECTAR SNAPSHOT»—, que no son labels y viven
    legítimamente con sus utilidades. Lo que se marca es el componente que se
    arma un label inline en vez de importar el que existe: bajo Tailwind eso es
    la tripleta `font-mono` + `uppercase` + `tracking-[0.12em]` suelta en el
    JSX."""
    if ruta.suffix != ".tsx":
        return
    for n, linea in lineas(texto):
        if re.search(r"<label[\s>]", linea):
            yield n, "<label> nativo · el label del producto es <Label>"
        if "Label" in texto:
            continue
        if "font-mono" in linea and ("uppercase" in linea or "tracking-[0.12em]" in linea):
            yield n, "arma un label inline con utilidades en vez de importar <Label>"


def exenta(renglones, limpios, n, id_):
    """La marca vale en la línea del hallazgo o en el comentario que la precede.

    La razón de una excepción rara vez entra en una línea, y obligarla a
    convivir con el código produce comentarios telegráficos o excepciones sin
    explicar — que es peor que la violación."""
    if id_ in SIN_EXCEPCION:
        return False
    patron = rf"design-lint-ok:\s*{id_}\b"
    if re.search(patron, renglones[n - 1]):
        return True
    for i in range(n - 2, max(-1, n - 8), -1):
        era_comentario = limpios[i].strip() == "" and renglones[i].strip() != ""
        if not era_comentario:
            break
        if re.search(patron, renglones[i]):
            return True
    return False


def main():
    if not SRC.exists():
        print("design-lint ⊘ BLOQUEADO · src/ no existe")
        return 2

    archivos = sorted(p for p in SRC.rglob("*") if p.suffix in EXT and p.is_file())
    hallazgos = []
    generados = 0
    vistos = {}  # id de regla → archivos sobre los que efectivamente corrió

    for id_, _, _, _, _ in REGLAS:
        vistos.setdefault(id_, 0)

    for ruta in archivos:
        rel = ruta.relative_to(RAIZ).as_posix()
        dentro = ruta.relative_to(SRC).as_posix()
        crudo = ruta.read_text(encoding="utf-8")
        texto = sin_comentarios(crudo)
        renglones = crudo.splitlines()
        limpios = texto.splitlines()

        if any(g in dentro for g in GENERADOS):
            generados += 1
            continue

        for id_, razon, ambito, excluir, fn in REGLAS:
            if ambito and not any(dentro.startswith(a) for a in ambito):
                continue
            if any(dentro.startswith(e) for e in excluir):
                continue
            vistos[id_] += 1
            for n, detalle in fn(ruta, texto):
                if n <= len(renglones) and exenta(renglones, limpios, n, id_):
                    continue
                hallazgos.append((id_, rel, n, detalle, razon))

    sin_cobertura = sorted(id_ for id_, cuenta in vistos.items() if cuenta == 0)

    print(
        f"design-lint · {len(archivos) - generados} archivos · "
        f"{len(vistos) - len(sin_cobertura)} de {len(vistos)} reglas con cobertura"
        + (f" · {generados} generados sin auditar" if generados else "")
    )
    print()

    for id_, rel, n, detalle, razon in hallazgos:
        print(f"  {id_}  {rel}:{n}")
        print(f"      {detalle}")
        print(f"      → {razon}\n")

    if sin_cobertura:
        print("  Reglas sin un solo archivo en su ámbito. NO se verificó nada con ellas:")
        for id_ in sin_cobertura:
            ambitos = next(a for i, _, a, _, _ in REGLAS if i == id_) or ("src/",)
            print(f"    ⏸  {id_}  ámbito vacío: {', '.join(ambitos)}")
        print("      Se llenan con F1.13 · el traslado de render/.")
        print()

    if hallazgos:
        print(f"design-lint ✗ {len(hallazgos)} violación(es)")
        return 1
    if sin_cobertura:
        print(
            f"design-lint ⊘ BLOQUEADO · 0 violaciones, pero {len(sin_cobertura)} "
            "regla(s) no verificaron nada"
        )
        return 2
    print(f"design-lint ✓ {len(vistos)} reglas conformes")
    return 0


if __name__ == "__main__":
    sys.exit(main())
