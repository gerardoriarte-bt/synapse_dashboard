/** A3 · Usuarios · §PEN:A3 · F4.3
 *
 *  Su pregunta operativa, literal del frame: *¿Quién entra a qué cliente, y con
 *  qué rol?*
 *
 *  Presentacional: los hooks viven en `Admin`, como el resto de §4.
 *
 *  ── LA DIVERGENCIA GRANDE, Y ES DE ALCANCE ─────────────────────────────────
 *
 *  **El dibujo declara `ALCANCE · PLATAFORMA`** —su resumen dice «17 usuarios ·
 *  2 clientes con usuarios»— y la ruta que existe es **por cliente**:
 *  `/admin/tenants/{tenantId}/users`. `/admin/users` da 404.
 *
 *  **No se compensa pidiendo N veces la ruta.** Un total armado acá se leería
 *  como un número de plataforma y sería una suma nuestra: si un cliente falla,
 *  el total baja sin decirlo. La pantalla dice de qué cliente está hablando y
 *  declara el hueco.
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
import { EmptyRow } from './EmptyRow'
import { SkeletonRows } from './SkeletonRows'
import type { Usuario } from '../../api/admin'

const NOTA = 'font-mono text-nota leading-rotulo tracking-rotulo uppercase text-dim m-0'

/** Seis en el dibujo; acá cinco. `CLIENTE` no se pinta como columna porque la
 *  pantalla ya es de un cliente —lo dice su encabezado— y repetirlo en cada fila
 *  sería el mismo ruido que `BodyProps.metric` prohíbe para el título. */
const COLUMNAS = ['Usuario', 'Rol', 'Estado', 'Último acceso', 'Alta'] as const

const FALTANTES = [
  'Alcance · el dibujo pide plataforma y la ruta es por cliente · `/admin/users` da 404',
  'Invitación pendiente · el cable sólo trae activo o suspendido',
  'Quién dio de alta · el dibujo pone «por M. Benítez» y no hay campo',
  'Reenviar invitación · no hay ruta',
] as const

/** Mismo precedente y misma razón que `FeedHealth` y `ConsoleContainer`: el
 *  locale del tenant no llega —F1.13b— así que se fija acá y el día que el campo
 *  exista se cambia una línea. */
const FECHA = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })

type Props = {
  usuarios: readonly Usuario[]
  tenant: string | null
  cargando?: boolean
}

export function UserList({ usuarios, tenant, cargando = false }: Props) {
  const [busqueda, setBusqueda] = useState('')

  const q = busqueda.trim().toLowerCase()
  const visibles = usuarios.filter(
    (u) => q === '' || u.nombre.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
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
        <h1 className="font-display text-titulo tracking-titulo leading-titulo text-ink m-0">
          Usuarios
        </h1>
        <Label as="div">¿Quién entra a qué cliente, y con qué rol?</Label>
        {/* **Acá había un chip «Alcance · cliente» y era un defecto**, visto en
            pantalla el 2026-09-25: el chrome de arriba declara «alcance ·
            plataforma · todas las cuentas» —lo dice `pantallas.ts`, y §7.3 lo
            fundamenta: A3 cruza clientes porque la regla del tenant no editable
            sólo se ve cuando el tenant es una columna que se compara—. Dos
            chips contradiciéndose en la misma página es peor que uno solo.
            
            El alcance lo declara el chrome. Lo que le toca a la pantalla es
            decir **qué está mostrando de verdad**, que es un cliente. */}
        <div className="flex items-center gap-3">
          <Label as="div">
            Esta lista es de UN cliente · la ruta que existe es por tenant y
            `/admin/users` da 404
          </Label>
        </div>
        <div className="flex items-center gap-3">
          <Label>
            {filtroVacio
              ? `0 usuarios con este filtro · ${String(usuarios.length)} en total`
              : `${String(usuarios.length)} ${usuarios.length === 1 ? 'usuario' : 'usuarios'} · ${String(activos)} ${activos === 1 ? 'activo' : 'activos'}`}
          </Label>
        </div>
      </header>

      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Label as="div">{tenant === null ? 'Usuarios' : `Usuarios de ${tenant}`}</Label>
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
                razon="Este cliente todavía no tiene usuarios."
                salida="El alta es por invitación · nadie fija la contraseña de otro."
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
                  <span className="text-ink text-celda">{u.rol}</span>
                </td>
                <td className="py-3">
                  {/* **Dos estados y no tres.** El dibujo pinta también
                      «invitación pendiente», que el cable no distingue. */}
                  <Label>{u.activo ? 'Activo' : 'Suspendido'}</Label>
                </td>
                <td className="py-3">
                  <span className="text-ink text-celda">
                    {u.ultimoAccesoEn === null ? 'Nunca' : FECHA.format(new Date(u.ultimoAccesoEn))}
                  </span>
                </td>
                <td className="py-3">
                  <span className="text-ink text-celda">{FECHA.format(new Date(u.altaEn))}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Las tres reglas del pie, literales del dibujo. No son decoración:
            explican por qué esta pantalla no ofrece editar el cliente ni fijar
            una contraseña. */}
        <div className="flex flex-col gap-1 border-t border-w2 pt-3">
          <Label as="div">
            El cliente no se edita después de crear · mover un usuario de cliente es eliminarlo y
            volver a invitarlo
          </Label>
          <Label as="div">
            El alta es por invitación · nadie fija la contraseña de otro, ni siquiera un
            super-admin
          </Label>
          <Label as="div">
            Suspender corta el acceso sin borrar el registro · la auditoría de quién vio qué se
            conserva
          </Label>
        </div>

        <div className="flex flex-col gap-1 border-t border-w2 pt-3">
          <Label as="div">{`Faltan ${String(FALTANTES.length)} cosas que §7.3 pide de esta pantalla`}</Label>
          {FALTANTES.map((f) => (
            <Label as="div" key={f}>{f}</Label>
          ))}
        </div>
      </section>
    </div>
  )
}
