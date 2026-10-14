#!/usr/bin/env python3
"""Aplica una composición de `dev/dashboards/` contra un servicio corriendo.

**Los paneles vienen por `metric_key` y acá se resuelven a `metric_id`**, que es
lo que hace que el archivo sobreviva a una base nueva. Si una clave no está en el
catálogo del tenant, FALLA nombrándola en vez de publicar un dashboard con un
panel menos: un panel que desaparece en silencio es la clase de error que esta
herramienta existe para no cometer.

Uso:
    SYNAPSE_EMAIL=… SYNAPSE_PASSWORD=… python3 tools/aplicar-dashboard.py \
        dev/dashboards/ua-mx.json --nombre "UA MX" --slug ua-mx
"""
import argparse, json, os, sys, urllib.error, urllib.request

API = os.environ.get('SYNAPSE_API', 'http://localhost:4010/api/v1')


def pedir(metodo, ruta, token=None, cuerpo=None):
    datos = None if cuerpo is None else json.dumps(cuerpo).encode()
    cab = {'Content-Type': 'application/json'}
    if token:
        cab['Authorization'] = f'Bearer {token}'
    req = urllib.request.Request(f'{API}{ruta}', data=datos, headers=cab, method=metodo)
    try:
        with urllib.request.urlopen(req) as r:
            return json.load(r).get('data')
    except urllib.error.HTTPError as e:
        print(f'  ✗ {metodo} {ruta} → {e.code} · {e.read().decode()[:200]}', file=sys.stderr)
        raise


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('composicion')
    ap.add_argument('--nombre', required=True)
    ap.add_argument('--slug', required=True)
    ap.add_argument('--version', default='v1')
    # **`--sin-graficos` y no un segundo JSON**, a propósito: una copia del
    # archivo con tres campos menos deriva del original en la primera edición, y
    # el día que el repertorio esté desplegado nadie se acuerda de cuál es cuál.
    #
    # Existe por una razón con fecha: el 2026-10-05 QA corría un binario anterior
    # a `c8b9247`, donde `GET /config/plots` da 404. Sin repertorio el front no
    # puede resolver un `chart`, y un panel que lo declara cae en
    # `UnknownPlotState` — se pinta nombrando el error. **Tres paneles pintados
    # como error son peores que tres paneles con su gráfico por defecto.**
    ap.add_argument('--sin-graficos', action='store_true',
                    help='quita el campo `chart` de los paneles · para un servicio sin GET /config/plots')
    args = ap.parse_args()

    correo, clave = os.environ.get('SYNAPSE_EMAIL'), os.environ.get('SYNAPSE_PASSWORD')
    if not correo or not clave:
        sys.exit('faltan SYNAPSE_EMAIL y SYNAPSE_PASSWORD')

    token = pedir('POST', '/auth/login', cuerpo={'email': correo, 'password': clave})['token']
    yo = pedir('GET', '/config/me', token)
    tenant = yo['tenant']['id']
    print(f'tenant {tenant} · {yo["tenant"]["name"]}')

    catalogo = {m['key']: m['id'] for m in pedir('GET', '/config/catalog', token)}
    comp = json.load(open(args.composicion))

    # **Se resuelven TODAS antes de crear nada.** Fallar a mitad deja un
    # dashboard vacío publicado, que es peor que no empezar.
    faltan = sorted({p['metric_key'] for t in comp['tabs'] for p in t['panels']} - set(catalogo))
    if faltan:
        sys.exit(f'estas claves no están en el catálogo del tenant: {", ".join(faltan)}')
    for t in comp['tabs']:
        for p in t['panels']:
            p['metric_id'] = catalogo[p.pop('metric_key')]

    # **Se dice QUÉ se quitó, no cuántos.** Un «3 gráficos omitidos» no deja
    # reponerlos después; con la lista, agregarlos es leer esta salida.
    if args.sin_graficos:
        quitados = []
        for t in comp['tabs']:
            for p in t['panels']:
                if p.pop('chart', None):
                    quitados.append(f"{t['key']}/{p['metric_id'][:8]}")
        print(f'sin gráficos · {len(quitados)} quitado(s): {", ".join(quitados) or "ninguno"}')

    db = pedir('POST', f'/admin/tenants/{tenant}/dashboards', token,
               {'name': args.nombre, 'slug': args.slug})
    print(f'dashboard {db["id"]}')

    lay = pedir('POST', f'/admin/tenants/{tenant}/layouts', token,
                {'version_id': '', 'dashboard_id': db['id']})
    pedir('PUT', f'/admin/layouts/{lay["id"]}', token, comp)

    val = pedir('POST', f'/admin/layouts/{lay["id"]}/validate', token)
    if not val['valid']:
        sys.exit(f'composición inválida: {val["errors"]}')
    pedir('POST', f'/admin/layouts/{lay["id"]}/publish', token, {'version_id': args.version})
    print(f'layout {lay["id"]} publicado · {args.version}')

    # **La pestaña no se ve si el rol no la declara.** `tab_keys` filtra, y un
    # dashboard publicado que no aparece se lee como un fallo del publish.
    claves = [t['key'] for t in comp['tabs']]
    for rol in pedir('GET', f'/admin/tenants/{tenant}/roles/composition', token):
        # ── UN `tab_keys` VACÍO NO ES «NINGUNA»: ES «TODAS» ───────────────────
        #
        # **Y agregarle una clave lo convierte en un filtro.** Pasó el 2026-10-05
        # aplicando esto contra QA: los roles `Admin` y `Planner` —los que tienen
        # los 12 usuarios— estaban en `[]`, quedaron en `['resumen']`, y
        # `/config/me` pasó de devolver una pestaña a devolver **cero**. La
        # consola se quedó sin nada que dibujar.
        #
        # Su código lo dice —`dd_config_service.go`, leído en `c8b9247`—:
        #
        #     if len(role.TabKeys) > 0 { … return false }   ← filtra
        #                                                     vacío cae a «todas»
        #
        # Así que un rol en `[]` **ya ve la pestaña nueva** y no hay que tocarlo.
        # Tocarlo es lo que rompe.
        if not (rol.get('tab_keys') or []):
            print(f'  rol {rol["name"]} · sin tocar · `tab_keys` vacío ya significa todas')
            continue
        nuevas = [k for k in claves if k not in rol['tab_keys']]
        if not nuevas or not rol.get('is_active'):
            continue
        pedir('PUT', f'/admin/roles/{rol["id"]}', token,
              {'name': rol['name'], 'tab_keys': rol['tab_keys'] + nuevas,
               'hidden_metric_ids': rol.get('hidden_metric_ids') or []})
        print(f'  rol {rol["name"]} · + {", ".join(nuevas)}')

    print('listo')


if __name__ == '__main__':
    main()
