# Para la sesión que dibuja en el `.pen` · 2026-09-28

> **Leé esto antes que `CLAUDE.md`**, porque invierte una de sus reglas.
>
> Hay **otra sesión de Claude Code trabajando en este mismo repositorio**, y su
> rol es **auditar tu dibujo antes de implementarlo**. Lo que sigue es lo que
> necesita de vos para que lo que dibujes se construya bien la primera vez.

## 0 · Tenés permiso para modificar el `.pen` · y es una excepción escrita

`CLAUDE.md` dice, de `design/design.md` y `design/Synapse_v2.pen`: **«el agente no
modifica ninguno de los dos»**. Y de la traducción: «el `.pen` se retraduzca —y
es normativo, no lo tocamos—».

**Por decisión humana del 2026-09-28 eso cambia sólo para vos y sólo para el
`.pen`:**

| | |
|---|---|
| `design/Synapse_v2.pen` | **Lo modificás vos.** Es tu trabajo |
| `design/design.md` | **Sigue intocable.** Si el dibujo lo contradice, ver §5 |
| Todo lo demás de `src/` | No es tuyo en esta sesión |

Sin esta hoja, leés `CLAUDE.md` y parás — con razón.

**Cómo se lee y cómo se escribe.** El archivo es JSON plano: se lee con
`json.loads(pathlib.Path('design/Synapse_v2.pen').read_text())`, que es lo que
hace `tools/gen-tokens.py`. Para **escribir**, usá el MCP de pencil —arrancá por
`read_skill`—; no lo edites a mano como texto.

## 1 · Lo que NO hay que dibujar · ya está

**Los 43 gráficos de «Synapse · Plots» existen.** Medido el 2026-09-28. Y los
**once** que los dashboards de MMM y de forecast necesitan están **todos**:

| | Ya dibujado como |
|---|---|
| `waterfall` | `Plot/CASCADA · Descomposición del crecimiento` |
| `tornado` | `Plot/TORNADO · Sensibilidad del pronóstico` |
| `stackarea` | `Plot/ÁREA APILADA · Tráfico por fuente` |
| `combo` | `Plot/COMBINADO · Inversión y ROAS` |
| `marimekko` | `Plot/MARIMEKKO · Canal por división` |
| `scatter` | `Plot/DISPERSIÓN · CPA contra ROAS por campaña` |
| `bubble` | `Plot/BURBUJAS · Categorías: venta, margen y unidades` |
| `cuadrantes` | `Plot/CUADRANTES · Cartera de estilos` |
| `pareto` | `Plot/PARETO · Causas de rechazo del feed` |
| `control` | `Plot/CONTROL · Conversión con banda de control` |
| `interval` | `Plot/INTERVALO · Estimaciones con rango` |

**El cuello de botella de los gráficos NO es diseño: es el front.** Se construyeron
6 plots de 43, y falta un campo en el contrato para que un panel pueda decir qué
gráfico quiere — `docs/PROPUESTA-2026-09-28-identidad-del-grafico.md`. Redibujar
cualquiera de estos once es trabajo perdido.

## 2 · Lo que sí está abierto y esperando a diseño

Cada uno tiene su propuesta escrita, con lo que se midió y lo que se descartó.
**Leelas antes de dibujar**: contestan preguntas que ya se hicieron.

| Qué falta decidir | Dónde está la pregunta |
|---|---|
| Navegación entre superficies · el `.pen` no la dibuja en ninguna de sus quince pantallas | `docs/PROPUESTA-2026-09-25-navegacion-entre-superficies.md` |
| El degradado | `docs/PROPUESTA-2026-09-25-degradado.md` |
| Siete divergencias del `.pen` · radio y velo de la hoja, dos tamaños que la escala no emite, logotipo a color, punto decimal | `docs/PROPUESTA-2026-09-22-divergencias-con-el-pen.md` |
| Dónde va el selector de dashboard · el navbar ya tiene ocho elementos y a 768 no entra | `docs/PROPUESTA-2026-09-26-selector-de-dashboard.md` |
| El canvas del builder · qué hace el cursor al arrastrar | `docs/PROPUESTA-CANVAS-2026-09-15.md` |

**Y dos que no tienen propuesta porque son nuevas del 2026-09-28:**

- **Los dashboards de MMM y de forecast.** No están mapeados. Los **gráficos**
  están; lo que no existe es la pantalla que los compone — qué pestañas, qué
  paneles, en qué orden.
- **«Guardar como plantilla».** La dirección nueva es que el admin da de alta,
  compone el dashboard, y **eso** se guarda como plantilla. No hay pantalla ni
  flujo dibujado.

## 3 · Las reglas duras que la auditoría va a revisar

Son de `design.md` y no son negociables. Si el dibujo necesita romper una, eso es
una propuesta de spec (§5), no un dibujo.

**Color**

- **Un hex literal es un bug.** Todo color sale de un token: `$ink`, `$dim`,
  `$elev`, `$acc`, `$w2`, `$w3`, `$w4`.
- **El naranja `$acc` NO es color de datos.** Nunca en una serie, barra, celda o
  nodo. Sólo CTAs, estado activo, enlaces y cifras resaltadas en prosa.
- **Ámbar y amarillo: prohibidos.**
- **Deltas en color neutro.** El signo comunica dirección; verde/rojo semántico
  está prohibido.
- La familia cromática de una serie **se lee del catálogo**, no se elige.

**Tipografía**

- **Ningún número desnudo**: todo valor lleva su label en **mayúsculas, mono
  10px, `0.12em`, gris**.
- **El tracking va en `em`**, no en px. El `.pen` ya tiene 1.2px sobre el label de
  10 y 1.08px sobre la nota de 9: son el mismo `0.12em`.
- **Mono tiene exactamente cuatro tamaños** —nota 9, label 10, cifra 11, celda
  12— y §2.3 los cierra: «ningún otro tamaño mono». Un quinto rompe el chequeo.
- Los tamaños que no son mono salen del censo de nodos del propio `.pen`. **Un
  tamaño nuevo agrega un token**, así que decilo (§4).

**Geometría**

- **Toda altura de panel es un `rowSpan`**: `px = 96·N − 16`. Ninguna altura
  suelta.
- La grilla es de 12 columnas; los spans se dividen a la mitad redondeando hacia
  arriba al colapsar, no se recortan.
- **El mínimo de la consola son 360px**, no 768.

**Contenido**

- **Los textos de UI van en español.** El producto habla español y el `.pen` es
  la fuente normativa de ese literal.
- **Un estado reemplaza el cuerpo, nunca el shell**: título, BASE y procedencia
  siguen visibles mientras el panel carga, falla o está bloqueado.
- **Un estado vacío lleva salida propia.** Si reemplaza la pantalla entera, sin
  un control para volver el usuario queda encerrado — ya pasó dos veces.
- **Nada de vocabulario de infraestructura** en las pantallas de admin: ni base,
  ni rol técnico, ni warehouse, ni grants. Se muestra la **consecuencia**.

**Convenciones de nombre · de esto dependen los chequeos**

- Pantallas: `A1 · …`, `B3 · …`, `C1 · …`. El prefijo es lo que
  `tools/pen-pantallas.py` reconoce.
- Gráficos: `Plot/NOMBRE · descripción`, dentro de «Synapse · Plots».
- **El frame lleva los números y el literal de la UI; la nota lleva el porqué.**
  La auditoría lee el frame primero — así aparecieron el velo de la hoja del chat
  y las tres superficies, que las notas no decían.

## 4 · Qué se rompe en la puerta cuando tocás el `.pen`

Corré `npm run verify` después de cada cambio. Dos chequeos dependen del dibujo:

| Chequeo | Qué pasa | Qué hacer |
|---|---|---|
| `token-drift` | Compara `src/tokens/` contra el `.pen` **byte a byte**. Cualquier token nuevo, cambiado o con otro comentario lo pone en rojo | `npm run gen:tokens` y volver a correr |
| `pen-pantallas` | Falla con **cualquier pantalla nueva** que no esté declarada en el registro del plan | Declararla en `plan-de-trabajo.md`, con su archivo o la razón por la que todavía no |

**Y un hueco que conviene que sepas: los 43 gráficos NO los mira ningún
chequeo.** `pen-pantallas` reconoce `A*`, `B*` y `C*`. Si agregás, cambiás o
sacás un gráfico, **la puerta no se entera** — avisalo a mano.

## 5 · Cuando el dibujo y `design.md` no coinciden

Pasa, y hay una regla:

> **El `.pen` gana en lo visual y en el literal de la UI. `design.md` gana en las
> reglas duras.**

**No se resuelve en silencio.** Se abre una propuesta en
`docs/PROPUESTA-<fecha>-<tema>.md` y se registra el patrón si hiciera falta. Una
divergencia resuelta callando es cómo se pierde una decisión que alguien tomó.

Y no edites `design.md` para que coincida. Es la otra mitad de la misma regla.

## 6 · Qué necesita la auditoría de vos

**Que digas qué cambió.** El `.pen` es un JSON grande y un `git diff` no se lee:
un cambio de tres nodos y uno de trescientos se ven igual.

Con esto alcanza, en el mensaje del commit o en un comentario:

- **Pantallas** agregadas, renombradas o borradas, con su id.
- **Gráficos** agregados, cambiados o borrados, con su nombre completo.
- **Tokens** tocados — son los que mueven `token-drift` y llegan a `tokens.css`.
- **Tamaños de texto nuevos**, que son tokens aunque no lo parezcan.
- **Lo que rompe una regla de §3 a propósito**, con su razón. Eso es una
  propuesta, no un defecto, y conviene que llegue nombrada.

**Un commit por cambio coherente** vale más que uno grande: la auditoría se
hace sobre lo que cambió, no releyendo 43 frames cada vez.
