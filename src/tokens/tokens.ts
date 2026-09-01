// PORTADO A MANO desde v2 · espejo en TypeScript de `tokens.css`.
//
// Existe para que un token se pueda nombrar desde TS sin escribir la cadena
// suelta: la familia llega del catálogo y el plot construye
// `var(--color-fam-${familia}-1)`, así que el nombre del token es parte del
// contrato y no un detalle de CSS.
//
// PENDIENTE · igual que `tokens.css`, todavía no se genera. Ver la cabecera de
// ese archivo.

/** Color de superficie, texto o borde. Invierte con el tema. */
export type TokenColor =
  | 'bg'
  | 'panel'
  | 'elev'
  | 'dock'
  | 'ink'
  | 'dim'
  | 'on-acc'
  | 'acc'
  | 'acc-hover'
  | 'w1'
  | 'w2'
  | 'w3'
  | 'w4'
  | 'w5'
  | 'w6'
  | 'shad'
  | 'c-grid'

/** Los cinco escalones de una familia. El 1 es el trazo principal. */
export type FamilyStep = 0 | 1 | 2 | 3 | 4

/** La custom property de un escalón de familia.
 *
 *  Es la ÚNICA forma en que un plot debería pedir color: recibe la familia del
 *  catálogo y no sabe cuál le tocó · regla dura 1 de design.md. */
export function familyVar(family: string, step: FamilyStep = 1): string {
  return `var(--color-fam-${family}-${step})`
}
