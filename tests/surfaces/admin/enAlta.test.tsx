// @vitest-environment jsdom

/** A2 · la ficha de un cliente en alta · §PEN:A2 · F5.20
 *
 *  El `.pen` le dedica un frame entero —`A2 · Ficha · tenant en alta`— y su nota
 *  dice qué retrata: «axo_mx vive en SYNAPSE_TENANTS con roles: [] y A1 ya lo
 *  lista, pero A2 no sabía dibujarlo: la banda de roles quedaba en blanco sin
 *  explicar nada».
 *
 *  ── SE MONTA DESDE `Admin`, Y NO DESDE LOS COMPONENTES ──────────────────────
 *
 *  Porque lo único que puede romperse sin que nadie lo vea es **el paso de las
 *  props**. `Admin → Cliente → los tres bloques` son tres saltos y `Cliente` usa
 *  `...paraRoles` justamente porque una prop se perdió en ese punto el
 *  2026-09-22 y no lo vio el compilador. Rendir `TenantIdentity` directo con las
 *  props a mano verifica el componente y esconde la frontera, que es la lección
 *  de `graficoViaja`: nueve pruebas rendían el cuerpo y ninguna seguía el id.
 *
 *  ── LOS FIXTURES ESTÁN MEDIDOS, NO INVENTADOS ───────────────────────────────
 *
 *  Los trece campos de `/admin/tenants` y los tres valores de `catalog_version`
 *  salen de medir el servicio local el 2026-09-30. **Y el estado que esta
 *  pantalla dibuja no es alcanzable ahí**: los dos clientes sembrados tienen 3 y
 *  4 roles, y darlos de alta desde la pantalla no se puede. Por eso el caso
 *  existe acá y en el modo mock, y no contra el servicio.
 */
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http } from 'msw'
import { describe, expect, it } from 'vitest'
import { Admin } from '@/surfaces/admin/Admin'
import { ok } from '../../mocks/handlers'
import { server } from '../../mocks/server'

const API = '*/api/v1'

/** **Los trece campos de `TenantOption`**, con la FORMA medida el 2026-09-30
 *  contra el servicio local. `status` y `vertical` en vacío no es una foto: el
 *  servicio lo declara en su código —«siempre nil en v1»— y es lo que hace que la
 *  columna `VERTICAL` tenga que salir en un guión y no en blanco.
 *
 *  **Un valor NO está medido y conviene decirlo** · corregido en la auditoría del
 *  2026-09-30. Acá decía «copiados de la respuesta medida», y `currency: 'MXN'`
 *  no salió de ahí: los dos clientes sembrados vienen en `es-CO`/`COP`/`Bogota`
 *  por un default de columna —hay un mensaje escrito al backend por eso,
 *  `docs/MENSAJE-2026-09-29-backend-tenant-colombiano.md`—. El `MXN` es el del
 *  dibujo, que ahí sí lo escribe, y está a propósito sobre un `locale` colombiano
 *  para que se vea que la columna sale del dato y no de una constante. El valor
 *  está bien; la procedencia estaba de más, y es la clase de cita que
 *  `afirmaciones` no puede ver.
 *
 *  ── **EL `MXN` ES DE ESTA VARIANTE Y DE NINGUNA OTRA** · 2026-10-01 ──────────
 *
 *  La línea de arriba decía «el `MXN` es el del dibujo» sin decir de **qué**
 *  pantalla, y eso casi cuesta cambiar este fixture al revés. Contados sobre el
 *  archivo: el `.pen` tiene **63 nodos con moneda y 62 dicen `USD`**. El único
 *  `MXN` es éste —`A2 · Ficha · tenant en alta`—, que dibuja **otro cliente
 *  dándose de alta**; la ficha del cliente vivo, `A2 · Ficha de cliente`,
 *  escribe `USD`.
 *
 *  Así que el `MXN` acá **no se toca**: es lo que la pantalla de alta dibuja, y
 *  es justamente lo que prueba que la columna sale del dato. Lo que sí cambió
 *  son los fixtures de la CONSOLA, que decían `MXN` para UA y van en `USD` —
 *  decidido el 2026-10-01, y las tres fuentes normativas coinciden. */
const tenants = [
  {
    id: 't-1',
    name: 'Grupo Axo',
    label: '',
    locale: 'es-CO',
    currency: 'MXN',
    timezone: 'America/Bogota',
    user_count: 0,
    last_published_at: null,
    worst_feed_status: 'unknown',
    worst_feed_freshness_hours: null,
    status: null,
    vertical: null,
    created_at: '2026-09-22T09:18:45.919012-05:00',
  },
]

/** Tres versiones distintas en tres filas · los valores del cliente `e65f81ae-…`,
 *  que tiene 1, 3 y 4 entre sus 21 métricas. **Con las 12 del otro cliente —todas
 *  en 1— esta prueba no distinguiría el máximo de la primera fila.** */
const metricas = [1, 4, 3].map((v, i) => ({
  id: `m-${String(i)}`,
  tenant_id: 't-1',
  key: `metrica_${String(i)}`,
  name: `Métrica ${String(i)}`,
  shape: 'scalar',
  family: 'demand',
  layer: 'GOLD',
  source: 'ERP',
  base: '18.240 SKU activos',
  min_grain: 'day',
  dimensions: [],
  catalog_version: v,
}))

const roles = [
  {
    id: 'r-1',
    tenant_id: 't-1',
    name: 'admin',
    tab_ids: [],
    hidden_metric_ids: [],
    layout_overrides: {},
    user_count: 0,
  },
]

const agente = {
  id: 'a-1',
  tenant_id: 't-1',
  role_id: 'r-1',
  role_name: 'admin',
  name: 'SYNAPSE_UA',
  snowflake_cortex_agent_name: 'SYNAPSE_AGENT_CEO',
  semantic_views: ['SYNAPSE_METRIC_CATALOG'],
  is_active: true,
  created_at: '2026-08-01T10:00:00Z',
  updated_at: '2026-09-02T10:00:00Z',
}

/** El escenario se declara por lo que la PANTALLA distingue —roles, catálogo y
 *  agentes— y no ruta por ruta, que es lo que hace que una prueba se lea. */
function base({
  conRoles = false,
  conCatalogo = false,
  conAgente = false,
  clientes = tenants,
}: {
  conRoles?: boolean
  conCatalogo?: boolean
  conAgente?: boolean
  /** **Va por parámetro y no por un `server.use` aparte**, y la razón está
   *  medida: `server.use` antepone, así que una llamada POSTERIOR gana sobre una
   *  anterior. Un override de `/admin/tenants` escrito antes de `base()` **nunca
   *  se aplica**, y la prueba pasa por el motivo equivocado — lo encontró una
   *  mutación que sobrevivía, en `roles.test.tsx`, y volvió a pasar acá. */
  clientes?: unknown[]
} = {}) {
  server.use(
    http.get(`${API}/admin/tenants`, () => ok(clientes)),
    http.get(`${API}/admin/tenants/:id/roles/composition`, () => ok(conRoles ? roles : [])),
    http.get(`${API}/admin/tenants/:id/catalog`, () => ok(conCatalogo ? metricas : [])),
    http.get(`${API}/admin/tenants/:id/agents`, () => ok(conAgente ? [agente] : [])),
    // Sin layout publicado, que es el estado normal de un cliente en alta.
    http.get(`${API}/admin/tenants/:id/layouts`, () => ok([])),
    http.get(`${API}/admin/tenants/:id/feeds`, () => ok([])),
    http.get(`${API}/admin/users`, () => ok({ users: [], total: 0, tenants: 0 })),
  )
}

function montar() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <Admin />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

/** Abrir la ficha es lo que hace un super-admin: elegir la pantalla en el navbar.
 *  Se espera el rótulo del bloque nuevo, que es lo primero que la ficha pinta. */
async function abrirFicha() {
  await screen.findByRole('button', { name: /^Grupo Axo · / })
  await userEvent.click(screen.getByRole('button', { name: /^Grupo Axo · / }))
  await screen.findByText('Identidad del tenant')
}

/** El valor que está debajo de un rótulo de columna · las dos mitades de un
 *  campo son hermanas dentro de la misma celda, así que se busca por el padre.
 *  Sin esto, «—» habría que buscarlo entre siete guiones iguales.
 *
 *  **Se busca DENTRO de la tarjeta de identidad y no en toda la pantalla** ·
 *  agregado en la auditoría del 2026-09-30. `Estado` es también un encabezado de
 *  la tabla de agentes —`AgentConfig.tsx:122`—, así que el `getByText` global
 *  estaba a una prueba de romperse **por ambigüedad y no por el defecto**: hoy es
 *  único sólo porque ninguna prueba combina roles y agentes con `celda()`, que es
 *  una coincidencia del escenario y no una propiedad de la pantalla. Un ayudante
 *  que falla por su propia resolución esconde lo que venía a medir. */
function celda(rotulo: string): HTMLElement {
  const identidad = screen.getByText('Identidad del tenant').closest('section') as HTMLElement
  const r = within(identidad).getByText(rotulo)
  return r.closest('div')?.parentElement as HTMLElement
}

describe('el estado de alta · el chip y la columna, las DOS mitades', () => {
  it('sin roles y sin catálogo pinta EN ALTA', async () => {
    base()
    montar()
    await abrirFicha()

    expect(await screen.findByText('Bloqueado')).toBeInTheDocument()
    // **Dos veces y no una**: el chip al lado del nombre y el valor de la
    // columna. El dibujo pinta los dos, con el mismo texto y en dos roles
    // distintos —uno marca, el otro informa—, y `Note` pone el chip en
    // mayúsculas sin cambiar el literal.
    expect(screen.getAllByText('En alta')).toHaveLength(2)
    // Y que uno de los dos sea el de la columna, que es el que puede faltar.
    expect(celda('Estado').textContent).toContain('En alta')
  })

  it('con roles y catálogo NO pinta el chip, y la columna dice Activo', async () => {
    // **La segunda mitad es la que importa.** Un chip que se pinta siempre pasa
    // la primera prueba y dice «en alta» de todos los clientes.
    base({ conRoles: true, conCatalogo: true })
    montar()
    await abrirFicha()

    await waitFor(() => {
      expect(celda('Estado').textContent).toContain('Activo')
    })
    expect(screen.queryAllByText('En alta')).toHaveLength(0)
  })
})

describe('la versión del catálogo · derivada, y atada a la pantalla', () => {
  it('sin métricas sale en un guión', async () => {
    base()
    montar()
    await abrirFicha()

    await waitFor(() => {
      expect(celda('Catalog version').textContent).toContain('—')
    })
    expect(celda('Catalog version').textContent).not.toContain('v0')
  })

  it('con métricas en 1, 3 y 4 sale v4', async () => {
    // **Ésta es la que ata la derivación a la pantalla.** Sin ella `alta.ts`
    // puede estar perfecto y el componente leer la primera fila: la prueba de la
    // derivación pasaría igual.
    base({ conRoles: true, conCatalogo: true })
    montar()
    await abrirFicha()

    await waitFor(() => {
      expect(celda('Catalog version').textContent).toContain('v4')
    })
  })
})

describe('las dos columnas sin dato, y son dos casos distintos', () => {
  it('VERTICAL y PLANTILLA salen en un guión, y la falta se declara', async () => {
    base()
    montar()
    await abrirFicha()

    // El campo existe y llega vacío. **Un guión y no una cadena vacía**, que se
    // leería como un valor.
    expect(celda('Vertical').textContent).toContain('—')
    // El campo no existe y tampoco la ruta. La columna se queda igual: borrarla
    // pierde el literal del dibujo y nadie se acuerda de volver a ponerla.
    expect(celda('Plantilla').textContent).toContain('—')
    expect(
      screen.getByText(/Todavía no hay plantillas de vertical que un cliente pueda heredar/),
    ).toBeInTheDocument()
  })

  it('una vertical en cadena VACÍA también sale en un guión', async () => {
    // **Una cadena vacía se ve como un valor, no como una ausencia**, y el
    // servicio ya manda `label` así en los dos clientes: no es un caso
    // hipotético, es el que ya ocurre en el campo de al lado. Sin esta prueba,
    // leer `vertical` a secas pinta una celda en blanco que se lee como «esta
    // vertical no tiene nombre».
    base({ clientes: [{ ...tenants[0], vertical: '' }] })
    montar()
    await abrirFicha()

    expect(celda('Vertical').textContent).toContain('—')
  })

  it('la fecha de alta sale formateada, no como la manda el servicio', async () => {
    base()
    montar()
    await abrirFicha()

    // «22 sep 2026» para el instante medido. Falla si alguien pinta el valor
    // crudo, que es lo que compila.
    expect(celda('Alta').textContent).toContain('22 sep 2026')
    expect(celda('Alta').textContent).not.toContain('2026-09-22T09')
  })
})

describe('el acceso a datos · el estado REEMPLAZA el cuerpo', () => {
  it('con cero roles dice BLOQUEADO, con razón y desbloqueo', async () => {
    base()
    montar()
    await abrirFicha()

    expect(await screen.findByText('Bloqueado')).toBeInTheDocument()
    expect(screen.getByText('Todavía no configurado')).toBeInTheDocument()
    expect(
      screen.getByText(/sin rol no hay a quién otorgárselo/),
    ).toBeInTheDocument()
    expect(screen.getByText(/Lo desbloquea · definir el primer rol/)).toBeInTheDocument()

    // **Y la mitad negativa, que es la que pide §5.2**: un estado reemplaza el
    // cuerpo, no se suma a él. Sin esto, una rama nueva pegada arriba de la
    // tabla pasa en verde y la pantalla dice las dos cosas a la vez.
    expect(screen.queryByText(/todavía no tiene un agente configurado/)).toBeNull()
    // **Dentro del bloque del acceso** · desde el 2026-10-09 la ficha tiene
    // otra tabla, la de sus usuarios, y la regla es sobre ésta.
    expect(within(screen.getByRole('region', { name: 'Acceso a datos' })).queryByRole('table')).toBeNull()
  })

  it('con cero roles PERO con un agente cargado, sigue BLOQUEADO', async () => {
    // **Mata la mutación que ataría la condición a los agentes.** Con el fixture
    // obvio —cero roles y cero agentes— las dos condiciones dan lo mismo y la
    // mutación sobrevive. El dibujo dice «sin rol no hay a quién otorgarle
    // lectura»: la pregunta es por los roles.
    base({ conAgente: true })
    montar()
    await abrirFicha()

    expect(await screen.findByText('Bloqueado')).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Acceso a datos' })).queryByRole('table')).toBeNull()
  })

  it('con un rol, vuelve la tabla del acceso', async () => {
    base({ conRoles: true, conAgente: true })
    montar()
    await abrirFicha()

    const acceso = await screen.findByRole('region', { name: 'Acceso a datos' })
    expect(within(acceso).getByRole('table')).toBeInTheDocument()
    expect(screen.queryByText('Bloqueado')).toBeNull()
  })
})

describe('el vacío de roles · el CTA DISPARA, no sólo existe', () => {
  it('«Definir primer rol» abre el formulario de rol nuevo', async () => {
    /** **Se verifica que el callback dispare, no que el botón esté.** Un botón
     *  muerto se ve igual que uno que funciona, y el camino tiene un spread
     *  condicional en cada salto: `Admin → Cliente → RoleEditor → el vacío`. */
    base()
    montar()
    await abrirFicha()

    await userEvent.click(await screen.findByRole('button', { name: 'Definir primer rol' }))

    // El mismo efecto que «Nuevo rol»: el formulario abierto, con su campo.
    expect(screen.getByRole('button', { name: 'Guardar rol' })).toBeInTheDocument()
  })

  it('y es el ÚNICO CTA · la cabecera no repite el suyo', async () => {
    // **La divergencia atada por una aserción.** El frame de alta no dibuja CTA
    // en la cabecera de la sección; la ficha del cliente en servicio sí. Con los
    // dos, la pantalla ofrece dos botones idénticos a diez píxeles uno de otro —
    // se vio al abrirla, y sin esta aserción vuelve solo.
    base()
    montar()
    await abrirFicha()

    expect(await screen.findByRole('button', { name: 'Definir primer rol' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Nuevo rol' })).toBeNull()
  })

  it('«Definir primer rol» es LA primaria de la zona · 2026-10-06', async () => {
    // Relleno `acc`: es el siguiente paso del alta y la única acción del vacío.
    base()
    montar()
    await abrirFicha()

    const cta = await screen.findByRole('button', { name: 'Definir primer rol' })
    expect(cta.className).toContain('bg-acc')
    expect(cta.className).not.toContain('uppercase')
  })

  it('con roles, la cabecera SÍ lleva su CTA', async () => {
    // La otra mitad: esconderlo siempre dejaría al cliente en servicio sin forma
    // de crear un rol, que es peor que el botón repetido.
    base({ conRoles: true, conCatalogo: true })
    montar()
    await abrirFicha()

    expect(await screen.findByRole('button', { name: 'Nuevo rol' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Definir primer rol' })).toBeNull()
  })
})

describe('subprocesadores · lo que el frame de alta OMITE', () => {
  it('lista los tres con su región y el pie de plataforma', async () => {
    base()
    montar()
    await abrirFicha()

    expect(screen.getByText('Snowflake Inc.')).toBeInTheDocument()
    expect(screen.getByText('Amazon Web Services')).toBeInTheDocument()
    expect(screen.getByText('Anthropic')).toBeInTheDocument()
    expect(screen.getAllByText('US-EAST-1')).toHaveLength(2)
    expect(screen.getByText('US')).toBeInTheDocument()
    expect(
      screen.getByText(/Son de plataforma: aplican desde el alta/),
    ).toBeInTheDocument()
  })

  it('NO trae la fecha de revisión ni el acuerdo, que este frame no dibuja', async () => {
    // **La mitad negativa sin la cual copiar el bloque de la ficha normal pasa.**
    // Y omitirla es coherente con el estado: un cliente recién dado de alta no
    // tiene una revisión anterior que citar.
    base()
    const { container } = montar()
    await abrirFicha()

    expect(container.textContent ?? '').not.toContain('Revisado')
    expect(container.textContent ?? '').not.toContain('vigente')
  })
})

describe('la frase que NO se compone · la ausencia atestiguada', () => {
  it('no aparece el aporte de la plantilla ni el nombre que el dibujo escribe', async () => {
    /** El dibujo escribe «LA PLANTILLA retail_apparel_v2 APORTA 4 PESTAÑAS Y 12
     *  MÉTRICAS HEREDABLES», y **no se construye ni se sustituye**: las dos cifras
     *  que hay a mano —las pestañas del layout y las métricas del catálogo— no son
     *  «lo que aporta la plantilla», y cambiarle el sujeto a la frase es escribir
     *  copy sobre un dato que no existe.
     *
     *  Esta prueba es la que avisa el día que alguien la componga. */
    base({ conRoles: true, conCatalogo: true })
    const { container } = montar()
    await abrirFicha()

    const texto = container.textContent ?? ''
    expect(texto).not.toContain('retail_apparel')
    expect(texto).not.toMatch(/aporta \d+ pestañas/i)
    expect(texto).not.toMatch(/heredables/i)
  })
})

/* ════════════════════════════════════════════════════════════════════════════
 * AGREGADO POR QA · 2026-09-30 · cinco mutaciones que SOBREVIVÍAN
 *
 * El arnés corrió 34 mutaciones sobre línea de base verde —159 pruebas— con una
 * mutación NULA de control que sobrevivió, y cinco fieles quedaron vivas. Las
 * cinco tienen la misma forma: **algo declarado en prosa y sin aserción**, que
 * es exactamente lo que el registro de pantallas llama «divergencia anotada».
 * Una divergencia anotada y no atada se deshace sola y el comentario queda
 * mintiendo.
 * ════════════════════════════════════════════════════════════════════════════ */

/** Nunca contesta · deja esa ruta en vuelo. Mismo recurso que `carga.test.tsx`. */
const colgada = async () => {
  await new Promise(() => {
    /* a propósito: no resuelve nunca */
  })
  return ok([])
}

describe('las columnas que el dibujo escribe · ninguna se puede ir en silencio', () => {
  it('ID pinta el identificador que el servicio da, y MONEDA sale del dato', async () => {
    /** **Las dos columnas que se podían borrar enteras sin que nada fallara**
     *  —mutaciones M13 y M14—, y las dos tienen una razón escrita que nadie
     *  estaba verificando:
     *
     *  · `ID` es **la divergencia declarada**: el dibujo escribe `axo_mx` y el
     *    servicio no manda ninguna forma corta, así que se pinta el uuid. Eso
     *    está anotado en el registro de pantallas; sin esta aserción la columna
     *    se va y la anotación queda hablando de algo que no existe.
     *  · `MONEDA` es **el único valor de la tarjeta que sale de un campo propio
     *    del cliente**, y el fixture del modo mock se escribió a propósito con
     *    `MXN` sobre un `locale` colombiano «para que se vea que la columna sale
     *    del dato y no de una constante». Eso era cierto y no estaba probado. */
    base()
    montar()
    await abrirFicha()

    expect(celda('Id').textContent).toContain('t-1')
    expect(celda('Moneda').textContent).toContain('MXN')
  })

  it('y la pregunta operativa está, palabra por palabra', async () => {
    // El comentario del componente dice que el dibujo la escribe «igual en las
    // dos variantes, palabra por palabra». Es un literal normativo sin dato
    // detrás: si nadie lo afirma, se puede borrar y la pantalla sigue en verde.
    base()
    montar()
    await abrirFicha()

    expect(
      screen.getByText('¿Qué ve cada rol de este cliente, y con qué permiso?'),
    ).toBeInTheDocument()
  })
})

describe('los dos tonos del chip · que es la razón de que el chip exista', () => {
  it('BLOQUEADO va en el acento y EN ALTA en el neutro', async () => {
    /** **La mutación que sobrevivía era cambiarle el tono a `accion`** —de
     *  `border-acc text-acc` al neutro— y ninguna prueba lo notaba, porque todas
     *  miran texto. El texto es idéntico en los dos tonos: eso es justo lo que
     *  `StatusChip` existe para distinguir, y §2.1 lo sanciona —el chip no dice
     *  «malo», dice «esto espera que alguien lo haga», que es uno de los cinco
     *  usos permitidos del acento—.
     *
     *  **Se afirma la utilidad del token y no un color**: `border-acc` es lo que
     *  `--color-acc` emite, así que un hex literal no podría pasar esta prueba
     *  ni el lint. */
    base()
    montar()
    await abrirFicha()

    const bloqueado = (await screen.findByText('Bloqueado')).parentElement
    expect(bloqueado?.className).toContain('border-acc')
    expect(bloqueado?.className).toContain('text-acc')

    // **Y la otra mitad del par**: el chip del estado es neutro. Sin ella,
    // pintar los dos en naranja pasaría — y el acento dejaría de distinguir.
    const clases = screen.getAllByText('En alta').map((e) => e.parentElement?.className ?? '')
    expect(clases.some((c) => c.includes('border-w4'))).toBe(true)
    expect(clases.some((c) => c.includes('border-acc'))).toBe(false)
  })
})

describe('mientras una de las dos vueltas no llegó · no se afirma nada', () => {
  it('con los roles en vuelo, ni el chip ni la columna dicen «En alta»', async () => {
    /** **La derivación ANSIOSA sobrevivía**: cablear `derivable = true` en
     *  `Admin` no rompía una sola prueba, porque todas esperan el estado final.
     *  Y el defecto que eso produce está escrito con precisión en el comentario
     *  de `Admin` —«un cartel que aparece y desaparece es peor que uno que
     *  tarda: el que mira no sabe cuál de los dos era cierto»—: con las dos
     *  listas todavía ausentes las dos condiciones dan cero, así que el chip
     *  `EN ALTA` se pintaría sobre CUALQUIER cliente durante el primer render.
     *
     *  Es la misma familia que «Cargando» en vez de «0 roles», que esta pantalla
     *  ya resuelve bien en la cabecera y no tenía atada acá. */
    base()
    // **El override va DESPUÉS de `base()`**: `server.use` antepone, así que la
    // llamada posterior gana · la trampa que este archivo ya documenta arriba.
    server.use(http.get(`${API}/admin/tenants/:id/roles/composition`, colgada))
    montar()
    await screen.findByRole('button', { name: /^Grupo Axo · / })
    await userEvent.click(screen.getByRole('button', { name: /^Grupo Axo · / }))
    await screen.findByText('Identidad del tenant')

    expect(celda('Estado').textContent).toContain('—')
    expect(screen.queryAllByText('En alta')).toHaveLength(0)
  })
})

/* ════════════════════════════════════════════════════════════════════════════
 * AGREGADO EN LA AUDITORÍA · 2026-09-30 · los literales del vacío
 *
 * QA los dejó levantados como decisión humana: el frame escribía una cosa y la
 * pantalla otra, y afirmar el dibujo ponía la suite en rojo. **La cadena de
 * autoridad no lo deja abierto** —`CLAUDE.md`: «gana el `.pen` para lo visual y
 * el literal de la UI»—, así que la pantalla se corrigió y acá quedan atados.
 *
 * Y las dos líneas eran PREVIAS a F5.20, que es lo que las hacía fáciles de
 * dejar pasar: el diff de la tarea sólo tocaba la tercera.
 * ════════════════════════════════════════════════════════════════════════════ */

describe('el vacío de alta dice lo que el dibujo escribe', () => {
  it('la frase entera, y el rótulo del resumen', async () => {
    /** **Enteros y no un fragmento.** Son literales normativos sin dato detrás:
     *  con media frase afirmada, la otra media se puede reescribir sola. */
    base()
    montar()
    await abrirFicha()

    expect(
      await screen.findByText(
        'Todavía no hay roles definidos, así que este cliente no tiene composición ni usuarios que puedan entrar.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('Sin roles definidos')).toBeInTheDocument()
  })

  it('y NO los dos labels nuestros que decían lo mismo peor', async () => {
    // La mitad negativa: sin ella, volver a agregar la línea vieja al lado de la
    // del dibujo pasa en verde y la pantalla dice la misma cosa dos veces.
    base()
    const { container } = montar()
    await abrirFicha()

    const texto = container.textContent ?? ''
    expect(texto).not.toContain('todavía no tiene roles · está en alta')
    expect(texto).not.toContain('nadie puede entrar a la consola')
  })

  it('con roles el resumen vuelve a las cifras, que es lo que el otro frame pinta', async () => {
    // La otra mitad del par: `SIN ROLES DEFINIDOS` cableado siempre borraría el
    // conteo de la ficha del cliente en servicio, que el frame normal sí dibuja
    // —«2 ROLES · 4 PESTAÑAS · 28 PANELES»—.
    base({ conRoles: true, conCatalogo: true })
    montar()
    await abrirFicha()

    expect(await screen.findByText(/1 rol\(es\) ·/)).toBeInTheDocument()
    expect(screen.queryByText('Sin roles definidos')).toBeNull()
  })
})

describe('lo que la ficha en alta NO dice · encontrado al abrirla', () => {
  it('sin roles no hay advertencia sobre ocultar métricas', async () => {
    /** **Se vio, no lo dijo una prueba.** Debajo del vacío aparecía «Ocultar una
     *  métrica NO es un permiso · el servidor la vuelve a verificar…» en un
     *  cliente que no tiene un solo rol ni una sola métrica que ocultar, y el
     *  frame de alta no dibuja nada en ese hueco.
     *
     *  Es la quinta de la misma familia que ya encontró construir esta pantalla:
     *  advertir sobre un mecanismo que no está presente es el mismo defecto que
     *  declarar una carencia ya cubierta. */
    base()
    const { container } = montar()
    await abrirFicha()

    expect(container.textContent ?? '').not.toContain('Ocultar una métrica')
  })

  it('y con un rol la advertencia vuelve, que es donde le habla a alguien', async () => {
    // **La otra mitad.** Esconderla siempre la pierde para quien compone, que es
    // justo a quien §1.4.20 quiere advertirle · `roles.test.tsx` la afirma con
    // su escenario completo y acá se fija el par.
    base({ conRoles: true, conCatalogo: true })
    const { container } = montar()
    await abrirFicha()

    await waitFor(() => {
      expect(container.textContent ?? '').toContain('Ocultar una métrica NO es un permiso')
    })
  })
})
