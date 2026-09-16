/** Las cinco pantallas de administración · §7.3 de `design.md` · F4.1
 *
 *  **Aparte del chrome porque son un dato, no un render.** §4 regla 3 pide un
 *  componente por archivo, y `design-lint` lo hace cumplir — lo encontró en la
 *  primera corrida de esta tarea. Tenerlas acá también deja que una prueba
 *  verifique la tabla de alcances sin montar nada.
 *
 *  **El alcance no es uniforme y esa es la parte que importa.** A1 y A3 cruzan
 *  clientes —son de plataforma— y A2, A4 y A5 operan dentro de un tenant. §7.3
 *  explica por qué A3 es la excepción que parece incoherente: «cruza clientes
 *  porque su regla dura —el tenant de un usuario no se edita— solo es visible
 *  cuando el tenant es una columna que se compara, no un contexto implícito».
 */
export const PANTALLAS = [
  { id: 'clientes', ruta: '/admin', nombre: 'Clientes y plataforma', alcance: 'plataforma' },
  { id: 'cliente', ruta: '/admin/cliente', nombre: 'Ficha de cliente', alcance: 'tenant' },
  { id: 'usuarios', ruta: '/admin/usuarios', nombre: 'Usuarios', alcance: 'plataforma' },
  { id: 'catalogo', ruta: '/admin/catalogo', nombre: 'Catálogo de métricas', alcance: 'tenant' },
  { id: 'feeds', ruta: '/admin/feeds', nombre: 'Salud de feeds', alcance: 'tenant' },
] as const

export type PantallaId = (typeof PANTALLAS)[number]['id']
