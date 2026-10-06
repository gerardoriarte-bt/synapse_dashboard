/** B1 · Selector de contexto de edición · F4.7 · reescrita el 2026-10-06
 *
 *  §7.2: «Elegir **tenant y rol**. Muestra qué pestañas existen, cuáles heredan
 *  de la **plantilla de vertical** y cuáles tienen **override**. Punto de entrada
 *  de todo el builder.»
 *
 *  ── POR QUÉ SE REESCRIBIÓ ───────────────────────────────────────────────────
 *
 *  `docs/AUDITORIA-2026-10-06-builder-contexto-y-canvas.md` · D2, decidido por
 *  el humano: «hay que completarla como debe quedar». Hasta hoy esta pantalla
 *  eran cinco apiladas —contexto, editor de pestañas, binder, selector de
 *  gráfico y el ciclo de publicar— en unas cinco alturas de scroll, y todo su
 *  texto vestía el mismo mono de 10 en mayúsculas, se tocara o no.
 *
 *  Ahora es lo que el `.pen` dibuja: una pantalla de **decisión** —cliente,
 *  rol, versión— que termina en `COMPONER ‹pestaña›`. Configurar un panel se
 *  mudó al inspector del canvas, que es donde el panel está a la vista.
 *
 *  ── EL ROL ES UN FILTRO, Y SE VE QUE LO ES ──────────────────────────────────
 *
 *  D5: «debería funcionar como un filtro para poder seleccionar y editar los
 *  dashboards por cada rol». El `.pen` lo dice igual —«EL ROL DEFINE QUÉ
 *  PESTAÑAS SE EDITAN»— y hasta hoy el selector se movía sin cambiar nada en
 *  la pantalla. Ahora filtra la lista de pestañas, y cada pestaña dice quién la
 *  ve y deja cambiarlo.
 *
 *  **Lo que el `.pen` pide y sigue sin poderse pintar** es la proporción entre
 *  paneles heredados y propios: ningún contrato declara herencia —ni vertical,
 *  ni plantilla, ni override—. Ya no se anuncia en pantalla: era una nota del
 *  plan, no del producto.
 *
 *  **§PEN:B1** · B1 · «Selector de contexto».
 */
import { Label } from '../../render/primitives/Label'
import { Ayuda } from '../../render/primitives/Ayuda'
import { Opcion } from '../../render/primitives/Opcion'
import type { EstadoDeLayout, LayoutVersion, Tenant } from '../../api/admin'

/** El estado en palabras de producto · el cable dice `publicado` en minúscula,
 *  que se pintaba tal cual dentro de un rótulo. */
const ESTADO: Readonly<Record<EstadoDeLayout, string>> = {
  borrador: 'Borrador',
  publicado: 'Publicada',
  archivado: 'Archivada',
}

type Props = {
  tenants: readonly Tenant[]
  tenantActivo: string | null
  onTenant: (id: string) => void
  roles: readonly { id: string; nombre: string }[]
  /** `null` es «todos los roles»: el filtro apagado. */
  rolActivo: string | null
  onRol: (id: string | null) => void
  versiones: readonly LayoutVersion[]
  versionActiva: string | null
  onVersion: (id: string) => void
  /** La fecha de publicación, ya formateada con el locale de quien mira. */
  fecha: (iso: string) => string
  /** Las pestañas de la versión elegida · `TabEditor`. Va como `children`: B1
   *  es dueña del contexto, y el borrador es del contenedor, que lo guarda. */
  children?: React.ReactNode
}

export function ContextView({
  tenants,
  tenantActivo,
  onTenant,
  roles,
  rolActivo,
  onRol,
  versiones,
  versionActiva,
  onVersion,
  fecha,
  children,
}: Props) {
  const nombreDelRol = roles.find((r) => r.id === rolActivo)?.nombre ?? null

  return (
    <div className="flex flex-col gap-8 max-w-5xl">
      <header className="flex flex-col gap-2">
        <Label as="div">Contexto de edición</Label>
        {/* El literal del `.pen`. 26px en el dibujo; la escala no lo emite y
            `titulo-lg` es el más cercano · mismo criterio que la propuesta del
            2026-09-22 sobre los tamaños que la escala no tiene. */}
        <h1 className="font-display text-titulo-lg leading-titulo tracking-titulo font-medium text-ink m-0">
          ¿Sobre qué se va a componer?
        </h1>
        <Ayuda>
          El cliente define el catálogo de métricas. El rol define qué pestañas se ven y se editan.
        </Ayuda>
      </header>

      <section className="flex flex-col gap-3" aria-labelledby="builder-cliente">
        <Label id="builder-cliente" as="div">
          Cliente
        </Label>
        <select
          aria-labelledby="builder-cliente"
          className="self-start h-8 bg-w2 text-ink text-cuerpo font-medium rounded-md px-3 border border-w5 cursor-pointer"
          value={tenantActivo ?? ''}
          onChange={(e) => onTenant(e.target.value)}
        >
          {tenants.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre}
            </option>
          ))}
        </select>
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="builder-rol">
        <Label id="builder-rol" as="div">
          Rol
        </Label>
        {roles.length === 0 ? (
          // No es un error: es un cliente al que todavía no le definieron roles,
          // y la salida está en otra superficie.
          <Ayuda>Este cliente todavía no tiene roles. Se definen en su ficha, en administración.</Ayuda>
        ) : (
          <>
            <div className="flex flex-wrap gap-2" role="group" aria-labelledby="builder-rol">
              <Opcion elegida={rolActivo === null} onClick={() => onRol(null)}>
                Todos los roles
              </Opcion>
              {roles.map((r) => (
                <Opcion key={r.id} elegida={r.id === rolActivo} onClick={() => onRol(r.id)}>
                  {r.nombre}
                </Opcion>
              ))}
            </div>
            <Ayuda>
              {nombreDelRol === null
                ? 'Se muestran todas las pestañas. Elegí un rol para ver y editar sólo las que ese rol ve.'
                : `Se muestran las pestañas que ve ${nombreDelRol}. Las pestañas nuevas se crean para este rol.`}
            </Ayuda>
          </>
        )}
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="builder-version">
        <Label id="builder-version" as="div">
          Versión
        </Label>
        {versiones.length === 0 ? (
          // §8: el vacío invita a actuar. Y acá la salida es concreta.
          <Ayuda>Este cliente todavía no tiene versiones.</Ayuda>
        ) : (
          <ul className="flex flex-wrap gap-2 m-0 p-0 list-none">
            {versiones.map((v) => (
              <li key={v.id}>
                <Opcion elegida={v.id === versionActiva} onClick={() => onVersion(v.id)}>
                  {/* **El estado va primero y sin color.** §2: lo que distingue
                      un borrador de una versión publicada es la palabra. */}
                  <span>{`${ESTADO[v.estado]} ${v.versionId}`}</span>
                  <Label>
                    {/* Un borrador no tiene fecha de publicación, y poner la de
                        creación diría que se publicó cuando no. */}
                    {v.publicadoEn === null ? 'Sin publicar' : fecha(v.publicadoEn)}
                  </Label>
                </Opcion>
              </li>
            ))}
          </ul>
        )}
      </section>

      {children}
    </div>
  )
}
