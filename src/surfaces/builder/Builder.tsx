/** B · Builder · composición visual · F4.6
 *
 *  El contenedor. §4 separa contenedor de presentacional, así que acá van los
 *  hooks y en `BuilderChrome` no hay ninguno.
 *
 *  **Las seis pantallas de §7.2 están declaradas; cinco todavía no se pueden
 *  construir**, y cada una dice qué la desbloquea en vez de mostrarse vacía. Lo
 *  que las frena no es lo mismo en todas, y esa distinción es la que importa:
 *
 *  | | Qué falta | De qué orden |
 *  |---|---|---|
 *  | B2 · Canvas | La interacción de arrastre no está especificada en `design.md` | **Diseño**, no cable |
 *  | B3 · Selector de gráfico | `/config/plots` · B1.21 · es F4.21 | Cable |
 *  | B4 · Binder de métrica | Nada: es F4.10 y se puede tomar | Orden del plan |
 *  | B5 · Vista previa por rol | Roles por tenant · B4.9, que escribimos nosotros | Cable |
 *  | B6 · Historial | El cable no dice **quién** publicó ni **qué cambió** | Cable |
 *
 *  **B1 · Contexto de edición es F4.7** y va aparte.
 *
 *  Una pantalla que se declara pendiente no es lo mismo que una que no está: la
 *  primera dice qué la desbloquea, que es lo que §8 pide de cualquier estado.
 */
import { useState } from 'react'
import { BuilderChrome } from './BuilderChrome'
import { Label } from '../../render/primitives/Label'
import type { PantallaId } from './pantallas'

/** Qué espera cada pantalla. Acá y no en un comentario: la pantalla lo pinta, así
 *  que quien la abre se entera sin leer el código. */
const PENDIENTES: Partial<Record<PantallaId, { razon: string; desbloqueaCon: string }>> = {
  contexto: {
    razon: 'El selector de tenant, rol y plantilla base todavía no se construyó.',
    desbloqueaCon: 'F4.7 · selector de tenant y plantilla base',
  },
  canvas: {
    razon:
      'design.md describe el resultado del arrastre —slot vacío, badge HEREDADO, colisión marcada— y no la interacción: qué agarra el cursor, cómo se redimensiona, qué pasa al soltar fuera de la grilla.',
    desbloqueaCon: 'Una decisión de diseño · F4.9 no se toma sin ella',
  },
  grafico: {
    razon:
      'La biblioteca lista los gráficos por grupo y esa lista la sirve /config/plots, que no existe.',
    desbloqueaCon: 'B1.21 · la ruta /config/plots · después F4.21',
  },
  metrica: {
    razon: 'El catálogo y la tabla de bloques ya están; falta construir la pantalla.',
    desbloqueaCon: 'F4.10 · configurador de panel',
  },
  preview: {
    razon: 'Renderiza como lo verá un ROL, y no hay de dónde leer los roles del tenant.',
    desbloqueaCon: 'B4.9 · preview por rol, que escribimos nosotros en un fork',
  },
  historial: {
    razon:
      '§7.2 pide quién, cuándo y qué cambió. LayoutVersion trae cuándo y nada más: ni autor ni diferencia contra la versión anterior, y tampoco hay ruta para revertir.',
    desbloqueaCon: 'B4.10 · autor, diferencia y reversión en LayoutVersion',
  },
}

export function Builder() {
  const [pantalla, setPantalla] = useState<PantallaId>('contexto')
  const pendiente = PENDIENTES[pantalla]

  return (
    <BuilderChrome activa={pantalla} onIr={setPantalla}>
      {pendiente === undefined ? null : (
        <div className="flex flex-col gap-2">
          <Label as="div">Pendiente</Label>
          <Label as="div">{pendiente.razon}</Label>
          <Label as="div">Se desbloquea con · {pendiente.desbloqueaCon}</Label>
        </div>
      )}
    </BuilderChrome>
  )
}
