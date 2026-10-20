/** Las pantallas de una superficie, en el navbar · decisión humana del 2026-10-20
 *
 *  «Debería quedar en el navbar, tiene más sentido para la navegación.» Iban
 *  como pestañas debajo del título, en administración y en el builder; el `.pen`
 *  las dibuja en el navbar desde A1. La auditoría del 2026-10-20 lo anotó como
 *  diferencia anterior a la propuesta, y el humano lo decidió.
 *
 *  **En el registro de acción, no en el del rótulo** · decisión del 2026-10-06:
 *  el `.pen` las escribe en mono de 9 y así se leían como un encabezado más. Van
 *  en Inter, y la activa se marca con fondo y peso, que en un navbar se lee mejor
 *  que un subrayado.
 */
type Props<Id extends string> = {
  pantallas: readonly { id: Id; nombre: string }[]
  activa: Id
  onIr: (id: Id) => void
  /** El nombre de la navegación · lo usan las pruebas y los lectores. */
  etiqueta: string
}

export function NavDeSuperficie<Id extends string>({ pantallas, activa, onIr, etiqueta }: Props<Id>) {
  return (
    <nav className="flex items-center gap-1" aria-label={etiqueta}>
      {pantallas.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => onIr(p.id)}
          aria-current={p.id === activa ? 'page' : undefined}
          className={
            'h-8 cursor-pointer rounded-md border-0 px-3 font-body text-cuerpo ' +
            (p.id === activa ? 'bg-elev font-semibold text-ink' : 'bg-transparent font-medium text-dim hover:text-ink')
          }
        >
          {p.nombre}
        </button>
      ))}
    </nav>
  )
}
