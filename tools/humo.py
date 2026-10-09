#!/usr/bin/env python3
"""Humo contra el servicio real · lo que llega == lo que el yaml transcribe

    SYNAPSE_EMAIL=… SYNAPSE_PASSWORD=… npm run humo

Dos cables, dos secciones y **dos resultados que no se mezclan**:

  · `synapse-console-wire.yaml` · las rutas de `/config/*` · **todas**, y la
    que se saltea lo dice con su razón · ver `MEDIDAS` y `SALTADAS`
  · `synapse-admin-wire.yaml`   · las de `/admin/*` — **transcritas a ciegas**,
    porque cuelgan de `AdminOnlyMiddleware` y hasta el 2026-09-15 no hubo un
    usuario con rol `admin` para confirmarlas.

── DOS DIRECCIONES · la segunda desde el 2026-09-26 ─────────────────────────

  · `faltantes()`      ¿está lo que el yaml EXIGE?  → transcripción optimista
  · `no_declarados()`  ¿llegó algo que no declara?  → transcripción VENCIDA

**Hasta el 2026-09-26 sólo existía la primera, y toda la deriva que se nos
escapó estaba en la segunda.** Once campos en dos semanas, los once
encontrados por un humano leyendo una respuesta: los cinco del 25
—`dashboards`, `active_dashboard_id`, `active_layout_id`,
`preferred_dashboard_id`, `tab_id`— y los seis del 26 —`user.theme`,
`tenant.locale`, `tenant.currency`, `tenant.timezone`,
`governance.measurement_window` y `columns[].decimals`/`unit`—.

**Y en la primera corrida encontró uno que ningún humano vio**: el cable de
admin declara PascalCase —`ID`, `TenantID`, `VersionID`— y el servicio pasó a
snake_case en `8633b10`, que le agregó tags json a structs que no los tenían.
`src/api/admin.ts` lee quince campos que hoy son `undefined`, y el peor no
falla: `ESTADOS[w.Status] ?? 'borrador'` afirma que todo layout es borrador.

**Verificado por mutación**, cinco casos: una propiedad borrada se reporta; un
`additionalProperties: true` detiene el descenso; adentro de un arreglo la ruta
sale como `tabs[].sort_order`; un extra que está SÓLO en el segundo elemento se
ve —mirar el primero habría dicho que no existe—; y sin extras no inventa nada.

La base NO está verde —hay deriva real—, así que el arnés no puede leer el
código de salida: afirma que una ruta que la base no contenía aparece, o que
una que sí contenía desaparece.

── QUÉ PRUEBA, Y POR QUÉ NO ALCANZA CON LAS OTRAS ───────────────────────────

Las 427 pruebas corren contra MSW, y los fixtures salen del yaml transcripto.
Eso demuestra que **el adaptador es coherente con lo que nosotros creemos del
cable** — no con el cable. Si la transcripción se equivocó, las pruebas pasan
igual y el error aparece en producción.

Este chequeo cierra esa brecha: pide las rutas al servicio de verdad y
compara la RESPUESTA contra el yaml. Ya encontró una diferencia el 2026-09-14 —
`semantic_direction` es texto ya redactado y no un código, al revés de lo que
decía el comentario de Go del que se transcribió.

── POR QUÉ NO ESTÁ EN LA PUERTA ─────────────────────────────────────────────

Necesita el servicio levantado y credenciales. En CI saldría ⊘ BLOQUEADO todos
los días, y **la puerta de este repositorio sale verde SIN bloqueados**: un ⊘
cotidiano es cómo se deja de mirar un chequeo.

── CUANDO ENCUENTRA UNA DIFERENCIA ──────────────────────────────────────────

**El que está mal es el YAML, no el servicio.** El yaml es nuestra
transcripción; el servicio es el hecho. Se corrige el yaml, se regenera con
`npm run gen:console-wire`, y recién ahí se mira si el adaptador necesita algo.

Códigos: 0 conforme · 1 hay diferencias · 2 BLOQUEADO (sin credenciales, sin
servicio, o sin el yaml).
"""
from __future__ import annotations

import json
import os
import pathlib
import sys
import urllib.error
import urllib.request

# ── NINGUNA RUTA DEL CABLE SE QUEDA SIN MIRAR · desde el 2026-09-26 ─────────
#
# **Esto es lo que faltaba, y es por qué el hueco duró meses.** El cable declaró
# nueve rutas de `/config/*`, este chequeo pedía cinco, y la línea final decía
# «las cinco rutas de consola coinciden» — cierto sobre cinco y leído como si
# fueran todas. Nada relacionaba las dos listas, así que agregar una ruta al
# cable sin medirla no producía ninguna señal.
#
# Ahora cada ruta del cable tiene que estar en una de las dos listas, y el
# chequeo **falla si aparece una que no está en ninguna**. Saltear es legítimo;
# saltear en silencio no.
MEDIDAS = {
    "/config/me",
    "/config/catalog",
    "/config/blocks",
    "/config/tabs/{tabId}",
    # Con los dos puntos, como el cable la declara. **Acá escribí
    # `/config/panels` de memoria y el propio chequeo me corrigió**, en su
    # primera corrida: es el mismo error que vino a buscar.
    "/config/panels:batch",
    "/config/me/preferences",
    "/config/chat/threads",
    "/config/panels/{panelId}/chat-suggestions",
    "/config/plots",
    # Las tres de LECTURA que el cable declaraba sin medir · 2026-10-09.
    "/chat/agents",
    "/config/chat/threads/{id}/messages",
    "/config/panels/{panelId}/drilldown/dimensions",
}
SALTADAS = {
    "/config/chat": "SSE · cuesta una llamada a Cortex y escribe un hilo",
    # **Las dos con efectos, dichas y no medidas** · 2026-10-09. Saltear es
    # legítimo; saltear en silencio no.
    "/config/panels/{panelId}/drilldown": (
        "Snowflake en vivo · comparte cuota con el chat · medido a mano en C2"
    ),
    "/history/threads/{id}": (
        "borra un hilo del usuario · medido a mano el 2026-10-09 con uno "
        "descartable: 200 y `deleted_at` en la base"
    ),
}

RAIZ = pathlib.Path(__file__).resolve().parent.parent
CABLE = RAIZ / "contracts" / "synapse-console-wire.yaml"
CABLE_ADMIN = RAIZ / "contracts" / "synapse-admin-wire.yaml"
BASE = os.getenv("SYNAPSE_API", "http://localhost:4010/api/v1")


def pedir(
    ruta: str, token: str | None = None, cuerpo: dict | None = None, metodo: str | None = None
) -> tuple[int, object]:
    """`metodo` sólo hace falta cuando no se deduce del cuerpo — un PUT."""
    datos = None if cuerpo is None else json.dumps(cuerpo).encode()
    req = urllib.request.Request(
        f"{BASE}{ruta}",
        data=datos,
        method=metodo or ("POST" if datos else "GET"),
        headers={
            "Content-Type": "application/json",
            **({} if token is None else {"Authorization": f"Bearer {token}"}),
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read() or b"null")
    except Exception as e:  # noqa: BLE001 — red, DNS, servicio caído
        return 0, str(e)


def faltantes(obj: object, requeridos: list[str]) -> list[str]:
    if not isinstance(obj, dict):
        return requeridos
    return [c for c in requeridos if c not in obj]


def esquema_en_linea(spec: dict, ruta: str, metodo: str) -> dict:
    """El esquema del `data` de un 200 declarado ADENTRO de la ruta.

    No todas las respuestas del cable son un componente con nombre: la de
    `/config/me/preferences` se declara en línea, bajo un `allOf` que intersecta
    el `Envelope` con un objeto que sólo tiene `data`. Se lee de ahí en vez de
    duplicarlo acá, para que el cable siga siendo la única fuente.

    Devuelve `{}` si no lo encuentra, y entonces `no_declarados` no reporta nada
    — que es lo correcto: sin esquema no hay contra qué comparar. **Un `{}` se
    lee como conforme**, así que el llamador ve un ✓ con cero propiedades, y eso
    es visible en la salida.
    """
    try:
        respuesta = spec["paths"][ruta][metodo]["responses"]["200"]
        esquema = respuesta["content"]["application/json"]["schema"]
    except (KeyError, TypeError):
        return {}
    for parte in esquema.get("allOf", [esquema]):
        data = (parte.get("properties") or {}).get("data")
        if isinstance(data, dict):
            return data
    return {}


# ── LA OTRA DIRECCIÓN · agregada el 2026-09-26 ──────────────────────────────
#
# **Este chequeo miraba un solo lado, y toda la deriva que se nos escapó estaba
# en el otro.** `faltantes()` pregunta «¿está lo que el yaml exige?», que atrapa
# una transcripción OPTIMISTA. No atrapa la que sobra, y la que sobra es la que
# pasó: el 2026-09-25 se descubrieron `dashboards`, `active_dashboard_id`,
# `active_layout_id`, `preferred_dashboard_id` y `tab_id` —cinco campos que el
# servicio mandaba desde hacía entre cuatro y ocho días—, y el 26 aparecieron
# `user.theme`, `tenant.locale`, `tenant.currency`, `tenant.timezone`,
# `governance.measurement_window` y `columns[].decimals`/`unit`.
#
# **Los once salieron de que un humano leyera una respuesta.** Ninguno lo podía
# ver este chequeo, y por eso salía ✓ mientras el cable envejecía.
#
# Un campo no declarado no es cosmético: es una tarea que espera sin saber que
# ya llegó. `open_period` estuvo en el cable desde el 22 y `enCurso` lo leía;
# `tenant.locale` no, y F1.13b siguió bloqueada con el campo servido.
#
# **Dónde se DETIENE, y sale del propio yaml.** Tres puntos son de forma libre a
# propósito —`PanelDTO.options`, `Payload.value` y `Payload.presentation`— y
# están marcados con `additionalProperties: true`. Descender ahí reportaría cada
# campo de cada forma de valor, y un chequeo ruidoso es uno que se deja de leer:
# es el mismo modo de falla que tuvo `backend-drift` ocho días en el mismo rojo.
def no_declarados(
    obj: object, esquema: dict, esquemas: dict, ruta: str = ""
) -> list[str]:
    """Campos que el servicio MANDA y el yaml no declara, recursivo.

    `esquema` ya viene resuelto —sin `$ref`—. Devuelve rutas con punto, del
    estilo `tenant.locale` o `columns[].decimals`, en el orden en que aparecen.
    """
    if not isinstance(esquema, dict):
        return []
    # Forma libre declarada: el yaml dice «acá no sé qué viene», y lo dice a
    # propósito. No es un hueco.
    if esquema.get("additionalProperties") is True:
        return []

    def resolver(e: object) -> dict:
        """Sigue un `$ref` hasta el esquema nombrado. Uno solo de profundidad
        alcanza: el cable no anida referencias a referencias."""
        if not isinstance(e, dict):
            return {}
        ref = e.get("$ref")
        if isinstance(ref, str) and ref.startswith("#/components/schemas/"):
            return esquemas.get(ref.rsplit("/", 1)[1]) or {}
        return e

    # Un arreglo se recorre ENTERO, no sólo su primer elemento. `columns[].unit`
    # existe sólo en las columnas numéricas: mirar la primera —`platform`, que no
    # lo trae— habría dicho que no existe.
    if isinstance(obj, list):
        items = resolver(esquema.get("items"))
        vistos: list[str] = []
        for elemento in obj:
            for hallado in no_declarados(elemento, items, esquemas, f"{ruta}[]"):
                if hallado not in vistos:
                    vistos.append(hallado)
        return vistos

    props = esquema.get("properties")
    if not isinstance(obj, dict) or not isinstance(props, dict):
        return []

    hallados: list[str] = []
    for clave, valor in obj.items():
        camino = f"{ruta}.{clave}" if ruta else clave
        if clave not in props:
            hallados.append(camino)
            continue
        # Declarado: se baja a ver si ADENTRO hay algo sin declarar.
        hallados.extend(no_declarados(valor, resolver(props[clave]), esquemas, camino))
    return hallados


def comprobar_admin(token: str, ctx: object, fallas: list[str]) -> str | None:
    """Las rutas de `/admin/*` contra `synapse-admin-wire.yaml`.

    Devuelve `None` si pudo comprobarlas, o la RAZÓN por la que no. Nunca falla
    por no poder: no tener un usuario `admin` no es un defecto del front.

    **Las cinco rutas del fork se saltean a propósito.** `/admin/tenants/{id}/roles`
    y `/admin/layouts/{id}/preview` son B4.8 y B4.9, que escribimos nosotros y
    que el servicio desplegado **no sirve**: un 404 ahí es lo esperado, y
    contarlo como diferencia sería que el chequeo llore por algo que ya sabemos.
    El yaml las marca con `x-origen: fork`.
    """
    if not CABLE_ADMIN.exists():
        return f"falta {CABLE_ADMIN.name}"

    import yaml

    spec = yaml.safe_load(CABLE_ADMIN.read_text(encoding="utf-8"))
    esquemas = spec["components"]["schemas"]

    estado, cuerpo = pedir("/admin/tenants", token)
    if estado == 403:
        return "el usuario no tiene rol `admin` · el claim se compara contra roles.name"
    if estado != 200:
        return f"GET /admin/tenants respondió {estado}"

    print("humo · /admin/*")
    tenants = cuerpo.get("data") if isinstance(cuerpo, dict) else None
    if not isinstance(tenants, list):
        fallas.append("/admin/tenants · `data` no es un arreglo")
        print("  ✗ /admin/tenants · `data` no es un arreglo")
        return None

    def revisar(nombre: str, obj: object, esquema: str) -> None:
        """Las DOS direcciones, y se informan por separado.

        `faltantes` es una transcripción optimista —declaramos algo que no
        llega—; `no_declarados` es una vencida —llegó algo que no declaramos—.
        Se arreglan distinto: la primera borra del yaml, la segunda transcribe.
        """
        # Un esquema puede venir por NOMBRE o en línea: la respuesta de
        # `/config/me/preferences` no es un componente, se declara adentro de la
        # ruta. Sin esto habría que inventarle un componente al cable para poder
        # medirla, y el cable no se cambia para que la herramienta ande.
        e = esquemas[esquema] if isinstance(esquema, str) else esquema
        etiqueta = esquema if isinstance(esquema, str) else "el esquema en línea"
        req = e.get("required", [])
        falta = faltantes(obj, req)
        sobra = no_declarados(obj, e, esquemas)
        if falta:
            fallas.append(f"{nombre} · {etiqueta} no trae {', '.join(falta)}")
            print(f"  ✗ {nombre} · faltan {', '.join(falta)}")
        if sobra:
            fallas.append(f"{nombre} · {etiqueta} no declara {', '.join(sobra)}")
            print(f"  ✗ {nombre} · el servicio manda y el yaml no declara: {', '.join(sobra)}")
        if not falta and not sobra:
            props = len(e.get("properties") or {})
            print(f"  ✓ {nombre} · {len(req)} requeridos, y nada fuera de los {props} declarados")

    if not tenants:
        print("  ⊘ /admin/tenants · sin tenants · no hay con qué seguir")
        return None
    revisar("/admin/tenants[0]", tenants[0], "TenantOption")

    # El tenant del usuario primero: es el que seguro tiene layouts.
    propio = ((ctx or {}) if isinstance(ctx, dict) else {}).get("tenant") or {}
    tid = propio.get("id") or tenants[0]["id"]

    _, cat = pedir(f"/admin/tenants/{tid}/catalog", token)
    metricas = cat.get("data") if isinstance(cat, dict) else None
    if isinstance(metricas, list) and metricas:
        revisar("/admin/tenants/{id}/catalog[0]", metricas[0], "CatalogMetric")

    _, lays = pedir(f"/admin/tenants/{tid}/layouts", token)
    layouts = lays.get("data") if isinstance(lays, dict) else None
    if not isinstance(layouts, list) or not layouts:
        print("  ⊘ /admin/tenants/{id}/layouts · sin versiones · no hay detalle que pedir")
        return None
    revisar("/admin/tenants/{id}/layouts[0]", layouts[0], "LayoutVersion")

    # **Acá es donde la transcripción se puede haber equivocado.** El PascalCase
    # de los structs de dominio salió de leer Go, no de ver una respuesta.
    lid = layouts[0].get("ID") or layouts[0].get("id")
    _, det = pedir(f"/admin/layouts/{lid}", token)
    detalle = det.get("data") if isinstance(det, dict) else None
    revisar("/admin/layouts/{id}", detalle, "LayoutDetail")
    tabs = (detalle or {}).get("tabs") or []
    if tabs:
        revisar("  tabs[0].tab", tabs[0].get("tab"), "LayoutTab")
        paneles = tabs[0].get("panels") or []
        if paneles:
            revisar("  tabs[0].panels[0]", paneles[0], "LayoutPanel")

    # `validate` responde 200 aunque la composición sea inválida · el 200 dice
    # que corrió, no que esté bien. Se comprueba la FORMA, no el veredicto.
    _, val = pedir(f"/admin/layouts/{lid}/validate", token, {})
    revisar("/admin/layouts/{id}/validate", val.get("data") if isinstance(val, dict) else None,
            "ValidationResult")

    # **Publicar NO se prueba.** Demota el layout publicado del tenant y cambia
    # lo que la consola sirve: un chequeo de humo no toca producción.
    # ── LAS QUE ERAN «DEL FORK» YA SE MIDEN · 2026-09-26 ────────────────────
    #
    # Acá había una línea diciendo «`/roles` y `/preview` son del fork, el
    # servicio devuelve 404». **Las tomaron**: las de rol el 2026-09-25 y el
    # preview en `8633b10`. La línea se quedó afirmando un 404 que ya no pasaba.
    _, roles = pedir(f"/admin/tenants/{tid}/roles/composition", token)
    lista_roles = roles.get("data") if isinstance(roles, dict) else None
    if isinstance(lista_roles, list) and lista_roles:
        revisar("/admin/tenants/{id}/roles/composition[0]", lista_roles[0], "Role")

    # **El preview necesita `role_id` y NO `roleId`** · medido: camelCase da 400.
    # Se pide con un rol real del tenant, que sale del listado de arriba.
    if isinstance(lista_roles, list) and lista_roles:
        lid_prev = layouts[0].get("id")
        estado_pv, pv = pedir(
            f"/admin/layouts/{lid_prev}/preview?role_id={lista_roles[0]['id']}", token
        )
        if estado_pv != 200:
            fallas.append(f"/admin/layouts/{{id}}/preview · respondió {estado_pv}")
            print(f"  ✗ /admin/layouts/{{id}}/preview · HTTP {estado_pv}")
        else:
            revisar("/admin/layouts/{id}/preview", pv.get("data"), "Preview")

    for ruta, esquema, etiqueta in (
        (f"/admin/tenants/{tid}/users", "User", "/admin/tenants/{id}/users[0]"),
        (f"/admin/tenants/{tid}/feeds", "Feed", "/admin/tenants/{id}/feeds[0]"),
        (f"/admin/tenants/{tid}/agents", "AgentAdmin", "/admin/tenants/{id}/agents[0]"),
    ):
        estado_l, cuerpo_l = pedir(ruta, token)
        datos_l = cuerpo_l.get("data") if isinstance(cuerpo_l, dict) else None
        if estado_l != 200:
            fallas.append(f"{etiqueta} · respondió {estado_l}")
            print(f"  ✗ {etiqueta} · HTTP {estado_l}")
        elif not isinstance(datos_l, list):
            fallas.append(f"{etiqueta} · `data` no es un arreglo")
            print(f"  ✗ {etiqueta} · `data` no es un arreglo")
        elif datos_l:
            revisar(etiqueta, datos_l[0], esquema)
        else:
            print(f"  ⊘ {etiqueta} · lista vacía · no hay forma que comparar")

    print("  ⊘ /admin/layouts/{id}/publish · no se prueba · demota el publicado del tenant")
    print("  ⊘ las de ESCRITURA de rol · POST, PUT y DELETE · medidas a mano el")
    print("     2026-09-26 con un rol descartable: 201, 200 y 200 con is_active:false")
    return None


def main() -> int:
    if not CABLE.exists():
        print(f"humo ⊘ BLOQUEADO · falta {CABLE.name}")
        return 2
    try:
        import yaml
    except ImportError:
        print("humo ⊘ BLOQUEADO · falta pyyaml · pip install pyyaml")
        return 2

    email, password = os.getenv("SYNAPSE_EMAIL"), os.getenv("SYNAPSE_PASSWORD")
    if not email or not password:
        print("humo ⊘ BLOQUEADO · sin credenciales")
        print("  SYNAPSE_EMAIL=… SYNAPSE_PASSWORD=… npm run humo")
        print("  **No es un fallo del front**: no hay contra qué comparar todavía.")
        return 2

    spec = yaml.safe_load(CABLE.read_text(encoding="utf-8"))
    esquemas = spec["components"]["schemas"]

    estado, cuerpo = pedir("/auth/login", cuerpo={"email": email, "password": password})
    if estado != 200 or not isinstance(cuerpo, dict) or not cuerpo.get("success"):
        print(f"humo ⊘ BLOQUEADO · el login no respondió · {BASE} · HTTP {estado}")
        print(f"  {str(cuerpo)[:100]}")
        print("  **No es un fallo del front**: el servicio tiene que estar levantado.")
        return 2
    token = cuerpo["data"]["token"]

    print(f"humo · {BASE}")
    fallas: list[str] = []

    def revisar(nombre: str, obj: object, esquema: str) -> None:
        """Las DOS direcciones, y se informan por separado.

        `faltantes` es una transcripción optimista —declaramos algo que no
        llega—; `no_declarados` es una vencida —llegó algo que no declaramos—.
        Se arreglan distinto: la primera borra del yaml, la segunda transcribe.
        """
        # Un esquema puede venir por NOMBRE o en línea: la respuesta de
        # `/config/me/preferences` no es un componente, se declara adentro de la
        # ruta. Sin esto habría que inventarle un componente al cable para poder
        # medirla, y el cable no se cambia para que la herramienta ande.
        e = esquemas[esquema] if isinstance(esquema, str) else esquema
        etiqueta = esquema if isinstance(esquema, str) else "el esquema en línea"
        req = e.get("required", [])
        falta = faltantes(obj, req)
        sobra = no_declarados(obj, e, esquemas)
        if falta:
            fallas.append(f"{nombre} · {etiqueta} no trae {', '.join(falta)}")
            print(f"  ✗ {nombre} · faltan {', '.join(falta)}")
        if sobra:
            fallas.append(f"{nombre} · {etiqueta} no declara {', '.join(sobra)}")
            print(f"  ✗ {nombre} · el servicio manda y el yaml no declara: {', '.join(sobra)}")
        if not falta and not sobra:
            props = len(e.get("properties") or {})
            print(f"  ✓ {nombre} · {len(req)} requeridos, y nada fuera de los {props} declarados")

    _, me = pedir("/config/me", token)
    ctx = me.get("data") if isinstance(me, dict) else None
    revisar("/config/me", ctx, "ContextResponse")

    _, cat = pedir("/config/catalog", token)
    metricas = cat.get("data") if isinstance(cat, dict) else None
    if not isinstance(metricas, list):
        fallas.append("/config/catalog · `data` no es un ARREGLO DESNUDO")
        print("  ✗ /config/catalog · `data` no es un arreglo desnudo")
    elif metricas:
        revisar("/config/catalog[0]", metricas[0], "CatalogMetric")

    _, blk = pedir("/config/blocks", token)
    bloques = blk.get("data") if isinstance(blk, dict) else None
    if not isinstance(bloques, list):
        fallas.append("/config/blocks · `data` no es un ARREGLO DESNUDO")
        print("  ✗ /config/blocks · `data` no es un arreglo desnudo")
    elif bloques:
        revisar("/config/blocks[0]", bloques[0], "BlockRule")

    # ── **EL REPERTORIO · `/config/plots`** · medido desde el 2026-10-02 ──────
    #
    # Llegó en `c8b9247` y hasta entonces esta ruta salía «el cable la declara y
    # NADA la mide» — honesto, y por eso estaba.
    #
    # **Se compara contra el archivo que le entregamos al backend**, no sólo
    # contra el esquema: el repertorio lo genera `tools/gen-plots.py` desde
    # cuatro fuentes y ellos lo embeben tal cual, así que una diferencia
    # significa que una de las dos copias se movió. El esquema solo no lo vería.
    _, plt = pedir("/config/plots", token)
    repertorio = plt.get("data") if isinstance(plt, dict) else None
    if not isinstance(repertorio, list):
        fallas.append("/config/plots · `data` no es un ARREGLO DESNUDO")
        print("  ✗ /config/plots · `data` no es un arreglo desnudo")
    else:
        revisar("/config/plots[0]", repertorio[0] if repertorio else None, "PlotRule")
        nuestro = json.loads((RAIZ / "docs/backend/config-plots.json").read_text())
        if repertorio != nuestro:
            fallas.append(
                f"/config/plots · lo que sirve NO es lo que entregamos · "
                f"{len(repertorio)} entradas contra {len(nuestro)}"
            )
            print(f"  ✗ /config/plots · difiere del archivo entregado")
        else:
            print(f"  ✓ /config/plots · {len(repertorio)} entradas, idénticas al archivo entregado")
        # **`cap` se OMITE, no viaja en `null`** · lo señaló el backend al
        # implementarla, y nuestro cable decía lo contrario. Si vuelve a viajar
        # en `null`, el adaptador lo tolera y nadie se entera: por eso se mide.
        nulos = [x["id"] for x in repertorio if "cap" in x and x["cap"] is None]
        if nulos:
            fallas.append(f"/config/plots · `cap` viaja en `null` en {len(nulos)}: {nulos[:3]}")
            print(f"  ✗ /config/plots · `cap` en `null`, debe omitirse · {nulos[:3]}")

    tabs = (ctx or {}).get("tabs") or []
    if tabs:
        _, tab = pedir(f"/config/tabs/{tabs[0]['id']}", token)
        datos = tab.get("data") if isinstance(tab, dict) else None
        revisar("/config/tabs/{id}", datos, "TabWithPanels")
        paneles = (datos or {}).get("panels") or []
        if paneles:
            revisar("  panels[0]", paneles[0], "PanelDTO")
            periodos = (ctx or {}).get("periods") or []
            _, lote = pedir(
                "/config/panels:batch",
                token,
                {"panel_ids": [p["id"] for p in paneles], "period": periodos[0]},
            )
            mapa = lote.get("data") if isinstance(lote, dict) else None
            if isinstance(mapa, dict) and mapa:
                primero = next(iter(mapa.values()))
                revisar("  panels:batch[0]", primero, "Payload")
                gob = primero.get("governance") if isinstance(primero, dict) else None
                if gob is not None:
                    revisar("  governance", gob, "Governance")
            else:
                fallas.append("panels:batch · `data` no es un mapa de payloads")
                print("  ✗ panels:batch · `data` no es un mapa")

    # ── LAS CUATRO QUE NUNCA SE MEDÍAN · agregadas el 2026-09-26 ────────────
    #
    # **El cable declara nueve rutas y este chequeo pedía cinco**, mientras la
    # línea final decía «las cinco rutas de consola coinciden» — cierto sobre
    # cinco y leído como si fueran todas.
    #
    # Las cuatro que faltaban son exactamente las que el 2026-09-26 no se
    # pudieron reverificar a mano: no es casualidad, es que **nunca hubo nada
    # que las midiera** y sólo se transcribieron leyendo Go.

    # El PUT es un NO-OP a propósito: se le manda el tema que ya tiene. El
    # handler responde con lo que recibió, así que la forma se ve igual y no se
    # le cambia la preferencia a nadie — misma prudencia que con `publish`.
    tema_actual = ((ctx or {}).get("user") or {}).get("theme") or "light"
    estado_pref, pref = pedir(
        "/config/me/preferences", token, {"theme": tema_actual}, metodo="PUT"
    )
    if estado_pref != 200:
        fallas.append(f"/config/me/preferences · respondió {estado_pref}")
        print(f"  ✗ /config/me/preferences · HTTP {estado_pref}")
    else:
        # El esquema se LEE del cable, no se escribe acá. Si mañana la respuesta
        # pasa a ser un componente, esto lo sigue encontrando sin tocarse.
        revisar("/config/me/preferences", pref.get("data"), esquema_en_linea(spec, "/config/me/preferences", "put"))

    estado_hilos, hilos = pedir("/config/chat/threads", token)
    lista_hilos = hilos.get("data") if isinstance(hilos, dict) else None
    if estado_hilos != 200:
        fallas.append(f"/config/chat/threads · respondió {estado_hilos}")
        print(f"  ✗ /config/chat/threads · HTTP {estado_hilos}")
    elif not isinstance(lista_hilos, list):
        fallas.append("/config/chat/threads · `data` no es un arreglo")
        print("  ✗ /config/chat/threads · `data` no es un arreglo")
    elif lista_hilos:
        revisar("/config/chat/threads[0]", lista_hilos[0], "ChatThread")
    else:
        print("  ⊘ /config/chat/threads · sin hilos todavía · no hay forma que comparar")

    # ── LAS TRES DE LECTURA QUE FALTABAN · 2026-10-09 ───────────────────────
    #
    # Salían «el cable la declara y NADA la mide». Dos se transcribieron ese día
    # —los mensajes de un hilo y el borrado— y tres venían de antes.
    #
    # **Los mensajes miden además una trama `ChatFrameData` real**: el
    # `structured_data` guardado es lo que el stream emitió. Es la única medida
    # de esa forma que no cuesta una llamada a Cortex.
    if isinstance(lista_hilos, list) and lista_hilos:
        estado_msj, msj = pedir(f"/config/chat/threads/{lista_hilos[0]['id']}/messages", token)
        pagina = msj.get("data") if isinstance(msj, dict) else None
        if estado_msj != 200 or not isinstance(pagina, dict):
            fallas.append(f"/config/chat/threads/{{id}}/messages · respondió {estado_msj}")
            print(f"  ✗ /config/chat/threads/{{id}}/messages · HTTP {estado_msj}")
        else:
            revisar("/config/chat/threads/{id}/messages", pagina, "ChatMessagesPage")
            mensajes = pagina.get("messages") or []
            if mensajes:
                revisar("  messages[0]", mensajes[0], "ChatMessage")
            guardada = next((m["structured_data"] for m in mensajes if m.get("structured_data")), None)
            if guardada is not None:
                revisar("  structured_data", guardada, "ChatFrameData")
                revisar(
                    "  structured_data.provenance",
                    guardada.get("provenance"),
                    esquemas["ChatFrameData"]["properties"]["provenance"],
                )
    else:
        print("  ⊘ /config/chat/threads/{id}/messages · sin hilos · no hay a cuál pedirle")

    estado_ag, ag = pedir("/chat/agents", token)
    agentes = ag.get("data") if isinstance(ag, dict) else None
    if estado_ag == 403:
        print("  ⊘ /chat/agents · el usuario no es admin · el servicio la niega, y está bien")
    elif estado_ag != 200 or not isinstance(agentes, list):
        fallas.append(f"/chat/agents · respondió {estado_ag}")
        print(f"  ✗ /chat/agents · HTTP {estado_ag}")
    elif agentes:
        revisar("/chat/agents[0]", agentes[0], "ChatAgentOption")
    else:
        print("  ⊘ /chat/agents · sin agentes cargados")

    if tabs and paneles:
        pid = paneles[0]["id"]
        estado_dim, dim = pedir(f"/config/panels/{pid}/drilldown/dimensions", token)
        if estado_dim != 200:
            fallas.append(f"drilldown/dimensions · respondió {estado_dim}")
            print(f"  ✗ drilldown/dimensions · HTTP {estado_dim}")
        else:
            revisar("drilldown/dimensions", dim.get("data"), "DrillDownDimensions")

    if tabs and paneles:
        pid = paneles[0]["id"]
        estado_sug, sug = pedir(f"/config/panels/{pid}/chat-suggestions", token)
        lista_sug = sug.get("data") if isinstance(sug, dict) else None
        if estado_sug != 200:
            fallas.append(f"chat-suggestions · respondió {estado_sug}")
            print(f"  ✗ chat-suggestions · HTTP {estado_sug}")
        elif not isinstance(lista_sug, list):
            fallas.append("chat-suggestions · `data` no es un arreglo")
            print("  ✗ chat-suggestions · `data` no es un arreglo")
        elif lista_sug:
            revisar("chat-suggestions[0]", lista_sug[0], "ChatSuggestion")
        else:
            print("  ⊘ chat-suggestions · sin sugerencias para este panel")

    # **`POST /config/chat` va detrás de una variable, y no por pereza.** Cada
    # corrida le cuesta una llamada a Cortex y deja un hilo escrito: un chequeo
    # que gasta plata en cada corrida es uno que se deja de correr, que es el
    # mismo modo de falla que tuvo `backend-drift` ocho días en rojo. Y la
    # respuesta es SSE, no JSON — `pedir()` no la puede leer.
    #
    # Son las seis formas de trama —`ChatFrame*`— las que quedan sin medir, y
    # eso es cobertura que falta, no cobertura que sobra: queda dicho.
    for ruta, razon in sorted(SALTADAS.items()):
        print(f"  ⊘ {ruta} · {razon}")
    print("     las seis formas `ChatFrame*` siguen SIN medir contra el servicio")

    # **Y ninguna ruta del cable se queda afuera sin decirlo.** Si alguien
    # transcribe una ruta nueva y nadie la mide, esto lo dice acá y no en seis
    # semanas: es la misma clase de silencio que tapó cinco campos.
    huerfanas = sorted(set(spec.get("paths") or {}) - MEDIDAS - set(SALTADAS))
    if huerfanas:
        for r in huerfanas:
            fallas.append(f"{r} · el cable la declara y nada la mide")
            print(f"  ✗ {r} · el cable la declara y NADA la mide")
    else:
        print(
            f"  ✓ cobertura · las {len(spec.get('paths') or {})} rutas del cable están"
            f" medidas ({len(MEDIDAS)}) o salteadas con razón ({len(SALTADAS)})"
        )

    # ── /admin/* ────────────────────────────────────────────────────────────
    #
    # **Se separa a propósito.** Un chequeo que no pudo correr no puede
    # esconderse detrás del que sí: la convención de este repositorio cuenta los
    # BLOQUEADOS aparte, porque «un chequeo que pasa por falta de fuente miente
    # sobre su cobertura».
    print()
    bloqueado_admin = comprobar_admin(token, ctx, fallas)

    print()
    if fallas:
        print(f"humo ✗ {len(fallas)} diferencia(s) entre el servicio y el yaml")
        for f in fallas:
            print(f"  {f}")
        print()
        print("  **El que está mal es el YAML, no el servicio.** El yaml es nuestra")
        print("  transcripción; el servicio es el hecho. Se corrige el yaml, se")
        print("  regenera con `npm run gen:console-wire`, y RECIÉN AHÍ se mira si el")
        print("  adaptador necesita algo.")
        return 1

    print("humo ✓ el cable de consola coincide con el servicio en las dos direcciones")
    print("  Anotar en el cierre de F1.39 con qué commit del backend se verificó:")
    print("  npm run backend-drift")

    if bloqueado_admin is not None:
        print()
        print(f"humo ⊘ BLOQUEADO para /admin/* · {bloqueado_admin}")
        print("  **La consola SÍ se verificó** · lo de arriba vale.")
        print("  `synapse-admin-wire.yaml` sigue sin confirmar contra el servicio.")
        return 2

    print("humo ✓ y las de admin coinciden con synapse-admin-wire.yaml")
    return 0


if __name__ == "__main__":
    sys.exit(main())
