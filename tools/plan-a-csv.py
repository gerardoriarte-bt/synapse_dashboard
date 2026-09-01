#!/usr/bin/env python3
"""plan-de-trabajo.md → plan-tareas.csv

El `.md` es la FUENTE. El CSV se genera desde él y se pisa entero en cada
corrida: editarlo a mano es trabajo que se pierde en la próxima generación.

Qué NO viaja al CSV, porque no son tareas y no tienen fila: las seis decisiones,
la convención de identificadores, la tabla de estados, el camino crítico, las
nueve transversales y las notas de estimación. Eso vive solo en el `.md`.

    python3 tools/plan-a-csv.py     ·     npm run plan
"""
import csv, json, pathlib, re, sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent
FUENTE = RAIZ / 'plan-de-trabajo.md'
DESTINO = RAIZ / 'plan-tareas.csv'

ESTADOS = {'✅': 'hecho', '⚠️': 'parcial', '⬜': 'pendiente', '🕓': 'diferida'}

FASES = {
    'back': {0: 'Fundamentos e infraestructura', 1: 'API de consola',
             2: 'Materialización y cache', 3: 'Chat contextual',
             4: 'Admin y Builder', 5: 'Multi-dashboard y pulido'},
    'front': {0: 'Fundamentos', 1: 'Consola y el traslado de render/',
              2: 'Estados de materialización', 3: 'Chat contextual',
              4: 'Admin y Builder', 5: 'Multi-dashboard, pruebas y pulido'},
}

# Un encabezado de tarea: `### ➕ F1.13a ⬜ Título · 🔒 depende de X`
ENCABEZADO = re.compile(r'^#{3,4} (➕ )?([BF]\d+\.\d+[a-j]?) (✅|⚠️|⬜|🕓) (.+)$')


def parsear(texto: str) -> list[dict]:
    """Recorre el markdown acumulando encabezados hasta encontrar su prosa.

    Varias tareas pueden compartir un bloque de descripción y criterio —en el
    `.md` van agrupadas—. Acá se les reparte a todas, de modo que cada fila del
    CSV se lea sola: un ticket que remite a otro ticket no sirve.
    """
    tareas: list[dict] = []
    pendientes: list[dict] = []
    buffer: list[str] = []

    def cerrar() -> None:
        nonlocal pendientes, buffer
        if not pendientes:
            buffer = []
            return
        bloque = '\n'.join(buffer)
        desc, criterios = '', []

        m = re.search(r'\*\*Descripci[oó]n[^*]*\*\*\s*(.*?)'
                      r'(?=\*\*Criterio|\*\*Descripci|\*\*Estado|\Z)', bloque, re.S)
        if m:
            desc = ' '.join(m.group(1).split())

        # La nota de «diferida» se pega a la descripción: en la plataforma de
        # seguimiento explica por qué el ticket existe pero no se estima.
        m = re.search(r'\*\*Estado: diferida\*\*[^\n]*(?:\n(?!\*\*|\n)[^\n]*)*', bloque)
        nota = ' '.join(m.group(0).split()) if m else ''

        m = re.search(r'\*\*Criterio de aceptaci[oó]n[^*]*\*\*\s*(.*)', bloque, re.S)
        if m:
            cuerpo = m.group(1)
            criterios = [' '.join(x.split())
                         for x in re.findall(r'^- (.+?)(?=\n- |\n\n|\Z)', cuerpo, re.S | re.M)]
            if not criterios:
                suelto = ' '.join(cuerpo.split())
                if suelto:
                    criterios = [suelto]

        for t in pendientes:
            t['desc'] = (desc + ' ' + nota).strip()
            t['criterios'] = criterios
            tareas.append(t)
        pendientes, buffer = [], []

    for linea in texto.split('\n'):
        m = ENCABEZADO.match(linea)
        if m:
            if buffer and pendientes:
                cerrar()
            nueva, tid, estado, titulo = m.group(1) is not None, *m.group(2, 3, 4)
            equipo = 'back' if tid[0] == 'B' else 'front'
            fase = int(re.match(r'[BF](\d+)', tid).group(1))
            dep = re.search(r'🔒 depende de (.+?)$', titulo)
            pendientes.append({
                'id': tid, 'equipo': equipo, 'fase': fase,
                'faseNombre': FASES[equipo][fase],
                'epic': f'{"Backend" if equipo == "back" else "Front"} · '
                        f'Fase {fase} — {FASES[equipo][fase]}',
                'estado': ESTADOS[estado], 'nueva': nueva,
                'bloqueada': '🔒' in titulo,
                'titulo': re.sub(r'\s*·?\s*🔒.*$', '', titulo).strip(),
                'dep': dep.group(1).strip() if dep else '',
            })
            continue
        # Cualquier otro encabezado cierra el grupo abierto.
        if re.match(r'^#{1,3} ', linea):
            cerrar()
            continue
        if pendientes:
            buffer.append(linea)
    cerrar()
    return tareas


def sin_marcas(s: str) -> str:
    """El markdown inline no sirve en una celda de Jira."""
    return re.sub(r'[`*]', '', s)


def escribir(tareas: list[dict]) -> None:
    with open(DESTINO, 'w', newline='', encoding='utf-8') as f:
        w = csv.writer(f)
        w.writerow(['ID', 'Epic', 'Equipo', 'Fase', 'FaseNombre', 'Titulo',
                    'Descripcion', 'CriterioDeAceptacion', 'Estado', 'EsNueva',
                    'BloqueadaPor', 'Etiquetas'])
        for t in tareas:
            w.writerow([
                t['id'], t['epic'],
                'Backend' if t['equipo'] == 'back' else 'Front',
                t['fase'], t['faseNombre'],
                sin_marcas(t['titulo']), sin_marcas(t['desc']),
                '\n'.join('• ' + sin_marcas(c) for c in t['criterios']),
                t['estado'], 'si' if t['nueva'] else 'no', t['dep'],
                ' '.join(filter(None, [
                    f'equipo:{"backend" if t["equipo"] == "back" else "front"}',
                    f'fase:{t["fase"]}', f'estado:{t["estado"]}',
                    'nueva' if t['nueva'] else '',
                    'bloqueada' if t['bloqueada'] else '']))])


def main() -> int:
    tareas = parsear(FUENTE.read_text())

    # Una tarea sin criterio verificable no entra al plan: es la regla que el
    # propio documento declara, así que el generador la hace cumplir.
    sin_criterio = [t['id'] for t in tareas if not t['criterios']]
    if sin_criterio:
        print(f'✗ {len(sin_criterio)} tareas sin criterio de aceptación: '
              f'{", ".join(sin_criterio)}', file=sys.stderr)
        return 1

    escribir(tareas)
    (RAIZ / 'tools' / 'plan-tareas.json').write_text(
        json.dumps(tareas, ensure_ascii=False, indent=2))

    back = sum(1 for t in tareas if t['equipo'] == 'back')
    por_estado: dict[str, int] = {}
    for t in tareas:
        por_estado[t['estado']] = por_estado.get(t['estado'], 0) + 1
    print(f'✓ {len(tareas)} tareas · {back} backend · {len(tareas) - back} front')
    print('  ' + ' · '.join(f'{k} {v}' for k, v in sorted(por_estado.items())))
    print(f'  → {DESTINO.relative_to(RAIZ)}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
