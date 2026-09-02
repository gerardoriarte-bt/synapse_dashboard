/** Formato de cifras, en un solo lugar · F1.13b.
 *
 *  **El locale se inyecta, no se importa.** En v2 esto era `const LOCALE =
 *  'es-MX'` y cinco de los seis plots importaban el formateador directo, así que
 *  la prop `format` existía y estaba muerta: el día que hubiera un segundo país,
 *  cambiar el locale exigía tocar seis archivos y ninguno fallaba si te
 *  olvidabas de uno. Acá `createFormat(locale)` devuelve el formateador y baja
 *  por props hasta el plot. `render/` no elige el locale porque no sabe de qué
 *  tenant se trata — es exactamente la misma razón por la que no elige la
 *  familia cromática.
 *
 *  SUPUESTO DECLARADO · ninguna fuente normativa fija el formato numérico, y el
 *  `.pen` se contradice: usa el punto como decimal en 85 lugares («USD 4.28M»,
 *  «6.4%») y como separador de miles en 12 («1.284.500»), a veces en la misma
 *  pantalla. Un punto no puede significar las dos cosas. Se resuelve con `es-MX`
 *  porque el primer cliente es UA MX y en México el separador de miles es la
 *  coma y el decimal el punto — que es lo que ya hacen los 85 mayoritarios. Los
 *  12 restantes quedan como propuesta de spec; no se corrigen desde acá.
 */

/** Cuántas cifras significativas conserva una abreviatura. Tres reproduce lo que
 *  ya escribe el `.pen`: 4.28M, 152K, 38K, 1.62M. */
const SIGNIFICANT = 3

const SCALES = [
  { threshold: 1e6, divisor: 1e6, suffix: 'M' },
  { threshold: 1e3, divisor: 1e3, suffix: 'K' },
] as const

/** Redondea a N significativas y quita los ceros que sobran: 4.2800 → 4.28.
 *  Devuelve el NÚMERO, no el texto: quien lo escribe es `Intl`, con el locale. */
function significant(v: number, n: number): number {
  return Number(v.toPrecision(n))
}

/** Cuántos decimales le quedaron a un número ya redondeado. */
function decimalsOf(v: number): number {
  return (String(v).split('.')[1] ?? '').length
}

export type NumberOptions = {
  /** K y M. **No hay escalón para mil millones a propósito**: «B» es *billion*
   *  en inglés y un billón en español son 10¹², así que 2.5e9 sale «2,500M» —
   *  largo, pero sin ambigüedad. */
  abbreviate?: boolean
  decimals?: number
}

const IS_CURRENCY = /^[A-Z]{3}$/
/** Solo se pega lo que es un símbolo: %, x, ×. Una palabra no. */
const IS_SYMBOL = /^[%×xX]$|^[^\p{L}\d\s]+$/u

export type Formatter = {
  /** Con qué locale se construyó. Lo usa el llamador para decidir, no para
   *  formatear: nadie fuera de acá arma un `Intl`. */
  readonly locale: string
  number: (value: number, options?: NumberOptions) => string
  /** El signo comunica dirección; el color no · regla dura 3. Devuelve texto y
   *  nunca un token, para que no exista la tentación. */
  delta: (value: number, options?: NumberOptions) => string
  withUnit: (figure: string, unit?: string) => string
  freshness: (iso: string, now: Date) => string
}

export function createFormat(locale: string): Formatter {
  function number(value: number, options: NumberOptions = {}): string {
    const { abbreviate = false, decimals } = options

    if (!Number.isFinite(value)) {
      throw new RangeError(`number() espera un número finito, recibió ${value}`)
    }

    if (abbreviate) {
      const magnitude = Math.abs(value)
      for (const scale of SCALES) {
        if (magnitude >= scale.threshold) {
          const reduced = value / scale.divisor

          if (scale.suffix === 'M' && magnitude >= 1e9) {
            const thousands = new Intl.NumberFormat(locale, {
              maximumFractionDigits: 0,
            }).format(reduced)
            return `${thousands}${scale.suffix}`
          }

          // SOLO SE ABREVIA SI NO SE PIERDE NADA. `4.28M` y `38.4K` son
          // exactos; `12.950` abreviado sería `12.9K` y se comería los 50 SKU.
          // El `.pen` hace exactamente esta distinción —abrevia las dos
          // primeras y escribe la tercera entera— y hasta 2026-08 la habíamos
          // leído como una inconsistencia suya.
          const rounded = significant(reduced, SIGNIFICANT)
          if (rounded * scale.divisor !== value) break

          // La abreviatura TAMBIÉN pasa por `Intl`. Escribirla con `String()`
          // —que es lo que hacía v2— la deja siempre con punto decimal, así que
          // con un locale de coma la cifra abreviada mentía mientras la entera
          // salía bien. No se notaba porque el locale estaba fijo en `es-MX`.
          //
          // Y la comprobación de exactitud se hace sobre el NÚMERO, nunca sobre
          // el texto: `Number('4,28')` es NaN en cuanto el locale usa coma.
          const decimals = decimalsOf(rounded)
          const body = new Intl.NumberFormat(locale, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          }).format(rounded)
          return `${body}${scale.suffix}`
        }
      }
    }

    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals ?? 0,
      maximumFractionDigits: decimals ?? (Number.isInteger(value) ? 0 : 2),
    }).format(value)
  }

  return {
    locale,

    number,

    delta(value, options = {}) {
      // U+2212 MINUS SIGN, no el guion: es el que traen las tres tipografías y
      // el que alinea con la retícula de la mono.
      const sign = value > 0 ? '+' : value < 0 ? '−' : ''
      return `${sign}${number(Math.abs(value), options)}`
    },

    /** Cómo se compone una cifra con su unidad.
     *
     *  Tres casos y no dos, porque el catálogo guarda en `unidad` tanto
     *  símbolos («%», «x») como códigos de moneda («USD») como NOMBRES
     *  («ratio», «órdenes»). Pegar el nombre daba «4.1ratio» y «38.4Kórdenes».
     *
     *  El nombre de unidad no se pega ni se antepone: pertenece al label, que
     *  es donde lo pone el `.pen` —«USD · TOTAL» arriba y «12.4M» abajo—. Y no
     *  es solo estética: a 44px «USD 4.28M» no entra en un panel de colSpan 3
     *  y «4.28M» sí, así que la decisión tipográfica y la de layout son la
     *  misma. */
    withUnit(figure, unit) {
      if (!unit) return figure
      if (IS_CURRENCY.test(unit)) return `${unit} ${figure}`
      if (IS_SYMBOL.test(unit)) return `${figure}${unit}`
      return figure
    },

    /** Frescura relativa, como la escribe el `.pen`: «HACE 4 H», «HACE 31 H».
     *
     *  En horas hasta 48 y en días después, porque la tolerancia de los feeds
     *  se declara en horas y un «hace 2 días» esconde si son 31 o 47. */
    freshness(iso, now) {
      const hours = Math.floor((now.getTime() - new Date(iso).getTime()) / 3_600_000)
      if (hours < 1) return 'RECIÉN'
      if (hours < 48) return `HACE ${hours} H`
      return `HACE ${Math.floor(hours / 24)} D`
    },
  }
}
