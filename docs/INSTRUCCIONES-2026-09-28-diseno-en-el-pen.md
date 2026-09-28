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

- ~~**El dashboard de forecast.**~~ **Dibujado el 2026-09-28** como
  `Consola · C1 · Forecast`, y declarado en el registro con su razón: espera dos
  filas de catálogo y su panel F5 va `BLOQUEADO` a propósito. La hoja decía que
  faltaba y la sesión que dibuja lo tomó — funcionó como se esperaba.
- **«Guardar como plantilla».** La dirección nueva es que el admin da de alta,
  compone el dashboard, y **eso** se guarda como plantilla. No hay pantalla ni
  flujo dibujado.

> ### ⚠️ CORRECCIÓN · 2026-09-28 · **el dashboard de MMM YA ESTÁ DIBUJADO**
>
> Esta hoja decía que «los dashboards de MMM y forecast no están mapeados».
> **Del de MMM era falso**: existe `Consola · C1 · Media Mix`, con su pestaña
> sumada al menú de capítulos y cinco paneles —29 ajuste del modelo, 30 error de
> predicción, 31 antigüedad del modelo, 32 aporte por canal, 33 retorno por canal
> con banda—. **Y ya estaba declarado en el registro del plan**, como F3.11,
> diferida por D3.
>
> **Lo encontró la sesión que dibuja, no yo, y el error es el de siempre:** miré
> «Synapse · Plots» y las pantallas que ya conocía en vez de listar los **97
> nodos raíz** del archivo. Armar la consulta desde lo que espero encontrar, otra
> vez.
>
> **Antes de decir que algo no está dibujado, se listan los 97**, no un subconjunto:
>
> ```python
> import json, pathlib
> d = json.loads(pathlib.Path('design/Synapse_v2.pen').read_text())
> [c['name'] for c in d['children']]
> ```

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

**El hueco de los 43 gráficos se cerró** · 2026-09-28. Decía acá que ningún
chequeo los miraba y que había que avisarlo a mano — y tuviste que hacerlo, con
el rótulo de `Plot/PRONÓSTICO`. Ahora hay **`npm run pen-graficos`**, en la
puerta.

Lleva una huella por gráfico en `tools/pen-graficos.json` y **falla con
cualquiera que aparezca, desaparezca o CAMBIE** — que era tu caso. Mover el
gráfico entero dentro de la página no cuenta como cambio; mover algo adentro, sí.

**Cuando te salga en rojo, es una invitación a mirar y no un error**: revisás el
gráfico y corrés `python3 tools/pen-graficos.py --sellar`. Sellar es el acto
explícito que dice «lo vi y es lo que quiero», igual que una desviación
registrada en `contraste`. Y como el `.pen` es tuyo, **el sello lo corrés vos**.

## 4b · MIRAR EL DIBUJO ANTES DE COMMITEAR · y cómo se mira

**Decidido con un humano el 2026-09-28**, después de que la primera tanda se
commiteara sin ver nada. Al exportar las pantallas aparecieron **cinco defectos
en una sola**, y ninguno lo había visto la puerta, ni la verificación de recortes,
ni la auditoría: un slot de base metodológica vacío que el editor pinta como una
caja violeta, dos paneles con la medida equivocada por eso mismo, un plot estirado
con su punto flotando fuera de la línea, un rótulo ilegible por contraste y una
barra inferior que seguía diciendo `MEDIA MIX` heredado de la copia.

**La regla: ninguna pantalla nueva se commitea sin haberla exportado y visto.**
La estructura se verifica con `ctx.problems` y las medidas con `ctx.bounds`, y eso
**no alcanza**: los cinco defectos pasaban las dos cosas.

### La receta

**El CLI instalado global —0.3.2— NO exporta imagen.** Ni él ni el MCP tienen
`screenshot`, `export`, `render` ni `preview`; el `--enable-preview` sólo escribe
una miniatura del lienzo entero, ilegible. **La 0.3.9 sí**: trae `Export` y
`TakeScreenshot` dentro de `execute`.

```bash
cp design/Synapse_v2.pen "$TMP/ver.pen"          # 1 · SIEMPRE sobre una copia
printf 'execute({ input: %s })\nexit()\n' \
  "'Export([\"<nodeId>\"], \"png\", \"$TMP/exp\")'" > "$TMP/e.txt"
npx -y @pen.dev/cli@latest interactive --in "$TMP/ver.pen" --out "$TMP/ver.pen" < "$TMP/e.txt"
```

Después se abre el PNG con la herramienta de lectura de archivos, que lo renderiza.

**NO CORRER EL CLI NUEVO CONTRA `design/Synapse_v2.pen`.** La primera corrida se
hizo así y **migró el archivo de la versión 2.17 a la 2.18**, moviendo de paso la
`y` de dos notas — y después de eso **el 0.3.2 dejó de encontrar nodos por id** en
su propio archivo. Se revirtió con `git restore`. De ahí la copia del paso 1.

### Qué mirar en el render

- **Cajas con borde violeta**: son slots sin llenar. Buscá el componente armado
  del sistema —`Sec · <tipo> armado`— y copiá cómo los llena.
- **Huecos grandes**: el panel está más alto que su contenido. La altura sale de
  lo que el cuerpo mide, no de lo que parece prolijo en la grilla.
- **Plots**: van a su tamaño natural. Estirarlos mueve los paths y deja atrás el
  punto, el rótulo y los ejes, que son nodos aparte.
- **Texto sobre una banda de datos**: dos claros no contrastan. Si el rótulo cae
  sobre el área de la serie, movelo afuera antes de cambiarle el color.
- **Textos heredados de la copia**: la barra inferior, la cabecera y el contexto
  traen el nombre de la pantalla que copiaste.

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

### Y una regla que sale de haberla roto · 2026-09-28

**Nadie usa `git add -A` ni `git add .` en este repositorio mientras seamos dos
sesiones.** Se agregan **rutas explícitas**.

No es teórico: el commit `90294ea` de la sesión de código —que hablaba de
Snowflake— se llevó `design/Synapse_v2.pen` con 2.234 renglones,
`docs/B0.9-preguntas-abiertas.md` y la fila del registro del plan, que estaban
escribiéndose en paralelo. No se perdió nada, pero **el cambio del dibujo quedó
bajo un mensaje que no lo nombra**, que es justamente lo que §6 existe para
evitar.

### Y con un archivo COMPARTIDO, nombrarlo no alcanza · 2026-09-28

**Volvió a pasar cumpliendo la regla.** `b39bb4e` agregó `plan-de-trabajo.md`
por nombre —explícito, como pide arriba— y se llevó igual una edición ajena,
porque el archivo lo escriben las dos sesiones.

**Antes de `git add` sobre un archivo compartido, se mira si tiene cambios que
uno no hizo**:

```sh
git diff --stat plan-de-trabajo.md docs/B0.9-preguntas-abiertas.md
```

Si hay algo que no es tuyo, **no lo agregues**: avisá y que lo commitee quien lo
escribió. Los compartidos hoy son `plan-de-trabajo.md`,
`docs/B0.9-preguntas-abiertas.md`, `design/Synapse_v2.pen` y los generados que
salen de ellos.
