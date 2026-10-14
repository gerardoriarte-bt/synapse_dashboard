/** Una fila del historial de publicaciones · el componente `qZr15` del `.pen`
 *
 *  **Está en su propio archivo porque `un-componente` lo pide** —§4 regla 3— y
 *  porque en el dibujo es un componente REUSABLE con cuatro instancias: el
 *  `.pen` ya tomó la decisión de que la tarjeta es una unidad.
 *
 *  ── LO QUE EL PATRÓN DE `enabled` DEL DIBUJO DICE, Y ES NORMATIVO ───────────
 *
 *  `REVERTIR A ESTA` se pinta **sólo en las versiones anteriores**. En la fila
 *  `EN PRODUCCIÓN` y en la de borrador el botón está apagado en las cuatro
 *  instancias del `.pen`. **No es una preferencia visual: es la misma regla dos
 *  veces** — el servicio la hace cumplir con `CONFLICT_REVERT_SELF` y
 *  `CONFLICT_REVERT_TO_DRAFT`.
 *
 *  Y acá se resuelve como «un CTA sin manejador no se pinta», que es la regla de
 *  la casa: el llamador no pasa `onRevertir` cuando no hay a dónde revertir, y un
 *  botón apretable que devuelve 409 es peor que un botón ausente.
 *
 *  ── EL «Resumen» DE 13px NO SE PINTA, Y NO ES UN OLVIDO ─────────────────────
 *
 *  El dibujo pone ahí «Medidores de composición en los seis KPI»: una frase
 *  redactada por una persona. El cable manda `versionId` y cinco contadores.
 *  Componer una frase con los contadores sería escribir copy de producto, así que
 *  ese renglón lleva **los cinco contadores como pares rótulo+cifra**, que es lo
 *  que el cable sí dice. Los cinco siempre, incluido el cero: esconder un cero
 *  haría que «sin cambios» y «no lo sé» se lean igual.
 *
 *  El pedido del `Resumen` —y de la línea `RAZÓN`— está en
 *  `docs/PROPUESTA-2026-09-30-b6-prosa-del-historial.md`.
 *
 *  ── LOS 18px DE PADDING HORIZONTAL NO SON UN ESCALÓN ────────────────────────
 *
 *  El `.pen` dibuja `padding=[16,18]` y la escala de espaciado emite 16 o 20. Se
 *  usa **16 (`p-4`)** y se dice acá, igual que con los dos tamaños que la escala
 *  tipográfica no tiene. `px-[18px]` sería una medida escrita a mano y
 *  `design-lint` la persigue con razón. Lo mismo el `gap=14` de la cabecera, que
 *  va en `gap-4` (16), y el `gap=3` del bloque de texto, que va en `gap-1` (4).
 *
 *  **§PEN:B6** · el componente reusable `qZr15` del frame `B6 · Historial de
 *  versiones`, con sus cuatro instancias leídas campo por campo: `Borrador`
 *  (`OgPAE`), `v4` (el master), `v3` (`kxd7w`), `v2` (`c4cLM`) y `v1` (`PrznY`).
 */
import { Ayuda } from '../../render/primitives/Ayuda'
import { Note } from '../../render/primitives/Note'
import { Value } from '../../render/primitives/Value'
import { cambios } from './cambios'
import type { Cambio } from './cambios'
import type { Publicacion } from '../../api/admin'
import type { Formatter } from '../../render/format'

/** El `~` y el `!` van en `$dim`; **el `+` va en `$fam-medios-1`**.
 *
 *  Es un token de familia de datos elegido en el componente, y `design.md`
 *  reserva la familia al catálogo. **Se copia porque el `.pen` gana para lo
 *  visual** y porque hay precedente en código —`ConsoleDock.tsx` usa
 *  `bg-fam-medios-1`—. No dispara L2 —no es el naranja— ni L4 —no es un
 *  condicional de signo: un `+` de «añadido» no es un delta—.
 *
 *  Queda registrado como riesgo de contraste: `contraste.py` no mide hoy el par
 *  `fam-medios-1` sobre `elev`. */
const COLOR_DE_GLIFO: Readonly<Record<Cambio['glifo'], string>> = {
  '+': 'text-fam-medios-1',
  '~': 'text-dim',
  '!': 'text-dim',
}

/** El rótulo pasa por `Note` —que fuerza mayúsculas— y la cola de datos va en un
 *  `span` hermano SIN `uppercase`, porque el dibujo escribe «de colStart 8 a
 *  colStart 9» en caja mixta. El corte va donde el `.pen` lo pone: el rótulo es
 *  rótulo y el dato es dato. */
const COLA = 'font-mono text-nota leading-cuerpo tracking-rotulo text-dim'

/** La cola de cada entrada, ya compuesta. **No inventa nada**: nombra lo que el
 *  diff trae y nada más.
 *
 *  Cuando el `metricId` no resuelve contra el catálogo —una métrica dada de
 *  baja— se pinta el rótulo y **nunca el uuid**: un uuid en pantalla no dice qué
 *  panel era y además es plomería, que §7.3 prohíbe en esta superficie. */
function cola(c: Cambio, nombreDeMetrica: (metricId: string) => string | null): string {
  const partes: string[] = []
  if (c.metricId !== undefined) {
    partes.push(nombreDeMetrica(c.metricId) ?? 'MÉTRICA FUERA DEL CATÁLOGO')
  }
  if (c.tipo !== undefined) partes.push(`tipo ${c.tipo}`)
  if (c.tipoAnterior !== undefined) partes.push(`antes ${c.tipoAnterior}`)
  if (c.desde !== undefined && c.hasta !== undefined) {
    // **Sólo se nombra lo que CAMBIÓ**, y lo encontró mirar la pantalla: el
    // servicio emite `panels_moved` cuando cambió **cualquiera** de los tres
    // números, así que un panel que sólo se corrió de columna imprimía
    // «de 3×4 a 3×4» al lado. Un par idéntico se lee como un defecto del que lo
    // pinta, no como un dato.
    if (c.desde.colStart !== c.hasta.colStart) {
      partes.push(`de colStart ${String(c.desde.colStart)} a ${String(c.hasta.colStart)}`)
    }
    if (c.desde.colSpan !== c.hasta.colSpan || c.desde.rowSpan !== c.hasta.rowSpan) {
      partes.push(
        `de ${String(c.desde.colSpan)}×${String(c.desde.rowSpan)} a ${String(c.hasta.colSpan)}×${String(c.hasta.rowSpan)}`,
      )
    }
  }
  partes.push(`pestaña «${c.pestana}»`)
  return partes.join(' · ')
}

type Props = {
  publicacion: Publicacion
  /** Derivado en la SUPERFICIE cruzando `layoutId` contra los `status` de los
   *  layouts del cliente. No viaja en la fila: una publicación es una foto de lo
   *  que pasó, no del estado de hoy. */
  enProduccion: boolean
  /** Resuelto contra `GET /admin/users`. **`null` cuando el uuid no está en la
   *  lista** —o cuando la fila no trae autor, que el cable permite—: entonces la
   *  línea arranca por el rol en mayúsculas. Nunca un uuid crudo y nunca un
   *  «Desconocido» inventado. */
  autorNombre: string | null
  nombreDeMetrica: (metricId: string) => string | null
  format: Formatter
  /** **Ausente = no se pinta el botón.** Ver la cabecera del archivo. */
  onRevertir?: () => void
}

export function VersionCard({
  publicacion,
  enProduccion,
  autorNombre,
  nombreDeMetrica,
  format,
  onRevertir,
}: Props) {
  const lineas = publicacion.diff === null ? [] : cambios(publicacion.diff)
  // El botón sólo existe si hay a dónde revertir **y** esta no es la versión que
  // está en producción. Las dos condiciones son la misma que el servicio verifica.
  const puedeRevertir = onRevertir !== undefined && !enProduccion

  return (
    <li className="bg-elev rounded-lg border border-w3 flex flex-col gap-3 p-4 list-none">
      <div className="flex items-center gap-4 min-w-0">
        {/* **El `version_id` VERBATIM y el slot con ancho automático.** El dibujo
            le da 34px fijos y pinta «v4»; el servicio manda `v-1790712673` y
            `rollback-v-1790630106`. **No se renumeran a `v1..vN` por el orden**:
            sería inventar una etiqueta que el servicio no tiene y que además
            contradiría la que `ContextView` ya muestra para el mismo layout. */}
        <span className="font-mono text-label leading-rotulo tracking-rotulo text-ink shrink-0">
          {publicacion.versionId}
        </span>

        {enProduccion && (
          <span className="h-5 flex items-center bg-acc rounded-xs px-2 text-on-acc font-medium shrink-0">
            <Note>En producción</Note>
          </span>
        )}

        {/* **`REVERSIÓN` no está dibujado y tiene que verse** · añadido nuestro,
            anotado en la propuesta. Si una versión llegó por reversión y el
            historial no lo dice, el historial miente sobre cómo se llegó ahí — y
            es justo lo que la tercera línea de la cabecera promete auditar.
            Es copy de chrome sobre un valor del enumerado, no traducción de una
            clave del contrato: `accion` sigue siendo `'publish' | 'rollback'`. */}
        {publicacion.accion === 'rollback' && (
          <span className="h-5 flex items-center rounded-xs px-2 border border-w4 text-dim shrink-0">
            <Note>Reversión</Note>
          </span>
        )}

        <div className="flex flex-col gap-1 min-w-0 grow">
          {/* Donde el dibujo pone el `Resumen` de 13px van los cinco contadores.
              Cada uno por `<Value>`, que es lo que hace que «ningún número
              desnudo» no dependa de que alguien se acuerde del label. */}
          {publicacion.diff === null ? (
            // **`null` no es «no cambió nada».** El campo es `JSONRaw` y su
            // `MarshalJSON` emite `null` con el valor vacío, así que esto es «no
            // hay registro de qué cambió». Colapsarlo a cinco ceros afirmaría lo
            // que no se sabe.
            <Ayuda>Sin registro de qué cambió.</Ayuda>
          ) : (
            <div className="flex flex-wrap gap-4">
              <Value label="Pestañas añadidas" size="cell">
                {format.number(publicacion.diff.contadores.pestanasAnadidas)}
              </Value>
              <Value label="Pestañas quitadas" size="cell">
                {format.number(publicacion.diff.contadores.pestanasQuitadas)}
              </Value>
              <Value label="Paneles añadidos" size="cell">
                {format.number(publicacion.diff.contadores.panelesAnadidos)}
              </Value>
              <Value label="Paneles quitados" size="cell">
                {format.number(publicacion.diff.contadores.panelesQuitados)}
              </Value>
              <Value label="Paneles cambiados" size="cell">
                {format.number(publicacion.diff.contadores.panelesCambiados)}
              </Value>
            </div>
          )}

          {/* «MARÍA RESTREPO · 14 AGO 2026, 16:20». Sin nombre arranca por el rol:
              `ADMIN · 14 AGO 2026, 16:20`. El formateo sale del `Formatter` del
              tenant y de ningún `Intl` propio. */}
          <div className="text-dim">
            <Note>
              {`${autorNombre ?? publicacion.autorRol} · ${format.calendar(publicacion.creadoEn)}, ${format.clock(publicacion.creadoEn)}`}
            </Note>
          </div>
        </div>

        {puedeRevertir && (
          <button
            type="button"
            onClick={onRevertir}
            className="h-7 shrink-0 flex items-center gap-2 rounded-md border border-w4 px-3 bg-transparent text-ink cursor-pointer hover:bg-w2"
          >
            {/* lucide `rotate-ccw`, en línea: no hay dependencia de iconos en el
                proyecto y el resto de las superficies los dibuja así. */}
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M3 2v6h6" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L3 8" />
            </svg>
            {/* **No pasa por `Label`, y es por el color.** `Label` fija
                `text-dim` siempre —§2.3 le da ese gris a todos los labels— y el
                `.pen` dibuja «REVERTIR A ESTA» en **`$ink`**: es el texto de un
                CTA, no el rótulo de un dato. El `.pen` gana para lo visual, y hay
                precedente en `EmptyRow`, cuyo botón escribe las mismas cuatro
                utilidades con `text-ink`. */}
            <span className="font-mono text-label leading-rotulo tracking-rotulo uppercase">
              Revertir a esta
            </span>
          </button>
        )}
      </div>

      {/* **El contenedor del diff no se pinta vacío.** Un borde superior colgando
          sobre nada es el mismo defecto que la línea de BASE con el separador
          suelto: se ve como algo que no cargó. */}
      <div className="border-t border-w2 pt-3 flex flex-col gap-1.5">
        {lineas.length === 0 ? (
          <Ayuda>
            {publicacion.diff === null
              ? 'El servicio no guardó el detalle de esta publicación.'
              : 'Sin cambios de composición.'}
          </Ayuda>
        ) : (
          lineas.map((c, i) => (
            // **El índice va SIEMPRE en la clave, y no sólo cuando falta la
            // métrica.** Sin él, dos paneles de la MISMA métrica en la MISMA
            // pestaña con el mismo rótulo colisionan —un `kpi` y un `gauge` de
            // «Ingresos» movidos los dos, que es la composición que el propio
            // dibujo describe— y React avisa que puede **omitir** uno de los dos.
            // Una línea de diff omitida en la pantalla que existe para auditar qué
            // cambió es el peor lugar donde puede pasar. `c.tipo` tampoco alcanza:
            // el mismo panel puede aparecer en dos listas con el mismo rótulo.
            <div
              key={`${c.rotulo}:${c.pestana}:${c.metricId ?? ''}:${String(i)}`}
              className="flex gap-2 min-w-0"
            >
              <span
                className={`font-mono text-nota leading-cuerpo tracking-rotulo w-3 shrink-0 ${COLOR_DE_GLIFO[c.glifo]}`}
                aria-hidden
              >
                {c.glifo}
              </span>
              {/* **`text-dim` acá y no en el `Note`.** El `.pen` dibuja la línea
                  entera en `$dim` —el glifo `+` es la única excepción— y `Note`
                  no fija color a propósito: lo pone quien la usa. Sin esto el
                  rótulo salía con el color por defecto del documento, que lo
                  encontró MIRAR el render y no una prueba. */}
              <span className="min-w-0 text-dim">
                <Note>{c.rotulo}</Note> <span className={COLA}>· {cola(c, nombreDeMetrica)}</span>
              </span>
            </div>
          ))
        )}
      </div>
    </li>
  )
}
