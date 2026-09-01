#!/usr/bin/env python3
"""plan-de-trabajo.md → la página del plan.

No lee el markdown: lee `tools/plan-tareas.json`, que emite `plan-a-csv.py`. Un
solo parser para las dos salidas — si hubiera dos, derivarían.

Lo que NO sale del markdown y se escribe acá son las seis decisiones, el camino
crítico y las transversales: en el `.md` son prosa y tablas, no tareas, y el
parser no las toca. Cuando cambien allá, cambian acá.

    python3 tools/plan-a-html.py     ·     npm run plan
"""
import json, pathlib, html, re, sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent
FUENTE = RAIZ / 'tools' / 'plan-tareas.json'
PLANTILLA = RAIZ / 'tools' / 'plan-plantilla.html'
DESTINO = RAIZ / 'tools' / 'plan-synapse.html'

if not FUENTE.exists():
    print('✗ Falta tools/plan-tareas.json — correr antes plan-a-csv.py', file=sys.stderr)
    raise SystemExit(1)

tasks = json.loads(FUENTE.read_text())

DECISIONES = [
 ("D1","El colapso responsive <strong>entra</strong>","F1.30",
  "§3.1 de <code>design.md</code> declara tres pisos de ancho —768 la consola colapsando el grid, 1280 administración, 1600 el builder— y por debajo de 768 no se degrada: no se soporta. En v2 está implementado, con ancla de spec y prueba. <code>nuevo-desarrollo.md</code> no lo menciona: su §14.13 fija <code>repeat(12, 1fr)</code> sin colapso.",
  "Entra. <code>columnsFor()</code> ya está escrita en <code>render/grid.ts</code>; falta cablearla a la superficie."),
 ("D2","El layout declara el gráfico — y primero se declaran los mínimos","B1.21 · B4.16 · F1.31 · F4.21",
  "La pregunta era si <code>PanelConfigurado</code> debía llevar el gráfico además del tipo de bloque. La observación que la acompañó es la que ordena la respuesta: <em>los gráficos dependen de los datos, y hay que establecer los datos mínimos para construir el gráfico</em>.",
  "Sí, el layout declara el gráfico. Pero el entregable importante no es el campo — es la tabla de mínimos, y va primero. Agregar <code>plot?: PlotId</code> es barato y no rompe nada: ausente ⇒ el gráfico por defecto del tipo. Lo que hace segura esa elección todavía no existe: <code>synapse-plots.js</code> declara <code>formas</code>, <code>soportaBanda</code> y <code>tope</code> —el límite superior— pero <strong>no declara mínimos</strong>. Sin ellos, un gráfico puede recibir dos puntos donde necesita cinco y dibujar algo que engaña. Y los mínimos sirven igual aunque nunca se elija gráfico: hoy nada impide que <code>bars</code> reciba un ítem y dibuje una barra sola."),
 ("D3","Las cuatro superficies de v2 quedan <strong>diferidas</strong>","F3.9 · F3.10 · F3.11 · F5.4 · B5.4",
  "Drill-down C2, hallazgos C4 con el framework de accionables <code>PS-17</code>, el viaje de solicitud de acceso, y el módulo MMM. El contrato ya las cubre: <code>/config/decisiones</code>, <code>/config/accionables</code> y <code>/config/solicitudes</code> están en el yaml.",
  "No se descartan y no se planifican todavía: entran cuando el backend llegue a ese tramo. Llevan estado propio <code>diferida</code> para que en la plataforma de seguimiento no se confundan con lo pendiente del sprint. Lo que falta es el servicio, no el diseño."),
 ("D4","TypeScript baja a 5.9 · <strong>hecho</strong>","F0.10",
  "El andamio pinaba <code>typescript@~6.0.2</code> y <code>openapi-typescript@7</code> declara peer <code>^5.x</code>, así que <code>npm install</code> lo rechazaba y la generación corría por <code>npx</code>. §4 exige que <code>api/types.ts</code> se genere desde OpenAPI, así que la cadena de generación manda sobre la versión del compilador.",
  "<code>typescript@~5.9.3</code>. Se quitó <code>ignoreDeprecations: \"6.0\"</code>, que solo existe en TS 6. Verificado el 2026-09-01: <code>npm install</code> sin <code>--legacy-peer-deps</code>, <code>npm run gen:api</code> corre desde el <code>package.json</code>, y <code>tsc -b</code>, <code>build</code> y <code>lint</code> en verde con las cuatro flags estrictas puestas."),
 ("D5","La puerta de calidad <strong>se porta</strong>","F0.11 · F0.12",
  "<code>nuevo-desarrollo.md</code> no la menciona, y con razón: es de nuestro lado, no del desarrollador del backend. Por eso no la contempla, no porque la descarte.",
  "Se porta: <code>design-lint</code> reapuntado a Tailwind, <code>spec-anclas</code>, <code>token-drift</code> y <code>contract-drift</code>. El antecedente es concreto — el 2026-08-20 en v2 el colapso responsive violaba §3.1 de tres formas distintas <strong>con 184 pruebas en verde</strong>, porque estaban escritas mirando el código."),
 ("D6","<code>Metrica.base</code> — se cierra la propuesta de spec","T8",
  "§6.2 y §17 del documento declaran <code>base</code> obligatorio en el catálogo. El yaml ya lo tiene en <code>required</code>; <code>design.md</code> todavía no.",
  "Se cierra, para mantener las tres fuentes alineadas. La propuesta sube al humano —el agente no modifica <code>design.md</code>— y al aprobarse, catálogo, yaml y spec dicen lo mismo. Consecuencia directa: un panel <code>BLOQUEADO</code>, que no lleva <code>Gobierno</code>, <strong>puede</strong> mostrar su BASE."),
]

CAMINO = [
 ("B0.9","Las cinco preguntas abiertas del contrato","Bloquean F2.1, F2.3 y el diseño de estados. Es lo más barato del plan y lo que más desbloquea."),
 ("B0.10","Endpoint de login","Sin él F0.5 no cierra y el front no entra a la aplicación."),
 ("F0.9 · F0.11","Runner de pruebas y puerta de calidad","Antes del traslado. Portar 2.800 líneas sin puerta es repetir el fallo del 2026-08-20."),
 ("F1.13a → F1.13j","El traslado, en ese orden","Las primitivas no dependen de nada; los cuerpos dependen de todo lo anterior."),
 ("B1.16 · B1.20","Seed determinista","Desbloquea F1.25 y toda la Fase 2 del front."),
 ("B1.21","Los mínimos por gráfico","Habilita F1.31, y F1.31 habilita B4.16 y F4.21. Es el orden que fija D2: primero qué necesita cada gráfico, después quién lo elige."),
 ("T8","Cerrar <code>Metrica.base</code> en <code>design.md</code>","No bloquea código, pero mientras siga abierto las tres fuentes de autoridad dicen cosas distintas."),
]

TRANSVERSALES = [
 ("T1","El yaml es la fuente de verdad del contrato","Backend escribe · front consume","Un cambio en el yaml que el backend no implemente rompe CI de alguno de los dos"),
 ("T2","Documentar las reglas de los 15 bloques","Backend valida · front muestra","La tabla vive en un solo lugar y se sirve por <code>/config/blocks</code>"),
 ("T3","Acordar el formato de eventos SSE","Backend","Los seis eventos con su forma, declarados en el yaml"),
 ("T4","Acordar <code>ContextoDePanel</code>","Ambos","Declarado en el yaml, no en un documento aparte"),
 ("T5","Seed de demo","Backend","Ver B1.16 y B1.20"),
 ("T6","Ambiente de desarrollo: backend + front + Postgres","Ambos","Un comando levanta los tres; el front apunta a <code>VITE_API_URL</code>"),
 ("T7","Conformidad con <code>design.md</code> y <code>parametros-front.md</code>","Front","Automatizada en F0.11, no manual"),
 ("T8","Cerrar D6: <code>Metrica.base</code> a <code>design.md</code> · decidido, falta ejecutar","Front propone · humano aprueba","Las tres fuentes dicen lo mismo; un panel <code>BLOQUEADO</code> puede mostrar su BASE"),
 ("T9","Destino de las cuatro superficies de v2 · cerrada por D3","Humano","Quedan diferidas: se retoman cuando el backend llegue a ese tramo"),
]

FASES = {
 'back': {0:"Fundamentos e infraestructura",1:"API de consola",2:"Materialización y cache",3:"Chat contextual",4:"Admin y Builder",5:"Multi-dashboard y pulido"},
 'front':{0:"Fundamentos",1:"Consola y el traslado de render/",2:"Estados de materialización",3:"Chat contextual",4:"Admin y Builder",5:"Multi-dashboard, pruebas y pulido"},
}

e = html.escape
def md(s):
    s = e(s)
    s = re.sub(r'`([^`]+)`', r'<code>\1</code>', s)
    s = re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', s)
    return s

filas = []
for eq in ('back','front'):
    for fase in range(6):
        grupo = [t for t in tasks if t['equipo']==eq and t['fase']==fase]
        if not grupo: continue
        sigla = ('B' if eq=='back' else 'F') + str(fase)
        filas.append(f'<h3 class="fase" data-equipo="{eq}" data-fase="{fase}">'
                     f'<span class="fase-n">{sigla}</span><span>{e(FASES[eq][fase])}</span>'
                     f'<span class="fase-c">{len(grupo)}</span></h3>')
        for t in grupo:
            marcas = [f'<span class="fase-chip"><b>{sigla}</b> · Fase {fase}</span>']
            if t['nueva']: marcas.append('<span class="marca nueva">nueva</span>')
            if t['bloqueada']:
                dep = f' · {e(t["dep"])}' if t['dep'] else ''
                marcas.append(f'<span class="marca bloq">bloqueada{dep}</span>')
            crit = ''.join(f'<li>{md(c)}</li>' for c in t['criterios'])
            desc = f'<p class="desc">{md(t["desc"])}</p>' if t['desc'] else ''
            filas.append(
              f'<article class="tarea" data-equipo="{eq}" data-fase="{fase}" '
              f'data-estado="{t["estado"]}" data-bloq="{int(t["bloqueada"])}" data-nueva="{int(t["nueva"])}">'
              f'<div class="cab"><span class="tid">{e(t["id"])}</span>'
              f'<span class="pill {t["estado"]}">{t["estado"]}</span>{"".join(marcas)}</div>'
              f'<h4 class="tit">{md(t["titulo"])}</h4>{desc}'
              f'<div class="crit"><span class="rot">Criterio de aceptación</span><ul>{crit}</ul></div>'
              f'</article>')

n_back = sum(1 for t in tasks if t['equipo']=='back')
dec = ''.join(
  f'<article class="dec"><div class="cab"><span class="tid">{d[0]}</span>'
  f'<span class="marca resuelta">resuelta</span>'
  f'<span class="fase-chip">afecta {d[2]}</span></div>'
  f'<h4 class="tit">{d[1]}</h4><p class="desc">{d[3]}</p>'
  f'<p class="res"><span class="rot">Resolución</span>{d[4]}</p></article>' for d in DECISIONES)
cam = ''.join(f'<li><span class="tid">{c[0]}</span><div><strong>{e(c[1])}</strong><p>{c[2]}</p></div></li>' for c in CAMINO)
tra = ''.join(f'<tr><td><span class="tid">{t[0]}</span></td><td>{t[1]}</td><td class="dim">{t[2]}</td><td>{t[3]}</td></tr>' for t in TRANSVERSALES)

salida = (PLANTILLA.read_text()
  .replace('{{DECISIONES}}', dec).replace('{{TAREAS}}', ''.join(filas))
  .replace('{{CAMINO}}', cam).replace('{{TRANSVERSALES}}', tra)
  .replace('{{N_TOTAL}}', str(len(tasks)))
  .replace('{{N_BACK}}', str(n_back)).replace('{{N_FRONT}}', str(len(tasks)-n_back))
  .replace('{{N_NEW}}', str(sum(t['nueva'] for t in tasks)))
  .replace('{{N_DIF}}', str(sum(1 for t in tasks if t['estado']=='diferida')))
  .replace('{{N_HECHO}}', str(sum(1 for t in tasks if t['estado']=='hecho')))
  .replace('{{N_PARCIAL}}', str(sum(1 for t in tasks if t['estado']=='parcial'))))

sobran = re.findall(r'\{\{[A-Z_]+\}\}', salida)
if sobran:
    print(f'✗ Marcadores sin reemplazar en la plantilla: {sobran}', file=sys.stderr)
    raise SystemExit(1)

DESTINO.write_text(salida)
print(f'✓ {len(tasks)} tareas · {round(len(salida.encode())/1024, 1)} KB')
print(f'  → {DESTINO.relative_to(RAIZ)}')
