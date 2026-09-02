/** Sin datos · F1.13d
 *
 *  **Invitación a actuar, no un error.** Dice qué falta y cómo conseguirlo.
 */
import { Icon } from './Icon'
import { StateBody } from './StateBody'
import type { BaseProps } from './StateBody'

export function EmptyState({ phrase, detail, exit }: Omit<BaseProps, 'mark' | 'name'>) {
  return (
    <StateBody
      name="Sin datos"
      mark={
        <Icon>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 13h5l1 2h6l1-2h5" />
        </Icon>
      }
      phrase={phrase}
      {...(detail === undefined ? {} : { detail })}
      {...(exit === undefined ? {} : { exit })}
    />
  )
}
