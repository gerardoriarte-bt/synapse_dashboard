/** El resumen de la ficha · cuatro cards arriba · 2026-10-20
 *
 *  Medido en QA el 2026-10-20: la ficha de un cliente con seis roles y doce
 *  usuarios era una sola columna de seis pantallas, todo con el mismo peso. Las
 *  cards dicen lo que importa de cada bloque de un vistazo y llevan a él · §5 de
 *  `docs/PROPUESTA-2026-10-20-identidad-del-cliente-y-ficha.md`.
 *
 *  **Reemplaza a la fila «Secciones de la ficha»** de F5.34, que llevaba a cada
 *  bloque sin decir nada de él.
 *
 *  **Ninguna cifra se calcula acá**: son conteos de lo que la ficha ya trajo. Lo
 *  que no llegó todavía se dice «cargando», no cero.
 */
import { Label } from '../../render/primitives/Label'
import { Accion } from '../../render/primitives/Accion'
import type { Formatter } from '../../render/format'
import type { Tenant } from '../../api/admin'
import type { EstadoDelAcceso } from './estadoDelAcceso'

export type ResumenDeUsuarios = { total: number; activos: number; nuncaEntraron: number }

type Props = {
  tenant: Tenant | null
  format: Formatter
  /** `null` mientras cargan. */
  roles: { roles: number; pestanas: number; paneles: number } | null
  usuarios: ResumenDeUsuarios | null
  acceso: EstadoDelAcceso
  /** Lleva al bloque · el `id` de la sección. */
  onIr: (seccion: string) => void
  onVerificar?: (() => void) | undefined
}

/** Lo que dice el acceso en una palabra · el mismo vocabulario que la fila de
 *  `AgentConfig`, para que la card y la sección no se contradigan. */
const ACCESO: Record<EstadoDelAcceso['estado'], string> = {
  'sin-verificar': 'Sin verificar',
  verificando: 'Verificando…',
  vigente: 'Vigente',
  'faltan-datos': 'Faltan datos',
  'sin-acceso': 'Sin acceso',
  'sin-configurar': 'Sin configurar',
  error: 'Sin verificar',
}

const plural = (n: number, uno: string, varios: string) => `${String(n)} ${n === 1 ? uno : varios}`

function Card({ titulo, children, pie }: { titulo: string; children: React.ReactNode; pie: React.ReactNode }) {
  return (
    // «Resumen · …» y no el título a secas: «Acceso a datos» ya nombra la
    // sección de abajo, y dos regiones iguales no se distinguen.
    <section aria-label={`Resumen · ${titulo}`} className="flex min-h-44 flex-col gap-2 rounded-xl border border-w3 bg-panel p-5">
      <Label as="div">{titulo}</Label>
      <div className="flex flex-1 flex-col gap-1">{children}</div>
      <div className="flex justify-end gap-2">{pie}</div>
    </section>
  )
}

const CIFRA = 'font-display text-titulo-lg leading-titulo tracking-titulo text-ink'
const VALOR = 'font-body text-cuerpo text-ink'

export function ResumenDeFicha({ tenant, format, roles, usuarios, acceso, onIr, onVerificar }: Props) {
  return (
    <div className="grid grid-cols-4 gap-4">
      <Card titulo="Identidad" pie={<Accion tamano="compacta" onClick={() => onIr('ficha-identidad')}>Ver identidad</Accion>}>
        {tenant === null ? (
          <Label as="span">Cargando identidad</Label>
        ) : (
          <>
            <span className={VALOR}>{`${tenant.moneda} · ${tenant.zonaHoraria}`}</span>
            <Label as="span">{`Alta ${format.calendar(tenant.creadoEn)}`}</Label>
          </>
        )}
      </Card>

      <Card titulo="Roles" pie={<Accion tamano="compacta" onClick={() => onIr('ficha-roles')}>Ver roles</Accion>}>
        {roles === null ? (
          <Label as="span">Cargando roles</Label>
        ) : (
          <>
            <span className={CIFRA}>{roles.roles}</span>
            <Label as="span">{`${plural(roles.pestanas, 'pestaña', 'pestañas')} · ${plural(roles.paneles, 'panel', 'paneles')}`}</Label>
          </>
        )}
      </Card>

      <Card titulo="Usuarios" pie={<Accion tamano="compacta" onClick={() => onIr('ficha-usuarios')}>Ver usuarios</Accion>}>
        {usuarios === null ? (
          <Label as="span">Cargando usuarios</Label>
        ) : (
          <>
            <span className={CIFRA}>{usuarios.total}</span>
            <Label as="span">
              {`${plural(usuarios.activos, 'activo', 'activos')}${usuarios.nuncaEntraron > 0 ? ` · ${plural(usuarios.nuncaEntraron, 'nunca entró', 'nunca entraron')}` : ''}`}
            </Label>
          </>
        )}
      </Card>

      <Card
        titulo="Acceso a datos"
        pie={
          onVerificar !== undefined && acceso.estado !== 'verificando' ? (
            <Accion tamano="compacta" onClick={onVerificar}>Verificar acceso</Accion>
          ) : (
            <Accion tamano="compacta" onClick={() => onIr('ficha-acceso')}>Ver acceso</Accion>
          )
        }
      >
        <span className={VALOR}>{ACCESO[acceso.estado]}</span>
        {(acceso.estado === 'vigente' || acceso.estado === 'faltan-datos') && (
          <Label as="span">{`Verificado ${format.calendar(acceso.verificadoEn)}`}</Label>
        )}
        {acceso.estado === 'sin-verificar' && <Label as="span">En esta sesión</Label>}
      </Card>
    </div>
  )
}
