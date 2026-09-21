/** La respuesta del agente, dibujada · F3.13
 *
 *  **Sin `dangerouslySetInnerHTML`, y no por costumbre.** El texto lo compone un
 *  modelo que consulta datos del tenant: cualquier ruta que convierta esa cadena
 *  en marcado hace de una respuesta un vector. `parsear` devuelve una estructura
 *  cerrada —sección, párrafo, lista— y acá cada caso se pinta con un elemento
 *  escrito a mano. No hay rama por la que llegue HTML del agente.
 *
 *  **Los `###` se pintan como el rótulo de la casa**, no como un encabezado
 *  grande. La escala tipográfica tiene nueve tamaños y ninguno es «subtítulo
 *  dentro de una respuesta de chat»; el rótulo mono en mayúsculas ya es cómo
 *  esta aplicación nombra una sección, y es el mismo que llevan «Preguntaste» y
 *  «Cómo se calculó» en esta misma hoja.
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
import { parsear } from './parseMarkdown'
import type { Trozo } from './parseMarkdown'

const PARRAFO = 'font-body text-cuerpo leading-cuerpo text-ink m-0'

export function Markdown({ texto }: { texto: string }) {
  const { sinCompetencia, bloques } = parsear(texto)

  return (
    <div className="flex flex-col gap-2">
      {sinCompetencia ? (
        <Label as="div">No puedo responder esto con las fuentes que tengo</Label>
      ) : null}

      {bloques.map((bloque, i) => {
        if (bloque.tipo === 'seccion') {
          return (
            <Label as="div" key={i}>
              {bloque.texto}
            </Label>
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

        return (
          <p key={i} className={PARRAFO}>
            <Trozos trozos={bloque.trozos} />
          </p>
        )
      })}
    </div>
  )
}

function Trozos({ trozos }: { trozos: readonly Trozo[] }) {
  return (
    <>
      {trozos.map((t, i) => {
        // `**` es como el modelo destaca una cifra dentro de la prosa, que es
        // uno de los cuatro usos que §2 le concede al naranja — «CTAs, estado
        // activo, enlaces y cifras resaltadas en prosa». No es color de datos y
        // acá no lo es: no hay serie, barra ni celda.
        if (t.enfasis) {
          return (
            <strong key={i} className="font-bold text-acc">
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
