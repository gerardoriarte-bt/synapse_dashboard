export const meta = {
  name: 'graficos-con-dato-real',
  description: 'Construye plots del repertorio desde el .pen: plan, desarrollo, QA por mutacion y auditoria',
  whenToUse: 'Cuando hay que construir uno o varios de los 49 graficos de SYNAPSE_PLOTS que el .pen dibuja y el front todavia no implementa. Se pasa por args la lista de ids.',
  phases: [
    { title: 'Base', detail: 'El despacho: ningun cuerpo cae al grafico por defecto en silencio' },
    { title: 'Plan', detail: 'Un analizador por grafico · lee su frame del .pen y escribe la especificacion' },
    { title: 'Desarrollo', detail: 'Un desarrollador por grafico · solo archivos nuevos, sin tocar compartidos' },
    { title: 'QA', detail: 'Un QA por grafico · corre su prueba y la verifica por mutacion sobre base verde' },
    { title: 'Auditoria', detail: 'Cablea, corre la puerta entera y actualiza el cumplimiento en el plan' },
  ],
}

// ── Qué se construye ────────────────────────────────────────────────────────
//
// `args` es la lista de ids del repertorio. Cada uno trae el nombre EXACTO de su
// frame en el `.pen`, porque buscarlo a tientas es donde se abre un dibujo que
// no es. Si no llega nada, se toma el lote de `escalar`, que es la forma con más
// métricas reales detrás — nueve de dieciocho, medido el 2026-09-29.
const LOTE_POR_DEFECTO = [
  { id: 'bullet', frame: 'Plot/BULLET · Avance contra objetivo', forma: 'escalar' },
  { id: 'rings', frame: 'Plot/ANILLOS · Cumplimiento múltiple', forma: 'escalar' },
  { id: 'spark', frame: 'Plot/MICRO TENDENCIA · Indicadores con sparkline', forma: 'escalar' },
]

// `args` acepta dos formas. La lista pelada corre el loop entero; el objeto deja
// apagar las dos fases que tocan archivos COMPARTIDOS:
//
//     { graficos: [...], base: false, auditoria: false }
//
// **Y eso no es una comodidad: es lo que deja correr dos lotes a la vez.** Las
// fases Plan, Desarrollo y QA escriben archivos disjuntos —un plot y su prueba—
// así que dos corridas no se pisan. `Base` toca los nueve cuerpos y `Auditoria`
// cablea, corre la puerta y escribe el plan: dos de ésas en paralelo se pisan
// seguro. Se corren una sola vez, al principio y al final.
const ENTRADA = Array.isArray(args) ? { graficos: args } : (args || {})
const GRAFICOS = (ENTRADA.graficos && ENTRADA.graficos.length > 0) ? ENTRADA.graficos : LOTE_POR_DEFECTO
const CON_BASE = ENTRADA.base !== false
const CON_AUDITORIA = ENTRADA.auditoria !== false

// El recetario del `.pen` va en cada prompt porque es lo único que ningún agente
// puede deducir: el archivo está cifrado para las herramientas de texto y se lee
// como JSON plano.
const RECETA_PEN = `
Para leer el dibujo (NO uses Read ni Grep sobre el .pen, es JSON grande):

    python3 - <<'PY'
    import json, pathlib
    d = json.loads(pathlib.Path('design/Synapse_v2.pen').read_text())
    def walk(n, path=""):
        yield n, path
        for c in n.get('children', []) or []:
            yield from walk(c, path + "/" + str(n.get('name')))
    for n, p in walk(d):
        if n.get('name') == 'NOMBRE_DEL_FRAME':
            def dump(x, dep=0):
                keys = {k: v for k, v in x.items() if k not in ('children','type','name')}
                print("  "*dep + f"{x.get('type')} {x.get('name')!r} {json.dumps(keys, ensure_ascii=False)[:400]}")
                for c in x.get('children', []) or []: dump(c, dep+1)
            dump(n)
    PY

El FRAME antes que la nota: los frames tienen los números, los colores y el
texto literal. Los tokens se escriben como '$w2', '$ink', '$acc' y salen de
src/tokens/tokens.css.`

const SPEC = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    archivo: { type: 'string', description: 'Ruta del componente nuevo, p.ej. src/render/plots/PlotBullet.tsx' },
    prueba: { type: 'string', description: 'Ruta de su prueba en tests/render/plots/' },
    cuerpo: { type: 'string', description: 'Qué cuerpo de render/bodies debe despacharlo, y con qué condición' },
    geometria: { type: 'string', description: 'Lo medido en el frame: tamaños, proporciones, posiciones, radios' },
    tokens: { type: 'array', items: { type: 'string' }, description: 'Los tokens de color que el dibujo usa, tal cual' },
    primitivas: { type: 'array', items: { type: 'string' }, description: 'Qué de render/plots/core/ compone. Si falta algo, decirlo aquí' },
    props: { type: 'string', description: 'La firma PlotProps<F> que recibe' },
    aserciones: { type: 'array', items: { type: 'string' }, description: 'Qué tiene que afirmar la prueba, cada una capaz de fallar' },
    riesgos: { type: 'array', items: { type: 'string' }, description: 'Lo que el dibujo no resuelve o lo que el dato no permite' },
  },
  required: ['id', 'archivo', 'prueba', 'cuerpo', 'geometria', 'tokens', 'primitivas', 'props', 'aserciones', 'riesgos'],
}

const ENTREGA = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    archivos: { type: 'array', items: { type: 'string' }, description: 'Los que escribió, con ruta' },
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
    baseVerde: { type: 'boolean', description: 'La prueba pasaba ANTES de mutar' },
    mutaciones: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          que: { type: 'string' },
          seAplico: { type: 'boolean', description: 'Se comprobó que el texto cambió de verdad' },
          murio: { type: 'boolean', description: 'Alguna prueba falló con la mutación puesta' },
        },
        required: ['que', 'seAplico', 'murio'],
      },
    },
    aprobado: { type: 'boolean' },
    problemas: { type: 'array', items: { type: 'string' } },
  },
  required: ['id', 'baseVerde', 'mutaciones', 'aprobado', 'problemas'],
}

// ── Base ────────────────────────────────────────────────────────────────────
//
// Va primero y sola porque toca TODOS los cuerpos: paralelizarla sería tres
// agentes editando los mismos nueve archivos.
phase('Base')
log(
  CON_BASE
    ? `Cerrando el despacho antes de construir · ${GRAFICOS.length} gráfico(s) en este lote`
    : `Base OMITIDA por args · ${GRAFICOS.length} gráfico(s), asumiendo el despacho ya cerrado por otra corrida`,
)

const base = !CON_BASE ? null : await agent(
  `Hay un defecto medido en \`src/render/bodies/\` y hay que cerrarlo antes de construir gráficos nuevos.

**El defecto.** \`BodyProps.grafico\` (en \`src/render/types.ts\`) declara la regla en su propio comentario:
«uno que el cuerpo no sepa dibujar **no cae al de por defecto**: se declara. Ver \`UnknownPlotState\`.»

Sólo \`SeriesBody\` y \`ForecastBody\` la cumplen. Los demás —\`BarsBody\`, \`CompositionBody\`,
\`DistributionBody\`, \`GaugeBody\`, \`KpiBody\`, \`ListBody\`, \`TableBody\`, \`ProseBody\`, \`RecoBody\`—
ni siquiera desestructuran \`grafico\`, así que un panel que pide «dona» sobre una métrica
\`categorica\` recibe BARRAS, en silencio. Medido el 2026-09-29.

**Y hay un segundo defecto, dentro de \`SeriesBody\`.** Su \`DIBUJA\` acepta ocho ids en
\`serieTemporal\` y seis en \`seriesMultiples\`, pero sólo \`stackarea\` tiene dibujo propio: los
otros doce caen todos a \`PlotSeries\`. \`control\` es el caso claro — existe \`PlotControl\`, lo
usa \`ForecastBody\`, y un \`serieTemporal\` que pida \`control\` dibuja una línea pelada.

**Qué hacer.** En cada cuerpo, declarar una constante con los ids que ese cuerpo REALMENTE
dibuja hoy —no los que el repertorio le asigna— y devolver \`<UnknownPlotState grafico={grafico} />\`
para cualquier otro. Mismo idioma que \`SeriesBody\`: \`const DIBUJA = [...] as const\`, con el
comentario en español explicando por qué la lista es corta.

Los ids del repertorio por forma están en \`docs/ENTREGA-2026-09-29-repertorio-de-graficos.md\`,
sección «La tabla». Los marcados ᴺ (\`kpi\`, \`matrix\`, \`list\`, \`table\`, \`prose\`, \`reco\`) no son
plots: son cómo el cuerpo dibuja sin gráfico, así que son el default de su cuerpo.

**Ausente sigue significando el gráfico por defecto** — eso no cambia, y los doce paneles
publicados hoy traen \`chart: ''\`, así que nada en pantalla se mueve. Verificalo.

**Pruebas.** Una por cuerpo tocado, en \`tests/render/bodies/\`, que afirme que un id conocido-
pero-no-dibujado muestra \`UnknownPlotState\` y NO el dibujo por defecto. Escribilas de modo que
puedan fallar: si la borrás del componente, la prueba tiene que ponerse roja.

Corré \`npx vitest run tests/render\` al terminar y dejá eso en verde. No corras \`npm run verify\`
todavía —lo hace la auditoría al final—. No toques \`src/render/plots/\` ni el plan.`,
  { label: 'base:despacho', phase: 'Base', schema: ENTREGA },
)

if (base) log(`Base cerrada · ${base.archivos.length} archivo(s)`)
else if (CON_BASE) log('⚠ La base no devolvió resultado · las fases siguientes igual corren, la auditoría lo va a ver')

// ── El loop por gráfico ─────────────────────────────────────────────────────
//
// `pipeline` y no `parallel` entre fases: cada gráfico avanza solo. El que
// termina su plan empieza a desarrollarse mientras otro todavía lee el `.pen`.
// No hay nada que una fase necesite de los OTROS gráficos.
const resultados = await pipeline(
  GRAFICOS,

  // 1 · Analizador de tarea y creador de plan
  (g) =>
    agent(
      `Sos el analizador. Tenés que escribir la especificación del gráfico \`${g.id}\` del repertorio
de Synapse, para que otro agente lo construya sin volver a abrir el dibujo.

**Su frame en el \`.pen\` se llama exactamente:** \`${g.frame}\`
**La forma de dato que sirve:** \`${g.forma}\`

${RECETA_PEN.replace('NOMBRE_DEL_FRAME', g.frame)}

**Qué mirar, en este orden:**

1. **El frame**, nodo por nodo: geometría, colores, textos, tamaños. Es normativo para lo
   visual y para el literal de UI, y le gana a \`design.md\`.
2. **La forma del dato**: el esquema \`Valor*\` de \`${g.forma}\` en \`contracts/synapse-api.yaml\`.
   Lo que el plot recibe es eso y nada más.
3. **\`src/render/plots/core/\`**: qué primitivas ya existen. La regla del README de esa
   carpeta: si hace falta algo que no está, **falta una primitiva, no sobra un componente a
   medida**. Decilo en \`primitivas\` si es el caso.
4. **Un plot ya construido** —\`PlotGauge.tsx\` o \`PlotBars.tsx\`— para copiar el idioma: firma,
   comentarios en español, cómo se inyecta \`format\`, cómo se usa \`family\`.
5. **Qué cuerpo de \`src/render/bodies/\` tiene que despacharlo** y con qué condición.

**Reglas duras que la especificación tiene que sostener**, y decir cómo:
- Un hex literal es un bug: todo color sale de un token.
- El naranja \`--color-acc\` NO es color de datos.
- Ámbar y amarillo, prohibidos.
- La familia cromática llega por prop, no se elige en el componente.
- \`render/\` no acepta \`className\` desde afuera.
- Ningún número desnudo: todo valor lleva su label.

**Las aserciones que propongas tienen que poder fallar.** Nada de «el componente renderiza».
Cada una: qué se afirma y qué mutación del código la pondría roja.

No escribas código. Devolvés la especificación y nada más.`,
      { label: `plan:${g.id}`, phase: 'Plan', schema: SPEC },
    ),

  // 2 · Desarrollador
  (spec, g) =>
    spec === null
      ? null
      : agent(
          `Sos el desarrollador. Construí el gráfico \`${g.id}\` siguiendo esta especificación, que
salió de leer su frame \`${g.frame}\` en el \`.pen\`:

${JSON.stringify(spec, null, 2)}

**Escribís SOLO dos archivos nuevos:** \`${spec.archivo}\` y \`${spec.prueba}\`.

**NO toqués ningún archivo compartido** —ni los cuerpos, ni \`types.ts\`, ni el plan, ni los
contratos—. Otros agentes están trabajando en paralelo y el cableado lo hace una fase
posterior, a propósito. Si algo de la especificación exige tocar un archivo compartido,
**no lo toques**: anotalo en \`sinResolver\` y seguí.

**Si el dibujo y la especificación se contradicen, gana el dibujo** — abrilo y decilo en
\`desviaciones\`. ${RECETA_PEN.replace('NOMBRE_DEL_FRAME', g.frame)}

**El idioma del repositorio no es negociable**: identificadores en inglés, comentarios y
documentación en español, textos de UI en español. El comentario de cabecera explica POR QUÉ,
citando lo que midió en el dibujo — no describe lo que el código ya dice.

Verificá que tu prueba pasa con \`npx vitest run ${spec.prueba}\` antes de terminar. Si no pasa,
arreglalo; no la entregues roja.`,
          { label: `dev:${g.id}`, phase: 'Desarrollo', schema: ENTREGA },
        ),

  // 3 · QA
  (entrega, g, i) =>
    entrega === null
      ? null
      : agent(
          `Sos QA del gráfico \`${g.id}\`. No lo construiste vos y tu trabajo NO es aprobarlo: es
averiguar si sus pruebas demuestran algo.

Lo entregado: ${JSON.stringify(entrega.archivos)}
${entrega.desviaciones.length ? `Desviaciones declaradas: ${JSON.stringify(entrega.desviaciones)}` : ''}

**El protocolo, y el orden importa:**

1. **Línea de base.** Corré las pruebas del gráfico y comprobá que están VERDES antes de
   mutar nada. Una mutación sobre un árbol ya roto se lee igual que una prueba fuerte,
   porque mata algo que ya estaba muerto. Si la base no está verde, pará y reportalo con
   \`baseVerde: false\`.
2. **Al menos tres mutaciones fieles**, cada una rompiendo algo que el gráfico dice sostener
   —una regla de color, una proporción del dibujo, un mínimo, el uso de \`family\`, el
   formateador inyectado—. Nada de renombrar una variable.
3. **Comprobá que cada mutación SE APLICÓ**, releyendo el archivo o con \`grep -c\`. Acá ya
   falló tres veces por indentación y por comillas, y una mutación que no se aplicó se lee
   idéntica a una prueba débil.
4. **Restaurá el archivo** después de cada mutación y dejá el árbol como lo encontraste.
   Comprobalo con \`git diff --stat\` al final: no tiene que haber quedado ninguna mutación.

Una mutación que SOBREVIVE es un hallazgo, no un fracaso tuyo: significa que hay una garantía
sin prueba. Reportala en \`problemas\` diciendo qué quedó sin cubrir.

Podés agregar pruebas que falten, en el archivo de pruebas del gráfico. No toqués el
componente ni ningún archivo compartido.`,
          { label: `qa:${g.id}`, phase: 'QA', schema: VEREDICTO },
        ),
)

const vivos = resultados.filter(Boolean)
const aprobados = vivos.filter((v) => v.aprobado)
const sobrevivieron = vivos.flatMap((v) =>
  (v.mutaciones || []).filter((m) => !m.murio || !m.seAplico).map((m) => `${v.id}: ${m.que}`),
)
log(`Loop terminado · ${aprobados.length}/${GRAFICOS.length} aprobados · ${sobrevivieron.length} mutación(es) sin matar`)

// ── Auditor y actualizador de cumplimiento ──────────────────────────────────
//
// **Se omite cuando hay otro lote en vuelo**, y lo que devuelve el script en ese
// caso es exactamente lo que el auditor final necesita para cerrar los dos.
phase('Auditoria')

if (!CON_AUDITORIA) {
  log(`Auditoría OMITIDA por args · ${aprobados.length} gráfico(s) quedan construidos y SIN CABLEAR, esperando el cierre`)
  return {
    lote: GRAFICOS.map((g) => g.id),
    aprobados: aprobados.map((v) => v.id),
    veredictos: vivos,
    mutacionesVivas: sobrevivieron,
    cableado: false,
  }
}

const auditoria = await agent(
  `Sos el auditor. Cerrás el trabajo de este lote: cableás lo construido, corrés la puerta y
dejás escrito qué quedó cumplido y qué no.

**Gráficos del lote:** ${JSON.stringify(GRAFICOS.map((g) => g.id))}
**Veredictos de QA:** ${JSON.stringify(vivos, null, 2)}
${sobrevivieron.length ? `\n**MUTACIONES QUE SOBREVIVIERON O NO SE APLICARON** —cada una es una garantía sin prueba—:\n${sobrevivieron.map((s) => `  · ${s}`).join('\n')}` : '\n**Ninguna mutación sobrevivió.**'}
${base ? `\n**La fase Base entregó:** ${JSON.stringify(base.archivos)}${base.sinResolver.length ? ` · sin resolver: ${JSON.stringify(base.sinResolver)}` : ''}` : '\n**La fase Base no devolvió resultado — verificá si el despacho quedó cerrado.**'}

**Qué hacer, en orden:**

1. **Cableá cada gráfico aprobado** en el cuerpo que su especificación indicó, respetando el
   despacho que dejó la fase Base: un id que el cuerpo no dibuja va a \`UnknownPlotState\`, no
   al gráfico por defecto. Un gráfico NO aprobado no se cablea — se deja el archivo y se
   anota por qué.
2. **Registralo en la carga diferida** si corresponde, mirando cómo lo hacen los plots que ya
   están registrados.
3. **Corré \`npm run verify\` entera.** Tiene que salir verde y **sin bloqueados**. Ojo con la
   convención de salida: nuestras herramientas salen 0/1/2 donde 2 es BLOQUEADO, pero las
   ajenas no la siguen —\`tsc\` sale 2 con errores de tipo—, así que para ellas cualquier
   código distinto de cero es rojo.
4. **Corré \`npm run pen-graficos\`.** Si sale rojo, NO lo selles sin mirar el dibujo: el sello
   es el acto explícito de decir «lo vi y es lo que quiero».
5. **Actualizá el cumplimiento en \`plan-de-trabajo.md\`.** Las tareas de gráficos son F1.31,
   F4.21 y F5.3. Cuidado con dos cosas del parser:
   - hay tareas que COMPARTEN bloque de criterio, y meter una línea en el encabezado de una
     de ellas parte el grupo · \`npm run plan\` lo detecta;
   - un pedido al backend se escribe como \`**Espera del backend.**\` y necesita su marca
     \`**Medido contra \\\`<commit>\\\` el <fecha>**\`, o \`para-backend\` falla.
   Regenerá con \`npm run plan\`.
6. **Lo que quedó sin cumplir se ESCRIBE**, no se omite. Un criterio a medias baja la tarea a
   ⚠️, no la deja en ✅. Y una tarea cerrada dice **contra qué** se cerró.

**No cierres una tarea cuyo criterio no se cumple, y no toques \`design.md\` ni el \`.pen\`.**

Devolvé un informe en prosa, en español, con este orden: lo que quedó mal primero, después lo
verificado y bien, y al final lo que no se pudo verificar y por qué.`,
  { label: 'auditoria:cierre', phase: 'Auditoria' },
)

return {
  lote: GRAFICOS.map((g) => g.id),
  aprobados: aprobados.map((v) => v.id),
  mutacionesVivas: sobrevivieron,
  cableado: true,
  informe: auditoria,
}
