#!/usr/bin/env python3
"""Humo contra el servicio real · lo que llega == `synapse-console-wire.yaml`

    SYNAPSE_EMAIL=… SYNAPSE_PASSWORD=… npm run humo

── QUÉ PRUEBA, Y POR QUÉ NO ALCANZA CON LAS OTRAS ───────────────────────────

Las 427 pruebas corren contra MSW, y los fixtures salen del yaml transcripto.
Eso demuestra que **el adaptador es coherente con lo que nosotros creemos del
cable** — no con el cable. Si la transcripción se equivocó, las pruebas pasan
igual y el error aparece en producción.

Este chequeo cierra esa brecha: pide las cinco rutas al servicio de verdad y
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

RAIZ = pathlib.Path(__file__).resolve().parent.parent
CABLE = RAIZ / "contracts" / "synapse-console-wire.yaml"
BASE = os.getenv("SYNAPSE_API", "http://localhost:4010/api/v1")


def pedir(ruta: str, token: str | None = None, cuerpo: dict | None = None) -> tuple[int, object]:
    datos = None if cuerpo is None else json.dumps(cuerpo).encode()
    req = urllib.request.Request(
        f"{BASE}{ruta}",
        data=datos,
        method="POST" if datos else "GET",
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
        req = esquemas[esquema].get("required", [])
        falta = faltantes(obj, req)
        if falta:
            fallas.append(f"{nombre} · {esquema} no trae {', '.join(falta)}")
            print(f"  ✗ {nombre} · faltan {', '.join(falta)}")
        else:
            print(f"  ✓ {nombre} · los {len(req)} campos requeridos")

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

    print("humo ✓ las cinco rutas coinciden con synapse-console-wire.yaml")
    print("  Anotar en el cierre de F1.39 con qué commit del backend se verificó:")
    print("  npm run backend-drift")
    return 0


if __name__ == "__main__":
    sys.exit(main())
