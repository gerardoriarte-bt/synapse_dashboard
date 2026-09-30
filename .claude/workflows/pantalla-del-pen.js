export const meta = {
  name: 'pantalla-del-pen',
  description: 'Construye una pantalla dibujada en el .pen: plan desde el dibujo, cable, desarrollo, QA por mutacion y auditoria',
  whenToUse: 'Cuando hay que construir una de las pantallas A*/B*/C* que el .pen dibuja y el registro del plan declara sin construir. Se pasa por args la lista de pantallas con su frame y su ruta del servicio.',
  phases: [
    { title: 'Plan', detail: 'Lee el frame del .pen Y mide la ruta real · escribe la especificacion y las divergencias' },
    { title: 'Cable', detail: 'Transcribe la ruta al yaml, regenera los tipos y deja admin-drift en verde' },
    { title: 'Desarrollo', detail: 'Adaptador, hook y componente · con el ancla §PEN que pen-pantallas exige' },
    { title: 'QA', detail: 'Corre las pruebas y las verifica por mutacion sobre base VERDE, con control nulo' },
    { title: 'Auditoria', detail: 'Cablea en la superficie, corre la puerta entera y actualiza el registro del plan' },
  ],
}

// ── QUÉ SE CONSTRUYE ────────────────────────────────────────────────────────
//
// Cada entrada trae el nombre EXACTO del frame —buscarlo a tientas es donde se
// abre un dibujo que no es— y la ruta del servicio que la alimenta, ya medida.
const PANTALLAS = (args && args.pantallas) || []
const CON_CABLE = !(args && args.cable === false)
const CON_AUDITORIA = !(args && args.auditoria === false)

if (PANTALLAS.length === 0) {
  throw new Error('Nada que construir: pasá { pantallas: [{ id, frame, ruta, … }] }')
}

// ── LO QUE NINGÚN AGENTE PUEDE DEDUCIR ──────────────────────────────────────
//
// El `.pen` está cifrado para las herramientas de texto y se lee como JSON
// plano. El recetario va en cada prompt porque es la única forma de abrirlo.
const RECETA_PEN = `
Para leer el dibujo (NO uses Read ni Grep sobre el .pen, es JSON grande):

    python3 - <<'PY'
    import json, pathlib
    d = json.loads(pathlib.Path('design/Synapse_v2.pen').read_text())
    c = [x for x in d['children'] if x.get('name','').startswith('NOMBRE')][0]
    def walk(n, prof=0):
        linea = '  '*prof + str(n.get('type'))
        if n.get('name'): linea += f" «{n['name']}»"
        for k in ('width','height','fill','fontSize','gap','padding','cornerRadius'):
            if k in n: linea += f" {k}={n[k]}"
        if n.get('content'): linea += f"  → {n['content']!r}"
        print(linea)
        for k in n.get('children',[]) or []: walk(k, prof+1)
    walk(c)
    PY

**EL FRAME ANTES QUE LA NOTA.** Las notas cuentan el porqué; los frames tienen
los números, los colores y el TEXTO LITERAL de la interfaz, que es normativo y
gana sobre design.md. Los tokens se escriben '$ink', '$dim', '$elev', '$acc' y
salen de src/tokens/tokens.css.`

// El servicio local, que es contra lo que se mide. La credencial es la sembrada
// en la base descartable: para medir NO hace falta una credencial real.
const RECETA_SERVICIO = `
Para medir la ruta contra el servicio corriendo en :4010:

    T=$(curl -s -X POST http://localhost:4010/api/v1/auth/login \\
      -H 'Content-Type: application/json' \\
      -d '{"email":"dev@synapse.local","password":"synapse"}' \\
      | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['token'])")
    curl -s "http://localhost:4010/api/v1/<RUTA>" -H "Authorization: Bearer $T" | python3 -m json.tool

**Y ANTES DE ATRIBUIRLE NADA AL BACKEND, COMPROBÁ DE QUIÉN ES EL CÓDIGO.** El
binario de :4010 se construye desde NUESTRO fork, así que nuestro propio código
se ve como avance de ellos. Es una trampa registrada y ya pagada:

    cd ~/Documents/GitHub/synapse-api-go-fork
    git log -1 --format="%h %an · %s" -L <linea>,<linea>:internal/adapters/handler/router.go`

const REGLAS = `
REGLAS DE LA CASA que aplican a esto, y no son opcionales:

· **Nada se escribe de memoria.** Si se puede leer de la fuente, se lee. Un
  fixture inventado verifica el fixture.
· **El adaptador renombra y reformatea; NO calcula, NO inventa una cifra y NO
  escribe copy de producto.** Donde el cable no trae el campo, el campo queda
  ausente y hay una prueba que lo atestigua.
· **Identificadores en inglés, comentarios y UI en español.** Las claves del
  contrato no se traducen.
· **Un hex literal es un bug**: todo color sale de un token. El naranja $acc no
  es color de datos. Ámbar y amarillo prohibidos. Deltas en color neutro.
· **Ningún número desnudo**: todo valor lleva su label en mayúsculas, mono 10.
· **render/ no acepta className desde afuera** y no importa VALORES de api/.
· **El spread condicional de JSX apaga el chequeo de props en exceso**, así que
  una prop mal nombrada COMPILA. La regla de prueba es verificar que el callback
  DISPARE, no que el botón exista.
· **Un CTA sin manejador no se pinta.**
· Los tamaños de texto salen de la escala: nada de text-[13px] ni text-sm.`

const SPEC = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    archivos: { type: 'array', items: { type: 'string' }, description: 'Los que hay que escribir o tocar, con ruta' },
    ancla: { type: 'string', description: 'El §PEN:<id> que pen-pantallas va a exigir, y en qué archivo va' },
    dibujo: { type: 'string', description: 'Lo medido en el frame: jerarquía, tamaños, tokens y el TEXTO LITERAL de cada rótulo' },
    servicio: { type: 'string', description: 'La respuesta REAL de la ruta, capturada, con los campos que trae' },
    divergencias: { type: 'array', items: { type: 'string' }, description: 'Dónde el dibujo pide algo que el servicio no da, y qué se hace en su lugar' },
    adaptador: { type: 'string', description: 'Qué renombra, y qué campo del dibujo queda AUSENTE por no venir en el cable' },
    aserciones: { type: 'array', items: { type: 'string' }, description: 'Qué tiene que afirmar la prueba, cada una capaz de fallar' },
    riesgos: { type: 'array', items: { type: 'string' } },
  },
  required: ['id', 'archivos', 'ancla', 'dibujo', 'servicio', 'divergencias', 'adaptador', 'aserciones', 'riesgos'],
}

const ENTREGA = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    archivos: { type: 'array', items: { type: 'string' } },
    resumen: { type: 'string' },
    desviaciones: { type: 'array', items: { type: 'string' }, description: 'Dónde se apartó de la especificación y por qué' },
    sinResolver: { type: 'array', items: { type: 'string' } },
  },
  required: ['id', 'archivos', 'resumen', 'desviaciones', 'sinResolver'],
}

const VEREDICTO = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    baseVerde: { type: 'boolean', description: 'Las pruebas pasaban ANTES de mutar' },
    controlSobrevive: { type: 'boolean', description: 'La mutación NULA sobrevivió · sin esto un arnés roto se lee como suite perfecta' },
    mutaciones: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          que: { type: 'string' },
          seAplico: { type: 'boolean' },
          murio: { type: 'boolean' },
        },
        required: ['que', 'seAplico', 'murio'],
      },
    },
    aprobado: { type: 'boolean' },
    problemas: { type: 'array', items: { type: 'string' } },
  },
  required: ['id', 'baseVerde', 'controlSobrevive', 'mutaciones', 'aprobado', 'problemas'],
}

// ── 1 · PLAN ────────────────────────────────────────────────────────────────

phase('Plan')
const specs = await parallel(
  PANTALLAS.map((p) => () =>
    agent(
      `Sos el analizador. Escribí la especificación de la pantalla \`${p.id}\` para que otro
agente la construya SIN volver a abrir el dibujo ni volver a medir el servicio.

**Su frame en el \`.pen\` se llama exactamente:** \`${p.frame}\`
**La ruta que la alimenta:** \`${p.ruta}\`
${p.contexto ? `\n**Contexto que ya se midió y no hace falta rehacer:**\n${p.contexto}\n` : ''}
${RECETA_PEN.replace('NOMBRE', p.frame.split(' ')[0])}
${RECETA_SERVICIO}
${REGLAS}

Tu trabajo tiene DOS mitades y ninguna se puede saltar:

1. **Abrí el dibujo** y transcribí su jerarquía, sus tamaños, sus tokens y **el
   texto literal de cada rótulo**. Ese texto es normativo.
2. **Llamá a la ruta** y capturá lo que devuelve DE VERDAD, campo por campo.

Y después la parte que vale: **cruzá las dos y listá las DIVERGENCIAS.** Dónde
el dibujo pide un dato que el servicio no manda, decí qué se pinta en su lugar
—y si la respuesta es «se compone una frase», pará: el adaptador no escribe copy
de producto, así que eso es una propuesta de spec y no una rama.

Leé también \`plan-de-trabajo.md\` en la sección «Registro de pantallas del
\`.pen\`» para ver qué dice hoy la fila de esta pantalla, y \`CLAUDE.md\`.

NO escribas código. Sólo la especificación.`,
      { label: `plan:${p.id}`, phase: 'Plan', schema: SPEC },
    ),
  ),
)

const vivos = PANTALLAS.map((p, i) => ({ p, spec: specs[i] })).filter((x) => x.spec)
log(`${vivos.length} de ${PANTALLAS.length} con especificación`)

// ── 2 · CABLE ───────────────────────────────────────────────────────────────
//
// Va APARTE del desarrollo y antes, porque el desarrollo necesita los tipos
// generados. Y toca un archivo compartido —el yaml y su `*-generated.ts`— así
// que corre una sola vez, secuencial, nunca en paralelo con otra pantalla.

if (CON_CABLE) {
  phase('Cable')
  await agent(
    `Sos quien transcribe el cable. Hay que llevar al contrato las rutas que estas
pantallas necesitan, y dejar el chequeo de deriva en verde.

Las pantallas y sus rutas:
${vivos.map((x) => `· ${x.p.id} → ${x.p.ruta}`).join('\n')}

Lo que cada analizador midió del servicio:
${vivos.map((x) => `\n### ${x.p.id}\n${x.spec.servicio}`).join('\n')}

**Dónde va:** \`contracts/synapse-admin-wire.yaml\` si la ruta es \`/admin/*\`,
\`contracts/synapse-console-wire.yaml\` si es \`/config/*\`. Mirá primero si la
ruta YA está transcripta — varias lo están.

Después regenerá y verificá:

    npm run gen:admin-wire   # o gen:console-wire
    npm run admin-drift      # o console-drift

**UN CAMPO SE TRANSCRIBE COMO EL SERVICIO LO MANDA, no como nos gustaría.**
El 2026-09-28 \`request_from\` decía "administrator" y el servicio mandaba
"admin": el aviso se archivó en prosa y nunca bajó al yaml. Copiá de la captura.

**Y marcá \`x-verificado-en\` con el commit contra el que se midió** si el yaml
usa esa marca en las rutas vecinas.

${REGLAS}

NO toques componentes ni pruebas. Sólo el contrato y lo generado.`,
    { label: 'cable', phase: 'Cable' },
  )
}

// ── 3 · DESARROLLO ──────────────────────────────────────────────────────────

phase('Desarrollo')
const entregas = await parallel(
  vivos.map((x) => () =>
    agent(
      `Sos el desarrollador. Construí la pantalla \`${x.p.id}\` siguiendo esta
especificación, que salió de leer su frame \`${x.p.frame}\` y de medir su ruta.

${JSON.stringify(x.spec, null, 2)}

${REGLAS}

**EL ANCLA NO ES DECORATIVA.** El archivo lleva \`${x.spec.ancla}\` y
\`npm run pen-pantallas\` falla sin ella. Se escribe mirando el dibujo: ese es
el punto.

**Escribí también su prueba**, en \`tests/\` espejando la ruta del código. Si
renderiza, la primera línea del archivo es \`// @vitest-environment jsdom\`.

**Las divergencias que el analizador declaró van ATADAS por una aserción**, no
sueltas en un comentario: una divergencia sin prueba deriva en silencio el día
que alguien la "arregle".

Corré \`npx tsc --noEmit -p tsconfig.app.json\` y tus propias pruebas antes de
entregar. **NO corras la puerta entera** y **NO cablees la pantalla en su
superficie** —eso toca archivos compartidos y lo hace la auditoría—.`,
      { label: `dev:${x.p.id}`, phase: 'Desarrollo', schema: ENTREGA },
    ),
  ),
)

// ── 4 · QA ──────────────────────────────────────────────────────────────────

phase('QA')
const veredictos = await parallel(
  vivos.map((x, i) => () => {
    const e = entregas[i]
    if (!e) return Promise.resolve(null)
    return agent(
      `Sos QA de la pantalla \`${x.p.id}\`. No la construiste vos y **tu trabajo NO es
aprobarla**: es averiguar si sus pruebas demuestran algo.

Lo entregado: ${JSON.stringify(e.archivos)}
Desviaciones declaradas: ${JSON.stringify(e.desviaciones)}
Sin resolver: ${JSON.stringify(e.sinResolver)}
Las aserciones que la especificación pedía: ${JSON.stringify(x.spec.aserciones)}

**EL ARNÉS DE MUTACIÓN, Y SUS DOS MITADES QUE YA FALLARON ACÁ:**

1. **Corré la base PRIMERO y exigí que esté VERDE.** Una mutación sobre un árbol
   ya roto se lee igual que una prueba fuerte, porque mata algo que ya estaba
   muerto.
2. **Comprobá que la mutación SE APLICÓ**: contá las coincidencias del texto a
   reemplazar y exigí que sea exactamente una. Una mutación que no se aplicó se
   lee igual que una prueba débil.
3. **Corré una MUTACIÓN NULA de control que tiene que SOBREVIVIR.** Sin ese
   control, un arnés roto se lee idéntico a una suite perfecta — pasó el
   2026-09-30: \`--reporter=basic\` no existe en vitest 4, el proceso salía
   distinto de cero sin correr una prueba, y dieciséis mutaciones dieron
   "muertas" con el detalle de fallos VACÍO. El vacío era la señal.
4. **Y la mutación tiene que reproducir el defecto REAL.** Una a medias miente
   en las dos direcciones: el mismo día, mover una pantalla de una tabla a otra
   sin sacarla de la primera SOBREVIVIÓ, porque la segunda gana en el render.

Buscá sobre todo lo que este repositorio ya se comió:
· una prueba que afirma lo que el código hace, sin citar el dibujo ni el cable;
· un callback que se verifica por la EXISTENCIA del botón y no por su disparo;
· una divergencia declarada en prosa y sin aserción;
· un caso negativo cuyo ejemplo dejó de serlo.

Si encontrás huecos, **agregá las pruebas que faltan** y reverificá. Podés tocar
el archivo de prueba; **no toques archivos compartidos**.`,
      { label: `qa:${x.p.id}`, phase: 'QA', schema: VEREDICTO },
    )
  }),
)

// ── 5 · AUDITORÍA ───────────────────────────────────────────────────────────
//
// Cablea en la superficie, corre la puerta y escribe el cumplimiento. Toca
// archivos compartidos, así que es una sola y va al final.

let auditoria = null
if (CON_AUDITORIA) {
  phase('Auditoria')
  auditoria = await agent(
    `Sos el auditor. Te llega lo construido y tu trabajo es **dejarlo servido y
decir la verdad sobre el cumplimiento**.

${vivos
  .map((x, i) => {
    const e = entregas[i]
    const v = veredictos[i]
    return `### ${x.p.id}
archivos: ${JSON.stringify(e && e.archivos)}
resumen: ${e && e.resumen}
desviaciones: ${JSON.stringify(e && e.desviaciones)}
QA aprobó: ${v && v.aprobado} · base verde: ${v && v.baseVerde} · control sobrevive: ${v && v.controlSobrevive}
problemas del QA: ${JSON.stringify(v && v.problemas)}`
  })
  .join('\n\n')}

**Lo que tenés que hacer, en este orden:**

1. **Cablear la pantalla en su superficie.** Si estaba declarada en una tabla de
   pendientes, sacarla de ahí — y si el aviso que mostraba decía algo que ya no
   es cierto, ese aviso también era un defecto.
2. \`npm run verify\` **entera**, y dejarla en verde. Si algo se pone rojo,
   arreglalo; si no se puede, decilo sin maquillar.
3. **Actualizar el registro de pantallas de \`plan-de-trabajo.md\`** con el
   archivo y su ancla. Ojo: la marca literal «No construida» es lo que cuenta
   \`pen-pantallas\`, así que **no la escribas en prosa** dentro de una fila que
   sí está construida.
4. **Mover el estado de su tarea en el plan**, con la evidencia: contra qué se
   cerró y con qué fecha. «CERRADA contra el servicio real» se lee como
   definitivo y puede ser una foto de la semilla — decí contra qué commit y con
   qué dato.

${REGLAS}

**Lo que NO hacés:** dar por buena una pantalla que su QA no aprobó. Si el
veredicto vino en falso, cableala igual sólo si el problema es de pruebas y no
de comportamiento, y **dejá el problema escrito arriba de todo**.

Devolvé un informe en prosa: qué quedó servido, qué salió rojo, y qué no se
pudo cerrar con su razón.`,
    { label: 'auditoria', phase: 'Auditoria' },
  )
}

return {
  pantallas: PANTALLAS.map((p) => p.id),
  aprobadas: vivos.filter((x, i) => veredictos[i] && veredictos[i].aprobado).map((x) => x.p.id),
  veredictos: veredictos.filter(Boolean),
  auditoria,
}
