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
 *  `.pen` se contradice: usa el punto como decimal en **151** nodos de 33
 *  pantallas («USD 4.28M», «6.4%») y como separador de miles en **10** de tres.
 *  Un punto no puede significar las dos cosas. Se resuelve con `es-MX` porque el
 *  primer cliente es UA MX y es lo que hace la mayoría del dibujo.
 *
 *  **DECIDIDO el 2026-09-22 (humano): las otras tres pantallas son un descuido y
 *  se retipean.** No se corrigen desde acá —el agente no edita el `.pen`— y no
 *  hace falta: ninguna de las tres está construida. Recontado ese día, porque
 *  acá decía «85» y «12» y ninguno de los dos era el número.
 *  `docs/PROPUESTA-2026-09-22-divergencias-con-el-pen.md` · §4 — y ojo con no confundirla con la 3 de B0.9, que pregunta de
 *  dónde sale el locale y no cuál es el formato correcto.
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
  /** El mes de una fecha, para agrupar el riel de hilos · F3.7.
   *
   *  **Lleva el año cuando no es el corriente, y no es un detalle:** la
   *  retención de hilos es de 12 meses y el contrato nombra explícitamente
   *  «reabrir la consulta del mismo mes del año previo». Sin el año, dos grupos
   *  distintos se llamarían «JULIO» y el usuario no sabría cuál es cuál. */
  monthLabel: (iso: string, now: Date) => string
  /** La marca de tiempo de una fila del riel · F3.7 · §PEN:C3.
   *
   *  **El `.pen` la dibuja en todas las filas**, y con dos formas: la hora
   *  —`09:52`— cuando el hilo es de hoy, y el día y el mes —`13 AGO`, `28 JUL`—
   *  cuando no. Con la hora sola, dos hilos de días distintos se leerían como
   *  del mismo rato; con la fecha sola, los seis de hoy dirían lo mismo.
   *
   *  **Es del huso del NAVEGADOR**, como el agrupado: las dos son la misma
   *  decisión de presentación y el contrato la concede. La zona del tenant es
   *  la del corte del día del negocio, que es otra cosa. */
  threadStamp: (iso: string, now: Date) => string
  /** Una fecha de calendario · «14 sep 2026».
   *
   *  **Existe porque la regla de arriba se estaba rompiendo** · F1.13b: tres
   *  pantallas de admin armaban su propio `Intl.DateTimeFormat('es-MX', …)`, y
   *  con eso quedaban tres lugares donde el locale se decidía y ninguno era el
   *  del tenant. Acá hay uno.
   *
   *  **Con año, a diferencia de `threadStamp`**: en admin una fecha de alta o de
   *  publicación puede ser de cualquier año, y «14 sep» sin año no ubica nada.
   *  El riel de hilos es otra cosa — ahí la retención es de doce meses y el año
   *  sólo aparece cuando no es el corriente. */
  calendar: (iso: string) => string
  /** El rótulo de un punto en el eje del tiempo · «1 oct», «oct 25» · 2026-10-06.
   *
   *  **El grano lo dice el llamador**, que mira la serie entera: un punto solo
   *  no sabe si es un día o el primero de un mes. Con `dia` va día y mes; con
   *  `mes`, mes y año corto, porque doce meses cruzan un año casi siempre.
   *
   *  Un `t` que no es fecha —una etiqueta como `'jul'`— vuelve tal cual: el eje
   *  pinta lo que llegó, no lo inventa. */
  axisDate: (t: string, grano: 'dia' | 'mes') => string
  /** La hora de un instante · «06:00». 24 horas, igual que `threadStamp`: en el
   *  producto el corte del día importa más que la costumbre local. */
  clock: (iso: string) => string
}

/** **El único default del front** · F1.13b.
 *
 *  Un tenant sin locale cargado manda cadena vacía —el campo es `string` sin
 *  `omitempty` del lado del servicio— e `Intl` con `''` tira. Cae acá y no en
 *  cada llamada, que es lo que hacía que el locale se decidiera en cuatro
 *  lugares distintos.
 *
 *  **Vive en `render/` y no en una superficie**: lo usan la consola y admin, y
 *  ponerlo en una de las dos obligaba a la otra a importarla. */
export const LOCALE_POR_DEFECTO = 'es-MX'

/** `2026-09-01` a secas · una fecha de CALENDARIO. Con `T` o con huso ya es un
 *  instante, y se mira desde algún lado. Ver `calendar`. */
const SOLO_FECHA = /^\d{4}-\d{2}-\d{2}$/

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
    monthLabel(iso, now) {
      const fecha = new Date(iso)
      const mes = new Intl.DateTimeFormat(locale, { month: 'long' }).format(fecha)
      return fecha.getFullYear() === now.getFullYear() ? mes : `${mes} ${fecha.getFullYear()}`
    },

    threadStamp(iso, now) {
      const fecha = new Date(iso)
      const mismoDia =
        fecha.getFullYear() === now.getFullYear() &&
        fecha.getMonth() === now.getMonth() &&
        fecha.getDate() === now.getDate()

      if (mismoDia) {
        // 24 horas y no 12: el `.pen` dibuja `09:52`, y en el producto el corte
        // del día importa más que la costumbre local.
        return new Intl.DateTimeFormat(locale, {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }).format(fecha)
      }

      const dia = new Intl.DateTimeFormat(locale, { day: 'numeric' }).format(fecha)
      const mes = new Intl.DateTimeFormat(locale, { month: 'short' }).format(fecha)
      // El mes en mayúsculas y sin el punto que `es-MX` le pone a «ago.»: el
      // rótulo de la casa es mono y en mayúsculas, y el punto es ruido ahí.
      return `${dia} ${mes.replace('.', '').toUpperCase()}`
    },

    freshness(iso, now) {
      const hours = Math.floor((now.getTime() - new Date(iso).getTime()) / 3_600_000)
      if (hours < 1) return 'RECIÉN'
      if (hours < 48) return `HACE ${hours} H`
      return `HACE ${Math.floor(hours / 24)} D`
    },

    axisDate(t, grano) {
      if (!SOLO_FECHA.test(t)) return t
      const opciones: Intl.DateTimeFormatOptions =
        grano === 'dia' ? { day: 'numeric', month: 'short' } : { month: 'short', year: '2-digit' }
      // UTC por la misma razón que `calendar`: `YYYY-MM-DD` es un día del
      // calendario, y mirado desde Ciudad de México el 1 de octubre es el 30.
      return new Intl.DateTimeFormat(locale, { ...opciones, timeZone: 'UTC' })
        .format(new Date(t))
        .replace(/\./g, '')
    },

    calendar(iso) {
      return new Intl.DateTimeFormat(locale, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        // ── UNA FECHA DE CALENDARIO NO ES UN INSTANTE · 2026-10-01 ───────────
        //
        // **El defecto, visto en pantalla**: el período `2026-09` pintaba su
        // rango como «31 de ago de 2026 – 29 de sept de 2026». Septiembre
        // empieza el 1.
        //
        // `new Date('2026-09-01')` parsea **medianoche UTC** —lo dice el
        // estándar para la forma corta— y después `Intl` lo escribe en el huso
        // del NAVEGADOR. Con cualquier huso al oeste de Greenwich, el día de
        // atrás. **Los dos extremos se corrían**, así que el rango se veía
        // coherente consigo mismo y era falso en los dos bordes — la clase de
        // error que no se nota leyendo el código.
        //
        // **Se distingue por la forma del dato y no por quién llama.** Un
        // `YYYY-MM-DD` nombra un día del calendario y hay que escribir ese día;
        // un instante —`…T15:11:13-05:00`, que es lo que llega en `creadoEn`,
        // `altaEn` o `ultimaCargaEn`— sí se mira desde un huso, y ése es el del
        // navegador por la regla de presentación de §4.
        //
        // Forzar UTC a los dos habría corrido las marcas de tiempo; dejarlo como
        // estaba corre las fechas. Son dos tipos distintos con la misma pinta.
        ...(SOLO_FECHA.test(iso) ? { timeZone: 'UTC' } : {}),
      }).format(new Date(iso))
    },

    clock(iso) {
      return new Intl.DateTimeFormat(locale, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(new Date(iso))
    },
  }
}

/** El mes en curso **de un huso**, `YYYY-MM` · 2026-10-07, para A5 · «Cargar meses».
 *
 *  **Acá y no en la pantalla porque este es el único archivo que arma un
 *  `Intl`** —regla `locale` de `design-lint`—. No depende del locale: el
 *  `en-CA` sólo fija el orden de las partes, y lo que se lee son números.
 *
 *  **El huso es el del tenant, no el del navegador** · regla del 2026-09-04: el
 *  corte del negocio es uno solo. Quien opera desde Bogotá el 1 de octubre a
 *  las 0:30 está todavía en septiembre para un cliente de Ciudad de México.
 *  Un huso que `Intl` no reconoce cae a UTC: a lo sumo se ofrece un mes de más
 *  o de menos un día al año, y el servicio igual acepta el que se pida. */
export function mesEnCurso(ahora: Date, zona: string | null): string {
  const partes = (tz: string) =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
    }).formatToParts(ahora)
  let p: Intl.DateTimeFormatPart[]
  try {
    p = partes(zona === null || zona === '' ? 'UTC' : zona)
  } catch {
    p = partes('UTC')
  }
  const anio = p.find((x) => x.type === 'year')?.value ?? ''
  const mes = p.find((x) => x.type === 'month')?.value ?? ''
  return `${anio}-${mes}`
}
