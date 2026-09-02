/** De familia a color · F1.13a
 *
 *  Aparte de las marcas porque no es un componente: un archivo que exporta
 *  componentes y funciones rompe el fast refresh de Vite.
 */
import { familyVar } from '../../../tokens/tokens'

export type SeriesColor = { family: string; step?: 0 | 1 | 2 | 3 | 4 }

export const hue = ({ family, step = 1 }: SeriesColor) => familyVar(family, step)
