// @vitest-environment jsdom

/** La superficie del builder · F4.6
 *
 *  **Las pruebas citan §7.2 y §4 de `design.md`, no miran la implementación.**
 *  Y la que sostiene esta tarea es la del ancho: §4 da dos números y B5 es la
 *  excepción, así que una tabla con un solo ancho pasaría un test escrito desde
 *  el código y violaría la spec.
 */
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http } from 'msw'
import { describe, expect, it } from 'vitest'
import { Builder } from '@/surfaces/builder/Builder'
import { PANTALLAS } from '@/surfaces/builder/pantallas'
import { ok } from '../../mocks/handlers'
import { server } from '../../mocks/server'

const API = '*/api/v1'

/** B1 ya trae datos —es F4.7— así que el chrome se monta con proveedor y con
 *  servicio. Lo que estas pruebas miran sigue siendo el chrome. */
function montar() {
  server.use(
    http.get(`${API}/admin/tenants`, () => ok([{ id: 't-1', name: 'Under Armour México' }])),
    http.get(`${API}/admin/tenants/:id/layouts`, () => ok([])),
  )
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      {/* **En un router, porque el contenedor navega.** Desde el 2026-09-16
          `Admin`/`Builder` ofrecen «volver a la consola» y eso es `useNavigate`,
          que fuera de un router lanza. Montarlos sin él probaba una app que la
          real no es. */}
      <MemoryRouter>
        <Builder />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('§7.2 · las seis pantallas', () => {
  it('declara las seis, en el orden de la spec', () => {
    // Del dato y no del render: si una se agrega o se renombra en el diseño,
    // esto lo dice antes que una prueba de pantalla.
    expect(PANTALLAS.map((p) => p.nombre)).toEqual([
      'Contexto de edición',
      'Canvas',
      'Selector de gráfico',
      'Binder de métrica',
      'Vista previa por rol',
      'Historial de versiones',
    ])
  })
})

describe('§4 · el ancho mínimo, que no es uniforme', () => {
  it('B5 va a 1440 y las otras cinco a 1600', () => {
    // «Builder · 1600 mínimo 1600 (…) La excepción es B5, que va a 1440 porque
    // muestra la consola del cliente a su ancho real.»
    //
    // Es la regla que un test escrito desde el código no vería: una tabla con
    // 1600 en las seis se ve perfectamente coherente.
    const anchos = Object.fromEntries(PANTALLAS.map((p) => [p.id, p.ancho]))
    expect(anchos).toEqual({
      contexto: 1600,
      canvas: 1600,
      grafico: 1600,
      metrica: 1600,
      preview: 1440,
      historial: 1600,
    })
  })

  it('el chrome PINTA el mínimo de la pantalla activa', async () => {
    // Un `min-w-[1600px]` interpolado compilaría y no pintaría nada: Tailwind
    // poda lo que su escáner no ve escrito. Es el silencio de `text-labell`.
    const { container } = montar()
    expect(container.querySelector('.min-w-\\[1600px\\]')).not.toBeNull()

    await userEvent.click(screen.getByRole('button', { name: 'Vista previa por rol' }))
    expect(container.querySelector('.min-w-\\[1440px\\]')).not.toBeNull()
    expect(container.querySelector('.min-w-\\[1600px\\]')).toBeNull()
  })

  it('NO colapsa · §4 dice ancho mínimo, no menos columnas', async () => {
    // «Las otras dos superficies no son grids y declaran ancho mínimo en vez de
    // colapso.» Escalar el lienzo haría mentir a las unidades de arrastre.
    const { container } = montar()
    for (const clase of ['grid-cols-6', 'grid-cols-1', 'max-w-full']) {
      expect(container.querySelector(`.${clase}`)).toBeNull()
    }
  })

  it('el chrome DICE el ancho, y B5 no tiene dónde decirlo', async () => {
    // **La única pantalla de 1440 es B5, y B5 no lleva chrome** —«SIN CHROME DE
    // EDICIÓN», dice el `.pen`—. Lo dijo el compilador al narrowear por la forma
    // de chrome, no una prueba: el rótulo de 1440 era código muerto.
    montar()
    expect(screen.getByText(/1600 · lienzo 1:1 a 1200 más 300 de biblioteca/)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Vista previa por rol' }))
    expect(screen.queryByText(/1600 · lienzo/)).toBeNull()
    // El 1440 sigue declarado y verificado en `pantallas.ts`, arriba.
  })
})

describe('las pantallas que todavía no se pueden construir · ninguna', () => {
  it('NINGUNA de las seis dice «Pendiente» · la tabla quedó vacía', async () => {
    // **Era al revés hasta el 2026-09-30**: esta prueba recorría las pendientes y
    // exigía que dijeran qué las desbloquea. La lista se vació —`grafico` con
    // F4.21, `historial` con F5.19— y una prueba que recorre una lista vacía
    // **pasa sin afirmar nada**, que es la forma en que un test se muere sin que
    // nadie lo note. Así que se da vuelta la aserción: lo que hay que sostener
    // ahora es que ninguna se declare pendiente.
    //
    // **B5 se recorre aparte**: no lleva navbar —«SIN CHROME DE EDICIÓN»—, así
    // que al entrar no hay cómo volver.
    montar()
    for (const p of PANTALLAS.filter((x) => x.id !== 'preview')) {
      await userEvent.click(screen.getByRole('button', { name: p.nombre }))
      expect(screen.queryByText('Pendiente')).toBeNull()
      expect(screen.queryByText(/Se desbloquea con/)).toBeNull()
    }
  })

  it('B4 dice que está construida en otra pantalla, no «pendiente»', async () => {
    // **Decirle «Pendiente» a algo hecho miente sobre trabajo hecho.** El binder
    // existe desde F4.10 y vive dentro de B1 porque configurar un panel exige
    // tenerlo elegido. Es una desviación de §7.2 y va dicha, no escondida.
    montar()
    await userEvent.click(screen.getByRole('button', { name: 'Binder de métrica' }))

    expect(screen.getByText('Está construida, en otra pantalla')).toBeInTheDocument()
    expect(screen.queryByText('Pendiente')).toBeNull()
    expect(screen.getByText(/exige tenerlo elegido/)).toBeInTheDocument()
  })

  it('B1 NO se declara pendiente · está construida', async () => {
    montar()
    expect(screen.queryByText('Pendiente')).toBeNull()
    expect(await screen.findByLabelText('Cliente')).toBeInTheDocument()
  })

  it('B2 ya NO se declara pendiente · la decisión de diseño llegó', async () => {
    // Estuvo bloqueada mientras la interacción del arrastre no estaba
    // declarada. La propuesta se aprobó el 2026-09-15 y se revisó contra el
    // frame `B2` del `.pen`, así que F4.9 se tomó.
    montar()
    await userEvent.click(screen.getByRole('button', { name: 'Canvas' }))
    expect(screen.queryByText('Pendiente')).toBeNull()
    expect(screen.queryByText(/decisión de diseño/i)).toBeNull()
  })

  it('B6 está CABLEADA · ni «Pendiente» ni «en construcción»', async () => {
    // **ESTA PRUEBA AFIRMÓ DOS COSAS FALSAS, UNA DESPUÉS DE LA OTRA.** Primero
    // que el cable no traía autor ni diff —lo trae desde `168a761`—, y después,
    // ya corregida, que «la pantalla sigue sin construirse» mientras
    // `VersionHistory`, `VersionCard` y `cambios` estaban escritos y probados y
    // sólo faltaba montarlos. Un aviso que describe el estado del TRABAJO y no
    // el del producto es un defecto, y el cliente lo leía.
    //
    // Lo que se pinta ahora es el vacío con salida de la propia pantalla, porque
    // sin versión elegida no hay dashboard del que pedir el historial.
    montar()
    await userEvent.click(screen.getByRole('button', { name: 'Historial de versiones' }))

    expect(screen.queryByText('Pendiente')).toBeNull()
    expect(screen.queryByText(/en construcción/i)).toBeNull()
    expect(screen.getByText(/ELEGÍ UNA VERSIÓN/i)).toBeInTheDocument()
    // Y sigue sin culpar al servicio, que es la corrección que ya estaba.
    expect(screen.queryByText(/LayoutVersion/)).toBeNull()
    expect(screen.queryByText(/B4\.10/)).toBeNull()
  })

  it('B3 dice que está construida en otra pantalla, no «pendiente»', async () => {
    // Misma resolución que el binder, y por la misma razón: elegir el gráfico de
    // un panel exige tener el panel elegido. Decirle «Pendiente» a algo hecho
    // miente sobre trabajo hecho — y acá además nombraba una ruta inexistente
    // que sí existe desde `b6f0e09`.
    montar()
    await userEvent.click(screen.getByRole('button', { name: 'Selector de gráfico' }))

    expect(screen.getByText('Está construida, en otra pantalla')).toBeInTheDocument()
    expect(screen.queryByText('Pendiente')).toBeNull()
    expect(screen.queryByText(/config\/plots/)).toBeNull()
  })
})

describe('el chrome NO es uniforme · corregido contra el `.pen`', () => {
  it('declara las cuatro formas, y cuál usa cada pantalla', () => {
    // Del dato y no del render. B1 tomó prestada `composicion` hasta que F4.9
    // mueva la composición a B2 — ahí vuelve a `identidad`, y esta prueba lo
    // dice antes que ninguna otra.
    const formas = Object.fromEntries(PANTALLAS.map((p) => [p.id, p.chrome]))
    expect(formas).toEqual({
      contexto: 'composicion',
      canvas: 'composicion',
      grafico: 'composicion',
      metrica: 'composicion',
      preview: 'ninguno',
      historial: 'contexto',
    })
  })

  it('B5 NO lleva chrome · «SIN CHROME DE EDICIÓN»', async () => {
    montar()
    expect(screen.getByRole('navigation', { name: 'Builder' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Vista previa por rol' }))
    expect(screen.queryByRole('navigation', { name: 'Builder' })).toBeNull()
  })

  it('el contexto es PERSISTENTE · se ve al cambiar de pantalla', async () => {
    // La razón de la corrección: con el contexto en una barra del cuerpo, al
    // salir de B1 se perdía de vista sobre qué cliente y qué rol se componía.
    //
    // **Acotado a la cabecera**, porque B1 también nombra al cliente en su
    // selector: sin acotar, la prueba pasaría por el selector y no por el
    // chrome, que es justo lo que se quiere verificar.
    montar()
    const cabecera = () => within(screen.getByRole('banner'))
    expect(await cabecera().findByText('Under Armour México')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Historial de versiones' }))
    expect(cabecera().getByText('Under Armour México')).toBeInTheDocument()
    // Y en esa pantalla el selector de B1 ya no está: el nombre solo puede
    // venir del chrome.
    expect(screen.queryByLabelText('Cliente')).toBeNull()
  })

  it('cada dato del contexto lleva su rótulo', async () => {
    // Tres nombres seguidos no dicen cuál es cuál.
    montar()
    await screen.findByRole('banner')
    await userEvent.click(screen.getByRole('button', { name: 'Historial de versiones' }))

    const cabecera = within(screen.getByRole('banner'))
    for (const rotulo of ['Cliente', 'Rol', 'Pestaña']) {
      expect(cabecera.getByText(rotulo)).toBeInTheDocument()
    }
  })
})
