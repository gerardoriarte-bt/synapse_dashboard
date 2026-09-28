# Dónde vive la identidad del gráfico · 2026-09-28

> **Para decidir antes de construir un solo gráfico más.** Hoy un panel puede
> decir a qué **familia de forma** pertenece y no **qué gráfico** quiere. Hasta
> que eso se resuelva, los 37 gráficos que faltan no se pueden ni expresar.
>
> **Reemplaza a** `docs/historico/PROPUESTA-2026-09-28-plantilla-de-vertical.md`,
> que se movió a histórico el mismo día: la prioridad es que los gráficos se
> puedan construir **para cualquier vertical**, y la plantilla se deriva de un
> dashboard ya compuesto.

## El problema, medido el 2026-09-28

| | |
|---|---|
| Gráficos dibujados en el `.pen` · «Synapse · Plots» | **43** |
| Gráficos únicos nombrados en §5 de `design.md` | **49**, en 65 pares (forma, gráfico) |
| Valores de `TipoPanel` en el contrato | **15** |
| Componentes de plot construidos | **6** |
| Plots que ramifican por variante | **0** |

**`TipoPanel` no nombra gráficos: nombra familias de forma.** `bars`, `series`,
`composition`, `distribution`. Y ninguno de los seis plots ramifica — cada uno
dibuja exactamente un gráfico.

La consecuencia es concreta: un panel puede decir «soy de composición», y §5
declara que `composicion` acepta **siete** —stacked, stacked100, donut, treemap,
marimekko, waterfall, funnel—. Dibujamos uno, y **no hay dónde escribir cuál**.

**No falta trabajo de componentes: falta un eje.**

## Las tres salidas, y una medición que descarta dos

### (a) `TipoPanel` crece a 49

Cada gráfico es un tipo de panel.

**Se descarta** porque rompe lo que `tipo` hace hoy: `registry.ts` mapea
`tipo → cuerpo`, y el cuerpo es quien traduce un `Valor` a dibujo. Con 49 tipos
sobre 12 cuerpos, `tipo` deja de determinar el cuerpo y el registro necesita una
tabla intermedia — que es exactamente el campo nuevo que (a) decía evitar.

Además `/config/blocks` declara rangos de span **por tipo de bloque** (§6). Son
15 entradas hoy; 49 es trabajo de diseño que nadie hizo.

### (c) `grafico` REEMPLAZA a `tipo`, y el cuerpo se deriva

Un solo campo: el panel dice `waterfall` y el registro sabe que eso es
`CompositionBody`. Es el más limpio de los tres **y no es posible.**

**Lo descarta una medición, no una opinión: 16 de los 49 gráficos sirven a más
de una forma.**

| Gráfico | Sirve a |
|---|---|
| `forecast` | `escalarConIntervalo` **y** `serieConBanda` |
| `donut` | `categorica` **y** `composicion` |
| `network` | `flujo` **y** `grafo` |
| `tornado` | `escalarConIntervalo` **y** `categoricaComparada` |
| `columns` | `serieTemporal` **y** `categorica` |

…y once más. **Un `donut` no dice si el cuerpo tiene que leer una `categorica` o
una `composicion`**, que son objetos distintos. El gráfico solo no alcanza para
elegir cuerpo.

### (b) `grafico` JUNTO A `tipo` · **la elegida**

- **`tipo` sigue eligiendo el cuerpo**, o sea qué forma se lee y qué estados,
  shell, BASE y procedencia se pintan. No cambia nada de lo que ya funciona.
- **`grafico` elige la variante adentro.**

Es lo que el diseño ya diseñó: `SYNAPSE_PLOTS` existe **aparte** de
`SYNAPSE_BLOCKS` desde v2, con sus `formas`, `soportaBanda` y `tope`. Y es lo que
el `.pen` dibuja en B3: «BIBLIOTECA DE TIPOS», las cinco categorías
—COMPARACIÓN, COMPOSICIÓN, EVOLUCIÓN, DISTRIBUCIÓN, ESTADO— y «2 DE 6
MOSTRADOS», que es un contador de gráficos compatibles, no de tipos de panel.

**El esquema ya está declarado** en `contracts/synapse-api.yaml` desde el
2026-09-26, por los mínimos de B1.21: `Grafico { id, nombre, formas,
soportaBanda, minimos, tope }`. **Lo único que falta es el campo en el panel.**

## Las cuatro decisiones dentro de (b)

### 1 · `grafico` es OPCIONAL, y ausente significa «el de siempre»

Los doce paneles que existen no lo traen, y **no se migran**: sin `grafico` el
cuerpo dibuja lo que dibuja hoy.

Esto hace el cambio **aditivo**. Un campo obligatorio obligaría a tocar cada
layout publicado y cada fixture antes de ver el primer gráfico nuevo.

### 2 · Un `grafico` DESCONOCIDO no se sustituye · se declara

Si llega uno que esta versión del front no sabe dibujar, **el panel lo dice** con
la gramática de §8 —estado, razón y qué lo desbloquea— y no cae al gráfico por
defecto.

**Es la regla del valor a prueba de fallo contra el plausible.** Un `waterfall`
pedido y dibujado como dona se ve bien y miente sobre qué se está mirando; es
exactamente el modo de falla de `presentation` y del spread condicional. Un panel
que dice «este gráfico necesita una versión más nueva» no engaña a nadie.

### 3 · Es un ENUM CERRADO de nuestro lado, y lo cierra el adaptador

El cable lo traerá como `string` libre, igual que `shape`, `family`, `layer` y
`block_type`. **El adaptador lo cierra**, que es donde ya se cierran esos cuatro
—`adapt.ts` lo explica: «en el cable son `string` libre; en el contrato son
enumerados cerrados»—.

Los ids no hay que inventarlos: **§5 los nombra**, y son los 49 de la tabla.

### 4 · La compatibilidad la valida el SERVIDOR · el front da feedback

Es la regla ya escrita de F4.11: «la validación del front es feedback inmediato;
**el servidor decide**. Nunca se publica algo que el front dio por bueno y el
servidor no vio».

El front usa `GET /config/plots` para ofrecer sólo los compatibles y
**deshabilitar los incompatibles con la razón visible**, que es lo que §5 pide y
lo que B3 dibuja. Esa ruta **hoy devuelve 404**.

## La independencia de la vertical ya está · y lo que la rompería

La prioridad es que un gráfico se pueda construir **sin importar la vertical**.
Eso hoy **no hay que construirlo: hay que no romperlo**, y es estructural.

`render/plots/README.md` lo declara: «Un plot **no conoce la métrica, ni el
período, ni el tenant**: recibe `PlotProps<F>` y dibuja». Y regla dura 1: la
familia cromática **se lee del catálogo, nunca se elige en el componente**.

Un gráfico es agnóstico de la vertical porque no sabe qué es una vertical. Lo que
lo rompería es concreto y hay que vigilarlo:

- Meter lógica de negocio en un cuerpo —«si la métrica es de inventario…»—.
- Fijar una familia o un color en el componente en vez de leerlo del catálogo.
- Un gráfico que asuma unidades, como el radar con ejes de unidades mixtas, que
  ya quedó anotado como regla que no podemos verificar.

**`grafico` no toca nada de eso**: lo elige quien compone el dashboard, panel por
panel, así que el mismo `waterfall` sirve a apparel, a combustibles y a salud.

## Lo que esto destraba, y en qué orden

Cruzado contra §5, **diez de los once gráficos que MMM y forecast necesitan viven
sobre formas que ya tienen cuerpo construido**. Con este campo puesto, construir
cada uno es trabajo de `render/` puro —recibe por props, no depende de que el
dato exista— y se verifica con fixtures escritos **desde el contrato**.

| | Gráficos que faltan | Forma | Cuerpo |
|---|---|---|---|
| **Forecast** | `control`, `interval` | `serieConBanda`, `escalarConIntervalo` | ya existe |
| **MMM** | `waterfall`, `marimekko` | `composicion` | ya existe |
| | `stackarea`, `combo` | `seriesMultiples` | ya existe |
| | `scatter`, `bubble`, `cuadrantes` | `distribucion` | ya existe |
| | `pareto` | `categorica` | ya existe |
| | `tornado` | `escalarConIntervalo` ✔ · `categoricaComparada` ✖ | F4.17 |

**Sólo `tornado` en su versión comparada toca una forma sin cuerpo.**

## Lo que queda abierto

1. **Dónde viven los parámetros PROPIOS de un gráfico.** Un histograma necesita
   cortes, una dispersión necesita saber qué va en cada eje. Hoy `params` es
   `Record<string, unknown>` y un param mal escrito **se ignora en silencio** —
   F1.29 lo iba a resolver validando en el adaptador. Con 49 gráficos eso deja de
   ser un pendiente y pasa a ser parte de esta decisión.
2. **¿Los rangos de span son del tipo o del gráfico?** §6 los declara por tipo,
   pero una cascada y una dona no necesitan el mismo ancho mínimo. Si son del
   gráfico, `Grafico` necesita sus spans y `/config/blocks` deja de ser la única
   fuente.
3. **El `.pen` dibuja 43 y §5 nombra 49.** Los títulos del dibujo están en
   español y los ids de §5 en inglés, así que **la correspondencia no está
   verificada 1:1** y no se afirma acá cuáles seis faltan. Un gráfico nombrado en
   la spec y no dibujado no tiene verdad visual — hay que cruzarlos antes de
   construir, y es trabajo de la auditoría del `.pen`.
