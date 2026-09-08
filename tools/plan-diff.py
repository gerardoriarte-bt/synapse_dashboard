#!/usr/bin/env python3
"""Compara un export de la plataforma de seguimiento contra plan-de-trabajo.md.

`plan-de-trabajo.md` es la FUENTE; la plataforma refleja. Este chequeo existe
porque esa regla no se sostiene sola: alguien mueve un ticket allá, el markdown
no se entera, y a partir de ahí los dos dicen cosas distintas sin que nadie lo
note.

    npm run plan:diff export.csv

Sale con 0 si están alineados y 1 si hay deriva — la misma convención que
`make verify`. No conoce la plataforma: encuentra la columna que trae nuestros
identificadores (`B1.6`, `F1.13a`) y trabaja desde ahí.
"""
from __future__ import annotations

import csv, pathlib, re, sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent
NUESTRO = RAIZ / 'plan-tareas.csv'

ID = re.compile(r'^[BF]\d+\.\d+[a-j]?$')

# Cómo suele llamarse cada estado nuestro allá afuera. Es un mapa de ida: si la
# plataforma usa otro vocabulario, se agrega acá y no se toca el resto.
EQUIVALENTES = {
    'hecho':     {'hecho', 'done', 'closed', 'completado', 'finalizado', 'listo'},
    'parcial':   {'parcial', 'in progress', 'en progreso', 'en curso', 'doing'},
    'pendiente': {'pendiente', 'todo', 'to do', 'backlog', 'abierto', 'open', 'nuevo'},
    'diferida':  {'diferida', 'deferred', 'on hold', 'en espera', 'pospuesta'},
}


def normalizar(s: str) -> str:
    return ' '.join(s.split()).strip().lower()


def columna_de_ids(filas: list[dict]) -> str | None:
    """La columna cuyos valores parecen identificadores nuestros."""
    if not filas:
        return None
    mejor, puntaje = None, 0
    for col in filas[0]:
        aciertos = sum(1 for f in filas if ID.match((f.get(col) or '').strip()))
        if aciertos > puntaje:
            mejor, puntaje = col, aciertos
    # Con menos de la mitad no es la columna de ids: es una coincidencia.
    return mejor if puntaje >= len(filas) / 2 else None


def columna_por_nombre(filas: list[dict], candidatas: set[str]) -> str | None:
    for col in (filas[0] if filas else {}):
        if normalizar(col) in candidatas:
            return col
    return None


def mismo_estado(nuestro: str, suyo: str) -> bool:
    suyo = normalizar(suyo)
    if not suyo:
        return True  # La plataforma no exportó estado: no hay nada que comparar.
    return suyo in EQUIVALENTES.get(nuestro, set()) or suyo == nuestro


def main(ruta: str) -> int:
    export = pathlib.Path(ruta)
    if not export.exists():
        print(f'✗ No existe {ruta}', file=sys.stderr)
        return 1
    if not NUESTRO.exists():
        print('✗ Falta plan-tareas.csv — correr antes `npm run plan`', file=sys.stderr)
        return 1

    nuestras = {f['ID']: f for f in csv.DictReader(open(NUESTRO, encoding='utf-8'))}
    suyas_filas = list(csv.DictReader(open(export, encoding='utf-8-sig')))

    col_id = columna_de_ids(suyas_filas)
    if col_id is None:
        print('✗ No encontré una columna con nuestros identificadores (B1.6, F1.13a…).',
              file=sys.stderr)
        print(f'  Columnas del export: {", ".join(suyas_filas[0]) if suyas_filas else "ninguna"}',
              file=sys.stderr)
        print('  El import tiene que mapear `ID` a un campo que el export devuelva.',
              file=sys.stderr)
        return 1

    col_estado = columna_por_nombre(suyas_filas, {'estado', 'status', 'state'})
    col_titulo = columna_por_nombre(suyas_filas, {'titulo', 'título', 'summary', 'title', 'name'})
    suyas = {(f[col_id] or '').strip(): f for f in suyas_filas if ID.match((f[col_id] or '').strip())}

    print(f'fuente     {NUESTRO.name} · {len(nuestras)} tareas')
    print(f'plataforma {export.name} · {len(suyas)} tickets · '
          f'id en «{col_id}»'
          + (f' · estado en «{col_estado}»' if col_estado else ' · sin columna de estado')
          + (f' · título en «{col_titulo}»' if col_titulo else ''))
    print()

    huerfanos = sorted(set(suyas) - set(nuestras))
    faltantes = sorted(set(nuestras) - set(suyas))
    estados, titulos = [], []

    for tid in sorted(set(nuestras) & set(suyas)):
        n, s = nuestras[tid], suyas[tid]
        if col_estado and not mismo_estado(n['Estado'], s.get(col_estado) or ''):
            estados.append((tid, n['Estado'], normalizar(s[col_estado])))
        if col_titulo and normalizar(n['Titulo']) != normalizar(s.get(col_titulo) or ''):
            titulos.append((tid, n['Titulo'], (s.get(col_titulo) or '').strip()))

    def bloque(titulo: str, items: list, render) -> None:
        if not items:
            return
        print(f'{titulo} · {len(items)}')
        for it in items:
            print('   ' + render(it))
        print()

    bloque('TICKET SIN TAREA — se creó en la plataforma y no está en el .md',
           huerfanos, lambda t: f'{t}  ·  {(suyas[t].get(col_titulo) or "").strip()[:60]}')
    bloque('TAREA SIN TICKET — está en el .md y no se importó',
           faltantes, lambda t: f'{t}  ·  {nuestras[t]["Titulo"][:60]}')
    bloque('ESTADO DISTINTO — alguien lo movió en la plataforma',
           estados, lambda x: f'{x[0]}  ·  .md dice «{x[1]}»  ·  plataforma dice «{x[2]}»')
    bloque('TÍTULO DISTINTO — se editó de un solo lado',
           titulos, lambda x: f'{x[0]}\n       .md         {x[1][:70]}\n       plataforma  {x[2][:70]}')

    total = len(huerfanos) + len(faltantes) + len(estados) + len(titulos)
    if total == 0:
        print('✓ Alineados. La plataforma refleja el .md.')
        return 0

    print(f'✗ {total} divergencias. El .md es la fuente: se corrige allá y se '
          f'vuelve a importar,\n  o se trae el cambio al .md si la plataforma tenía razón.')
    return 1


if __name__ == '__main__':
    if len(sys.argv) != 2:
        print(__doc__)
        raise SystemExit(2)
    raise SystemExit(main(sys.argv[1]))
