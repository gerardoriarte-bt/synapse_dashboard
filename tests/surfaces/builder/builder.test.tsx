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
import { render, screen, waitFor, within } from '@testing-library/react'
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
function montar(extra: Parameters<typeof server.use> = []) {
  // **Los de la prueba primero**: MSW prueba en orden, y así un `extra` puede
  // pisar un default —`conVersion` pisa la lista vacía de layouts—.
  server.use(
    ...extra,
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

/** **Un cliente con una versión** · 2026-10-06. «Vista previa» sólo se ofrece
 *  con una versión elegida —sin ella no hay nada que previsualizar—, así que las
 *  pruebas que entran a B5 la necesitan. El layout del cable, con `dashboard_id`
 *  para que B6 tenga de qué pedir el historial. */
const VERSION = {
  id: 'l-1',
  tenant_id: 't-1',
  dashboard_id: 'd-1',
  status: 'draft',
  version_id: 'v1',
  published_at: null,
}
const conVersion = [
  http.get(`${API}/admin/tenants/:id/layouts`, () => ok([VERSION])),
  http.get(`${API}/admin/layouts/l-1`, () => ok({ layout: VERSION, tabs: [] })),
  http.get(`${API}/admin/dashboards/:id/publications`, () => ok([])),
]

/** **La cabecera del chrome, no cualquier `banner`.** Desde el 2026-10-06 B1
 *  abre con su propio `<header>` —el título «¿Sobre qué se va a componer?»— y
 *  jsdom lo cuenta como `banner` aunque esté dentro de `main`. La del chrome es
 *  la que contiene la navegación del builder. */
async function cabeceraDelChrome() {
  const nav = await screen.findByRole('navigation', { name: 'Builder' })
  const header = nav.closest('header')
  if (header === null) throw new Error('la navegación del builder no está en una cabecera')
  return within(header)
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
    const { container } = montar(conVersion)
    expect(container.querySelector('.min-w-\\[1600px\\]')).not.toBeNull()

    // Desde el 2026-10-06 B5 se abre con el botón del chrome, no con una pestaña.
    await userEvent.click(await screen.findByRole('button', { name: 'Vista previa' }))
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

  it('el chrome ya NO dice el ancho · es regla de quien implementa', async () => {
    // **Era al revés hasta el 2026-10-06**: esta prueba exigía «Ancho 1600 ·
    // lienzo 1:1 a 1200 más 300 de biblioteca» siempre a la vista. La auditoría
    // de ese día (§3.4) lo sacó: es la regla de §4 para quien implementa, no
    // para quien compone. El número sigue en `pantallas.ts` —verificado arriba—
    // y la clase que lo aplica, también arriba.
    montar()
    const cabecera = await cabeceraDelChrome()
    for (const pantalla of ['Contexto de edición', 'Canvas', 'Historial de versiones']) {
      await userEvent.click(screen.getByRole('button', { name: pantalla }))
      expect(cabecera.queryByText(/1600|lienzo 1:1|biblioteca/)).toBeNull()
    }
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
    //
    // **Desde el 2026-10-06 sólo tres llevan pestaña** (D3), así que se recorren
    // esas por la navegación y B5 por su botón, al final. B3 y B4 no tienen
    // forma de abrirse: se cubre abajo que no estén en la navegación.
    montar(conVersion)
    for (const p of PANTALLAS.filter((x) => x.enNav)) {
      await userEvent.click(screen.getByRole('button', { name: p.nombre }))
      expect(screen.queryByText('Pendiente')).toBeNull()
      expect(screen.queryByText(/Se desbloquea con/)).toBeNull()
    }
    // B6 es de sólo lectura y no ofrece «Vista previa»: se vuelve a B1 primero.
    await userEvent.click(screen.getByRole('button', { name: 'Contexto de edición' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Vista previa' }))
    expect(screen.queryByText('Pendiente')).toBeNull()
    expect(screen.queryByText(/Se desbloquea con/)).toBeNull()
  })

  it('B3, B4 y B5 ya NO tienen pestaña en la navegación · D3', async () => {
    // **Reemplaza a «B4 dice que está construida en otra pantalla» y a su par de
    // B3** · D3 de `docs/AUDITORIA-2026-10-06-builder-contexto-y-canvas.md`.
    // Esas pestañas llevaban a un texto que decía que la pantalla estaba en
    // otra: el binder y el selector de gráfico viven en el inspector del canvas,
    // y la vista previa repetía el botón del chrome. Siguen declaradas en
    // `pantallas.ts` —`pen-pantallas` lo pide— pero no se navegan.
    montar()
    const nav = within(await screen.findByRole('navigation', { name: 'Builder' }))
    expect(nav.getAllByRole('button').map((b) => b.textContent)).toEqual([
      'Contexto de edición',
      'Canvas',
      'Historial de versiones',
    ])
    for (const fuera of ['Selector de gráfico', 'Binder de métrica', 'Vista previa por rol']) {
      expect(screen.queryByRole('button', { name: fuera })).toBeNull()
    }
    // El dato dice lo mismo que el render: la navegación sale de `enNav`.
    expect(PANTALLAS.filter((p) => p.enNav).map((p) => p.id)).toEqual(['contexto', 'canvas', 'historial'])
  })

  it('B5 se abre con el botón «Vista previa» del chrome', async () => {
    // La otra mitad de D3: sacarla de la navegación no puede dejarla sin
    // entrada. Se verifica que el botón LLEVE —el chrome desaparece, que es la
    // marca de B5—, no que exista.
    const { container } = montar(conVersion)
    await userEvent.click(await screen.findByRole('button', { name: 'Vista previa' }))
    expect(screen.queryByRole('navigation', { name: 'Builder' })).toBeNull()
    expect(container.querySelector('.min-w-\\[1440px\\]')).not.toBeNull()
  })

  it('B1 NO se declara pendiente · está construida', async () => {
    montar()
    expect(screen.queryByText('Pendiente')).toBeNull()
    expect(await screen.findByRole('heading', { name: '¿Sobre qué se va a componer?' })).toBeInTheDocument()
  })

  it('sin versión NO se ofrece «Vista previa» · no hay nada que previsualizar', async () => {
    // **Nuevo el 2026-10-06** (pedido humano). El botón llevaba a una pantalla
    // que sólo decía «elegí una versión». Con una versión vuelve: ver abajo.
    montar()
    await screen.findByText(/todavía no tiene versiones/)
    expect(screen.queryByRole('button', { name: 'Vista previa' })).toBeNull()
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
    montar(conVersion)
    expect(screen.getByRole('navigation', { name: 'Builder' })).toBeInTheDocument()

    await userEvent.click(await screen.findByRole('button', { name: 'Vista previa' }))
    expect(screen.queryByRole('navigation', { name: 'Builder' })).toBeNull()
  })

  it('el cliente está en la cabecera, en TODAS las pantallas · y una sola vez', async () => {
    // **Cambió el 2026-10-06** (pedido humano: «en el header se debe destacar
    // bien el tenant que se está trabajando»). El cliente se elegía en el cuerpo
    // de B1 y se repetía como texto en la cabecera de las demás. Ahora vive
    // sólo en la cabecera, en las tres pantallas.
    montar()
    for (const pantalla of ['Contexto de edición', 'Canvas', 'Historial de versiones']) {
      await userEvent.click(screen.getByRole('button', { name: pantalla }))
      const cabecera = await cabeceraDelChrome()
      expect(cabecera.getByText('Cliente')).toBeInTheDocument()
      expect(await cabecera.findByText('Under Armour México')).toBeInTheDocument()
      // Ningún segundo lugar lo dice.
      expect(screen.getAllByText('Under Armour México')).toHaveLength(1)
    }
  })

  it('con varios clientes se ELIGE en la cabecera, y el cambio se aplica', async () => {
    const pedidos: string[] = []
    montar([
      http.get(`${API}/admin/tenants`, () =>
        ok([
          { id: 't-1', name: 'Under Armour México' },
          { id: 't-2', name: 'Terpel Colombia' },
        ]),
      ),
      http.get(`${API}/admin/tenants/:id/layouts`, ({ params }) => {
        pedidos.push(String(params['id']))
        return ok([])
      }),
    ])
    const selector = await (await cabeceraDelChrome()).findByRole('combobox', { name: 'Cliente' })
    await userEvent.selectOptions(selector, 't-2')
    await waitFor(() => expect(pedidos).toContain('t-2'))
    expect(selector).toHaveValue('t-2')
  })

  it('B1 NO repite el rol en la cabecera · es el control del cuerpo', async () => {
    // **Nuevo el 2026-10-06** · auditoría §2.1: el chrome repetía arriba lo que
    // el cuerpo de B1 tiene como control.
    montar(conVersion)
    const cabecera = await cabeceraDelChrome()
    // Que la cabecera tenga sus acciones: sin esto, una cabecera vacía pasaría
    // la negación de abajo.
    expect(await cabecera.findByRole('button', { name: 'Vista previa' })).toBeInTheDocument()
    expect(cabecera.queryByText('Todos los roles')).toBeNull()
  })

  it('cada dato del contexto lleva su rótulo · Cliente y Rol, sin Pestaña', async () => {
    // Dos nombres seguidos no dicen cuál es cuál. **La pestaña salió el
    // 2026-10-06**: en el canvas es el selector «Componiendo» del cuerpo, y
    // repetirla arriba era decirla dos veces.
    montar()
    await cabeceraDelChrome()

    for (const pantalla of ['Canvas', 'Historial de versiones']) {
      await userEvent.click(screen.getByRole('button', { name: pantalla }))
      const cabecera = await cabeceraDelChrome()
      expect(cabecera.getByText('Cliente')).toBeInTheDocument()
      expect(cabecera.getByText('Rol')).toBeInTheDocument()
      expect(cabecera.queryByText('Pestaña')).toBeNull()
      // Sin filtro de rol, la cabecera lo dice: no «—», que se leería como
      // «ninguno».
      expect(cabecera.getByText('Todos los roles')).toBeInTheDocument()
    }
  })

  it('el rol elegido en B1 viaja a la cabecera del canvas', async () => {
    // **Nuevo el 2026-10-06** · D5: el rol es un filtro, y al salir de B1 hay
    // que seguir viendo sobre qué rol se compone.
    montar([
      http.get(`${API}/admin/tenants/:id/roles/composition`, () =>
        ok([
          { id: 'r-1', tenant_id: 't-1', name: 'CEO', tab_ids: [], hidden_metric_ids: [], layout_overrides: {}, user_count: 1 },
        ]),
      ),
    ])
    const rol = await screen.findByRole('group', { name: 'Rol' })
    await userEvent.click(within(rol).getByRole('button', { name: 'CEO' }))

    await userEvent.click(screen.getByRole('button', { name: 'Canvas' }))
    const cabecera = await cabeceraDelChrome()
    expect(cabecera.getByText('CEO')).toBeInTheDocument()
    expect(cabecera.queryByText('Todos los roles')).toBeNull()
  })
})
