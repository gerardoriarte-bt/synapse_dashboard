/** Los ajustes de una pestaña, en el inspector del editor · 2026-10-07
 *
 *  Vivían en «Contexto de edición» como una tarjeta por pestaña —`TabEditor`—,
 *  lejos del lienzo donde la pestaña se compone. La auditoría del flujo de
 *  edición (`docs/AUDITORIA-2026-10-07-flujo-de-edicion.md` §2.2) los mudó acá:
 *  una pestaña se ajusta igual que un panel, al costado de lo que se ve.
 *
 *  **Quién la ve** sigue siendo de la pestaña · D5 de la auditoría del
 *  2026-10-06. Vacío es «todos los roles», que es lo que declara el cable.
 */
import { Label } from '../../render/primitives/Label'
import { Ayuda } from '../../render/primitives/Ayuda'
import { Accion } from '../../render/primitives/Accion'
import { Opcion } from '../../render/primitives/Opcion'
import type { TabParaGuardar } from '../../api/admin'

type Props = {
  tab: TabParaGuardar
  indice: number
  total: number
  roles: readonly { id: string; nombre: string }[]
  /** Los problemas de la pestaña, ya redactados. */
  problemas: readonly string[]
  onEditar: (campo: 'nombre' | 'pregunta', valor: string) => void
  onRoles: (roles: string[]) => void
  onMover: (direccion: -1 | 1) => void
  onQuitar: () => void
}

const CAMPO = 'h-8 bg-w1 text-ink text-cuerpo rounded-md px-3 border border-w5'

export function TabInspector({ tab, indice, total, roles, problemas, onEditar, onRoles, onMover, onQuitar }: Props) {
  const n = tab.panels.length
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <Label as="div">Pestaña</Label>
          {tab.id === undefined && <Label as="div">Nueva · se crea al guardar</Label>}
          <div className="ml-auto">
            <Accion variante="peligro" tamano="compacta" onClick={onQuitar} etiqueta={`Quitar ${tab.nombre}`}>
              Quitar pestaña
            </Accion>
          </div>
        </div>
        <span className="font-display text-titulo leading-titulo tracking-titulo font-medium text-ink">
          {tab.nombre === '' ? 'Pestaña sin nombre' : tab.nombre}
        </span>
        <Ayuda>{`${String(n)} ${n === 1 ? 'panel' : 'paneles'}.`}</Ayuda>
      </div>

      <section className="flex flex-col gap-1">
        <Label id="tab-nombre" as="div">
          Nombre
        </Label>
        <input
          type="text"
          aria-labelledby="tab-nombre"
          value={tab.nombre}
          onChange={(e) => onEditar('nombre', e.target.value)}
          className={CAMPO}
        />
      </section>

      <section className="flex flex-col gap-1">
        <Label id="tab-pregunta" as="div">
          Pregunta operativa
        </Label>
        <input
          type="text"
          aria-labelledby="tab-pregunta"
          value={tab.pregunta}
          placeholder="¿Qué pregunta contesta esta pestaña?"
          onChange={(e) => onEditar('pregunta', e.target.value)}
          aria-invalid={tab.pregunta.trim() === '' ? 'true' : undefined}
          className={CAMPO}
        />
        {problemas.map((p) => (
          <Ayuda key={p}>{p}</Ayuda>
        ))}
      </section>

      {roles.length > 0 && (
        <section className="flex flex-col gap-2">
          <Label id="tab-roles" as="div">
            La ven
          </Label>
          <div className="flex flex-wrap gap-2" role="group" aria-labelledby="tab-roles">
            <Opcion elegida={tab.roles.length === 0} onClick={() => onRoles([])} etiqueta={`${tab.nombre} · la ven todos los roles`}>
              Todos los roles
            </Opcion>
            {roles.map((r) => {
              const incluido = tab.roles.includes(r.id)
              return (
                <Opcion
                  key={r.id}
                  elegida={incluido}
                  etiqueta={`${tab.nombre} · la ve ${r.nombre}`}
                  onClick={() => onRoles(incluido ? tab.roles.filter((x) => x !== r.id) : [...tab.roles, r.id])}
                >
                  {r.nombre}
                </Opcion>
              )
            })}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-2">
        <Label as="div">Posición</Label>
        <div className="flex gap-2">
          <Accion tamano="compacta" onClick={() => onMover(-1)} deshabilitada={indice === 0} etiqueta={`Mover ${tab.nombre} a la izquierda`}>
            Mover a la izquierda
          </Accion>
          <Accion tamano="compacta" onClick={() => onMover(1)} deshabilitada={indice === total - 1} etiqueta={`Mover ${tab.nombre} a la derecha`}>
            Mover a la derecha
          </Accion>
        </div>
      </section>
    </div>
  )
}
