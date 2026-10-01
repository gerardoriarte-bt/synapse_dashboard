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
        nuevas = [k for k in claves if k not in (rol.get('tab_keys') or [])]
        if not nuevas or not rol.get('is_active'):
            continue
        pedir('PUT', f'/admin/roles/{rol["id"]}', token,
              {'name': rol['name'], 'tab_keys': (rol.get('tab_keys') or []) + nuevas,
               'hidden_metric_ids': rol.get('hidden_metric_ids') or []})
        print(f'  rol {rol["name"]} · + {", ".join(nuevas)}')

    print('listo')


if __name__ == '__main__':
    main()
