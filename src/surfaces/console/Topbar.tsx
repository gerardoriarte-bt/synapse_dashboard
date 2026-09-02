/** El chrome de la consola · F1.7
 *
 *  **El alcance se declara en el chrome** · §8 de `parametros-front.md`. Con
 *  `alcance: plataforma` el navbar muestra el selector de tenant y dice que el
 *  acceso queda auditado; con `usuario`, el nombre del tenant y nada más — un
 *  usuario de cliente pertenece a uno y no elige, así que un selector con una
 *  sola opción sería una elección falsa.
 */
import { Label } from '../../render/primitives/Label'
import { PeriodPicker } from './PeriodPicker'
import { Tabs } from './Tabs'
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
    <header className="flex flex-col gap-4 mb-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1 min-w-0">
          {platform && tenants.length > 0 ? (
            <div className="flex flex-col gap-1">
              <Label>Tenant · el acceso queda auditado</Label>
              <div className="flex items-center gap-1">
                {tenants.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onSelectTenant?.(t.id)}
                    aria-current={t.id === context.tenant.id ? 'true' : undefined}
                    className={[
                      'font-mono text-[10px] tracking-[0.12em] uppercase rounded-md px-2 py-1',
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
            <Label>{context.tenant.etiqueta}</Label>
          )}

          {/* La pregunta operativa ES el título de la pantalla · §7.1. Una
              pestaña que no contesta una pregunta no se compone. */}
          <h1 className="font-display text-[20px] leading-tight text-ink m-0 truncate">
            {activeTab?.pregunta ?? ''}
          </h1>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Label>{context.user.nombre}</Label>
          <ThemeToggle {...(onChangeTheme === undefined ? {} : { onChange: onChangeTheme })} />
        </div>
      </div>

      <div className="flex items-end justify-between gap-4 flex-wrap">
        <Tabs tabs={context.tabs} activeId={activeTab?.id} onSelect={onSelectTab} />
        <PeriodPicker
          periods={context.periodos}
          activeId={activePeriodId}
          metrics={tabMetrics}
          onSelect={onSelectPeriod}
        />
      </div>
    </header>
  )
}
