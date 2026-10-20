/** El usuario en el navbar, como ícono · decisión humana del 2026-10-20
 *
 *  «Reducir el botón del perfil a un ícono de usuario.» Hasta acá era un chip
 *  con iniciales, nombre y rol —2026-10-07, «con presencia»—, y con la barra
 *  del cliente activo debajo el navbar pedía menos: lo que el usuario necesita
 *  ver de un vistazo es el cliente, no su propio nombre. El nombre, el correo y
 *  el rol siguen en el panel que abre, y en el nombre accesible del botón.
 *
 *  **Es el contenido del botón, no el botón**: cada menú conserva su propio
 *  disparador, su nombre accesible y su panel.
 */
export function IconoDeUsuario() {
  return (
    // `user` de línea · hereda el color.
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}
