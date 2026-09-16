#!/usr/bin/env python3
"""Las afirmaciones verificables de `docs/` se verifican.

    python3 tools/afirmaciones.py     ·     npm run afirmaciones

── POR QUÉ EXISTE ───────────────────────────────────────────────────────────

La puerta tiene diecisiete chequeos y **ninguno mira la prosa**. Verifican el
código, los tokens, los cuatro contratos y la estructura del plan; un documento,
en cambio, puede decir cualquier cosa y la puerta sale verde igual.

Eso no es teórico. El 2026-09-16, revisando el documento que estaba por irse al
equipo de backend, aparecieron **dos afirmaciones falsas** escritas de memoria:

  · «GET/POST/PUT/DELETE /admin/tenants/{id}/roles» — PUT y DELETE cuelgan de
    `/admin/roles/{roleId}`, y nuestro propio yaml ya lo decía bien.
  · «rompía ocho mocks» — son tres.

Las dos las habría agarrado una máquina en un segundo. Y no fueron las únicas:
la tabla de bloques del modo mock se escribió de memoria con las quince filas
mal, un fixture de prosa usó `text` donde el cable manda `headline`, y un commit
citado en cuatro archivos quedó viejo al reescribir la rama.

**El patrón es uno solo: escribir de memoria lo que hay que leer de la fuente.**
Ya estaba escrito en `CLAUDE.md` para los fixtures de prueba —«el fixture se
escribe desde el contrato, no de memoria»—; lo que faltaba era extenderlo a todo
lo que se afirma, y sostenerlo con algo que no sea una promesa.

── QUÉ VERIFICA ─────────────────────────────────────────────────────────────

Tres clases, elegidas porque son inequívocas. Un chequeo que da falsos positivos
se deja de mirar, así que ante la duda **no marca**.

1. **Método + ruta.** `PUT /admin/roles/{roleId}` tiene que existir así en algún
   contrato. Si la RUTA no aparece en ninguno, no se marca: los documentos
   nombran rutas que pedimos y todavía no existen, y eso es legítimo. Lo que se
   persigue es la ruta que SÍ existe citada con el método equivocado.

2. **Commits.** Un hash citado en `docs/` tiene que existir en alguno de los
   repositorios conocidos. Es lo que agarra una cita que quedó vieja después de
   reescribir una rama.

3. **Identificadores de tarea.** `F4.3`, `B1.25` — tienen que estar en el plan.

── LO QUE NO HACE ───────────────────────────────────────────────────────────

**No verifica que una afirmación sea VERDADERA, solo que sea CITABLE.** Que
`PUT /admin/roles/{roleId}` exista en el contrato no dice que el servicio la
sirva; eso lo contesta `npm run humo`. Y ninguna máquina va a verificar «el
preview reusa GetTab».

Lo que sí hace es cerrar la clase de error más común y más barata de cometer:
citar mal algo que está escrito a dos archivos de distancia.

Códigos: 0 conforme · 1 violación · 2 BLOQUEADO (sin `docs/` o sin contratos).
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
DOCS = RAIZ / "docs"
CONTRATOS = RAIZ / "contracts"
PLAN_JSON = RAIZ / "tools" / "plan-tareas.json"

# Los repositorios donde un hash citado puede vivir. El fork primero, que es
# donde más se citan.
REPOS = [
    Path.home() / "Documents/GitHub/synapse-api-go-fork",
    Path.home() / "Documents/GitHub/synapse-api-go",
    RAIZ,
]

METODOS = ("GET", "POST", "PUT", "DELETE", "PATCH")

# `{tenantId}`, `{id}`, `:tenantId` — el nombre del parámetro no es la
# afirmación. Lo que importa es la FORMA de la ruta.
PARAM = re.compile(r"\{[^}]+\}|:[A-Za-z_][A-Za-z0-9_]*")


def normalizar(ruta: str) -> str:
    """`/admin/tenants/{tenantId}/roles` y `/admin/tenants/{id}/roles` son la
    misma ruta. `:roleId` también, que es como la escribe Gin."""
    r = PARAM.sub("{}", ruta.rstrip("/"))
    # El prefijo de versión no siempre se escribe.
    for p in ("/api/v1", "/v1"):
        if r.startswith(p):
            r = r[len(p):]
    return r


def rutas_de_contratos() -> dict[str, set[str]]:
    """ruta normalizada → métodos declarados. Se lee el yaml a mano: agregar una
    dependencia de parseo para esto sería más frágil que el chequeo."""
    fuera: dict[str, set[str]] = {}
    for yaml in sorted(CONTRATOS.glob("*.yaml")):
        ruta_actual: str | None = None
        for linea in yaml.read_text(encoding="utf-8").splitlines():
            # Una ruta de OpenAPI: dos espacios de sangría y termina en `:`.
            m = re.match(r"^  (/[^\s:]*):\s*$", linea)
            if m:
                ruta_actual = normalizar(m.group(1))
                fuera.setdefault(ruta_actual, set())
                continue
            if ruta_actual is None:
                continue
            # Un método: cuatro espacios.
            m = re.match(r"^    (get|post|put|delete|patch):\s*$", linea)
            if m:
                fuera[ruta_actual].add(m.group(1).upper())
            elif re.match(r"^[^\s]", linea):
                ruta_actual = None
    return fuera


def ids_conocidos() -> set[str]:
    """Los del plan **y los del ancestro**, que es vocabulario legítimo acá.

    `tareas-front-back.md` es el ancestro común de los dos planes, y el propio
    plan lo cita —«Cubre F1.15 y F1.16»— porque varias de sus tareas se
    absorbieron en otras. Marcarlas sería perseguir una cita correcta."""
    ids: set[str] = set()
    if PLAN_JSON.exists():
        ids |= {t["id"] for t in json.loads(PLAN_JSON.read_text(encoding="utf-8"))}
    ancestro = RAIZ / "tareas-front-back.md"
    if ancestro.exists():
        ids |= set(re.findall(r"^- \[[ x]\] \*\*([BF]\d+\.\d+)\*\*",
                              ancestro.read_text(encoding="utf-8"), re.M))
    # `F1.13` es el padre de `F1.13a`–`F1.13j`: se cita sin letra y es correcto.
    ids |= {i[:-1] for i in ids if i and i[-1].isalpha()}
    return ids


def existe_commit(sha: str) -> bool:
    """**Alcanzable desde una rama, no solamente presente.**

    `git cat-file -e` contesta la pregunta equivocada. Al reescribir una rama el
    commit viejo sigue en la base de objetos —el reflog lo retiene hasta que pase
    el `gc`—, así que un hash que quedó obsoleto responde «existe» y el chequeo
    lo deja pasar. Es exactamente el caso del 2026-09-16, cuando `b13fccd` pasó a
    `6f10b8e` y cuatro archivos siguieron citando el viejo.

    Lo verificó una mutación: con `cat-file` esa mutación sobrevivía."""
    for repo in REPOS:
        if not (repo / ".git").exists():
            continue
        r = subprocess.run(
            ["git", "branch", "-a", "--contains", sha],
            cwd=repo, capture_output=True, text=True,
        )
        if r.returncode == 0 and r.stdout.strip():
            return True
    return False


def main() -> int:
    if not DOCS.is_dir():
        print("afirmaciones ⊘ BLOQUEADO · falta docs/")
        return 2
    rutas = rutas_de_contratos()
    if not rutas:
        print("afirmaciones ⊘ BLOQUEADO · no se leyó ninguna ruta de contracts/")
        return 2

    ids = ids_conocidos()
    fallas: list[str] = []
    mirados = {"rutas": 0, "commits": 0, "tareas": 0}

    for doc in sorted(DOCS.rglob("*.md")):
        # `historico/` está vencido a propósito y lleva su aviso adentro.
        # `backdocs/` y `snowflake/` los escriben OTROS equipos, con su propia
        # numeración de tareas: marcarles un identificador que no está en
        # nuestro plan sería perseguir su vocabulario, no un error.
        if {"historico", "backdocs", "snowflake"} & set(doc.parts):
            continue
        # **Las bitácoras CITAN estados pasados, incluidos los equivocados.**
        # La del 2026-09-16 transcribe «PUT /admin/tenants/{id}/roles» para
        # contar que estaba mal y cómo se encontró; validarla contra la fuente de
        # hoy persigue la cita en vez del error. Es la misma razón por la que
        # `historico/` queda afuera: ninguna bitácora se usa como especificación,
        # y el registro de documentos ya las declara «no se tocan».
        if doc.name.startswith("BITACORA-"):
            continue
        texto = doc.read_text(encoding="utf-8")
        rel = doc.relative_to(RAIZ)

        # ── 1 · método + ruta ────────────────────────────────────────────────
        # `GET/POST/PUT/DELETE /x` se expande a los cuatro.
        for m in re.finditer(
            r"\b((?:GET|POST|PUT|DELETE|PATCH)(?:/(?:GET|POST|PUT|DELETE|PATCH))*)\s+"
            r"(/[A-Za-z0-9_/{}:.-]+)",
            texto,
        ):
            ruta = normalizar(m.group(2))
            declarados = rutas.get(ruta)
            # La ruta no existe en ningún contrato: es un PEDIDO, no un error.
            if declarados is None:
                continue
            # La línea que dice «404» está declarando que la ruta NO existe con
            # ese método: eso es un pedido al backend, que es exactamente para lo
            # que estos documentos se escriben.
            inicio = texto.rfind("\n", 0, m.start()) + 1
            fin = texto.find("\n", m.end())
            linea = texto[inicio: fin if fin > 0 else len(texto)]
            if "404" in linea:
                continue
            for metodo in m.group(1).split("/"):
                mirados["rutas"] += 1
                if metodo not in declarados:
                    fallas.append(
                        f"{rel} · «{metodo} {m.group(2)}» · el contrato declara "
                        f"{', '.join(sorted(declarados))} para esa ruta"
                    )

        # ── 2 · commits ──────────────────────────────────────────────────────
        for m in re.finditer(r"`([0-9a-f]{7,40})`", texto):
            sha = m.group(1)
            mirados["commits"] += 1
            if not existe_commit(sha):
                fallas.append(f"{rel} · commit `{sha}` no existe en ningún repositorio conocido")

        # ── 3 · identificadores de tarea ─────────────────────────────────────
        if ids:
            for m in re.finditer(r"\b([FB]\d+\.\d+[a-z]?)\b", texto):
                tid = m.group(1)
                mirados["tareas"] += 1
                if tid not in ids:
                    fallas.append(f"{rel} · la tarea {tid} no está en el plan")

    if fallas:
        print(f"afirmaciones ✗ {len(fallas)} afirmación(es) que la fuente desmiente")
        for f in sorted(set(fallas)):
            print(f"  {f}")
        return 1

    print(
        f"afirmaciones ✓ {mirados['rutas']} método+ruta · "
        f"{mirados['commits']} commit(s) · {mirados['tareas']} identificador(es)"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
