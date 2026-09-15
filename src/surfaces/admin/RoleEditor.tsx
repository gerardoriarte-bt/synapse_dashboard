/** A2 · roles del cliente · F4.3
 *
 *  §7.3: «Datos del tenant, **roles definidos con su descripción, pestañas por
 *  rol**, estado del acceso a datos y subprocesadores. **Es donde el super-admin
 *  define el criterio de acceso por rol.**»
 *
 *  ── LOS DOS CAMPOS QUE HAY QUE DECIR BIEN O NO DECIR ────────────────────────
 *
 *  **`pestañas` vacío significa «ve TODAS», no «no ve ninguna».** Es la
 *  diferencia entre un rol recién creado —que ve todo hasta que alguien lo
 *  acote— y un rol tapiado. Pintar «0 pestañas» diría lo segundo.
 *
 *  **`métricas ocultas` OCULTA y no IMPIDE.** §1.4.20: el servidor vuelve a
 *  verificar en `/config/catalog` y en el batch, así que un rol que oculta una
 *  métrica **no es un rol que no pueda pedirla**. Quien compone tiene que saberlo
 *  o va a usar este campo como si fuera un permiso — que es la clase de error que
 *  se descubre en una auditoría y no antes.
 *
 *  ── BORRAR ─────────────────────────────────────────────────────────────────
 *
 *  Un rol con usuarios asignados **no se puede borrar**, y el listado trae
 *  `usuarios` justamente para decirlo **antes** de ofrecer el botón. Un botón que
 *  se aprieta y devuelve 409 es peor que uno ausente — la misma regla que
 *  `puedeResponder` en `RecoBody`.
 *
 *  ── LO QUE ESTA PANTALLA NO PUEDE SER TODAVÍA ───────────────────────────────
 *
 *  §7.3 le pide a A2 cuatro cosas más —datos del tenant, estado del acceso a
 *  datos, última verificación y subprocesadores— y ninguna llega por el cable.
 *  Se declaran.
 */
import { useState } from 'react'
import { Label } from '../../render/primitives/Label'
import type { Rol, RolParaGuardar } from '../../api/admin'
import type { Metric, Tab } from '../../api/types'

const FALTANTES = [
  'Datos del cliente · GET /admin/tenants devuelve id y nombre · B4.1',
  'Estado del acceso a datos y su última verificación · ninguna ruta lo expone',
  'Subprocesadores · es obligación legal declararlos y no hay de dónde leerlos',
] as const

type Props = {
  roles: readonly Rol[]
  /** Para nombrar una pestaña en vez de pintar su UUID. */
  pestanas: readonly Pick<Tab, 'id' | 'nombre'>[]
  /** Para nombrar una métrica oculta. Sin filtrar por rol · es el inventario. */
  metricas: readonly Pick<Metric, 'id' | 'nombre'>[]
  onGuardar: (id: string | undefined, rol: RolParaGuardar) => void
  onBorrar: (id: string) => void
  guardando: boolean
  error: string | null
}

export function RoleEditor({
  roles,
  pestanas,
  metricas,
  onGuardar,
  onBorrar,
  guardando,
  error,
}: Props) {
  const [editando, setEditando] = useState<string | null>(null)
  const [nombre, setNombre] = useState('')
  const [elegidas, setElegidas] = useState<string[]>([])
  const [ocultas, setOcultas] = useState<string[]>([])

  const abrir = (r: Rol | null) => {
    setEditando(r?.id ?? '')
    setNombre(r?.nombre ?? '')
    setElegidas(r === null ? [] : [...r.pestanas])
    setOcultas(r === null ? [] : [...r.metricasOcultas])
  }

  const alternar = (lista: string[], set: (v: string[]) => void, id: string) => {
    set(lista.includes(id) ? lista.filter((x) => x !== id) : [...lista, id])
  }

  const nombreDePestana = (id: string) => pestanas.find((t) => t.id === id)?.nombre ?? id
  const nombreDeMetrica = (id: string) => metricas.find((m) => m.id === id)?.nombre ?? id

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Label as="div">{`${String(roles.length)} rol(es)`}</Label>
        <button
          type="button"
          onClick={() => abrir(null)}
          className="font-mono text-label tracking-rotulo uppercase rounded-md px-3 py-1 cursor-pointer border border-w4 bg-transparent text-ink hover:bg-w2"
        >
          Nuevo rol
        </button>
      </div>

      {roles.length === 0 && (
        <Label as="div">Este cliente no tiene roles definidos todavía</Label>
      )}

      <ul className="flex flex-col gap-2 m-0 p-0 list-none">
        {roles.map((r) => (
          <li key={r.id} className="flex flex-col gap-2 rounded-sm bg-w2 p-3">
            <div className="flex items-center gap-3">
              <span className="text-ink text-celda">{r.nombre}</span>
              {/* **El conteo antes del botón.** Con uno o más, borrar da 409. */}
              <Label>{r.usuarios === 0 ? 'sin usuarios' : `${String(r.usuarios)} usuario(s)`}</Label>
              <button
                type="button"
                onClick={() => abrir(r)}
                className="text-label tracking-rotulo uppercase px-2 py-1 rounded-sm text-dim hover:bg-w3 ml-auto"
              >
                Editar
              </button>
              {r.usuarios === 0 ? (
                <button
                  type="button"
                  onClick={() => onBorrar(r.id)}
                  aria-label={`Borrar ${r.nombre}`}
                  className="text-label tracking-rotulo uppercase px-2 py-1 rounded-sm text-acc hover:bg-w3"
                >
                  Borrar
                </button>
              ) : (
                // **Ausente, no deshabilitado con silencio.** Se dice qué lo
                // impide y qué desbloquea: reasignar a los usuarios.
                <Label>No se borra con usuarios asignados · reasignalos primero</Label>
              )}
            </div>

            <Label as="div">
              {r.pestanas.length === 0
                ? // La mitad del dato, y la que se lee al revés si falta.
                  'Ve TODAS las pestañas · vacío no es «ninguna»'
                : `Pestañas · ${r.pestanas.map(nombreDePestana).join(' · ')}`}
            </Label>

            {r.metricasOcultas.length > 0 && (
              <Label as="div">
                {`Oculta ${String(r.metricasOcultas.length)} métrica(s) · ${r.metricasOcultas
                  .map(nombreDeMetrica)
                  .join(' · ')}`}
              </Label>
            )}
          </li>
        ))}
      </ul>

      {/* **La advertencia va una vez y siempre, no por rol.** Es una propiedad
          del campo, no de un rol en particular, y repetirla por fila la vuelve
          decoración. */}
      <Label as="div">
        Ocultar una métrica NO es un permiso · el servidor la vuelve a verificar en el
        catálogo y en el batch
      </Label>

      {editando !== null && (
        <form
          className="flex flex-col gap-3 rounded-sm bg-w2 p-3"
          onSubmit={(e) => {
            e.preventDefault()
            onGuardar(editando === '' ? undefined : editando, {
              nombre,
              pestanas: elegidas,
              metricasOcultas: ocultas,
            })
          }}
        >
          <Label as="div">{editando === '' ? 'Nuevo rol' : 'Editando rol'}</Label>

          <label className="flex flex-col gap-1">
            <Label as="div">Nombre</Label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="bg-w1 text-ink text-celda rounded-sm px-2 py-1 border border-w4"
            />
          </label>

          <fieldset className="flex flex-col gap-1 border border-w4 rounded-sm p-2">
            <legend>
              <Label>Pestañas · ninguna marcada = ve todas</Label>
            </legend>
            {pestanas.length === 0 ? (
              <Label as="div">Este cliente no tiene pestañas publicadas</Label>
            ) : (
              pestanas.map((t) => (
                <label key={t.id} className="flex items-center gap-2 text-ink text-celda">
                  <input
                    type="checkbox"
                    checked={elegidas.includes(t.id)}
                    onChange={() => alternar(elegidas, setElegidas, t.id)}
                  />
                  {t.nombre}
                </label>
              ))
            )}
          </fieldset>

          <fieldset className="flex flex-col gap-1 border border-w4 rounded-sm p-2">
            <legend>
              <Label>Métricas ocultas · oculta, no impide</Label>
            </legend>
            {metricas.map((m) => (
              <label key={m.id} className="flex items-center gap-2 text-ink text-celda">
                <input
                  type="checkbox"
                  checked={ocultas.includes(m.id)}
                  onChange={() => alternar(ocultas, setOcultas, m.id)}
                />
                {m.nombre}
              </label>
            ))}
          </fieldset>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={nombre.trim() === '' || guardando}
              className="font-mono text-label tracking-rotulo uppercase rounded-md px-4 py-2 cursor-pointer border border-w4 bg-transparent text-ink hover:bg-w3 disabled:opacity-40"
            >
              {guardando ? 'Guardando…' : 'Guardar rol'}
            </button>
            <button
              type="button"
              onClick={() => setEditando(null)}
              className="text-label tracking-rotulo uppercase px-2 py-1 rounded-sm text-dim hover:bg-w3"
            >
              Cancelar
            </button>
            {nombre.trim() === '' && <Label>Un rol sin nombre no se puede guardar</Label>}
          </div>
        </form>
      )}

      {error !== null && <Label as="div">{error}</Label>}

      <div className="flex flex-col gap-1 rounded-sm bg-w2 p-3">
        <Label as="div">{`Faltan ${String(FALTANTES.length)} cosas que §7.3 pide de esta ficha`}</Label>
        {FALTANTES.map((f) => (
          <Label key={f} as="div">
            {f}
          </Label>
        ))}
        <Label as="div">
          Y la lista de usuarios de A3 · ninguna ruta los lista · solo existe POST /admin/users
        </Label>
      </div>
    </div>
  )
}
