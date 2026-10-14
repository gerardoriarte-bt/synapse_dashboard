/** B1 · Dashboards del cliente · el primer nivel del builder · 2026-10-07
 *
 *  §7.2: «Elegir **tenant y rol**. Muestra qué pestañas existen … Punto de
 *  entrada de todo el builder.»
 *
 *  ── POR QUÉ SE REORGANIZÓ ───────────────────────────────────────────────────
 *
 *  `docs/AUDITORIA-2026-10-07-flujo-de-edicion.md`. El builder estaba armado por
 *  VERSIONES —«Borrador v4», «Publicada v3»— y quien compone piensa en
 *  DASHBOARDS: la lista mezclaba los de todos los dashboards del cliente sin
 *  decir de cuál era cada una, no había cómo crear uno, y el lienzo era el
 *  segundo paso de una pantalla de formulario.
 *
 *  Decisión humana del mismo día (D1): «debe ser entendible el proceso
 *  Cliente → Dashboard → Editor», con la elección de rol y el guardado claros. Y
 *  sobre el rol (D3): «en el dashboard, pero de una manera más clara y
 *  progresiva». De ahí los tres pasos, que se van abriendo:
 *
 *    1 · Dashboard  →  2 · Rol  →  3 · Abrir el editor
 *
 *  El cliente se elige antes, en la cabecera · `SelectorDeCliente`.
 *
 *  **Las versiones salieron del camino principal.** El editor abre el borrador
 *  del dashboard, o crea uno a partir de lo publicado, y lo dice antes de
 *  apretar. Las versiones siguen en «Historial de versiones».
 *
 *  **La pregunta del `.pen` se conserva** —«¿Sobre qué se va a componer?»—: el
 *  dibujo de B1 es exactamente esta decisión. Lo que cambió es qué se elige.
 *
 *  **§PEN:B1** · B1 · «Selector de contexto».
 */
import { useState } from 'react'
import { Label } from '../../render/primitives/Label'
import { Ayuda } from '../../render/primitives/Ayuda'
import { Accion } from '../../render/primitives/Accion'
import { Opcion } from '../../render/primitives/Opcion'

export type DashboardEnLista = {
  id: string
  nombre: string
  porDefecto: boolean
  /** En palabras · «Publicado v3 · 10 sep 2026», «Borrador sin publicar»,
   *  «Todavía no se compuso» (literal de C6). */
  estado: string
}

type Props = {
  dashboards: readonly DashboardEnLista[]
  /** `true` mientras la lista no llegó: no se dice «no hay» antes de saberlo. */
  cargando: boolean
  elegido: string | null
  onElegir: (id: string) => void
  onCrear: (nombre: string) => void
  creando: boolean
  errorAlCrear: string | null

  roles: readonly { id: string; nombre: string }[]
  /** `null` es «todos los roles»: el filtro apagado. */
  rolActivo: string | null
  onRol: (id: string | null) => void

  /** Qué va a pasar al abrir, dicho antes de apretar. */
  queVaAPasar: string
  onAbrir: () => void
  abriendo: boolean
  errorAlAbrir: string | null
}

function Paso({ n, titulo, children }: { n: number; titulo: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3" aria-label={`Paso ${String(n)} · ${titulo}`}>
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="inline-flex size-6 items-center justify-center rounded-full border border-w5 font-body text-celda font-semibold text-ink"
        >
          {n}
        </span>
        <span className="font-display text-titulo leading-titulo tracking-titulo font-medium text-ink">
          {titulo}
        </span>
      </div>
      <div className="flex flex-col gap-3 pl-9">{children}</div>
    </section>
  )
}

export function ContextView({
  dashboards,
  cargando,
  elegido,
  onElegir,
  onCrear,
  creando,
  errorAlCrear,
  roles,
  rolActivo,
  onRol,
  queVaAPasar,
  onAbrir,
  abriendo,
  errorAlAbrir,
}: Props) {
  const [creandoNombre, setCreandoNombre] = useState<string | null>(null)
  const nombreDelRol = roles.find((r) => r.id === rolActivo)?.nombre ?? null
  const dashboard = dashboards.find((d) => d.id === elegido) ?? null

  const crear = () => {
    if (creandoNombre === null || creandoNombre.trim() === '') return
    onCrear(creandoNombre.trim())
    setCreandoNombre(null)
  }

  return (
    <div className="flex flex-col gap-8 max-w-5xl">
      <header className="flex flex-col gap-2">
        <Label as="div">Dashboards</Label>
        <h1 className="font-display text-titulo-lg leading-titulo tracking-titulo font-medium text-ink m-0">
          ¿Sobre qué se va a componer?
        </h1>
        <Ayuda>
          Elegí el dashboard del cliente de la cabecera, después para qué rol lo vas a editar, y abrí el
          editor.
        </Ayuda>
      </header>

      <Paso n={1} titulo="Dashboard">
        {cargando ? (
          <Ayuda>Trayendo los dashboards…</Ayuda>
        ) : dashboards.length === 0 ? (
          <Ayuda>Este cliente todavía no tiene dashboards. Creá el primero.</Ayuda>
        ) : (
          <ul className="grid grid-cols-2 gap-3 m-0 p-0 list-none">
            {dashboards.map((d) => (
              <li key={d.id}>
                <Opcion forma="fila" elegida={d.id === elegido} onClick={() => onElegir(d.id)}>
                  <span className="flex flex-col gap-1">
                    <span className="flex items-center gap-2">
                      <span className="font-display text-titulo leading-titulo tracking-titulo">{d.nombre}</span>
                      {d.porDefecto && <Label>Por defecto</Label>}
                    </span>
                    <Label>{d.estado}</Label>
                  </span>
                </Opcion>
              </li>
            ))}
          </ul>
        )}

        {creandoNombre === null ? (
          <div>
            <Accion onClick={() => setCreandoNombre('')} deshabilitada={creando}>
              {creando ? 'Creando…' : 'Nuevo dashboard'}
            </Accion>
          </div>
        ) : (
          <form
            className="flex flex-wrap items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              crear()
            }}
          >
            <input
              type="text"
              aria-label="Nombre del dashboard nuevo"
              // Se abrió para escribir · visto en pantalla el 2026-10-07: sin
              // foco, lo tipeado no iba a ningún lado.
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              placeholder="Nombre del dashboard"
              value={creandoNombre}
              onChange={(e) => setCreandoNombre(e.target.value)}
              className="h-8 w-72 bg-w1 text-ink text-cuerpo rounded-md px-3 border border-w5"
            />
            <Accion tipo="submit" variante="primaria" deshabilitada={creandoNombre.trim() === ''}>
              Crear dashboard
            </Accion>
            <Accion onClick={() => setCreandoNombre(null)}>Cancelar</Accion>
          </form>
        )}
        {errorAlCrear !== null && <Ayuda>{errorAlCrear}</Ayuda>}
      </Paso>

      {/* **Progresivo** · D3. El rol se pregunta recién con un dashboard
          elegido: antes no hay qué filtrar. */}
      {dashboard !== null && (
        <Paso n={2} titulo="Rol">
          {roles.length === 0 ? (
            <Ayuda>Este cliente todavía no tiene roles. Se definen en su ficha, en administración.</Ayuda>
          ) : (
            <>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Rol">
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
                  ? 'Vas a ver y editar todas las pestañas del dashboard.'
                  : `Vas a ver y editar sólo las pestañas que ve ${nombreDelRol}. Las que agregues, las va a ver ${nombreDelRol}.`}
              </Ayuda>
            </>
          )}
        </Paso>
      )}

      {dashboard !== null && (
        <Paso n={3} titulo="Editor">
          <Ayuda>{queVaAPasar}</Ayuda>
          <div>
            <Accion variante="primaria" onClick={onAbrir} deshabilitada={abriendo}>
              {abriendo ? 'Abriendo…' : `Abrir el editor de ${dashboard.nombre}`}
            </Accion>
          </div>
          {errorAlAbrir !== null && <Ayuda>{errorAlAbrir}</Ayuda>}
        </Paso>
      )}
    </div>
  )
}
