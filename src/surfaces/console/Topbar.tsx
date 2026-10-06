/** El chrome de la consola · F1.7
 *
 *  **El alcance se declara en el chrome** · §8 de `parametros-front.md`. Con
 *  `alcance: plataforma` el navbar muestra el selector de tenant y dice que el
 *  acceso queda auditado; con `usuario`, el nombre del tenant y nada más — un
 *  usuario de cliente pertenece a uno y no elige, así que un selector con una
 *  sola opción sería una elección falsa.
 */
import { useRef, useState } from 'react'
import { DashboardPanel } from './DashboardPanel'
import { Label } from '../../render/primitives/Label'
import { Wordmark } from './Wordmark'
import { PeriodPicker } from './PeriodPicker'
import { Tabs } from './Tabs'
import { UserMenu } from './UserMenu'
import type { Formatter } from '../../render/format'
import type { Theme } from '../../tokens/theme'
import type { AppContext, Metric, Tab } from '../../api/types'

type Props = {
  context: AppContext
  activeTab: Tab | undefined
  activePeriodId: string | undefined
  /** **Por qué se muestra un período que nadie eligió** · 2026-10-01 · baja
   *  hasta `PeriodPicker`. Lo redacta el contenedor porque es el único que ve la
   *  sustitución; acá sólo viaja. */
  avisoDePeriodo?: string | undefined
  /** Las métricas de la pestaña activa · el selector de período las necesita
   *  para saber qué granos puede ofrecer. */
  tabMetrics: readonly Metric[]
  /** Del locale del tenant · baja hasta el selector de período, que redacta el
   *  rango. Es el único lugar del sistema que sabe en qué idioma se formatea. */
  format: Formatter
  onSelectTab: (id: string) => void
  onSelectPeriod: (id: string) => void
  onSelectTenant?: (id: string) => void
  onChangeTheme?: (theme: Theme) => void
  /** Abre el chat con contexto de PESTAÑA · F3.15. **Sin él no hay botón.** */
  onAskTab?: (() => void) | undefined
  /** Cambiar de dashboard · F5.1. **Sin él no hay selector**, aunque haya
   *  varios: el builder monta esta consola sin poder cambiar de contexto. */
  onSelectDashboard?: ((id: string) => void) | undefined
}

export function Topbar({
  context,
  activeTab,
  activePeriodId,
  avisoDePeriodo,
  tabMetrics,
  format,
  onSelectTab,
  onSelectPeriod,
  onSelectTenant,
  onChangeTheme,
  onAskTab,
  onSelectDashboard,
}: Props) {
  const [panel, setPanel] = useState(false)
  const chevron = useRef<HTMLButtonElement>(null)
  const dashboardActivo =
    context.dashboards.find((d) => d.id === context.dashboardActivoId)?.nombre ?? 'Dashboard'

  const platform = context.alcance === 'plataforma'
  const tenants = context.tenantsDisponibles ?? []

  return (
    <header className="flex flex-col">
      {/* ── NAVBAR · 60px · §PEN:C1 ────────────────────────────────────────
          **Es una BANDA propia, con su fondo y su borde**: `$dock` y `$w2`.
          El dibujo la separa del título con eso, no con aire — y sin banda, la
          identidad de la plataforma y el título de la pantalla se leían como
          una sola cosa.

          **El tema y el usuario viven ACÁ, no al lado del título.** Son de la
          plataforma: no cambian con la pestaña ni con el período. Al lado del
          título parecían parte de la pantalla. */}
      <div className="flex h-15 items-center gap-3 border-b border-w2 bg-dock px-6">
        <Wordmark variante="marca" />

        {/* El divisor del dibujo: la marca es de la plataforma y el cliente es
            de quien mira. Son dos cosas y se ven como dos. */}
        <span aria-hidden className="h-4 w-px shrink-0 bg-w3" />

        {platform && tenants.length > 0 ? (
          <div className="flex min-w-0 items-center gap-2">
            <Label as="span">Tenant · el acceso queda auditado</Label>
            <div className="flex items-center gap-1">
              {tenants.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onSelectTenant?.(t.id)}
                  aria-current={t.id === context.tenant.id ? 'true' : undefined}
                  className={[
                    'font-mono text-label tracking-rotulo uppercase rounded-md px-2 py-1',
                    'cursor-pointer bg-transparent border-0',
                    t.id === context.tenant.id ? 'text-acc' : 'text-dim hover:text-ink',
                  ].join(' ')}
                >
                  {t.etiqueta}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <Label as="span">{context.tenant.etiqueta}</Label>
        )}

        {/* ── SELECTOR DE DASHBOARD · §PEN:C6 ──────────────────────────────
            **Era un `<select>` en el navbar hasta el 2026-09-28**, puesto por
            F5.1 con la pregunta de dónde iba abierta como propuesta de spec.
            C6 la contestó: **no va en el navbar**, porque «de ocho elementos a
            768 no entra». Lo abre el chevron del bloque de cliente, que ya
            estaba dibujado, **y por eso el navbar no crece**.

            **Sólo con más de uno**, que no cambió: «no se ofrece una elección
            que no existe». */}
        {context.dashboards.length > 1 && onSelectDashboard !== undefined && (
          <div className="relative flex min-w-0 items-center">
            <button
              ref={chevron}
              type="button"
              onClick={() => setPanel((v) => !v)}
              aria-expanded={panel}
              aria-label="Cambiar de dashboard"
              className="flex cursor-pointer items-center gap-1 rounded-sm border-0 bg-transparent px-1 py-1 text-dim hover:bg-elev"
            >
              <span className="text-celda text-ink">{dashboardActivo}</span>
              {/* `chevrons-up-down` de 13 en `$dim` · el que el `.pen` dibuja
                  sobre el bloque de cliente. */}
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="m7 15 5 5 5-5" />
                <path d="m7 9 5-5 5 5" />
              </svg>
            </button>
            {panel && (
              <DashboardPanel
                context={context}
                pestanasActivas={context.tabs.length}
                disparador={chevron}
                onSelect={(id) => {
                  setPanel(false)
                  onSelectDashboard(id)
                }}
                onCerrar={() => setPanel(false)}
              />
            )}
          </div>
        )}

        {/* El `Spacer` del dibujo. */}
        <div className="flex-1" />

        {/* **El nombre abre un panel, y no es un rótulo.** `design.md` ya lo
            declaraba así —«abre un panel con nombre, correo, rol con su
            descripción y cliente»— y acá era texto suelto. Desde el
            2026-09-16 cuelga de ahí además la salida a las otras dos
            superficies, para el admin. */}
        {/* ── CTA SYNAPSE · §PEN:C1 · F3.15 ────────────────────────────
            Del frame: alto 32, fondo `$acc`, radio `$r-lg`, gap 8, padding
            lateral 14, `sparkles` de 14 en `$on-acc` y el texto mono 10 **w500**
            —el único de la barra que no es `normal`—.

            **Va justo antes del usuario**, que es donde el dibujo lo pone:
            `… Notificaciones · CTA Synapse · Usuario`. Nuestro navbar no tiene
            notificaciones y pone el tema después del usuario, que es una
            divergencia anterior a esto y no se toca acá.

            **Sin manejador no se pinta** · regla del CTA muerto: el builder
            monta esta misma consola sin chat. */}
        {onAskTab !== undefined && (
          <button
            type="button"
            onClick={onAskTab}
            // **El literal visible es del frame —`PREGUNTAR`— y el nombre
            //   accesible dice el ALCANCE.** En la misma pantalla hay tres
            //   botones que dicen «Preguntar»: éste, el de cada panel y el de
            //   enviar dentro de la hoja. Los dos últimos tienen contexto
            //   —el panel los agrupa bajo su `aria-label`, la hoja es un
            //   diálogo—; éste queda suelto en la barra.
            aria-label="Preguntar sobre esta pestaña"
            className="flex h-8 shrink-0 cursor-pointer items-center gap-2 rounded-lg border-0 bg-acc px-3.5 font-mono text-label leading-rotulo tracking-rotulo uppercase text-on-acc"
          >
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-3.5 shrink-0"
            >
              <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
            </svg>
            Preguntar
          </button>
        )}
        {/* **El tema se fue adentro del panel de usuario** · 2026-09-28,
            §PEN «Console/Panel de usuario». Estaba suelto acá al lado y el
            dibujo lo pone entre la identidad y las salidas: es una preferencia
            de la persona, igual que su rol y las superficies a las que entra.
            Y de paso el navbar baja de ocho elementos a siete. */}
        <UserMenu
          context={context}
          {...(onChangeTheme === undefined ? {} : { onChangeTheme })}
        />
      </div>

      {/* ── HEADER · 96px · §PEN:C1 ────────────────────────────────────────
          El bloque del título, con su propio aire. El dibujo le da 96 de alto
          y acá se consigue con el padding: una altura fija recortaría una
          pregunta operativa larga. */}
      <div className="flex items-end justify-between gap-4 px-6 pt-6 pb-4">
        {/* La pregunta operativa ES el título de la pantalla · §7.1. Una
            pestaña que no contesta una pregunta no se compone. */}
        <h1 className="font-display text-titulo-lg tracking-titulo leading-titulo text-ink m-0 min-w-0 truncate">
          {activeTab?.pregunta ?? ''}
        </h1>

        <PeriodPicker
          periods={context.periodos}
          activeId={activePeriodId}
          metrics={tabMetrics}
          format={format}
          {...(avisoDePeriodo === undefined ? {} : { aviso: avisoDePeriodo })}
          onSelect={onSelectPeriod}
        />
      </div>

      {/* ── CHAPTER TABS + REGLA · §PEN:C1 ─────────────────────────────────
          **La regla de 1px es lo que separa la cabecera del contenido**, y es
          del dibujo: `Chapter Tabs` y después un frame `Regla` de alto 1 en
          `$w2`. Sin ella los paneles arrancaban pegados a las pestañas. */}
      <div className="flex items-end gap-4 border-b border-w2 px-6 pb-2">
        <Tabs tabs={context.tabs} activeId={activeTab?.id} onSelect={onSelectTab} />
      </div>
    </header>
  )
}
