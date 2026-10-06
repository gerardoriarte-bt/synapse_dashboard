/** Las pestañas de la versión elegida · F4.8 · reescrita el 2026-10-06
 *
 *  Cuelga de B1 como `children`. Hasta hoy listaba también los paneles de cada
 *  pestaña como chips que abrían el configurador **al fondo de la página**, dos
 *  alturas de scroll más abajo. La auditoría del 2026-10-06 lo levantó en §2.3, y
 *  con D1 y D2 el configurador se mudó al inspector del canvas: un panel se
 *  configura donde se lo ve. Acá queda lo que es de la pestaña.
 *
 *  **Cada pestaña dice quién la ve, y lo deja cambiar** · D5. Vacío es «todos
 *  los roles», que es lo que declara el cable.
 *
 *  **El CTA es el del `.pen`**: `COMPONER ECOMMERCE OVERVIEW`, relleno, el único
 *  primario de la tarjeta. Las demás acciones tienen caja y van en secundario, y
 *  la que borra va en `peligro` (D4).
 */
import { Label } from '../../render/primitives/Label'
import { Ayuda } from '../../render/primitives/Ayuda'
import { Accion } from '../../render/primitives/Accion'
import { Opcion } from '../../render/primitives/Opcion'
import { laVe } from './borrador'
import type { TabParaGuardar } from '../../api/admin'
import type { ProblemaLocal } from './validar'

type Props = {
  tabs: readonly TabParaGuardar[]
  roles: readonly { id: string; nombre: string }[]
  /** El filtro de B1 · `null` es «todos los roles». */
  rolActivo: string | null
  onEditar: (indice: number, campo: 'nombre' | 'pregunta', valor: string) => void
  onAgregar: () => void
  onQuitar: (indice: number) => void
  onMover: (indice: number, direccion: -1 | 1) => void
  onRoles: (indice: number, roles: string[]) => void
  onComponer: (indice: number) => void
  problemas: readonly ProblemaLocal[]
}

export function TabEditor({
  tabs,
  roles,
  rolActivo,
  onEditar,
  onAgregar,
  onQuitar,
  onMover,
  onRoles,
  onComponer,
  problemas,
}: Props) {
  // El índice del arreglo entero viaja con cada una: el filtro sólo decide qué
  // se pinta, y las funciones del borrador trabajan sobre todas.
  const visibles = tabs.map((t, i) => ({ t, i })).filter(({ t }) => laVe(t, rolActivo))
  const ocultas = tabs.length - visibles.length

  return (
    <section className="flex flex-col gap-4" aria-labelledby="builder-pestanas">
      <div className="flex items-baseline gap-3">
        <Label id="builder-pestanas" as="div">
          {`Pestañas · ${String(visibles.length)}`}
        </Label>
        {ocultas > 0 && (
          <Ayuda as="span">{`${String(ocultas)} más no las ve este rol.`}</Ayuda>
        )}
      </div>

      {visibles.length === 0 ? (
        <Ayuda>Este rol todavía no ve ninguna pestaña. Agregá una para empezar.</Ayuda>
      ) : (
        <ul className="flex flex-col gap-3 m-0 p-0 list-none">
          {visibles.map(({ t, i }) => {
            const fallas = problemas.filter((p) => p.tab === i)
            const nPaneles = t.panels.length
            return (
              <li
                key={t.id ?? `nueva-${String(i)}`}
                className="flex flex-col gap-4 rounded-xl border border-w4 bg-panel p-5"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-titulo leading-titulo tracking-titulo font-medium text-ink">
                    {t.nombre === '' ? 'Pestaña sin nombre' : t.nombre}
                  </span>
                  <Label>{`${String(nPaneles)} ${nPaneles === 1 ? 'panel' : 'paneles'}`}</Label>
                  {t.id === undefined && <Label>Nueva · se crea al guardar</Label>}
                  <div className="ml-auto flex items-center gap-2">
                    {/* Deshabilitado en el extremo, y la función que mueve además
                        se defiende: las dos mitades. */}
                    <Accion
                      tamano="compacta"
                      onClick={() => onMover(i, -1)}
                      deshabilitada={i === 0}
                      etiqueta={`Subir ${t.nombre}`}
                    >
                      Subir
                    </Accion>
                    <Accion
                      tamano="compacta"
                      onClick={() => onMover(i, 1)}
                      deshabilitada={i === tabs.length - 1}
                      etiqueta={`Bajar ${t.nombre}`}
                    >
                      Bajar
                    </Accion>
                    <Accion
                      tamano="compacta"
                      variante="peligro"
                      onClick={() => onQuitar(i)}
                      etiqueta={`Quitar ${t.nombre}`}
                    >
                      Quitar
                    </Accion>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <Label id={`tab-nombre-${String(i)}`} as="div">
                      Nombre
                    </Label>
                    <input
                      type="text"
                      aria-labelledby={`tab-nombre-${String(i)}`}
                      value={t.nombre}
                      onChange={(e) => onEditar(i, 'nombre', e.target.value)}
                      className="h-8 bg-w1 text-ink text-cuerpo rounded-md px-3 border border-w5"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label id={`tab-pregunta-${String(i)}`} as="div">
                      Pregunta operativa
                    </Label>
                    <input
                      type="text"
                      aria-labelledby={`tab-pregunta-${String(i)}`}
                      value={t.pregunta}
                      placeholder="¿Qué pregunta contesta esta pestaña?"
                      onChange={(e) => onEditar(i, 'pregunta', e.target.value)}
                      aria-invalid={t.pregunta.trim() === '' ? 'true' : undefined}
                      className="h-8 bg-w1 text-ink text-cuerpo rounded-md px-3 border border-w5"
                    />
                  </div>
                </div>

                {roles.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <Label id={`tab-roles-${String(i)}`} as="div">
                      La ven
                    </Label>
                    <div className="flex flex-wrap gap-2" role="group" aria-labelledby={`tab-roles-${String(i)}`}>
                      <Opcion
                        elegida={t.roles.length === 0}
                        onClick={() => onRoles(i, [])}
                        etiqueta={`${t.nombre} · la ven todos los roles`}
                      >
                        Todos los roles
                      </Opcion>
                      {roles.map((r) => {
                        const incluido = t.roles.includes(r.id)
                        return (
                          <Opcion
                            key={r.id}
                            elegida={incluido}
                            etiqueta={`${t.nombre} · la ve ${r.nombre}`}
                            onClick={() =>
                              onRoles(
                                i,
                                incluido ? t.roles.filter((x) => x !== r.id) : [...t.roles, r.id],
                              )
                            }
                          >
                            {r.nombre}
                          </Opcion>
                        )
                      })}
                    </div>
                  </div>
                )}

                {fallas.length > 0 && (
                  <ul className="flex flex-col gap-1 m-0 p-0 list-none">
                    {fallas.map((f) => (
                      <li key={`${String(f.panel)}-${f.campo}-${f.mensaje}`}>
                        <Ayuda as="span">
                          {f.panel === null ? f.mensaje : `Panel ${String(f.panel + 1)} · ${f.mensaje}`}
                        </Ayuda>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="flex items-center gap-3">
                  <Accion variante="primaria" onClick={() => onComponer(i)}>
                    {`Componer ${t.nombre}`}
                  </Accion>
                  <Ayuda as="span">Abre el lienzo con esta pestaña.</Ayuda>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <div>
        <Accion onClick={onAgregar}>Agregar pestaña</Accion>
      </div>
    </section>
  )
}
