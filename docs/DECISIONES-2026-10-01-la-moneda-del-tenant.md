# La moneda de UA MX es USD · decidido el 2026-10-01

> **Decisión tomada**, con lo que se midió para tomarla y lo que se descartó.
> Tiene fecha y **no se edita después**. Es el par de una `PROPUESTA-*`: aquella
> pregunta, ésta contesta.

---

## La decisión, en una línea

**El dashboard de Under Armour México muestra todo en USD. Nada en COP ni en
ninguna otra moneda.** Lo definió producto (humano) el 2026-10-01.

| Campo | Valor | Por qué |
|---|---|---|
| `currency` | **`USD`** | Es la moneda del DATO · el catálogo lo declara |
| `locale` | `es-MX` | Es el idioma y el formato de número del cliente |
| `timezone` | `America/Mexico_City` | Es el corte del día del negocio |

**Los tres campos son independientes, y tratarlos como uno es el error.** Un
cliente mexicano, que lee en español con separadores mexicanos, que cierra su día
en Ciudad de México, y que **factura en dólares**. Las cuatro cosas conviven sin
contradicción.

---

## Lo que se midió antes de decidir · las tres fuentes coinciden

**No fue una preferencia contra el sistema: fue leer lo que el sistema ya decía.**

### 1 · El catálogo de Snowflake —el dueño del copy que describe datos

Medido el 2026-10-01 contra `GET /config/catalog`, servicio corriendo en
`d9147c3`:

```
revenue                unit=USD   base=Venta total del sitio medida por Adobe Analytics, en USD…
spend                  unit=USD   base=Inversión bruta en medios de todos los días del mes…
spend_flow             unit=USD   base=Aporte de cada plataforma al total invertido
platform_gap           unit=USD   base=Inversión y retorno de cada plataforma, en USD
platform_month_matrix  unit=USD   base=Inversión bruta de cada plataforma en los últimos doce meses
```

**Las cinco métricas de dinero declaran `USD`**, y dos lo dicen además en el
texto de gobierno que datos firmó. El dato ES dólares.

### 2 · El `.pen` —normativo para el literal de UI

Contados sobre el archivo, no de memoria: **63 nodos con moneda, 62 dicen
`USD`.**

El único `MXN` es `A2 · Ficha · tenant en alta`, que dibuja **otro cliente
dándose de alta**. La ficha del cliente vivo —`A2 · Ficha de cliente`— escribe
`USD`.

### 3 · Producto

«Este dashboard de UA es de MX pero debe salir todo en USD, nada en COP ni otra
moneda.»

**No hay divergencia que abrir.** Las tres dicen lo mismo.

---

## Qué estaba mal, entonces

**La fila del tenant en la base**, por un default de columna: `es-CO` / `COP` /
`America/Bogota` en los dos clientes sembrados. Nadie lo cargó; nació así.

**Y una corrección nuestra que iba a empeorarlo.** El mensaje del 2026-09-29
—`docs/MENSAJE-2026-09-29-backend-tenant-colombiano.md`— pedía corregir los tres
valores a «`es-MX`, `MXN`, `America/Mexico_City`», y el 2026-10-01 se aplicó así
sobre la base local antes de que producto lo definiera.

**`MXN` es el mismo error con otra divisa**: rotula como pesos mexicanos unas
cifras que el catálogo declara en dólares. El acierto de la corrección era el
huso; la moneda estaba razonada desde el país y no desde el dato.

Está corregido en la base local y **pedido al backend para dev y prod** ·
`docs/MENSAJE-2026-10-01-backend-la-moneda-es-usd.md`.

---

## Qué toca este campo, exactamente

**El front NO deriva ninguna cifra de `tenant.currency`.** Se verificó leyendo el
código: la unidad de un valor sale de `unit` de su métrica en el catálogo
—`adapt.ts`— y la pinta `format.withUnit`, que antepone el código de moneda y
pega los símbolos. El campo del tenant se usa en **un solo lugar nuestro**: la
tarjeta de identidad de A2.

**Donde sí pega, y es lo que se ve, es en la prosa del agente.** Con `COP`
escribía:

> «En septiembre de 2026 los ingresos alcanzaron **COP 1.144.876**…»

sobre cifras que el panel de al lado muestra como `USD 1,232,721`. **La prosa
está GUARDADA**, así que no cambia al corregir el tenant: se reescribe en la
próxima corrida del agente, que es del backend.

### Y el `locale` sí cambia lo que se ve

| | |
|---|---|
| `es-CO` | `1.232.721` |
| `es-MX` | `1,232,721` |

Con `es-MX` el separador de miles pasa a coma. **Eso no contradice el `.pen`**:
su punto de miles ya estaba registrado como «un descuido que diseño retipea»
—decidido el 2026-09-22 (humano)—.

**Mientras la prosa vieja siga guardada se ven las dos convenciones a la vez** —
nuestras cifras en `1,232,721` y el titular del agente en `1.144.876`—. Es
transitorio y se va con la próxima materialización.

---

## Lo que se descartó, y por qué

| Opción | Por qué no |
|---|---|
| **`MXN`, porque el cliente es mexicano** | Razona desde el país y no desde el dato. El catálogo dice USD; rotularlo MXN es la misma falsedad que COP con otra cara |
| **Convertir a la moneda del tenant en el front** | Una conversión necesita un tipo de cambio con fecha y fuente. Inventarlo acá es exactamente «el adaptador no calcula». Y una cifra que cambia de valor según quién la mira no es auditable |
| **Sacar `currency` del tenant y dejar sólo el `unit` del catálogo** | Tentador, porque hoy el front ya se las arregla con el catálogo. Pero el agente necesita saber en qué moneda redactar, y un tenant futuro con métricas en dos monedas lo va a necesitar más. **El campo se queda; lo que se fija es su valor** |
| **Fijar `USD` en el código** | Es cablear una decisión de tenant. El multi-idioma y la multi-moneda ya tienen forma decidida: viajan en el catálogo y en el tenant, no en constantes nuestras |

---

## La regla que queda, para que no se vuelva a discutir

**El dueño de la unidad de una cifra es el CATÁLOGO, por métrica.**
`tenant.currency` tiene que estar de acuerdo con él, y cuando discrepen **gana el
catálogo**, porque es quien conoce el dato. El campo del tenant es para quien
redacta, no para quien dibuja.

**Y la moneda no se deduce del país.** Ni del `locale`, ni del huso, ni del
nombre del cliente.
