// @vitest-environment jsdom

/** La superficie de administración · F4.1 y F4.2
 *
 *  **Las pruebas citan §7.3 de `design.md`, no miran la implementación.** Es la
 *  lección del 2026-08-20: 184 pruebas en verde sobre un colapso responsive que
 *  violaba §3.1 de tres formas, porque estaban escritas desde el código.
 */
import { readFileSync } from 'node:fs'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http } from 'msw'
import { describe, expect, it } from 'vitest'
import { Admin } from '@/surfaces/admin/Admin'
import { PANTALLAS } from '@/surfaces/admin/pantallas'
import { ok } from '../../mocks/handlers'
import { server } from '../../mocks/server'

const API = '*/api/v1'

const tenants = [
  { id: 't-1', name: 'Under Armour México' },
  { id: 't-2', name: 'Keralty Colombia' },
]

function montar() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      {/* **En un router, porque el contenedor navega.** Desde el 2026-09-16
          `Admin`/`Builder` ofrecen «volver a la consola» y eso es `useNavigate`,
          que fuera de un router lanza. Montarlos sin él probaba una app que la
          real no es. */}
      <MemoryRouter>
        <Admin />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('§7.3 · las cinco pantallas y su alcance', () => {
  it('declara las cinco, en el orden de la tabla', () => {
    // Del dato y no del render: si alguna se agrega o se renombra en el diseño,
    // esto lo dice antes que una prueba de pantalla.
    expect(PANTALLAS.map((p) => p.nombre)).toEqual([
      'Clientes y plataforma',
      'Ficha de cliente',
      'Usuarios',
      'Catálogo de métricas',
      'Salud de feeds',
    ])
  })

  it('A1 y A3 son de PLATAFORMA · las otras tres de tenant', () => {
    // §7.3: «A3 cruza clientes porque su regla dura —el tenant de un usuario no
    // se edita— solo es visible cuando el tenant es una columna que se compara,
    // no un contexto implícito». Es la que parece incoherente y no lo es.
    const alcances = Object.fromEntries(PANTALLAS.map((p) => [p.id, p.alcance]))
    expect(alcances).toEqual({
      clientes: 'plataforma',
      cliente: 'tenant',
      usuarios: 'plataforma',
      catalogo: 'tenant',
      feeds: 'tenant',
    })
  })

  it('una pantalla de plataforma NO muestra selector de cliente', async () => {
    // «A1 y A3: sin selector de tenant». Un selector ahí sugeriría que se está
    // mirando un cliente cuando la pantalla cruza todos.
    server.use(http.get(`${API}/admin/tenants`, () => ok(tenants)))
    montar()
    await screen.findByText('Under Armour México')

    expect(screen.queryByLabelText('Cliente')).toBeNull()
    expect(screen.getByText(/Alcance · plataforma/)).toBeInTheDocument()
  })

  it('una pantalla de tenant SÍ lo muestra, con los clientes', async () => {
    server.use(http.get(`${API}/admin/tenants`, () => ok(tenants)))
    montar()
    await screen.findByText('Under Armour México')

    await userEvent.click(screen.getByRole('button', { name: 'Ficha de cliente' }))

    const selector = await screen.findByLabelText('Cliente')
    expect(within(selector).getByText('Keralty Colombia')).toBeInTheDocument()
    expect(screen.getByText(/Alcance · cliente/)).toBeInTheDocument()
  })
})

describe('§7.3 · la regla dura · el vocabulario de infraestructura no se muestra', () => {
  it('ni base, ni rol técnico, ni warehouse, ni llave', async () => {
    // «Esa capa la opera el equipo interno y ningún usuario de administración
    // actúa sobre ella; mostrarla sugiere una acción que no existe.»
    //
    // El tenant tiene en la base su cuenta de Snowflake, su rol y su llave
    // privada. La prueba pregunta por el vocabulario y no por un campo: lo que
    // la regla prohíbe es que aparezca, venga de donde venga.
    server.use(
      http.get(`${API}/admin/tenants`, () =>
        ok([{ ...tenants[0], snowflake_account: 'MYORG-ACC', snowflake_role: 'SYNAPSE_ROLE' }]),
      ),
    )
    const { container } = montar()
    await screen.findByText('Under Armour México')

    const texto = container.textContent ?? ''
    for (const prohibido of ['snowflake', 'warehouse', 'grant', 'private_key', 'SYNAPSE_ROLE']) {
      expect(texto.toLowerCase()).not.toContain(prohibido.toLowerCase())
    }
  })
})

describe('F4.2 · la lista de clientes', () => {
  it('lista los clientes con su nombre', async () => {
    server.use(http.get(`${API}/admin/tenants`, () => ok(tenants)))
    montar()
    expect(await screen.findByText('Under Armour México')).toBeInTheDocument()
    expect(screen.getByText('Keralty Colombia')).toBeInTheDocument()
  })

  it('DECLARA las columnas que §7.3 pide y el cable no trae', async () => {
    // La mitad que importa: `GET /admin/tenants` devuelve `id` y `name`, y el
    // diseño pide seis columnas. Omitir las cuatro que faltan daría una tabla
    // que parece completa — quien la mire concluiría que no hay nada que saber
    // del estado de un cliente.
    server.use(http.get(`${API}/admin/tenants`, () => ok(tenants)))
    const { container } = montar()
    await screen.findByText('Under Armour México')

    const texto = container.textContent ?? ''
    expect(texto).toContain('Faltan 5 columnas')
    for (const columna of ['estado', 'vertical', 'usuarios', 'última publicación']) {
      expect(texto).toContain(columna)
    }
    // §8: estado, razón, y qué lo desbloquea.
    expect(texto).toContain('B4.1')
  })

  it('sin clientes invita a actuar, y NO se sale de la tabla', async () => {
    // «Las columnas siguen diciendo qué habría acá» · las tres notas de vacío
    // del `.pen`. Una pantalla que se vacía entera pierde lo único que explicaba
    // qué falta.
    server.use(http.get(`${API}/admin/tenants`, () => ok([])))
    montar()

    expect(await screen.findByText(/Ningún cliente dado de alta todavía/)).toBeInTheDocument()
    const tabla = screen.getByRole('table')
    expect(within(tabla).getByText('Cliente')).toBeInTheDocument()
    expect(within(tabla).getByText('Acción')).toBeInTheDocument()
  })
})

describe('las pantallas que todavía no se pueden construir', () => {
  it('dicen qué las desbloquea en vez de mostrarse vacías', async () => {
    // Una pantalla que se declara pendiente no es lo mismo que una que no está:
    // la primera dice qué falta, que es lo que §8 pide de cualquier estado.
    server.use(http.get(`${API}/admin/tenants`, () => ok(tenants)))
    montar()
    await screen.findByText('Under Armour México')

    await userEvent.click(screen.getByRole('button', { name: 'Salud de feeds' }))

    expect(await screen.findByText(/Pendiente/)).toBeInTheDocument()
    expect(screen.getByText(/frescura por feed/)).toBeInTheDocument()
    expect(screen.getByText(/Se desbloquea con/)).toBeInTheDocument()
  })

  it('la ficha de cliente YA no se declara pendiente · F4.3', async () => {
    // Desde que B4.8 está escrita en el fork, A2 se construye contra su cable.
    // Lo que queda pendiente es que ese código se despliegue, y eso lo dice la
    // propia pantalla cuando el 404 llega.
    server.use(
      http.get(`${API}/admin/tenants`, () => ok(tenants)),
      http.get(`${API}/admin/tenants/:id/roles/composition`, () => ok([])),
      http.get(`${API}/admin/tenants/:id/layouts`, () => ok([])),
      http.get(`${API}/admin/tenants/:id/catalog`, () => ok([])),
    )
    montar()
    await screen.findByText('Under Armour México')

    await userEvent.click(screen.getByRole('button', { name: 'Ficha de cliente' }))
    expect(await screen.findByRole('button', { name: 'Nuevo rol' })).toBeInTheDocument()
    expect(screen.queryByText('Pendiente')).toBeNull()
  })
})

describe('un 403 dice que falta el rol, no «error del sistema»', () => {
  it('nombra la causa concreta', async () => {
    // Es el caso probable: estas rutas piden rol `admin`, y un `planner` que
    // abra `/admin` no está ante un fallo sino ante un permiso que no tiene.
    server.use(
      http.get(`${API}/admin/tenants`, () =>
        new Response(JSON.stringify({ success: false, error: 'forbidden' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    )
    montar()
    await waitFor(() =>
      expect(screen.getByText(/pide rol de administrador/)).toBeInTheDocument(),
    )
  })
})

describe('«Ver ficha» abre el cliente que se cliqueó · 2026-09-25', () => {
  /** **El defecto que cierra.** `onAbrir={() => setPantalla('cliente')}` tiraba
   *  el `id` que `TenantList` le pasaba, así que `activo` caía siempre en
   *  `lista[0]` y la ficha era la del PRIMER cliente, hubiera cliqueado el que
   *  fuera.
   *
   *  **Se ve perfectamente bien con un solo cliente en la base**, que es como
   *  estuvo todo este tiempo. Apareció al abrir admin contra el servicio real,
   *  que hoy tiene dos tenants: la pantalla mostraba doce métricas de semilla
   *  cuando el cliente elegido tiene dieciocho.
   *
   *  Es la familia del botón muerto de `CLAUDE.md` con una vuelta más: **el
   *  callback SÍ dispara**, así que la regla «verificar que el callback dispare»
   *  no alcanza. Lo que hay que verificar es que **llega el argumento correcto**,
   *  y la única forma honesta es mirar a qué tenant le pide los datos.
   */
  it('pide el catálogo del SEGUNDO cliente, no el del primero', async () => {
    const pedidos: string[] = []
    server.use(
      http.get(`${API}/admin/tenants`, () => ok(tenants)),
      http.get(`${API}/admin/tenants/:id/catalog`, ({ params }) => {
        pedidos.push(String(params['id']))
        return ok([])
      }),
      http.get(`${API}/admin/tenants/:id/layouts`, () => ok([])),
      http.get(`${API}/admin/tenants/:id/roles/composition`, () => ok([])),
    )
    montar()

    const fila = await screen.findByText('Keralty Colombia')
    await userEvent.click(
      within(fila.closest('tr') as HTMLElement).getByRole('button', { name: /ver ficha/i }),
    )

    // **La aserción es a quién se le piden los datos.** Que el título cambie a
    // «Ficha de cliente» pasaba igual con el defecto puesto.
    await waitFor(() => expect(pedidos).toContain('t-2'))

    // Y la otra mitad, que son dos cosas y no una: el botón **elige** un cliente
    // **y navega**. Sin esto, dejar de navegar sobrevivía a la mutación —el
    // catálogo se pide igual, porque su hook precalienta el cache a propósito.
    expect(await screen.findByRole('heading', { name: /ficha de cliente/i })).toBeVisible()
  })
})

describe('§ANCLA:ANCHO-1 · admin declara ancho mínimo, no colapso', () => {
  /** **La regla citada**, principio 4 de `design.md`: «Ancho mínimo por
   *  superficie: 1280 en administración, 1600 en el builder». Y su razón, que es
   *  lo que la vuelve una regla y no una preferencia: «las tablas y el lienzo de
   *  composición no son grids y **perdían contenido en silencio** (PS-5)».
   *
   *  **El builder tenía su prueba desde siempre y admin no**, encontrado al
   *  barrer el responsive el 2026-09-25. El comportamiento era correcto —medido
   *  en el navegador: abajo de 1280 se queda en 1280 y aparece scroll, sin
   *  perder columnas— pero **nada lo sostenía**.
   *
   *  Y el modo de falla lo describe el propio comentario del builder: un
   *  `min-w-[1280px]` interpolado **compila y no pinta nada**, porque Tailwind
   *  poda lo que su escáner no ve escrito. Es el silencio de `text-labell`: se
   *  vería como una pantalla que simplemente se achica.
   */
  it('el chrome pinta `min-w-[1280px]`, escrito y no interpolado', async () => {
    server.use(http.get(`${API}/admin/tenants`, () => ok(tenants)))
    const { container } = montar()
    await screen.findByText('Under Armour México')

    expect(container.querySelector('.min-w-\\[1280px\\]')).not.toBeNull()
  })

  it('el mínimo está ESCRITO, no interpolado · en las dos superficies', () => {
    /** **Lo que jsdom no puede ver**, y por eso va estático. Una clase
     *  interpolada —`min-w-[${ancho}px]`— produce el mismo atributo en el DOM,
     *  así que la aserción de arriba pasa igual; lo que no produce es el CSS,
     *  porque **Tailwind poda lo que su escáner no ve escrito**. En una prueba
     *  no hay Tailwind, así que el efecto no existe y no se puede medir.
     *
     *  Lo encontró una mutación: interpolar la clase sobrevivía. Y el mismo
     *  punto ciego tiene la prueba del builder, cuyo comentario afirma cazarlo
     *  — por eso esta mira los dos archivos y no sólo el de admin.
     */
    const fuentes: [string, string][] = [
      ['src/surfaces/admin/AdminChrome.tsx', 'min-w-[1280px]'],
      ['src/surfaces/builder/BuilderChrome.tsx', 'min-w-[1600px]'],
    ]
    for (const [ruta, clase] of fuentes) {
      const codigo = readFileSync(ruta, 'utf-8')
      expect(codigo).toContain(clase)
      // Ninguna forma interpolada de la utilidad: es la que compila y no pinta.
      expect(codigo).not.toMatch(/min-w-\[\$\{/)
    }
  })

  it('NO colapsa · §4 pide ancho mínimo, no menos columnas', async () => {
    // El ámbito, igual que en el builder: si alguien «arregla» el scroll
    // agregando un colapso, la tabla vuelve a perder columnas en silencio, que
    // es exactamente lo que PS-5 registró.
    server.use(http.get(`${API}/admin/tenants`, () => ok(tenants)))
    const { container } = montar()
    await screen.findByText('Under Armour México')

    for (const clase of ['grid-cols-6', 'grid-cols-1', 'max-w-full']) {
      expect(container.querySelector(`.${clase}`)).toBeNull()
    }
  })
})
