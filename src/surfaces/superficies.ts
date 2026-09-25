/** Las superficies de Synapse · el registro · 2026-09-25
 *
 *  **Una sola lista, y de acá salen las dos cosas que hoy estaban separadas**:
 *  las rutas que el router monta y las salidas que el menú de usuario ofrece.
 *
 *  ── POR QUÉ EXISTE ─────────────────────────────────────────────────────────
 *
 *  Hasta hoy eran **dos listas del mismo hecho**: `app/router/routes.tsx` con
 *  las cuatro rutas, y un `SUPERFICIES` escrito a mano dentro de `UserMenu` con
 *  dos entradas. Nada verificaba que coincidieran, así que agregar una
 *  superficie era acordarse de tocar los dos archivos — y la que se olvidara
 *  quedaba montada y sin forma de llegar, o al revés.
 *
 *  Es el mismo problema que este repositorio persigue en los documentos, con
 *  forma de código: dos fuentes para el mismo hecho se separan.
 *
 *  ── LO QUE ESTE REGISTRO **NO** DECIDE ─────────────────────────────────────
 *
 *  **Dónde vive la navegación entre superficies, ni qué forma tiene.** Eso es
 *  visual y es jurisdicción del `.pen`, que **no lo dibuja en ninguna de sus
 *  quince pantallas** — está anotado en `BuilderChrome` desde que se escribió.
 *  Lo que hay hoy —el «← Consola» y el menú de la consola— es invención nuestra
 *  del 2026-09-16, y quedó asimétrico.
 *
 *  Está preguntado en `docs/PROPUESTA-2026-09-25-navegacion-entre-superficies.md`.
 *  Hasta que haya dibujo, este registro **sólo unifica el dato**: no agrega
 *  controles nuevos. Inventar una tercera navegación y después pedir el dibujo
 *  es cómo nacieron el riel de doce chips y el «← Consola».
 *
 *  ── POR QUÉ ACÁ Y NO EN `app/` ─────────────────────────────────────────────
 *
 *  Porque lo consumen las superficies y el router, y el router ya importa de
 *  `surfaces/`. Al revés —el registro en `app/` y una superficie importándolo—
 *  haría que `console/` dependiera del router para saber que existe `admin/`.
 */

/** Quién puede abrir una superficie.
 *
 *  `todos` no significa «sin sesión»: el guardia de autenticación es anterior y
 *  vale para las tres. Significa que, adentro, no hay condición de rol. */
export type Alcance = 'todos' | 'admin'

export type Superficie = {
  id: 'consola' | 'admin' | 'builder'
  ruta: string
  /** El nombre que ve una persona. En español, que es la lengua del producto. */
  nombre: string
  alcance: Alcance
  /** La etiqueta que el navbar pinta al lado del logotipo · el `.pen` la dibuja
   *  en A1 —`ADMINISTRACIÓN`— y en B2 —`BUILDER`—. La consola no lleva: es la
   *  superficie por defecto y nombrarla sería ruido. */
  etiqueta: string | null
}

/** **El orden es el de lectura**, no alfabético: la consola primero porque es
 *  donde se entra, y el builder último porque es la que menos gente abre. */
export const SUPERFICIES: readonly Superficie[] = [
  { id: 'consola', ruta: '/', nombre: 'Consola', alcance: 'todos', etiqueta: null },
  { id: 'admin', ruta: '/admin', nombre: 'Administración', alcance: 'admin', etiqueta: 'Administración' },
  { id: 'builder', ruta: '/builder', nombre: 'Builder', alcance: 'admin', etiqueta: 'Builder' },
] as const

/** Las que puede abrir quien tenga este rol, **menos la que está mirando**.
 *
 *  Excluir la actual es lo que evita el «ir a donde ya estás», y que sea un
 *  parámetro y no una condición escrita en cada chrome es lo que hace que una
 *  superficie nueva aparezca en todas sin tocar ninguna.
 */
export function salidasDesde(actual: Superficie['id'], esAdmin: boolean): readonly Superficie[] {
  return SUPERFICIES.filter((s) => s.id !== actual && (s.alcance === 'todos' || esAdmin))
}
