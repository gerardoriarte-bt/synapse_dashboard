/** Cargando · F1.13d
 *
 *  Esqueleto con la forma del panel final. **Nunca un spinner:** los paneles
 *  cargan en paralelo y aparecen a medida que llegan, así que un spinner por
 *  panel sería una pantalla de ruletas girando a destiempo.
 *
 *  Es también el `fallback` del `Suspense` de los cuerpos · F1.9: para quien
 *  mira, un chunk en vuelo y un dato en vuelo son indistinguibles.
 */
export function LoadingState() {
  return (
    <div className="flex flex-col gap-3 h-full" aria-busy="true" aria-label="Cargando">
      <div className="bg-w2 rounded-xs h-3 w-2/5" />
      <div className="bg-w1 rounded-sm flex-1 min-h-0" />
      <div className="bg-w2 rounded-xs h-3 w-1/4" />
    </div>
  )
}
