/** Lo que hace legible una cifra del agente, para CUALQUIER forma · 2026-10-10
 *
 *  Aparte de `ChatFigure` porque no son componentes: un `.tsx` que exporta
 *  funciones pierde el fast refresh de Vite.
 *
 *  Salió de `docs/AUDITORIA-2026-10-10-graficos-del-chat.md`, con una consigna
 *  del humano: que valga «para el crecimiento de métrica a gráfica, no sólo
 *  la que nombras». Por eso nada de acá pregunta por un gráfico en particular:
 *  mira la FORMA del valor y lo que el agente escribió de sus ejes.
 */
import type { Value } from '../../api/types'
import type { EjesDelGrafico } from '../../api/vegaLite'
import type { Formatter } from '../../render/format'

const FECHA = /^\d{4}-\d{2}-\d{2}$/

/** «Ingresos (USD) · por mes · por plataforma». `null` si el agente no
 *  escribió nada que leer.
 *
 *  **Es el rótulo de los ejes, dicho una vez**, arriba del gráfico y no en cada
 *  eje: así vale igual para una serie, unas barras, un mapa de calor o una
 *  tabla, sin tocar quince cuerpos. */
export function lineaDeEjes(ejes: EjesDelGrafico | undefined): string | null {
  if (ejes === undefined) return null
  const partes = [
    ejes.medida,
    ejes.dimension === null ? null : `por ${minuscula(ejes.dimension)}`,
    ejes.serie === null ? null : `por ${minuscula(ejes.serie)}`,
  ].filter((p): p is string => p !== null && p.trim() !== '')
  return partes.length === 0 ? null : partes.join(' · ')
}

/** Las fechas `YYYY-MM-DD` que el valor reparte, en cualquier forma. */
export function fechasDe(valor: Value): string[] {
  const todas: string[] = (() => {
    switch (valor.forma) {
      case 'serieTemporal':
      case 'serieConBanda':
        return valor.puntos.map((p) => p.t)
      case 'seriesMultiples':
        return valor.series.flatMap((s) => s.puntos.map((p) => p.t))
      case 'categorica':
        return valor.items.map((i) => i.etiqueta)
      case 'matriz':
        return [...valor.filas, ...valor.columnas]
      case 'tabular':
        return valor.filas.flatMap((f) => Object.values(f).filter((c): c is string => typeof c === 'string'))
      default:
        return []
    }
  })()
  return todas.filter((t) => FECHA.test(t))
}

/** ¿El valor incluye el mes en curso? Devuelve ese mes como `YYYY-MM-01`.
 *
 *  **El último punto de un mes abierto es una cifra incompleta**, y en una
 *  serie mensual se lee como un desplome: «Ingresos May–Oct» caía de 1,3M a
 *  130K en un octubre de una semana. El mes abierto lo declara el servicio
 *  —`open_period`—; acá sólo se compara. */
export function mesEnCursoEn(valor: Value, mesEnCurso: string | undefined): string | null {
  if (mesEnCurso === undefined) return null
  return fechasDe(valor).some((t) => t.startsWith(`${mesEnCurso}-`)) ? `${mesEnCurso}-01` : null
}

/** Las fechas de una dimensión, rotuladas con el formateador del tenant.
 *
 *  Las series ya lo hacen en su eje; esto es para las formas que pintan la
 *  etiqueta tal cual —barras, tablas, mapas de calor—, donde una fecha del
 *  agente salía `2026-09-01`. **Es reformatear, no calcular**: la fecha es la
 *  misma, escrita como la lee el cliente. Mensual si TODAS caen el día 1. */
export function rotularFechas(valor: Value, format: Formatter): Value {
  const fechas = fechasDe(valor)
  if (fechas.length === 0) return valor
  const grano = fechas.every((t) => t.endsWith('-01')) ? 'mes' : 'dia'
  const r = (t: string) => (FECHA.test(t) ? format.axisDate(t, grano) : t)
  switch (valor.forma) {
    case 'categorica':
      return { ...valor, items: valor.items.map((i) => ({ ...i, etiqueta: r(i.etiqueta) })) }
    case 'matriz':
      return { ...valor, filas: valor.filas.map(r), columnas: valor.columnas.map(r) }
    case 'tabular':
      return {
        ...valor,
        filas: valor.filas.map((f) =>
          Object.fromEntries(Object.entries(f).map(([k, c]) => [k, typeof c === 'string' ? r(c) : c])),
        ),
      }
    default:
      // Las series rotulan su propio eje con el mismo formateador.
      return valor
  }
}

function minuscula(s: string): string {
  return s.toLocaleLowerCase('es')
}

/** Las fechas `YYYY-MM-DD` dentro de una frase —el aviso de por qué un gráfico
 *  va como tabla— rotuladas como en el resto de la figura: «TikTok en
 *  2026-04-01» decía la fecha en el idioma del cable. */
export function rotularFechasEnTexto(texto: string, format: Formatter): string {
  return texto.replace(/\b\d{4}-\d{2}-\d{2}\b/g, (t) => format.axisDate(t, t.endsWith('-01') ? 'mes' : 'dia'))
}
