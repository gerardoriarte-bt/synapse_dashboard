# Para el equipo de backend · las dos formas que el materializador no emite · 2026-09-25

> **Histórico.** Un mensaje mandado, con fecha: qué se pidió y con qué
> evidencia. No se actualiza.
>
> Tercero del día, y va aparte a propósito: los otros dos —el del chat y el del
> fork, y el de feeds y usuarios— ya están mandados, y un mensaje mandado no se
> reescribe.

Medimos qué formas de valor llegan de verdad a la pantalla, y aparecieron **dos
que el materializador no sabe emitir**: `distribucion` y `serieConBanda`.

## Por qué importa, y no es por este cliente

**Synapse es una herramienta de BI.** Lo que vende no es un dashboard: es que el
administrador pueda **elegir qué métrica mostrar y con qué gráfico**. El catálogo
de formas disponibles *es* el producto.

Por eso esto no se cierra con «UA MX no tiene métricas de distribución». Una
forma que el materializador no emite **no se la podemos ofrecer a ningún
cliente**, ni al que la pida mañana. Es capacidad de plataforma, no una carencia
de este tenant.

Y lo separa bien de lo que **no** hace falta pedir: `escalarConIntervalo`,
`serieTemporal`, `ranking` y `composicion` **ustedes ya las producen**. UA MX no
tiene métricas de esas formas hoy y eso está perfecto — el día que otro cliente
las tenga, funcionan sin tocar nada. Sólo estas dos están cortadas de raíz.

## Qué medimos

`internal/core/dashboard/materialize/transform.go`, en `6e595e3` limpio: el
`switch` cubre ocho casos —`scalar`, `scalar_with_interval`, `categorical` y
`ranking` juntos, `time_series`, `multi_series`, `tabular`, `prose`,
`composition`— y todo lo demás cae en `ErrUnknownShape`.

Así que una métrica declarada `distribution` o `series_band` **sincroniza bien y
falla al materializar**. Su propio cable ya lo anticipa: *«Las nueve que
`materialize.TransformValue` sabe transformar. Una décima sincroniza bien y falla
al materializar con `ErrUnknownShape`»*.

## Lo que pedimos · ya está en B1.14, con la receta

Un caso más en el `switch` por cada una. Las formas internas están declaradas en
`contracts/synapse-api.yaml` desde hace meses, así que el destino no hay que
inventarlo:

| Forma | Lo que el adaptador espera recibir |
|---|---|
| `distribucion` | `{ shape, cuts: [{ label, v }] }` → nuestro `{ forma, cortes: [{ etiqueta, v }] }` |
| `series_band` | `{ shape, level, points: [{ t, v, lo, hi }] }` → nuestro `{ forma, nivel, puntos: [{ t, v, lo, hi }] }` |

**El nombre de la clave del cable lo eligen ustedes**; el adaptador renombra. Lo
único que pedimos es que la forma llegue completa: sin `lo` y `hi` por punto, una
banda no se puede dibujar.

## Y `serieConBanda` es la que más pesa

`design.md` tiene una regla dura: **«Prohibida la estimación puntual sin
intervalo. Un pronóstico sin banda no se publica.»**

Es la única forma que existe para cumplirla. Hoy `ForecastBody` —que está escrito,
registrado con carga diferida y probado— **no puede recibir un dato de ustedes**,
así que esa regla no se ejercita en ningún cliente. Un pronóstico es justo el tipo
de cosa que un tenant de retail va a pedir temprano.

## Nuestro lado está listo

No hay trabajo de front esperando detrás de esto:

- `DistributionBody` y `ForecastBody` **existen, están registrados** en
  `render/bodies/registry.ts` con su carga diferida, y tienen pruebas.
- El adaptador ya sabe traducir las dos formas.
- El único hueco de nuestro lado es que **`npm run dev:mock` tampoco las
  ejercita**, y es por lo mismo: los mocks hablan el cable y el cable no las
  tiene. El día que lleguen, van a los mocks primero.

## Lo que NO estamos pidiendo

Que curen métricas de esas formas para UA MX. Eso es de datos y depende del
cliente. Lo que pedimos es que **la plataforma pueda emitirlas** cuando una
exista.
