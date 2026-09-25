// GENERADO por tools/gen-tokens.py desde design/Synapse_v2.pen · NO EDITAR A MANO
//
// Espejo en TypeScript de `tokens.css`. Existe para que un token se pueda
// nombrar desde TS sin escribir la cadena suelta: la familia llega del catálogo
// y el plot construye `var(--color-fam-${familia}-1)`, así que el nombre del
// token es parte del contrato y no un detalle de CSS.

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

/** Los escalones que puede pedir un plot. El 1 es el trazo principal.
 *
 *  **No todas las familias tienen todos**: ver `FAMILY_STEPS`. */
export type FamilyStep = 0 | 1 | 2 | 3 | 4

/** Cuántos escalones tiene CADA familia, contados del `.pen`.
 *
 *  No son iguales, y darlo por sentado costaba un color que no se pinta: una
 *  `var(--color-fam-x-N)` que no existe no falla, se dibuja sin color. */
export const FAMILY_STEPS: Readonly<Record<string, number>> = {
  cliente: 5,
  demanda: 5,
  externo: 2,
  inventario: 5,
  medios: 5,
}

/** La custom property de un escalón de familia.
 *
 *  Es la ÚNICA forma en que un plot debería pedir color: recibe la familia del
 *  catálogo y no sabe cuál le tocó · regla dura 1 de design.md.
 *
 *  **El escalón se ajusta al largo de la familia**, que no es el mismo para
 *  todas. Sin esto, un plot que reparte cinco partes sobre una familia de dos
 *  pide dos variables inexistentes y las pinta sin color. */
export function familyVar(family: string, step: FamilyStep = 1): string {
  const largo = FAMILY_STEPS[family] ?? 1
  return `var(--color-fam-${family}-${step % largo})`
}
