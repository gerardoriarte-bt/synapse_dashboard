/** A2 · los datos del cliente · §PEN:A2 · F5.20
 *
 *  El primer bloque de `A2 · Ficha · tenant en alta`: el rótulo
 *  `IDENTIDAD DEL TENANT` y una tarjeta con **siete columnas de 160**, cada una
 *  con su rótulo mono 9 arriba y su valor abajo. El dibujo las escribe en este
 *  orden y en este orden van.
 *
 *  Es lo que §7.3 le pide a A2 en primer lugar —«datos del tenant»— y lo que
 *  hasta hoy la ficha declaraba como ausente sin pintarlo.
 *
 *  ── LAS TRES COLUMNAS QUE SALEN EN UN GUIÓN, Y SON TRES CASOS DISTINTOS ─────
 *
 *  Conviene no confundirlos, porque el arreglo de cada uno es de otra persona:
 *
 *  1. **`CATALOG VERSION`** · el dibujo YA la dibuja en guión y atenuada: es el
 *     caso que este frame retrata, un cliente sin una sola métrica. Cuando hay
 *     métricas sale `v4`, derivado en `alta.ts`.
 *  2. **`VERTICAL`** · el campo EXISTE y llega vacío, por decisión escrita del
 *     servicio. No es un hueco de transcripción: es un valor que nadie definió
 *     todavía.
 *  3. **`PLANTILLA`** · **el campo no existe y tampoco la ruta**. Medido el
 *     2026-09-30: las dos que la servirían contestan «no encontrado».
 *
 *  **La columna 3 no se borra**, y esa es la decisión que importa. Borrarla
 *  pierde el literal que el dibujo declara normativo, y el día que el dato llegue
 *  nadie se acuerda de volver a ponerla. Queda con su rótulo, su guión, y una
 *  línea al pie que dice qué falta — que es la gramática de §8 aplicada a una
 *  celda en vez de a un panel.
 *
 *  ── LA CABECERA QUEDA DIVIDIDA, Y ES A PROPÓSITO ────────────────────────────
 *
 *  El dibujo pone `Grupo Axo` en display 24 como título de la pantalla, con una
 *  migaja encima y el chip `EN ALTA` al lado. **La aplicación pone el nombre de la
 *  PANTALLA** —`AdminChrome` pinta uno solo, con una decisión escrita y una
 *  prueba que la sostiene— y el cliente se elige en el selector del navbar.
 *
 *  Así que el chip viene acá, a la fila del rótulo, con el nombre del cliente al
 *  lado: es la única superficie donde el dibujo lo hace derivable sin tocar una
 *  decisión que ya tiene dueño. La migaja y el display 24 quedan sin construir y
 *  están anotados en el registro de pantallas.
 *
 *  ── EL `ID` ES EL QUE EL SERVICIO DA ────────────────────────────────────────
 *
 *  El dibujo escribe `axo_mx`, una forma corta legible. **El servicio no manda
 *  ninguna**: el identificador del cliente es un UUID y no hay campo del que
 *  derivar un slug. Se pinta el que hay; inventar la forma corta sería escribir
 *  un dato.
 */
import type { ReactNode } from 'react'
import { Label } from '../../render/primitives/Label'
import { Note } from '../../render/primitives/Note'
import { StatusChip } from './StatusChip'
import type { EstadoDeAlta } from './alta'
import type { Tenant } from '../../api/admin'
import type { Formatter } from '../../render/format'

/** El valor de una columna · body 12.5 en el dibujo, `text-celda` acá.
 *
 *  **Los 12.5 no se pueden emitir**: la escala no tiene ese tamaño y agregarlo
 *  exigiría editar el dibujo, que no se toca. La divergencia está decidida y
 *  escrita; acá se aplica. */
const VALOR = 'font-body text-celda leading-cuerpo text-ink m-0'

/** El mismo valor cuando lo que dice es «todavía no hay nada».
 *
 *  **Atenuado y con un guión, nunca vacío.** El dibujo lo hace así con
 *  `CATALOG VERSION`, y la razón vale para las tres: una celda en blanco se lee
 *  como un dato que es blanco, y una cadena vacía se lee como un valor. */
const AUSENTE = 'font-body text-celda leading-cuerpo text-dim m-0'

/** Un guión largo, que es lo que el dibujo escribe. */
const SIN_DATO = '—'

type Props = {
  tenant: Tenant | null
  /** Derivado en `alta.ts`. **`null` mientras no se sabe**: pintar «En servicio»
   *  antes de que lleguen los roles afirma algo que todavía no llegó, que es la
   *  misma razón por la que el resumen de roles dice «Cargando» y no «0 roles». */
  estado: EstadoDeAlta | null
  /** La reducción de las versiones del catálogo · `null` cuando no hay métricas. */
  version: number | null
  /** Del locale de quien mira · las pantallas de admin cruzan clientes. */
  format: Formatter
}

/** Los dos literales de la columna `ESTADO`, en capitalización de oración, que es
 *  como el dibujo los escribe —«En alta», «Activo»—. El chip en cambio va en
 *  mayúsculas porque es un chip: lo pone `Note`. */
const ESTADO: Record<EstadoDeAlta, string> = {
  EN_ALTA: 'En alta',
  EN_SERVICIO: 'Activo',
}

export function TenantIdentity({ tenant, estado, version, format }: Props) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Label as="div">Identidad del tenant</Label>
        {tenant !== null && <span className={VALOR}>{tenant.nombre}</span>}
        {/* **El chip sólo cuando el cliente está en alta.** Un chip que se pinta
            siempre no distingue nada, y «ACTIVO» al lado del nombre de cada
            cliente es decoración: lo que el dibujo marca es la excepción. */}
        {estado === 'EN_ALTA' && <StatusChip>En alta</StatusChip>}
      </div>

      {/* La pregunta operativa de la ficha · el dibujo la escribe igual en las
          dos variantes, palabra por palabra. Es un literal sin dato detrás. */}
      <p className="font-body text-cuerpo leading-cuerpo text-dim m-0">
        ¿Qué ve cada rol de este cliente, y con qué permiso?
      </p>

      <div className="rounded-xl border border-w3 bg-panel p-6 flex flex-col gap-4">
        {/* `flex-wrap` y columnas de 160 · `w-40` son esos 160 sobre la escala.
            El dibujo las pone en una fila de 1600 de ancho; acá el ancho lo manda
            el chrome, así que sobran a la siguiente línea en vez de recortarse. */}
        <div className="flex flex-wrap gap-6">
          <Campo rotulo="Id">
            {tenant === null ? <span className={AUSENTE}>{SIN_DATO}</span> : <span className={VALOR}>{tenant.id}</span>}
          </Campo>

          <Campo rotulo="Vertical">
            {/* El campo llega vacío por decisión del servicio · ver el
                comentario de arriba, caso 2. */}
            {tenant === null || tenant.vertical === null || tenant.vertical === '' ? (
              <span className={AUSENTE}>{SIN_DATO}</span>
            ) : (
              <span className={VALOR}>{tenant.vertical}</span>
            )}
          </Campo>

          <Campo rotulo="Plantilla">
            {/* Caso 3: no hay campo ni de dónde leerlo. La columna se queda con
                su rótulo para no perder el literal del dibujo. */}
            <span className={AUSENTE}>{SIN_DATO}</span>
          </Campo>

          <Campo rotulo="Estado">
            {estado === null ? (
              <span className={AUSENTE}>{SIN_DATO}</span>
            ) : (
              <span className={VALOR}>{ESTADO[estado]}</span>
            )}
          </Campo>

          <Campo rotulo="Moneda">
            {tenant === null ? (
              <span className={AUSENTE}>{SIN_DATO}</span>
            ) : (
              <span className={VALOR}>{tenant.moneda}</span>
            )}
          </Campo>

          <Campo rotulo="Catalog version">
            {/* **Con la `v` adelante**, que es como la ficha del cliente en
                servicio lo escribe en el dibujo: `v2`. */}
            {version === null ? (
              <span className={AUSENTE}>{SIN_DATO}</span>
            ) : (
              <span className={VALOR}>v{String(version)}</span>
            )}
          </Campo>

          <Campo rotulo="Alta">
            {/* **Formateada, no el texto crudo de la fecha.** Lo que llega es un
                instante con huso; pintarlo tal cual es lo que compila y lo que
                nadie lee. */}
            {tenant === null ? (
              <span className={AUSENTE}>{SIN_DATO}</span>
            ) : (
              <span className={VALOR}>{format.calendar(tenant.creadoEn)}</span>
            )}
          </Campo>
        </div>

        {/* La línea que declara el hueco de `PLANTILLA`. **Va al pie de la
            tarjeta y no en la celda**: es una propiedad del producto y no de este
            cliente, igual que la advertencia de las métricas ocultas. */}
        <div className="text-dim">
          <Note as="div">Todavía no hay plantillas de vertical que un cliente pueda heredar</Note>
        </div>
      </div>
    </section>
  )
}

/** Una columna de la tarjeta · rótulo arriba, valor abajo, 160 de ancho.
 *
 *  **Ningún número desnudo**: el rótulo no es decoración, es lo que hace que
 *  `v4` o una fecha signifiquen algo. Por eso el valor entra como hijo y el
 *  rótulo es obligatorio — no hay forma de pintar uno sin el otro. */
function Campo({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    // **El gris va en el contenedor y el valor pone el suyo.** `Note` no fija
    // color a propósito —el `.pen` la dibuja en dos—, así que lo hereda de acá;
    // `VALOR` y `AUSENTE` declaran el de la segunda línea.
    <div className="flex w-40 flex-col gap-1 text-dim">
      <Note as="div">{rotulo}</Note>
      {children}
    </div>
  )
}
