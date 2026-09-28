> ## ⚠️ VENCIDA EL 2026-09-28, EL MISMO DÍA · leer esto antes que nada
>
> **La dirección de producto es otra, y la decidió un humano**: la plantilla
> **se deriva de un dashboard ya construido** —admin da de alta, compone, y eso
> se guarda como plantilla— y **no es exigencia hoy**. La prioridad son los
> gráficos.
>
> **Guardar como plantilla es una COPIA, no una cascada.** No necesita catálogo
> versionado, ni delta, ni «volver a heredar», ni resolución en el alta. Este
> documento especifica la versión cara de un problema que todavía no existe, y
> se equivocó de orden: supuso que la plantilla precede al dashboard.
>
> **Lo único que sobrevive, y conviene no volver a descubrirlo:** una plantilla
> guardada **no puede llevar `metricId`** —son de cada tenant— así que ancla por
> `metricKey` y se resuelve al aplicarla. Ese problema aparece igual en «guardar
> como plantilla», porque es el problema de aplicarla a OTRO cliente. Está en
> §3 de abajo.
>
> Lo que lo reemplaza: `docs/PROPUESTA-2026-09-28-identidad-del-grafico.md`.

# La plantilla de vertical · especificación · 2026-09-28

> **Para backend, producto y diseño.** §3.4 de `design.md` declara una cascada de
> composición que **no existe en ninguno de los dos lados**, y la regla dura de
> A1 la exige para dar de alta un cliente. Esto especifica qué es, qué contiene
> y cómo se resuelve — y separa la mitad barata de la cara, porque no son la
> misma decisión.
>
> **Se escribe ahora porque entran clientes.** Hasta el 2026-09-26 la razón para
> no tomarla era que había un solo cliente. Esa medición era del entorno de
> desarrollo, no del negocio.

## Lo que cambió, y una corrección propia

**El negocio tiene tres clientes y puede entrar un cuarto** · dato humano del
2026-09-28:

| Cliente | Vertical |
|---|---|
| **UA MX** | retail / apparel |
| **Terpel** | combustibles y lubricantes |
| **Keralty** | salud |

**La medición que dijo lo contrario estaba mal planteada.** Se contó `tenants` en
la base local —dos filas, las dos «Under Armour México»— y se leyó como un hecho
del negocio. Esa tabla contesta *cuántos clientes están configurados en Synapse*,
que es otra pregunta. **El `.pen` tenía la señal buena y se descartó como
relleno**: dibuja `3 TENANTS · 2 VERTICALES` en A1.

**Y el argumento de escala que se dio con ella también estaba mal**, en la forma
en que se dio. Se dijo que la cascada paga porque «3 roles × N pestañas × N
clientes». Con **tres clientes en tres verticales distintas la plantilla es 1:1
con el tenant**, así que hoy no deduplica nada. El argumento que sí vale es otro
y está abajo.

**`salud` no estaba en ninguna fuente.** `design.md` nombra dos verticales
—`retail/apparel · combustibles`, §3.4— y anticipa a Terpel con nombre propio
(§9.3 del plan de migración, con «menos pestañas» y «al menos una métrica en
estado `BLOQUEADO`»). La tercera es nueva y por eso esto es una propuesta de
spec y no una transcripción.

## El argumento honesto, ya que no es la deduplicación

Con una plantilla por cliente, la cascada no ahorra trabajo **hoy**. Lo que hace
es preservar una distinción que se pierde para siempre si se compone a mano:

**qué parte de un dashboard es de la VERTICAL y qué parte es de ESE cliente.**

Compuesto a mano, «cómo se ve un dashboard de salud» existe únicamente como el
layout de Keralty, enredado con los ajustes propios de Keralty, y no hay forma de
separarlos después. Es la misma clase de distinción que `null` contra `0` —«nunca»
contra «recién»— que este repositorio ya redescubrió en A5, en A1 y en la matriz:
**una vez colapsada, no se recupera.**

De ahí salen las dos consecuencias que sí son de trabajo:

- **El cuarto cliente de una vertical que ya existe arranca compuesto**, no vacío.
- **Un arreglo a la composición de una vertical alcanza a todos sus clientes**, en
  vez de repetirse a mano en cada uno.

Ninguna de las dos paga con 1:1. Las dos pagan en cuanto una vertical se repite, y
**la decisión de hoy es si esa información se conserva o se tira** — no cuánto
trabajo ahorra este trimestre.

## La decisión de estructura · dos fases, y sólo la primera es urgente

**Lo caro de §3.4 no es la plantilla: es la herencia viva** —el delta, el badge
`HEREDADO`, «volver a heredar», y saber en todo momento si un panel sigue
alineado con su origen—. Se pueden separar, y conviene:

| | Qué es | Qué habilita | Costo |
|---|---|---|---|
| **Fase A** · la plantilla como **origen** | Al dar de alta un cliente se elige una plantilla y **se copia** su composición | La regla dura de A1 · que la composición de la vertical exista como objeto | Bajo |
| **Fase B** · la **herencia viva** | El panel recuerda de dónde vino; editarlo crea override; existe «volver a heredar» | Los tres huecos declarados de `ContextView` y el de `TabEditor` | Alto |

**La regla dura de A1 se cumple con la Fase A sola.** «Crear un cliente exige
elegir plantilla de vertical · la plantilla define sus pestañas y métricas de
arranque» — «de arranque» es exactamente una semilla, no una herencia viva.

**Y la Fase A es la que tiene plazo.** Es la que hay que tener antes de dar de
alta a Terpel y a Keralty; la Fase B se puede tomar después sin perder nada,
**siempre que la Fase A haya guardado de qué plantilla salió cada tenant.** Ese
campo es lo único de la Fase B que no se puede agregar retroactivamente.

## 1 · Los valores de `vertical`

Tres, con la forma que el `.pen` ya dibuja —`retail_apparel`— en minúscula y
con guión bajo:

| Valor | Cliente hoy |
|---|---|
| `retail_apparel` | UA MX |
| `combustibles` | Terpel |
| `salud` | Keralty |

**`vertical` vive en el tenant y no se deriva de la plantilla.** Son dos campos
—§3.5 declara `vertical` Y `plantillaOrigen`— y el `.pen` los dibuja en la misma
celda de A1, uno sobre otro: `Retail · apparel` en `$ink` sobre
`retail_apparel_v2` en `$dim`. **El primero es la vertical; el segundo, de qué
plantilla salió este cliente.** Pueden divergir: un cliente de `salud` compuesto
desde `salud_v1` sigue siendo de `salud` cuando la plantilla va por `v3`.

**El rótulo que se pinta no se traduce en el front.** `Retail · apparel` es copy,
y el dueño del copy es quien emite el dato — la misma regla que el catálogo.

## 2 · Qué contiene una plantilla

Lo que §3.4 y la regla de A1 acotan: **pestañas y métricas de arranque**. En los
términos de los esquemas de §3.5:

```
PlantillaDeVertical {
  id, vertical, version, nombre, descripcion,
  pestañas: [{
    key, nombre, icono, pregunta, orden, chatSugerencias[],
    paneles: [{ tipo, metricKey, colStart, colSpan, rowSpan, orden, params }]
  }]
}
```

**No contiene roles.** §3.4 pone el override de rol **debajo** del de tenant, y
los roles son del tenant —`Rol { id, tenantId, … }`, §3.5—. Una plantilla que
trajera roles estaría saltando una capa de la cascada.

**No contiene datos, ni umbrales, ni cifras.** Es composición.

## 3 · El problema del anclaje, que es el corazón de esto

**Un panel se ancla a un `metricId`, y los `metricId` son de cada tenant.** El
catálogo lo cura Snowflake por cliente, `dd_panels.metric_id` es `NOT NULL`, y
`CatalogMetric` declara `id` **y** `tenant_id`. Así que **una plantilla no puede
guardar `metricId`**: no existe todavía el tenant al que apuntaría.

**La salida ya está en el cable y no hay que inventarla.** `CatalogMetric`
declara además **`key`** —`revenue`, `platform_return`—, que es estable y no
lleva `tenant_id`. Entonces:

> **La plantilla ancla sus paneles por `metricKey`. Al dar de alta el cliente,
> cada `metricKey` se resuelve contra el catálogo de ESE tenant y recién ahí se
> escribe el `metric_id`.**

Es la misma forma que ya usa el resto del sistema: el contrato nombra por clave y
el identificador se resuelve del lado que lo posee.

### Qué pasa cuando una clave no resuelve

**Pasa seguro**, y no es un error de la plantilla: cada vertical tiene su
catálogo, y un cliente nuevo puede no tener todavía materializada una métrica que
su vertical sí define.

**El panel entra igual, en estado `BLOCKED`**, con la gramática de §8: estado,
razón —«esta métrica no está en tu catálogo»— y qué lo desbloquea. **No se
descarta en silencio**: un panel que desaparece del alta es una composición que
nadie sabe que quedó incompleta.

**Esto ya está pedido y no es una idea nueva.** El plan de migración de
`design.md` pide para Terpel «al menos una métrica en estado `BLOQUEADO` para
ejercitar el principio 15». La resolución por clave es de dónde sale ese estado
de forma natural.

## 4 · El versionado

El `.pen` dibuja `retail_apparel_v2`, así que la versión **es parte de la
identidad** y se muestra. Tres reglas:

- **Una plantilla publicada no se edita**: se publica una versión nueva. Es la
  misma regla que un layout, y por la misma razón — saber contra qué se compuso un
  cliente.
- **Publicar una versión nueva no toca a los clientes existentes.** En Fase A no
  podría: la composición se copió. En Fase B, propagar es una acción explícita.
- **`plantillaOrigen` guarda la versión exacta**, no la plantilla. Es lo que
  permite decir «Keralty se compuso con `salud_v1` y hoy la vertical va por `v3`».

## 5 · La alternativa que se descartó · «clonar desde un cliente»

Es más barata y hay que decir por qué no: dar de alta copiando el layout de un
cliente existente de la misma vertical. Sin catálogo de plantillas, sin versiones.

**Con 1:1 es casi equivalente, y ahí se le ve el costo**: el clon no sabe de dónde
vino. No hay «la composición de salud», hay «el dashboard de Keralty», y el
segundo cliente de salud se compone desde el primero **con los ajustes propios del
primero adentro**. Es exactamente la distinción que esta propuesta existe para no
perder, y se pierde en el primer alta.

**Se puede reconsiderar si la Fase A resulta cara**, pero entonces la decisión
hay que tomarla a ojos abiertos: se está eligiendo no conservar esa información.

## Lo que le pedimos al backend · Fase A

1. **Un catálogo de plantillas versionadas**, con su CRUD de administración.
2. **Dos columnas en `tenants`**: `vertical` y `plantilla_origen` —la versión
   exacta—. `vertical` es la que ya llega en `null` en `GET /admin/tenants`.
3. **El alta con plantilla**: `POST /admin/tenants` recibe qué plantilla usar,
   resuelve cada `metricKey` contra el catálogo del tenant nuevo y compone.
4. **Que las claves que no resuelven entren como `BLOCKED` con su razón**, no
   que se descarten.

**Lo que NO les pedimos todavía** es la Fase B: el delta, el override y «volver a
heredar». Lo pedimos cuando una vertical se repita — salvo el punto 2, que **hay
que tener desde el alta** porque no se puede reconstruir después.

## Lo que es nuestro

- **El flujo de alta de A1** · hoy `TenantList` declara que crear un cliente exige
  elegir plantilla, y no hay pantalla para hacerlo.
- **La columna `vertical` de A1** · declarada ausente desde el 2026-09-26, se
  destraba con el punto 2.
- **Los tres huecos de `ContextView` y el de `TabEditor`** · son de Fase B y
  siguen declarados.

Nada de esto se construye antes de que el mecanismo exista — es la regla de
siempre: sin campo en el contrato, no se rellena el hueco.

## Lo que queda abierto

1. **¿Quién compone la primera plantilla de una vertical nueva?** No hay de dónde
   derivarla: `salud` no tiene un cliente previo. Es trabajo de producto con
   datos, y es el que tiene el plazo más ajustado de todo esto.
2. **¿Las claves de métrica son estables ENTRE verticales?** Las diez de UA MX
   —`revenue`, `spend`, `platform_return`— se leen genéricas, pero el catálogo lo
   cura datos por cliente. Si `salud` las nombra distinto, la plantilla es de la
   vertical y no hay problema; si dos verticales usan la misma clave para cosas
   distintas, sí lo hay. **Esto es una pregunta para datos.**
3. **¿`vertical` es cerrada o crece sola?** Hoy son tres. Si crece con cada
   cliente nuevo, es un catálogo y no un enum — y entonces A1 necesita una
   pantalla para administrarlo.
