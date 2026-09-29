#!/usr/bin/env python3
"""plan-de-trabajo.md → docs/PARA-BACKEND.md

El `.md` del plan es la FUENTE. Este documento se genera desde él y **se pisa
entero en cada corrida**: editarlo a mano es trabajo que se pierde.

── POR QUÉ SE GENERA Y NO SE ESCRIBE ────────────────────────────────────────

Porque la versión escrita a mano se venció sin que nadie lo notara. La del
2026-09-04 anunciaba como faltantes «ocho rutas que el contrato no declara», y
para el 2026-09-14 el backend ya servía todas — pero el documento seguía ahí,
diciendo que faltaban. **Un documento para otro equipo que miente es peor que no
tenerlo**: se lee, se planifica contra él, y el error aparece semanas después.

La regla es la misma que ya rige para `plan-tareas.csv`: lo que se le pide al
backend vive **en la tarea que lo espera**, y de ahí sale el documento. Así no
puede haber una tarea desbloqueada cuyo pedido siga publicado.

── EL MARCADOR ──────────────────────────────────────────────────────────────

Dentro del cuerpo de una tarea, una línea:

    **Espera del backend.** <qué falta> · <por qué bloquea>

Se recoge con el ID de la tarea, su estado y su equipo. Una tarea en `✅` con
marcador es una contradicción y el chequeo la reporta: si se cerró, ya no espera.

Códigos: 0 conforme · 1 hay marcadores en tareas cerradas · 2 BLOQUEADO.
"""
import pathlib
import os
import re
import subprocess
import sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent
PLAN = RAIZ / "plan-de-trabajo.md"
DESTINO = RAIZ / "docs" / "PARA-BACKEND.md"

ENCABEZADO = re.compile(r"^#{3,4} (➕ )?([BF]\d+\.\d+[a-j]?) (✅|⚠️|⬜|🕓) (.+)$")
ESPERA = re.compile(r"^\*\*Espera del backend\.\*\*\s*(.+)$")

# **La marca de verificación de un PEDIDO** · agregada el 2026-09-28.
MEDIDO = re.compile(r"\*\*Medido contra `([0-9a-f]{7,40})` el (\d{4}-\d{2}-\d{2})\*\*")

# **De quién es cada pedido** · agregado el 2026-09-29, y lo pidió el backend.
#
# Nos hicieron una cuenta que no cerraba: decíamos «quedan siete» en un archivo
# que se llama «lo que el front necesita del BACKEND», y **ninguno de los siete
# era código suyo** — dos eran nuestros, dos de datos, dos de despliegue y uno una
# decisión de producto. Tenían razón: leer esa lista les hacía perder tiempo
# buscando qué construir.
#
# Un pedido sin dueño se lee como si fuera de quien abre el archivo.
DUENO = re.compile(r"^\*\*Lo tiene: ([A-ZÁÉÍÓÚÑ]+)\*\*")

CABLE_REF = pathlib.Path("contracts/synapse-console-wire.yaml")


def commit_de_referencia() -> "str | None":
    """Contra qué commit leímos el backend la última vez · `None` si no se sabe.

    **Sale del cable y no de la red**, a propósito: esta herramienta corre en la
    puerta, y una puerta que necesita internet falla en un avión y en un runner
    sin credenciales. `backend-drift` sí pregunta al remoto —ese es su trabajo— y
    deja su conclusión escrita acá, en el `x-verificado-en` de cada ruta.

    **Sólo el cable de CONSOLA, y sólo si sus rutas coinciden.** Las dos cosas se
    aprendieron rompiendo el chequeo a propósito el 2026-09-28:

    - Mirar los tres cables juntaba shas viejos —el de admin tiene rutas en
      `8633b10`— y con eso **un pedido medido contra `8633b10` pasaba por
      vigente**, que es justo lo que este chequeo existe para atajar.
    - Si las rutas del cable NO coinciden, `backend-drift` está en rojo y **no
      hay contra qué comparar**. Devolver la más común sería inventar una
      referencia: se devuelve `None` y se dice que no se sabe, que es la
      convención de esta casa —⊘ BLOQUEADO antes que un verde que miente—.
    """
    if not CABLE_REF.exists():
        return None
    vistos = set(re.findall(r"x-verificado-en:\s*([0-9a-f]{7,40})",
                            CABLE_REF.read_text(encoding="utf-8")))
    return vistos.pop() if len(vistos) == 1 else None
ESTADOS = {"✅": "hecho", "⚠️": "parcial", "⬜": "pendiente", "🕓": "diferida"}


def rama_publicada() -> str:
    """La rama que el BACKEND puede buscar, no la que está montada acá.

    Decía `main` y el trabajo vivía en otra: alguien iba a ir a mirar y no iba a
    encontrar nada. Se cambió por la rama actual, y eso arregló ese caso y abrió
    otro — **que apareció el 2026-09-28 al haber dos worktrees**.

    La sesión que dibuja trabaja en `diseno-pen`, que es local. Si corriera
    `npm run plan` desde ahí, este documento diría «están en la rama
    `diseno-pen`» y el backend buscaría una rama que **no existe para ellos**. Es
    el mismo modo de falla de siempre, sólo que con un dato cierto: cierto acá y
    falso donde se lee.

    **El criterio correcto no es "cuál está montada" sino "cuál pueden buscar"**,
    y eso lo dice el upstream: una rama sin upstream no se publicó a ningún lado.

    - Con upstream → se nombra la rama, sin el `origin/`.
    - Sin upstream → **se dice que no está publicada** en vez de nombrarla. Un
      documento que manda a buscar algo inexistente es peor que uno que avisa.
    - `SYNAPSE_RAMA` lo fuerza, para el caso en que se genere desde un worktree
      a propósito.
    """
    forzada = os.environ.get("SYNAPSE_RAMA", "").strip()
    if forzada:
        return forzada

    actual = subprocess.run(
        ["git", "branch", "--show-current"], capture_output=True, text=True, cwd=RAIZ
    ).stdout.strip()
    if not actual:
        return "(rama desconocida)"

    arriba = subprocess.run(
        ["git", "rev-parse", "--abbrev-ref", "--symbolic-full-name", f"{actual}@{{upstream}}"],
        capture_output=True,
        text=True,
        cwd=RAIZ,
    )
    if arriba.returncode != 0 or not arriba.stdout.strip():
        return f"{actual} · SIN PUBLICAR, no la van a encontrar"
    # `origin/Gerardo` → `Gerardo`: lo que el backend escribe después de `git
    # fetch`, que no lleva el nombre del remoto.
    return arriba.stdout.strip().split("/", 1)[-1]


def recolectar(texto: str):
    """Recorre el plan llevando la última tarea vista, y le cuelga sus esperas.

    **La espera es un BLOQUE, no una línea.** Empezó siéndolo —«falta X»— y creció
    a decir qué hay que hacer, en orden, con los archivos. Leer solo la primera
    línea dejaba el documento del backend con el titular y sin las instrucciones.
    """
    tareas, actual, acumulando = [], None, None
    for linea in texto.split("\n"):
        if acumulando is not None:
            if linea.startswith("**Descripci") or linea.startswith("**Criterio") or ENCABEZADO.match(linea):
                actual["esperas"].append("\n".join(acumulando).strip())
                acumulando = None
            else:
                # **La marca se busca ACÁ y no después**, y eso lo encontró
                # correr el chequeo: mientras acumula, el bucle hace `continue`
                # y ninguna línea del bloque llega al final. Buscarla sólo abajo
                # daba «los once sin marca» con los once marcados.
                mm = MEDIDO.search(linea)
                if mm:
                    actual["medido"] = (mm.group(1), mm.group(2))
                dd = DUENO.match(linea)
                if dd:
                    actual["dueno"] = dd.group(1)
                acumulando.append(linea)
                continue
        m = ENCABEZADO.match(linea)
        if m:
            actual = {
                "id": m.group(2),
                "estado": ESTADOS[m.group(3)],
                "titulo": re.sub(r"`|\*\*", "", m.group(4)).split(" · 🔒")[0].strip(),
                "lado": "backend" if m.group(2)[0] == "B" else "front",
                # **El candado del título también se lleva, y antes se tiraba.**
                # Auditado el 2026-09-28: había ONCE tareas cuyo bloqueo estaba
                # escrito como `🔒` en el encabezado y no como `**Espera del
                # backend.**`, así que **este archivo no las veía** — cuatro de
                # ellas eran pedidos al backend que sólo existían en documentos.
                #
                # Se emiten aparte y sin interpretarlas: decidir cuáles son suyos
                # es un juicio, y una herramienta que lo adivine se equivoca en
                # silencio. Listarlos todos deja que lo decida quien sabe.
                "candado": (m.group(4).split(" · 🔒")[1].strip()
                            if " · 🔒" in m.group(4) else ""),
                "medido": None,
                "dueno": None,
                "esperas": [],
            }
            tareas.append(actual)
            continue
        e = ESPERA.match(linea)
        if e and actual is not None:
            acumulando = [e.group(1).strip()]
            continue
        # La marca puede venir en cualquier línea del bloque de espera; se
        # guarda aparte para juzgarla sin tocar el texto que el backend lee.
        mm = MEDIDO.search(linea)
        if mm and actual is not None:
            actual["medido"] = (mm.group(1), mm.group(2))
    if acumulando is not None and actual is not None:
        actual["esperas"].append("\n".join(acumulando).strip())
    return tareas


def render(tareas, hechas, todas=(), viejos=()) -> str:
    o = []
    o.append("# Lo que el front necesita del backend\n")
    o.append(
        "> **GENERADO.** Sale de `plan-de-trabajo.md` con `npm run plan` y se pisa\n"
        "> entero en cada corrida — editarlo a mano es trabajo que se pierde. Lo que\n"
        "> se pide vive **en la tarea que lo espera**, así que una tarea que se\n"
        "> desbloquea saca su pedido de acá sola.\n"
    )
    o.append(
        "\nCada punto dice **qué falta y por qué bloquea**, con el identificador de la\n"
        "tarea que está esperando. Los identificadores son los de\n"
        "`tareas-front-back.md`, el **ancestro común de los dos planes** — verificado\n"
        "en cada corrida de la puerta con `npm run plan:ancestro`.\n"
    )

    if hechas:
        o.append("\n---\n\n## Lo que ya está de nuestro lado\n")
        o.append(
            f"No hace falta que esperen nada de estas para probar: están en la rama\n"
            f"`{rama_publicada()}` del repositorio del front, con prueba y con la puerta en\n"
            "verde.\n"
        )
        for t in hechas:
            o.append(f"- **{t['id']}** · {t['titulo']}")

    pend = [t for t in tareas if t["estado"] != "hecho"]
    # ── QUIÉN TIENE CADA UNO · lo primero que se lee ─────────────────────────
    #
    # Antes esto decía «esperamos N» y nada más, en un archivo que se llama «lo
    # que el front necesita del backend». El 2026-09-29 nos señalaron —con razón—
    # que de siete pedidos **ninguno era código suyo**. Un pedido sin dueño se
    # lee como si fuera de quien abre el archivo.
    de_backend = [t for t in pend if (t["dueno"] or "BACKEND") == "BACKEND"]
    otros = [t for t in pend if (t["dueno"] or "BACKEND") != "BACKEND"]
    if otros:
        import collections
        por = collections.Counter(t["dueno"] for t in otros)
        o.append(
            f"\n---\n\n## Antes de leer: {len(de_backend)} de {len(pend)} son del backend\n\n"
            "**El resto está acá porque nos frena a NOSOTROS, no porque haya que\n"
            "construirlo del lado del backend.** Se listan igual —una tarea trabada\n"
            "es información— pero con el dueño adelante, para no hacer perder\n"
            "tiempo buscando qué implementar.\n"
        )
        o.append("\n| Dueño | Pedidos |\n|---|---|")
        o.append(f"| **BACKEND** · código | {len(de_backend)} |")
        for d, n_ in por.most_common():
            o.append(f"| {d} | {n_} |")
        o.append("")

    o.append(f"\n---\n\n## Lo que esperamos · {len(pend)} pedido(s)\n")
    if not pend:
        o.append("Nada. El front no está esperando ningún campo ni ninguna ruta.\n")
    for t in pend:
        o.append(f"\n### {t['id']} · {t['titulo']}")
        o.append(f"\n*Estado de la tarea: {t['estado']}.*"
                 + (f" · **Lo tiene: {t['dueno']}**" if t["dueno"] and t["dueno"] != "BACKEND" else "")
                 + "\n")
        for e in t["esperas"]:
            o.append(f"\n{e}\n")

    # ── LOS CANDADOS DEL FRONT · la sección que faltaba ──────────────────────
    #
    # Agregada el 2026-09-28 después de auditar por qué había pedidos al backend
    # que no llegaban acá. La causa era estructural: este archivo lee
    # `**Espera del backend.**` y **once tareas tenían su bloqueo escrito como
    # `🔒` en el encabezado**, que nadie leía.
    #
    # No se interpreta cuáles son suyos, y eso es deliberado: adivinarlo es un
    # juicio, y una herramienta que juzga se equivoca en silencio. Se listan
    # todos y lo decide quien sabe.
    if viejos:
        o.append(
            f"\n---\n\n## ⚠️ {len(viejos)} pedido(s) sin reverificar\n\n"
            "**Estos se midieron contra un commit suyo que ya no es el último.**\n"
            "No quiere decir que sigan faltando: quiere decir que **no lo\n"
            "sabemos**, y un pedido que no sabemos si sigue vigente no debería\n"
            "hacerles perder tiempo.\n\n"
            "El 2026-09-28 revalidamos los doce que había y **cinco ya estaban\n"
            "resueltos** — llevaban días acá diciendo que faltaban. Por eso esta\n"
            "sección existe.\n"
        )
        o.append("\n| Pedido | Medido contra | Cuándo |\n|---|---|---|")
        for t in viejos:
            sha, fecha = t["medido"]
            o.append(f"| **{t['id']}** · {t['titulo']} | `{sha}` | {fecha} |")
        o.append("")

    frenados = [t for t in todas
                if t["lado"] == "front" and t["candado"] and t["estado"] != "hecho"]
    if frenados:
        o.append(
            f"\n---\n\n## Y esto frena al front · {len(frenados)} tarea(s)\n\n"
            "**No todo lo de acá es suyo**, y por eso no está arriba: son los\n"
            "bloqueos que las tareas del front declaran en su título, tal cual\n"
            "los escribieron. Se listan enteros **por si alguno lo es** —es más\n"
            "barato que lo descarten ustedes a que se nos pase—.\n\n"
            "Lo de arriba son pedidos; esto es información.\n"
        )
        o.append("\n| Tarea | Qué la frena |\n|---|---|")
        for t in frenados:
            o.append(f"| **{t['id']}** · {t['titulo']} | {t['candado']} |")
        o.append("")

    o.append(
        "\n---\n\n## Cómo avisar que algo llegó\n\n"
        "No hace falta tocar este archivo. Con decirlo alcanza: el front quita el\n"
        "marcador de la tarea, la desbloquea y este documento se regenera sin ese\n"
        "punto. **Si un pedido sigue acá, es que sigue faltando.**\n"
    )
    return "\n".join(o) + "\n"


def main() -> int:
    if not PLAN.exists():
        print(f"para-backend ⊘ BLOQUEADO · falta {PLAN.name}")
        return 2

    texto = PLAN.read_text(encoding="utf-8")
    todas = recolectar(texto)
    # **Dos listas y no una** · desde el 2026-09-28. `tareas` son las que piden
    # algo —las que el backend tiene que leer— y `todas` incluye las que sólo
    # declaran un candado en su título, que van en la sección de información.
    tareas = [t for t in todas if t["esperas"]]

    # Una tarea cerrada que sigue pidiendo algo es una contradicción: o no estaba
    # cerrada, o el pedido ya se cumplió y nadie lo sacó. Las dos se arreglan acá
    # y no en el documento generado.
    contradictorias = [t for t in tareas if t["estado"] == "hecho"]

    # Las de integración ya cerradas, para que sepan qué pueden probar.
    hechas = [
        {"id": m.group(2), "titulo": re.sub(r"`|\*\*", "", m.group(4)).strip()}
        for l in texto.split("\n")
        if (m := ENCABEZADO.match(l)) and m.group(3) == "✅" and re.fullmatch(r"F1\.(3[2-9]|4[01])", m.group(2))
    ]

    # ── ¿ALGÚN PEDIDO ENVEJECIÓ? ─────────────────────────────────────────────
    #
    # Agregado el 2026-09-28 después de que **cinco de doce pedidos resultaran
    # falsos** al validarlos contra el repositorio del backend. Ninguno era
    # reciente: llevaban entre uno y cuatro días sin ser ciertos, y este archivo
    # los mostraba como pendientes.
    #
    # `backend-drift` vigila que el CABLE no envejezca. Nada vigilaba que un
    # PEDIDO no envejeciera, y son dos cosas: el cable describe lo que hay, un
    # pedido afirma lo que NO hay — **y lo segundo se vence solo cuando ellos
    # trabajan.**
    ref = commit_de_referencia()
    sin_marca = [t for t in tareas if not t["medido"]]
    viejos = [t for t in tareas
              if t["medido"] and ref and t["medido"][0] != ref]

    DESTINO.write_text(render(tareas, hechas, todas, viejos), encoding="utf-8")

    if contradictorias:
        print(f"para-backend ✗ {len(contradictorias)} tarea(s) cerradas que siguen pidiendo algo")
        for t in contradictorias:
            print(f"  {t['id']:8} {t['titulo'][:56]}")
        print("  O la tarea no estaba cerrada, o el pedido ya se cumplió y quedó el marcador.")
        return 1

    # ── UN PEDIDO SIN MARCA ES ROJO · uno VIEJO no ──────────────────────────
    #
    # La distinción es deliberada y costó pensarla.
    #
    # **Sin marca es un error de autoría**: quien escribió el pedido no dijo
    # contra qué lo midió, y eso se arregla en el momento y sin depender de
    # nadie. Por eso sale con 1.
    #
    # **Viejo NO es un error nuestro**: se vence solo cuando el backend trabaja,
    # y hacerlo rojo dejaría la puerta en rojo permanente cada vez que ellos
    # empujan. Es exactamente el defecto que `backend-drift` tuvo ocho días —«la
    # única forma de ponerlo en verde era mentir»— y no se repite. Se cuenta, se
    # lista y **el número baja de a uno**.
    if sin_marca:
        print(f"para-backend ✗ {len(sin_marca)} pedido(s) sin decir contra qué se midieron")
        for t in sin_marca:
            print(f"  {t['id']:8} {t['titulo'][:56]}")
        print()
        print("  Un pedido afirma que algo NO existe, y eso se vence cuando ellos")
        print("  trabajan. Sin la marca no hay forma de saber si sigue vigente:")
        print("  el 2026-09-28, cinco de doce ya estaban resueltos.")
        print()
        print("  Agregá al bloque de espera:")
        print("    **Medido contra `<sha>` el <YYYY-MM-DD>** · <cómo se comprobó>.")
        return 1

    estado = "✓" if not viejos else "⚠"
    de_back = sum(1 for t in tareas if (t["dueno"] or "BACKEND") == "BACKEND")
    print(
        f"para-backend {estado} {len(tareas)} tarea(s) trabadas"
        f" · **{de_back} del backend**"
        f" · {len(tareas) - de_back} de otros"
        f" · {len(hechas)} de integración cerradas"
    )
    if viejos:
        print(f"  {len(viejos)} sin reverificar · el cable de consola está en {ref}")
        for t in viejos:
            print(f"    {t['id']:8} medido contra {t['medido'][0]} el {t['medido'][1]}")
        print("  No es rojo: se vence cuando ellos trabajan, no por un error nuestro.")
    print(f"  → {DESTINO.relative_to(RAIZ)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
