/** El chrome del builder · F4.6, rehecho el 2026-09-15 contra el `.pen`
 *
 *  **Dos cosas no son uniformes acá, y las dos salen de `pantallas.ts`.**
 *
 *  ── EL ANCHO ───────────────────────────────────────────────────────────────
 *
 *  §ANCLA:ANCHO-1 · principio 4: «Ancho mínimo por superficie: 1280 en
 *  administración, 1600 en el builder». La excepción de B5 a 1440 está abajo.
 *
 *  §4 da dos números con dos razones: **1600** en B1–B4 y B6 —1200 de lienzo 1:1
 *  más 300 de biblioteca, «a otra escala las unidades de arrastre mentirían»— y
 *  **1440 en B5**, que muestra la consola del cliente a su ancho real.
 *
 *  **La clase es estática y el número es dato.** Tailwind poda lo que su escáner
 *  no ve escrito, así que una utilidad armada por interpolación compilaría,
 *  dejaría el atributo `class` correcto en el DOM y **nunca llegaría al CSS**.
 *  Lo cubre `tests/tokens/escala.test.ts`.
 *
 *  ── EL CHROME ──────────────────────────────────────────────────────────────
 *
 *  **El contexto va en la cabecera y es persistente**, que es la corrección del
 *  2026-09-15: el `.pen` dibuja `TENANT · ROL · PESTAÑA` arriba en B2, B4 y B6, y
 *  la primera versión de este componente los tenía en barras dentro del cuerpo.
 *  Al salir de B1 se perdía de vista sobre qué se estaba componiendo, y «3
 *  cambios sin guardar» desaparecía al cambiar de pantalla — que es justo cuando
 *  hace falta.
 *
 *  **B1 no lo muestra** porque es donde se elige: enseñar el contexto ya resuelto
 *  en la pantalla que lo resuelve es decir dos veces lo mismo, y la segunda
 *  parece un control.
 *
 *  **Y B5 no lleva chrome ninguno**: «SIN CHROME DE EDICIÓN · DATOS REALES · ASÍ
 *  SE PUBLICA». Su única banda es volver a editar, y la pinta ella.
 */
import { IdentityBlock } from '../IdentityBlock'
import type { Theme } from '../../tokens/theme'
import { Label } from '../../render/primitives/Label'
import { Ayuda } from '../../render/primitives/Ayuda'
import { Accion } from '../../render/primitives/Accion'
import { Wordmark } from '../console/Wordmark'
import { PANTALLAS } from './pantallas'
import type { FormaDeChrome, PantallaId } from './pantallas'

/** **Predicados y no comparaciones sueltas, y la razón es de TypeScript.**
 *
 *  Este componente sostiene las CUATRO formas de chrome; hoy la tabla usa tres,
 *  porque B1 tomó prestada `composicion` hasta que F4.9 mueva la composición a
 *  B2. Comparando `pantalla.chrome` en línea, el análisis de flujo lo estrecha a
 *  las tres en uso y marca la rama de `identidad` como código muerto — cierto
 *  hoy, falso con F4.9, y en el medio la puerta en rojo.
 *
 *  Un parámetro tipado no se estrecha en el sitio de llamada, así que estas dos
 *  funciones dicen lo que el componente soporta y no lo que la tabla usa hoy. */
const sinChrome = (f: FormaDeChrome) => f === 'ninguno'
const conContexto = (f: FormaDeChrome) => f === 'composicion' || f === 'contexto'
/** **`contexto` se MIRA, no se toca** · la cuarta columna de la tabla de
 *  `pantallas.ts` decía «Contexto · volver a editar» desde el 2026-09-15 y este
 *  componente no la distinguía de `composicion`: las dos caían en el mismo bloque
 *  de acciones, así que B6 pintaba `VISTA PREVIA`, `PUBLICAR` y el contador de
 *  cambios sin guardar sobre una pantalla de sólo lectura.
 *
 *  **No se vio hasta el 2026-09-30 porque B6 no estaba montada**: la única
 *  pantalla con esta forma mostraba un aviso de «Pendiente», y un aviso no tiene
 *  nada que publicar. El `.pen` lo dibuja explícito —frame `Volver`, `gwJUk`:
 *  icono `pencil` más `VOLVER A EDITAR`, y ningún otro control a la derecha—. */
const soloContexto = (f: FormaDeChrome) => f === 'contexto'

/** Una entrada por ancho de `pantallas.ts`. Escritas, no interpoladas. */
const ANCHO: Readonly<Record<number, string>> = {
  1600: 'min-w-[1600px]',
  1440: 'min-w-[1440px]',
}

export type ContextoDeEdicion = {
  tenant: string | null
  rol: string | null
  pestana: string | null
  /** Cuántos cambios sin guardar. `0` = limpio. */
  cambios: number
}

/** **Guardar va acá aunque el `.pen` no dibuje el botón.**
 *
 *  El diseño muestra «3 CAMBIOS SIN GUARDAR» en la cabecera y, al lado, solo
 *  `VISTA PREVIA` y `PUBLICAR`. §7.2 sí exige el guardado explícito —«guardado
 *  explícito, con indicador de cambios sin guardar»—, así que el botón hace
 *  falta y el único lugar coherente es junto al indicador que lo motiva.
 *
 *  Va dicho porque es una desviación: si el diseño resolvió el guardado de otra
 *  forma que no llegó al `.pen`, esto es lo que hay que cambiar. */
const NOTA_GUARDAR = 'Guardar'

type Props = {
  activa: PantallaId
  onIr: (id: PantallaId) => void
  /** Volver a la consola · `undefined` no pinta el control. */
  /** Quién compone · el bloque de identidad de `B2`. Sin él no se pinta: el
   *  chrome no inventa un nombre. */
  identidad?: { rol: string; nombre: string } | undefined
  /** Salir a otra superficie · la navegación es del contenedor. */
  onSalir: (ruta: string) => void
  /** **El tema, que viaja hasta `IdentityBlock`** · 2026-10-02. Opcional por la
   *  misma razón que allá: sin manejador la sección no se pinta. */
  onChangeTheme?: (theme: Theme) => void

  contexto: ContextoDeEdicion
  /** `null` cuando no hay nada que publicar todavía · la razón la da la pantalla. */
  onPublicar: (() => void) | null
  /** `null` cuando no hay cambios, o cuando la versión no admite escritura. */
  onGuardar: (() => void) | null
  guardando: boolean
  /** **Validar vive al lado de guardar y publicar** · 2026-10-06. Estaba en el
   *  cuerpo, a media página, y publicar obligaba a ir y volver entre la cabecera
   *  y el medio de la pantalla para una sola intención · §2.4 de la auditoría.
   *  `null` cuando no corresponde validar: hay cambios sin guardar, o la versión
   *  ya está publicada. */
  onValidar?: (() => void) | null
  validando?: boolean
  /** Por qué no se puede publicar todavía, en una frase · `null` si se puede o
   *  si no corresponde decirlo. */
  porQueNoPublicar?: string | null
  children: React.ReactNode
}

export function BuilderChrome({
  activa,
  onIr,
  identidad,
  onSalir,
  onChangeTheme,
  contexto,
  onPublicar,
  onGuardar,
  guardando,
  onValidar = null,
  validando = false,
  porQueNoPublicar = null,
  children,
}: Props) {
  const pantalla = PANTALLAS.find((p) => p.id === activa) ?? PANTALLAS[0]
  const forma = pantalla.chrome

  return (
    <div className="min-h-screen bg-bg">
      {/* Sin colapso · §4: «no son grids y declaran ancho mínimo en vez de
          colapso». Abajo del mínimo hay scroll, que es visible. */}
      <div className={ANCHO[pantalla.ancho] ?? ANCHO[1600]}>
        {sinChrome(forma) ? null : (
          <header className="flex flex-col gap-4 px-6 pt-5 border-b border-w4">
            <div className="flex items-center justify-between gap-6">
              {/* **Era la palabra en `font-display`, y ésa es la invención que
                  el capítulo `Identidad` corrige**: el logotipo tiene su propia
                  tipografía, no la del producto. Ahora es el arte.

                  `marca` y no `mono`: decisión humana del 2026-10-06, escrita en
                  la §3 de `PROPUESTA-2026-09-22-divergencias-con-el-pen.md`. */}
              <div className="flex items-center gap-3">
                <Wordmark variante="marca" />
                <Label>Builder</Label>
              </div>

              {/* «Ancho 1600 · lienzo 1:1 a 1200 más 300 de biblioteca» vivía
                  acá, siempre a la vista. Es la regla de §4 para quien
                  implementa, no para quien compone · §3.4 de la auditoría del
                  2026-10-06. Sigue en `pantallas.ts`, que es donde sirve. */}
              {identidad !== undefined && (
                <IdentityBlock
                  rol={identidad.rol}
                  nombre={identidad.nombre}
                  desde="builder"
                  esAdmin
                  onIr={onSalir}
                  {...(onChangeTheme === undefined ? {} : { onChangeTheme })}
                />
              )}
            </div>

            {conContexto(forma) && (
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                {/* El contexto, **salvo en B1**: ahí son los controles del
                    cuerpo, y repetirlos arriba como texto con el mismo rótulo
                    hacía que uno pareciera un control y el otro no. La pestaña
                    tampoco va: en el canvas es el selector del cuerpo. */}
                {activa !== 'contexto' && (
                  <>
                    <div className="flex items-center gap-2">
                      <Label>Cliente</Label>
                      <span className="font-body text-cuerpo font-medium text-ink">{contexto.tenant ?? '—'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label>Rol</Label>
                      <span className="font-body text-cuerpo font-medium text-ink">{contexto.rol ?? 'Todos los roles'}</span>
                    </div>
                  </>
                )}

                {soloContexto(forma) ? (
                  /* **La única acción de B6, y es la del dibujo.** Una pantalla
                     que se mira no ofrece guardar ni publicar: lo que ofrece es
                     la vuelta a la que sí compone. El literal es del `.pen`. */
                  <div className="ml-auto">
                    <Accion onClick={() => onIr('contexto')}>Volver a editar</Accion>
                  </div>
                ) : (
                  <div className="ml-auto flex flex-wrap items-center gap-2">
                    {/* **El contador sigue al usuario** · §7.2: «guardado
                        explícito, con indicador de cambios sin guardar». */}
                    {contexto.cambios > 0 && (
                      <Ayuda as="span">
                        {contexto.cambios === 1
                          ? '1 pestaña con cambios sin guardar'
                          : `${String(contexto.cambios)} pestañas con cambios sin guardar`}
                      </Ayuda>
                    )}
                    {onGuardar !== null && (
                      <Accion onClick={onGuardar} deshabilitada={guardando}>
                        {guardando ? 'Guardando…' : NOTA_GUARDAR}
                      </Accion>
                    )}
                    {onValidar !== null && (
                      <Accion onClick={onValidar} deshabilitada={validando}>
                        {validando ? 'Validando…' : 'Validar'}
                      </Accion>
                    )}
                    <Accion onClick={() => onIr('preview')}>Vista previa</Accion>
                    {/* **Un CTA sin manejador no se pinta** · la misma regla que
                        `RecoBody`. En su lugar, en el registro de ayuda —antes
                        era un rótulo en el lugar exacto del botón, y se leía
                        como uno—, qué falta para poder publicar. */}
                    {onPublicar === null ? (
                      porQueNoPublicar === null ? null : <Ayuda as="span">{porQueNoPublicar}</Ayuda>
                    ) : (
                      <Accion variante="primaria" onClick={onPublicar}>
                        Publicar
                      </Accion>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* **Sólo las pantallas que se navegan** · D3. Las demás siguen
                declaradas en `pantallas.ts`. */}
            <nav className="flex gap-1 -mb-px" aria-label="Builder">
              {PANTALLAS.filter((p) => p.enNav).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onIr(p.id)}
                  aria-current={p.id === activa ? 'page' : undefined}
                  className={
                    'px-3 py-3 font-body text-cuerpo cursor-pointer border-b-2 ' +
                    (p.id === activa
                      ? 'border-acc text-ink font-semibold'
                      : 'border-transparent text-dim font-medium hover:text-ink')
                  }
                >
                  {p.nombre}
                </button>
              ))}
            </nav>
          </header>
        )}

        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
