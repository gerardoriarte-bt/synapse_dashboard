/** A5 · Salud de feeds · §PEN:A5 · F4.24
 *
 *  **«La pantalla que explica por qué una métrica está degradada»**, dice su
 *  nota. Y su pregunta operativa, del frame: *¿Por qué una métrica está
 *  degradada, y qué la desbloquea?*
 *
 *  Presentacional: los hooks viven en `Admin`, como el resto de §4.
 *
 *  ── LO QUE ESTA PANTALLA NO HACE, Y ESTÁ DECLARADO ─────────────────────────
 *
 *  **No lee `status`.** El cable lo manda y el pie del dibujo dice por qué no se
 *  usa: «el estado no se escribe, se DERIVA · si frescura > cadencia ×
 *  tolerancia, degradado». Es la razón por la que B2.13 se pidió como ruta y no
 *  como campo. Ver `saludDeFuente.ts`.
 *
 *  **No pinta la CAPA**, que el dibujo pone como columna: el cable no la manda.
 *  Se declara el hueco abajo en vez de inventarla.
 *
 *  **No ofrece «VER RECHAZOS» ni «SINCRONIZAR TODO».** Los dos están dibujados y
 *  ninguno tiene ruta — sin manejador no se pinta el CTA, que es la regla del
 *  botón muerto: «un botón que se aprieta y devuelve 403 es peor que uno
 *  ausente».
 */
import { useState } from 'react'
import { Label } from '../../render/primitives/Label'
import { EmptyRow } from './EmptyRow'
import { SkeletonRows } from './SkeletonRows'
import { limiteHoras, resumen, saludDe } from './saludDeFuente'
import type { SaludDeFuente } from './saludDeFuente'
import type { Fuente } from '../../api/admin'
import type { Formatter } from '../../render/format'

/** Mono 9 · el tamaño `nota`, el mismo que usan `RoleCard` y la identidad del
 *  navbar. La segunda línea de cada celda va acá: el dibujo la pone más chica. */
const NOTA = 'font-mono text-nota leading-rotulo tracking-rotulo uppercase text-dim m-0'

const COLUMNAS = ['Fuente', 'Capa', 'Cadencia', 'Última carga', 'Frescura', 'Filas', 'Fallas S › G', 'Métricas'] as const

/** Las horas de frescura, REDONDEADAS · 2026-10-01.
 *
 *  **El defecto, visto en pantalla**: la columna decía `12.186776741388888 h`.
 *  El servicio manda un flotante —son horas calculadas, no un entero— y se
 *  pintaba con `String()`, que escribe los quince decimales.
 *
 *  **Se redondea a entero y no a un decimal**: la pregunta que esta columna
 *  contesta es «¿está dentro del límite?», y el límite es cadencia × tolerancia,
 *  en horas enteras. Un decimal daría una precisión que la decisión no usa.
 *
 *  **Y NO pasa por el formateador del tenant.** Es un conteo de horas, no una
 *  cifra de negocio: no lleva separador de miles ni moneda, y el `.pen` lo
 *  escribe `31 h`. Redondear acá es presentación, no cálculo — el dato que
 *  decide el estado sigue siendo el flotante, en `saludDeFuente`. */
const horas = (n: number) => `${String(Math.round(n))} h`

/** Lo que el cable no manda, dicho en la pantalla. Misma forma que `CatalogView`
 *  y `RoleEditor`: el hueco se declara donde se ve, no en un comentario. */
/** LO QUE ESTA PANTALLA TODAVÍA NO MUESTRA · reescrito el 2026-09-30 (humano)
 *
 *  **Esto se PINTA, así que es copy de producto y no una nota nuestra.** Hasta
 *  hoy citaba §7.3, nombraba rutas del servicio y hablaba de «el cable» en la
 *  pantalla de un cliente — la auditoría de usabilidad lo puso primero en su
 *  lista: `docs/AUDITORIA-2026-09-30-usabilidad.md` §1.1.
 *
 *  **Declarar lo que falta se conserva**, que es la mejor costumbre de este
 *  repositorio y la misma gramática de §8: un panel apagado dice qué pasa. Lo
 *  que cambia es a quién se le habla. **La razón técnica de cada línea no se
 *  pierde: baja al comentario**, que es donde le sirve a quien la va a
 *  construir.
 */
const FALTANTES = [
    // El dibujo la pone como columna y el cable no la manda · pedido a backend.
    'De qué capa viene cada fuente',
    // No hay ruta que liste los rechazos Silver→Gold.
    'Ver las filas que una carga dejó afuera',
    // No hay ruta que dispare una carga.
    'Pedir una sincronización desde acá',
] as const

/** **Acá se armaban dos `Intl` con `'es-MX'` fijo** y su comentario prometía
 *  cambiar una línea el día que el locale llegara · F1.13b. Llegó el
 *  2026-09-26, y lo que se cambió no fue el argumento: se borraron los dos.
 *
 *  `format.ts` ya declaraba la regla —«nadie fuera de acá arma un `Intl`»— y
 *  tres pantallas de admin la rompían, cada una decidiendo el locale por su
 *  cuenta. Ahora el formateador baja por props, como en la consola.
 *
 *  Se formatea y no se muestra el ISO crudo porque el dibujo pone «14 ago» y
 *  «08:12» en dos líneas, no un `2026-08-14T08:12:00Z`. */

const TEXTO: Record<SaludDeFuente, string> = {
  AL_DIA: 'Dentro de límite',
  DEGRADADA: 'Degradada',
  SIN_CARGA: 'Sin carga',
}

type Props = {
  fuentes: readonly Fuente[]
  tenant: string | null
  /** Del locale del tenant · F1.13b. Ver el comentario de arriba. */
  format: Formatter
  cargando?: boolean
}

export function FeedHealth({ fuentes, tenant, format, cargando = false }: Props) {
  const [abierta, setAbierta] = useState<string | null>(null)
  const cuenta = resumen(fuentes)

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        {/* ── EL TÍTULO NO VA ACÁ · 2026-09-28 ────────────────────────────
            Había un `<h1>` con «Salud de feeds» **y `AdminChrome` pinta el mismo
            texto**, porque sale de `pantallas.ts`. Dos `<h1>` por pantalla y el
            título repetido; el dibujo tiene uno solo.

            Lo destapó cruzar el tamaño contra el dibujo: la pregunta era de 15
            contra 26 y la respuesta resultó ser que sobraba un título. La
            pregunta operativa SÍ es de la vista —es lo que esta pantalla
            contesta— y se queda. */}
        {/* La pregunta operativa, literal del frame. §1.1 la hace obligatoria. */}
        <Label as="div">¿Por qué una métrica está degradada, y qué la desbloquea?</Label>
        <div className="flex items-center gap-3">
          {/* El alcance, que acá es TENANT — por eso esta pantalla lleva
              selector de cliente y A1 no: A1 opera sobre la plataforma. */}
          <span className="rounded-xs bg-w3 px-1 py-0.5">
            <Label>Alcance · cliente</Label>
          </span>
          {/* **Contado de lo derivado**, no de un campo · el resumen del dibujo
              dice «9 FUENTES · 8 AL DÍA · 1 DEGRADADA». */}
          <Label>
            {`${String(fuentes.length)} ${fuentes.length === 1 ? 'fuente' : 'fuentes'} · ${String(cuenta.AL_DIA)} al día · ${String(cuenta.DEGRADADA)} ${cuenta.DEGRADADA === 1 ? 'degradada' : 'degradadas'} · ${String(cuenta.SIN_CARGA)} sin carga`}
          </Label>
        </div>
      </header>

      <section className="flex flex-col gap-3">
        <Label as="div">{tenant === null ? 'Fuentes' : `Fuentes de ${tenant}`}</Label>

        <table className="w-full border-collapse">
          <thead>
            <tr>
              {COLUMNAS.map((c) => (
                <th key={c} scope="col" className="text-left pb-2 border-b border-w2">
                  <Label>{c}</Label>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cargando && <SkeletonRows columnas={COLUMNAS.length} />}

            {/* **El vacío de alta · el tercer tipo**, y el encabezado se
                conserva: «las columnas siguen diciendo qué habría acá». No falta
                un filtro ni falla nada — el cliente es nuevo. */}
            {!cargando && fuentes.length === 0 && (
              <EmptyRow
                clase="alta"
                columnas={COLUMNAS.length}
                razon="Este cliente todavía no tiene fuentes de datos."
                salida="Se dan de alta al conectar su primera tabla Gold."
              />
            )}

            {fuentes.map((f) => {
              const salud = saludDe(f)
              const expandida = abierta === f.clave
              return (
                <tr key={f.clave} className="border-b border-w3 align-top">
                  <td className="py-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-ink text-celda">{f.nombre}</span>
                      {f.tablaGold !== '' && <span className={NOTA}>{f.tablaGold}</span>}
                      {expandida && <Expansion fuente={f} salud={salud} />}
                      <button
                        type="button"
                        onClick={() => setAbierta(expandida ? null : f.clave)}
                        className="self-start font-mono text-nota tracking-rotulo uppercase text-acc cursor-pointer bg-transparent border-0 p-0"
                      >
                        {expandida ? 'Plegar' : 'Por qué'}
                      </button>
                    </div>
                  </td>
                  {/* La capa, que el cable no manda · se dice, no se inventa. */}
                  <td className="py-3"><span className={NOTA}>—</span></td>
                  <td className="py-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-ink text-celda">{`Cada ${String(f.cadenciaHoras)} h`}</span>
                      <span className={NOTA}>{`Tolerancia ${String(f.toleranciaFactor)}×`}</span>
                    </div>
                  </td>
                  <td className="py-3">
                    {f.ultimaCargaEn === null ? (
                      <span className="text-ink text-celda">—</span>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <span className="text-ink text-celda">
                          {format.calendar(f.ultimaCargaEn)}
                        </span>
                        <span className={NOTA}>{format.clock(f.ultimaCargaEn)}</span>
                      </div>
                    )}
                  </td>
                  <td className="py-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-ink text-celda">
                        {f.frescuraHoras === null ? '—' : horas(f.frescuraHoras)}
                      </span>
                      <span className={NOTA}>{TEXTO[salud]}</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className="text-ink text-celda">{f.filasProcesadas ?? '—'}</span>
                  </td>
                  <td className="py-3">
                    <span className="text-ink text-celda">{f.filasFallidas ?? '—'}</span>
                  </td>
                  <td className="py-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-ink text-celda">{String(f.metricas.length)}</span>
                      <span className={NOTA}>Afectadas</span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* Las tres reglas del pie, literales del dibujo. No son decoración:
            explican por qué la columna de estado dice lo que dice. */}
        <div className="flex flex-col gap-1 border-t border-w2 pt-3">
          <Label as="div">
            El estado no se escribe, se deriva · si frescura &gt; cadencia × tolerancia, degradado
          </Label>
          <Label as="div">
            Una métrica compuesta hereda la peor capa y la frescura más vieja
          </Label>
          <Label as="div">
            Una métrica puede endurecer su estado —degradado a bloqueado— pero nunca ablandarlo
          </Label>
        </div>

        <div className="flex flex-col gap-1 border-t border-w2 pt-3">
          <Label as="div">{`Esta pantalla va a crecer`}</Label>
          {FALTANTES.map((f) => (
            <Label as="div" key={f}>{f}</Label>
          ))}
        </div>
      </section>
    </div>
  )
}

/** La fila expandida · el dibujo la usa para contestar la pregunta del título:
 *  qué pasó, qué lo desbloquea y a qué métricas pega. */
function Expansion({ fuente, salud }: { fuente: Fuente; salud: SaludDeFuente }) {
  const limite = limiteHoras(fuente)
  return (
    <div className="flex flex-col gap-2 py-2">
      <p className="font-body text-cuerpo leading-cuerpo text-ink m-0">
        {salud === 'SIN_CARGA'
          ? `Esta fuente nunca registró una carga, así que no tiene frescura que comparar. No está atrasada: está sin estrenar.`
          : `El dato tiene ${horas(fuente.frescuraHoras ?? 0)} y la fuente se refresca cada ${String(fuente.cadenciaHoras)} h. El límite es cadencia × tolerancia = ${String(limite)} h.`}
      </p>
      {/* **Qué lo desbloquea sale del estado, no de un campo**: el cable no
          manda un `unlocks_with` por fuente. Se dice lo que es cierto en cada
          caso y no se inventa una acción que nadie puede ejecutar. */}
      <Label as="div">
        {salud === 'SIN_CARGA'
          ? 'Lo desbloquea · conectar su tabla Gold y correr la primera carga'
          : 'Lo desbloquea · una carga más reciente que el límite de la fuente'}
      </Label>
      <div className="flex flex-wrap items-center gap-2">
        <Label>Pega en</Label>
        {fuente.metricas.map((m) => (
          <span key={m} className="rounded-xs bg-w2 px-1 py-0.5">
            <Label>{m}</Label>
          </span>
        ))}
      </div>
    </div>
  )
}
