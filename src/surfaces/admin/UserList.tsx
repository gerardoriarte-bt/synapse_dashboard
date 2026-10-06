/** A3 · Usuarios · §PEN:A3 · F4.3
 *
 *  Su pregunta operativa, literal del frame: *¿Quién entra a qué cliente, y con
 *  qué rol?*
 *
 *  Presentacional: los hooks viven en `Admin`, como el resto de §4.
 *
 *  ── LA DIVERGENCIA GRANDE SE CERRÓ · 2026-09-26 ────────────────────────────
 *
 *  Acá decía que **el dibujo declara `ALCANCE · PLATAFORMA`** y la única ruta era
 *  por cliente, con `/admin/users` dando 404. La razón escrita para no compensar
 *  era buena y sigue valiendo: «un total armado acá se leería como un número de
 *  plataforma y sería una suma nuestra — si un cliente falla, el total baja sin
 *  decirlo».
 *
 *  **`GET /admin/users` llegó en `6e521cc`** —B4.17— y trae `total`, `tenants` y
 *  `tenant_name` por usuario: los conteos los cuenta el servicio, que es
 *  exactamente lo que esa razón pedía. Medida el 2026-09-26.
 *
 *  Así que la pantalla pasa a ser de plataforma, con `CLIENTE` como columna, que
 *  es como el dibujo la compone.
 *
 *  ── LOS OTROS TRES HUECOS ──────────────────────────────────────────────────
 *
 *  **`INVITACIÓN PENDIENTE`**, que el dibujo pinta como tercer estado y el cable
 *  no trae: `is_active` sólo separa activo de suspendido. **Inferirlo de «nunca
 *  entró» sería inventarlo** — alguien puede tener cuenta activa y no haber
 *  entrado todavía, que es otra cosa.
 *
 *  **Quién dio de alta** —«POR M. BENÍTEZ»— y **«REENVIAR INVITACIÓN»**, que no
 *  tiene ruta: sin manejador no se pinta el CTA.
 */
import { useState } from 'react'
import { Label } from '../../render/primitives/Label'
import { Ayuda } from '../../render/primitives/Ayuda'
import { EmptyRow } from './EmptyRow'
import { SkeletonRows } from './SkeletonRows'
import type { Formatter } from '../../render/format'
import type { Usuario } from '../../api/admin'

const NOTA = 'font-mono text-nota leading-rotulo tracking-rotulo uppercase text-dim m-0'

/** Las seis del dibujo. **`CLIENTE` entró el 2026-09-26**: cuando la pantalla
 *  era de un cliente repetirlo en cada fila era ruido, y con alcance de
 *  plataforma es la columna que contesta la mitad de la pregunta —«¿quién entra a
 *  QUÉ CLIENTE?»—. §7.3 lo fundamenta: A3 cruza clientes porque la regla del
 *  tenant no editable sólo se ve cuando el tenant es una columna que se compara. */
const COLUMNAS = ['Usuario', 'Cliente', 'Rol', 'Estado', 'Último acceso', 'Alta'] as const

/** **Eran cuatro hasta el 2026-09-26.** El de alcance se cerró con B4.17. */
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
    // El cable sólo trae activo o suspendido.
    'Las invitaciones pendientes, además de los usuarios activos y suspendidos',
    // El dibujo pone «por M. Benítez» y no hay campo.
    'Quién dio de alta a cada usuario',
    // No hay ruta.
    'Volver a enviar una invitación que nadie aceptó',
] as const


type Props = {
  usuarios: readonly Usuario[]
  /** Del locale del tenant · F1.13b. Antes acá había un `Intl` con `'es-MX'`. */
  format: Formatter
  /** **Los cuenta el SERVICIO**, no esta pantalla · ver el encabezado. */
  total: number
  /** Clientes **con al menos un usuario**, que es lo que el dibujo dice. */
  clientes: number
  cargando?: boolean
}

export function UserList({ format, usuarios, total, clientes, cargando = false }: Props) {
  const [busqueda, setBusqueda] = useState('')

  const q = busqueda.trim().toLowerCase()
  const visibles = usuarios.filter(
    (u) =>
      q === '' ||
      u.nombre.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      // **El cliente también se busca**: con alcance de plataforma, «mostrame los
      // de UA MX» es la primera cosa que alguien va a escribir acá.
      (u.clienteNombre ?? '').toLowerCase().includes(q),
  )

  // **Dos vacíos distintos**, como en `CatalogView`: sin usuarios es de alta —el
  // cliente es nuevo— y con usuarios pero filtro sin resultados es de FILTRO, y
  // ahí la salida es deshacer. El `.pen` dibuja el segundo aparte.
  const sinNada = usuarios.length === 0 && !cargando
  const filtroVacio = usuarios.length > 0 && visibles.length === 0

  const activos = usuarios.filter((u) => u.activo).length

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        {/* ── EL TÍTULO NO VA ACÁ · 2026-09-28 ────────────────────────────
            Había un `<h1>` con «Usuarios» **y `AdminChrome` pinta el mismo
            texto**, porque sale de `pantallas.ts`. Dos `<h1>` por pantalla y el
            título repetido; el dibujo tiene uno solo.

            Lo destapó cruzar el tamaño contra el dibujo: la pregunta era de 15
            contra 26 y la respuesta resultó ser que sobraba un título. La
            pregunta operativa SÍ es de la vista —es lo que esta pantalla
            contesta— y se queda. */}
        <Ayuda>¿Quién entra a qué cliente, y con qué rol?</Ayuda>
        {/* **El resumen literal del dibujo** —«17 usuarios · 2 clientes con
            usuarios»— y los dos números salen del servicio.

            Acá vivió un aviso diciendo «esta lista es de UN cliente · la ruta que
            existe es por tenant y `/admin/users` da 404». Era cierto al
            escribirlo y **quedó falso el 2026-09-26**, cuando la ruta llegó: una
            afirmación vencida en pantalla es peor que un hueco, porque el
            usuario no tiene con qué dudarla.

            El alcance lo declara el chrome; lo que le toca a la pantalla es decir
            qué está mostrando, y ahora es todo. */}
        <div className="flex items-center gap-3">
          <Label>
            {filtroVacio
              ? `0 usuarios con este filtro · ${String(total)} en total`
              : `${String(total)} ${total === 1 ? 'usuario' : 'usuarios'} · ${String(clientes)} ${clientes === 1 ? 'cliente con usuarios' : 'clientes con usuarios'} · ${String(activos)} ${activos === 1 ? 'activo' : 'activos'}`}
          </Label>
        </div>
      </header>

      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Label as="div">Usuarios de todos los clientes</Label>
          <div className="flex-1" />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            aria-label="Buscar"
            placeholder="BUSCAR"
            className="font-mono text-label leading-rotulo tracking-rotulo uppercase text-ink bg-transparent border border-w3 rounded-md px-2 py-1"
          />
        </div>

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

            {sinNada && (
              <EmptyRow
                clase="alta"
                columnas={COLUMNAS.length}
                razon="Todavía no hay usuarios en ningún cliente."
                salida="El alta es por invitación: nadie fija la contraseña de otro."
              />
            )}

            {filtroVacio && (
              <EmptyRow
                clase="filtro"
                columnas={COLUMNAS.length}
                razon="Ningún usuario coincide con la búsqueda."
                salida="Deshacer la búsqueda."
                onLimpiarFiltro={() => setBusqueda('')}
              />
            )}

            {visibles.map((u) => (
              <tr key={u.id} className="border-b border-w3 align-top">
                <td className="py-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-ink text-celda">{u.nombre}</span>
                    <span className={NOTA}>{u.email}</span>
                  </div>
                </td>
                <td className="py-3">
                  {/* **`—` cuando no llega, y no el id.** `clienteNombre` es
                      `null` sólo si la fila vino de la ruta por cliente; acá no
                      pasa, y si pasara un guion dice «no sé» en vez de mentir. */}
                  <span className="text-ink text-celda">{u.clienteNombre ?? '—'}</span>
                </td>
                <td className="py-3">
                  <span className="text-ink text-celda">{u.rol}</span>
                </td>
                <td className="py-3">
                  {/* **Dos estados y no tres.** El dibujo pinta también
                      «invitación pendiente», que el cable no distingue. */}
                  <Label>{u.activo ? 'Activo' : 'Suspendido'}</Label>
                </td>
                <td className="py-3">
                  <span className="text-ink text-celda">
                    {u.ultimoAccesoEn === null ? 'Nunca' : format.calendar(u.ultimoAccesoEn)}
                  </span>
                </td>
                <td className="py-3">
                  <span className="text-ink text-celda">{format.calendar(u.altaEn)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Las tres reglas del pie, literales del dibujo. No son decoración:
            explican por qué esta pantalla no ofrece editar el cliente ni fijar
            una contraseña. */}
        <div className="flex flex-col gap-1 border-t border-w2 pt-3">
          <Ayuda>
            El cliente no se edita después de crear: mover un usuario de cliente es eliminarlo y
            volver a invitarlo.
          </Ayuda>
          <Ayuda>
            El alta es por invitación: nadie fija la contraseña de otro, ni siquiera un
            super-admin.
          </Ayuda>
          <Ayuda>
            Suspender corta el acceso sin borrar el registro: la auditoría de quién vio qué se
            conserva.
          </Ayuda>
        </div>

        <div className="flex flex-col gap-1 border-t border-w2 pt-3">
          <Ayuda>Esta pantalla va a crecer. Falta:</Ayuda>
          {FALTANTES.map((f) => (
            <Ayuda key={f}>{f}</Ayuda>
          ))}
        </div>
      </section>
    </div>
  )
}
