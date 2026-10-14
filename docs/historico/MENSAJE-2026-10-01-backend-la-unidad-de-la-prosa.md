# Para el equipo de backend · el agente debe escribir la unidad de la MÉTRICA · 2026-10-01

> **VENCIDO · NUNCA SE ENVIÓ.** Se dobló dentro de
> `docs/MENSAJE-2026-10-01-backend-cuatro-pendientes.md`. El contenido sigue
> siendo correcto; lo que cambió es que no se manda suelto.


> **Histórico.** Un mensaje mandado, con fecha: qué se pidió y con qué evidencia.
> No se actualiza.

Hola. **Un pedido de una línea, y es la última pieza de la moneda.**

Va junto con `docs/MENSAJE-2026-10-01-backend-la-moneda-es-usd.md`, que les
corrige el valor; esto es **quién lo define**.

---

## La regla que fijó producto hoy

**La unidad de una cifra la declara el catálogo de Snowflake, por métrica.**
Lo que venga en `UNIT`, así se muestra. No se deduce del país del cliente.

**Para las cifras ya funciona así**, y lo medimos de punta a punta: `UNIT` →
`sync-catalog` → `dd_metrics.unit` → `/config/catalog` → el front, que antepone
el código de moneda, pega `%` y `x`, y manda los sustantivos al rótulo.

## Dónde no funciona así, medido en su código

`dd_materializer_service.go:244` arma el pedido de prosa con:

```go
Currency: tenant.Currency,
```

y `dd_prose_generator.go:105` lo escribe en el prompt —«con montos en
`<moneda>`»—. O sea que **la prosa habla en la moneda de la COLUMNA del tenant,
no en la de la métrica**.

Con `COP` en esa columna, el resultado en pantalla fue:

```
El párrafo:   «los ingresos alcanzaron COP 1.144.876…»
El KPI al lado:  USD 1,232,721
```

**Dos monedas para la misma métrica en la misma pantalla**, y la que está mal es
la del párrafo, porque la otra lee el catálogo.

## Lo que pedimos

**Que el agente reciba la unidad de cada métrica del contexto**, no la del
tenant. Hoy `DDProseRequest.Context` es `map[string]any` con «las cifras ya
materializadas» y **sin unidades**, así que el agente no tiene de dónde sacarla.

Cómo resolverlo es de ustedes. Dos formas, por si ayudan:

| | |
|---|---|
| **a** · Que cada entrada del `Context` lleve su `unit`, leído del catálogo que ya sincronizan | Es la correcta y la que aguanta un tenant con dos monedas |
| **b** · Que `Currency` salga del `unit` de las métricas monetarias del período en vez de la columna | Es más chico y alcanza mientras haya una sola moneda. Si hay más de una, **que sea un error y no una elección** |

**`tenant.currency` no se borra.** Sigue haciendo falta como respaldo —para una
cifra sin unidad propia, y para que el agente no se quede sin nada—. Lo que
cambia es su rango: **cuando discrepe con el `unit` de la métrica, gana la
métrica.**

## Por qué por métrica y no por tenant

Hoy no muerde: las cinco métricas de dinero de UA están en USD. Muerde el día que
un tenant tenga ingresos en USD e inversión en su moneda local — ahí un campo por
tenant obliga a elegir una y rotular la otra mal, **en silencio y con aritmética
coherente**, que es la clase de error que este producto no puede permitirse.

Y la unidad no siempre es una moneda: hoy el catálogo también trae `%`, `x`,
`órdenes`, `unidades` y `visitas`. «La moneda del tenant» no dice nada sobre
ésas; «la unidad de la métrica» las cubre todas con una regla sola.

## Lo que NO estamos pidiendo

**Nada del front**, que ya cumple la regla. Y **nada urgente**: mientras la
prosa se sirva con el valor viejo guardado, el párrafo seguirá diciendo lo que
dijo en su última corrida. Se arregla solo en la próxima materialización una vez
que el campo esté bien.

Gracias.
