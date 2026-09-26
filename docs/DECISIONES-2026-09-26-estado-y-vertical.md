# `status` y `vertical` de A1 · decisiones · 2026-09-26

> **Contesta la pregunta que el backend nos devolvió** el 2026-09-25, al entregar
> B4.1: *«`status` y `vertical` van `null`: necesitamos que el cliente defina la
> lista de valores. Con eso son dos columnas más y un campo en
> `PUT /admin/tenants/{id}`, que ya existe.»*
>
> **Son dos preguntas de tamaño muy distinto, y tratarlas juntas era el
> problema**: `status` es una columna, `vertical` es un mecanismo.

## Lo que se midió antes de decidir

| Fuente | Qué dio |
|---|---|
| El `.pen` · A1, los chips de estado | `ACTIVO` y `PILOTO`, y **son dos variantes del mismo chip** |
| El `.pen` · A3, los chips de estado | `ACTIVO` y `SUSPENDIDO`, con **la misma convención** |
| El `.pen` · A1, el filtro | `ESTADO` puesto en **`TODOS`** |
| El `.pen` · A1, la celda de vertical | **Dos líneas**: `Retail · apparel` en `$ink` sobre `retail_apparel_v2` en `$dim` |
| El `.pen` · A1, las acciones de fila | `ABRIR FICHA` y un `Más` · **ninguna destructiva dibujada** |
| `design.md:280` | `Tenant { id, nombre, vertical, plantillaOrigen, estado, catalogVersion }` |
| `design.md:919` · §9.3 | `vertical: 'retail_apparel'` · `plantillaOrigen: 'retail_apparel_v2'` |
| Su código · `6e595e3` | **La palabra `vertical` no aparece una sola vez**; `Tenant` no tiene ni `Vertical` ni `Status` |

**Lo de los chips es el hallazgo que ordenó todo.** `ACTIVO` y `PILOTO` no son
dos celdas de una fila: son `Estado activo` —relleno `$elev`, `$r-sm`— y
`Estado otro` —sin relleno, borde `$w4` de 1px—, **las dos con
`enabled: false`**, que es como diseño dibuja variantes de un mismo componente.
A3 hace lo mismo con `Estado` y `Suspendido`.

Así que **el dibujo no fija la lista de valores: fija dos clases visuales.** El
estado normal va sólido y cualquier otro va en contorno. Eso contesta la
presentación de los tres y deja la lista abierta, que es exactamente lo que el
backend preguntó.

---

## 1 · `status` · tres valores, y sólo uno tiene consecuencia

| Valor | Chip | Consecuencia | Procedencia |
|---|---|---|---|
| `ACTIVO` | sólido `$elev` | ninguna · es el estado normal | **Dibujado** en A1 |
| `PILOTO` | contorno `$w4` | ninguna funcional | **Dibujado** en A1 |
| `SUSPENDIDO` | contorno `$w4` | **sus usuarios no entran** | **Propuesto** · dibujado en A3 para usuarios |

**Dos de los tres no son una elección: son una transcripción.** `ACTIVO` y
`PILOTO` están en el dibujo, y el `.pen` es normativo para el literal de la UI.
Elegir otras palabras habría sido retraducir una fuente que no modificamos.

**`SUSPENDIDO` es el único que se propone, y la razón es de vocabulario.** A3
ya lo dibuja para usuarios, así que las alternativas —`INACTIVO`, `PAUSADO`,
`BAJA`— darían **dos palabras para el mismo concepto** en dos pantallas de la
misma superficie. Una sola palabra, un solo vocabulario.

### La consecuencia, que es más que una columna

**Un tenant `SUSPENDIDO` no deja entrar a sus usuarios.** Eso es una regla de
autorización en el login, no un valor en una celda, y conviene decirlo fuerte
porque **cambia el tamaño del pedido**: no son «dos columnas más», son dos
columnas **y una compuerta**.

El chip es la *consecuencia* de la regla, con la gramática de §8 —estado, razón
y qué lo desbloquea—, no el mecanismo.

**Y la regla no aplica a los super-admins.** Ellos operan la plataforma: si
suspender un cliente encerrara también a quien tiene que arreglarlo, el estado
no tendría salida. Es el mismo razonamiento que «no se puede quedar sin
super-admins» de §7.3, y el mismo que el vacío de F5.1 —un estado sin salida
encierra—.

### `PILOTO` sin consecuencia funcional, y está bien

Un estado que no cambia ningún comportamiento corre el riesgo de ser decoración.
Éste no lo es por dos razones: **está dibujado**, y su consecuencia es humana —
le dice a quien opera la plataforma que las cifras de ese cliente no son de
producción todavía.

Si algún día tiene que limitar algo —facturación, cupos, cuántos dashboards—,
**esa regla se agrega entonces**, con el caso real enfrente. Declararla ahora
sería inventar una compuerta que nadie pidió.

### Lo que se descartó · `ARCHIVADO` / `BAJA`

Es el candidato natural —«borrar un cliente sin perder su dato»— y **se descartó
porque el dibujo no lo sostiene por ninguno de los dos lados**:

- **El filtro está puesto en `TODOS`.** Si algo se ocultara por defecto, el
  filtro estaría puesto en el subconjunto y `TODOS` sería la opción que se elige.
  Está al revés.
- **La acción destructiva sobre un cliente no está dibujada.** La fila tiene
  `ABRIR FICHA` y un `Más` cuyo contenido diseño no dibujó. La banda de
  super-admins **sí** dibuja las suyas —`EXIGIR MFA`, `REVOCAR`, y la fila propia
  marcada `SIN ACCIÓN SOBRE TU CUENTA`—, así que la ausencia en la banda de
  clientes es una decisión y no un olvido.

**Inventar un estado para sostener una acción que nadie dibujó es el defecto de
`BodyProps.presentation`**: un valor declarado sin mecanismo detrás, que existe
documentado y sin un solo consumidor. Cuando diseño dibuje el contenido de `Más`,
si hay una acción destructiva ahí, **el estado se agrega entonces** y la lista
crece de a uno.

---

## 2 · `vertical` · no entra, y la pregunta estaba mal planteada

**No se envía una lista de valores**, y no por falta de decisión: porque el campo
que el dibujo muestra **son dos campos y un mecanismo**.

`design.md:280` da el modelo, y §9.3 su ejemplo:

```
Tenant { id, nombre, vertical, plantillaOrigen, estado, catalogVersion }

vertical:         'retail_apparel'
plantillaOrigen:  'retail_apparel_v2'
```

**El `.pen` dibuja el par**, uno sobre otro en la misma celda de 140:
`Retail · apparel` en `$ink` sobre `retail_apparel_v2` en `$dim`. Y al pie de A1
está la regla: «CREAR UN CLIENTE EXIGE ELEGIR PLANTILLA DE VERTICAL · **LA
PLANTILLA DEFINE SUS PESTAÑAS Y MÉTRICAS DE ARRANQUE**».

Eso es la cascada de §3.4, que existe por una razón de escala escrita —«con 3
roles × N pestañas × N clientes, componer todo desde cero no escala»—:

```
Plantilla de vertical  (retail/apparel · combustibles)
    └── override por tenant  (UA MX)
            └── override por rol  (CMO)
```

Así que **`vertical` no es una etiqueta a enumerar: es la cabeza de la herencia
de composición**, y `plantillaOrigen` es un puntero versionado dentro de ella.

**Y no existe en ninguno de los dos lados.** Medido contra `6e595e3`, que es la
base del fork: la palabra `vertical` no aparece una sola vez en su código —los
únicos aciertos son módulos de Go vendorizados— y `template` sólo son plantillas
de correo. Su `Tenant` de `internal/core/domain/tenant.go` no la tiene. La
herencia que el builder promete —«todo panel heredado se marca como tal»,
«volver a heredar»— tampoco tiene backend.

### La decisión · la columna sigue declarada ausente

Es como está hoy en `src/surfaces/admin/TenantList.tsx`, con la gramática de §8,
y **se queda así**.

### Lo que se descartó · «sólo el rótulo, sin cascada»

Era el camino intermedio razonable: `vertical` entra ya como rótulo libre, A1
gana su columna, y `plantillaOrigen` se deja para cuando la plantilla exista.
Se descartó por una razón que es medible y no de criterio:

**La celda del dibujo son dos líneas, y el rótulo solo da la primera.** Con
`Retail · apparel` y sin `retail_apparel_v2` la columna sigue sin coincidir con
el `.pen`. **El rótulo compra una columna que igual está mal** — y a cambio deja
un campo que nadie deriva y que el día que la plantilla exista hay que convertir
en derivado.

Es el mismo defecto que ya tenemos puesto en este mismo campo: `Contexto`
declara `tenant.vertical` **requerido**, el cable no lo trae, `adapt.ts:277` lo
deja en `''` y **no lo consume nadie**. Ahí la regla del adaptador se cumple —el
`''` es el valor a prueba de fallo y `tests/api/adapt.test.ts:103` lo atestigua—,
pero un segundo lugar con la misma forma duplica lo que habrá que cambiar.

---

## Lo que queda abierto, y de quién es

**Una sola pregunta, y no es una lista de valores:** ¿entra en alcance la
plantilla de vertical? Es de **producto y diseño**, y lo que pide no es una
columna:

1. Un catálogo de verticales con plantillas **versionadas** — el `_v2` del
   dibujo no es decorativo.
2. El flujo de alta que **exige elegir una**, que el `.pen` ya declara como regla
   dura de A1.
3. La herencia de §3.4 con su delta y su «volver a heredar», que el builder ya
   promete y ningún backend sostiene.
4. `plantillaOrigen` sobre el tenant, para que la celda del dibujo se pueda
   pintar entera.

**Su razón escrita es de escala**, así que el disparador es el segundo cliente,
no una fecha. Mientras haya uno, esto no es un hueco: es trabajo que todavía no
paga.

## Lo que hay que pedirle al backend, y lo que no

**Sí:** `status` como columna con los tres valores, el campo en
`PUT /admin/tenants/{id}` —que ya existe— y **la compuerta de login para
`SUSPENDIDO`, que exceptúa a los super-admins**. Eso es más de lo que ellos
dimensionaron y conviene que lo sepan antes de estimarlo.

**No:** `vertical`. Pedirles la columna sin la plantilla les haría escribir un
campo que nadie llena. Lo que va en su lugar es esta razón, para que el `null`
deje de leerse como un pendiente suyo.
