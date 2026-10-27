/** La respuesta del agente, dibujada · F3.13
 *
 *  **Sin `dangerouslySetInnerHTML`, y no por costumbre.** El texto lo compone un
 *  modelo que consulta datos del tenant: cualquier ruta que convierta esa cadena
 *  en marcado hace de una respuesta un vector. `parsear` devuelve una estructura
 *  cerrada —sección, párrafo, lista— y acá cada caso se pinta con un elemento
 *  escrito a mano. No hay rama por la que llegue HTML del agente.
 *
 *  **Los `###` se pintan en el tamaño del cuerpo, en `font-semibold` e `ink`**,
 *  no como un encabezado grande: la escala tipográfica tiene nueve tamaños y
 *  ninguno es «subtítulo dentro de una respuesta de chat».
 *
 *  **Hasta el 2026-10-27 iban como el rótulo de la casa**, mono, en mayúsculas
 *  y en `dim`: el mismo traje que el encabezado de una tabla, «Preguntaste», la
 *  BASE y la procedencia. Con tablas en la respuesta, el humano lo dijo así:
 *  títulos, referencias y encabezados «se ven muy igual». El rótulo sigue
 *  nombrando lo que es de la casa; el título es del agente.
 *
 *  **`[SIN_COMPETENCIA]` no se muestra crudo.** Es un marcador de protocolo: el
 *  backend lo pone en la primera línea cuando el agente no puede responder con
 *  las fuentes que tiene. Se traduce a una línea de producto y el motivo sigue
 *  abajo, que es lo que el usuario necesita leer.
 *
 *  **El parser se llama `parseMarkdown.ts` y no `markdown.ts` por una razón
 *  tonta y real:** en un sistema de archivos que no distingue mayúsculas —el de
 *  macOS por defecto— `./Markdown` resolvía al parser en vez de a este archivo,
 *  y `tsc` decía que el módulo no exporta `Markdown`. En Linux habría
 *  compilado, que es la mitad peor de ese error.
 */
import { Label } from '../../render/primitives/Label'
import { TABLA_DE_LECTURA as T } from '../../render/primitives/tablaDeLectura'
import { parsear } from './parseMarkdown'
import type { Trozo } from './parseMarkdown'

const PARRAFO = 'font-body text-cuerpo leading-cuerpo text-ink m-0'

/** **Un `###` es un título, no un rótulo** · 2026-10-27. Ver la cabecera. */
const SECCION = 'font-body text-cuerpo leading-cuerpo font-semibold text-ink m-0 pt-2'

export function Markdown({ texto }: { texto: string }) {
  const { sinCompetencia, bloques } = parsear(texto)

  return (
    <div className="flex flex-col gap-2">
      {/* §PEN:C3 le dedica un bloque, no una línea: el rótulo, la aclaración de
          que no es una negativa genérica, el motivo —que llega abajo, en la
          prosa— y dos CTAs.

          **Los dos CTAs no se pintan**: `PROYECTAR 4 SEMANAS` y `SOLICITAR LA
          FUENTE` no tienen manejador, y un botón que se aprieta y no hace nada
          es peor que uno ausente. El rótulo y la aclaración sí, y son lo que
          cambia cómo se lee la respuesta. */}
      {sinCompetencia ? (
        <div className="flex flex-col gap-1">
          <Label as="div">Sin competencia</Label>
          <Label as="div">No es una negativa genérica</Label>
        </div>
      ) : null}

      {bloques.map((bloque, i) => {
        if (bloque.tipo === 'seccion') {
          return (
            <p key={i} className={SECCION}>
              {bloque.texto}
            </p>
          )
        }

        if (bloque.tipo === 'lista') {
          const Lista = bloque.ordenada ? 'ol' : 'ul'
          return (
            <Lista key={i} className="flex flex-col gap-1 pl-4 m-0">
              {bloque.items.map((item, j) => (
                <li key={j} className={PARRAFO}>
                  <Trozos trozos={item} />
                </li>
              ))}
            </Lista>
          )
        }

        if (bloque.tipo === 'tabla') {
          // **La anatomía de lectura** · 2026-10-27: encabezado sobre `elev`,
          // filas alternadas, línea entre columnas y la primera columna en
          // `font-medium`. Es la misma que la tabla que el agente manda como
          // dato. Hasta ese día era la del panel, y en tablas de muchas filas
          // «se ve muy igual». Ver `tablaDeLectura.ts`.
          return (
            <div key={i} className={T.marco}>
              <table className={T.tabla}>
                <thead className={T.encabezado}>
                  <tr>
                    {bloque.encabezado.map((c, j) => (
                      <th
                        key={j}
                        scope="col"
                        className={`${T.th} ${j === 0 ? '' : T.entreColumnas} ${bloque.numericas[j] === true ? 'text-right' : ''}`}
                      >
                        <Label>{c.map((t) => t.texto).join('')}</Label>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bloque.filas.map((fila, k) => (
                    <tr key={k} className={T.fila}>
                      {fila.map((c, j) => (
                        <td
                          key={j}
                          className={`${T.td} ${j === 0 ? T.rotuloDeFila : T.entreColumnas} ${
                            bloque.numericas[j] === true
                              ? 'text-right font-mono text-celda text-ink'
                              : 'font-body text-cuerpo text-ink'
                          }`}
                        >
                          <Trozos trozos={c} enCelda />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }

        return (
          <p key={i} className={PARRAFO}>
            <Trozos trozos={bloque.trozos} />
          </p>
        )
      })}
    </div>
  )
}

/** `enCelda`: el énfasis dentro de una tabla va en negrita y SIN naranja ·
 *  `design.md` prohíbe `acc` en una celda —«nunca en una serie, barra, celda o
 *  nodo»—, y la prosa es el único lugar donde una cifra resaltada lo lleva. */
function Trozos({ trozos, enCelda = false }: { trozos: readonly Trozo[]; enCelda?: boolean }) {
  return (
    <>
      {trozos.map((t, i) => {
        // `**` es como el modelo destaca una cifra dentro de la prosa, que es
        // uno de los cuatro usos que §2 le concede al naranja — «CTAs, estado
        // activo, enlaces y cifras resaltadas en prosa». No es color de datos y
        // acá no lo es: no hay serie, barra ni celda.
        if (t.enfasis) {
          return (
            <strong key={i} className={enCelda ? 'font-bold' : 'font-bold text-acc'}>
              {t.texto}
            </strong>
          )
        }
        if (t.codigo) {
          return (
            <code key={i} className="font-mono text-celda text-dim">
              {t.texto}
            </code>
          )
        }
        return <span key={i}>{t.texto}</span>
      })}
    </>
  )
}
