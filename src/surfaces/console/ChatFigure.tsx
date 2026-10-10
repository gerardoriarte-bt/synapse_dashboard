/** Una cifra del agente, dibujada con el cuerpo de panel que le toca · F3.6
 *
 *  **«Un solo modelo de datos»**, que es lo que el criterio pide: la misma
 *  cifra, el mismo cuerpo y la misma anatomía que en la consola. Lo que cambia
 *  es de dónde viene el valor, no cómo se dibuja.
 *
 *  ── CON QUÉ CUERPO, QUE ERA LO QUE FALTABA ──────────────────────────────────
 *
 *  `EventoDato` trae `valor` y su `forma`, **no un `TipoPanel`**. Y no se puede
 *  derivar: `Bloque.formasAceptadas` va de muchos a muchos —varios tipos
 *  aceptan `escalar`— así que elegir uno sería inventar una decisión que el
 *  contrato no tomó. Es la pregunta 11 de B0.9 y estuvo abierta desde el
 *  2026-09-03.
 *
 *  **La respuesta no era agregar un campo: era usar el contexto que ya
 *  tenemos.** El chat se abre DESDE un panel, y ese panel tiene tipo. La cifra
 *  se dibuja con el cuerpo de ese panel — no con uno elegido a dedo.
 *
 *  **Y sólo si el tipo acepta la forma que llegó**, que lo decide
 *  `acceptsShape` contra la tabla de `/config/blocks`. El agente puede devolver
 *  un desglose donde el panel es un KPI; dibujar una categórica con `KpiBody`
 *  se vería bien y sería otra cifra.
 *
 *  **Y cuando el panel no acepta, se dibuja por la forma** · §7, cerrada el
 *  2026-10-08. Contra el agente real el panel de origen casi nunca aceptaba lo
 *  que llegaba, y la rama de «no puedo dibujarlo» era la común. Ahora una forma
 *  que un solo tipo acepta se dibuja con ese tipo; **se declara sólo cuando la
 *  tabla deja dos o más candidatos**, que es donde elegir sería adivinar.
 *
 *  ── UNA TABLA SIN RÓTULOS NO SE DIBUJA, Y UNA SIN FAMILIA SÍ · 2026-10-09 ───
 *
 *  Medido contra `9dc481e`: una pregunta de pestaña por la inversión por
 *  plataforma trajo tres tablas **sin la columna de plataforma** —el backend
 *  descarta toda columna llamada `label` al inferir las columnas— y nueve
 *  filas de cifras sueltas. Dibujarlas es «ningún número desnudo» roto, así
 *  que una tabla del chat exige que cada fila diga de qué es. Vale con o sin
 *  familia: una de las tres traía familia, y se habría dibujado igual.
 *
 *  Y la familia, en una tabla, no pinta datos: es una marca de 6 px. Una tabla
 *  con rótulos y sin familia se dibuja **sin la marca**, en vez de declararse.
 *  Los gráficos no: ahí la familia es el color del dato.
 */
import { Suspense } from 'react'
import { Label } from '../../render/primitives/Label'
import { LoadingState } from '../../render/states/LoadingState'
import { TableWithoutFamily, bodyFor } from '../../render/bodies/registry'
import { acceptsShape, soleTypeFor } from '../../catalog/blocks'
import { Provenance } from '../../render/Panel/Provenance'
import { span } from '../../render/grid'
import type { BlockTable } from '../../catalog/blocks'
import type { PanelType } from '../../catalog/types'
import type { Formatter } from '../../render/format'
import type { FamiliaDeDibujo } from '../../render/types'
import { lineaDeEjes, mesEnCursoEn, rotularFechas, rotularFechasEnTexto } from './figuraDelAgente'
import type { ChatEvent, Value } from '../../api/types'

type Dato = Extract<ChatEvent, { tipo: 'dato' }>

/** Las filas de grilla que ocupa una cifra del chat. */
const FILAS = 3

/** Los cuerpos que miden su propio contenido. Los demás —los gráficos— ocupan
 *  el alto de su contenedor y sin uno no se ven. */
const CON_ALTO_PROPIO: ReadonlySet<PanelType> = new Set(['kpi', 'prose'])

/** ¿Cada fila dice de qué es? Hay una columna no numérica con texto en TODAS
 *  las filas. Una columna de texto vacía no cuenta: medido el 2026-10-09,
 *  `platform_revenue` llegó como texto con `""` en ocho de nueve filas, y eso
 *  no es un rótulo — es una cifra que se perdió. */
export function hasRowLabels(valor: Extract<Value, { forma: 'tabular' }>): boolean {
  return valor.columnas.some(
    (c) =>
      !c.numerica &&
      valor.filas.length > 0 &&
      valor.filas.every((f) => {
        const celda = f[c.clave]
        return typeof celda === 'string' && celda.trim() !== ''
      }),
  )
}

type Props = {
  dato: Dato
  /** El panel desde el que se preguntó. Es el que decide el cuerpo.
   *
   *  **Ausente cuando se preguntó desde la PESTAÑA** · F3.15: ahí no hay panel
   *  de origen, así que no hay cuerpo que elegir. Ver abajo. */
  panelTipo?: PanelType | undefined
  bloques: BlockTable
  format: Formatter
  now: Date
  /** El mes abierto del tenant, `YYYY-MM` · de `open_period`. Ausente: no se
   *  sabe, y no se marca ninguno. */
  mesEnCurso?: string | undefined
}

export function ChatFigure({ dato, panelTipo: tipoDelPanel, bloques, format, now, mesEnCurso }: Props) {
  const forma = dato.valor.forma
  // ── CON QUÉ CUERPO · §7 cerrada el 2026-10-08 (humano): por la FORMA ──────
  //
  // En orden, y cada paso sólo si el anterior no decidió:
  //
  //  1. **La marca del agente** · 2026-10-07, «su marca, nuestros cuerpos».
  //  2. **El panel de origen, si acepta la forma.** El contexto sigue valiendo
  //     cuando sirve: un escalar preguntado desde un `gauge` sale como medidor.
  //  3. **El único tipo que acepta la forma** · `soleTypeFor`. Es lo que §7
  //     pedía: contra el agente real, una pregunta desde un `kpi` trajo
  //     `tabular`, `tabular` y `raw`, y las tres se declaraban. Un `tabular`
  //     sólo lo dibuja `table`, venga de donde venga.
  //
  // **Lo que NO se usa es la `metric_key` de la procedencia** para buscar un
  // panel en la pestaña. En pestaña la infiere el backend cruzando nombres de
  // columna, y un cruce equivocado elegiría el cuerpo de otra métrica encima de
  // declarar su BASE. Ver `MENSAJE-2026-10-08-backend-procedencia-por-nombre.md`.
  const delPanel =
    tipoDelPanel !== undefined && acceptsShape(bloques, tipoDelPanel, forma) ? tipoDelPanel : null
  const panelTipo = dato.tipoDePanel ?? delPanel ?? soleTypeFor(bloques, forma) ?? undefined
  const familia = dato.familia

  // **Ningún número desnudo, tampoco en el chat** · 2026-10-09. Va antes que
  // la familia porque vale con ella o sin ella.
  if (dato.valor.forma === 'tabular' && !hasRowLabels(dato.valor)) {
    return (
      <div className="flex flex-col gap-1">
        {dato.titulo == null ? null : <Label as="div">{dato.titulo}</Label>}
        <Label as="div">Una tabla que no se dibuja</Label>
        <Label as="div">Sus filas llegaron sin una columna que diga de qué es cada cifra</Label>
      </div>
    )
  }

  // **Sin familia no se INVENTA un color, pero se dibuja en neutro** ·
  // 2026-10-09, decisión humana. Hasta ese día se declaraba: «Un gráfico que
  // todavía no se dibuja · El catálogo no declaró de qué familia es». Desplegado
  // en QA, eso dejaba el chat sin un solo gráfico que no fuera tabla, y el
  // humano lo dijo así: el color «no es tan relevante vs la dimensión del
  // proyecto». Una consulta libre no es una métrica y no va a tener familia.
  //
  // **`consulta` no es una familia que se elige**: es la rampa neutra de
  // `tokens/decisiones.css` —`ink`, `dim` y mezclas contra `panel`—, sin hex y
  // sin el naranja. El dato sigue diciendo `familia: null`; es el dibujo el que
  // usa el neutro, y el rótulo lo declara. Diseño puede cambiarlo · §14 de
  // `PROPUESTA-2026-09-22-divergencias-con-el-pen.md`.
  //
  // La tabla va aparte: ahí la familia es una marca de 6 px, y sin familia se
  // omite. Ver la cabecera.
  const tablaSinFamilia = familia === null && panelTipo === 'table'
  const familiaDeDibujo: FamiliaDeDibujo | null = familia ?? (tablaSinFamilia ? null : 'consulta')

  // ── SIN UN TIPO DECIDIDO NO SE ELIGE UNO ─────────────────────────────────
  //
  // Queda para las formas que aceptan dos tipos o más —un `escalar` como `kpi`
  // o como `gauge`— cuando el panel de origen no es uno de ellos. Elegir el
  // primero sería inventar con qué se dibuja: el mismo dato dice cosas
  // distintas como cifra o como medidor.
  if (panelTipo === undefined) {
    return (
      <div className="flex flex-col gap-1">
        <Label as="div">Una cifra que todavía no se dibuja</Label>
        <Label as="div">Llegó en forma «{forma}» y más de un tipo de panel la acepta</Label>
      </div>
    )
  }

  const Body = bodyFor(panelTipo)

  // La marca del agente se vuelve a validar: el traductor de Vega-Lite la
  // elige, y la tabla de `/config/blocks` es la que manda.
  if (Body === undefined || !acceptsShape(bloques, panelTipo, forma)) {
    return (
      <div className="flex flex-col gap-1">
        <Label as="div">Una cifra que este panel no puede dibujar</Label>
        <Label as="div">
          Llegó en forma «{forma}» y «{panelTipo}» no la acepta
        </Label>
      </div>
    )
  }

  // **Lo que hace legible la cifra, para cualquier forma** · 2026-10-10. Ver
  // `figuraDelAgente.ts` y `docs/AUDITORIA-2026-10-10-graficos-del-chat.md`.
  const ejes = lineaDeEjes(dato.ejes)
  const mesAbierto = mesEnCursoEn(dato.valor, mesEnCurso)

  const comunes = {
    // Las fechas de una dimensión se rotulan como las lee el cliente: una barra
    // del agente decía `2026-09-01`. Sólo cuando el agente declaró que la
    // dimensión ES una fecha.
    value: dato.ejes?.dimensionEsFecha === true ? rotularFechas(dato.valor, format) : dato.valor,
    ...(dato.grafico === undefined ? {} : { grafico: dato.grafico }),
    params: {},
    // La cifra del chat no vive en la grilla, pero los cuerpos piden un
    // `Placement` para decidir densidad. Se le da el de la columna de
    // conversación: 6 de ancho es la mitad de la grilla, que es lo que mide la
    // hoja contra la pantalla.
    span: { colStart: 1, colSpan: 6, rowSpan: FILAS },
    metric: dato.titulo ?? '',
    format,
    ...(dato.presentacion === undefined ? {} : { presentation: dato.presentacion }),
  }

  return (
    <figure className="flex flex-col gap-2 rounded-md border border-w3 p-3 m-0">
      {dato.titulo == null ? null : <Label as="div">{dato.titulo}</Label>}
      {/* El neutro se DICE: sin esto, un gráfico gris se lee como una métrica
          más, y es una consulta que el catálogo no respalda. */}
      {familiaDeDibujo === 'consulta' ? (
        <Label as="div">Consulta fuera del catálogo · se dibuja en neutro</Label>
      ) : null}
      {/* **Qué mide y cómo se reparte**, con las palabras del agente: «Ingresos
          (USD) · por mes · por plataforma». Un eje que dice «1.5M» sin esto no
          dice de qué. */}
      {ejes === null ? null : <Label as="div">{ejes}</Label>}
      {/* **Por qué se ve como tabla**, cuando el gráfico no se pudo dibujar tal
          como lo pidió el agente. Antes desaparecía. */}
      {dato.aviso === undefined ? null : (
        <Label as="div">{`Se muestran los datos como tabla · ${rotularFechasEnTexto(dato.aviso, format)}`}</Label>
      )}
      {/* **El mes abierto se dice**: su cifra está incompleta y, al final de una
          serie, se lee como una caída. */}
      {mesAbierto === null ? null : (
        <Label as="div">{`${format.axisDate(mesAbierto, 'mes')} es el mes en curso · su cifra está incompleta`}</Label>
      )}

      {/* **El alto es el del `rowSpan` que se le da al cuerpo** · 2026-10-07.
          Los cuerpos de gráfico ocupan el alto de su contenedor, y la figura
          no tenía: el KPI se veía porque su cifra tiene alto propio, y la
          primera serie del agente salió con título, BASE y procedencia y sin
          una línea. Lo encontró abrir el modo mock, no una prueba. Al KPI no
          se le da: con 272 px quedaba un hueco debajo de la cifra. */}
      <div style={CON_ALTO_PROPIO.has(panelTipo) ? undefined : { height: span(FILAS) }}>
        <Suspense fallback={<LoadingState />}>
          {/* Con `null` sólo llega acá una tabla —lo decide
              `familiaDeDibujo`— y va por `TableWithoutFamily`, que es la misma
              instancia con el tipo que admite `null`. */}
          {familiaDeDibujo === null ? (
            <TableWithoutFamily {...comunes} family={null} />
          ) : (
            <Body {...comunes} family={familiaDeDibujo} />
          )}
        </Suspense>
      </div>

      {/* **La BASE y la procedencia van PEGADAS a la cifra**, que es la mitad
          del criterio: «una cifra en el chat también declara BASE y
          procedencia».

          La BASE va aparte porque `Provenance` no la lleva — en el shell la
          escribe la cabecera del panel, junto al título. Acá la cifra no tiene
          cabecera, así que la pone esta línea. */}
      {/* **Una base vacía se dice, no se deja colgando** · 2026-10-08. Es lo
          que le pedimos al backend cuando la consulta del agente no es la
          métrica del catálogo —filtra por medio, o sale de otra tabla—: que no
          copie la base del catálogo. «Base · » con nada detrás se lee como un
          defecto de pantalla y no como una declaración. */}
      <Label as="div">
        {dato.base === '' ? 'Base · la consulta no la declara' : `Base · ${dato.base}`}
      </Label>
      {/* **Sin capa, la procedencia se declara entera** · 2026-10-09. Es la
          consulta del agente fuera del catálogo: no trae capa ni fuente, y
          `Provenance` las pintaría como «GOLD · » —antes el adaptador ponía
          GOLD por defecto— o como un separador colgando. Lo que sí es un
          hecho es cuándo corrió la consulta, y eso se conserva. El SQL que la
          produjo está en el desplegable de auditoría de la misma respuesta. */}
      {dato.capa === null ? (
        <Label as="div">
          {`Procedencia · la consulta no la declara · ${format.freshness(dato.frescura, now)}`}
        </Label>
      ) : (
        <Provenance
          capa={dato.capa}
          fuente={dato.fuente}
          frescura={dato.frescura}
          format={format}
          now={now}
        />
      )}
    </figure>
  )
}
