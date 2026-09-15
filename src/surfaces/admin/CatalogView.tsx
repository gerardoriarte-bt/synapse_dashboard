/** A4 · Catálogo de métricas · F4.5
 *
 *  §7.3: «El inventario de lo que la plataforma puede afirmar sobre un cliente.»
 *  Esa frase decide qué se muestra — no es una lista de campos, es la respuesta a
 *  «¿qué puede decir Synapse de este cliente, y con qué respaldo?».
 *
 *  ── LO QUE §7.3 PIDE Y LO QUE EL CABLE TRAE ─────────────────────────────────
 *
 *  Pide ocho por métrica —**forma, capa, fuente, frescura, ventana, dirección
 *  semántica, estado y en cuántos paneles se usa**—, más filtro por estado y una
 *  acción de sincronizar desde el modelo semántico.
 *
 *  `GET /admin/tenants/{tenantId}/catalog` sostiene cuatro de los ocho. Los otros
 *  cuatro **no se rellenan**, y dos de ellos son la trampa de esta pantalla:
 *
 *  | | Por qué no se pinta |
 *  |---|---|
 *  | `frescura` | No es de la métrica sino del PAYLOAD —`governance`—, y depende del período. Un catálogo no tiene período |
 *  | `ventana` | `adaptCatalog` la deja en **cadena vacía** porque el cable no la trae · B1.17 y B1.25 |
 *  | `estado` | `adaptCatalog` escribe `DISPONIBLE` fijo para satisfacer el contrato. **No es un dato: es un relleno**, y pintarlo diría «verificado» sobre algo que nadie verificó. Con él se cae el filtro por estado |
 *  | en cuántos paneles | Derivable solo recorriendo los layouts del tenant · ver abajo |
 *
 *  **Los dos del medio son el modo de falla que este repositorio persigue**: el
 *  campo existe en el tipo, compila, y tiene un valor. Mostrarlo se vería bien y
 *  sería mentira. Por eso la lista de ausentes se escribe mirando el adaptador y
 *  no el tipo.
 *
 *  ── POR QUÉ NO SE CUENTAN LOS PANELES, QUE SERÍA LO FÁCIL ───────────────────
 *
 *  Contarlos sobre el layout **publicado** es un `GET` más y da un número. **Y
 *  sería el número equivocado**: una métrica usada solo en un borrador saldría en
 *  cero, y quien la mire va a leer «no se usa» y va a considerar retirarla.
 *  Contarlo bien exige recorrer todos los layouts del tenant, uno por borrador, y
 *  esa es una decisión de costo que no corresponde tomar acá.
 *
 *  ── EL ORIGEN DE CADA CAMPO SE DECLARA ──────────────────────────────────────
 *
 *  §7.3, PS-13: «sincronizar y editar no compiten: cada campo tiene un solo
 *  dueño», y A4 muestra los derivados **con su origen** y **no los ofrece
 *  editar**. Acá no se ofrece editar ninguno —no hay ruta de escritura sobre el
 *  catálogo— pero el origen sí se declara, porque es lo que explica por qué
 *  `capa` no se toca y `familia` sí.
 *
 *  ── Y LO QUE NO SE MUESTRA AUNQUE SE PUDIERA ────────────────────────────────
 *
 *  Nada de infraestructura · §7.3. `fuente` es procedencia legible por una
 *  persona —«ERP + Analítica de sitio»— y no nombra base, rol ni warehouse.
 */
import { useState } from 'react'
import { Label } from '../../render/primitives/Label'
import { EmptyRow } from './EmptyRow'
import { SkeletonRows } from './SkeletonRows'
import type { Metric } from '../../api/types'
import type { RejectedMetric } from '../../api/adapt'

/** Las columnas, con su dueño según la tabla de §7.3. El dueño es dato y no
 *  comentario porque la pantalla lo pinta: un campo derivado y uno editorial se
 *  ven igual, y la diferencia es qué pasa con ellos en la próxima sincronización. */
const COLUMNAS = [
  { titulo: 'Métrica', origen: 'editorial', leer: (m: Metric) => m.nombre },
  { titulo: 'Forma', origen: 'derivado', leer: (m: Metric) => m.forma },
  { titulo: 'Familia', origen: 'editorial', leer: (m: Metric) => m.familia },
  { titulo: 'Capa', origen: 'derivado', leer: (m: Metric) => m.capa },
  { titulo: 'Fuente', origen: 'derivado', leer: (m: Metric) => m.fuente },
  { titulo: 'Grano mínimo', origen: 'derivado', leer: (m: Metric) => m.granoMinimo },
  { titulo: 'Dirección', origen: 'editorial', leer: (m: Metric) => m.direccionSemantica ?? '—' },
] as const

/** Lo que §7.3 pide por métrica y esta pantalla **no puede afirmar**. Cada uno con
 *  su razón y qué lo desbloquea · la gramática de §8. */
const FALTANTES = [
  'Frescura · es del payload y depende del período · un catálogo no tiene período',
  'Ventana · el cable no la trae y el adaptador la deja vacía · B1.17 y B1.25',
  'Estado · el adaptador escribe DISPONIBLE fijo · pintarlo sería inventar · B1.17',
  'En cuántos paneles se usa · contarlo sobre el publicado daría cero a las de borrador',
] as const

type Props = {
  metrics: readonly Metric[]
  /** Las que el adaptador no pudo adaptar · F1.35. **Acá importan más que en la
   *  consola**: una métrica con una forma fuera del enumerado no solo no se
   *  dibuja, tampoco se puede asignar a un panel, y quien compone tiene que saber
   *  por qué no aparece en la lista. */
  rejected: readonly RejectedMetric[]
  /** Mientras el catálogo vuela · encabezado completo y filas de esqueleto. */
  cargando?: boolean
}

export function CatalogView({ metrics, rejected, cargando = false }: Props) {
  // §7.3 pide filtro por ESTADO, y el estado no llega. Se ofrece por CAPA —que sí
  // llega y separa lo mismo que la pantalla busca: con qué respaldo puede afirmar
  // cada cosa— **y se dice que no es el filtro que el diseño pide**. Sustituirlo
  // en silencio daría una pantalla que parece cumplir §7.3 y no cumple.
  const [capa, setCapa] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const capas = [...new Set(metrics.map((m) => m.capa))].sort()

  /** **La búsqueda es lo único que puede dejar la tabla en cero.** El selector
   *  de capa se arma con las capas que hay, así que elegir una siempre devuelve
   *  al menos una métrica: el vacío de filtro era inalcanzable sin esto. Lo
   *  encontró una prueba que no podía elegir una capa inexistente.
   *
   *  Y está en el diseño: el `.pen` pone «BUSCAR» al lado de los dos selectores. */
  const q = busqueda.trim().toLowerCase()
  const visibles = metrics.filter(
    (m) =>
      (capa === '' || m.capa === capa) &&
      (q === '' || m.nombre.toLowerCase().includes(q) || m.key.toLowerCase().includes(q)),
  )


  // **Dos vacíos distintos, y confundirlos es el error.** Sin métricas es de
  // SISTEMA —el catálogo se llena sincronizando—; con métricas y un filtro que
  // no deja ninguna es de FILTRO, y ahí la salida es deshacer, no sincronizar.
  const sinNada = metrics.length === 0 && rejected.length === 0 && !cargando
  /** **No hace falta preguntar si hay un filtro puesto, y se puede demostrar.**
   *  Sin filtro, `visibles` es `metrics` entero —las dos condiciones del
   *  `filter` son verdaderas para todo—, así que con `metrics.length > 0` la
   *  única forma de que `visibles` quede en cero es que algún filtro esté
   *  activo. La guarda `&& filtrando` que estaba acá era redundante, y lo
   *  encontró una mutación que la quitaba y sobrevivía. */
  const filtroVacio = metrics.length > 0 && visibles.length === 0

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2">
          <Label>Buscar</Label>
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="bg-w2 text-ink text-celda rounded-sm px-2 py-1 border border-w4"
          />
        </label>

        <Label id="filtro-capa">Capa</Label>
        <select
          aria-labelledby="filtro-capa"
          className="bg-w2 text-ink text-celda rounded-sm px-2 py-1 border border-w4"
          value={capa}
          onChange={(e) => setCapa(e.target.value)}
        >
          <option value="">Todas</option>
          {capas.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <Label>
          {cargando
            ? 'Cargando'
            : filtroVacio
              ? // **El total va en el mensaje** · «0 MÉTRICAS CON ESTE FILTRO ·
                // 28 EN TOTAL». Sin él, cero con filtro y cero sin nada se leen
                // igual, y alguien concluye que se perdieron.
                `0 métricas con este filtro · ${String(metrics.length)} en total`
              : `${String(visibles.length)} de ${String(metrics.length)} métricas`}
        </Label>
        {/* Se declara que este NO es el filtro de §7.3. */}
        <Label>El filtro por estado no se puede ofrecer · el estado no llega</Label>
      </div>

      <table className="w-full border-collapse" aria-busy={cargando}>
        <thead>
          <tr className="border-b border-w4">
            {COLUMNAS.map((c) => (
              <th key={c.titulo} className="text-left py-2 align-bottom">
                <div className="flex flex-col gap-1">
                  <Label as="div">{c.titulo}</Label>
                  {/* El origen · A4 muestra los derivados con el suyo. */}
                  <Label as="div">{c.origen}</Label>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cargando && <SkeletonRows columnas={COLUMNAS.length} />}
          {sinNada && (
            <EmptyRow
              clase="sistema"
              columnas={COLUMNAS.length}
              razon="Este cliente no tiene métricas en el catálogo"
              salida="Se llenan sincronizando desde el modelo semántico · B1.18"
            />
          )}
          {filtroVacio && (
            <EmptyRow
              clase="filtro"
              columnas={COLUMNAS.length}
              razon={
                q === ''
                  ? `Ninguna métrica es de la capa ${capa}`
                  : `Ninguna métrica coincide con «${busqueda.trim()}»`
              }
              salida="Las métricas siguen ahí · el filtro las esconde"
              onLimpiarFiltro={() => {
                setCapa('')
                setBusqueda('')
              }}
            />
          )}
          {visibles.map((m) => (
            <tr key={m.id} className="border-b border-w3">
              {COLUMNAS.map((c) => (
                <td key={c.titulo} className="py-2 text-ink text-celda">
                  {c.leer(m)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {rejected.length > 0 && (
        <div className="flex flex-col gap-1 rounded-sm bg-w2 p-3">
          <Label as="div">
            {`${String(rejected.length)} métrica(s) del catálogo no se pueden componer`}
          </Label>
          {rejected.map((r) => (
            <Label key={r.id} as="div">{`${r.key} · ${r.razon}`}</Label>
          ))}
        </div>
      )}

      {/* **La pantalla declara lo que no puede afirmar.** Sin esto el inventario
          se lee como completo, que es justo lo contrario de lo que §7.3 quiere de
          él. */}
      <div className="flex flex-col gap-1 rounded-sm bg-w2 p-3">
        <Label as="div">{`Faltan ${String(FALTANTES.length)} datos que §7.3 pide por métrica`}</Label>
        {FALTANTES.map((f) => (
          <Label key={f} as="div">
            {f}
          </Label>
        ))}
        <Label as="div">
          Y la acción de sincronizar · ninguna de las seis rutas de admin la expone · hoy es
          make sync-catalog
        </Label>
        <Label as="div">
          Editar tampoco · no hay ruta de escritura sobre el catálogo, así que el aviso de qué
          paneles afecta no tiene dónde dispararse
        </Label>
      </div>
    </div>
  )
}
