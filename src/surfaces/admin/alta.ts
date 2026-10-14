/** El estado de alta de un cliente · §PEN:A2 · F5.20
 *
 *  **Las dos cosas que la ficha de un cliente nuevo tiene que decir y ningún
 *  campo del servicio contesta**: si está en alta, y con qué versión del
 *  catálogo quedó.
 *
 *  El dibujo `A2 · Ficha · tenant en alta` las pinta las dos —el chip `EN ALTA`
 *  y la columna `ESTADO` en «En alta», con `CATALOG VERSION` en un guión— y su
 *  nota explica de dónde salen: «axo_mx vive en SYNAPSE_TENANTS con roles: []».
 *  O sea que el estado **no es un campo, es la consecuencia de no tener roles**.
 *
 *  ── POR QUÉ ACÁ Y NO EN EL ADAPTADOR ────────────────────────────────────────
 *
 *  Porque son dos reducciones sobre filas —una condición y un máximo— y la regla
 *  de la casa es que el adaptador renombra y reformatea, no calcula. Es el mismo
 *  lugar y por la misma razón que `saludDeFuente.ts`: aparte del componente
 *  porque es una decisión, no un render, y se prueba sin montar nada.
 *
 *  ── EL ESTADO SE DERIVA Y EL CAMPO NO SE LEE · decisión del 2026-09-30 ──────
 *
 *  `GET /admin/tenants` manda `status`, y **no se usa**. Medido ese día contra el
 *  servicio local: llega `null` en los dos clientes sembrados, y no es una foto —
 *  `internal/core/ports/tenant.go` lo dice en el código, «quedan reservados hasta
 *  que el cliente defina sus valores (siempre nil en v1)».
 *
 *  Es el mismo razonamiento que `saludDeFuente`: guardarlo y derivarlo son dos
 *  fuentes para el mismo hecho, y se separan en el primer cliente que cambie de
 *  estado sin que nadie toque la columna.
 *
 *  **Y el riesgo queda escrito, porque es una reapertura esperando, no un bug
 *  escondido:** hoy «En servicio» se deduce de TENER roles y catálogo. El día que
 *  `status` traiga `SUSPENDIDO`, esta pantalla va a decir que un cliente
 *  suspendido está en servicio. No se puede arreglar hoy sin inventar el valor;
 *  lo que sí se puede es que la prueba «ignora `status`» falle ruidosamente ese
 *  día, y está escrita.
 */

/** Los dos estados que esta derivación distingue.
 *
 *  **No son los tres que el servicio va a tener.** `ACTIVO`, `PILOTO` y
 *  `SUSPENDIDO` están decididos del lado del cable y todavía no llegan; esto
 *  contesta la única pregunta que el dibujo hace —«¿este cliente ya arrancó?»— y
 *  se cierra el día que el campo exista. */
export type EstadoDeAlta = 'EN_ALTA' | 'EN_SERVICIO'

/** Lo único que hace falta de una métrica para reducirla.
 *
 *  Estructural y no `Metric` entero: así la prueba escribe el caso con un número
 *  y no con las veinte claves del catálogo. */
type ConVersion = { catalogVersion: number }

/** La versión del catálogo del cliente · `null` cuando no tiene ninguna métrica.
 *
 *  **Es una reducción y no un campo**, y la reducción no la elegimos nosotros:
 *  medido el 2026-09-30, el cliente `e65f81ae-…` tiene 21 métricas con **tres**
 *  versiones distintas —1, 3 y 4— y `GET /config/me` de ese mismo cliente
 *  contesta `catalog_version: 4`. El máximo, entonces, es la definición del
 *  servicio: su sincronización arranca leyendo la versión más alta y escribe la
 *  siguiente.
 *
 *  **El guardia va ANTES del máximo.** `Math.max()` sobre una lista vacía
 *  devuelve `-Infinity`, que no es `null`, pasa cualquier `!== null` y pinta
 *  «v-Infinity». Y `0` tampoco sirve: es la distinción que A5 ya paga dos veces
 *  —`null` es «nunca» y `0` es «recién»— y acá un cero pintaría «v0», que no
 *  existe. */
export function versionDeCatalogo(metricas: readonly ConVersion[]): number | null {
  if (metricas.length === 0) return null
  return Math.max(...metricas.map((m) => m.catalogVersion))
}

/** Si el cliente está en alta.
 *
 *  **Las DOS condiciones, con `&&`.** Un cliente con roles ya arrancó aunque su
 *  catálogo esté vacío —alguien definió quién entra—, y uno con catálogo y sin
 *  roles tampoco está en alta: tiene el dato cargado y le falta el acceso. El
 *  dibujo retrata el caso en que faltan las dos.
 *
 *  `roles` es `readonly unknown[]` a propósito: acá sólo se cuentan. Pedir `Rol`
 *  obligaría a la prueba a escribir siete campos para variar una longitud. */
export function estadoDeAlta(cliente: {
  roles: readonly unknown[]
  metricas: readonly ConVersion[]
}): EstadoDeAlta {
  return cliente.roles.length === 0 && versionDeCatalogo(cliente.metricas) === null
    ? 'EN_ALTA'
    : 'EN_SERVICIO'
}
