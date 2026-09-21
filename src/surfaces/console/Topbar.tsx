/** El chrome de la consola · F1.7
 *
 *  **El alcance se declara en el chrome** · §8 de `parametros-front.md`. Con
 *  `alcance: plataforma` el navbar muestra el selector de tenant y dice que el
 *  acceso queda auditado; con `usuario`, el nombre del tenant y nada más — un
 *  usuario de cliente pertenece a uno y no elige, así que un selector con una
 *  sola opción sería una elección falsa.
 */
import { Label } from '../../render/primitives/Label'
import { Wordmark } from './Wordmark'
import { PeriodPicker } from './PeriodPicker'
import { Tabs } from './Tabs'
import { UserMenu } from './UserMenu'
import { ThemeToggle } from './ThemeToggle'
import type { Theme } from '../../tokens/theme'
import type { AppContext, Metric, Tab } from '../../api/types'

type Props = {
  context: AppContext
  activeTab: Tab | undefined
  activePeriodId: string | undefined
  /** Las métricas de la pestaña activa · el selector de período las necesita
   *  para saber qué granos puede ofrecer. */
  tabMetrics: readonly Metric[]
  onSelectTab: (id: string) => void
  onSelectPeriod: (id: string) => void
  onSelectTenant?: (id: string) => void
  onChangeTheme?: (theme: Theme) => void
}

export function Topbar({
  context,
  activeTab,
  activePeriodId,
  tabMetrics,
  onSelectTab,
  onSelectPeriod,
  onSelectTenant,
  onChangeTheme,
}: Props) {
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
        <Wordmark />

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

        {/* El `Spacer` del dibujo. */}
        <div className="flex-1" />

        {/* **El nombre abre un panel, y no es un rótulo.** `design.md` ya lo
            declaraba así —«abre un panel con nombre, correo, rol con su
            descripción y cliente»— y acá era texto suelto. Desde el
            2026-09-16 cuelga de ahí además la salida a las otras dos
            superficies, para el admin. */}
        <UserMenu context={context} />
        <ThemeToggle {...(onChangeTheme === undefined ? {} : { onChange: onChangeTheme })} />
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
