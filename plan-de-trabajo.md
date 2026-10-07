# Plan de trabajo · Synapse front dinámico

**2026-09-01** · Deriva de `nuevo-desarrollo.md` (normativo) y **extiende**
`tareas-front-back.md`, que sigue siendo válido: se conservan sus identificadores
`B*` / `F*` para no perder el hilo. Lo que este documento agrega va marcado `➕`.

## Una sola fuente

**Este archivo es la fuente. Todo lo demás se genera con `npm run plan`.**

| Archivo | Rol |
|---|---|
| `tareas-front-back.md` | **ANCESTRO** · el espacio de identificadores, compartido con el backend |
| `plan-de-trabajo.md` | **FUENTE.** Se edita a mano |
| `plan-tareas.csv` | derivado · una fila por tarea, para importar |
| `tools/plan-synapse.html` | derivado · la página navegable |
| `docs/PARA-BACKEND.md` | derivado · **lo que se le manda al backend** |

### Y nada más. Los documentos no se acumulan

El 2026-09-14 había **cuatro documentos** diciendo qué le falta al backend —uno
escrito a mano en `docs/`, la §4 de otro, un estado por tarea y los de
Snowflake— y el más viejo anunciaba como faltantes ocho rutas que ya estaban
servidas. **Un documento para otro equipo que miente es peor que no tenerlo**: se
lee, se planifica contra él, y el error aparece semanas después.

La regla es la misma que ya regía para el CSV: **lo que se le pide al backend
vive en la tarea que lo espera**, con un marcador, y el documento sale de ahí.

```
**Espera del backend.** <qué falta> · <por qué bloquea>
```

`npm run para-backend` lo recoge y regenera `docs/PARA-BACKEND.md` entero. Una
tarea que se desbloquea saca su pedido sola, y **una tarea en `✅` que todavía
pide algo es una contradicción que el chequeo reporta** — o no estaba cerrada, o
el pedido se cumplió y quedó el marcador. Corre en la puerta; verificado por
mutación colgándole un pedido a `F1.37`.

El marcador **no viaja al CSV**: no es un criterio de aceptación sino una
dependencia, y contarlo como prosa rompería el agrupado de las tareas que
comparten bloque. Lo que sí hace es marcar la tarea como bloqueada, que es lo que
el ticket necesita saber.

### El estado de las tareas `B*` lo mueve el front · 2026-09-14

**Decisión.** El front hace la integración final de todo lo que entrega el
backend, así que **es el front quien marca una tarea `B*` como hecha** — y solo
después de verificarla **contra el servicio corriendo**, no copiando el estado de
`docs/dynamic-dashboard-backend.md`.

**Por qué, y no es desconfianza.** Su documento marca `B1.13` como hecha —
`Presentation` opcional— y es cierto para dos de las nueve formas. Ninguno de los
dos está equivocado: ellos entregaron lo que su tarea decía, y el criterio de la
nuestra pide más. **La única forma de saber cuál de las dos cosas está en la
pantalla es mirarla.**

**La consecuencia es una obligación nuestra:** una tarea `B*` en `✅` o `⚠️` lleva
escrito **cómo se verificó** — qué endpoint, qué respondió, qué fecha. Una sin
eso es una suposición con forma de hecho, y `docs/ESTADO.md` la va a publicar
como avance.

Mientras una `B*` no se haya verificado se queda en `⬜`, **aunque ellos la den
por cerrada**. Eso hace que el número de backend de `ESTADO.md` salga bajo, y es
correcto que salga bajo: mide lo que el front pudo comprobar, no lo que el
backend construyó. El documento lo dice en su propia sección.

### Auditar el plan · a demanda, no en loop

Los chequeos deterministas corren solos en la puerta —`plan:ancestro`,
`para-backend`, `docs-registro`, y `plan:diff` contra un export—. Lo que ellos no
pueden contestar es **si un `✅` está sostenido de verdad** y **si dos documentos
dicen lo mismo**: eso necesita juicio, y va en la skill `auditoria-plan`.

**A demanda y no en loop**, por dos razones. Un agente que confirma que nada
cambió el 95% de las veces gasta sin devolver, y —peor— un agente que opina
sobre el estado se vuelve **una segunda fuente**, que es la enfermedad que todo
este bloque existe para curar. Se corre al cerrar un tramo o antes de informar
avances. **Reporta; no corrige**: cambiar el estado de una tarea es una decisión
de quien la pidió.

### Registro de pantallas del `.pen`

**Esta tabla es la que impide volver a construir sin abrir el dibujo, y una
máquina la hace cumplir.** `npm run pen-pantallas` lista las pantallas `A*`,
`B*` y `C*` de `design/Synapse_v2.pen` y **falla con cualquiera que no esté
acá**. Donde la fila nombra archivos, exige que lleven el ancla `§PEN:<id>`.

**Existe porque la regla escrita falló dos veces con la corrección puesta.** La
primera fue hasta el 2026-09-15 —diez pantallas de admin y builder construidas
con `CLAUDE.md` diciendo que el `.pen` eran «los tokens»—. La segunda, el
2026-09-21: `C3` y `A2` estaban dibujadas, se construyó encima de las tres y no
se abrió ninguna. **Una advertencia que no se puede comprobar no es una regla.**

**Lo que el chequeo NO hace es comparar el dibujo con la pantalla.** Eso no se
automatiza — que la hoja del chat mida 480 donde el `.pen` dibuja 940 lo
encontró un humano. Lo que garantiza es que la comparación **se haya hecho** y
que su resultado esté escrito.

| Pantalla del `.pen` | Quién la implementa, o por qué no |
|---|---|
| `Consola · C1 · eCommerce Overview` | `src/surfaces/console/Console.tsx` |
| `Consola · C1 · Brand Momentum` | La misma `Console`: la pestaña la manda el layout, no el código |
| `Consola · C1 · Product Sales` | ídem |
| `Consola · C1 · Inventory & Shopping` | ídem |
| `Consola · C1 · Media Mix` | ídem · el módulo MMM propio es F3.11, diferida por D3 |
| `Consola · C1 · Forecast` | **No construida** · dibujada el 2026-09-28 · es una pestaña más del layout, así que la pinta la misma `Console`. **Espera dos filas de catálogo** —`series_with_band` y `scalar_with_interval`—, pedidas en `docs/snowflake/PEDIDO-2026-09-28-metricas-mmm-y-forecast.md`. Su panel F5 está dibujado `BLOQUEADO` a propósito: hoy no hay pronóstico publicado |
| `C1 · 768 · seis columnas` | `src/render/useColumns.ts` · el colapso se resuelve en JS · F1.30 |
| `C1 · 360 · una columna` | ídem · el mínimo son 360 y no 768 · PS-12 |
| `Consola · C2 · Drill-down de panel` | `src/surfaces/console/DrillSheet.tsx` · F3.9, 2026-09-30 · **el candado D3 venció y se puede mostrar cuál**: las dos rutas son de `168a761`, suyas —verificado con `git log -L` sobre las dos líneas del router y con `git log --` sobre los cinco archivos del camino, ninguno con un commit nuestro— y contestan 200. **DIVERGE en cinco cosas, las cinco atadas por una aserción** en `tests/surfaces/console/drilldown.test.tsx`: (1) la frase `LA DESAGREGACIÓN CIERRA CONTRA EL TOTAL` **no se pinta y su falsedad está medida** —la cifra publicada es 1 232 721 y la desagregación suma 1 282 259 por día y por semana y 968 169 por plataforma, que lee otra tabla—; (2) tampoco el porcentaje por fila, por el mismo denominador y porque sería un cálculo; (3) `TABLA ORIGEN` y (4) `LINAJE HASTA LA FUENTE CRUDA` quedan **declaradas ausentes**: ninguna ruta devuelve filas crudas ni las cuatro capas, y de las cuatro el gobierno da una, que ya es el badge de procedencia; (5) la desagregación se dibuja con el cuerpo del registro y no con la lista de cuotas del dibujo, porque ese visual **no está en el repertorio** y un id que la tabla no declara no se puede validar contra ella. Dos ausencias más son pedido al backend y no hueco nuestro —el rótulo legible de cada dimensión, que su `DrillDimension.Label` no serializa, y el campo `dimensiones` del catálogo, vacío en las 21— · `docs/PROPUESTA-2026-09-30-divergencias-C2.md` |
| `Consola · C3 · Chat expandido` | `src/surfaces/console/ChatSheet.tsx` · la forma se cerró en F5.17; lo que queda diverge por decisión, ver `docs/AUDITORIA-2026-09-21-pen-vs-chat-y-ficha.md` §2 |
| `Consola · C3 · Chat · historial colapsado` | `src/surfaces/console/ChatSheet.tsx` |
| `Consola · C4 · Detalle de hallazgo` | **No construida** · F3.10, diferida por D3 |
| `Consola · C4 · Hallazgo fuera de banda` | **No construida** · ídem |
| `Consola · C5 · Sin permiso` | `src/render/states/ForbiddenState.tsx` |
| `C5 · Sin permiso · sin alternativas que ofrecer` | La misma: sin manejador no se pinta el CTA · la regla del CTA muerto |
| `C6 · Selector de dashboard` | `src/surfaces/console/DashboardPanel.tsx` · §PEN:C6 · **la fila la daba por pendiente y era falso desde el 2026-09-28**, el mismo día que se dibujó: el panel se construyó, reemplazó al `<select>` que F5.1 había puesto en el navbar y lo monta `Topbar.tsx:133`. Corregido el 2026-09-30 |
| `A1 · Clientes y plataforma` | `src/surfaces/admin/TenantList.tsx` |
| `A1 · Clientes · sin ningún cliente` | `src/surfaces/admin/EmptyRow.tsx` |
| `A1 · Clientes · cargando` | `src/surfaces/admin/SkeletonRows.tsx` |
| `A2 · Ficha de cliente` | `src/surfaces/admin/RoleEditor.tsx` y `src/surfaces/admin/AgentConfig.tsx` · **diverge** · misma auditoría, §8 y §9 |
| `A2 · Ficha · tenant en alta` | `src/surfaces/admin/TenantIdentity.tsx`, `src/surfaces/admin/Subprocessors.tsx`, `src/surfaces/admin/StatusChip.tsx` y `src/surfaces/admin/alta.ts`, más la rama `BLOQUEADO` de `src/surfaces/admin/AgentConfig.tsx` y el vacío de alta de `src/surfaces/admin/RoleEditor.tsx` · F5.20, 2026-09-30 · **la pantalla ADOPTA un cliente, no lo da de alta**: `POST /admin/tenants` exige cuatro credenciales que §7.3 prohíbe pedir, así que el alta la hace el equipo interno y esta ficha la muestra. **DIVERGE en seis cosas, todas anotadas y cinco de ellas atadas por una aserción**: (1) la cabecera —el dibujo pone el nombre del cliente en display 24 con una migaja encima y la aplicación pone el nombre de la PANTALLA, que tiene decisión escrita y prueba propia, así que el chip `EN ALTA` va a la fila del rótulo de identidad; (2) la migaja y el display 24 quedan sin construir; (3) `ID` pinta el identificador que el servicio da —un uuid— donde el dibujo escribe una forma corta que ningún campo trae; (4) la frase del aporte de la plantilla **no se compone**, y hay una aserción que atestigua su ausencia; (5) el vacío de roles **no lleva el icono** `users` de 22 que el frame dibuja arriba de la frase, porque esta superficie no pinta un solo icono ni tiene la biblioteca —previa y de la superficie entera—; (6) el padding del cuerpo es el de toda la superficie —24, no 32—, también previa. **Los literales del vacío SÍ son los del dibujo desde la auditoría del 2026-09-30**: la pantalla decía «Este cliente todavía no tiene roles · está en alta» + «Sin ningún rol nadie puede entrar…» en dos labels mono donde el frame escribe `SIN ROLES DEFINIDOS` en el resumen y UNA frase de `$font-body` 12.5, y los dos literales eran previos a F5.20. Se corrigieron y quedaron atados en `tests/surfaces/admin/enAlta.test.tsx` |
| `A3 · Usuarios` | `src/surfaces/admin/UserList.tsx` · F4.3, construida el 2026-09-25 · **diverge en el alcance y el candado VENCIÓ**: la pantalla lista por cliente porque cuando se construyó no había ruta global. **`GET /admin/users` contesta 200** —medido el 2026-09-30— con `total`, `tenants` y `tenant_name` por usuario, que es exactamente el alcance de plataforma que el dibujo pide. De `6e521cc`, suyo. **Es tomable** |
| `A3 · Usuarios · filtro sin resultados` | La misma: el vacío de filtro lo pinta `EmptyRow` con `clase="filtro"` y su deshacer |
| `A4 · Catálogo de métricas` | `src/surfaces/admin/CatalogView.tsx` |
| `A4 · Métricas · filtro sin resultados` | `src/surfaces/admin/EmptyRow.tsx` |
| `A5 · Salud de feeds` | `src/surfaces/admin/FeedHealth.tsx` · F4.24, construida el 2026-09-25 |
| `A5 · Feeds · tenant sin fuentes` | La misma: el vacío de alta lo pinta `EmptyRow` con `clase="alta"` |
| `A6 · Cola de accionables` | **No construida** · F3.10, diferida por D3 |
| `B1 · Selector de contexto` | `src/surfaces/builder/ContextView.tsx` |
| `B2 · Canvas de composición` | `src/surfaces/builder/Canvas.tsx` |
| `B3 · Selector de gráfico` | **`src/surfaces/builder/PanelConfigurator.tsx`** · §PEN:B3 · la columna «Cómo se ve» desde el 2026-10-07, cada opción dibujada con el dato real de la métrica · `docs/AUDITORIA-2026-10-07-editor-sin-previsualizacion.md`. Era `PlotPicker.tsx` (F4.21, 2026-09-29), borrado ese día |
| `B3 · Selector · gráfico deshabilitado por tope` | **`src/surfaces/builder/PanelConfigurator.tsx`** · §PEN:B3 · **construida el 2026-10-07**: el tope ya no se declara, se **evalúa** con el dato real del preview (`include=payloads`, que backend entregó en `d9147c3` el 2026-10-01 respondiendo a `docs/MENSAJE-2026-09-30-backend-payload-en-el-preview.md` y que no se había consumido). La opción deshabilitada pierde la vista previa y la razón va donde iría el dibujo, como pide la nota del frame |
| `B4 · Binder de métrica` | `src/surfaces/builder/PanelConfigurator.tsx` |
| `B5 · Vista previa · rol Planner sin componer` | `src/surfaces/builder/RolePreview.tsx` |
| `B6 · Historial de versiones` | **`src/surfaces/builder/VersionHistory.tsx`** y **`src/surfaces/builder/VersionCard.tsx`** · §PEN:B6 · construida el 2026-09-30. La lista sale de **`GET /admin/dashboards/{dashboardId}/publications`** y no de la de `layouts`, que devuelve **una sola fila** —medido: 5 contra 1—, porque revertir COPIA a un layout nuevo y nunca reactiva el archivado. `POST /admin/layouts/{layoutId}/revert` cubre el «REVERTIR A ESTA». **Diverge en cuatro cosas que el cable no da y NO se componen**: el `Resumen` de 13px, la línea `RAZÓN`, la fila de BORRADOR —falta una ruta de diff— y el cambio de dirección semántica, que es de la MÉTRICA y no del layout · `docs/PROPUESTA-2026-09-30-b6-prosa-del-historial.md`. **Cableada en `Builder.tsx` el 2026-09-30** y abierta contra el servicio: cinco filas en «Marca», el vacío medido en «Overview», y el navbar con `VOLVER A EDITAR` del frame `Volver` —`gwJUk`— en vez de las acciones de composición. El glifo del diff y su cruce con los contadores los arma `src/surfaces/builder/cambios.ts` |
| `B7 · Guardar como plantilla` | **No construida** · dibujada el 2026-09-28 · promueve la composición a plantilla de vertical, que es el movimiento que a §3.4 le faltaba. **No hay backend, y la razón se afinó el 2026-09-30**: el campo `vertical` SÍ existe ahora —`ports/tenant.go:46`, de `6e521cc`— pero su propio comentario dice «reservados hasta que el cliente defina sus valores (siempre nil en v1)», y **no hay ruta de plantillas**: `/admin/templates` y `/admin/verticals` dan **404**. El candado sigue, con la letra corregida |

---

### Registro de documentos · lo que `docs/` puede contener

**Esta tabla es la lista blanca, y una máquina la hace cumplir.**
`npm run docs-registro` recorre `docs/` y **falla con cualquier archivo que no
caiga en un patrón de acá**. Es el freno a lo que pasó el 2026-09-14: cuatro
documentos diciendo lo mismo y el más viejo mintiendo.

Agregar un documento es legítimo — lo que no es legítimo es agregarlo **sin
decir qué rol cumple**, porque ahí empieza la superposición.

| Patrón | Rol |
|---|---|
| `docs/ESTADO.md` | **GENERADO** · el estado del proyecto. **Lo que se consulta y se reenvía** |
| `docs/PARA-BACKEND.md` | **GENERADO** · lo que el front espera del backend |
| `docs/ESTADO-BACKEND.md` | **GENERADO** · **contra qué commit suyo está verificada cada `B*`**, y cuáles quedaron contra uno anterior. No dice cuánto hizo el backend: dice qué sabemos nosotros y desde cuándo |
| `docs/snowflake/*` | La carpeta de **ingeniería de datos**, en los dos sentidos: lo que les entregamos —instrucción y SQL— y lo que nos devuelven, como `Metricas.xlsx` o un informe. **Lo que mandan ellos no se edita**, igual que una `RESPUESTA-*`. Los PDF quedan fuera de git por `.gitignore` |
| `docs/repertorio-de-graficos.json` | **GENERADO** · las 49 entradas de `SYNAPSE_PLOTS`, desde sus cuatro fuentes. Para leerlo y para diffearlo |
| `docs/backend/*` | **GENERADO** · código Go que emitimos para el fork y que **no se edita a mano**. Hoy el seed de los 49 gráficos |
| `docs/PLAN-INTEGRACION-*.md` | El **análisis** que fundamenta los pedidos, campo por campo |
| `docs/ESTADO-*-*.md` | Un **corte** verificado contra el servicio, con fecha. No se actualiza: se reemplaza |
| `docs/BITACORA-*.md` | **Histórico.** Lo que costó descubrir. No se tocan |
| `docs/AUDITORIA-*.md` | **Histórico.** Un cruce puntual, con fecha |
| `docs/ENTREGA-*.md` | **Histórico.** Qué se entregó y cuándo |
| `docs/MENSAJE-*-*.md` | **Histórico.** Un mensaje mandado, con fecha. Qué se pidió y con qué evidencia. **Y lo que entrega va al REPOSITORIO, con su ruta escrita acá — no se adjunta** · decidido el 2026-10-02 (humano): trabajamos en ambientes separados y el canal del mensaje no lleva archivos. Lo hace cumplir `afirmaciones`: un mensaje que dice «adjunto» sin citar una ruta que exista sale en rojo |
| `docs/RESPUESTA-*-*.md` | **Histórico.** Lo que OTRO equipo contestó, con fecha. No lo escribimos nosotros y **no se edita**: si algo de ahí resulta inexacto, se dice en la respuesta nuestra, no corrigiendo la suya |
| `docs/B0.9-preguntas-abiertas.md` | Las preguntas del contrato, con su resolución |
| `docs/PROPUESTA-*-*.md` | Una **propuesta de spec** abierta, con fecha. Lo que `design.md` no declara y el código no puede inventar |
| `docs/DECISIONES-*-*.md` | Decisiones ya **tomadas** sobre una spec, con lo que se midió para tomarlas y lo que se descartó. Es el par de `PROPUESTA-*`: aquella pregunta, ésta contesta — y no se edita después, porque la decisión tiene fecha |
| `docs/F1.28-escala-tipografica.md` | La bitácora de una tarea que cambió el sistema |
| `docs/FOLDER_STRUCTURE.md` | La estructura de `src/`, para quien llega |
| `docs/RUNBOOK-*.md` | **Un procedimiento que se CORRE, y se mantiene.** Es el único rol sin fecha en el nombre, a propósito: los demás son cortes que vencen y éste se corrige en su lugar. Su lector es el equipo interno, así que **sí nombra bases, roles y grants** — lo que §7.3 prohíbe en pantalla vale para las pantallas, no para quien opera esa capa |
| `docs/REPERTORIO-*-*.md` | Una **transcripción** de una fuente normativa a forma implementable, con de dónde sale cada columna. La implementa OTRO equipo; el contrato declara su esquema y acá viven las filas |
| `docs/INSTRUCCIONES-*-*.md` | Lo que **otra sesión** necesita saber para trabajar en paralelo sin pisarnos. Incluye las excepciones a `CLAUDE.md` que un humano autorizó, con fecha |
| `docs/historico/*` | Documentos **vencidos**, con el aviso adentro. No se consultan para planificar |
| `docs/backdocs/*` | Material del equipo de backend · **ignorado por git** |

Los dos derivados **se pisan enteros** en cada corrida: editarlos a mano es
trabajo que se pierde. Un solo parser produce los dos —`tools/plan-a-csv.py`
emite el JSON que consume `tools/plan-a-html.py`— para que no puedan
desincronizarse entre sí.

`npm run plan` **falla** si alguna tarea quedó sin criterio de aceptación. La
regla de este documento la hace cumplir una máquina, no la revisión.

Lo que no es una tarea —decisiones, convención, camino crítico, transversales—
**no tiene fila en el CSV** y vive solo acá.

### La plataforma de seguimiento refleja; no manda

**Decisión del 2026-09-01: este archivo sigue siendo la fuente también después
del import.** La plataforma se usa para operar —asignar, mover, comentar— pero el
estado de una tarea se cambia acá y se vuelve a exportar.

Eso tiene un modo de fallo conocido: alguien mueve un ticket en la plataforma, el
`.md` no se entera, y a partir de ahí los dos dicen cosas distintas sin que nadie
lo note. **La regla no se sostiene sola, así que se verifica.**

```
npm run plan                    regenera CSV y página desde este archivo
npm run plan:diff <export.csv>  compara un export de la plataforma contra este archivo
```

`plan:diff` sale con **0** si están alineados y **1** si hay deriva, la misma
convención que `make verify`. Reporta cuatro cosas:

| | Qué significa |
|---|---|
| **Ticket sin tarea** | Se creó en la plataforma y no existe acá. O se agrega al `.md`, o se borra allá |
| **Tarea sin ticket** | Está acá y no se importó. Falta correr el import |
| **Estado distinto** | Alguien lo movió en la plataforma. Se decide cuál gana y se corrige el otro |
| **Título distinto** | Se editó de un solo lado |

El import es **idempotente**: la columna `ID` es la clave externa, así que volver
a importar el CSV actualiza los tickets existentes en vez de duplicarlos.
Configurar ese campo en la plataforma es parte de T6.

### Los identificadores salen del ancestro, y eso ahora se verifica

**`tareas-front-back.md` es el ancestro común de los dos planes.** Está en la
raíz de este repositorio y en la de `synapse-api-go`, **byte a byte iguales**
—mismo md5, comprobado el 2026-09-14—. Este archivo declara desde su primera
línea que conserva sus `B*` / `F*` «para no perder el hilo», y lo cumple: los 151
identificadores siguen acá, 144 con tarea propia y 7 absorbidos por otra que dice
cuál.

**Esa promesa no la verificaba nadie hasta hoy**, y el día que se miró apareció
por qué importa: `docs/dynamic-dashboard-backend.md` del backend **renumeró desde
`B1.4`** y comprimió las 19 tareas de Fase 1 en 14. Su `B1.13` es el `B1.18` de
acá. Con los códigos ya cargados en la plataforma, un ticket que diga «B1.13
hecho» se entiende como «presentación lista» o como «catálogo sincronizado» según
quién lo lea.

**Un identificador que significa dos cosas es peor que dos identificadores**: se
lee, se entiende al revés, y nadie se entera hasta que alguien entrega otra cosa.

```
npm run plan:ancestro     los IDs del plan == los del ancestro
```

Corre en la puerta. Falla si un ID del ancestro **desaparece sin dejar dicho
dónde fue** — o tiene encabezado propio, o alguien escribió qué tarea lo
absorbió. Lo que agregamos nosotros —los `➕`— se informa y no se marca: sumar
tareas es normal, reasignar identificadores no.

Verificado por mutación renumerando `B1.13`, que es exactamente lo que pasó del
otro lado.

**Lo que se le pidió al backend** está en
`docs/ESTADO-B1.13-B1.19-2026-09-14.md`: volver a los IDs del ancestro, o
agregar una columna de equivalencia. Es edición de un documento; no hace falta
que toquen su historia.

## Cómo leer el estado

| | |
|---|---|
| ✅ | hecho y verificado (`tsc -b`, `oxlint` y `build` en verde) |
| ⚠️ | parcial — el criterio de aceptación no se cumple entero |
| ⬜ | pendiente |
| 🕓 | **diferida** — fuera del alcance actual; entra cuando el backend llegue a ese tramo (D3) |
| ➕ | **no estaba en `tareas-front-back.md`.** Se agrega acá |
| 🔒 | bloqueada, con la dependencia declarada al lado |

Toda tarea lleva **título**, **descripción** y **criterio de aceptación**. Una
tarea sin criterio verificable no entra al plan.

---

## 0 · Decisiones tomadas · 2026-09-01

Las seis del 2026-09-01 quedaron resueltas, y D7 se agregó el 2026-09-02. Se
conservan acá con su resolución porque explican por qué el plan tiene las tareas
que tiene.

### D7 · `.cursorrules` se reconcilia con §4 · **2026-09-02**

Auditando la estructura contra los ejemplos del §14 aparecieron **tres reglas de
`.cursorrules` que contradicen a `nuevo-desarrollo.md`**, y el código seguía a
`nuevo-desarrollo.md` en dos de ellas sin que estuviera escrito por qué.

| `.cursorrules` decía | §4 dice | Resuelto |
|---|---|---|
| Carpeta por componente + `.types.ts` + `index.ts` | Regla 3: «un componente, **un archivo**, una exportación nombrada», y los 19 ejemplos de §14 dan rutas planas | Archivos planos |
| «Variantes vía props (`variant`, `size`)» | Regla 4 nombra `variant="compact"` **como el anti-patrón**: «rama explícita documentada, no un flag suelto» | Composición |
| «Soportar `className` para extensión desde el exterior» | Regla 9: «todo color, radio y espaciado sale de custom properties en `tokens/`» | **`render/` no acepta `className`** |

**Gana `nuevo-desarrollo.md`**, que es la fuente específica de este front;
`.cursorrules` traía la convención genérica de un scaffold de Tailwind.

**La tercera es la que tenía consecuencia real.** Una clase inyectada por el
llamador es el agujero por donde entra un valor que no es token, y es un agujero
que el lint **no puede tapar de otra forma**: `design-lint` mira el archivo donde
la clase se escribe, no dónde se aplica, así que un `bg-slate-800` pasado como
prop desde una superficie esquiva L1 y `token-drift` sin dejar rastro.

Se agregó como chequeo **fuera de las 15** —el precedente lo sienta
`design-lint.md` con `repertorio`—, así que la decisión es verificable y no
aspiracional. Con ella se borró `src/lib/cn.ts` y sus dos dependencias, `clsx` y
`tailwind-merge`: sin clases externas que fusionar, `cn()` no tenía qué hacer. El
front queda en **siete dependencias de runtime**.

**La regla 3 también se volvió verificable.** «Un componente, un archivo, una
exportación nombrada» estaba en §4 desde el principio y no la miraba nadie:
`states/States.tsx` tenía cinco, contra la ruta explícita de §14.11
(`states/EstadoCargando.tsx`). Se partió en seis archivos —los cinco estados más
`StateBody` e `Icon`— y se agregó el chequeo, también fuera de las 15.

`render/plots/core/` queda excluido con la razón escrita: §6.2 nombra a las
primitivas de dibujo como un JUEGO —«las seis primitivas»— y `Bars`, `Line`,
`Area` y `Dots` comparten helpers privados; separarlas obligaría a exportarlos.

**Partir el archivo destapó dos defectos que la co-ubicación escondía.**

1. `ErrorState` pasaba `onRetry` donde `Exit` espera `onClick`, y el spread de
   JSX lo dejó pasar sin que el compilador lo viera: **el botón de reintentar se
   pintaba y no llamaba a nada**. Es el mismo agujero que ya había aparecido con
   `onChat`. Ahora hay una prueba por cada estado que verifica que el CTA
   DISPARE, no que exista.
2. `DegradedBadge` armaba un label a mano con las utilidades de §2.3, y L15 no lo
   veía porque compartía archivo con `Provenance`, que sí importa `Label` — el
   detector mira el archivo entero. Solo, quedó a la vista. Ahora compone
   `<Label>` y se queda solo con el fondo, que es lo único propio del badge.

Es una propiedad del chequeo que vale anotar: **un componente por archivo hace
más preciso a L15**, porque su guarda «si el archivo importa `Label`, no marques»
deja de cubrir a los vecinos.

Queda una salvedad escrita: la restricción de `className` es de `render/`. `admin/` y `builder/`
son otras superficies y pueden necesitar componentes genéricos con `className`;
eso es Fase 4 y se decide ahí.

### D1 · El colapso responsive **entra**

§3.1 de `design.md` declara tres pisos de ancho —768 la consola colapsando el
grid, 1280 administración, 1600 el builder— y por debajo de 768 no se degrada: no
se soporta. En v2 está implementado, con ancla de spec y prueba.

**Resolución: entra.** `columnsFor()` ya está escrita en `render/grid.ts`; falta
cablearla. **Desbloquea F1.30.**

### D2 · El layout declara el gráfico — y primero se declaran los mínimos

La pregunta era si `PanelConfigurado` debía llevar el gráfico además del tipo de
bloque. La observación que la acompañó es la que ordena la respuesta: *los
gráficos dependen de los datos, y hay que establecer los datos mínimos para
construir el gráfico*.

**Resolución: sí, el layout declara el gráfico. Pero el entregable importante no
es el campo — es la tabla de mínimos, y va primero.**

Por qué en ese orden:

1. Agregar `plot?: PlotId` al layout es barato y no rompe nada: ausente ⇒ el
   gráfico por defecto del tipo, que es exactamente lo que se dibuja hoy.
2. Lo que hace que esa elección sea **segura** todavía no existe.
   `contracts/synapse-plots.js` declara `formas` (qué formas acepta cada
   gráfico), `soportaBanda` y `tope` (el límite superior que lo deshabilita, con
   su razón). **No declara mínimos.**
3. Sin mínimos, un gráfico elegido en el builder puede recibir dos puntos donde
   necesita cinco y **dibujar algo que engaña**. Con mínimos, el panel degrada
   honestamente —«este corte necesita al menos tres categorías; llegaron dos»—,
   que es lo que §8 pide de un estado vacío: invitación a actuar, no un error.
4. Y los mínimos sirven **aunque D2 se hubiera resuelto que no**. Hoy, con un
   solo gráfico por tipo, nada impide que `bars` reciba un ítem y dibuje una
   barra sola. El problema ya existe; elegir gráfico solo lo multiplica.

Cada entrada del repertorio queda declarando cuatro cosas:

| Campo | Estado | Qué dice |
|---|---|---|
| `formas[]` | ya existe | qué formas de dato sabe dibujar |
| `soportaBanda` | ya existe | regla dura: `serieConBanda` solo va a gráficos con banda |
| **`minimos`** | **falta** | cuántos puntos, categorías o partes necesita, **y la razón** |
| `tope` | ya existe | el límite superior, con la razón que se muestra |

Ejemplos de mínimo: una serie necesita ≥2 puntos —con uno no hay línea, hay un
punto—; una composición ≥2 partes, porque un 100% de una sola parte no informa;
una distribución ≥3 cortes; un ranking ≥3 ítems.

**Quién valida: los tres, desde la misma tabla.** El builder en tiempo real para
no dejar componer algo imposible; `layouts/{id}/validate` del lado del servidor,
que es el que decide; y el adaptador del front, que detecta en desarrollo que
llegó un layout malo. Ninguno lleva la tabla escrita adentro.

**Agrega B1.21** (los mínimos, Fase 1 — sirven ya) y **F4.21** (el selector de
gráfico del builder). **Reescribe B4.16 y desbloquea F1.31.**

### D3 · Las cuatro superficies de v2 quedan **diferidas**

Drill-down C2, hallazgos C4 con el framework de accionables `PS-17`, el viaje de
solicitud de acceso, y el módulo MMM.

**Resolución: no se descartan y no se planifican todavía. Quedan anotadas como
diferidas, y entran cuando el backend llegue a ese tramo.** El contrato ya las
cubre —`/config/decisiones`, `/config/accionables`,
`/config/accionables/{id}/respuesta` y `/config/solicitudes` están en el yaml—,
así que lo que falta es el servicio, no el diseño.

Llevan estado propio **`diferida`** para que en la plataforma de seguimiento no
se confundan con lo pendiente del sprint: **F3.9, F3.10, F3.11, F5.4, B5.4.**

### D4 · TypeScript baja a 5.9 · **hecho**

El andamio pinaba `typescript@~6.0.2` y `openapi-typescript@7` declara peer
`^5.x`, así que `npm install` lo rechazaba y la generación corría por `npx`.
`nuevo-desarrollo.md` §4 exige que `api/types.ts` se genere desde OpenAPI, así
que la cadena de generación manda sobre la versión del compilador.

**Resolución: `typescript@~5.9.3`.** Se quitó `ignoreDeprecations: "6.0"` del
`tsconfig.app.json`, que solo existe en TS 6. Verificado el 2026-09-01:
`npm install` sin `--legacy-peer-deps`, `npm run gen:api` corre desde el
`package.json`, y `tsc -b`, `build` y `lint` en verde. **Cierra F0.10.**

### D5 · La puerta de calidad **se porta**

`nuevo-desarrollo.md` no la menciona, y con razón: **es de nuestro lado, no del
desarrollador del backend.** Por eso no la contempla, no porque la descarte.

**Resolución: se porta.** `design-lint` reapuntado a Tailwind, `spec-anclas`,
`token-drift` y `contract-drift`. El antecedente es concreto: el 2026-08-20 en v2
el colapso responsive violaba §3.1 de tres formas distintas **con 184 pruebas en
verde**, porque estaban escritas mirando el código. **Desbloquea F0.11 y F0.12.**

### D6 · `Metrica.base` — **se cierra la propuesta de spec**

§6.2 y §17 del documento declaran `base` obligatorio en el catálogo. El yaml ya
lo tiene en `required`; `design.md` todavía no.

**Resolución: se cierra, para mantener las tres fuentes alineadas.** La propuesta
sube al humano —el agente no modifica `design.md`— y al aprobarse, catálogo, yaml
y spec dicen lo mismo. **Cierra T8.** Consecuencia directa: un panel `BLOQUEADO`,
que no lleva `Gobierno`, **puede** mostrar su BASE, y eso es lo que hace posible
el criterio de F2.6 y F1.13e.

---

## Convención de identificadores

**La fase va en el identificador.** Es lo que permite que una tarea llegue sola a
la plataforma de seguimiento sin perder su lugar en el plan.

```
B 1 . 6        F 1.13 a
│ │   │        │ │    └── sub-tarea de un traslado partido
│ │   └─ número dentro de la fase
│ └───── FASE (0–5)
└─────── EQUIPO · B backend · F front
```

`B1.6` es **backend, fase 1, tarea 6**. `F1.13a` es **front, fase 1, tarea 13,
parte a**. Las transversales van `T*` y no llevan fase porque no son de una.

Cada tarea exporta además su fase como campo propio en `plan-tareas.csv`, junto
con el epic al que pertenece.

## Estados

| Estado | Qué significa en la plataforma |
|---|---|
| `hecho` | Cerrada y verificada |
| `parcial` | Abierta — parte del criterio se cumple |
| `pendiente` | Abierta, sin empezar, sin bloqueo |
| `bloqueada` | Abierta, con dependencia declarada que hay que cerrar antes |
| `diferida` | **Fuera del alcance actual.** Entra cuando el backend llegue a ese tramo (D3). No se planifica ni se estima todavía |

---

# Backend

## Fase 0 — Fundamentos e infraestructura

### B0.1 ✅ Esquema Postgres

**Verificado el 2026-09-29 contra `de881e1`** · Las doce tablas existen en la base local, leídas de `information_schema` · `agents dd_catalog_metrics dd_dashboards dd_feeds dd_layout_publications dd_layout_versions dd_materialize_runs dd_panel_data dd_panels dd_tabs roles tenants`.
**Descripción.** Modelar el almacenamiento: `tenants`, `roles`, `users`,
`layout_versions`, `tabs`, `panels`, `panel_options`, `panel_data`,
`catalog_metrics`, `agent_configs`. `panel_data` es el snapshot materializado y
no una vista sobre Snowflake.
**Criterio de aceptación.**
- Las migraciones corren de cero sobre una base vacía y son reversibles.
- Un panel se ancla a `metric_id`; **ninguna tabla guarda SQL ni nombre de tabla
  de Snowflake** asociado a un panel.
- `panel_data` tiene clave `(tenant_id, metric_id, periodo)` y columnas para el
  gobierno completo: `base`, `capa`, `fuente`, `frescura`, `catalog_version`.
- Existe un diagrama o un `schema.sql` versionado en el repo del backend.

### B0.2 ✅ Versionado de layout

**Verificado el 2026-09-29 contra `de881e1`** · `dd_layout_versions` trae `version_id`, `status`, `published_at`, `published_by` y `published_by_email`.
**Descripción.** Un layout tiene versiones con estado `draft` | `published`.
Publicar congela una versión, le asigna `versionId` y sella `publishedAt`.
**Criterio de aceptación.**
- Editar un layout publicado crea un borrador nuevo; **nunca muta el publicado**.
- Un tenant tiene como máximo un layout publicado por dashboard en un momento.
- Se puede consultar el histórico de versiones con quién publicó y cuándo.
- Publicar invalida la cache de layout de ese tenant (ver B2.8).

### B0.3 ✅ Autenticación JWT

**Verificado el 2026-09-29 contra `de881e1`** · El guard responde: `GET /config/me` **sin** token da **401** y **con** token da **200**.
**Descripción.** Emitir y validar tokens con claims `tenant_id`, `role_id`,
`user_id` y `aud` (`usuario` | `platform`). El front **no decodifica el token**:
recibe todo resuelto en `/config/me`.
**Criterio de aceptación.**
- Todo endpoint bajo `/api/v1` rechaza sin `Authorization: Bearer` con `401`.
- El token expira y hay refresh o re-login declarado.
- Ningún endpoint devuelve `tenant_id` como identificador que el front deba
  reenviar: la pertenencia se resuelve del token.

### B0.4 ✅ Middleware de auth y envelope
**Verificado el 2026-09-28 contra el servicio corriendo** · commit `5924bf2b`, construido y levantado acá porque el binario que teníamos era del 26 · `docs/ESTADO-backend-2026-09-28.md`. **Todo error trae `code`**, medido en cuatro familias: `AUTH_UNAUTHORIZED`, `NOT_FOUND_RESOURCE`, `AUTH_FORBIDDEN` y `VALIDATION_REQUEST`. **Queda en ⚠️ y no en ✅ por el `error`**: dos handlers devuelven el mensaje crudo —«tab not found» y el volcado del validador de Go— y `ErrorState` lo pinta tal cual. Pedido, no nuestro.

**CERRADA EL 2026-09-29 · las dos rutas traducidas, medido contra `de881e1`:**

```
POST /admin/agents {}  →  "solicitud inválida: el campo 'tenant_id' es obligatorio;
                           el campo 'name' es obligatorio; …"
POST /config/chat  {}  →  "solicitud inválida: el campo 'question' es obligatorio"
```

**Ni un nombre de struct de Go ni un tag.** Era lo último que le faltaba a esta
tarea desde el 2026-09-14.

**Lo que decía antes, y por qué se conserva:** **Que el `error` esté redactado y en español · quedaban dos rutas.** Remedido el 2026-09-28 contra `f70cec2`: de los dos handlers crudos, el de «tab not found» se arregló —sale `pestaña no encontrada`— y los 400 de binding pasan por un traductor por campo, medido en `PUT /config/me/preferences`: `el campo 'theme' debe ser uno de: dark, light`. **`POST /config/chat` sigue volcando el validador de Go**, y su respuesta afirma lo contrario —«Nunca aparece un nombre de struct de Go ni un tag»—. Medido: `Key: 'ddChatRequest.question' Error:Field validation for 'question' failed on the 'required' tag`. **No es el anidamiento**: falla igual con un campo de primer nivel. Es por handler — `dd_chat_handler.go:52` manda `err.Error()` donde los demás mandan `BindingErrorMessage(err)`, y de 32 sitios que enlazan JSON sólo 9 pasan por el traductor. `ErrorState` lo pinta tal cual, y cae justo en la ruta de F3.15.

**Medido contra `de881e1` el 2026-09-29** · las dos rutas contestan con el volcado del validador de Go, y `PUT /config/me/preferences` con texto redactado.

**Y SON DOS RUTAS, NO UNA** · encontrado el 2026-09-28 revisando el alta de un tenant. `POST /admin/agents` hace lo mismo: `Key: 'createAgentRequest.tenant_id' Error:Field validation for 'tenant_id' failed on the 'required' tag`. Ésa importa por otra razón — **es una ruta del ALTA de un cliente**, así que el error lo lee quien está dando de alta. `POST /admin/tenants` sí está traducida, que es la prueba de que el traductor anda y de que falta aplicarlo en esas dos.
**Descripción.** Toda respuesta viaja como `{ success: true, data }` o
`{ success: false, error: { codigo, mensaje, campo?, desbloqueaCon? } }`.
**Criterio de aceptación.**
- No hay endpoint que devuelva el objeto pelado sin envelope.
- `mensaje` está escrito desde el lado del usuario. §8 de `design.md`: los
  errores no se disculpan y nunca son vagos — «El feed de inventario tiene 31
  horas», no «Error al obtener snapshot».
- `codigo` es estable y sirve para decidir en código.

### B0.5 ✅ Contrato de consola
**Verificado el 2026-09-14** · no contra el servicio, porque no produce una ruta sino un documento: lo sostiene `contracts/synapse-api.yaml`, que existe, y `contract-drift` en la puerta. **Una `B*` que no se observa en el servicio declara qué la sostiene**, y eso también es evidencia.
**Descripción.** `contracts/synapse-api.yaml` ya existe y cubre los endpoints de
consola: `me`, `catalog`, `blocks`, `tabs/{tabId}`, `panels:batch`, `chat`,
`chat/hilos`, `me/preferencias`, más `decisiones`, `accionables` y
`solicitudes`. Fue escrito por el front derivándolo de §4 y de lo que C1 consume.
**Criterio de aceptación.**
- El backend lo revisa y lo adopta, o marca las diferencias en el propio archivo.
- Al adoptarse deja de ser propuesta del front y pasa a ser fuente de los dos
  lados (T1).

### B0.6 ⬜ Extender el contrato con admin y builder
**Medido el 2026-09-26 contra el servicio corriendo** · commit `8633b10`. **Su mitad está hecha y la nuestra no**, así que la tarea sigue abierta pero ya no espera a nadie. `internal/adapters/handler/docs/openapi.yaml` declara **59 rutas, 12 de ellas `/config/*`** —tres más que nuestro cable: `chat/threads/{id}/messages` y las dos de drill-down— y `/docs` las sirve.

**Y proponen que reemplacemos nuestro cable por el suyo. NO se hace**, decidido el 2026-09-26. Su spec es su declaración de intención, la misma clase de fuente que el comentario de `dd_catalog_metric.go` que nos hizo escribir `HIGHER_IS_BETTER` y que el servicio corrigió. Nuestro cable lleva `x-verificado-en` por ruta y `humo` lo compara contra respuestas reales en las dos direcciones: reemplazarlo nos saca justo lo que atrapó la deriva. **Sirve como segunda fuente para diferir contra ella**, que es más de lo que daba antes.

Lo que falta es lo que el criterio pide y sigue siendo nuestro: extender `contracts/synapse-api.yaml`, que es la forma interna.
**Descripción.** Agregar al yaml los endpoints de §5: `/admin/tenants`,
`/admin/tenants/{id}/layouts`, `/admin/layouts/{id}`, `.../publish`,
`.../validate`, `/admin/tenants/{id}/catalog`, `/admin/tenants/{id}/agents`.
**Criterio de aceptación.**
- Los esquemas de admin **reutilizan** `PanelConfigurado`, `Metrica` y `Bloque`;
  no se declaran versiones paralelas.
- `openapi-typescript` genera sin errores y el front compila contra los tipos.
- Cada endpoint declara qué `aud` del token acepta.

### B0.7 ⬜ Tipos de servidor desde OpenAPI
**Descripción.** Generar los tipos del backend desde el mismo yaml, o compartir
el contrato de modo que una divergencia rompa el build de alguno de los dos.
**Criterio de aceptación.**
- Cambiar un campo en el yaml sin actualizar el backend falla en CI.
- No hay un segundo lugar donde estén escritos los mismos tipos a mano.

### B0.8 ⬜ Secret manager para credenciales Snowflake
**Descripción.** Las credenciales por tenant salen de un gestor de secretos.
**Criterio de aceptación.**
- Ninguna credencial en código, en variables de entorno del front ni en ninguna
  respuesta de API.
- La configuración de agente que el superadmin edita **no incluye** la
  credencial: la referencia por identificador.

### ➕ B0.9 ⚠️ Contestar las cinco `# PREGUNTA:` del contrato
**Verificado el 2026-09-14** · igual que B0.5, lo sostiene un documento y no una respuesta: las cinco `# PREGUNTA:` están contestadas en el yaml con su bloque `DECIDIDO`, y el inventario en `docs/B0.9-preguntas-abiertas.md`. Sigue en ⚠️ porque una de las trece quedó sin decidir.
**Descripción.** El yaml lleva cinco decisiones marcadas que el front no puede
tomar. Contestarlas **en el propio archivo** es suficiente.

| Línea | Qué hay que decidir |
|---|---|
| 430 | Falta `versionModeloSemantico` en el evento `auditoria` del chat. Sin él, el veredicto `inconcluso` no se calcula. ¿Lo emite el chat o lo resuelve el `DECISION_LOG` al re-medir? |
| 531 | ¿El backend expone `actor` o lo deriva del token? El front necesita saber si lo manda o se infiere |
| 754 | Taxonomía de `codigo` de error. El front solo necesita distinguir error de campo / regla de negocio / fallo técnico |
| 981 | ¿Cómo pasa un token de plataforma el tenant a `/config/*`? `/platform/t/{tenantId}/console/*` o cabecera `X-Tenant-Id` con `aud: platform` |
| 1171 | ¿El batch emite `DEGRADADO` y `SIN_PERMISO`? Si el catálogo ya viene filtrado por rol, un panel sin permiso no llegaría nunca — pero C5 existe como pantalla |

**Criterio de aceptación.**
- Las cinco marcas `# PREGUNTA:` desaparecen del yaml, reemplazadas por la
  decisión escrita.
- La 1171 en particular determina qué estados tiene que renderizar F2.1–F2.3.

**Cuatro de cinco contestadas el 2026-09-03.** Quedan escritas en el yaml, en
el lugar de la marca, con la fecha y el porqué:

| Línea | Decisión |
|---|---|
| 430 | **Lo emite Snowflake**, y el evento lo estampa al responder. `inconcluso` compara dos momentos y el primero no se reconstruye después |
| 531 | **Lo deriva del token.** El front no manda `actor`, y es lo que sostiene el seguro de atribución |
| 981 | **En el path**, `/platform/t/{tenantId}/console/*`. Gana por el criterio que la pregunta fijaba: sin tenant no hay ruta |
| 1171 | **Sí, los dos.** El catálogo no es el único filtro, C5 es alcanzable, y **esto destraba F2.1, F2.3 y B2.7** |

**Queda abierta la 754**, la taxonomía de `error.codigo`: hay que revisarla. El
front dejó una propuesta escrita en el yaml para que la revisión tenga contra qué
reaccionar —`FAMILIA_DETALLE` con la familia en el prefijo, que es lo que permite
que el backend agregue códigos sin que el front cambie.

**Estas cinco son las del yaml; el documento junta diez.** El front sumó tres en
la Fase 1 y F1.28 dejó dos de diseño, que no están marcadas `# PREGUNTA:` en
ningún lado porque su fuente es `design.md`. Las diez, con quién decide cada una
y qué frena, en `docs/B0.9-preguntas-abiertas.md`. Solo tres bloquean trabajo.

### ➕ B0.10 ✅ Endpoint de login

**Verificado el 2026-09-29 contra `de881e1`** · `POST /auth/login` con las credenciales sembradas devuelve **200** y un token que el resto de las rutas acepta.
**Descripción.** `tareas-front-back.md` pide en F0.5 «login → guardar JWT →
redirigir», y **ninguna tarea de backend lo expone**. B0.3 define el JWT pero no
la ruta que lo emite.
**Criterio de aceptación.**
- Existe `POST /api/v1/auth/login` (o la ruta que el backend decida) declarado en
  el yaml, con su forma de request y de respuesta.
- Declara qué pasa con credenciales inválidas y con cuenta bloqueada, con
  `codigo` estable.
- El front puede implementar F0.5 sin inventar la forma del request.

---

## Fase 1 — API de consola

### B1.1 ✅ `GET /config/me` · los seis, o retirados con razón

**Verificado el 2026-09-29 contra `de881e1`** · `npm run humo` leyó `GET /config/me` **campo por campo**: los requeridos están y no sobra ninguno sin declarar. **Es la FORMA de la ruta, no el criterio entero** — dice que la respuesta no cambió, no que la tarea se haya vuelto a auditar.
**Verificado el 2026-09-28 contra el servicio corriendo** · commit `5924bf2b`, construido y levantado acá porque el binario que teníamos era del 26 · `docs/ESTADO-backend-2026-09-28.md`. Llegan `period_grain: "month"`, `periods_detail` con `[start, end)` por período, y `scope` —`kind: single_tenant` con el token de planner, y `tenants` nunca `null`—.

**Verificado el 2026-09-14 contra el servicio corriendo** · commit `733c13c`. `GET /config/me` responde con `user`, `tenant`, `role`, `tabs`, `periods` y `catalog_version`. **Parcial** porque faltan `theme` —el campo existe en `users` y el `PUT` lo escribe— y el resto del contexto que declara el contrato.
**Medido el 2026-09-26 contra el servicio corriendo** · commit `8633b10`. **`theme` LLEGÓ** — `user.theme: "light"` en `/config/me`—, y con él `tenant.locale`, `tenant.currency` y `tenant.timezone`, que no estaban pedidos acá y son los que desbloquean F1.13b.

**CERRADA EL 2026-09-28 · los dos que faltaban llegaron ese día en `f70cec2`.**

Medido campo por campo contra el servicio corriendo:

```
tenant : currency id label locale name timezone      ← label ✓
tab    : chat_suggestions icon id key name …         ← key ✓ 'overview'
scope  : multi_tenant · 2 tenants                    ← alcance ✓
grano  : period_grain 'month' · periods_detail[].grain ✓
```

**Los dos bullets que esta tarea listaba como incumplidos ya no lo están**, y la
tabla de abajo lo decía desde el 26 mientras la prosa seguía diciendo lo
contrario. Es el modo de falla de siempre: una tarea que se actualiza por partes
termina contradiciéndose a sí misma, y **quien la lee rápido lee la prosa**.

**Y los dos que quedan sin llegar están retirados a propósito, no pendientes:**
`role.puedeAprobar` y `user.capabilities` no los consume nadie, hoy ni previsto.
Pedir un campo que nadie llena es lo mismo que les señalamos de `vertical`.

**Se retiraron DOS del pedido el 2026-09-28, y no por llegar: porque no los consume nadie.** Antes de reenviar se revisó cada uno contra su consumidor:

- **`role.puedeAprobar`** · el adaptador lo fija en `false` y ninguna pantalla lo lee. La compuerta real de una acción sobre un panel es `payload.acciones`, que ya funciona. Pedirlo sería pedir un campo que nadie llena — lo mismo que les dijimos de `vertical`.
- **`user.capabilities`** · ningún consumidor, hoy ni previsto.

**Y la `key` dejó de ser sólo nuestra**: el backend avisó el 2026-09-28 que `roles.tab_ids` guarda ids de fila, que se recrean en cada versión publicada, así que **la primera publicación real desde el builder deja sin pestañas a todo rol con restricción**. Su salida propuesta —identidad de pestaña por `slug` dentro del dashboard— **es esta misma `key`**. Un campo contestando dos problemas.

**Medido campo por campo el 2026-09-28 contra `5924bf2b`**, y por eso esta tarea NO pasa a ✅: el pedido tenía seis cosas y llegaron dos.

| Pedido | Estado |
|---|---|
| `alcance` con `tenantsDisponibles` | ✅ llegó como `scope` · `{kind, tenants[]}` |
| El `grano` de cada período | ✅ `period_grain` y `periods_detail[].grain` |
| `icon` y `chat_suggestions` en la pestaña | ✅ · y las sugerencias como lista, nunca `null` |
| `tenant.etiqueta` | ✅ llegó como `label` en `f70cec2` · medido el 2026-09-28 |
| La `key` de la pestaña | ✅ llegó en `f70cec2` · `'overview'` |
| `role.puedeAprobar` | **retirado** · nadie lo consume · 2026-09-28 |
| `user.capabilities` | **retirado** · nadie lo consume · 2026-09-28 |
| La `key` de la pestaña | ✗ |

**Y `tenant.vertical` se RETIRA del pedido**, que es nuestro y no suyo: §3.5 declara `vertical` **y** `plantillaOrigen`, y el mecanismo no existe de ningún lado · `docs/DECISIONES-2026-09-28-estado-y-vertical.md`. Pedir la columna sin la plantilla les haría escribir un campo que nadie llena.
**Descripción.** Contexto de arranque: `user` (con `capacidades` y
`preferencias`), `tenant`, `role` (con `puedeAprobar`), `tabs` **sin paneles**,
`periodos`, `catalogVersion`, `alcance` y —si hay más de uno— `layouts`.
**Criterio de aceptación.**
- Las pestañas llegan **ya filtradas** por el rol del token y en su orden.
- Cada `Periodo` declara su `grano` (`dia` | `semana` | `mes`): sin él el front
  sabe que una métrica es mensual pero no si `2026-W32` es una semana.
- No incluye paneles: pedirlos es `GET /config/tabs/{tabId}`.
- Con `alcance: plataforma` incluye `tenantsDisponibles`; con `usuario`, no.

### B1.2 ✅ `GET /config/catalog`

**Verificado el 2026-09-29 contra `de881e1`** · `npm run humo` leyó `GET /config/catalog` **campo por campo**: los requeridos están y no sobra ninguno sin declarar. **Es la FORMA de la ruta, no el criterio entero** — dice que la respuesta no cambió, no que la tarea se haya vuelto a auditar.
**Verificado el 2026-09-14 contra el servicio corriendo** · commit `733c13c`. `GET /config/catalog` devuelve 12 métricas con sus quince campos. El filtrado por rol es B1.19 y se audita aparte.
**Descripción.** Las métricas del tenant filtradas por el rol del token.
**Criterio de aceptación.**
- Una métrica oculta para el rol **no aparece**, ni siquiera con `estado`
  restringido: ocultar no es permitir, pero tampoco es mostrar el nombre.
- Cada métrica trae `base` obligatorio (ver D6), `familia`, `forma`, `capa`,
  `fuente`, `ventana`, `granoMinimo`, `dimensiones` y `catalogVersion`.
- `direccionSemantica` viene solo en las compuestas, y es la frase que se pinta.

### B1.3 ✅ `GET /config/blocks`

**Verificado el 2026-09-29 contra `de881e1`** · `npm run humo` leyó `GET /config/blocks` **campo por campo**: los requeridos están y no sobra ninguno sin declarar. **Es la FORMA de la ruta, no el criterio entero** — dice que la respuesta no cambió, no que la tarea se haya vuelto a auditar.
**Verificado el 2026-09-14 contra el servicio corriendo** · commit `733c13c`. `GET /config/blocks` devuelve **los quince tipos** —de `kpi` a `graph`— con `accepted_shapes`, los cuatro rangos de span y `layout_params`.
**Descripción.** La tabla tipo ↔ formas aceptadas ↔ rangos de `colSpan` y
`rowSpan`, para los 15 tipos.
**Criterio de aceptación.**
- Los 15 tipos están, incluidos los que ninguna métrica usa hoy
  (`comparison`, `matrix`, `graph`): el builder los ofrece.
- El front la consume con `catalog/blocks.ts`, que ya está escrito, sin
  reescribir la tabla del lado del cliente.

### B1.4 ✅ `PUT /config/me/preferencias`

**Verificado el 2026-09-29 contra `de881e1`** · `npm run humo` leyó `PUT /config/me/preferences` **campo por campo**: los requeridos están y no sobra ninguno sin declarar. **Es la FORMA de la ruta, no el criterio entero** — dice que la respuesta no cambió, no que la tarea se haya vuelto a auditar.
**Verificado el 2026-09-14 contra el servicio corriendo** · commit `733c13c`. `PUT /config/me/preferences` responde **200** con `{ theme }`. Lo que falta —leerlo de vuelta en `/config/me`— es B1.1.
**Descripción.** Persistir el tema del usuario.
**Criterio de aceptación.**
- El tema se guarda contra el **perfil**, no contra el tenant ni el navegador:
  §2.4 lo declara preferencia de usuario, y la misma cuenta se ve igual en dos
  máquinas.
- El valor inicial vuelve en `/config/me` → `user.preferencias.tema`.

### B1.5 ✅ `GET /config/tabs/{tabId}`

**Verificado el 2026-09-29 contra `de881e1`** · `npm run humo` leyó `GET /config/tabs/{tabId}` **campo por campo**: los requeridos están y no sobra ninguno sin declarar. **Es la FORMA de la ruta, no el criterio entero** — dice que la respuesta no cambió, no que la tarea se haya vuelto a auditar.
**Verificado el 2026-09-14 contra el servicio corriendo** · commit `733c13c`. `GET /config/tabs/{tabId}` devuelve la pestaña y sus **12 paneles**, con `col_start`, `col_span`, `row_span` y `options`.
**Descripción.** `{ tab, panels[] }` — el layout, sin datos. Acepta
`?layoutId=` para multi-dashboard.
**Criterio de aceptación.**
- Un `tabId` que no pertenece al tenant y rol del token devuelve **`404`, no
  `403`**: no se revela la existencia.
- La respuesta no contiene una sola cifra: cambiar de período no la invalida.
- Cada panel trae `id`, `tipo`, `metricId`, `colStart`, `colSpan`, `rowSpan` y
  `opciones?`.

### B1.6 ⚠️ `POST /config/panels:batch`

**Verificado el 2026-09-29 contra `de881e1`** · `npm run humo` leyó `POST /config/panels:batch` **campo por campo**: los requeridos están y no sobra ninguno sin declarar. **Es la FORMA de la ruta, no el criterio entero** — dice que la respuesta no cambió, no que la tarea se haya vuelto a auditar.
**Verificado el 2026-09-14 contra el servicio corriendo** · commit `733c13c`. `POST /config/panels:batch` devuelve los 12 payloads y la consola los pinta. **Parcial** por `unlocks_with` vacío en `BLOCKED` y `request_from` como constante.
**Verificado el 2026-09-26 contra el servicio corriendo** · commit `8633b10`, con el usuario `planner` recién creado. **`request_from` llega y vale `"admin"`** — era `"administrator"` cuando se escribió este pedido. **Sigue siendo una constante**, `forbiddenRequestFrom` en `dd_config_service.go`, pero su comentario dice que es deliberado: «el rol que decide sobre la visibilidad de la métrica». O sea que **puede estar contestado por decisión y no por olvido**, y conviene preguntarlo así en vez de volver a pedirlo.

**`unlocks_with` en `BLOCKED` no se pudo medir**: ningún panel del tenant llega en ese estado — los doce dan `AVAILABLE`, `DEGRADED` o `FORBIDDEN`.

**`unlocks_with` en `BLOCKED` también está hecho**, leído el 2026-09-26 en `dd_materializer_service.go`: al bloquear escribe `blockedUnlocksWith` —«Se calcula en la próxima materialización cuando haya datos»— y `BatchPanels` lo pasa en **todos** los estados, no sólo al derivar `DEGRADED`. No se pudo medir en vivo porque ningún panel del tenant llega bloqueado.

**Contestado el 2026-09-28.** Sí, `request_from` constante es la decisión: vale `"admin"`, es el nombre canónico del rol que edita `hidden_metric_ids`, y no depende de la métrica ni del tenant. Era **una confirmación, no un campo**: si `request_from` constante es la decisión. Vale `"admin"` —era `"administrator"` cuando se pidió— y sigue siendo `forbiddenRequestFrom` en el código, pero el comentario de al lado dice que es a propósito: «el rol que decide sobre la visibilidad de la métrica». Si es eso, se cierra y lo anotamos.
**Descripción.** Un request por pestaña, no uno por panel. Body
`{ panelIds, periodo }` → `{ [panelId]: Payload }`.
**Criterio de aceptación.**
- **Fallo parcial:** un panel que no resuelve llega con `estado: ERROR` y el
  resto vuelve normal. No se falla el batch entero.
- Ocho paneles se resuelven en una llamada.
- No devuelve payload de una métrica oculta para el rol (B1.9).

### B1.7 ⬜ Resolver el layout publicado
### B1.8 ✅ Filtrar pestañas por visibilidad de rol
### B1.9 ✅ Filtrar paneles por `hiddenMetricIds` — **ocultar ≠ permitir**
### B1.10 ✅ Aplicar `layoutOverrides` por rol
**Descripción (las cuatro).** La resolución que ocurre antes de responder:
tomar el layout publicado, filtrar pestañas y paneles por rol, aplicar overrides.
**Verificado el 2026-09-29 contra `de881e1`** · las de este bloque, una por una:

- **B1.8** · Se le puso a `planner` `tab_keys: ["marca"]` y `GET /config/me` le devolvió **0 pestañas** del dashboard overview; con `["overview"]`, una. Filtra por rol, **verificado en las dos direcciones**.
- **B1.9** · El mismo tab devuelve **12 paneles a `admin` y 9 a `planner`**. **Ocultar no es permitir**: el backend no envía el payload de las tres que su rol oculta.

**Verificado el 2026-09-29 contra `de881e1`** · las de este bloque:

- **B1.10** · Previsualizando el **mismo layout** con dos lentes: `admin` devuelve 12 paneles con `col_span` `[3,5,6,7,12]` y `planner` 9 con `[4,6,8]`. **Los overrides se aplican por rol**, y la diferencia de spans no se explica sólo por las métricas ocultas.

**Criterio de aceptación.**
- El front recibe **solo lo resuelto** y no aplica ningún filtro.
- Una métrica oculta no llega ni en `tabs`, ni en `catalog`, ni en `batch`.
- Un rol con override ve su composición propia sin huecos en la grilla.

### B1.11 ✅ Unión discriminada de `Payload`

**Verificado el 2026-09-29 contra `de881e1`** · Un solo lote devolvió cinco formas discriminadas por `value.shape` · `scalar` 6, `multi_series` 2, `prose` 2, `categorical` 1, `tabular` 1.
**Descripción.** Cinco estados por `estado`: `DISPONIBLE`, `DEGRADADO`,
`BLOQUEADO`, `SIN_PERMISO`, `ERROR`.
**Criterio de aceptación.**
- `BLOQUEADO` **no lleva `valor`**. Es estructural, no una convención.
- Ningún estado lleva campos de otro.
- `CARGANDO` **no existe** del lado del servidor: es del cliente.

### B1.12 ✅ `Gobierno` obligatorio en `DISPONIBLE` y `DEGRADADO`
**Verificado el 2026-09-14 contra el servicio corriendo** · commit `733c13c`. Los payloads con cifra traen `governance` con sus cinco campos: `base`, `layer`, `source`, `freshness` y `catalog_version`. La procedencia se pinta en los doce paneles.
**Descripción.** `base`, `capa`, `fuente`, `frescura`, `catalogVersion`
intersectados en los dos estados que muestran número.
**Criterio de aceptación.**
- **Un valor sin procedencia es imposible de construir** en el tipo, no algo que
  se recuerde poner.
- `frescura` es ISO 8601 y refleja **cuándo se materializó**, no «ahora» (B2.10).

### B1.13 ✅ `Presentacion` opcional
**Verificado el 2026-09-28 contra el servicio corriendo** · commit `5924bf2b`, construido y levantado acá porque el binario que teníamos era del 26 · `docs/ESTADO-backend-2026-09-28.md`. La `nota` del panel llega: **los nueve paneles del planner traen la clave `note`**, junto a `col_span`, `col_start`, `id`, `metric_id`, `options`, `row_span` y `type`.

**LA MITAD GRANDE LLEGÓ · verificada el 2026-09-25 contra `6e595e3` y el servicio
corriendo.** Queda en ⚠️ y no en ✅ porque **sigue pidiendo la `nota` de panel**,
que es lo que el párrafo de abajo declara — `para-backend` lo agarró cuando la
cerré de más. Los seis
paneles `kpi` traen `presentation` con su `label`, su `meter` —`% OF TARGET`, con
la nota «706.8K OF 1.27M»— y sus dos comparativos. `roas` sin medidor, que es lo
que su commit anticipaba. **Es la primera vez que la anatomía completa de un KPI
se ve con dato del negocio.**
**Pedido cumplido el 2026-09-28.** Era **solo la `nota` de panel**, y llegó. El pedido grande que había acá —«`presentation` para las siete formas que no son escalares»— **se retira: estaba mal**, y lo corrigió leer nuestro propio código el 2026-09-15.

**`presentation` la lee UN solo cuerpo: `KpiBody`.** Ningún otro la toca — verificado con un grep sobre `src/render/bodies/`. Y no es un olvido: los demás sacan sus rótulos **del propio valor**. `BarsBody` hace `value.items.map(i => i.etiqueta)`; cada ítem viaja con su etiqueta. **«Ningún número desnudo» lo cumple la estructura del dato, no `presentation`.**

Así que `PresentationFromRows` devolviendo `nil` para las otras siete **es correcto**, y pedirlas habría sido pedir un campo que nadie lee — el mismo modo de falla de `BodyProps.presentation`, que existió meses sin un solo consumidor.

Lo que sí falta es la **`nota` de panel** —la lectura al pie, distinta de la `note` que va dentro del `medidor`—: el contrato la declara y el cable no la trae. Es un campo, no siete.
**Descripción.** Los rótulos y cifras de apoyo que el panel pinta alrededor del
valor: `label`, `medidor`, `comparativo`, `nota`. **Viajan con el dato, no con el
layout**, porque dependen del período.
**Criterio de aceptación.**
- El backend devuelve los rótulos **ya redactados**; el front no los compone.
- `label` lleva la unidad («USD · TOTAL»), y por eso la cifra grande no la lleva
  pegada: a 44px «USD 4.28M» no entra en un panel de colSpan 3.

**Medido el 2026-09-22 contra `82da946` limpio** · `docs/ESTADO-backend-2026-09-22.md`.
Los dos puntos del criterio **se cumplen**: `presentation` llega en los seis paneles `kpi` con
`label`, `meter` y `comparative` **ya redactados**, y los dos monetarios dicen «USD · TOTAL»
mientras que ROAS y los conteos dicen «TOTAL», que es correcto —no llevan unidad—.
**Queda en ⚠️ y no en ✅ por la `nota` de panel**, que sigue siendo un pedido vivo.

### B1.14 ✅ Transformar a las formas de `Valor`
**Verificado el 2026-09-26 contra el servicio corriendo** · commit `8633b10`. `decimals` y `unit` por columna llegan en `tabular` — medido en el panel de inversión por plataforma: `{key: 'roas', title: 'ROAS', numeric: true, decimals: 2, unit: 'x'}`. Con eso **se cierran los cinco bullets del criterio**: `tabular` con decimales y unidad medido en vivo; intervalo estricto, `composicion` con porcentaje, `ranking` con `position` desde 1 y `prosa` con pilares como objetos leídos de `transform.go`, porque **no existe dato de esas formas todavía** —el tenant sólo materializa `scalar`, `multi_series`, `categorical`, `tabular` y `prose`— y eso queda dicho en vez de darse por medido.

**LAS FORMAS LLEGARON · verificado el 2026-09-25 leyendo `transform.go` en
`75b8ecc`: quince casos.** Queda en ⚠️ porque su otra mitad sigue en pie —
`decimals` y `unit` por columna en `tabular`—, y el párrafo de abajo la declara.
El pedido de «las siete formas que `TransformValue` no produce` **ya no
corresponde**: las produce.
`distribution` y `series_with_band` entraron con `168a761`, y `75b8ecc` hizo la
segunda estricta —`level` por valor y `lo`/`hi` obligatorios— que es lo que
pedimos ese día.

**El conteo viejo de esta tarea decía nueve y costó un mensaje equivocado**: se
midió con un `grep "case \""` que sólo ve los casos con literal, y siete usan
constantes.
**El pedido, cumplido.** Pedía **`decimals` y `unit` por columna en `tabular`** —servidos en `8633b10`— y «las siete formas que `TransformValue` no produce», que **nunca correspondió**: las producía. Queda escrito porque el conteo equivocado costó un mensaje al backend.

**NO depende de Snowflake.** Es código Go: las tablas Gold que el materializador consulta ya existen con sus quince columnas, verificado el 2026-09-14.

**Y las siete no son un solo trabajo, son dos.** El contrato declara dieciséis formas en el enum `Forma` pero **solo once tienen esquema de `Valor`**:

- **`distribucion` y `serieConBanda` YA LAS EMITE EL BACKEND**, desde `168a761` (2026-09-21) · verificado el 2026-09-25 leyendo el `switch`, que tiene **quince** casos y no nueve. Los nombres que esta línea traía —`cuts`, `series_band`, `level` en la fila— **eran inventados**: el cable manda `{shape: 'distribution', bins:[{label, v, lo?, hi?}]}` y `{shape: 'series_with_band', points:[{t, v, lo?, hi?}]}`, **sin `level`**. `distribucion` ya se adapta; `serieConBanda` espera que el cable declare el nivel, que nuestro contrato exige.
- **`categoricaComparada`, `perfilMultiatributo`, `matriz`, `flujo` y `grafo` NO tienen esquema.** Antes de que alguien las materialice hay que declararlas en el contrato, y **eso es trabajo nuestro**, no suyo. Hasta entonces no hay contra qué implementar.

**Ninguna de las siete es urgente**, y conviene decirlo: sus consumidores son los cuerpos `comparison`, `matrix`, `graph` y `distribution`, que el front tampoco va a construir hasta que exista una métrica que los use. **Entran juntos o no entran.**

Lo que sí sirve ya es `decimals` y `unit` por columna: sin `decimals`, una columna de ROAS sale «4.2 · 4.5 · 3.5 · 3» y la coma deja de alinearse.
**Descripción.** Las 11 formas que el contrato ya declara, con las reglas
mínimas de §8 del documento.
**Criterio de aceptación.**
- `escalarConIntervalo` y `serieConBanda` traen `lo`, `hi` y `nivel`
  obligatorios: **prohibida la estimación puntual sin intervalo**.
- `composicion` trae `porcentaje` calculado por el backend, y suma 100.
- `ranking` trae `posicion` ≥ 1.
- `prosa` trae pilares como **objetos**, nunca cadenas parseables.
- `tabular` declara por columna si es numérica, con `decimales` y `unidad`.

### B1.15 ✅ Validar reglas mínimas por forma antes de enviar
**Verificado el 2026-09-26 contra el servicio corriendo** · commit `8633b10`. **Las dos mitades están escritas**, leídas en `transform.go`:

- `fillCompositionPercentages` calcula `percentage` cuando la fila no lo trae, con un decimal, y **la última parte absorbe el redondeo para que la suma dé 100** — que es la razón por la que no lo hace el front.
- `transformScalarWithInterval` **exige `level`** y falla con `ErrMissingField` si falta. Antes lo inventaba: `if level == 0 { level = 0.95 }`, o sea que publicaba un intervalo con un nivel de confianza que nadie midió. Es la regla dura 6 al revés.

**Leídas y no medidas, y se dice por qué**: ninguna métrica del tenant materializa `composition` ni `scalar_with_interval`, así que no hay payload contra el que comprobarlo. El día que exista, `humo` lo ve.

**NO depende de Snowflake.** La validación vive en el servicio y en el transformador, no en la vista.

**Qué hay que hacer, concretamente:**

1. En `composition`, que `percentage` salga **siempre**. Hoy `transformComposition` solo lo escribe si venía en la fila. Lo puede calcular el backend —la suma de las partes es conocida ahí— y **el front no**: el contrato dice por qué, la suma tiene que dar 100 y redondear en el cliente produce columnas que suman 99,9.
2. En `scalar_with_interval`, exigir `lo`, `hi` y `level` antes de escribir en `panel_data`. Sin los tres, el front rechaza: «un pronóstico sin banda no se publica» es regla dura 6.

**Un aviso para que no lo prioricen mal: hoy ninguna métrica del seed usa `composition`**, así que este caso no se está ejercitando en ninguna pantalla. Es prevención, no un defecto que alguien esté viendo.
**Criterio de aceptación.**
- Un panel `gauge` sin `maximo` en `opciones` no se sirve como `DISPONIBLE`.
- Una `serieTemporal` con cero puntos llega como `DISPONIBLE` con `vacioRazon` y
  `vacioDesbloqueaCon`, no como un array vacío: §8 pide que el vacío sea
  invitación a actuar, y un array vacío no alcanza para escribir «el período
  cierra el 1 de septiembre».

### B1.16 ⚠️ Seed de demo: 1 tenant, 1 layout, 1 pestaña, 4–6 paneles
**Verificado el 2026-09-14 contra el servicio corriendo** · commit `733c13c`. El seed deja un layout publicado con **12 paneles y 6 tipos** —`prose`, `kpi`, `bars`, `series`, `table`, `reco`— sobre 12 métricas. Excede los 4–6 que pedía. **Parcial** solo por «Brand Momentum».
**Cerrado el 2026-09-28.** Lo retiraron de `tareas-front-back` con su fecha y su motivo, que es lo que pedíamos. Era **la métrica «Brand Momentum»**, que esta tarea pide por nombre y el seed no incluye. Si el requisito quedó viejo, conviene sacarlo de `tareas-front-back.md` —que es de los dos equipos—: mientras esté escrito, el próximo que lea la tarea la va a dar por incompleta.
### ➕ B1.20 ⬜ Seed determinista para desarrollo del front
**Descripción.** B1.16 pide datos de demo. Esto pide que sean **estables**: el
front necesita que la misma llamada devuelva lo mismo para poder escribir
pruebas de integración contra HTTP.
**Criterio de aceptación.**
- Un script recrea el seed de cero.
- Con el seed cargado, `panels:batch` devuelve los mismos valores en dos
  corridas.
- El seed cubre al menos un panel por cada estado: `DISPONIBLE`, `DEGRADADO`,
  `BLOQUEADO`, `ERROR`. Sin eso, F2.1–F2.4 no se pueden probar contra el backend.

### ➕ B1.21 ⚠️ Declarar los mínimos de datos por gráfico
**LA ESCRIBIMOS NOSOTROS · 2026-09-29.** Estuvo pedida **tres veces** y no
llegaba. Al mirar qué faltaba de verdad, la tabla era nuestra entera —las cuatro
columnas, con cuatro dueños, todos de este lado— así que lo único que faltaba era
la ruta.

`GET /config/plots` vive en `b6f0e09`, rama `feature/config-plots` del fork,
**sobre `de881e1` limpio** y no sobre el rebase. Medida ese día contra el
servicio corriendo: **200 con 49 entradas en 5 ms**.

| | |
|---|---|
| Churn en archivos de ELLOS | **+18 −1**, cinco archivos, todo aditivo · el único borrado es la llamada a `SetupRouter` reescrita |
| Firmas existentes cambiadas | **ninguna** |
| Pruebas suyas tocadas | **ninguna** · `go test ./...` pasa **sin una sola falla** |
| `go build`, `go vet`, `gofmt -l` | limpios · el formateador **no se corrió sobre archivos de ellos** |

**Las 49 filas están GENERADAS, y ésa es la mitad que más vale.**
`tools/gen-plots.py` las emite desde cuatro fuentes con dueños distintos —el
repertorio legible por máquina de v2, el `.pen` para los nombres, la decisión del
2026-09-26 para los mínimos, y `NOMBRE_DE_FORMA` del adaptador para el mapa al
idioma del cable—. Pedirles transcribir 49 filas de una tabla markdown era **el
modo de falla que ya costó quince filas mal** en la tabla de bloques del modo
mock, con más superficie y con la mitad del daño invisible: un `tope` equivocado
deshabilita un gráfico que debería estar y nadie lo atribuye a esto.

**Tres decisiones que quedaron escritas en el código:**

1. **`data` es el arreglo PELADO**, como `GetBlocks`. Envolverlo en `{"plots":
   [...]}` era más prolijo y obligaba a un segundo adaptador para dos rutas que
   son la misma cosa.
2. **`minimums` nunca llega `null`, y vacío es legítimo.** Seis de los 49 salen
   `[]` y son exactamente los de `scalar` y `prose`: una cifra es una cifra. Un
   `null` obliga a cada consumidor a distinguir «sin mínimo» de «no se sabe», y
   el día que alguien no lo haga, un gráfico sin mínimo se lee como uno sin
   verificar.
3. **Servicio propio y no un método en `ddConfigService`**, que es lo que evitó
   el churn: agregarle el repositorio cambia la firma de `NewDDConfigService` y
   **ocho archivos de sus tests la construyen**.

**Queda en ⚠️ y no en ✅** porque la regla es que una `B*` pasa a ✅ verificada
**contra el servicio desplegado**, y esto corre contra el binario que levantamos
acá. Transcripta en el cable con `x-verificado-en: b6f0e09`.

**Lo que sigue es nuestro y no de ellos**: `catalog/plots.ts` con los
validadores. Ahora sí tiene de dónde leer la tabla.

**Espera del backend.** **Queda `GET /config/plots`; `chart` YA LLEGÓ** · el mismo día que se pidió, en `f70cec2`. Medido el 2026-09-28 contra el servicio: sale en `DDPanelDTO.chart` y en `DDLayoutPanel.chart`, lo escribe el builder recortado y en minúsculas —`"  Waterfall  "` → `waterfall`— y los doce paneles publicados quedaron con `''`, así que no migró ningún layout. Transcripto en los dos cables y adaptado, con prueba de que **un id desconocido se pasa igual**: descartarlo haría caer el panel al gráfico por defecto sin que nadie se entere. **Lo que falta es la ruta del repertorio**, y para escribirla piden tres archivos nuestros que no están en su repo — contestado en `docs/MENSAJE-2026-09-28-backend-lo-que-piden.md`.

**Lo tiene: NOSOTROS** · mandarles `docs/ENTREGA-2026-09-29-repertorio-de-graficos.md`. **Lo pidieron dos veces**, y las dos se les contestó con una ruta de NUESTRO repositorio, que no ven.

**Medido contra `de881e1` el 2026-09-29** · `GET /config/plots` → **404**.

**NUESTRA MITAD ESTÁ HECHA** · 2026-09-26, y **el repertorio entero desde el 2026-09-28**: `docs/REPERTORIO-2026-09-28-los-49-graficos.md`. El orden que habíamos propuesto era «1. el front declara los mínimos y los propone en el contrato · 2. el backend los sirve». **El paso 1 está**: el contrato declara `GET /config/plots`, `Grafico` y `MinimoDeDatos`, y la tabla que hay que implementar está en `docs/DECISIONES-2026-09-26-minimos-por-grafico.md`.

**La decisión de estructura, que es lo que más va a durar: el mínimo es de la FORMA, y un gráfico lo SUBE sólo si su geometría lo exige.** Es la simetría de `tope`, que baja el techo por gráfico. Un número elegido a mano para cada una de las 49 entradas serían 49 juicios, y la mayoría arbitrarios: `bars` y `lollipop` comen el mismo dato y fallan en el mismo punto.

Sólo tres suben el de su forma —`treemap`, `pareto` y `waterfall`, a 3— y están marcados aparte porque son juicio y no geometría.

**Y la razón se PINTA.** `MinimoDeDatos` la declara obligatoria: un panel que se apaga sin decir por qué manda a buscar un error donde hay una regla.

**Los tres mínimos que ya estaban escritos** en el criterio de abajo —«una serie de un punto, una composición de una parte y un ranking de dos ítems»— se respetaron, y de ahí sale que `ranking` sea 3 y no 2.

**Espera del backend.** **Servir `GET /config/plots`** con la tabla del documento, con la misma figura que `/config/blocks`: global, no por tenant. Medido el 2026-09-26: **404**. Bloquea F1.31 y F4.21.

**Lo tiene: NOSOTROS** · mandarles `docs/ENTREGA-2026-09-29-repertorio-de-graficos.md`. **Lo pidieron dos veces**, y las dos se les contestó con una ruta de NUESTRO repositorio, que no ven.

**NO depende de Snowflake.** No toca datos: es una tabla de reglas y un endpoint.

**Sirve desde el primer día aunque haya un gráfico por tipo**, que es por qué está en Fase 1 y no en Fase 4: hoy nada impide que `bars` reciba un ítem y dibuje una barra sola.
**Descripción.** D2: *los gráficos dependen de los datos, y hay que establecer los
datos mínimos para construir el gráfico*. `contracts/synapse-plots.js` declara
hoy `formas`, `soportaBanda` y `tope` —el límite superior— pero **no declara
mínimos**, así que nada impide que un gráfico reciba menos datos de los que
necesita y dibuje algo que engaña.

Va en Fase 1 y no en Fase 4 porque **sirve ya**, aun con un solo gráfico por
tipo: hoy `bars` puede recibir un ítem y dibujar una barra sola.
**Criterio de aceptación.**
- Cada entrada del repertorio declara `minimos` con su **razón**, no solo un
  número: la razón es lo que se muestra en pantalla.
- Se expone en `GET /config/plots`, con la misma forma con la que
  `/config/blocks` expone la tabla de bloques.
- Los mínimos son verificables contra el fixture: una serie de un punto, una
  composición de una parte y un ranking de dos ítems disparan el estado vacío con
  su razón.
- La tabla vive **en un solo lugar** y la consumen los tres que validan: el
  builder, `layouts/{id}/validate` y el adaptador del front.

**Medido el 2026-09-22 · `GET /config/plots` devuelve 404.** La ruta no existe en
`82da946`. Pasa de «no verificado» a **medido y ausente**.

### B1.17 ✅ Modelo `Metrica`
**Verificado el 2026-09-26 contra el servicio corriendo** · commit `8633b10`. **`measurement_window` llega**, con texto redactado de Snowflake —«Mes calendario seleccionado», «Cada día del mes calendario seleccionado»— en 10 de las 18 métricas del tenant; las ocho vacías son las de la semilla, que la vista no tiene. Del criterio compartido: `min_grain` viaja por métrica y `catalog_version` viaja en el catálogo **y** en `governance` de cada payload. El bullet de la capa `SILVER` no se puede comprobar: las 18 declaran `GOLD`.

**Depende de Snowflake solo EN LA SEGUNDA MITAD**, y conviene no confundirlas:

- **Hoy el catálogo NO sale de Snowflake**, sale del seed de Postgres —`sync-catalog` falla porque la vista no existe—. Así que **esto se puede cerrar ya, sin esperar a nadie**: columna en `DDCatalogMetric`, migración, valor en `dd_seed.go` para las doce métricas, y el campo en la respuesta de `/config/catalog`.
- **Y se rompe el día que `sync-catalog` funcione** si la vista no trae la columna. Por eso el SQL que dejamos ya declara `MEASUREMENT_WINDOW` — ver B1.18.

**Son las dos mitades, no una.** Una `B1.17` cerrada sin la columna en la vista vuelve a estar abierta en el primer sync.

Texto redactado, no un código: «Venta media de los últimos treinta días». **No se puede derivar del período** — dos métricas consultadas con el mismo `2026-09` pueden tener ventanas distintas, un total mensual y un promedio móvil de treinta días.

**`state` NO se pide, y el pedido del 2026-09-15 por la mañana se RETIRA.** Ese día se pidieron `state` y `state_reason` porque F4.5 necesitaba el filtro por estado de A4. **Estaba mal, y lo corrigió el `.pen` esa misma tarde**: el estado de una métrica **se deriva, no se copia de un campo**.

La nota de A4 lo dice con un ejemplo: «feed_vs_sales figura DISPONIBLE en el catálogo y sale DEGRADADA acá porque la frescura de su fuente la baja». Y la fila de `feed_gap` muestra las dos cosas a la vez —el estado del catálogo y el derivado— con la razón abajo: «Bloqueada porque su fuente tiene 31 h y se refresca cada hora. No degrada a un valor aproximado: se apaga».

**Así que lo que hace falta no es una columna de estado sino la SALUD DE FEEDS**, que es lo que A5 muestra y lo que A4 necesita para derivar: por fuente, su **última carga, su frescura, su cadencia y su tolerancia**. Con eso el front deriva los cuatro estados sin que nadie los escriba, y de paso se desbloquea A5 entera. Está pedido en **B2.13**.

**Pedir el campo habría sido peor que no pedirlo**: dos fuentes para el mismo hecho —el estado guardado y la frescura real— que se separan en el primer feed atrasado. Es el mismo error que este plan persigue en los documentos, aplicado a un dato.

`reading_note` sigue sin pedirse: ahí sí no lo lee nadie todavía.

**Medido el 2026-09-22 · el campo NO llegó.** `measurement_window` aparece en
`/config/catalog` **sólo cuando corre el fork**: lo agregamos nosotros en `2fafe82` y no existe
en `82da946`. Medir contra el fork lo hacía ver como avance de ellos — ver
`docs/ESTADO-backend-2026-09-22.md`. Lo que sí trae upstream: `min_grain`, `layer`,
`catalog_version`, `semantic_direction`, `base`, `dimensions` y `source`.
### B1.18 ✅ Sincronizar el catálogo con las semantic views de Snowflake
**Verificado el 2026-09-24** · la vista `SYNAPSE_METRIC_CATALOG` existe, `make sync-catalog` corrió —`created=6 updated=4 catalog_version=2`— y `/config/catalog` devuelve las **diez de la vista** y no las doce de la semilla, contra el servicio corriendo. Hasta ese día esta tarea decía «no existe en ninguna base de la cuenta, `SHOW OBJECTS` da cero filas».

### B1.19 ⬜ Filtrar el catálogo por permisos de rol
**Verificado el 2026-09-26 contra el servicio corriendo** · commit `8633b10`. **EL PEDIDO NO HACÍA FALTA.** Pedía «un usuario de prueba con un rol restringido» porque el mecanismo no se podía comprobar. **Desde que existen `POST /admin/tenants/{tenantId}/roles` y `POST /admin/users` lo creamos nosotros**, y las dos mitades cierran:

| | admin | planner |
|---|---|---|
| `/config/catalog` | 18 métricas | **15** · el rol oculta tres |
| `panels:batch` | 10 AVAILABLE · 2 DEGRADED | 9 AVAILABLE · **3 FORBIDDEN** |

`planner@synapse.local`, documentado en `dev/postgres/README.md`. **No estaba roto: nunca lo estuvo, y no se podía saber.**

Queda en ⬜ por el bullet que sigue sin comprobarse: que una métrica oculta no aparezca **ni siquiera con `estado`** exige cruzar la respuesta contra la lista de ocultas campo por campo.
**Criterio de aceptación (los tres).**
- El catálogo declara `granoMinimo` por métrica: el período más fino que puede
  contestar.
- Una métrica cuyo insumo está en `SILVER` no declara `GOLD`: la compuesta
  hereda la peor capa.
- Cambiar el catálogo incrementa `catalogVersion`, y ese número viaja en cada
  payload.

### El catálogo en Snowflake · 2026-09-14

**Verificado el 2026-09-11 con consultas de solo lectura contra la cuenta.** Las
dos tablas Gold que el materializador consulta existen y tienen las quince
columnas que su SQL nombra: `GLD_ECOMM_DAILY_PERFORMANCE` (11/11) y
`GLD_PAID_MEDIA` (4/4). **No falta ninguna tabla.**

Lo que falta es **`SYNAPSE_METRIC_CATALOG`, que no existe en ninguna base de la
cuenta**. Por eso `make sync-catalog` falla y el catálogo que sirve la API sale
de un seed de Postgres en vez de Snowflake.

**El front no ejecuta nada de esto.** Las tareas quedan registradas acá porque
bloquean trabajo nuestro; las corre y las revisa quien es dueño de la cuenta. El
SQL está escrito en `docs/snowflake/SYNAPSE_METRIC_CATALOG.sql` y la instrucción
paso a paso en `docs/snowflake/INSTRUCCION-ALTA-TENANT.md`.

**Y no hay ningún prompt que construir.** El catálogo y la materialización son
SQL de punta a punta: el agente de Cortex solo aporta credenciales y el
`db.schema` donde buscar. El agente se usa en `/chat/stream`, que es otro
producto.

#### ➕ B1.22 ⚠️ Crear el catálogo de métricas en Snowflake
**Verificado el 2026-09-15 contra el servicio corriendo.** **El lado de Snowflake está HECHO** —lo entrega `docs/snowflake/synapse-catalogo-metricas.md`, del equipo de datos: la vista `SYNAPSE_METRIC_CATALOG` existe en `DB_BT_UA.BT_UA_MART_ANALYTICS`, con `DD_METRIC_CURATION` detrás, la vista de validación `SYNAPSE_METRIC_CATALOG_ISSUES` en cero filas y el grant para `SYNAPSE_APP_ROLE`.

**Queda en ⚠️ y no en ✅ porque `make sync-catalog` NO se corrió**, y eso se ve desde acá sin preguntarle a nadie: `GET /config/catalog` devuelve **doce métricas con las claves de la semilla de Postgres** —`sales`, `investment`, `visits`, `goals_vs_actual`, `executive_summary`, `decisions`…— y no las **diez** que la vista de Snowflake declara —`revenue`, `spend`, `sessions`, `goal_attainment`, `platform_return`, `media_efficiency_12m`…—. El catálogo que la consola consume **sigue saliendo del seed**.

**Y hay una consecuencia que conviene ver antes de correrlo, no después:** de las doce de hoy, **`executive_summary` y `decisions` no están** en las diez de Snowflake. Son los paneles de prosa y de recomendación. Después del sync, o se agregan a `DD_METRIC_CURATION` o esos dos paneles se quedan sin métrica.

**Descripción.** Los tres objetos en el mismo `db.schema` que tiene configurado
el agente del tenant —para UA MX, `DB_BT_UA.BT_UA_MART_ANALYTICS`—, más el grant
de lectura para el rol del agente.

`DD_METRIC_CURATION` es una tabla y lleva lo editorial; `SYNAPSE_METRIC_CATALOG`
es la vista que el backend lee, con las once columnas de su `SELECT` y esos
nombres exactos; `SYNAPSE_METRIC_CATALOG_ISSUES` lista lo que está mal con su
razón.

Son tres y no uno porque `INFORMATION_SCHEMA.SEMANTIC_METRICS` da nombre,
expresión y tipo de dato, y **ningún** campo de gobierno: esos son editoriales y
necesitan dónde escribirse. Y la tercera existe porque Snowflake **no hace
cumplir un `CHECK`**, así que los enumerados cerrados se verifican o no se
verifican.
**Guía:** `docs/snowflake/INSTRUCCION-ALTA-TENANT.md` §4 paso 1 y paso 4 · el SQL listo para correr en `docs/snowflake/SYNAPSE_METRIC_CATALOG.sql` secciones 1 a 3.

**Criterio de aceptación.**
- `SELECT * FROM SYNAPSE_METRIC_CATALOG` devuelve filas desde el `db.schema` del
  agente, no desde una ruta fija: el backend califica la vista con lo que dice
  `agents`, y una vista en el schema equivocado no se encuentra.
- `SHOW GRANTS ON VIEW SYNAPSE_METRIC_CATALOG` muestra `SELECT` para el rol de
  `tenants.snowflake_role`. Sin esto `sync-catalog` falla con un error de
  permisos que no dice qué falta.
- Las once columnas salen con los nombres que el `SELECT` de Go espera. Una
  renombrada hace fallar la sincronización entera, no una métrica.
- **La vista de issues NO filtra la vista principal.** Un catálogo que se arregla
  descartando en silencio la fila mala hace que la métrica desaparezca del
  dashboard sin que nadie sepa por qué.

#### ➕ B1.23 ⬜ Escribir el gobierno de las métricas
**Descripción.** La semilla deja las filas con `BASE`, `MEASUREMENT_WINDOW` y
`SOURCE` marcados `⟨REVISAR⟩`. Son **texto que se pinta literal en pantalla**, así
que se redactan, no se generan. También hay que revisar `FAMILY` —de ahí sale el
color de cada serie— y `SEMANTIC_DIRECTION`, que se propusieron desde la
expresión SQL.

Van con marcador y no con un valor plausible por una razón: **una BASE inventada
se lee bien y miente**, y nadie la audita después.
**Guía:** `docs/snowflake/INSTRUCCION-ALTA-TENANT.md` §4 paso 2 · la semilla con los campos marcados `⟨REVISAR⟩` está en `docs/snowflake/SYNAPSE_METRIC_CATALOG.sql` sección 4.

**Criterio de aceptación.**
- `SELECT * FROM SYNAPSE_METRIC_CATALOG_ISSUES` devuelve **cero filas**. Mientras
  devuelva algo, dice qué métrica y por qué.
- Ninguna fila activa conserva el marcador `⟨REVISAR⟩` en los tres campos.
- `BASE` declara un denominador, no una descripción: «312 SKU críticos sobre
  18.240 activos» y no «ventas del período».
- `MEASUREMENT_WINDOW` declara **el período que mide la métrica**, no el de la
  consulta. Son cosas distintas y confundirlas es el bug.
- `FAMILY` cae en las cinco que tienen rampa de color. Una sexta pinta la serie
  sin color y no falla: es el mismo modo de silencio que una utilidad que nombra
  un token inexistente.
- Cada fila lleva `CURATED_BY`: un campo de gobierno sin quién lo firmó no es
  auditable, que es justamente lo que estos campos existen para sostener.

#### ➕ B1.24 ⬜ Alinear las claves del catálogo con el registro de queries
**Descripción.** `METRIC_KEY` no es un nombre libre. El materializador tiene doce
queries en un mapa de Go (`MetricRegistry`) y las busca **por esa clave**, con un
mapa de alias en `snowflake/keys.go` como único puente.

**Es el paso que se rompe en silencio:** una clave que no está en el mapa
sincroniza bien, compone bien, y después sale `BLOQUEADO` sin que nada explique
por qué. Es el mismo modo de falla que el spread condicional con una prop mal
escrita, tres capas más abajo.
**Guía:** `docs/snowflake/INSTRUCCION-ALTA-TENANT.md` §4 paso 3, que trae la tabla de las doce claves y los ocho alias · el porqué, en `docs/snowflake/CONTRATO-DE-TENANT.md`.

**Criterio de aceptación.**
- Toda `METRIC_KEY` activa resuelve a una entrada de `MetricRegistry`, directo o
  por alias. Verificado corriendo el materializador, no leyendo las dos listas.
- Una clave nueva entra con su alias en `keys.go` **en la misma jugada**. Las dos
  mitades se mueven juntas o no se mueven.
- `exec_resumen` y `month_decisions` **no se curan todavía**: el materializador
  ya las trae con `Blocked: true` y la razón escrita —«Requires
  BT_UA_DECISION_LOG actionable framework»—. Curarlas publicaría dos paneles que
  solo pueden salir bloqueados.
- Queda escrito que las claves de `SV_SYNAPSE_UA_ANALYTICS` **no sirven**: el
  materializador no lee la capa semántica, lee las tablas Gold directo. Es el
  error que ya se cometió una vez al escribir la primera semilla.

#### ➕ B1.25 ✅ `ventana` de punta a punta · de la vista al payload
**Verificado el 2026-09-26 contra el servicio corriendo** · commit `8633b10`. **De punta a punta, que es lo que su nombre pide**: el `SELECT` de `dd_catalog_sync_service.go` lee `MEASUREMENT_WINDOW`, `catalogMetricEqual` la compara —así que un re-sync la actualiza—, viaja en `/config/catalog` y en `governance` del payload, y el front la consume con un renombre, que es lo que el criterio pedía: «sin lógica nueva».

**Y el segundo bullet se cumple con un cambio nuestro**: «ningún panel muestra `undefined` en la línea de BASE». Vacío no es `undefined`, pero el template literal dejaba el separador colgando —`Base · COMPLETED · MONTH ·`— para las ocho métricas sin ventana. `PanelShell` une las partes que existen.

`MEASUREMENT_WINDOW` **existe en la vista, con valor en las diez métricas y sin nulos** —lo entrega el equipo de datos en `docs/snowflake/synapse-catalogo-metricas.md` §8—, y con ese nombre justamente para no chocar con `WINDOW`, reservada en ANSI. Falta lo de siempre: leerla en el `SELECT` de `dd_catalog_sync_service.go` y exponerla en `GET /config/catalog`.

**Comprobado contra el servicio corriendo:** las claves de una métrica de `/config/catalog` son `base, catalog_version, created_at, dimensions, family, id, key, layer, min_grain, name, semantic_direction, shape, source, tenant_id, updated_at`. **No hay ningún campo de ventana**, ni `measurement_window` ni `window`.

**Y la pregunta que el equipo de datos nos devuelve, contestada:** el nombre del campo JSON lo acordamos backend y front, y **al front le da igual** — el adaptador de F1.33 renombra, es lo que hace con los catorce campos que ya traduce. **Que sea `measurement_window`**, igual que la columna: un tercer nombre para el mismo dato es una traducción más que mantener, y el cable ya sale en snake_case.

**Descripción.** Lo único de este bloque que es código y no Snowflake, y es de una
línea en dos lugares: agregar `MEASUREMENT_WINDOW` al `SELECT` de
`dd_catalog_sync_service.go`, y el campo a `DDCatalogMetric` para que salga por
`GET /config/catalog`.

**Sin esto la consola no se puede entregar.** `PanelShell` pinta
`Base · {base} · {ventana}` en la cabecera de **todos** los paneles y en **todos**
sus estados —es shell, no cuerpo, así que no se reemplaza nunca— y el template
literal imprime la cadena `undefined`, no un hueco.
**Guía:** `docs/snowflake/INSTRUCCION-ALTA-TENANT.md` §4 paso 5.

**Criterio de aceptación.**
- `GET /config/catalog` devuelve el campo para cada métrica.
- Ningún panel de la consola muestra `undefined` en la línea de BASE, en ninguno
  de los siete estados.
- La columna se llama `MEASUREMENT_WINDOW` y no `WINDOW`: `WINDOW` es reservada
  en ANSI y obligaría a citarla en la vista, en el `SELECT` de Go y en cada
  consulta a mano. Si se prefiere `WINDOW`, se decide **antes** de escribir el
  campo, no después.
- El front lo consume por el adaptador de F1.33 sin lógica nueva: es un renombre,
  no un cálculo.

**Medido el 2026-09-22 · sigue faltando, y casi lo damos por llegado.** El campo se ve en
`/config/catalog` **porque lo escribimos nosotros** en `2fafe82`; en `82da946` no está. Y aun en
el fork llega **vacío en las doce métricas**, que es lo que deja la línea de BASE con el
separador colgando. Ver `docs/ESTADO-backend-2026-09-22.md`.

#### ➕ B1.27 ✅ El período declara si está cerrado
**Verificado el 2026-09-26 contra el servicio corriendo** · commit `8633b10`. `/config/me` devuelve `open_period: "2026-09"` al lado de `periods` — **la forma que propusimos en el fork**, un campo suelto y no uno dentro de cada período. El adaptador ya lo leía desde el 22, así que la consola marca el mes en curso sin tocar el reloj del navegador.

`availablePeriods()` emite los últimos doce meses **contando el actual**, y el actual está incompleto. Hoy los trece llegan iguales: una cadena `2026-09`. La consola los ofrece todos con la misma pinta, y quien compare el mes en curso contra el anterior lee una caída que es «todavía no terminó».

**Es barato de los dos lados**: el backend ya sabe cuál es el mes en curso al generarlos. Y con eso el front lo marca —el `.pen` lo dibuja en B5: «1 – 31 JUL 2026 · **MTD CERRADO**»— sin comparar contra el reloj del navegador, que sería el error: el corte del día es **del tenant y su huso**, no de quien mira.

**Lo pidió el equipo de datos sin saberlo.** Su aviso decía «si la consola deja elegir meses futuros, mostrará 0 y roas 0x». Los futuros no se ofrecen —verificado en `availablePeriods()`—, pero el mes en curso sí, y es el mismo problema en chico.

**Medido el 2026-09-22 · sigue faltando.** `open_period` en `/config/me` es **nuestro**
—`2fafe82`—; `82da946` devuelve `periods` como doce cadenas sueltas y nada más. La forma que
propusimos en el fork es un campo al lado de `periods`, no uno dentro de cada `Periodo`: si
prefieren la otra, se decide antes de que alguien la consuma.

#### ➕ B1.26 ⬜ Decidir cómo escala el registro, antes del segundo tenant
**Descripción.** El catálogo vive en Snowflake y el registro de queries en Go:
**dos mitades del mismo hecho, en dos lugares, que se pueden separar sin que nadie
se entere.** El puente es el mapa de alias de `keys.go`, escrito a mano.

Un tenant cuyo catálogo declare `ventas` no tiene alias, no encuentra query, y la
métrica sale bloqueada. Con un tenant se sostiene; con el segundo deja de
sostenerse.

**A · contrato de forma:** todo tenant expone dos objetos con las quince columnas,
vía una vista que renombre lo que ya tenga. Barato y rígido — sin `BUDGET_TARGET`
no hay `goal_attainment`.
**B · el registro pasa a ser dato:** `MetricRegistry` sale de Go a una tabla por
tenant. Caro y flexible — la clave del catálogo **es** la del registro y el alias
desaparece.
**Guía:** `docs/snowflake/CONTRATO-DE-TENANT.md` §7 y `docs/snowflake/INSTRUCCION-ALTA-TENANT.md` §7, con los dos caminos y su costo.

**Criterio de aceptación.**
- La decisión queda escrita con su razón, no elegida por omisión al dar de alta
  el segundo tenant.
- Si se elige A, **B queda declarado como destino y con fecha**. A sin fecha para
  B es cómo el mapa de alias termina con cuarenta entradas.
- Si se elige A, queda escrito qué pasa con un tenant al que le falta una columna:
  hoy el panel sale bloqueado sin razón, y §8 pide estado, razón y qué lo
  desbloquea.
- La decisión nombra quién es dueño de la vista por tenant: hoy `sync-catalog`
  asume que existe y falla sin decir que falta.

#### ➕ B1.28 ✅ `PayloadDegradado` dice DESDE QUÉ PUNTO el dato está vencido
**CERRADA EL 2026-09-29 · `stale_since` llegó en `de881e1`.** Medido envejeciendo una fila en la base descartable:

```
stale_since : 2026-09-12T14:38:08Z
reason      : Los datos tienen más de 3 días: la última actualización fue el 2026-09-09
unlocks_with: Se actualiza en la próxima materialización
```

**Es `materialized_at` + la tolerancia**, y la razón nombra la fecha. `dd_config_service.go:781`.

**Y sólo aparece en la degradación POR ANTIGÜEDAD**, que es lo correcto: la del «nunca se materializó» no tiene desde-cuándo. La primera medición cayó en ese caso y pareció que faltaba — el campo es `omitempty`.

**Lo que se pidió:** un campo en `PayloadDegradado` que diga desde dónde el dato dejó de ser fresco, el 2026-09-28.

**Medido contra `de881e1` el 2026-09-29** · el payload de un panel degradado trae `governance message reason status unlocks_with value` · ninguna clave de tramo.

Hoy el cable manda `reason` y `unlocks_with` como texto redactado, que sirve para la nota pero no para el cuerpo: **no dice qué tramo de la serie está vencido.**

**Lo pide el dibujo, no nosotros.** `Librería de gráficos / ESTADO · Degradado` dibuja una serie con las **dos últimas barras en `$w2`** en vez del color de familia, y su nota lo declara: «DEGRADADO NO BLOQUEA: OBLIGA A FECHAR. **LA TRAMA MARCA EL TRAMO VENCIDO**».

**Medido el 2026-09-28**: la trama existe sólo en la biblioteca y **el panel degradado de C1 no la aplica** —sus rellenos de datos son los de la familia, sin una sola barra en `$w2`—, así que ni dentro del `.pen` está puesta donde se vería.

**Alcance decidido ese día**, en `docs/PROPUESTA-2026-09-25-degradado.md`: la trama es para las **formas con eje temporal** —serie, área, forecast—; en las que no lo tienen, «obliga a fechar» lo cumple la procedencia con su frescura, que ya se pinta en los seis estados.
**Criterio de aceptación.**
- El payload degradado declara el punto desde el cual el dato está vencido, en la
  misma unidad del eje: si la serie es semanal, una semana.
- **El front no lo calcula.** Sin el campo no se dibuja la trama, porque adivinar
  cuál es el tramo es inventar el dato.
- Una forma sin eje temporal no lo necesita y el campo queda ausente, no en cero.

#### ➕ B1.29 ✅ `schema-check` · decir qué le falta al cliente ANTES de intentar
**CERRADA CONTRA SNOWFLAKE REAL · 2026-09-29, tarde.** Datos habilitó la IP y el
bloqueo venció. Verificado en el orden que el propio backend indicó —primero el
ping, después la ruta—, contra `de881e1` y con la base local:

```
GET /agents/ping                              → 200 · status "ok" · latency_ms 894
GET /admin/tenants/e65f81ae-…/schema-check    → 200 · ok: true      (2,5 s)
    GLD_ECOMM_DAILY_PERFORMANCE  table  exists: true   missing: []
    GLD_PAID_MEDIA               table  exists: true   missing: []
    SYNAPSE_METRIC_CATALOG       view   exists: true   missing: []
    affected_metrics: []   keys_without_query: []   catalog_source: "view"
```

**Lo que hace que esto valga es `ok: true` CON los tres objetos enumerados**, y
no el 200 a secas: la ruta existe para decir **qué falta**, así que una que
contestara 200 sin mirar nada se vería igual. Los tres objetos nombrados, con su
`kind` y su `missing` vacío, son la prueba de que consultó el esquema.

**La IP de salida era `201.244.209.190`**, la misma del 2026-09-24 y no la
`190.27.36.15` que dio 502 esa mañana. Conviene no perderlo: **la IP de salida de
acá cambia**, así que un 502 de Snowflake se mira contra `curl checkip.amazonaws.com`
antes de escribirle a nadie.

**Lo pedido, y ya entregado y medido.** Una ruta que compare el `db.schema` del tenant contra el contrato de esquema — pedido el 2026-09-28 en `docs/MENSAJE-2026-09-28-backend-tres-del-alta.md`.

**Lo tuvo DATOS y ya está hecho** · la IP quedó habilitada el 2026-09-29. La ruta está entregada y ellos la midieron desde su red con `200`.

**Medido contra `de881e1` el 2026-09-29** · `schema-check` → **404** · y se comprobó que `GET /agents/ping` y `GET /admin/tenants/{id}/catalog/health`, que sí existen, contestan otra cosa.

**LA RUTA LLEGÓ EL 2026-09-29 · en `e1037d9`. Queda en ⚠️ y no en ✅ por una razón que NO es suya: Snowflake nos bloquea la IP.**

```
GET /admin/tenants/{id}/schema-check   → 502
  "snowflake sql: status 401: 390422 · Incoming request with IP/Token
   190.27.36.15 is not allowed to access Snowflake"
```

**La ruta responde; lo que no llega es Snowflake.** Es el mismo bloqueo que datos levantó el 2026-09-24 para que el chat funcionara — la IP de salida cambió desde entonces.

**Así que la FORMA de la respuesta sigue sin medirse**, y eso es lo que falta para cerrarla: sin ver su cuerpo no sabemos si trae `afecta` y `claves_sin_query`, que eran los dos campos que la volvían valiosa.

**Se pide a datos**, no al backend · `docs/MENSAJE-2026-09-29-datos-habilitar-ip.md`, mandado el 2026-09-29.

**Y el pedido lleva una pregunta de fondo, porque la IP ya cambió una vez:** el 2026-09-24 Snowflake veía `201.244.209.190` —la habilitaron y el chat funcionó— y hoy ve `190.27.36.15`. **Cinco días, dos direcciones.** Habilitar ésta desbloquea hoy y es razonable esperar que vuelva a cortar.

**Un detalle que hace perder una tarde si no se sabe:** la salida a Snowflake **no es la misma que la salida general**. En el mismo instante, Snowflake ve `190.27.36.15` y un «cuál es mi IP» genérico ve `186.31.4.152`. **La única que sirve es la que Snowflake reporta en el error** — habilitar la otra no funciona y parece que la política no se aplicó.

**El problema que cierra es un SILENCIO**, y es el que más encarece un alta: hoy una columna que falta hace que el panel salga `BLOCKED` **sin razón** — no dice qué columna, ni que el problema sea de esquema. Se descubre al final, después de crear todo.

**Media pieza YA EXISTE y no la conocíamos** · `GET /agents/ping` firma el JWT con las credenciales del tenant y corre `SELECT 1` contra Snowflake —medido el 2026-09-28 contra `f70cec2`: `status: ok`, 898 ms—. Eso cubre la mitad **credencial**. Y `GET /admin/tenants/{tenantId}/catalog/health`, que tampoco conocíamos, contesta **frescura de feeds por métrica**, que es otra pregunta.

Lo que falta es la mitad de **esquema**, y son dos `DESCRIBE` y una comparación de listas.

**Criterio de aceptación.**
- Dice si existen los dos objetos Gold en `<agent.db>.<agent.schema>` y **qué columnas de las quince faltan** en cada uno.
- Dice si existe la vista de catálogo y cuáles de sus doce columnas faltan.
- **Trae `afecta`: qué métricas quedan sin poder materializarse por cada columna ausente.** Es el campo que convierte el chequeo en una decisión — «falta `BUDGET_TARGET`» no le dice nada a nadie, «no vas a poder tener `goal_attainment`» sí. El mapa de qué query usa qué columna es suyo, no nuestro.
- **Trae `claves_sin_query`: las `METRIC_KEY` del catálogo del cliente que no caen en `MetricRegistry` ni por alias.** Cierra el segundo silencio y es un `diff` contra las doce claves de `keys.go`.
- No crea ni modifica nada: es de sólo lectura y se puede correr antes de dar de alta.

#### ➕ B1.30 ✅ `sync-catalog` como ruta HTTP
**CERRADA CONTRA SNOWFLAKE REAL · 2026-09-29, tarde**, contra `de881e1`:

```
catalog_version antes                         → 3
POST /admin/tenants/e65f81ae-…/sync-catalog   → 200   (0,95 s)
    created 0 · updated 0 · unchanged 10 · view_name SYNAPSE_METRIC_CATALOG
catalog_version después                       → 3
```

**Lo verificado NO es que contestara 200: es que sea IDEMPOTENTE.** La corrida del
2026-09-24 dio `created=6 updated=4 catalog_version=2`; ésta, sobre el mismo
catálogo sin cambios, deja las diez en `unchanged` y **no mueve la versión**. Una
ruta que subiera `catalog_version` en cada llamada invalidaría la caché del front
cada vez que un admin toca el botón, y el síntoma sería un parpadeo que nadie
atribuiría a esto.

Con esto el alta de un cliente deja de necesitar acceso a la máquina del backend,
que era todo el punto.

**Lo pedido, y ya entregado y medido.** La simétrica de `materialize` — pedido el 2026-09-28.

**Lo tuvo DATOS y ya está hecho** · la IP quedó habilitada el 2026-09-29. La ruta está entregada.

**Medido contra `de881e1` el 2026-09-29** · `sync-catalog` → **404** · su hermana `materialize` → **202**.

**LA RUTA LLEGÓ EL 2026-09-29 · en `e1037d9`.** `POST /admin/tenants/{id}/sync-catalog` ya no da 404: contesta **502** por el mismo bloqueo de IP de Snowflake que B1.29, o sea que **llegó hasta intentar la consulta**.

**Queda en ⚠️ hasta poder correrla de verdad.** Con eso, el alta de un cliente deja de necesitar acceso a la máquina del backend — que era todo el punto.

Medido ese día contra `f70cec2`: `POST /admin/tenants/{tenantId}/materialize` contesta **202** y `POST /admin/tenants/{tenantId}/sync-catalog` da **404**. Sólo existe `make sync-catalog TENANT_ID=<uuid>`.

**Es lo único en toda el alta que obliga a entrar a la máquina del backend.** Crear el tenant, crear el agente y materializar ya tienen ruta.

**Criterio de aceptación.**
- `POST /admin/tenants/{tenantId}/sync-catalog` contesta como su hermana: 202 y el trabajo por detrás.
- El resultado se puede consultar después: cuántas métricas entraron y en qué `catalog_version` quedó.
- **No reemplaza al comando**, que sigue sirviendo para correrlo a mano.

#### ➕ B1.31 ⚠️ La plataforma genera el par de claves del usuario de servicio
**Espera del backend.** **Que el servicio genere el par RSA y devuelva sólo la pública** — pedido el 2026-09-28.

**Lo tiene: NOSOTROS** · probar la rotación en el próximo alta real. **La ruta está entregada** y su guarda se midió.

**Medido contra `de881e1` el 2026-09-29** · sin un solo `rsa.GenerateKey` en `internal/`.

**LLEGÓ EL 2026-09-29 · en `e1037d9`.** `POST /admin/tenants/{id}/service-key` existe, y **su guarda es lo mejor que trae**:

```
→ 409 CONFLICT_KEY_EXISTS
  "el tenant ya tiene una clave de servicio; enviá rotate=true para reemplazarla"
```

**No pisa una clave que funciona.** En este tenant la clave es la real —la que hace andar el chat contra Cortex—, así que **no se probó la rotación a propósito**: rotarla habría roto el entorno para comprobar algo que la guarda ya demuestra.

**Queda en ⚠️ porque la forma de la respuesta con éxito no se midió**: haría falta un tenant sin clave. Se cierra con el próximo alta real, que es cuando importa.

Hoy `POST /admin/tenants` exige `private_key_pem`, así que por cada cliente **alguien genera un par a mano y transporta una clave privada** hasta donde se haga el alta. Verificado ese día: no hay `rsa.GenerateKey` en `internal/`.

**Es más fácil y además más seguro**, que es la combinación que no obliga a elegir: la privada nunca sale del servicio y lo que circula es la pública.

**Criterio de aceptación.**
- El servicio genera el par, guarda la privada cifrada como ya hace con la que recibe, y devuelve **sólo la pública** en formato PEM.
- **El ciclo se cierra con lo que ya existe**: generar → el cliente registra la pública en su usuario de servicio → `GET /agents/ping` confirma que funciona.
- `private_key_pem` deja de ser obligatoria en el alta, o queda un orden declarado. **Cuál de las dos es decisión del backend**; el front no depende de la forma.

#### ➕ B1.32 ✅ `cut` es `day` o `month`, y lo aplica el front
**Lo que fue este pedido, y cuánto se achicó antes de mandarse.** Iba a ser «qué significa `cut`»; leyendo su código quedó en «confirmen que lo aplica el front», y la confirmación llegó el mismo día.

**Medido contra `de881e1` el 2026-09-29** · `cut` aparece en su semilla con `day` y `month`, y **ningún consumidor** en `internal/core/`.

**Lo que se averiguó solo:** su semilla ya muestra el vocabulario —`{"cut": "day"}` y `{"cut": "month"}` en `dd_seed.go:113`— y `dd_seed_blocks.go:44` lo declara como `layout_param` del bloque `series` junto a `normalization`. **Y nadie lo lee**: `grep` sobre `internal/core/` no encuentra un solo consumidor de `cut` ni de `normalization` fuera de la semilla.

**Así que la pregunta ya no es qué significa, sino si son sólo esos dos valores.**

**Bloquea F1.44**, que es un defecto visible: el orden de una tabla **se anuncia y no se aplica**. Hoy el panel dice cómo está ordenado y no lo está, que es peor que no decirlo.

**CONTESTADA EL 2026-09-28 · `docs/RESPUESTA-2026-09-28-todo-lo-que-falta.md`.** Y es la clase de respuesta que cierra una tarea sin una línea de código de nadie:

> «Sí: los únicos valores son `day` y `month`, y **lo aplica el front**. Ningún código del backend lee `cut` ni `normalization` (ni `order` de tablas): son `layout_params` declarativos que viajan en `options` del panel y los honra quien dibuja.»

**Coincide con lo que habíamos medido** —ningún consumidor en `internal/core/`—, así que es una segunda fuente de verdad y no una transcripción de la misma. Y agregan uno que no habíamos preguntado: **el `order` de las tablas también es nuestro**, que es exactamente lo que F1.44 necesitaba saber.

**Criterio de aceptación.**
- Queda dicho si `day` y `month` son todos los valores · **sí, contestado**.
- Queda confirmado que el backend no lo aplica · **confirmado, y ellos lo dicen**.
- Lo mismo para `normalization` · **confirmado**, y de paso el `order` de tablas.

#### ➕ B1.33 ✅ El patrón de `PeriodoId` · es `YYYY-MM` y nada más
**NO ERA UN PEDIDO · se contesta leyendo su código, y así se contestó el 2026-09-28** antes de mandarlo.

Esta tarea se escribió para pedirles «qué forma puede tener un `PeriodoId` además de `YYYY-MM`». **Su propio criterio decía que si sólo existiera el mes, escribirlo cerraba la tarea** — y es el caso.

`internal/core/dashboard/snowflake/period.go` lo declara sin ambigüedad:

```go
return Bounds{}, fmt.Errorf("invalid period %q: expected YYYY-MM", period)
```

y sus ayudantes son `CurrentPeriod` y `PreviousPeriod`, los dos **por mes**.

**Así que «sólo meses» deja de ser un supuesto nuestro y pasa a ser un hecho leído.** Lo que F5.13 espera no es un patrón que exista y no conozcamos: es que el backend **soporte** otro grano, y eso es una tarea de ellos que todavía nadie pidió porque nadie la necesita.

**Criterio de aceptación.**
- Queda escrito qué patrones acepta hoy · **`YYYY-MM`, verificado en `period.go`**.
- F5.13 deja de citar «el patrón de `PeriodoId`» como candado y pasa a citar lo que realmente espera: **soporte de otro grano**, que nadie pidió.

#### ➕ B1.34 ⬜ Declarar qué es el `t` de una serie, o mandar el tramo vencido
**Espera del backend.** **Qué unidad tiene el `t` de `points[]`** — y con eso se desbloquea la trama del degradado.

**Lo tiene: BACKEND** · declarar la unidad, o mandar el índice del tramo vencido.

**Medido contra `de881e1` el 2026-09-29** · el servicio manda `"20362"`, `"20393"`, `"20423"` en `points[].t`. Son **días desde epoch** —2025-10-01, 2025-11-01, 2025-12-01, el primero de cada mes— pero **el cable no lo declara en ningún lado**.

**Y DESDE EL 2026-09-29 SE VE EN PANTALLA**, que hasta ese día no pasaba: ningún
gráfico dibujaba eje de tiempo —`PlotSeries` sólo tiene eje de valores—, así que
el `t` viajaba sin que nadie lo leyera. `PlotCombo` **sí rotula su eje**, y al
publicarlo sobre `media_efficiency_12m` con dato real de Snowflake el eje salió
`20362 · 20454 · 20544 · 20635 · 20697`.

**Los números crudos en pantalla es lo que cambia la urgencia del pedido**: deja
de ser una ambigüedad del cable y pasa a ser copy equivocado en la consola. Y el
front no lo puede arreglar — deducir que son días desde época es exactamente la
invención que el adaptador tiene prohibida; que coincida hoy no lo declara.

**Por qué importa ahora y no antes.** `stale_since` llegó en el mismo commit, y con él se puede marcar el tramo vencido que el `.pen` dibuja —las dos últimas barras en `$w2`—. Para eso hay que comparar cada punto con `stale_since`, y para comparar hay que interpretar el `t`.

**El front no lo va a interpretar.** Un tramo mal marcado **afirma que un dato concreto está vencido cuando no lo está**, y eso es peor que no marcarlo: la trama existe para fechar, y una fecha inventada no fecha, miente.

**Y nunca se notó porque el eje X no se pinta.** `PlotSeries` rinde sólo el eje de valores, así que el número crudo no se ve. Nuestro propio contrato decía que `t` era «la etiqueta del eje, ya lista para pintar» — corregido el mismo día.

**Criterio de aceptación.**
- El cable declara la unidad de `points[].t` · días epoch, ISO, o lo que sea.
- **O, más simple y mejor**: el payload degradado trae **desde qué índice** de la serie el dato está vencido, y el front no compara nada.
- Si la respuesta es la segunda, `stale_since` sigue sirviendo para la nota —«la última actualización fue el …»— y el índice para el dibujo. **Son dos consumidores distintos del mismo hecho.**

---

## Fase 2 — Materialización y cache

### B2.1 ✅ Tabla `panel_data`

**Verificado el 2026-09-29 contra `de881e1`** · `dd_panel_data` trae el snapshot con su gobierno · `value presentation governance status period materialized_at last_success_at last_error reason unlocks_with message`.
**Descripción.** El snapshot materializado con gobierno completo por
`(tenant_id, metric_id, periodo)`. Es la fuente del batch y sobrevive reinicios.
**Criterio de aceptación.**
- Guarda el `Valor` ya transformado a su forma, no el resultado crudo de la
  query.
- Guarda `frescura` como el instante de materialización.
- Se puede auditar: qué había en un panel el mes pasado es consultable.

### B2.2 ⬜ Job de materialización
**Descripción.** Por cada tenant × métrica × período activo: consultar
Snowflake o el semantic layer, transformar a `Valor + Gobierno + Presentacion`,
escribir en `panel_data`.
**Criterio de aceptación.**
- Un dashboard de 30 paneles **no dispara 30 queries a Snowflake al cargar la
  página**: el batch lee cache.
- El job es idempotente: correrlo dos veces sobre el mismo período no duplica.
- Un fallo en una métrica no aborta el resto del job.

### B2.3 ✅ El batch lee de `panel_data`, no de Snowflake
### B2.4 ⬜ Redis opcional encima de Postgres
**Verificado el 2026-09-29 contra `de881e1`** · las de este bloque, una por una:

- **B2.3** · **Verificado por una vía indirecta y más fuerte que pedir la ruta:** hoy Snowflake bloquea nuestra IP —`schema-check` da 502— **y el batch sigue devolviendo los doce paneles con datos**. Si consultara Snowflake en vivo fallaría igual. Lee de Postgres.

**Criterio de aceptación.**
- `batch → Redis hit? → return` · `miss → Postgres → populate → return`.
- **Redis no es fuente de verdad.** Vaciarlo no pierde datos: los repuebla desde
  Postgres.
- TTL corto, 5–15 minutos.

### B2.5 ✅ Estado `DEGRADADO`
**Verificado el 2026-09-14 contra el servicio corriendo** · commit `733c13c`. Los doce paneles llegan en `DEGRADED` con razón redactada por el servidor —«Stale data: last materialization is older than 3 days»— y `unlocks_with`. **El front no decide que algo está degradado**: lo deriva `isDegraded` del servicio.
**Descripción.** Si `frescura > cadencia × tolerancia`, el panel se marca
degradado con `razon` y `desbloqueaCon`.
**Criterio de aceptación.**
- **El backend decide**, no el front: `nuevo-desarrollo.md` §1.3 dice que el
  front no calcula degradación.
- `DEGRADADO` **sí lleva valor**: muestra la cifra y declara la limitación. No
  es un estado sin dato.
- La cadencia y la tolerancia son configurables por métrica, no una constante.

### B2.6 ⚠️ Estado `BLOQUEADO`

**Verificado el 2026-09-29 contra `de881e1`** · Pidiendo un período nunca materializado —`2027-03`— los tres paneles vuelven **`BLOCKED`** con `reason` «No hay datos calculados para este período». **Queda en ⚠️ por un hueco medido**: `unlocks_with` viene vacío y §8 pide los tres. `dd_config_service.go:380` pone `Status` y `Reason` y nada más, aunque `unlocksWaitNextRun` ya existe doce líneas abajo.
**Criterio de aceptación.**
- Job fallido o precondición incumplida → **sin valor**, con `razon` y
  `desbloqueaCon`.
- **No se inventa un número aproximado.** §8 de `design.md`: si un feed está
  vencido, el panel muestra estado, razón y qué lo desbloquea.

### B2.7 ✅ Estado `SIN_PERMISO` en el batch · 🔒 depende de B0.9 (línea 1171)
### B2.8 ⬜ Invalidar cache al publicar layout
### B2.9 ⬜ Invalidar cache al completar materialización
### B2.10 ✅ `frescura` = instante de materialización, nunca «ahora»
### B2.11 ✅ Filtrado por rol también en el batch
**Verificado el 2026-09-29 contra `de881e1`** · las de este bloque, una por una:

- **B2.10** · `governance.freshness` viene como instante ISO —`2026-09-28T20:28:09Z`— y se movió al envejecer la fila a mano. Es la materialización, no la consulta.
- **B2.11** · Con el token de `planner`, pidiendo al lote los tres paneles que su rol oculta, los tres vuelven `FORBIDDEN`. **El filtro está en el batch y no sólo en la pestaña.**

**Verificado el 2026-09-29 contra `de881e1`** · las de este bloque:

- **B2.7** · Con el token de `planner`, los tres paneles que su rol oculta vuelven `FORBIDDEN` **en el batch**, y desde `de881e1` con su gramática completa: `reason` «Tu rol no tiene acceso a esta métrica» y `unlocks_with` «Pedile al administrador del tenant que la habilite para tu rol».

**Criterio de aceptación (los cinco).**
- Publicar un layout deja de servir el anterior en la siguiente request.
- Un panel recién materializado se ve con su frescura nueva sin esperar el TTL.
- Un rol sin permiso sobre una métrica no recibe su payload aunque conozca el
  `panelId`.

#### ➕ B2.12 ⚠️ Correr el materializador contra datos reales y verificar los seis estados
**Descripción.** Con el catálogo ya en Snowflake (B1.22–B1.24), correr
`make materialize TENANT_ID=<uuid> PERIOD=<YYYY-MM>` y comprobar que la consola
pinta datos del negocio y no los del fixture del seed.

Es la primera vez que el camino completo se ejercita de punta a punta: vista →
`sync-catalog` → `dd_catalog_metrics` → `materialize` → `dd_panel_data` →
`panels:batch` → panel.
**Guía:** `docs/snowflake/INSTRUCCION-ALTA-TENANT.md` §5, la verificación de punta a punta.

**Criterio de aceptación.**
- `POST /config/panels:batch` devuelve `AVAILABLE` con **valores distintos a los
  del fixture**. Que conteste 200 no alcanza: el seed también contesta 200.
- **Si llegan todos en `BLOCKED`, es B1.24** —las claves no caen en el registro—
  y no un problema de datos. Queda escrito, porque el síntoma no lo dice.
- Los seis estados se verifican contra el servicio real y no contra MSW:
  `DEGRADED` envejeciendo `materialized_at` en la base, `BLOCKED` pidiendo un
  período sin materializar, `FORBIDDEN` con el rol `planner`, `ERROR` con un
  `gauge` sin `maximum`.
- Las nueve formas que el transformador produce se ven en pantalla al menos una
  vez. Las siete que no produce quedan anotadas como no alcanzables, con la
  razón: no es un panel roto, es una forma que el backend no materializa.
- Queda registrado contra qué commit del backend y con qué período se verificó.
  Un «funcionó» sin eso no se puede repetir.

**Corrido el 2026-09-24, y la consola muestra datos del negocio.** Primera vez
que el camino completo se ejercita: vista → `sync-catalog` → `materialize` →
`panels:batch` → panel.

**Medido el 2026-09-25 contra `6e595e3` limpio · el corte está en
`docs/ESTADO-2026-09-25-formas-y-estados.md`.** Cuatro de los seis estados
verificados —`DISPONIBLE`, `DEGRADADO`, `BLOQUEADO` y `CARGANDO`— y los dos que
faltan **no son alcanzables hoy, con su razón**: `SIN_PERMISO` necesita un
usuario no-admin y `GET /admin/users` da 404 —es **B4.17**—, y `ERROR` pide
componer un `gauge` sin `maximum`, y ninguno de los doce paneles lo es.

**Remedido el 2026-09-28 contra `f70cec2` · quedan CINCO de seis, y el sexto
cambió de razón.**

`SIN_PERMISO` **dejó de ser inalcanzable**: el usuario `planner` existe en la
base local y oculta tres métricas, así que `/config/tabs` le devuelve nueve
paneles en vez de doce. Pidiéndole al lote los tres que le faltan contesta
`FORBIDDEN` en los tres. El payload es `{status, request_from}` y nada más — sin
`reason` ni `unlocks_with`, que es la gramática de §8 que los otros estados sí
traen. **Anotado como pedido, no como defecto nuestro**: el adaptador pasa
`request_from` tal cual porque redactarlo acá sería el front inventando a quién
pedirle.

**Y CON QUÉ SE PROVOCA `ERROR` quedó contestado el 2026-09-28**, que era la pregunta abierta. Dan dos caminos, y el segundo es el que sirve:

1. **Materialización fallida sin `AVAILABLE` previo** · apuntando `DD_SNOWFLAKE_ECOMM_TABLE` a una tabla inexistente y materializando un período nunca materializado. **Si ya había `AVAILABLE`, la regla lo preserva y sale `DEGRADED`** — que es por qué no aparecía.
2. **`options` inválidas en un panel YA PUBLICADO** · `gauge` sin `maximum`, `forecast` sin `horizon`, JSON roto. El builder lo rechaza al validar, «así que sólo pasa con layouts publicados antes de esa validación o editados por fuera».

**El segundo explica lo que medimos.** No era que el estado no existiera: era que el camino que el criterio usaba —componer un `gauge` sin `maximum`— dejó de estar disponible cuando agregaron la validación. **El estado es alcanzable; el disparador cambió de lugar.**

**`ERROR` pasó de «no hay ninguno» a «el servicio lo impide».** Se compuso un
`gauge` sin `maximum` en un borrador —que la consola no ve— y el builder lo
rechaza antes de guardar: `400 VALIDATION_LAYOUT · el bloque gauge necesita
options.maximum`. Es lo correcto de su parte, y deja el criterio **inalcanzable
por construcción con el disparador que declara**: ese estado necesita otro, y
cuál es una pregunta abierta.

**Un borrador de prueba quedó en la base local** —el del tenant, con una sola
pestaña— y es descartable con la base.

**Y de las once formas del contrato llegan cinco**, por dos razones distintas
que conviene no mezclar. `escalarConIntervalo`, `serieTemporal`, `ranking` y
`composicion` **el backend las sabe producir**; lo que pasa es que UA MX no tiene
métricas de esas formas —**y eso no es un hueco: es este cliente**, decisión de
producto del 2026-09-25, la intención es tener todas las formas disponibles
porque otros clientes las van a tener—. `distribucion` y `serieConBanda`, en
cambio, **el backend no las materializa**: no están en el `switch` de
`transform.go` y salen con `ErrUnknownShape`. Eso ya está pedido en **B1.14**.

Las cuatro del primer grupo **sí se ven en `npm run dev:mock`**, que cubre las
nueve del cable — que es lo que evita que un cuerpo quede sin verse nunca sólo
porque este tenant no usa esa forma.

| | |
|---|---|
| `make sync-catalog` | `created=6 updated=4 · catalog_version=2` desde `SYNAPSE_METRIC_CATALOG` |
| `make materialize` | `available=16 · blocked=2 · errors=0 · preserved=2` |
| En pantalla | ventas **639.078** donde el fixture decía 4.28M · inversión 64.708 · ROAS 9,88x · visitas 2.280.855 |

**El primer punto del criterio se cumple**: los valores son distintos a los del
fixture, y la gobernanza es la firmada por datos —«ROAS bruto: venta total del
mes sobre inversión bruta del mismo mes. No es incremental»—.

**Los doce períodos están materializados** y el selector navega entre ellos con
dato real: `2026-09` da ventas 639.078 y `2026-08` da 918.978, ROAS 9,88x contra
12,79x. Cada mes son `available=16 · blocked=2 · errors=0`.

**Queda en ⚠️ porque faltan dos puntos**: sólo se vieron `AVAILABLE` y `BLOCKED`
de los seis estados, y no se comprobó que las nueve formas aparezcan en pantalla.

**Verificado el 2026-09-26 contra el servicio corriendo** · commit `8633b10`. **YA LA PRODUCE.** Este pedido —del 2026-09-24, en
`docs/MENSAJE-2026-09-24-materializador.md`— decía que el materializador no
escribía `presentation` y que al correr pisaba la de la semilla, dejando los seis
KPI como una cifra sola.

Medido después de rematerializar con el binario nuevo: **6 de los 12 paneles
traen `presentation`**, y son los seis escalares, con su `label`, su `meter`
—«81 % de la meta · 2.6M DE 3.19M»— y sus dos `comparative`. Las cifras son de
Snowflake, no de la semilla. Lo arma `PresentationFromRows` y lo persiste
`dd_materializer_service.go`.

**Sigue en ⚠️** por la otra mitad de su título: verificar los seis estados. El
dato real sólo produce `AVAILABLE`, `DEGRADED` y `FORBIDDEN`.

Lo que decía el pedido, como registro: **El materializador no produce
`presentation`, y al correr PISA la que había.** Antes de materializar, seis paneles `kpi` traían su
`label`, su `medidor` y sus `comparativo` —de la semilla— y en pantalla se veían
la barra de avance y el «VS MES ANTERIOR». Después de materializar, **ninguna de
las 18 filas tiene `presentation`**: los KPI quedaron como una cifra sola.

Es la segunda mitad de B1.13, y se dio por cerrada el 2026-09-14 **contra la
semilla**. Es el mismo modo de falla que `semantic_direction` el mismo día, y
que el catálogo: lo que la semilla traía, el camino real no lo trae.

Sin esto un KPI pierde el medidor y los comparativos, que es lo que el `.pen`
dibuja y lo que hace que una cifra se lea contra algo en vez de sola. · Bloquea
**B2.12**.

**Espera del backend.** **EL CAMINO YA EXISTE · corregido el 2026-09-28 leyendo su repositorio.**

**Lo tiene: DESPLIEGUE** · depende de B2.15 · el generador de prosa está en la rama desde `5924bf2`.

**Medido contra `de881e1` el 2026-09-29** · `DD_MATERIALIZE_PROSE_ENABLED` existe con default `false` · `dd_materializer_service.go:57`.

Esto decía «los paneles de prosa los genera el AGENTE, y hoy no hay camino», y era
cierto cuando se escribió. **Lo construyeron:** `internal/core/services/dd_prose_generator.go`
implementa `DDProseGenerator`, `bootstrap/app.go:155` lo cablea al materializador
—«Fase 6: prosa por agente»— y queda detrás de `DD_MATERIALIZE_PROSE_ENABLED`,
cuyo default es `false` · `dd_materializer_service.go:57`.

**Así que lo que queda de este pedido es encender el flag**, que es `B2.15`, más
la pregunta abierta de con qué se provoca `ERROR`. Lo de abajo se conserva porque
es el razonamiento de producto que lo originó y sigue valiendo.

Decidido el 2026-09-24 por producto: `executive_summary` y `decisions`
no son métricas sino **interpretación** —el resumen y las propuestas sobre los
datos del período—, así que no se curan en Snowflake, y **es el materializador
quien llama al agente**. Las otras dos opciones se pesaron y se descartaron: una
tabla que alguien llena desacopla el texto del período, y pedirlo desde el front
hace que cada usuario espere segundos y pague la misma llamada.

**El dashboard lo compone el ADMIN**, y el resumen se hace sobre **lo que ese
dashboard proyecta** — no sobre el negocio en abstracto. De ahí salen tres
propiedades que condicionan el diseño: es **por dashboard y por período**, corre
**después** del resto de los paneles de su pestaña —porque los consume—, y
**escala sin curaduría**: el admin agrega o saca una métrica y el resumen la
sigue solo. Eso último es lo que lo vuelve viable con muchos tenants.

Hoy `transform.go` sabe armar `{shape, headline, pillars}` pero **leyendo filas
de una consulta SQL**, y el agente sólo está cableado al chat. Queda de su lado
el prompt, el costo por corrida y el reintento —para eso ya encaja `DEGRADED`—.

**Lo que NO cambia:** esas dos siguen necesitando fila en el catálogo, porque un
panel se ancla a un `metricId` y `dd_panels.metric_id` es `NOT NULL`. Sin fila el
admin no puede poner el panel. Lo que cambia es **cómo se materializa**.

**Y arrastra una pregunta que conviene contestar antes**: qué procedencia declara
un texto generado. Hoy ese panel dice `SILVER · ACTIONABLE FRAMEWORK`, que viene
del seed; para un texto del agente sería mentira, y `GOLD · ERP` sería peor.
Todo en `docs/MENSAJE-2026-09-24-materializador.md` §3. · Bloquea **B2.12**.

**Espera del backend.** **Una fila que NUNCA se materializó no puede servirse

**Lo tiene: DESPLIEGUE** · depende de B2.15 · el generador de prosa está en la rama desde `5924bf2`.
como `AVAILABLE`.** `sync-catalog` trae diez métricas de Snowflake y la semilla
tiene doce, así que **dos quedan sin fuente** —`executive_summary` y
`decisions`—. El materializador lo sabe: informa `preserved=2`. Pero esas dos
filas siguen saliendo `AVAILABLE` con el valor viejo, y el resultado es que **la
consola se contradice a sí misma**: el panel de prosa dice «Sales closed the
month at USD 4.28M» al lado de un KPI que dice 639.078.

`isDegraded` mide **antigüedad** —«older than 3 days», verificado en B2.5— y
estas dos tienen cuatro horas, así que pasan el umbral. La señal que las separa
no es la edad sino que **`last_success_at` es nulo**: nunca hubo una
materialización exitosa. «Vieja» y «nunca» son dos estados distintos.

Alcanza con que `preserved` —o `last_success_at IS NULL`— también degrade, con
su razón. El front ya pinta `DEGRADED` con su badge, su razón y su
`desbloqueaCon`: está cubierto por las pruebas de F2.1 y no hace falta nada de
nuestro lado. · Bloquea **B2.12**.


#### ➕ B2.13 ✅ Salud de feeds por fuente · de acá sale el ESTADO de cada métrica

**Verificado el 2026-09-29 contra `de881e1`** · `npm run humo` leyó `GET /admin/tenants/{tenantId}/feeds` **campo por campo**: los requeridos están y no sobra ninguno sin declarar. **Es la FORMA de la ruta, no el criterio entero** — dice que la respuesta no cambió, no que la tarea se haya vuelto a auditar.
**Verificado el 2026-09-26 contra el servicio corriendo** · commit `8633b10`. **Cierra su propia condición**: quedaba en ⚠️ «hasta que A5 la consuma y se vea en pantalla», y A5 se abrió contra el servicio real — cuatro fuentes con su cadencia, tolerancia, frescura y métricas afectadas, las cuatro en `SIN CARGA`, que es el dato verdadero. Se agregó también `GET /admin/tenants/{tenantId}/catalog/health`, que mapea métrica → fuentes y que todavía no consumimos.
**SERVIDA el 2026-09-25 · `1e080ee` · `GET /admin/tenants/{tenantId}/feeds` → 200.**
Verificada contra el servicio corriendo, cuatro fuentes, y **trae todo lo que el
criterio pedía**: `cadence_hours`, `freshness_hours`, `last_load_at`,
`tolerance_factor`, `rows_processed`, `rows_failed` y `status`, más el enlace a
las métricas —`metric_count`, `metric_keys`— y `gold_table`. Queda en ⚠️ y no en
✅ hasta que A5 la consuma y se vea en pantalla.
**El pedido, cumplido.** Pedía una ruta que listara, por fuente del tenant: **última carga, frescura, cadencia y tolerancia**, y si existían las filas procesadas y las que fallaron Silver→Gold. Llegaron todas, más el enlace a las métricas.

Pedida el 2026-09-15, **reemplazando un pedido anterior del mismo día que estaba mal.** Esa mañana se pidieron `state` y `state_reason` en el modelo `Metrica` (B1.17) porque A4 necesita filtrar por estado. El `.pen` lo corrigió esa tarde: **el estado de una métrica se DERIVA, no se guarda.**

La nota de A4 lo dice con un ejemplo: «feed_vs_sales figura DISPONIBLE en el catálogo y sale DEGRADADA acá porque la frescura de su fuente la baja». Y la fila de `feed_gap` muestra las dos cosas a la vez, con la razón: «Bloqueada porque su fuente tiene 31 h y se refresca cada hora. No degrada a un valor aproximado: se apaga».

**La regla es `frescura > cadencia × tolerancia`**, y los tres términos son de la fuente, no de la métrica. Con ellos el front deriva los cuatro estados sin que nadie los escriba.

**AMPLIADO el 2026-09-15 después de leer su código**, porque el pedido original estaba subestimado. Dos cosas que conviene mirar juntas:

**a · La fuente no existe como entidad.** Buscado en `internal/core/domain/` y `internal/core/ports/`: no hay `Feed`, ni `DataSource`, ni nada equivalente. `source` es **texto libre en la métrica** —«ERP + Ads API»— así que no hay dónde colgar una última carga ni una cadencia. Esto no es agregar cuatro campos: es **crear la entidad** y relacionarla con las métricas que dependen de ella.

**b · Y ya existe una derivación de degradación, con otra regla.** `dd_config_service.go` tiene `const freshnessToleranceDays = 3` y marca `DEGRADED` cuando la última materialización pasó ese plazo:

```go
if status == Available && isDegraded(data, now) {
    status = Degraded
    reason = "Stale data: last materialization is older than 3 days"
}
```

**Es una constante global aplicada por payload de panel**, y §7.3 pide una tolerancia **por fuente**: Merchant Center con cadencia de una hora y 31 h de atraso está degradado, y una fuente diaria con 31 h no. Con la regla de hoy las dos dan lo mismo — o las dos disponibles, o las dos degradadas, según el plazo.

**No es un bug: es una aproximación razonable mientras no exista la entidad.** Pero conviene decidirlo explícitamente, porque el día que la fuente exista **hay dos reglas de degradación** y la del panel gana sin que nadie lo haya elegido.

**Y algo que el front NO va a pedir**: que `/config/panels:batch` deje de derivar. Esa derivación es correcta donde está —el payload sabe cuándo se materializó— y es la que hace que un panel degradado se vea degradado sin consultar nada más.

**Pedir el campo habría sido peor que no pedirlo**: dos fuentes para el mismo hecho —el estado guardado y la frescura real— que se separan en el primer feed atrasado.

**Desbloquea dos pantallas, no una.** A5 entera —«la pantalla que explica por qué una métrica está degradada»— y la columna de estado de A4, con su filtro.
**Descripción.** Exponer la salud de las fuentes de datos del tenant, que hoy no
sale por ninguna ruta.
**Criterio de aceptación.**
- Por fuente: identificador legible, última carga, frescura, cadencia y
  tolerancia. Sin vocabulario de infraestructura · §7.3.
- La frescura es el **instante de materialización**, nunca «ahora» · misma regla
  que B2.10.
- El front deriva el estado y **el backend no lo manda**: un estado guardado y
  una frescura real son dos fuentes del mismo hecho.


---

**Medido el 2026-09-22 · no hay ruta.** `GET /config/feeds` devuelve 404 en `82da946`.
Pasa de «no verificado» a **medido y ausente**.

## Fase 3 — Chat contextual

### B3.1 ⚠️ `POST /config/chat` con SSE
**Verificado el 2026-09-24** · el agente `SYNAPSE_UA` contesta desde la consola, el markdown se pinta y el riel guarda el hilo. Y desde `75b8ecc` acepta `tab_context` además de `panel_context`, que es lo que F3.15 esperaba.

**Verificado el 2026-09-26 contra el servicio corriendo** · commit `8633b10`. **EL PEDIDO ESTÁ VENCIDO.** Decía que lo que faltaba era «poder verificarla: sin las migraciones de B3.11 el handler escribe contra columnas que no existen». Con la base local esas migraciones corren solas, y **el chat contesta contra Cortex de verdad desde el 2026-09-24**. B3.11 sigue en pie para la base COMPARTIDA, que es otra tarea.

Lo que decía el pedido, como registro: **La ruta ya está escrita** — `82da946` la trae con `panel_context: {panel_id, period}`, y con eso se cerró la transversal T4. Lo que falta es **poder verificarla**: sin las migraciones de B3.11 el handler escribe contra columnas que no existen. **Lo pendiente del chat cambió el 2026-09-22 y el pedido vigente es otro**: con las migraciones corridas en la base local, `POST /config/chat` devuelve **409 · «no hay agente activo disponible para este tenant y rol»**. Hace falta un agente de Cortex con credenciales. **Ese pedido es del equipo de DATOS, no del backend** —corregido el 2026-09-22—: el agente `SYNAPSE_UA` y el usuario `SYNAPSE_SERVICE_USER` existen en la cuenta `MAA16864`, y lo único que falta es el par de claves RSA. Va en `docs/MENSAJE-2026-09-22-datos-agente-cortex.md`. Lo que sí le toca al backend es cargar el tenant y el agente una vez que llegue — `docs/MENSAJE-2026-09-22-backend-roles-y-hallazgo.md`, punto 1. El pedido del 21 —los dos campos del evento `data`— quedó cubierto: F3.6 se cerró con el tipo del panel. El chat que el servicio ya tenía antes es **otro producto** —decidido el 2026-09-08—: el nuestro se abre desde un panel y lleva su métrica.
**Descripción.** Body `{ pregunta, contextoPanel, periodo, hiloId? }`, respuesta
por Server-Sent Events.
**Criterio de aceptación.**
- Emite los eventos en orden: `pensando` → `fragmento` → `dato` → `sql` →
  `fin`, y `error` en cualquier punto.
- El esquema `EventoDeChat` del yaml ya declara la unión; se respeta.
- Una conexión cortada por el cliente no deja la query colgada.

### B3.2 ✅ `GET /config/chat/hilos` — historial
### B3.10 ✅ Persistir hilos y mensajes en Postgres
**Verificado el 2026-09-29 contra `de881e1`** · las de este bloque, una por una:

- **B3.2** · `GET /config/chat/threads` responde **200** con los hilos. La ruta vieja del contrato —`/config/chat/hilos`— da **404**: se renombró.
- **B3.10** · Los hilos persisten en `user_threads` y `user_thread_messages`. Sobreviven al reinicio: los siete del 26 siguen ahí.

**Criterio de aceptación.**
- El historial es del usuario y del tenant; nunca cruza tenants.
- Un hilo guarda el contexto de panel con el que se abrió.

### B3.3 ✅ Modelo `AgenteTenant`
### B3.4 ⬜ Resolver el agente del tenant desde el JWT
**Verificado el 2026-09-29 contra `de881e1`** · las de este bloque, una por una:

- **B3.3** · La tabla `agents` trae `tenant_id`, `target_role_id`, `is_active`, `snowflake_db`, `snowflake_schema`, `snowflake_cortex_agent_name`, `warehouse`, `semantic_views` y `system_prompt_base`.

**Descripción.** `snowflakeAccount`, `warehouse`, `semanticViews[]`,
`systemPromptBase`. El front solo conoce que existe un tenant; el backend
resuelve el agente.
**Criterio de aceptación.**
- Cada tenant puede tener semantic views, vocabulario y restricciones distintas.
- El front **nunca** recibe la configuración del agente ni la lista de vistas.

### B3.5 ⬜ Inyectar `ContextoDePanel` en el system prompt
**Criterio de aceptación.**
- El agente recibe el contexto de la métrica: `metricId`, `metricKey`, `nombre`,
  `base`, `fuente`, `capa`, `familia`, `periodo`, `tipo`.
- **No recibe el SQL del panel.** El panel se ancla a un `metricId`, y el agente
  también.

### B3.6 ⬜ Consulta a Snowflake en vivo para el chat
**Descripción.** El chat sí puede ir en vivo: es una consulta puntual iniciada
por el usuario, no un dashboard entero.
**Criterio de aceptación.**
- Solo contra las semantic views aprobadas del tenant.
- Con timeout y con tope de filas declarados.

### B3.7 ⬜ Formato de eventos SSE acordado con el front (T3)
### B3.8 ⬜ La respuesta puede incluir `{ forma, datos, procedencia }`
**Criterio de aceptación.**
- Cuando el agente devuelve un dato estructurado, viene con la **misma unión
  `Valor` + `Gobierno`** que un panel, para que el front lo dibuje con el mismo
  cuerpo. Es un solo modelo de datos, no dos.

### B3.9 ⚠️ CRUD `/admin/tenants/{id}/agents`
**Medido el 2026-09-26 contra el servicio corriendo** · commit `8633b10`. **EL PEDIDO ESTABA MAL Y LA MEDICIÓN TAMBIÉN.** Acá decía «existe `POST /admin/agents` y **nada más**». Las cinco rutas por tenant —GET lista, POST, GET uno, PUT, DELETE— **ya existían en `82da946`**, que es el commit contra el que se midió, y también `GET /agents/ping`. Se comprobó recorriendo `router.go` en cinco commits: aparecen en los cinco.

**Y `/agents/ping` es justo lo que esta tarea decía que bloqueaba** —«lo que el front necesita no es la configuración, es su CONSECUENCIA»—: responde `{status: "ok", latency_ms: 891, base_url}` contra Cortex de verdad. Son los tres campos que §7.3 pide, servidos.

De su criterio: la credencial **no viaja** —medido, la respuesta trae base, esquema, agente, warehouse y vistas, y ninguna clave— y `a643cfe` le puso `json:"-"` a `PrivateKeyPEM` y a su passphrase.

**Queda en ⚠️ y no en ✅** porque dos bullets no se pueden comprobar: el servicio no usa `aud` sino `AdminOnlyMiddleware` por rol, y que cambiar las vistas permitidas surta efecto en la siguiente pregunta sin reiniciar no se probó.

**Y lo que el front necesita no es la configuración, es su CONSECUENCIA.** §7.3 prohíbe mostrar vocabulario de infraestructura —ni base, ni rol técnico, ni warehouse, ni grant— y pide en su lugar: **si el acceso a datos está vigente, cuándo se verificó por última vez, y qué hacer si no lo está.** Tres campos, no un CRUD.

Con esos tres, F4.4 y la mitad que le falta a la ficha de cliente se cierran. El CRUD completo de B3.9 es otra cosa y puede esperar: **lo que bloquea es el estado, no la edición.**

**Descripción.** El superadmin configura el agente de cada tenant: cuenta,
warehouse, vistas semánticas permitidas y prompt base.
**Criterio de aceptación.**
- Solo accesible con `aud: platform`.
- La credencial **no se edita acá**: se referencia por identificador del gestor de
  secretos (B0.8), y ninguna respuesta la incluye.
- Cambiar las vistas permitidas surte efecto en la siguiente pregunta, sin
  reiniciar el servicio.

### ➕ B3.11 ⬜ Aplicar las migraciones de `82da946` sobre la base compartida
**Sale de la lista el 2026-09-28.** Las migraciones en los ambientes que no son el local **las corre el equipo de despliegue**, no ellos ni nosotros, y van con el deploy de `5924bf2b`: todas son `ADD COLUMN` y seeds idempotentes. Si al medir contra la compartida falta una columna nueva, es que ese deploy todavía no pasó. **No es un pedido de ninguno de los dos equipos.** Decía: **Que corran las migraciones manuales de `82da946` sobre la base compartida** — pedido el 2026-09-21 en `docs/MENSAJE-2026-09-21-dos-tareas-del-chat.md`, tarea 1. **Sigue en pie para la compartida**, pero ya no es lo que frena el chat: eso pasó a ser el agente, y va en `docs/MENSAJE-2026-09-22-backend-roles-y-hallazgo.md`.

Medido ese día contra la base compartida, con una consulta de sólo lectura sobre `information_schema`: **faltan las nueve columnas y el índice.** Las agrega `internal/adapters/repository/manual_migrations.go` y corren sólo con `DB_AUTO_MIGRATE=true`, que no activamos sobre esa base: es un cambio de esquema en una base compartida y la decisión no es nuestra.

Sin ellas `POST /config/chat` no puede guardar el hilo, y eso se ve como un **500, no como un 404**: la ruta existe, lo que falta es la columna.

| Tabla | Columnas | De qué tarea son |
|---|---|---|
| `user_threads` | `panel_id`, `period`, `deleted_at` | B3.1 y B3.10 |
| `agents` | `is_active`, `semantic_views`, `system_prompt_base` | B3.3 y B3.9 |
| `dd_panel_data` | `last_error`, `last_error_at`, `last_success_at` + índice `idx_dd_panel_data_tenant_metric_period` | Materialización · B2.12 |

**Descripción.** Aplicar las columnas que el commit escribe, y el índice.

**La tabla va ARRIBA de `Descripción` a propósito.** `para-backend.py` corta el
bloque en `**Descripción` o `**Criterio`, así que lo que quede debajo **no llega
a `docs/PARA-BACKEND.md`**, que es el documento que ellos leen. Abajo, las nueve
columnas se quedaban acá.

**Y el nombre del mensaje va sin enlace, también a propósito.** El generador
copia el texto verbatim, sin reescribir rutas: `](docs/…)` es correcto desde la
raíz y apunta a `docs/docs/…` una vez dentro de `docs/PARA-BACKEND.md`. El mismo
texto vive a dos profundidades, así que no hay ruta relativa que sirva en las
dos.

**Qué frena en el front.** No frena la construcción: frena la **verificación
contra el servicio**. F3.12 y F3.3 no se pueden abrir contra el chat real, F3.7
no puede mostrar con qué panel se abrió un hilo, y F4.4 se construye contra MSW
pero no se verifica.

**Criterio de aceptación.**
- La consulta del mensaje sobre `information_schema` devuelve **las nueve**
  columnas, las tres tablas incluidas. **La corremos nosotros**, contra la base
  compartida y con fecha: el aviso de que se corrieron no alcanza para
  cerrarla.
- El índice único existe, o hay una razón escrita de por qué no. El código de
  ellos **no lo crea si encuentra duplicados** y lo avisa por log, así que su
  ausencia no es necesariamente un error.
- `POST /config/chat` contra el servicio con `panel_context` guarda el hilo, y
  `GET /config/chat/threads` lo devuelve con su panel y su período.

---

**Medido el 2026-09-22 · el criterio sigue sin cumplirse, y la razón cambió de lugar.**
Las migraciones **corrieron en la base local** de `dev/postgres`, porque ahí `DB_AUTO_MIGRATE=true`
está permitido. La **compartida** no responde desde acá, así que las nueve columnas siguen sin
verificarse donde el criterio las pide.

**Y lo que frena el chat ya no es esto.** `POST /config/chat` contra el servicio local devuelve
**409 · «no hay agente activo disponible para este tenant y rol»**, con la tabla `dd_*` creada y
`GET /admin/tenants/{tenantId}/agents` en `[]`. Lo que falta es un agente con credenciales de
Snowflake, o un modo que no llame a Cortex — ver `docs/ESTADO-backend-2026-09-22.md`.

## Fase 4 — Admin y Builder

### B4.1 ✅ `GET /admin/tenants`
**Verificado el 2026-09-26 contra el servicio corriendo** · commit `8633b10`. Devuelve `locale`, `currency`, `timezone`, `user_count`, `last_published_at`, `worst_feed_status`, `worst_feed_freshness_hours`, `status`, `vertical` y `created_at`. **A1 pinta tres columnas nuevas** —usuarios, feed más atrasado y última publicación— y se vio en pantalla contra el servicio.

**`status` y `vertical` llegan en `null`, y eso NO reabre esta tarea.** El campo existe; lo que faltaba era que **nosotros** definiéramos qué valores toma cada uno, y lo dicen en su respuesta del 2026-09-25.

**Contestado el 2026-09-26 · `docs/DECISIONES-2026-09-26-estado-y-vertical.md`, y son dos respuestas distintas.** La pantalla declaraba los dos huecos con la misma razón y ya no la comparten:

- **`status` · decidido.** Tres valores —`ACTIVO`, `PILOTO`, `SUSPENDIDO`—, y los dos primeros están dibujados en A1, así que son transcripción y no elección. **Ahora espera su columna, que no existe**: su `Tenant` de `internal/core/domain/tenant.go` no la tiene, medido contra `6e595e3`. Y `SUSPENDIDO` es más que una columna: es una compuerta en el login que exceptúa a los super-admins.
- **`vertical` · retirado.** No es una etiqueta a enumerar. §3.5 declara `Tenant { … vertical, plantillaOrigen … }` —**dos campos**— y el `.pen` dibuja el par en la misma celda; al pie de A1 la regla dice que la plantilla define las pestañas y métricas de arranque. Es la cabeza de la herencia de §3.4, que no existe en ninguno de los dos lados. **La columna sigue declarada ausente y el `null` deja de ser un pendiente de nadie.**

**Cuando se escribió esta tarea devolvía** `ports.TenantPublicOption` —`id` y
`name`—, que nació para llenar un selector. **§7.3 de `design.md` describe la banda de clientes de A1 con seis
columnas**, así que la pantalla muestra una y declara que faltan cinco.

No bloquea: la lista funciona y el builder puede elegir tenant. Lo que falta es
lo que convierte una lista en una pantalla de administración — saber de un
vistazo qué cliente tiene el feed más atrasado es la mitad de para qué existe.

**Medido el 2026-09-22 · los cinco campos siguen faltando.** `82da946` devuelve `{id, name}`.
`user_count` y `last_published_at` se ven **sólo con el fork corriendo**: los escribimos nosotros
en `2fafe82`. Ver `docs/ESTADO-backend-2026-09-22.md`.

### B4.2 ✅ `GET /admin/tenants/{id}/layouts`
**Verificado el 2026-09-28 contra el servicio corriendo** · commit `5924bf2b`, construido y levantado acá porque el binario que teníamos era del 26 · `docs/ESTADO-backend-2026-09-28.md`. **La reversión existe** · `POST /admin/layouts/{layoutId}/revert`. Se midieron sus dos compuertas sin mutar nada —`409 CONFLICT_NO_PREVIOUS` y `409 CONFLICT_REVERT_SELF`, las dos con mensaje en español—. **Sigue en ⚠️ porque la reversión en sí no se probó**: copia y publica, así que cambiaría el layout que la consola sirve. Se mide cuando haya una segunda versión.

**Verificado el 2026-09-26 contra el servicio corriendo** · commit `8633b10`. **DOS DE LOS TRES LLEGARON.** `GET /admin/layouts/{layoutId}/publications` responde 200 y `DDLayoutPublication` trae `action`, `actor_user_id`, `actor_role`, `previous_layout_id`, `diff` y `created_at` — **quién, cuándo y qué cambió**, los tres que §7.2 nombra.

**CERRADA EL 2026-09-28 · los cuatro de §7.2 medidos contra `f70cec2`.** Faltaban «qué cambió» y el `200` de la reversión, y los dos se cerraron el mismo día **sin tocar el dashboard que la consola sirve**: se hizo todo sobre el segundo dashboard del tenant —«Marca»—, que no tenía layout.

**Por qué antes salía `[]` y no era un defecto suyo:** la semilla escribe `dd_layout_versions` directo, sin pasar por `publish`, así que no deja fila de auditoría. Lo dijeron y era cierto — **la forma de comprobarlo era publicar, no volver a preguntar.**

Tres publicaciones generadas y leídas:

| `action` | `previous_layout_id` | `diff.summary` |
|---|---|---|
| `publish` | — | `tabs_added 1 · panels_added 1` |
| `publish` | el anterior | `tabs_added 1 · panels_added 1 · panels_changed 3` |
| `rollback` | el anterior | `tabs_removed 1 · panels_removed 1 · panels_changed 3` |

Las tres con `actor_user_id` y `actor_role: admin`, o sea **quién**. Y `POST /admin/layouts/{layoutId}/revert` contestó **200**, devolviendo un layout con `version_id: rollback-v-1…`.

**Dos detalles de forma para quien construya B6, Y LOS DOS ESTABAN MAL ESCRITOS** · corregido el 2026-09-30 leyendo `internal/core/dashboard/diff.go`. Decía que `tabs_added` trae la **`key`** de la pestaña: trae el **NOMBRE normalizado** —`tabKey(name)` es `ToLower(TrimSpace(name))` e `indexTabs` lo aplica sobre `t.Name`—, así que cruzarlo contra `TabDeLayout.clave` no encuentra nada. Y decía que las colecciones vacías vuelven «`null`, no `[]`»: vuelven **de las dos formas**, porque `de881e13` cambió la serialización y el diff se PERSISTE en `jsonb` — las filas viejas quedan en `null` para siempre. Las dos frases se escribieron de una lectura y no de la fuente; las dos las atrapó abrir su código.

**La ruta NO está transcripta al cable**, a propósito: nadie la llama todavía. Se transcribe cuando se construya B6, que es la regla — una ruta transcrita que nadie llama envejece sin que nadie lo note. `LayoutVersion` sí se midió y trae sólo `created_at`, `dashboard_id`, `id`, `published_at`, `status`, `tenant_id`, `updated_at` y `version_id` — o sea **cuándo**.

**Lo que falta es el diff**, y es lo que B6 dibuja y no se puede construir sin él. Lo que decía el pedido original: no hay ruta de revertir ni de rollback en el router. `previous_layout_id` da con qué hacerlo y publicar el anterior con la ruta que ya existe sería el camino, pero eso es una decisión y no un hecho medido. El pedido original decía: **Autor, diferencia y reversión en `LayoutVersion`** — pedido el 2026-09-15, cuando F4.6 declaró B6.

§7.2 describe el historial de versiones en una línea: «**quién, cuándo, qué cambió. Permite revertir.** Sin esto, un error de composición en producción no tiene vuelta atrás». La respuesta de hoy trae **cuándo** y nada más.

- **Quién.** El criterio compartido de B4.2–B4.7 ya dice que publicar «registra quién publicó», así que el dato existe del lado de ustedes; lo que falta es que salga en la respuesta.
- **Qué cambió.** Contra la versión publicada anterior. No hace falta un diff estructural: alcanza con qué pestañas y qué paneles se agregaron, se quitaron o se movieron.
- **Revertir.** No hay ruta. `POST /admin/tenants/{id}/layouts` acepta un `version_id` de origen, así que puede que ya alcance con documentar que duplicar una versión vieja **es** revertir — si es así, es una línea de documentación y no código.

**No bloquea el builder**, bloquea B6. Y B6 es la pantalla que hace reversible un error de composición en producción: sin ella, la única salida es recomponer a mano.

**Medido el 2026-09-22 · autor y diff siguen faltando.** `82da946` devuelve
`{ID, TenantID, Status, VersionID, PublishedAt, CreatedAt, UpdatedAt}`. `PublishedBy`,
`PublishedByEmail` y la ruta `/admin/layouts/{layoutId}/diff` son **nuestras**, de `2fafe82`.

### B4.3 ✅ `POST /admin/tenants/{id}/layouts` — crear borrador
### B4.4 ✅ `PUT /admin/layouts/{id}` — editar pestañas y paneles
**Verificado el 2026-09-28 contra el servicio corriendo** · commit `5924bf2b`, construido y levantado acá porque el binario que teníamos era del 26 · `docs/ESTADO-backend-2026-09-28.md`. `tab.icon` y `tab.chat_suggestions` llegan en `GET /config/tabs/{id}`, y las sugerencias **como lista, nunca `null`**. Vacías en la semilla, presentes en el cable.

**Pedido cumplido el 2026-09-28.** Eran **`chat_suggestions` e `icon` en la pestaña**, pedidos el 2026-09-15 cuando F4.8 construyó el editor. Entran por `PUT /admin/layouts/{id}` —máximo 8 sugerencias, más da `422 VALIDATION_CHAT_SUGGESTIONS`— y salen por la consola.

Los dos están en el modelo de §2 de `design.md` y en `Pestana` del contrato, y no están en `DDTab` ni en `TabInput`: **no hay dónde escribirlos ni de dónde leerlos**. `chatSugerencias[]` es lo que C3 pinta como «chips de consulta sugerida por pestaña», así que sin el campo el chat abre en un vacío sin sugerencias. `icono` es menor y va de paso, porque es la misma línea.

**Y una pregunta que es de ustedes, no un pedido.** `OperationalQuestion` no es requerido y el servicio acepta la cadena vacía. El producto dice lo contrario —«una pestaña que no contesta una pregunta no se compone», §7.2 y la descripción de `Pestana`—, así que hoy **la regla la sostiene el front solo**: el editor marca la pestaña, la cuenta y no la deja componer. Si además la rechazara el `validate` o el `publish`, la regla dejaría de depender de qué cliente haga el PUT. Es B4.15 quien decidiría.

### B4.5 ✅ `POST /admin/layouts/{id}/publish`
### B4.7 ✅ `GET /admin/tenants/{id}/catalog`
**Verificado el 2026-09-29 contra `de881e1`** · `npm run humo` leyó **campo por campo** las rutas de cuatro de las seis: `GET /admin/tenants` (B4.1), `GET /admin/tenants/{tenantId}/layouts` (B4.2), `PUT /admin/layouts/{layoutId}` (B4.4) y `GET /admin/layouts/{layoutId}/validate` (B4.6). Los requeridos están y no sobra ninguno sin declarar.

**Va acá y no en cada encabezado, y la razón es del parser:** estas seis comparten este bloque, y meter una línea **en cualquiera de sus encabezados** —probado con B4.1, B4.2 y B4.4— parte el grupo y deja a cuatro sin criterio. `plan --check` lo atajó las dos veces que se intentó.

**Consecuencia que conviene saber al leer `docs/ESTADO-BACKEND.md`:** esas tareas figuran ahí **contra su commit anterior**, no contra `de881e1`. Y está bien que así sea: lo que se remidió el 29 fue la **forma de sus rutas**, no sus criterios. Quien vaya a reverificarlas encuentra las dos cosas.

**Es la FORMA de las rutas, no el criterio de las seis.** Dice que las respuestas no cambiaron, no que las tareas se hayan vuelto a auditar.

**Verificado el 2026-09-29 contra `de881e1`** · las de este bloque, una por una:

- **B4.3** · `POST /admin/tenants/{tenantId}/layouts` con `dashboard_id` crea un borrador y devuelve su id con `status: draft`.
- **B4.7** · `GET /admin/tenants/{tenantId}/catalog` responde **200**, y `humo` lo leyó campo por campo: 12 requeridos y nada fuera de los 12 declarados.

**Verificado el 2026-09-29 contra `de881e1`** · las de este bloque:

- **B4.5** · Se publicó **dos veces** sobre el dashboard «Marca» —para no tocar el que la consola sirve— y las dos dieron **200**, dejando su fila de auditoría con actor y diff.

**Criterio de aceptación (los seis).**
- Solo accesibles con `aud: platform`; con token de usuario devuelven `403`.
- Publicar genera `versionId`, sella `publishedAt`, registra quién publicó e
  invalida la cache del tenant.
- Editar nunca muta la versión publicada.

### B4.6 ✅ `POST /admin/layouts/{id}/validate`
### B4.11 ✅ Validar que `metricId` existe en el catálogo del tenant
### B4.12 ✅ Validar que `tipo` es compatible con la `forma` de la métrica
### B4.13 ✅ Validar rangos de `colSpan` / `rowSpan` por tipo
### B4.14 ✅ Validar opciones de layout (`maximo` obligatorio en gauge)
### B4.15 ✅ Rechazar la publicación si hay paneles inválidos
**Verificado el 2026-09-29 contra `de881e1`** · las de este bloque, una por una:

- **B4.6** · `POST /admin/layouts/{layoutId}/validate` devuelve `{valid: false, errors: [...]}` en español · «el layout necesita al menos una pestaña».
- **B4.11** · Un `metric_id` inexistente se rechaza · «la métrica no existe en el catálogo del tenant».
- **B4.12** · Un bloque incompatible con la forma se rechaza · «la forma 'scalar' no es compatible con el bloque 'table'».
- **B4.13** · Un `col_span` fuera de rango se rechaza · «col_span fuera de rango para el bloque 'kpi'».
- **B4.14** · Un `gauge` sin `maximum` se rechaza · «el bloque gauge necesita options.maximum». **Y eso explica por qué `ERROR` dejó de ser alcanzable por ahí** · ver B2.12.

**Verificado el 2026-09-29 contra `de881e1`** · las de este bloque:

- **B4.15** · Publicar un layout con paneles inválidos se rechaza · `VALIDATION_LAYOUT` · «el layout tiene errores de validación; consulte validate para el detalle». **Y remite a `validate`** en vez de repetir el detalle, que es lo correcto: una sola fuente para el listado de errores.

**Descripción.** La validación de composición, del lado del servidor. El front
la replica para dar feedback inmediato, pero **el servidor es el que decide**.
**Criterio de aceptación.**
- Un panel `gauge` sobre una métrica de forma `serieTemporal` no publica.
- Un `kpi` con `colSpan 8` no publica: su rango es 3–4.
- El error dice **cuál** panel y **por qué**, en la lengua del producto: «un
  bloque gauge no sabe dibujar la forma serieTemporal», no «validación fallida».
- La regla dura de `serieConBanda` se verifica: solo gráficos con banda.

### B4.8 ✅ CRUD de roles por tenant · lo tomaron el 2026-09-25

**Verificado el 2026-09-29 contra `de881e1`** · `npm run humo` leyó `GET /admin/tenants/{tenantId}/roles/composition` **campo por campo**: los requeridos están y no sobra ninguno sin declarar. **Es la FORMA de la ruta, no el criterio entero** — dice que la respuesta no cambió, no que la tarea se haya vuelto a auditar.
**SERVIDA · `GET /admin/tenants/{tenantId}/roles/composition` → 200**, verificado
contra `1e080ee` con el servicio corriendo. **Tomaron la ruta que propusimos**
—nos habíamos corrido a `/composition` para no pisar la suya— así que la colisión
queda cerrada de las dos puntas. Trae `tab_ids`, `hidden_metric_ids`,
`layout_overrides` y `user_count`.

Con eso A2 se ve contra el servicio real por primera vez.
**Decidido el 2026-09-15 (humano): esta la escribimos nosotros, en Go.**

**Y eso revierte una regla, así que va con su antecedente.** El 2026-09-08 se
había abierto `AntPack-dev/synapse-api-go#1` con dos cambios chicos y se
**revirtió** —commit `2de76de`— con un criterio que sigue valiendo en general:
«tocar el código de otro equipo desde afuera les saca la decisión de las manos y
parte en dos el lugar donde se revisa». Lo que proponíamos se describía y lo
aplicaban ellos.

**La excepción es de alcance, no de criterio.** B4.8 bloquea F4.3, y F4.3 es
superficie de admin que hoy no se puede ni empezar. Esperar un CRUD de roles para
construir la pantalla que lo consume deja parada una fase entera por un trabajo
que son cuatro endpoints sobre una tabla que ya existe.

**Sale de `docs/PARA-BACKEND.md`**: dejó de ser algo que esperamos.

**Qué hay que implementar.** Cuatro operaciones sobre `roles`, que ya tiene las
tres columnas desde B0.3 —`tab_ids uuid[]`, `hidden_metric_ids uuid[]`,
`layout_overrides jsonb`—, bajo `AdminOnlyMiddleware` como el resto de
`/admin/*`:

| | |
|---|---|
| `GET /admin/tenants/:tenantId/roles` | Listar, con las tres columnas |
| `POST /admin/tenants/:tenantId/roles` | Crear |
| `PUT /admin/roles/:roleId` | Editar las tres |
| `DELETE /admin/roles/:roleId` | Borrar · **rechazar si hay usuarios asignados** |

**Dos cosas que no son obvias y hay que respetar:**

- **`hidden_metric_ids` oculta y NO permite.** §1.4.20: el servidor vuelve a
  verificar en `/config/catalog` y en el batch. Un rol que oculta una métrica no
  es un rol que no puede pedirla — eso ya está implementado y no se toca.
- **`layout_overrides` no muta el layout publicado.** `GetTab` los aplica al
  responder. Un CRUD que los escriba mal recompone la consola de otro rol sin
  que nadie publique nada.

**Dónde vive el código: en un FORK.** Decidido el 2026-09-15 (humano). Un fork de
`AntPack-dev/synapse-api-go` sobre `feature/dynamic-dashboard-backend`, y ahí se
escriben B4.8 y B4.9.

**Es coherente con `2de76de` y no lo contradice.** Esa regla dice que no se toca
el repositorio de otro equipo *desde afuera*; un fork no lo toca. Escribimos en
nuestro lado y la decisión de integrarlo sigue siendo de ellos — que era el punto
de la regla: «les saca la decisión de las manos».

**Lo que un fork trae, y hay que sostenerlo:**

- **Deriva.** Su rama avanza y la nuestra no se entera sola. El aviso ya existe:
  `npm run backend-drift` compara el commit que el cable declara contra la cabeza
  de su rama. **Antes de tocar el fork se corre**, y si se movieron, primero se
  rebasa.
- **Un fork que nunca vuelve es un segundo backend.** Ese es el riesgo real, no
  el técnico: dos servicios que hacen casi lo mismo y divergen.

  **DECIDIDO el 2026-09-15 (humano): vuelve DESDE nuestro repositorio.** No se
  abre PR contra el suyo. El fork es la fuente y ellos lo toman cuando quieran —
  que es exactamente lo que `2de76de` protegía: «tocar el código de otro equipo
  desde afuera les saca la decisión de las manos». Acá la decisión de integrar
  sigue siendo de ellos, entera.

  **Lo que eso nos obliga a sostener**, porque el costo se muda a nuestro lado:

  1. **La rama se mantiene rebasada sobre la suya.** `npm run backend-drift`
     avisa cuando su cabeza se movió, y se corre **antes de tocar el fork**. Un
     fork escrito sobre una base vieja no se puede integrar sin rehacerlo.
  2. **El commit tiene que explicarse solo.** Nadie de su lado estuvo en la
     conversación donde se decidió: el mensaje lleva qué rutas, por qué se
     escribieron desde acá, y las decisiones que no son obvias.
  3. **Cero churn en su código.** Esto ya costó una corrección: ampliar
     `RoleRepository` rompía ocho mocks de `auth`, `user` y `agent`. Un puerto
     nuevo no rompe nada. **En un fork que tiene que volver, el churn evitable es
     lo que lo vuelve inmergeable.**
- **El despliegue no cambia hoy.** El servicio que corre sigue siendo el suyo. Si
  algún día se despliega el fork, esa es otra decisión y no esta.

**Criterio de aceptación.**
- Las cuatro operaciones existen bajo `AdminOnlyMiddleware` y responden con el
  envelope del servicio, no con uno nuestro.
- Borrar un rol con usuarios asignados **falla con razón**, no en cascada.
- `hidden_metric_ids` sigue siendo filtro de composición y no de permiso: el
  servidor verifica igual, y hay una prueba que lo demuestra pidiendo una métrica
  oculta directamente.
- `layout_overrides` escrito por el CRUD se refleja en `GET /config/tabs/:tabId`
  del rol afectado **sin republicar el layout**.
- El fork está rebasado sobre su rama **al empezar** —`npm run backend-drift` en
  verde— y se vuelve a rebasar antes de proponer el código de vuelta. Un fork
  escrito sobre una base vieja no se puede integrar sin rehacerlo.
### B4.9 ✅ Preview por rol · con los paneles

**Verificado el 2026-09-29 contra `de881e1`** · `npm run humo` leyó `GET /admin/layouts/{layoutId}/preview` **campo por campo**: los requeridos están y no sobra ninguno sin declarar. **Es la FORMA de la ruta, no el criterio entero** — dice que la respuesta no cambió, no que la tarea se haya vuelto a auditar.
**Verificado el 2026-09-28 contra el servicio corriendo** · commit `5924bf2b`, construido y levantado acá porque el binario que teníamos era del 26 · `docs/ESTADO-backend-2026-09-28.md`. **El preview trae `tabs[].panels[]`.** Medido con los dos lentes sobre el mismo layout: `admin` → 12 paneles con `col_span` 12; `planner` → **9 paneles con `col_span` 4**, o sea el override aplicado. **Esto destraba F4.12.**

**Verificado el 2026-09-26 contra el servicio corriendo** · commit `8633b10`. **`GET /admin/layouts/{layoutId}/preview` responde 200** y con eso el fork queda absorbido entero. **Y resolvieron la colisión de diseño como propusimos**: la compuerta de borradores mira `sel.CallerRole` —quién pregunta— y no el rol simulado.

**Dos cosas que no se deducen y hay que saber:**

- **El parámetro es `role_id`, no `roleId`.** Medido: camelCase devuelve **400**. No se deduce del resto del cable —`/config/tabs` usa `layoutId` y `dashboardId`— y **MSW no podía verlo**, porque su handler leía la misma grafía que mandábamos. F4.12 nunca pudo haber funcionado contra el servicio real.
- **Viene SIN paneles.** `tabs[]` trae `id`, `name`, `operational_question` y `sort_order`. Nuestra versión devolvía la pestaña con sus paneles ya filtrados, que es lo que deja comparar «CEO contra Planner» panel por panel.

**Pedido cumplido el 2026-09-28.** Eran **los paneles de cada pestaña en el preview**, y llegaron. Hoy `GET /admin/layouts/{layoutId}/preview?role_id=` devuelve `tabs[]` con `id`, `name`, `operational_question` y `sort_order`, y nada más — medido el 2026-09-26.

Sin ellos el preview contesta **qué pestañas** ve un rol y no **qué paneles**, que es la mitad que `hidden_metric_ids` recorta y la razón por la que §7.2 pide esta pantalla. **No hay otra ruta que lo dé**: `GET /config/tabs/{tabId}` resuelve el rol desde el token y no acepta lente, así que un admin no puede pedir una pestaña con los ojos de otro rol.

Nuestra versión del fork devolvía `tabs[].panels[]` ya filtrados, reusando `GetTab`. Si prefieren no tocar el preview, la alternativa es aceptar un `role_id` en `GET /config/tabs/{tabId}` bajo la compuerta de admin — que es lo que su propio comentario ya describe como si existiera.

**Lo de abajo quedó como registro**: se implementó en el fork el 2026-09-15 y ya no hace falta.

### Cómo se decidió implementarla en el front · 2026-09-15
**Decidido el 2026-09-15 (humano), junto con B4.8** y por la misma razón: son
vecinas, tienen la misma forma, y las dos bloquean superficie de admin que hoy no
se puede empezar. El antecedente y el alcance de la excepción están escritos en
B4.8 y no se repiten acá. **Sale de `docs/PARA-BACKEND.md`.**

**Qué hay que implementar.** Una forma de resolver una pestaña *como la vería otro
rol*, bajo `AdminOnlyMiddleware`. Dos caminos y conviene elegir con cuidado:

| | |
|---|---|
| `GET /admin/layouts/:layoutId/preview?roleId=` | Ruta propia. Más explícita, y no toca `/config/*` |
| `GET /config/tabs/:tabId?asRoleId=` | Un parámetro en la ruta que ya existe. Menos código, **pero mete una capacidad de admin en el namespace de la consola** |

**La recomendación es la primera**, y no por gusto: `/config/*` lo sirve
`RequireUser` y su invariante es «lo que ves es lo tuyo». Un parámetro que lo
rompa es la clase de cosa que un día se llama sin `AdminOnlyMiddleware` delante.

**Y la propiedad que hace que esto sirva o no sirva:**

> **El preview tiene que pasar por el MISMO código de filtrado que la consola.**

`GetTab` ya aplica `roles.tab_ids`, `hidden_metric_ids` y `layout_overrides`. El
preview resuelve el rol de otra forma —del parámetro y no del JWT— y **de ahí en
adelante es la misma función**. Reimplementar el filtrado en paralelo es cómo el
preview termina mostrando algo que la consola no muestra, y un preview que miente
es peor que no tenerlo: se publica confiando en él.

Es la misma razón por la que F4.12 dice que no se puede simular en el cliente —
«filtrar en el front lo que ya se tiene probaría el filtro del front, que no
existe».

**Criterio de aceptación.**
- Bajo `AdminOnlyMiddleware`. Un usuario de consola que la llame recibe 403.
- **Reusa `GetTab`**, no una copia: verificable porque cambiar el filtrado en un
  solo lugar cambia la consola y el preview a la vez.
- Para un rol con `hidden_metric_ids`, el preview devuelve **menos paneles** que
  para uno sin ellos, y los `layout_overrides` de ese rol están aplicados.
- Un `roleId` de otro tenant devuelve **404 y no 403**: no se revela que existe,
  igual que `GET /config/tabs/:tabId`.
- **Queda escrito si el preview incluye payloads o solo el layout.** Con solo el
  layout alcanza para «CEO vs Planner», que es lo que F4.12 pide; con payloads
  hay que decidir qué período usa y si un panel oculto llega como `SIN_PERMISO` o
  no llega. Decidirlo antes, no durante.
### B4.8 y B4.9 escritas el 2026-09-15 · en el fork, y en ⚠️ y no en ✅

**El código está y las dos quedan PARCIALES**, que es lo que la regla de este
repositorio obliga: «el estado de una tarea de backend lo mueve el front, y solo
después de verificarlo **contra el servicio corriendo**». El fork no está
desplegado, así que no hay servicio contra el cual verificar. Marcarlas ✅ sería
exactamente la suposición con forma de hecho que esa regla persigue.

**Dónde está:** `gerardoriarte-bt/synapse-api-go`, rama `feature/roles-y-preview`,
partida de `feature/dynamic-dashboard-backend` en `733c13c` — el mismo commit que
`backend-drift` declara, verificado en verde antes de empezar. El fork es
**privado**, porque el repositorio de origen lo es. **No se abrió PR**: cómo
vuelve el código a ellos sigue sin decidirse, y esa decisión es anterior al
primer merge.

**18 pruebas nuevas, once mutaciones muertas, y las suyas siguen pasando sin
tocar una sola.**

### Cuatro decisiones del lado de Go que no son obvias

**Un puerto NUEVO en vez de ampliar el que estaba.** La primera versión le agregó
los cinco métodos a `RoleRepository` y **rompió ocho mocks** de `auth`, `user` y
`agent` que no tienen nada que ver con esta tarea. `DDRoleRepository` aparte,
implementado por el mismo adaptador, no rompe nada — y es la misma separación que
ya existe entre `dd_repositories.go` y `repositories.go`. **En un fork que tiene
que volver, el churn evitable es lo que lo hace inmergeable.**

**`Updates` con cuatro columnas, no `Save`.** Un `Save` de GORM manda el struct
entero, incluido `tenant_id`. Un rol no cambia de cliente, y dejar esa puerta
abierta es cómo un rol termina en otro.

**Borrar con usuarios se rechaza con la razón y el número.** La FK ya tiene
`OnDelete:RESTRICT`, así que fallaría igual — **como un error de Postgres
convertido en 500 que no le dice a nadie qué hacer**. Y en cascada sería peor:
dejaría usuarios sin rol, que es un usuario que no puede entrar a ninguna
pestaña. El `user_count` viaja además en el listado, para que la pantalla lo diga
antes de ofrecer el botón y no después del 409.

**`layout_overrides` ausente se escribe como `{}`, no como nil.** En un UPDATE
parcial, nil deja la columna intacta: «sin overrides» es un estado, no una
omisión.

### B4.9 · lo que salió gratis, y la decisión que había que tomar

**`GetTab` ya recibe el `roleID` por parámetro y no del JWT.** Eso hace que
«reusa `GetTab`, no una copia» no cueste nada: el preview resuelve el rol de otra
forma y de ahí en adelante es literalmente la misma función. Hay una prueba con
un espía que lo verifica llamada por llamada — si alguien reimplementara el
filtrado, el espía vería cero.

**Y va bajo `/admin/*` y no como `?asRoleId=` en `/config/tabs/:tabId`.** Ese
namespace lo sirve `RequireUser` y su invariante es «lo que ves es lo tuyo». Un
parámetro que lo rompa es la clase de cosa que un día se llama sin
`AdminOnlyMiddleware` delante.

**Decidido: el preview va SIN payloads**, que es lo que el criterio pedía
resolver antes y no durante. Con el layout alcanza para «CEO vs Planner». Con
payloads habría que decidir qué período usa y si un panel oculto llega como
`SIN_PERMISO` —dos decisiones de producto para una pantalla que no existe— y
materializar costaría lo mismo que la consola real. La respuesta lo declara en
`without_payloads`, para que nadie dibuje un cuerpo vacío creyendo que el panel
está en blanco.

### Las cinco rutas entran al cable marcadas como nuestras

`contracts/synapse-admin-wire.yaml` declara ahora **dos cosas distintas**: las
ocho de ellos y las cinco del fork, cada una con `x-origen: fork` y el aviso de
que **el servicio desplegado devuelve 404**. Están ahí porque F4.3 y F4.12 se
construyen contra MSW, igual que se construyó la consola entera antes de que
existiera el servicio.

### Una prueba que dice qué NO demuestra

`TestEditarNoTocaElTenantDelRol` prueba que el **servicio** no toca `TenantID`.
**No** prueba la otra mitad —que el repositorio escriba solo cuatro columnas—
porque el mock reemplaza el rol entero y esa mitad necesita una base de datos. Se
dejó dicho en el comentario en vez de dejar que el nombre prometiera de más.

### Lo que falta para cerrarlas en ✅

Un despliegue del fork, o que el código vuelva a su rama y se despliegue el suyo.
Recién ahí `humo.py` puede verificarlas contra un servicio corriendo — y para las
rutas de admin hace falta además **un usuario `admin`**, que sigue siendo el
mismo pedido que dejó `synapse-admin-wire.yaml` sin confirmar.

### B4.17 ✅ Una ruta que liste usuarios · A3 no se puede empezar sin ella

**Verificado el 2026-09-29 contra `de881e1`** · `npm run humo` leyó `GET /admin/tenants/{tenantId}/users` **campo por campo**: los requeridos están y no sobra ninguno sin declarar. **Es la FORMA de la ruta, no el criterio entero** — dice que la respuesta no cambió, no que la tarea se haya vuelto a auditar.
**Verificado el 2026-09-26 contra el servicio corriendo** · commit `8633b10`. **`GET /admin/users` existe desde `6e521cc`** y devuelve `{total, tenants, users}` con `tenant_name` por usuario. Es el alcance de plataforma que A3 dibuja, y **los dos conteos los cuenta el servicio** — que es exactamente lo que pedía la razón por la que no se compensaba desde el front: «un total armado acá se leería como un número de plataforma y sería una suma nuestra». A3 se abrió contra el servicio con la columna `CLIENTE`.
**SERVIDA el 2026-09-25 · `1e080ee`**, el mismo día que se pidió.
`GET /admin/tenants/{tenantId}/users` → 200, y trae lo que §7.3 le pide a A3:
`email`, `first_name`, `last_name`, `role` con su `role_id`, `last_login_at` y
`is_active`. **No está en `/admin/users`**, que sigue dando 404: va colgada del
tenant, que es más correcto.
**El pedido, cumplido.** Pedía una ruta que listara usuarios. El 2026-09-25 `GET
/admin/users` daba **404** —comprobado contra `6e595e3` limpio con token de rol
admin— y ese mismo día sirvieron la por-cliente; `6e521cc` agregó la de
plataforma, que es la que A3 dibuja.

**No es que A3 se vea incompleta: no hay nada que dibujar.** Es la única
pantalla de administración cuyo hueco no tenía tarea escrita en ningún lado —ni
de ellos ni nuestra—, y por eso se abre acá: un pedido que sólo vive en un
mensaje envejece sin que nadie lo note.

**Va junto con B4.8.** Sin el CRUD de roles no hay permisos que mostrar por
usuario, que es lo que la propia pantalla declara hoy como razón de estar
pendiente. Pedidas juntas en
`docs/MENSAJE-2026-09-25-backend-feeds-y-usuarios.md`.

**Criterio de aceptación.**
- Lista por tenant, bajo `AdminOnlyMiddleware` como el resto de `/admin/*`.
- Por usuario, lo que §7.3 le pide a A3: **el usuario, su rol, su último acceso
  y su estado**.
- El rol viene identificado, no sólo con su nombre: A3 enlaza a la ficha.
- **El último acceso es un instante, nunca «hace X»** — la presentación es del
  front y depende del huso del navegador · la regla de las dos zonas horarias.


#### ➕ B4.18 ✅ `roles.tab_keys` · la consola YA escribe por clave
**Y LA CONSOLA YA MIGRÓ** · el mismo 2026-09-29, que era lo que ellos pedían: «la consola de roles puede pasar a escribir `tab_keys` y dejar de mandar `tab_ids`».

`adaptarRol` **lee** `tab_keys` con respaldo a `tab_ids` —el orden es el suyo, y al revés dejaría **sin restricción** a un rol sin migrar, que es un error que ABRE acceso— y `cuerpoDeRol` **escribe sólo `tab_keys`**: mandar los dos sería ruido que alguien va a leer como la fuente.

**Y aparecieron DOS lugares más que comparaban por id**, que nadie había mirado: `RoleCard` —la ficha quedaba en blanco después de publicar— y `uso.ts` —el desglose decía «0 rol(es)» y se leía como un dato—. Los dos fallaban **sin romper nada visible**.

**La mutación encontró el caso que faltaba en las pruebas.** Invertir el orden de lectura pasaba: los fixtures tenían o una o la otra, nunca las dos. **Después de su migración los roles tienen LAS DOS** —`tab_keys` se rellenó desde `tab_ids`— y los ids quedan apuntando a la versión vieja. Se agregó ese caso y ahora muere.

**CERRADA EL 2026-09-29 · llegó en `de881e1`, y se verificó la SUSTANCIA, no el campo.**

Que la columna exista no prueba nada; lo que prueba es que un rol sobreviva. Medido en la base descartable: se le puso a `planner` un `tab_ids` apuntando a un uuid **inexistente**, dejándole `tab_keys: ["overview"]`, y `GET /config/me` le devuelve **su pestaña igual**. Con `tab_ids` roto y sin `tab_keys`, la perdería.

**Y la migración hace lo que dijeron**: rellena una sola vez desde los `tab_ids` actuales — `admin`, `planner` y `user` quedaron en `["overview"]` sin que nadie tocara la consola, y el rol descartable sin pestañas quedó en `[]`.

**Una advertencia que costó cinco minutos**: la primera medición dio `tab_keys: []` en los cuatro roles y pareció que la migración no corría. **Era nuestro**: el servicio se había levantado sin `DB_AUTO_MIGRATE=true`, así que la columna no existía y el campo salía vacío por defecto. En una base descartable esa variable va siempre.

**Lo que se pidió:** lo propusieron ellos y les dijimos que sí · `docs/RESPUESTA-2026-09-28-cinco-que-quedan.md`.

**Medido contra `de881e1` el 2026-09-29** · sin una sola aparición de `tab_keys` en `internal/`.

**El defecto que cierra:** `roles.tab_ids` apunta a `dd_tabs.id`, y **ese id se recrea en cada versión de layout**. Así que un rol restringido a dos pestañas **las pierde al publicar**. `key` ya viaja —medido el 2026-09-28: `overview`— y es estable por diseño.

**Criterio de aceptación.**
- `roles.tab_keys` es la fuente de verdad y `roleCanSeeTab` resuelve por `key` contra el layout que se está sirviendo.
- `tab_ids` sigue leyéndose como respaldo mientras esté vacío `tab_keys`, así que nada cambia hasta que migremos.
- `PUT /admin/roles/{id}` acepta `tab_keys` y `GET .../roles/composition` devuelve **las dos** — es lo que nos deja migrar sin una ventana en que la consola de roles muestre menos de lo que el rol ve.
- **`tab_keys` valida contra las keys del layout publicado** y devuelve 422 nombrando la que no existe. Una key que no resuelve es una pestaña que el rol pierde en silencio, que es el defecto que se está cerrando.

#### ➕ B4.19 ✅ La compuerta de `resolveLayout` y la vista previa por rol
**EL PEDIDO NO HACÍA FALTA · verificado el 2026-09-28 contra `f70cec2`, antes de mandarlo.**

Esta tarea se escribió desde una nota nuestra del 2026-09-25 que decía que la compuerta de `resolveLayout` usaba `!isAdminRoleName(role.Name)` y que **el preview, al pasar el rol SIMULADO, rechazaba cualquier borrador**.

**Su código dice otra cosa.** `dd_config_service.go:498` lee
`if layout.Status != domain.LayoutStatusPublished && !isAdminRoleName(sel.CallerRole)` — **`sel.CallerRole`, el rol de quien PREGUNTA**, que es exactamente la distinción que la nota decía que faltaba.

Y se midió el caso exacto en vez de discutir el código: **previsualizar un BORRADOR con lente `planner`** contesta `200` con `status: draft` y el rol simulado en la respuesta.

**Lo que enseña, y es lo caro:** la nota se escribió leyendo un diff de rebase y quedó en `CLAUDE.md` tres días. Al armar el informe de «todo lo que falta» se convirtió en tarea **sin volver a abrir su código**, que es la misma falla del 2026-09-25 — citar una transcripción nuestra como si fuera una medición.

**Criterio de aceptación.**
- Previsualizar un borrador con un lente no-admin devuelve el layout · **medido: 200**.
- La compuerta distingue el solicitante del rol simulado · **verificado en `dd_config_service.go:498`**.

#### ➕ B4.20 ⬜ (libre)
**Descripción.** Identificador reservado para no reusar el de una tarea retirada.
**Criterio de aceptación.**
- No se asigna a otra cosa · `plan:ancestro` verifica que ningún identificador se reasigne.

**Criterio de aceptación.**
- La compuerta distingue el rol del **solicitante** —que es quien debe ser admin para ver un borrador— del rol **simulado**, que es el lente.
- Previsualizar un borrador con el lente de un rol no-admin devuelve el layout, porque quien pregunta sí es admin.
- **Si la decisión es que un borrador no se previsualiza nunca**, eso también cierra la tarea — y entonces B4.9 y F4.12 quedan acotadas a layouts publicados, con su razón escrita.

### B4.10 ⚠️ Asignación de layout publicado a roles
**Medido el 2026-09-26 contra el servicio corriendo** · commit `8633b10`. **Las tres etiquetas `json:` llegaron** en `8633b10` y el `json:"-"` en `a643cfe`. Con eso el cable de admin deja de mezclar dos convenciones — y **romperlo fue lo que nos enteró**: el front leía quince campos en PascalCase que pasaron a `undefined`, y `ESTADOS[w.Status] ?? 'borrador'` afirmaba que todo layout era borrador.

También llegó el primer bullet del criterio: el rol declara `tab_ids`, `hidden_metric_ids` y `layout_overrides`, más `dashboard_ids` y `default_dashboard_id`.

**El segundo bullet NO se cumple, y es el que da nombre a la tarea**: «el preview devuelve **exactamente** lo que ese rol vería, resuelto por el mismo código que sirve `/config/me`. No una simulación aparte». El preview de upstream es un servicio propio y devuelve **las pestañas sin sus paneles**, así que no muestra qué recorta `hidden_metric_ids`. Ver B4.9.

**No es una preferencia nuestra: rompe sus propios tests de Postman.**
`scriptCreateDraft` de su colección F4 afirma `lv.status === 'draft'` y lo que
llega es `Status`, así que compara `undefined` contra `'draft'`. Lo mismo
`d.tabs[0].tab.name` en `F4-8`. Los DTO del builder sí las tienen; los structs de
dominio no, y por eso la misma respuesta mezcla las dos convenciones.

**Y el `json:"-"` es aparte, por si se prioriza distinto.** `DDLayoutVersion`
tiene un campo `Tenant Tenant` sin él, y `domain.Tenant` guarda `PrivateKeyPEM` y
`PrivateKeyPassphrase`. **Hoy no filtra** —ningún repositorio hace
`Preload("Tenant")`, así que viajan cadenas vacías— pero el día que alguien
agregue un `Preload` para mostrar el nombre del tenant, filtra, y nada lo
detendría.

**Mientras tanto el front lo absorbe** en su adaptador, igual que el resto del
cable: no están bloqueando nada. Es higiene, y de la barata.
**Criterio de aceptación.**
- Un rol declara `tabIds[]`, `hiddenMetricIds[]` y `layoutOverrides` opcionales.
- El preview devuelve **exactamente** lo que ese rol vería, resuelto por el
  mismo código que sirve `/config/me`. No una simulación aparte.

**Medido el 2026-09-22 · 404 en upstream.** `GET /admin/tenants/{tenantId}/roles` responde
sólo con el fork corriendo. **Y hay una colisión**: `168a761` registra esa misma ruta contra
`ddDashboardHandler.ListRoles`, con otra respuesta. Es lo que frena el rebase.

**La colisión, campo por campo · 2026-09-22.** `GET /admin/tenants/{tenantId}/roles`
queda registrada **dos veces** y las dos son razonables, porque **contestan preguntas
distintas con la misma URL**:

| | Suya · `168a761` | Nuestra · `198fea8` |
|---|---|---|
| Handler | `ddDashboardHandler.ListRoles` | `ddRoleHandler.List` |
| Campos | `id`, `name`, `dashboard_ids`, `default_dashboard_id` | `id`, `tenant_id`, `name`, `tab_ids`, `hidden_metric_ids`, `layout_overrides`, `user_count` |
| Contesta | qué **dashboards** ve el rol | qué ve el rol **dentro de un layout**, y si se puede borrar |

**Es lo que frena el rebase**, y no se resuelve solo: elegir por ellos sería
decidir la forma de su API. Propuesto el 2026-09-22 en
`docs/MENSAJE-2026-09-22-backend-roles-y-hallazgo.md`, punto 2: **nos movemos
nosotros** —cero churn en su código, que es la regla— y la unión de campos queda
como alternativa si la prefieren.

### ➕ B4.16 ✅ Declarar el gráfico en el layout

**Verificado el 2026-09-29 contra `de881e1`** · `chart` viaja en `DDPanelDTO` y en `DDLayoutPanel`, se escribe desde el builder recortado y en minúsculas —`"  Waterfall  "` → `waterfall`— y ausente queda cadena vacía. Transcripto en los dos cables y con prueba de cadena de punta a punta.
**Descripción.** D2 lo resolvió a favor. `PanelConfigurado` gana `plot?: PlotId`.
Depende de B1.21: **primero los mínimos, después el campo** — elegir gráfico sin
saber qué necesita cada uno es multiplicar el problema, no resolverlo.
**Criterio de aceptación.**
- `plot` es **opcional**: ausente ⇒ el gráfico por defecto del `tipo`, que es
  exactamente lo que se dibuja hoy. El cambio no mueve ninguna pantalla existente.
- `layouts/{id}/validate` verifica tres cosas contra el repertorio:
  compatibilidad gráfico ↔ forma, la regla dura de banda, y que la métrica pueda
  alcanzar los mínimos del gráfico en el grano que declara.
- Un layout con un gráfico incompatible **no publica**, y el error dice cuál
  panel y por qué.

---

## Fase 5 — Multi-dashboard y pulido

### B5.1 ⚠️ Varios layouts por tenant
**Verificado el 2026-09-25** · `/config/me` declara `dashboards` —con `id`, `name`, `slug` e `is_default`—, `active_dashboard_id` y `active_layout_id`, y `PUT /config/me/preferences` acepta `preferred_dashboard_id`. Queda en ⚠️ hasta que F5.1 lo consuma.

**Verificado el 2026-09-26 contra el servicio corriendo** · commit `8633b10`. **LLEGÓ, con otro nombre.** Pedía «la lista de layouts que el usuario puede ver, en `/config/me`», y lo que llegó es la lista de **dashboards**: `dashboards[{id, name, slug, is_default}]`, `active_dashboard_id` y `active_layout_id`. Es el modelo multi-dashboard, y es con lo que el selector de F5.1 se construye.

**El filtrado por rol no se puede comprobar todavía**: el tenant tiene un solo dashboard, así que admin y planner ven el mismo. El rol declara `dashboard_ids` y `default_dashboard_id`, que es dónde viviría.

Lo que decía el pedido, como registro: **La lista de layouts que el usuario puede ver, en `/config/me`.** `GET /config/tabs/:tabId?layoutId=` ya funciona, pero no hay forma de saber qué layouts le tocan a alguien, así que el selector de F5.1 no se puede construir: no se ofrece una elección que no se sabe si existe.
**Descripción.** Un tenant puede tener más de un dashboard publicado —
«Operaciones», «Marca», «Ejecutivo»— cada uno con sus pestañas.
**Criterio de aceptación.**
- Cada layout versiona por separado: publicar «Marca» no toca «Operaciones».
- `/config/me` devuelve `layouts` solo cuando el usuario tiene más de uno
  asignado; con uno, el campo no viaja.

### B5.2 ✅ Asignar layout por rol, o dejar elegir si el usuario tiene varios

**Verificado el 2026-09-29 contra `de881e1`** · `GET /config/tabs/{tabId}?layoutId=…` responde **200**: el parámetro se acepta y resuelve.
**Criterio de aceptación.**
- El superadmin asigna qué layout ve cada rol.
- `GET /config/tabs/{tabId}?layoutId=` resuelve contra el layout pedido, y
  verifica que ese layout esté asignado al rol del token: si no, `404`.

### B5.3 ⬜ Formas v1.1 cuando haya datos
**Descripción.** `categoricaComparada`, `perfilMultiatributo`, `matriz`, `grafo`
y `flujo`.
**Criterio de aceptación.**
- Se activan **cuando exista el dato**, no antes. Construir contra formas que
  ningún endpoint devuelve es escribir a ciegas.
- Cada una entra con su regla mínima declarada, igual que las once actuales.

### B5.4 🕓 Endpoint de drill-down bajo demanda
**Descripción.** Desagregación de un panel por las `dimensiones` que declara su
métrica, contra Snowflake en vivo — la misma figura que el chat.
**Estado: diferida** (D3). No se descarta ni se planifica todavía; entra cuando
el backend llegue a ese tramo. El contrato ya cubre la superficie que la consume,
así que lo que falta es el servicio, no el diseño.
**Criterio de aceptación.**
- Las dimensiones disponibles salen del catálogo de la métrica, no de una lista
  aparte.
- Con timeout y tope de filas declarados, igual que el chat.

### B5.5 ✅ Auditoría de publicaciones de layout

**Verificado el 2026-09-29 contra `de881e1`** · Tres publicaciones generadas y leídas · dos `publish` y un `rollback`, cada una con `actor_user_id`, `actor_role` y su `diff.summary`. **Y las colecciones vacías del diff salen `[]` desde `de881e1`**; las publicaciones viejas conservan `null`.
**Criterio de aceptación.** Queda registrado quién publicó, cuándo y qué cambió
respecto de la versión anterior. Consultable desde admin.

### B5.6 ⬜ Tests de integración por endpoint de consola
**Criterio de aceptación.** Cada endpoint tiene un test que verifica el envelope,
el `401` sin token y el filtrado por rol.

### B5.7 ⬜ Tests del job de materialización con fixtures de Snowflake
**Criterio de aceptación.**
- El job se prueba sin tocar Snowflake, contra respuestas fijas.
- Se cubre el camino de fallo: una métrica que falla deja `BLOQUEADO` con razón y
  **no aborta el resto del job**.

---

# Frontend

## Fase 0 — Fundamentos

### F0.1 ✅ Estructura de carpetas según §4
**Descripción.** `app/`, `api/`, `tokens/`, `catalog/`, `render/`, `surfaces/`.
Se retiraron `components/`, `features/`, `pages/`, `services/`, `types/`,
`hooks/` y `styles/` del andamio, que §4 reemplaza.
**Criterio de aceptación.** ✅ Cumplido.
- El árbol coincide con §4; `docs/FOLDER_STRUCTURE.md` lo documenta.
- Cada subcarpeta de `render/` lleva un README con su contrato.
- `.cursorrules` quedó reconciliado: su tabla de capas ya no contradice §4.

### F0.2 ✅ React 19 + TypeScript strict
**Descripción.** «Strict sin excepciones» no es solo `strict: true`: el sistema
descansa en uniones discriminadas y hay cuatro flags fuera de `strict` que las
sostienen.
**Criterio de aceptación.** ✅ Cumplido.
- `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`
  e `isolatedModules` activos. Sin el primero, `panels[0]` miente sobre existir.
- Cero `any` en props. `npx tsc -b` en verde.

### F0.3 ✅ TanStack Query
**Criterio de aceptación.** ✅ Cumplido.
- `QueryClientProvider` en `app/providers/AppProviders.tsx`.
- Defaults declarados y justificados: `refetchOnWindowFocus: false` porque una
  consola de datos vive en una pestaña abierta todo el día y revalidar al volver
  al foco pedía el batch entero cada vez que alguien cambiaba de ventana.

### F0.4 ✅ React Router: `/`, `/admin/*`, `/builder/*`
### F0.5 ✅ Auth guard
**Descripción.** Guard de sesión y almacenamiento del token, hechos. Faltaba la
pantalla de login y el POST, que no existían en el contrato.
**Criterio de aceptación.**
- ✅ `AuthGuard` verifica que **haya** token, no qué permite: los permisos los
  aplica el backend.
- ✅ El front **no decodifica el JWT**: recibe todo resuelto en `/config/me`.
- ✅ Pantalla de login que consume el servicio de acceso y redirige al `from`.
- ✅ Un `401` de cualquier endpoint limpia la sesión y vuelve al login.

**Cerrada el 2026-09-08, contra un servicio que no estaba en el plan.** El login
no lo sirve la API de la consola: lo sirve **`AntPack-dev/synapse-api-go`**, un
despliegue aparte. B0.10 pedía que la API de la consola lo expusiera y la
respuesta resultó ser otra — existe, en otro lado.

**Las tres preguntas de integración que F0.5 tenía abiertas las contestó el
código, no una reunión:**

| Pregunta | Respuesta, verificada leyendo el servicio |
|---|---|
| ¿Con qué clave se guarda el token? | La decide el front. Sigue en `synapse.token` |
| ¿El login vive en otro origen? | **Sí**, es otro despliegue — pero su CORS es `Access-Control-Allow-Origin: *`, y con `*` no viajan credenciales, así que el token va por cabecera y `localStorage` alcanza |
| ¿Adónde redirige un `401`? | Se decidió acá: borra la sesión y va a `/login` |

**Dos bases de URL, no una.** Los dos servicios publican bajo `/api/v1`, así que
sin separarlas el front no le puede hablar a los dos. `VITE_AUTH_URL` cae a
`VITE_API_URL` a propósito: si mañana quedan detrás del mismo origen, no hay que
tocar nada.

**El envelope de error del servicio de Go no es el de §4.1, y falla en
silencio.** Ahí `error` es una cadena; en el contrato es un objeto. Pasado por
`api/client.ts` da `code: undefined` y `message: ""` —medido— o sea una pantalla
de error sin una palabra. Por eso hay un `api/auth.ts` que desenvuelve por su
cuenta, y por eso está anotado en `docs/PARA-BACKEND.md`: si adoptan §4.1, ese
archivo se borra.

**El guardia redirigía a una ruta que no existía.** `/login` no estaba en el
router: mandaba a una pantalla en blanco. Es de las cosas que solo se ven cuando
alguien intenta usarlas.

**Y quedaron dos cosas anotadas y NO hechas**, las dos a propósito:

- **`password_updated: false` no bloquea nada, y debería.** Es **F0.13**. Se
  anotó como decisión de producto pendiente y no lo es: el OpenAPI del servicio
  lo declara —«si `user.password_updated` es `false` el front debe mostrar un
  modal bloqueante»—. El servicio entrega el token a propósito; el bloqueo es
  nuestro.
- **El usuario que devuelve el login NO se guarda.** Trae nombre, rol y tenant, y
  es tentador usarlo para pintar el navbar sin esperar a `/config/me`. Sería una
  segunda fuente de verdad que se desincroniza en cuanto alguien cambie de rol.
  Hay una prueba que lo fija.

### ➕ F0.16 ✅ Solicitar acceso
**Descripción.** Sale de
`docs/access-request-registration-frontend-integration.md` del servicio. Con
esto **el flujo de acceso queda consumido entero**: login, token-info, cambio de
contraseña, recuperación y solicitud.

**No crea una cuenta: abre una solicitud que un admin aprueba.** La pantalla lo
dice; prometer «ya podés entrar» dejaría a alguien probando credenciales que no
existen.
**Criterio de aceptación.**
- Los ocho campos del contrato, con el correo normalizado.
- **No manda `tenant_id`** — el documento del servicio lo quitó: «el tenant se
  asigna más adelante, en el panel admin, al aprobar».
- Los dos consentimientos son `required`: el servicio rechaza con 400 si llegan
  en `false`, así que declararlo evita un viaje que ya se sabe cómo termina.
- La solicitud creada que devuelve el 201 **no se pinta**.

**Cerrada el 2026-09-08.** Igual que en F0.15, lo que no sube no se puede
filtrar: `requestAccess` devuelve `void` y descarta la respuesta, que trae id,
tenant y estado.

**`GET /access-requests/tenants` NO se consume, y es correcto.** El documento del
servicio lo dice: «ya no es necesario llamarlo en el modal de registro». Quien
solicita escribe el nombre de su empresa en texto libre. Queda anotado para que
nadie lo vea en la lista de rutas sin usar y lo tome por un olvido.

### ➕ F0.15 ✅ Recuperar contraseña
**Descripción.** Sale de `docs/password-reset-frontend-integration.md` del
servicio de acceso —607 líneas—, que la auditoría del 2026-09-08 encontró sin
tarea. Decidido que va: el servicio ya la soporta y no depende de nadie.

**No es un enlace de reseteo.** `POST /password-reset-requests` crea una
solicitud en la misma cola que los registros, y **un admin tiene que
aprobarla**. La pantalla no puede prometer «revisá tu correo», porque no llega
ningún correo con un enlace.
**Criterio de aceptación.**
- **Registrado y no registrado dan exactamente la misma pantalla.** El servicio
  responde 201 con el mismo `message` en los dos casos y solo agrega `request`
  cuando el correo existe; si la pantalla mostrara esa diferencia, el formulario
  se volvería un verificador de correos.
- El mensaje sale del servicio · §8.
- El `409` —ya hay una solicitud pendiente— se muestra y se puede reintentar.
- El correo se normaliza antes de mandarlo.

**Cerrada el 2026-09-08.** La protección se resuelve **en el cliente y no en la
pantalla**: `requestPasswordReset` devuelve solo el `message` y descarta
`request`. Lo que no llega arriba no se puede filtrar por accidente, ni hoy ni
cuando alguien toque el componente. Verificado por mutación: exponer el
`request` rompe dos pruebas.

**Una prueba estuvo mal escrita y vale anotarlo.** Verificaba que la pantalla no
contuviera la palabra «enlace», y falló con el texto correcto: la pantalla dice
«no se envía un enlace automático», que es justo lo que hay que decir. Se
reescribió para verificar la PROMESA —que no diga «revisá tu correo», «te
enviamos», «recibirás»— y no el vocabulario.

**Y apareció un hueco del proxy.** `password-reset-requests` está fuera del
prefijo `/auth`, así que el proxy de desarrollo devolvía 404 y parecía que el
endpoint no existía. Ahora lista las tres rutas públicas del servicio, una por
una.

### ➕ F0.13 ✅ Modal bloqueante de cambio de contraseña
**Descripción.** El OpenAPI de `synapse-api-go` lo declara en `/auth/login`: «si
`user.password_updated` es `false` el front debe mostrar un modal bloqueante
solicitando cambio de contraseña antes de acceder a la app». El servicio entrega
un token válido igual —a propósito—, así que el bloqueo es del front.

**No está bloqueada por nadie.** `POST /auth/change-password` existe, está en el
spec, y el campo llega en la respuesta del login.
**Criterio de aceptación.**
- Con `password_updated: false` no se llega a la consola, ni escribiendo la URL:
  el bloqueo va donde ya está la decisión de sesión, no en la pantalla de login.
- El cambio consume `POST /auth/change-password`, que devuelve el usuario con
  `password_updated: true`.
- El mensaje sale del servicio · §8. La política de contraseña la valida él
  —`password_policy` está en su repositorio—, así que el front no la reimplementa.

**Cerrada el 2026-09-08.** La decisión que la define es **dónde va el bloqueo**:
en el `AuthGuard` y no en la pantalla de login. En el login sería decorativo —
quien ya tiene token en `localStorage` no vuelve a pasar por ahí, así que
escribir la URL lo esquiva. Por el guardia pasan las tres superficies.

**Y de dónde sale `password_updated`, que era el problema interesante.** El front
**no guarda el usuario** a propósito, así que no lo tenía. Sale de
`GET /auth/token-info`: el servicio lee «los datos del usuario en BD y los claims
del JWT activo», así que después de un cambio dice `true` aunque el token sea el
viejo. Guardarlo en `localStorage` al entrar habría sido más barato y habría
dejado a alguien afuera para siempre si cambiaba la contraseña desde otro lado.

**Mientras se verifica, la superficie no se pinta.** Dejarla pasar «mientras
tanto» convierte el bloqueo en un parpadeo que se puede aprovechar. Verificado
por mutación.

**Un fallo que no es 401 ni cierra la sesión ni deja pasar**: lo dice y ofrece
reintentar. Las dos alternativas serían mentira. El 401 lo sigue manejando el
`queryCache`.

La política de contraseña **no se copió**: el servidor la declara —ocho
caracteres, letra, número, especial, distinta de la actual— y devuelve en `error`
el criterio que falló, en prosa. Dos validaciones se separan el día que cambien
una, y la del front sería la que miente.

### ➕ F0.14 ✅ Generar los tipos del servicio de acceso desde SU OpenAPI
**Descripción.** `api/auth.ts` tiene los tipos **escritos a mano**, leídos de las
estructuras de Go. El servicio publica un OpenAPI de 1.796 líneas —embebido en
el binario, servido en `/docs/openapi.yaml`— así que hay un contrato y no lo
estamos usando.

Es la misma regla que ya sostiene `gen:api` para la consola: «todo lo que viaja
por la red sale de `generated.ts`». Un tipo escrito a mano desde una
implementación es exactamente el fixture escrito de memoria que la Fase 5 nos
enseñó a no hacer — y ya costó una: el spec declaraba lo del modal bloqueante y
nosotros lo anotamos como decisión pendiente.
**Criterio de aceptación.**
- Los tipos de `api/auth.ts` salen de un generador, no de la lectura de structs.
- Hay un chequeo de deriva, como `contract-drift`: si el servicio cambia su spec
  y nadie regenera, la puerta lo dice.
- Queda decidido **de dónde se lee el spec**: una copia versionada acá, como
  `design/`, o un fetch contra el servicio. Lo segundo es más fresco y hace la
  puerta dependiente de la red.

**Cerrada el 2026-09-08 · copia versionada**, en `contracts/synapse-auth.yaml`,
por la misma razón por la que `design/` se mudó al repositorio: un chequeo que
necesita la red no corre en un clone limpio ni en CI, y sale BLOQUEADO en vez de
verificar. La cabecera del archivo dice que no es nuestro, de dónde salió y con
qué sha256.

**`contract-drift` se parametrizó en vez de duplicarse.** Dos comparadores del
mismo tipo derivan; ahora es uno con `--auth` y la salida dice cuál contrato
verificó. La puerta pasó a once chequeos ese día; el conteo vigente sale de `docs/ESTADO.md`.

**El generador encontró algo del spec ajeno.** `ErrorResponse.success` está
declarado como `boolean` OPCIONAL en vez de un literal `false`, así que la unión
**no discrimina** y `body.success !== true` no estrecha nada. El código de Go sí
lo pone siempre; es el spec el que quedó flojo. Se resolvió mirando el status
HTTP, que además es más confiable: un 401 es un 401 aunque el cuerpo venga vacío
o no sea JSON.

Verificado por mutación en los dos sentidos: editar el `.ts` generado a mano, y
cambiar el yaml sin regenerar.

### F0.6 ✅ Generar `src/api/types.ts` desde OpenAPI
**Criterio de aceptación.** ✅ Cumplido con salvedad (D4).
- `src/api/generated.ts` son 2.034 líneas generadas del yaml, y `api/types.ts`
  solo les pone nombre.
- ✅ `npm run gen:api` corre desde el `package.json` (F0.10, cerrada por D4).

### F0.7 ✅ Reutilizar los tokens del v2
**Criterio de aceptación.** ✅ Cumplido.
- Los tokens en `@theme static`, con el espacio de nombres de Tailwind:
  `--color-panel` → `bg-panel`, `--radius-xl` → `rounded-xl`, `--spacing: 4px`
  para que `p-6` sean los 24px de padding de panel.
- **`static` no es opcional.** Sin él Tailwind poda toda variable que ninguna
  utilidad mencione por escrito, y las rampas de familia se arman en runtime.
  Medido: sobrevivían 6 de 43, y el tema oscuro se quedaba sin colores de datos
  mientras el claro los conservaba.
- Las tres tipografías autohospedadas; el switcher de tema es un atributo.

### F0.8 ✅ Sacar mocks y defaults del bundle
**Criterio de aceptación.** ✅ Cumplido por construcción: `synapse-tenants.js`,
`synapse-data.js`, `api/mock/*` y los defaults `ua_mx`/`ceo` nunca entraron.

### ➕ F0.9 ✅ Runner de pruebas
**Descripción.** `tareas-front-back.md` exige en F5.5–F5.9 y en el checklist por
componente «al menos una prueba de render mínimo», y **no tiene una tarea que
configure el runner**. Sin esto la Definition of Done es inejecutable desde la
Fase 1.
**Criterio de aceptación.** ✅ Cumplido el 2026-09-02.
- ✅ `vitest` + `@testing-library/react` + `jsdom` instalados y `npm test` corre.
- ✅ `msw` instalado: los contenedores se prueban con **HTTP mockeado**, no con
  fixtures JS importados — importar un fixture desde una superficie es el
  anti-patrón que §4 declara.
- ✅ `npm test` está en la puerta junto a `lint` y `build`.

**Cómo quedó.** Las pruebas se agrupan en `tests/` —fuera de `src/`— espejando la
estructura del código: `tests/render/grid.test.ts` prueba `src/render/grid.ts`.
Se aparta de `.cursorrules`, que admite «junto al código o en `__tests__/`», y lo
hace por una razón que vale más que la convención: **los handlers de MSW son
datos falsos y no puede existir una ruta de import desde una superficie hasta
ellos.** Es F0.8 sostenida por la estructura en vez de por la revisión.

El entorno por defecto es `node`; el archivo que renderiza pide jsdom con
`// @vitest-environment jsdom` en su primera línea. El servidor de MSW corre con
`onUnhandledRequest: 'error'`: una petición sin handler falla nombrando la URL,
en vez de colgarse hasta el timeout —que se lee igual que un bug de la
implementación.

`npm run verify` encadena la puerta: `typecheck && lint && test && build`.

**Verificado por mutación, no por el verde.** Con `GAP` a 20 en `grid.ts` caen
tres pruebas de la fórmula `96·N − 16`; mandando el bearer sin sesión cae la del
`Authorization`. Es el chequeo que faltó el 2026-08-20: una suite que nunca vio
fallar no demostró nada.

### ➕ F0.10 ✅ Bajar a TypeScript 5.9 para que la generación funcione
**Descripción.** El andamio pinaba `typescript@~6.0.2` y `openapi-typescript@7`
declara peer `^5.x`. Como §4 exige que `api/types.ts` se genere desde OpenAPI, la
cadena de generación manda sobre la versión del compilador (D4).
**Criterio de aceptación.** ✅ Cumplido el 2026-09-01.
- `npm install` corre sin `--legacy-peer-deps`.
- `npm run gen:api` regenera `src/api/generated.ts` desde el `package.json`.
- Se quitó `ignoreDeprecations: "6.0"` del `tsconfig.app.json`, que solo existe
  en TS 6. `tsc -b`, `build` y `lint` siguen en verde con las cuatro flags
  estrictas puestas.

### ➕ F0.11 ✅ Portar la puerta de calidad
**Descripción.** `make verify` de v2 con sus chequeos, adaptados al stack nuevo.
`nuevo-desarrollo.md` no la menciona porque **es de nuestro lado, no del
desarrollador del backend** (D5). No es opcional si se quiere evitar el fallo del
2026-08-20: 184 pruebas verdes sobre una implementación que violaba §3.1 de tres
formas distintas.
**Criterio de aceptación.** ✅ Cumplido el 2026-09-02.
- ✅ `design-lint` reapuntado a Tailwind: las 15 reglas verifican utilidades de
  token en vez de `.module.css`. Un hex literal en JSX o en CSS falla.
- ✅ `spec-anclas` porta sus anclas: cada regla numérica de `design.md` con su
  cita **textual**, el marcador `§ANCLA:<id>` en el archivo que la implementa, y
  su aserción. **La aserción se escribe desde la cita, no mirando el código.**
- ✅ `contract-drift`: `src/api/generated.ts` == `contracts/synapse-api.yaml`.
- ✅ `token-drift`: `src/tokens/tokens.css` == variables del `.pen`.
- ✅ Cada chequeo sale con 0 conforme, 1 violación, 2 bloqueado — y un bloqueado
  se cuenta aparte, en `tools/gate.py`, que es `npm run verify`.

**Lo que cambió al reapuntar `design-lint` a Tailwind.** En v2 el color y la
tipografía se verificaban sobre `.module.css`. Acá el estilo vive en el atributo
`class`, así que cada detector mira utilidades — y aparece **una fuga que en v2
no podía existir**: la paleta de fábrica de Tailwind. `bg-slate-800` no es un hex
y se salta el sistema de tokens igual de bien; no invierte con el tema y
`token-drift` no la ve. L1 la persigue con el mismo rigor que a un hex, y por lo
mismo `bg-amber-400` le dio dientes a L3. Los altos arbitrarios se buscan en sus
dos escrituras: `height: 348` y `h-[348px]`.

**Dos chequeos salen BLOQUEADOS, y es el resultado correcto.**

- `design-lint` corre **13 de 15** reglas: L2 y L6 tienen el ámbito vacío
  —`render/bodies/` y `render/plots/` no existen hasta F1.13— y una regla que no
  miró un solo archivo no informa nada. Declararlas conformes sería exactamente
  la mentira que la convención del 2 existe para impedir.
- `spec-anclas` ancla **6 de 9** reglas. Las otras tres están citadas y sin
  implementar: RESP-2 y RESP-3 las cierra F1.30, TIPO-1 la cierra F1.13c. Se
  declaran igual, porque una regla que no está escrita en ningún lado no la
  reclama nadie.

**`contract-drift` deja de estar bloqueado, y esto es lo que lo desbloquea.** En
v2 su mitad de API sale con 2 desde el 2026-09-01 porque el yaml se mudó a este
repositorio. Acá la fuente y el generado viven juntos, así que la comparación por
fin corre: 2.034 líneas idénticas.

**`token-drift` compara por variable y no byte a byte.** El de v2 regenera en
memoria con `gen-tokens.py` y compara el archivo entero; ese generador todavía no
está reapuntado —es F0.12—, así que este verifica que cada una de las 57
variables del `.pen` esté en `tokens.css` con su valor en los dos temas, con la
traducción de espacio de nombres de Tailwind declarada y verificada. Cobertura
menor que el byte a byte, mayor que nada. Hallazgo: **el port a mano de F0.7 no
tiene deriva** — las 57 coinciden.

**Verificado por mutación, los cuatro.** Un dígito en `--color-panel` y un
`--radius-xl` a 12px los detecta `token-drift`; una línea editada en
`generated.ts`, `contract-drift`; un marcador `§ANCLA` borrado y una cita
alterada, `spec-anclas`; y una sonda con hex, `bg-slate-800`, `amber`,
`h-[348px]`, SQL, import de valor desde `api/` y label inline produjo 9 hallazgos
en 7 reglas —sin marcar el `import type`, que es la regla y no la excepción.

### ➕ F0.12 ✅ Reapuntar el generador de tokens
**Descripción.** `tokens.css` y `tokens.ts` están **portados a mano**. En v2 los
emite `tools/gen-tokens.py` leyendo el `.pen`, y `token-drift` verifica que no se
separen. Hasta reapuntarlo, un cambio de token en el diseño no llega solo.
**Criterio de aceptación.**
- El generador emite el archivo con `@theme static` y el espacio de nombres de
  Tailwind, incluidos los cuatro tokens de marca y las 22 rampas de familia.
- Correrlo dos veces produce el mismo archivo byte a byte.
- Las cabeceras «PORTADO A MANO · PENDIENTE» desaparecen.

**Cerrada el 2026-09-03.** Lo que la desbloqueó no fue escribir el script sino
el traslado de `design/`: el generador de v2 ya leía `RAIZ / "design" /
"Synapse_v2.pen"`, o sea exactamente la ruta que ahora existe.

**La decisión que había que tomar era dónde queda la prosa.** `tokens.css` son
195 líneas y casi la mitad es texto: por qué `@theme static` no es opcional, de
dónde sale cada tamaño de la escala, y **los marcadores `§ANCLA:RADIO-1` y
`§ANCLA:TIPO-2`, que `spec-anclas` lee del archivo**. Un generador que escribe
el archivo entero se los lleva puestos y la puerta se pone roja en dos anclas.

Las salidas eran tres —mover la prosa al generador, partir el archivo en uno
generado y uno a mano, o respetar bloques marcados— y se eligió la primera,
porque **el generador ya es el lugar donde vive el porqué de cada traducción**.
El comentario que explica que el tracking va en `em` describe una decisión de
ese script. Las otras dos dejan dos archivos que hay que mantener
sincronizados, que es el problema que el generador viene a resolver.

**Hallazgo: el port a mano no tenía deriva, y ahora está probado de verdad.**
El generador reproduce el `tokens.css` escrito a mano **byte a byte**, salvo la
cabecera —que cambió a propósito— y el comentario del tracking del KPI, que se
movió a su sección al agrupar por prefijo.

**`token-drift` cambió de método, y era lo que su propia nota anunciaba.** Pasó
de comparar variable por variable a regenerar en memoria y comparar el texto
entero. La diferencia no es teórica: el chequeo viejo **no veía un comentario
cambiado** —y ahí viven las dos anclas—, no veía el orden, y repetía la
traducción de espacios de nombres en dos lugares, así que un error en la
traducción entraba igual porque los dos se equivocaban igual. Verificado por
mutación: borrar `§ANCLA:TIPO-2` del CSS ahora se detecta y antes no.

El generador además se planta en dos casos en vez de emitir algo silencioso: si
la escala de espaciado deja de ser 4·N no la colapsa a `--spacing`, y si el
`.pen` trae un token que no encaja en ninguna sección no lo tira, avisa. Los dos
verificados contra un `.pen` roto a propósito.

---

## Fase 1 — Consola y el traslado de `render/`

**Esto es el grueso del trabajo.** `render/` en v2 son **~2.800 líneas de código
de producción en 39 archivos**, más ~1.150 de pruebas. Ya es conforme a las
reglas duras y pasó por el loop de revisión. F1.13 de `tareas-front-back.md` lo
resume en una línea —«copiar/adaptar»— y no lo es: hay que traducir CSS Modules a
Tailwind, renombrar al inglés y resolver dos cosas que en v2 quedaron mal. Va
desglosado en diez tareas.

### Capa API — hecha

#### F1.1 ✅ `api/client.ts` — el cliente HTTP
**Descripción.** fetch + bearer + envelope, sin un solo import de mock.
**Criterio de aceptación.** ✅ El envelope se desenvuelve en un único lugar: un hook que reciba `{ success, data }` es un hook que dejó entrar la forma del transporte a la capa de datos.

#### F1.2 ✅ `api/hooks.ts` — los hooks de datos
**Descripción.** `useMe`, `useCatalog`, `useBlocks`, `useTab`, `usePanelsBatch`, `useSaveTheme`.
**Criterio de aceptación.** ✅ La clave del batch se ancla al `tabId`, no al arreglo de `panelIds`: dos renders de la misma pestaña producen arreglos distintos con el mismo contenido, y eso rompía la cache sin que se notara.

#### F1.3 ✅ `catalog/blocks.ts` — validadores de composición
**Descripción.** `acceptsShape`, `spanInRange`, `invalidReason` sobre la tabla de `/config/blocks`.
**Criterio de aceptación.** ✅ `invalidReason` devuelve la razón y no un booleano, porque el builder tiene que **mostrarla**: «un bloque gauge no sabe dibujar la forma serieTemporal» ayuda, «composición inválida» no.

#### F1.4 ✅ `catalog/types.ts` — tipos del catálogo
**Descripción.** Re-exporta desde `api/` para que `render/` pueda importar `Family` o `PanelType` sin cruzar la frontera de §4.
**Criterio de aceptación.** ✅ `catalog/` no tiene tablas de datos: el catálogo llega por API.

#### F1.14 ✅ `render/grid.ts` — la grilla
**Descripción.** `span()`, `gridStyle()`, `panelStyle()`, con `px = 96·N − 16`.
**Criterio de aceptación.** ✅ `gridAutoRows` en 80px es lo que hace que la fórmula se cumpla de verdad: sin eso, `grid-row: span N` reparte altura automática y `96·N − 16` queda escrito pero no aplicado.

#### F1.27 ✅ `metricsById` — resolver `metricId` → métrica
**Criterio de aceptación.** ✅ El catálogo llega ya filtrado por rol; el front no filtra nada.

---

### El traslado

#### F1.13a ✅ Portar las primitivas de gráfico (`plots/core/`)
**Descripción.** Siete archivos, ~635 líneas: `scale.ts` (escalas y `techo`),
`useSize.ts` (`ResizeObserver`), `Axis.tsx`, `Grid.tsx`, `Series.tsx`,
`Band.tsx`, `Arco.tsx`. Es la base de los seis plots y no depende de nada más.
**Criterio de aceptación.**
- Ningún archivo de `core/` importa de `api/` ni conoce una métrica.
- `useSize` mide con `ResizeObserver` — es el único estado local permitido en
  `render/`, porque es de layout y no de negocio.
- Las pruebas de `scale` y `useSize` viajan con ellos y pasan.
- La reserva del eje sale del **rótulo más largo**, no del rótulo del máximo: con
  techo 1M el máximo es «1M» de dos caracteres y el tick «500K» son cuatro, y
  calculado sobre el máximo se salía por la izquierda y se leía «00K».

#### F1.13b ✅ Portar `format.ts` e **inyectar el locale**
**Verificado el 2026-09-26 contra el servicio corriendo** · commit `8633b10`. **Visto en pantalla**: la consola formatea con el locale del tenant — `20.953` con punto de miles y `-25,6 %` con coma decimal, que es `es-CO`. Antes de hoy salía `20,953` con la constante `'es-MX'`.

**El criterio, punto por punto:**

- *«ningún plot importa el formateador»* · ya se cumplía, y **ahora hay una regla que lo hace cumplible**: `locale` en `design-lint`, verificada por mutación en sus dos formas —un `Intl` fuera de `format.ts` y un locale literal suelto—.
- *«el locale, la moneda y la zona salen del tenant vía `/config/me`»* · el contrato no tenía dónde ponerlos y ahora los declara. **`locale` se consume; `moneda` y `zonaHoraria` no, y queda escrito por qué**: la unidad de una cifra sale de la MÉTRICA —`metric.unidad` dice `USD`— y ningún cálculo del front cruza un borde de día. Se declaran porque el cable los trae, no para que alguien los use sin razón.
- *«la abreviatura no tiene escalón para mil millones»* · ya estaba: `2.5e9` sale `2,500M`.
- *«se conservan sus pruebas»* · 934 en verde.

**Lo que apareció y no era del enunciado.** `format.ts` declaraba desde siempre que **nadie fuera de él arma un `Intl`**, y había **tres** pantallas de admin rompiéndolo, cada una con su `'es-MX'` fijo y su comentario prometiendo cambiar una línea. El problema no era el valor: era que el locale se decidía en cuatro lugares, así que arreglar uno no arreglaba los otros. Se agregaron `calendar` y `clock` al formateador y las tres reciben `format` por props.

**Y una decisión que conviene que esté escrita**: en admin el locale es el de QUIEN MIRA, no el de cada fila. A1 lista clientes y A3 los cruza, cada uno con su locale; formatear cada fila con el suyo daría una columna con tres formatos distintos justo donde la pregunta es comparar. En la consola es al revés y por la misma razón: ahí todo es de un tenant.

**Lo que se vio y lo que no.** Se abrieron dos de las tres composiciones de la barra —la de escritorio a 1710 y la angosta a 700, donde se comprobó que la línea de contexto está oculta de verdad—. La del medio, entre 768 y 1279, no se pudo ver: la ventana del navegador no se deja llevar a ese ancho.

**Y el fixture compartido volvió a `es-MX`, a contramano de lo medido.** El valor real es `es-CO` —default de la migración, dato a cargar— y al conectar el locale se propagó a ocho aserciones que no son de locale. Un fixture compartido no es el lugar de un dato de un día; lo medido vive en `locale.test.tsx`, que usa `es-CO` explícito porque con `es-MX` la prueba pasaría con el campo desconectado.

**EL CANDADO VENCIÓ.** Decía «`Contexto` no trae locale, moneda ni zona» y los tres llegan: `tenant.locale`, `tenant.currency` y `tenant.timezone` en `/config/me`.

**No se tomó al descubrirlo**, y queda dicho: un bloqueo escrito no se razona por encima. Lo que falta es trabajo nuestro y no espera a nadie — hoy `FeedHealth`, `UserList`, `ConsoleContainer` y `TenantList` fijan `es-MX` a mano, cada uno con un comentario que dice «el día que el campo exista se cambia una línea».

**El valor que llega hoy es el default de la migración, no el del cliente**: «Under Armour México» trae `es-CO`, `COP` y `America/Bogota`. Se carga con `PUT /admin/tenants/{tenantId}`, que también llegó. Es dato a cargar, no un impedimento para inyectarlo.

**Y la zona horaria que entra por acá es la del TENANT**, que es la del corte del día del negocio. La presentación —«HACE 3 H», el agrupado del riel— sigue saliendo del huso del navegador. Confundirlas es el bug.

**Descripción.** El formateo de cifras, en un solo lugar. En v2 `LOCALE` es la
constante `'es-MX'` y **cinco de los seis plots importan el formateador directo**
en vez de recibirlo, así que la prop existe y está muerta.
**Criterio de aceptación.**
- `PlotProps.format` se usa: **ningún plot importa el formateador**. Verificable
  con un grep, y candidato a regla de `design-lint`.
- El locale, la moneda y la zona horaria salen del tenant vía `/config/me` y
  bajan por props.
- La abreviatura no tiene escalón para mil millones: «B» es *billion* en inglés y
  un billón en español son 10¹², así que 2.5e9 sale «2,500M» — largo pero sin
  ambigüedad.
- Se conservan sus pruebas.

#### F1.13c ✅ Portar los primitivos `Label` y `Value`
**Descripción.** `Label` es por donde pasa **todo** texto de meta: mono 10px,
`0.12em`, mayúsculas, `text-dim`. Existe porque §1.3 no admite un número desnudo.
**Criterio de aceptación.**
- Traducidos a utilidades de Tailwind sobre tokens; cero hex, cero valor
  arbitrario que no salga de un token.
- `Value` aplica `cifra` (tabular-nums) y **recibe el texto ya formateado**: no
  formatea, porque el locale es del tenant.
- El andamio de `Console.tsx` que hoy usa `text-[10px] tracking-[0.12em]` a mano
  pasa a usar `Label`.

#### F1.13d ✅ Portar los seis estados
**Descripción.** `EstadoCargando`, `EstadoVacio`, `EstadoDegradado`,
`EstadoBloqueado`, `EstadoSinPermiso`, `EstadoError` → `LoadingState`,
`EmptyState`, `DegradedState`, `BlockedState`, `NoAccessState`, `ErrorState`.
**Criterio de aceptación.**
- **Reemplazan el cuerpo, nunca el shell.** Título, BASE y procedencia siguen
  visibles mientras el panel carga, falla o está bloqueado.
- `LoadingState` es un esqueleto **con la forma del tipo**, no un spinner
  genérico.
- `EmptyState` es invitación a actuar con `vacioRazon`, no un error.
- `DegradedState` **muestra la cifra**: lo que cambia es el badge del shell.
- `BlockedState` no muestra número ni aproximación.
- Cada uno tiene una prueba que verifica que la anatomía del shell sigue ahí.

#### F1.13e ✅ Portar el shell del panel (`Panel` + `PanelShell` + `Provenance`)
**Descripción.** ~275 líneas. La anatomía obligatoria de §9: bullet de familia,
título, BASE, procedencia con frescura relativa, dirección semántica, CTA y
chevron. Cubre F1.15 y F1.16.
**Criterio de aceptación.**
- El shell recibe el cuerpo por `children` y **no lo conoce**: un estado no puede
  borrar la cabecera porque no la tiene.
- BASE = denominador + ventana. Con `BLOQUEADO` sale de `Metric.base` (D6).
- La frescura relativa recibe el `ahora` por props, para que no dependa del reloj
  de quien renderiza y las pruebas sean deterministas.
- La dirección semántica se pinta **solo si la métrica la declara**: ponerla
  donde no aplica la vacía de sentido.
- El título es `h2`: el único nivel por encima es el `h1` de la pregunta de la
  pestaña, y saltarse un nivel rompe la navegación por encabezados, que es como
  se recorre una pantalla de doce paneles con un lector.
- Shell compacto en `colSpan ≤ 3` (F1.16): misma información, otro reparto — la
  meta baja a dos líneas. Es una rama documentada, no un flag suelto.

**Cerradas el 2026-09-02 · F1.13b, c, d, e, i.** El panel ya es real de punta a
punta: `Console.tsx` monta `<Panel>` con el payload que devuelve el backend y los
siete estados salen de ahí. Lo que falta para que pinte una cifra es el registro
(F1.13h) y los cuerpos (F1.13g), que se montan en el slot que el shell ya expone.

**F1.13b queda en ⚠️ y no en ✅, por el contrato.** La inyección está hecha
—`createFormat(locale)` y `PlotProps.format`, ningún componente importa el
formateador— pero el criterio pide que «el locale, la moneda y la zona horaria
salgan del tenant vía `/config/me`», y **`Contexto` no declara esos tres campos**.
Hoy se deciden en una sola línea de `Console.tsx`, marcada como supuesto. Cuando
el yaml los tenga se cambia esa línea y nada más. Va con las preguntas de B0.9.

**Dos huecos de v2 que el contrato de acá cierra.** `Metrica.base` es requerido,
así que `resolveGovernance` cae al catálogo y **un panel bloqueado declara su
denominador** —en v2 mostraba la ventana sin la base—. Y `Value` ya no formatea:
recibe el texto hecho, que es lo que sacó `es-MX` de adentro de `render/`.

**Cobertura ganada en la puerta.** `render/Panel/` y `render/states/` le
devolvieron ámbito a L5 y L15 del lint, y `Label` cerró el ancla TIPO-1:
`spec-anclas` pasó de 6 a 7 de 9. Los dos chequeos siguen BLOQUEADOS por L2, L6
—que esperan a `render/plots/` y `render/bodies/`— y por RESP-2 y RESP-3.

#### F1.13f ✅ Portar los seis plots
**Descripción.** `PlotBars`, `PlotSeries`, `PlotGauge`, `PlotForecast`,
`PlotComposition`, `PlotDistribution`. Cubre F1.21.
**Criterio de aceptación.**
- Todos aceptan `PlotProps<F>`. En v2 **solo uno lo hacía** y los otros cinco
  tenían firma propia, lo que hacía imposible indexarlos en un registro.
- El color llega como `family` y el plot **no sabe cuál le tocó**: usa
  `var(--color-fam-${family}-N)`.
- Responsivos dentro de su panel; no asumen un ancho.
- Un plot vacío no rompe: cero series o cero puntos rinden sin excepción.

#### F1.13g ✅ Portar los doce cuerpos que existen en v2
**Descripción.** `KpiBody`, `SeriesBody`, `BarsBody`, `TableBody`, `ProseBody`,
`RecoBody`, `GaugeBody`, `ForecastBody`, `ListBody`, `CompositionBody`,
`DistributionBody`, `BlockedBody`. Cubre F1.18.

**Doce de quince, y la diferencia no es un recorte.** El enum `TipoPanel` del
contrato tiene **quince** valores y §7 de `nuevo-desarrollo.md` exige
implementarlos todos. Doce existen en `synapse_v2/src/render/bodies/` y se
portan acá; los tres que faltan —**`comparison`, `matrix` y `graph`**— nunca se
escribieron en v2 porque son las formas v1.1 de §8.12, que ningún backend emite
todavía. Se construyen de cero en **F4.17, F4.18 y F4.19**, y F4.20 los registra.

La consecuencia para F1.13h: hasta que estén los quince, el registro es un
`Partial<Record<PanelType, …>>` y un tipo sin cuerpo **tiene que dar error
explícito**, no un fallback silencioso. Recién con los tres de Fase 4 pasa a
`Record` completo y agregar un tipo al enumerado sin su cuerpo deja de compilar.
**Criterio de aceptación.**
- Cada uno acepta `BodyProps<F, P>` con **sus params concretos**, nunca
  `Record<string, unknown>`.
- Función pura: sin `useState` de negocio, sin `useEffect` de fetch, sin contexto
  global.
- `GaugeBody` sin `maximo` en `opciones` no dibuja el arco y lo dice; no inventa
  una escala.
- `ProseBody` y `RecoBody` reciben pilares como objetos y **no parsean texto**.
- Cada cuerpo tiene una prueba de render con props mínimas válidas del contrato.

#### F1.13h ✅ Escribir el registro **sin `any`** (F1.17, F1.22)
**Descripción.** `registry.ts` mapea `PanelType` → componente con `React.lazy`,
para que una pestaña no descargue los cuerpos que no usa, y aplica `memo` en un
solo lugar. §14.4 del documento lo ejemplifica con `ComponentType<any>` y §4
regla 2 lo prohíbe: *«el v2 lo toleró en el registro de cuerpos; el front nuevo
no»*. Las dos cosas no pueden ser ciertas a la vez.
**Descripción del problema.** El registro no puede probar qué forma le toca a
cada cuerpo —eso depende de que el `tipo` del panel case con la `forma` de la
métrica, que es un invariante del catálogo y no del tipo. Pero un
`ComponentType<any>` entero significa que agregar una prop obligatoria a
`BodyProps` compila igual y llega `undefined` en runtime. Ya pasó en v2.
**Criterio de aceptación.**
- La estrechez vive en **un** adaptador tipado y documentado, no repartida en
  doce archivos ni tapada con `any`.
- Agregar una prop obligatoria a `BodyProps` **no compila** hasta actualizar los
  sitios que montan un cuerpo.
- Un `tipo` sin cuerpo registrado produce **error explícito**, no un fallback
  silencioso (F1.22, y §1 principio 6).
- `preloadBodies(tipos)` trae los chunks en paralelo con `panels:batch`, en
  cuanto `/config/tabs` dice qué tipos tiene la pestaña. Sin eso el `lazy` recién
  pide el chunk cuando ya llegó el dato, y el panel parpadea por una descarga que
  se podía haber hecho mientras tanto.
- Una prueba resuelve cada cargador y verifica que lo que sale es un `memo`.

**Avance del 2026-09-02 · F1.13a y F1.13h cerradas, F1.13g en ⚠️.**

`plots/core/` completo: `scale.ts`, `useSize.ts`, `axisGeometry.ts`, `Axis.tsx`,
`Grid.tsx`, `Series.tsx`, `seriesColor.ts`, `Band.tsx`, `Arc.tsx`, `arcPath.ts`.
Se partió en más archivos que en v2 porque un módulo que exporta componentes y
funciones rompe el fast refresh de Vite, y `.cursorrules` ya pedía un componente
por archivo.

**El registro no tiene un solo `any`.** §14.4 lo ejemplifica con
`ComponentType<any>` y §4 regla 2 lo prohíbe; gana la regla. La estrechez vive en
`adapt()`: una línea con su razón escrita. `value` se ancha a la unión `Value`
—no a `any`— y `params` a `unknown`, **y el resto de las props conserva su
tipo**, que es lo que hace que agregar una prop obligatoria a `BodyProps` rompa
la compilación en el sitio que monta el cuerpo. En v2 un `ComponentType<any>`
entero dejó pasar tres sitios reales al agregar `metrica`.

**Tres cuerpos de doce**: `KpiBody`, `ProseBody`, `BlockedBody` — los que no
dependen de un plot. Faltan nueve, y con ellos F1.13f.

**Bug encontrado al probar la inyección del locale.** `formatearCifra` de v2
escribía la abreviatura con `String(Number(...))`, así que **la cifra abreviada
siempre salía con punto decimal** mientras la entera pasaba por `Intl`. Con el
locale fijo en `es-MX` las dos coincidían y el defecto era invisible; con
`createFormat('de-DE')` aparece en el primer render. Corregido, y la
comprobación de exactitud ahora se hace sobre el número y no sobre el texto
—`Number('4,28')` es `NaN` en cuanto el locale usa coma, así que con la
comparación anterior no se habría abreviado nada nunca.

**`design-lint` pasó a verde con las 15 reglas.** `render/bodies/` le devolvió
ámbito a L6, que era la última sin cobertura. La puerta queda con un solo
bloqueado: `spec-anclas`, por RESP-2 y RESP-3, que espera a F1.30.

**F1.13 CERRADA · 2026-09-02.** Las diez partes, a–j. `render/` es el motor
completo: primitivas de gráfico, formateo con locale inyectado, los primitivos,
los siete estados, el shell, los seis plots, los doce cuerpos, el registro y la
medición del presupuesto.

**Ningún plot importa el formateador, y ahora lo verifica el compilador.**
`PlotProps.format` pasó de opcional a **obligatorio**: en v2 era opcional y cada
plot caía a `formatearCifra`, que traía consigo el `es-MX` de módulo — la prop
existía y estaba muerta. Exigirla convierte «ningún plot importa el formateador»
de grep en error de compilación.

**El code splitting funciona, verificado en el build**: doce chunks de cuerpo
—de 0,26 kB a 2,4 kB— más los compartidos. Una pestaña que usa cinco tipos no
descarga los otros siete.

**Una duplicación que v2 tenía y acá no.** `<Arc>` y `<PlotComposition>` repartían
tramos con la misma suma prefija escrita dos veces, las dos con un acumulador que
se reasignaba durante el render. Salió a `plots/core/stack.ts`: es aritmética, no
render, se prueba sin montar un SVG, y las dos formas de apilar ya no pueden
separarse.

**`budget.ts` agrega el flag que v2 no tenía.** El criterio pide que no se active
en producción salvo bajo bandera: `import.meta.env.DEV || VITE_BUDGET === '1'`.
Medir cuesta poco pero no cuesta nada, y las entradas de User Timing se acumulan
en una consola que vive abierta todo el día.

**Lo que queda de F1.13 es lo que el backend todavía no manda**: `comparison`,
`matrix` y `graph`, que son las formas v1.1 de §8.12 y las cierran F4.17–F4.19.
`MISSING_TYPES` los declara y una prueba verifica que construidos + faltantes
sean exactamente los quince del contrato.

#### F1.13i ✅ Portar `state.ts` — la derivación del estado visual
**Descripción.** `estadoVisual`, `resolverGobierno`, `tieneValor`. Vive en
`render/` y no en `api/` porque el predicado lo necesita quien **lee** el
payload, no quien lo declara — y `render/` no puede importar valores de `api/`.
**Criterio de aceptación.**
- `VACIO` se deriva del valor y cae en el mismo `switch` que los estados que sí
  vienen del backend.
- `DEGRADADO` cae con `DISPONIBLE` al elegir cuerpo: sí muestra cifra, y la
  diferencia la pinta el shell como badge.
- **Nada más se deriva.** Degradación, permisos y filtrado son del backend.

#### F1.13j ✅ Portar `budget.ts` — el presupuesto de render
**Descripción.** La medición de cuánto tarda una pestaña en componer y pintar.
Es lo que convierte «la consola va lenta» en un número.
**Criterio de aceptación.**
- Mide desde que llega la config de la pestaña hasta el commit y hasta el
  pintado.
- No se activa en producción salvo bajo un flag.

---

### Superficie de consola

#### F1.5 ✅ `surfaces/console/Console.tsx` — orquestación
**Descripción.** Cadena `/config/me` → `/config/tabs/{id}` → `panels:batch`,
cableada. Falta reemplazar el andamio por paneles reales.
**Criterio de aceptación.**
- ✅ Ningún panel, métrica ni posición aparece literal en el archivo.
- ✅ La primera pestaña y el primer período salen del backend (F1.10).
- ⬜ El componente queda por debajo de 300 líneas: si crece, se parte en
  contenedor y presentacional. En v2 `Consola.tsx` llegó a 671 y ahí se le
  metieron ramas `if (metricId === 'mmm_canales')`, que es el anti-patrón
  que §4 nombra.

#### F1.6 ✅ `ConsoleContainer` — separar hooks de render
#### F1.7 ✅ `Topbar` — tenant, selector de período, tema
#### F1.8 ✅ `Tabs` — pestañas desde `ctx.tabs`
**Criterio de aceptación.**
- El selector de período agrupa por `grano` y respeta el `granoMinimo` de las
  métricas de la pestaña: ofrecer un día a una métrica mensual es ofrecer un
  error.
- Con `alcance: plataforma` el topbar muestra el selector de tenant y declara que
  el acceso queda auditado; con `usuario`, el nombre del tenant.

#### F1.9 ✅ `PanelInGrid` — el puente
**Descripción.** Recibe `panel` + `metric` + `payload` y decide: shell siempre,
y adentro el estado o el cuerpo. Reemplaza el andamio marcado
`data-pendiente="F1.9"`.
**Criterio de aceptación.**
- Sin payload todavía → shell con esqueleto. **El estado de carga no borra la
  anatomía.**
- El `Suspense` del chunk usa el **mismo** esqueleto que el estado de carga: un
  chunk en vuelo y un dato en vuelo son indistinguibles para quien mira.
- Emite `onDrill`, `onChat`, `onRetry` hacia arriba. **El cuerpo no navega ni
  abre modales por su cuenta.**

**La superficie de consola, cerrada el 2026-09-02 · F1.5–F1.9, F1.12, F1.26.**

`ConsoleContainer` tiene los hooks; `Console` no tiene ninguno y recibe todo por
props, así que se puede montar con datos fijos en el builder y en la vista previa
por rol sin tocar la red. Ese era el punto de separarlos.

**El `Suspense` del chunk usa el MISMO esqueleto que el estado de carga.** Lo
había puesto en `null` con el argumento de que la precarga lo hace innecesario;
el criterio de F1.9 dice lo contrario y tiene razón: para quien mira, un chunk en
vuelo y un dato en vuelo son indistinguibles, y un panel vacío durante la
descarga se ve roto por una diferencia que es interna.

**El selector de período deshabilita lo que la pestaña no puede contestar.** Se
toma el grano más grueso que exige alguna de sus métricas —el panel más
restrictivo manda—, y el control deshabilitado **declara la razón**: uno sin
explicación es peor que uno ausente, porque no se sabe si es permiso, error o
límite del dato. La lógica vive en `periodGrain.ts`, fuera del componente, y se
prueba sin montar nada.

**Un fallo del batch NO tira la pantalla.** Contexto y catálogo son la pantalla;
el batch son los datos de cada panel. Si falla el batch, los shells siguen en pie
con su título, su BASE y su procedencia, y cada uno muestra su estado de error
con reintento por panel. Verificado contra MSW.

**Falso positivo corregido en `design-lint`.** L5 marcaba `ConsoleContainer` por
importar de `render/bodies/`, cuando lo único que importa es `preloadBodies`, que
dispara la descarga del chunk y no puede renderizar nada. El detector de v2
buscaba cualquier import de esa carpeta; ahora busca a quien MONTA un cuerpo
—`bodyFor()` o un `*Body`—, que es lo que la regla quiere decir. Verificado por
mutación: una sonda que monta `KpiBody` sin shell sigue cayendo.

#### F1.11 ✅ Cambiar de período no re-pide el layout
**Criterio de aceptación.** ✅ Cumplido: la clave de `useTab` no lleva el
período, así que es estructural y no una disciplina.

#### F1.12 ✅ Persistir el tema
**Criterio de aceptación.**
- ✅ `api.savePreferences` y `useSaveTheme` escritos.
- ⬜ Control de tema en el topbar; el valor inicial llega en `/config/me` y lo
  aplica la superficie.
- El switcher visual **no pasa por la API**: es un atributo en la raíz, y las
  custom properties hacen el resto. Cero recálculo, cero re-render.

#### F1.19 ✅ Estados en la superficie · cubierto por F1.13d
#### F1.20 ✅ Primitivos · cubierto por F1.13c
#### F1.23 ✅ `memo` en cuerpos y plots · cubierto por F1.13h
#### F1.24 ✅ Cero hex literal
**Criterio de aceptación.** Verificado por `design-lint` (F0.11), no por
revisión manual.

#### F1.25 ✅ Conectar a la API real
**Verificado el 2026-09-26 contra el servicio corriendo** · commit `8633b10`. **EL CANDADO VENCIÓ, y hace rato.** Decía «depende de B1.16 y B1.20», que son las dos tareas de **semilla de demo** — datos de ejemplo y que sean estables. Ninguna hace falta para conectar: la consola corre contra el servicio con datos reales de Snowflake.

Los tres bullets, comprobados:

- *«carga contra el backend real vía `VITE_API_URL`»* · lo leen `client.ts`, `chat.ts` y `admin.ts`, y la consola se abrió contra `:4010` todo el día.
- *«cero fixtures en el bundle»* · `mocks-fuera` en la puerta, y buscado sobre `dist/assets/*.js`: ni `prueba@uamx`, ni `kpiMetric`, ni el tenant del fixture.
- *«un `401` limpia la sesión; un `500` muestra el estado de error»* · `AuthGuard` y `SurfaceMessage`.

**B1.16 y B1.20 siguen abiertas** y está bien: son para poder escribir pruebas de integración contra HTTP con datos estables, que es otra cosa.

**Descripción.** Apuntar el front al backend y sacar cualquier respuesta simulada
del camino, aunque el backend devuelva una sola pestaña.
**Criterio de aceptación.**
- La consola carga contra el backend real vía `VITE_API_URL`.
- Cero fixtures en el bundle de producción, verificado sobre el output del build.
- Un `401` limpia la sesión; un `500` muestra el estado de error de la superficie
  sin dejar pantalla en blanco.

#### F1.26 ✅ Carga y error a nivel de superficie, no en los cuerpos
**Descripción.** La superficie decide qué se muestra mientras el contexto o el
catálogo vuelan, y qué se muestra si fallan. Un cuerpo nunca maneja eso.
**Criterio de aceptación.**
- Ningún componente de `render/` lee `isLoading` ni `isError`: recibe un
  `Payload` y nada más.
- Si falla `/config/me` o `/config/catalog` la pantalla lo dice; si falla solo el
  batch, los shells siguen visibles con su estado de error por panel.

---

### Tareas nuevas de Fase 1

#### ➕ F1.28 ✅ Traducir los CSS Modules de v2 a Tailwind
**Descripción.** v2 tiene ~10 `.module.css`. El stack nuevo es Tailwind y
`.cursorrules` prohíbe CSS Modules salvo excepción justificada. La traducción es
mecánica pero no trivial: hay medidas que **no** deben volverse valores
arbitrarios sino tokens.
**Criterio de aceptación.**
- Cero `.module.css` en `render/`, salvo excepción escrita y justificada.
- Cero hex literal y cero valor arbitrario `[...]` que corresponda a un token
  existente. `text-[10px]` de un `Label` es un token que falta, no una utilidad.
- Las medidas del sistema —label 10, celda 12, cuerpo 13— entran como tokens de
  tipografía en `@theme`, no como arbitrarios repetidos.

**Cerrada el 2026-09-03.** No había un solo `.module.css`: el traslado de la
Fase 1 los tradujo sobre la marcha, así que la mitad mecánica ya estaba hecha.
Lo que quedaba eran **29 medidas sin declarar** —23 arbitrarios y 6 utilidades de
la escala de fábrica de Tailwind, que el criterio no nombraba y son la misma
fuga: `leading-relaxed` son 1.625 y el `.pen` usa 1.5—, hoy **16 tokens** en
`@theme static`.

**Hacer esto obligaba a decidir dónde vive la escala tipográfica**, porque
`token-drift` compara en las dos direcciones y de tipografía el `.pen` declaraba
solo las tres familias: el primer token nuevo ponía la puerta en rojo. Se
resolvió por donde manda la cadena de autoridad —el `.pen` es la fuente,
`tokens.css` la refleja—, y las 16 variables se agregaron ahí.

Cuatro divergencias, ninguna resuelta en silencio, todas en
`docs/F1.28-escala-tipografica.md`: el tracking del KPI no salía de ninguna
fuente y ahora sale del `.pen`; los tres títulos de display no llevaban el
-0.02em que §2.3 les declara; las alturas de línea eran las de Tailwind y no las
del `.pen`; y **`design.md` no declara ningún tamaño de `font-body` ni de
`font-display`** —los cuatro mono son normativos, los otros cinco salen del censo
de nodos, que es más débil. Ese último es propuesta de spec.

Se agregaron una regla de lint (`tipografia`), un ancla (`TIPO-2`) y
`tests/tokens/escala.test.ts`, verificados los tres rompiendo el código a
propósito. La prueba que más importa es la de huérfanas: **una utilidad que
nombra un token inexistente no es un error, es silencio** — `text-labell`
compila, pasa el lint y se pinta sin tamaño.

**`design/` se mudó al repositorio**, con lo que `token-drift` y `spec-anclas`
dejan de depender de un repositorio hermano que un clone limpio no tiene. Es lo
que cierra el hueco que quedaba de F0.12; ver el bloque de comandos.

#### ➕ F1.29 ✅ Validar los params de layout
**Descripción.** `PanelConfig.opciones` llega como `Record<string, unknown>`. Hoy
un cliente que configure `orden: "ascending"` en vez de `"asc"` **no falla: se
ignora**. Con configuración por tenant eso deja de ser hipotético.
**Criterio de aceptación.** ✅ Cumplido el 2026-09-02.
- ⚠️ Cada tipo declara su esquema de params —valores válidos y defaults—
  derivado de `paramsDisponibles` de `/config/blocks`. **Derivado a medias, y el
  contrato es el límite.** Ver abajo.
- ✅ La validación ocurre en el **adaptador de `api/`**: `api/params.ts`. Ni la
  superficie ni `render/` la tocan; el cuerpo recibe params ya limpios.
- ✅ Un param desconocido se descarta con aviso en desarrollo; uno inválido
  **degrada el panel con razón visible**. Nunca se ignora en silencio.

**El esquema está partido en dos, con distinta autoridad, y no por gusto.**
`/config/blocks` declara `paramsDisponibles` como `string[]`: los NOMBRES válidos
por tipo, y nada más. No trae valores admitidos ni defaults. Así que:

- **Qué params existen** lo dice el backend, y un nombre fuera de esa lista se
  descarta.
- **Qué valores son válidos** lo dice `PARAM_SCHEMAS` en el front, porque el
  contrato no lo declara. Es duplicación con lo que cada cuerpo acepta en
  TypeScript, y es inevitable: los tipos se borran al compilar y `opciones` llega
  en runtime.

**Propuesta de spec:** que `paramsDisponibles` deje de ser `string[]` y declare
tipo, valores y default por param. Ahí `PARAM_SCHEMAS` desaparece y la deriva
entre front y backend se vuelve imposible en vez de verificable. **Va con B0.9.**

**Desconocido y descartado ≠ conocido e inválido**, y la diferencia es de
consecuencia. Un param de más es ruido de configuración: se descarta y el panel
dibuja igual. Un param conocido con un valor que el cuerpo no puede usar
**degrada el panel**, porque aplicar el default sería mostrar algo distinto de lo
que se pidió sin decirlo — que es exactamente el defecto que esta tarea arregla,
solo que peor.

Sale como `BLOQUEADO` y no como `ERROR`: no es un fallo del sistema, es una
composición que no se puede dibujar, con razón y con quien la arregle. El shell
conserva título, BASE y procedencia · §5.2.

**`PARAM_SCHEMAS` declara lo que los cuerpos REALMENTE leen, no la lista de §7.**
§7 de `nuevo-desarrollo.md` enumera params de diseño que varios tipos no
implementan —`marca` en bars, `estadisticos` en distribution, `componentes` en
gauge—. Declararlos haría pasar como válido algo que ningún componente mira. Lo
que no se lee se descarta como desconocido, que es información y no un silencio.

#### ➕ F1.30 ✅ Colapso responsive
**Descripción.** Cablear `columnsFor()`, que ya está escrita en `render/grid.ts`,
y el reordenamiento por `colStart` al colapsar. **D1 lo resolvió a favor:** es una
regla normativa vigente con ancla de spec y prueba en v2.
**Criterio de aceptación.** ✅ Cumplido el 2026-09-02.
- ✅ **El colapso no lo puede hacer solo el CSS.** El span se resuelve en JS
  —`spanFor`— y se suelta el `colStart`. `useColumns` escucha el viewport.
- ⚠️ **El mínimo NO es 768: son 360.** Ver abajo.
- ✅ La prueba se escribe desde la cita de §3.1, y las cuatro que verifican la
  división caen si se vuelve a `Math.min`. Verificado por mutación.

**El defecto que esto arregla, y que estaba en el código desde el port.**
`panelStyle` recortaba con `Math.min(colSpan, columns)` donde §4 pide **dividir a
la mitad, redondeando hacia arriba**. Coinciden solo cuando el span excede las
columnas, que era el único caso probado: a seis columnas, un `colSpan` 4 quedaba
en 4 —dos tercios del ancho— donde la spec pide 2, un tercio. Un layout de tres
paneles de 4 se veía como uno de tres paneles de 12. Lo detectó `spec-anclas` al
declarar RESP-2, no una prueba.

**DIVERGENCIA 1 · el criterio de esta tarea decía 768 y design.md dice 360.**
Este plan pedía «por debajo de 768 no se degrada: no se soporta». `design.md`
—normativo, y más reciente: PS-12, 2026-08-21— dice lo contrario con todas las
letras: «El mínimo de la consola es 360 desde el 2026-08-21. Antes decía 768, y
§3.1 definía con precisión el escalón de una columna **por debajo de ese
mínimo**: la spec describía un ancho que ella misma declaraba fuera de soporte.
El escalón está implementado, probado y dibujado, así que **lo que sobraba era el
mínimo, no el escalón**.»

Se implementó según `design.md`, que es la fuente más específica para esta regla.
`MIN_WIDTH = 360` y el escalón de una columna a 767 **sí se soporta**. Queda
anotado acá y no se tocó `design.md`.

Con el mínimo en 360 hay una consecuencia declarada que `design.md` ya nombra y
**no está resuelta**: las hojas laterales. C2 abre al 60% del viewport y C3 a
940px fijos; a 360 la primera son 216px —menos que un panel— y la segunda no
entra. Es trabajo de v1.1 y va con F3.1.

**DIVERGENCIA 2 · §4 nombra `orden` y el contrato no lo tiene.** La regla dice
«orden de lectura según `colStart` + `orden`», y `PanelConfigurado` declara
`id, tipo, metricId, colStart, colSpan, rowSpan, opciones` — sin `orden`, que
existe en `Pestana` y no en el panel. `readingOrder` desempata por la posición en
el arreglo, que es el orden que el backend declaró. Funciona, y no es lo que la
regla dice: mientras el campo no exista, dos paneles con el mismo `colStart`
dependen de un orden que el contrato no promete estable. **Propuesta de spec para
B0.9.**

#### ➕ F1.31 ✅ Registro de gráficos y verificación de mínimos
**CERRADA EL 2026-09-29 contra el servicio corriendo y contra MSW.** Los seis
bullets del criterio se cumplen, y uno **en otro lugar del que el criterio
decía** — está abajo, no se resolvió en silencio.

**El camino quedó así**, y el idioma lo eligió el archivo que lo recibe:
`usePlots` → `plotProblemOf` en el contenedor → `Console` → `PanelInGrid` →
`EmptyState` con la razón del repertorio. **Mismo idioma que `payloadOf` y
`paramsOf`**: la decisión llega resuelta y la superficie sólo la pinta, que es lo
que `api/params.ts` declara en su cabecera —«un cuerpo no valida su entrada,
porque si validara tendría que decidir qué hacer cuando falla, y esa decisión es
de la superficie»—.

**El bullet 4 dice «se rechaza en el ADAPTADOR» y quedó en la SUPERFICIE.** La
razón: la tabla del repertorio llega de `/config/plots`, que es **otra consulta**,
y juntarla con el layout dentro de `adaptTab` acoplaría dos cachés con vidas
distintas —el layout cambia al publicar, el repertorio cuando cambia el diseño—.
La garantía se cumple igual: un gráfico incompatible con la forma no llega al
cuerpo. **Lo que esto implica para F4.21**: el builder no pasa por
`ConsoleContainer`, así que tiene que llamar a `invalidPlotReason` por su cuenta.

**El bullet 5 —«`serieConBanda` sólo admite gráficos con banda»— lo sostiene la
estructura y no un chequeo aparte**: las únicas entradas cuyas `formas` incluyen
`serieConBanda` son las tres que declaran `soportaBanda: true`, así que la
comprobación de forma ya lo cierra. `supportsBand` queda exportada para el
selector de F4.21, que sí necesita preguntarlo antes de ofrecer.

**Tres decisiones del camino, y las tres son «no apagar de más»:**

1. **Sin repertorio no se bloquea nada.** `/config/plots` puede fallar sola; un
   panel apagado por una tabla que no cargó es peor que uno dibujado sin
   verificar — el segundo es lo que hacía ayer, el primero el usuario no lo
   distingue de un fallo de datos.
2. **`indeterminado` no llega a la pantalla.** Se avisa en desarrollo, igual que
   un param desconocido, y el panel se dibuja: castigar al usuario por una
   deriva entre el repertorio y el front no es suyo.
3. **El mínimo se evalúa antes que el tope**, porque «falta dato» se arregla y
   «sobra» manda a recortar lo que no es el problema.

**CUATRO MUTACIONES, Y UNA SOBREVIVIÓ.** Murieron las tres del camino —el
contenedor que no propaga, `PanelInGrid` que ignora el problema, y **la prop mal
nombrada en el spread de `Console`, que compila**, que es el modo de falla que
este repositorio ya tuvo cuatro veces—. **Sobrevivió la de la guarda del
repertorio vacío**: la prueba afirmaba «hay un `img`» y sin la guarda el panel
también se apaga por `incompatible`, así que no distinguía. Con la aserción
sobre el texto exacto —«no está en el repertorio»— muere.

**Y el hook rompió la consola entera antes de la primera prueba.** `usePlots()`
quedó puesto junto a su lógica, o sea **después de los retornos tempranos** del
contenedor: React lo marcó como cambio en el orden de los hooks y nada montaba.
No lo vio el compilador — lo vio la primera prueba que lo ejercitó.

**Con dato real la regla no se dispara**, y está bien: los seis paneles
categóricos del muestrario traen 5 ítems contra umbrales de 2 y 3. Lo que se
verificó en pantalla es que nada se apagó de más.

**EL CANDADO VENCIÓ PORQUE LA RUTA LA ESCRIBIMOS NOSOTROS** · 2026-09-29 ·
B1.21, `b6f0e09`. Con la tabla llegando, la mitad de esta tarea se pudo tomar.

**`catalog/plots.ts` está hecho**, con la figura de `blocks.ts` y sin la tabla
adentro: `plotTable`, `acceptsShape`, `supportsBand`, `evaluar` e
`invalidPlotReason`. Verificado contra la **respuesta real capturada** de la
ruta —`tests/api/real/plotsReales.test.ts`, las 49 atravesando el adaptador— y
con 15 pruebas propias.

**Evaluar `cuando` era la parte delicada, y los sustantivos no se inventaron**:
son campos del contrato —`items` de `ValorCategorica`, `partes` de
`ValorComposicion`, `filas` y `columnas` de `ValorMatriz`—. El único que no es de
primer nivel es `atributos`, que vive en `perfiles[].atributos` y se cuenta del
primero **porque el contrato declara que todos comparten los ejes**.

**Tres decisiones que las mutaciones obligaron a afinar:**

1. **El mínimo se busca POR FORMA y no se toma el primero de la lista.** Nueve de
   los 49 sirven dos formas con umbrales distintos —`treemap` pide 2 en
   `categorica` y 3 en `composicion`—, así que tomar el primero acierta en
   cuarenta y falla en nueve, y el que falla se ve bien.
2. **Un sustantivo desconocido devuelve `null`, no `false`.** `false` diría «la
   condición no se cumple, el gráfico pasa» y apagaría una regla en silencio el
   día que el repertorio sume un sustantivo que este build no cuenta. Lo mismo
   con una cuenta que **no aplica** a la forma: contar cero diría «llegaron
   cero» donde lo cierto es que esa cuenta no existe.
3. **`indeterminado` NO apaga el panel.** Castigar al usuario por una deriva
   entre el repertorio y el front sería peor que dibujar; se reporta, igual que
   `adaptPanelParams` con un param desconocido.

**Y una mutación SOBREVIVIÓ, que es lo que más enseñó.** La prueba de «el mínimo
se evalúa antes que el tope» usaba la dona, donde `partes < 2` y `partes > 5`
**se excluyen**: invertir el orden daba el mismo resultado. La condición
discriminante existe sólo en `radar`, que cuenta **ejes** para el mínimo y
**perfiles** para el tope. Con el caso bueno la mutación muere.

**Lo que FALTA, y por eso queda en ⚠️:** nada de esto se aplica todavía en el
cuerpo del panel. `invalidPlotReason` existe y nadie lo llama — un `bars` con un
ítem sigue dibujando una barra sola. El siguiente paso es el `EmptyState` con su
razón en `Panel`, y ahí sí se cierran los cinco bullets del criterio.

**Descripción.** D2 lo resolvió a favor. Dos piezas: `catalog/plots.ts` con los
validadores sobre el repertorio que llega de `/config/plots` —la misma figura que
`catalog/blocks.ts`, sin la tabla escrita adentro—, y
`render/plots/registry.ts` con `lazy` + `memo` y `plotFor(id)`, igual que el
registro de cuerpos.

**«IGUAL QUE EL REGISTRO DE CUERPOS» YA NO SE SOSTIENE · medido el 2026-09-29.**
Es una premisa de esta descripción y hay que corregirla antes de construir contra
ella, no después.

El registro de cuerpos funciona **porque los once cuerpos comparten
`BodyProps`**: `registry.ts` ancha `value` a `Value` y `params` a `unknown`, y
todo lo demás conserva su tipo — su propia cabecera explica que ésa es la razón
de no usar `ComponentType<any>`.

**Los plots no comparten forma de props, y ya son mitad y mitad.** Censados los
22 de `src/render/plots/` ese día:

| | Cuántos | Ejemplos |
|---|---|---|
| Toman `PlotProps<F>`, con o sin extras | **11** | `PlotBars`, `PlotTreemap`, `PlotDonut` (+`totalLabel`), `PlotColumns` (+`destacado`) |
| **No lo toman** | **11** | `PlotCombo` pide `columns` y `line` **por separado**; `PlotRings` una lista de anillos; `PlotGauge` un `number` y no un `Value`; `PlotSmallMult` una lista de facetas |

Un `plotFor(id)` que devuelva un componente **no puede alimentar a los once
segundos**: la adaptación es del cuerpo y depende del gráfico —`treemap` recibe la
lista sin recortar, `combo` la parte en dos, `smallmult` la recibe normalizada—.
Eso es exactamente lo que el cableado del 2026-09-29 escribió trece veces, y no
es repetición que un registro pueda absorber: **es trece decisiones distintas**,
cada una con su razón en el código.

**Lo que sí queda de la pieza**, y hay que decidirlo aparte: la carga diferida.
Hoy cada plot se importa estático dentro de su cuerpo y viaja en el chunk de ese
cuerpo —`carga-diferida` mide 12 cuerpos en 12 chunks—. Con 49 gráficos eso mete
en un chunk los que un tenant no usa. Es una decisión de empaquetado, no un
registro de despacho, y son dos cosas que esta descripción juntó en una.

**Y `catalog/plots.ts` SÍ se puede escribir hoy tal como está descripto** —son
funciones puras sobre la tabla, sin la tabla adentro, igual que `blocks.ts`, y el
contrato ya declara `Grafico` y `MinimoDeDatos` con `contract-drift` mirándolos—.
**No se escribió, y la razón es que su entrada ES la tabla**: con `/config/plots`
en 404 no tendría un solo llamador, y `Grafico` es una propuesta NUESTRA que el
backend todavía no implementó. Validadores escritos contra un esquema sin
implementar son validadores escritos contra una propuesta; el orden que destraba
es mandar el repertorio primero.

Lo primero que hay que construir **no es el selector, es la verificación de
mínimos**: cuántos puntos, categorías o partes necesita un gráfico para no
engañar. Sirve desde hoy, aun con un gráfico por tipo — hoy nada impide que
`bars` reciba un ítem y dibuje una barra sola.
**LOS NUEVE SE MIRARON CORRIENDO · 2026-09-29, y eso encontró tres cosas que la
puerta no ve.** La auditoría del lote los dejó verificados «contra pruebas y
contra el dibujo transcripto, no contra una pantalla», y lo dijo con esas
palabras. Se cerró agregando al modo mock una pestaña de muestrario con los nueve
—`TAB_C`, misma razón por la que `stackarea` entró el 28— y abriéndola.

| Qué apareció | Qué era |
|---|---|
| El BULLET decía «SIN MÁXIMO DECLARADO» | **El handler de `/config/tabs` del mock nunca copió `options`.** Su propio comentario lo había predicho para `chart` —«un campo nuevo del cable se agrega acá también, y el síntoma de olvidarlo es que se vea bien»— y volvió a pasar. Mientras faltó, **ningún panel del modo mock recibió un solo param de layout**: ni `meter`, ni `comparative`, ni `cut`, ni `order`. Lo destapó el bullet porque es el único que dice por qué no dibuja; los demás params se pierden en silencio |
| Dos de los nueve no se veían | La rotación de estados del batch manda uno de cada cuatro a `BLOCKED`. Con nueve paneles eso tapa dos gráficos y **no hay orden que los salve a todos**. El muestrario quedó exento, con la razón escrita: los estados se miran en las dos pestañas de negocio, que siguen con la rotación intacta |
| `spark` no se parece a su dibujo | `MICRO TENDENCIA` son **cuatro filas de indicador** —rótulo, sparkline de 248×34, punto de familia, cifra y delta— y `PlotSpark` dibuja sólo la línea a alto de panel. Es propuesta de spec, no un arreglo: ver §9 de `docs/PROPUESTA-2026-09-22-divergencias-con-el-pen.md` |

**Los otros ocho se ven como el dibujo**: `bullet` con su marca de objetivo,
`columns`, `lollipop`, `donut` con su total al centro, `radial`, `pareto` con su
acumulado en 42 / 75 / 100 %, `bump` y `slope`.

**Y LOS CUATRO QUE FALTABAN SE CERRARON EL MISMO DÍA · 2026-09-29, tarde.** Los
trece ids del repertorio con dato real quedan cableados.

**Ninguno de los cuatro tenía un defecto de componente, y eso estaba escrito en
sus propios informes de QA** —`treemap` y `combo` con esas palabras, «no encontré
ningún defecto en el componente»—. Lo que faltaba era el despacho, y los cuatro
habían cerrado sus huecos de prueba antes de firmar: `anillos.test.tsx` pasó de
13 a 19 con un helper que lee los radios del comando `A`, porque la prueba vieja
**afirmaba por escrito cubrir el tamaño del anillo y era falso** —`arcPath` emite
sólo los extremos del arco, que en una vuelta completa caen los dos en el mismo
punto—.

**El candado de `rings` estaba dado vuelta.** La auditoría lo anotó como propuesta
de spec —«pide `{ rings: Ring[] }` y `ValorEscalar` es `{ forma, v }`»— y la
cabecera del propio plot ya lo había resuelto al construirlo: *«hoy el cuerpo le
pasa un elemento y se ve un anillo solo — que es lo honesto, no un defecto»*. Una
lista de uno se construye desde un escalar sin inventar nada. Lo que sigue sin
poderse es dibujar los tres del `.pen`, y eso es del cable.

| Id | Cuerpo | Decisión del cableado |
|---|---|---|
| `treemap` | `BarsBody` · `categorica` | Recibe la lista **sin recortar por `tope`**, como la dona y el pareto: deriva su cuota de `v / Σv`, así que sobre una lista recortada cada porcentaje se calcularía contra un total que no es el total **y la suma seguiría dando 100 %** |
| `combo` | `SeriesBody` · `seriesMultiples` | **El cuerpo reparte los roles** —`PlotCombo` recibe `columns` y `line` por separado, no un arreglo— y la única fuente honesta del orden es el orden del payload. Con menos de dos series **no cae a la línea**: `EmptyState` con la razón, porque acá el id sí se sabe dibujar y lo que falta es el dato |
| `smallmult` | `SeriesBody` · `seriesMultiples` | Va **normalizado**, al revés que `bump`: su cabecera declara medido que «la escala es compartida **y** el dominio», y con escala compartida una serie chica queda pegada al piso — que es para lo que `base100` existe |
| `rings` | `GaugeBody` · `escalar` | Un anillo, con `presentation.label` cayendo al nombre de la métrica, igual que el total de la dona |

**Cuatro mutaciones fieles sobre base verde —24 pruebas—, cuatro muertas**, cada
una comprobada aplicada y con el árbol restaurado: los tres despachos borrados
—que hacen caer a barras, a líneas y al arco— y el `combo` con los roles
invertidos.

**Y mirarlos encontró una del fixture.** El anillo salía «140.400 %» porque el
muestrario le daba `maximum: 100` a una métrica que vale 140.400. **No era del
plot** —el arco se topa en una vuelta y la cifra dice la verdad, que es lo
correcto para un sobrecumplimiento— sino un objetivo fuera de la magnitud de lo
que mide. Con 200.000 el anillo dice 70 % y se lee.

**Criterio de aceptación.**
- Ausente `plot` en el layout se dibuja **exactamente** lo que se dibuja hoy: el
  cambio no mueve ninguna pantalla existente.
- Un valor por debajo del mínimo del gráfico no se dibuja: el panel muestra el
  estado vacío con la razón —«este corte necesita al menos tres categorías;
  llegaron dos»— que es lo que §8 pide, invitación a actuar y no un error.
- Un valor por encima del `tope` tampoco: se muestra el motivo declarado en el
  repertorio, no un gráfico ilegible con ochenta barras.
- Un gráfico incompatible con la forma se rechaza en el adaptador **con razón**;
  no se dibuja mal ni se cambia por otro en silencio.
- La regla dura se sostiene: `serieConBanda` solo admite gráficos con banda.
- La tabla no está en el front: llega por API, igual que los bloques.

**TRECE PLOTS CONSTRUIDOS Y NUEVE CABLEADOS · 2026-09-29, y F1.31 SIGUE ⬜.**

El lote agregó trece componentes a `src/render/plots/` —`PlotBullet`,
`PlotRings`, `PlotSpark`, `PlotColumns`, `PlotLollipop`, `PlotDonut`,
`PlotTreemap`, `PlotRadial`, `PlotPareto`, `PlotCombo`, `PlotSmallMult`,
`PlotBump` y `PlotSlope`— cada uno medido nodo por nodo contra su frame de
«Synapse · Plots», con su batería de pruebas y su QA por mutación. **Nueve se
cablearon** en el cuerpo que les toca:

| Cuerpo | Ids que dibuja desde hoy |
|---|---|
| `GaugeBody` · `escalar` | `bullet` |
| `SeriesBody` · `serieTemporal` | `spark` |
| `SeriesBody` · `seriesMultiples` | `bump`, `slope` |
| `BarsBody` · `categorica` | `columns`, `lollipop`, `donut`, `radial`, `pareto` |
| `BarsBody` · `ranking` | `lollipop` |

**Y no cierra ni un criterio de F1.31**, que es lo que conviene no confundir: lo
que se construyó son DIBUJOS, y esta tarea es el REGISTRO y la verificación de
mínimos. No existe `catalog/plots.ts`, no existe `render/plots/registry.ts`, no
hay `plotFor(id)` con `lazy` —los plots viajan estáticamente dentro del chunk de
su cuerpo, que es lo que `carga-diferida` verifica—, y **ningún mínimo se
verifica**: un `bars` con un ítem sigue dibujando una barra sola y una dona con
ocho partes sigue pasando su `tope` de cinco. La tabla tampoco llega por API,
porque `/config/plots` sigue en 404. El único criterio que se cumple es el
primero, y se cumple por otra razón: **ausente `grafico` se dibuja exactamente lo
que se dibujaba antes**, con prueba propia.

**CUATRO NO SE CABLEARON, y los cuatro están escritos con su razón.**

`rings`, `treemap`, `combo` y `smallmult` **no aprobaron su QA** y por eso el
cableado no los tomó: hoy los cuatro caen en `UnknownPlotState`, que dice el id
en pantalla. Tres de los cuatro son huecos de PRUEBA y no defectos del
componente; el cuarto, `rings`, tiene además un candado de forma que ninguna
lista de ids arregla —`PlotRings` pide una lista de anillos y `ValorEscalar` es
`{ forma, v }`—. El detalle por gráfico está en el informe de la auditoría del
2026-09-29.

**Y queda un param sin alcanzar, que es pedido y no hueco.** `PlotColumns`
acepta `destacado` —la etiqueta de la columna a resaltar, que es lo único que el
dibujo distingue entre las doce— y el cuerpo **no lo pasa**: `validateParams`
cruza todo param contra `paramsDisponibles` de `/config/blocks`, que lo declara
el backend, así que un nombre escrito sólo de este lado se descarta como
desconocido. La rama del plot está construida y probada; se enciende cuando el
servicio liste `destacado` entre los params de `bars`. **No se anotó como
`Espera del backend` todavía porque falta medirlo contra su commit**, que es lo
que `para-backend` exige.

### La integración con el backend real · 2026-09-11

**El backend de la consola existe** —rama `feature/dynamic-dashboard-backend` de
`AntPack-dev/synapse-api-go`, el mismo binario que ya sirve el login— y **no
implementó el contrato**: claves en inglés snake_case, `error` como cadena,
arreglos desnudos donde el contrato declara un objeto, estados en inglés,
`Gobierno` anidado y el discriminador de `Valor` llamado `shape`.

La decisión es **un adaptador en `src/api/`**: el contrato sigue siendo la forma
interna y `render/` no se toca. El análisis completo, campo por campo, está en
`docs/PLAN-INTEGRACION-2026-09-11.md`; las preguntas al backend, en §4 de ese
documento.

La regla del adaptador: **renombra y reformatea; no calcula, no inventa una cifra
y no escribe copy de producto.** Donde el cable no trae el campo, el campo queda
ausente y la tarea que depende de él sigue bloqueada.

#### ➕ F1.32 ✅ Transcribir el cable de consola a un contrato versionado
**Descripción.** `contracts/synapse-console-wire.yaml` con la forma que el
servicio de Go realmente sirve en `/config/*`, más `npm run gen:console-wire` y
`npm run console-drift`. Es el mismo tratamiento que ya recibió
`contracts/synapse-auth.yaml`, y por la misma razón: **no se escriben tipos a
mano contra un servicio.**

El OpenAPI que el binario embebe no declara ni una ruta `/config/*` —es la tarea
B0.7 de su plan, sin marcar—, así que esta primera versión es una transcripción
nuestra leyendo `ports/dd_config_service.go`, `dashboard/blocks.go` y
`domain/dd_*.go`.
**Criterio de aceptación.**
- El yaml lleva escrito adentro que es una transcripción del front y no un
  contrato firmado, con la fecha y el commit desde el que se transcribió.
- `console-drift` falla si `src/api/console-generated.ts` deja de coincidir con
  el yaml, con la misma convención de salida que los otros chequeos: 0 conforme,
  1 violación, 2 BLOQUEADO.
- Cuando el backend cierre B0.7, el yaml se reemplaza por el suyo y no cambia
  nada más: el adaptador ya tipa contra los tipos generados.
- La puerta lo corre. La puerta lo corre, sin bloqueados.

**Cerrada el 2026-09-14.** `contracts/synapse-console-wire.yaml` · seis rutas,
catorce esquemas, transcrito del commit `733c13c` de
`feature/dynamic-dashboard-backend`. El yaml nombra adentro los ocho archivos de
Go que se leyeron y declara que **ellos son la autoridad si esto difiere**.

**No se duplicó el comparador.** `contract-drift.py` ya estaba escrito para
varios contratos —su propio comentario dice que duplicarlo «habría creado dos
comparadores que derivan»— así que el cable entró como un tercer par
`yaml → .ts` y no como un script nuevo. Eso destapó una deuda del propio
chequeo: los dos mensajes de «cómo arreglarlo» decían `npm run gen:api` fijo,
así que el contrato de acceso venía recomendando el generador equivocado desde
F0.14. Ahora sale del contrato que falló.

**Verificada por mutación, cuatro casos:** editar el generado a mano (✗ 1),
cambiar el yaml sin regenerar (✗ 1, y nombra las tres líneas), borrar el
generado (⊘ 2 BLOQUEADO, no verde) y restaurar (✓ 0).

**Lo que el yaml declara y el contrato no**, que es la lista que F1.33–F1.36 van
a consumir: `error` como cadena; `data` como arreglo desnudo en `/catalog` y
`/blocks`; `periods` como cadenas sueltas de los últimos doce meses del
calendario; `governance` anidado; `status` en inglés; `presentation` solo para
las dos formas escalares; `unlocks_with` vacío en `BLOCKED`; `request_from` como
la constante `"administrator"`; `options` de `kpi` como interruptores y no datos;
y `shape`, `family` y `layer` como `string` libre.

**Las cinco rutas que el servicio NO tiene no se transcribieron** —`/config/chat`,
`/config/chat/hilos`, `/config/decisiones`, `/config/accionables`,
`/config/solicitudes`—: declarar una ruta que nadie sirve es el mismo problema
que un chequeo que pasa porque no encontró nada.

#### ➕ F1.33 ✅ `api/adapt.ts` · contexto, catálogo, bloques y pestaña
**Descripción.** Las cuatro respuestas que no llevan datos. Traduce nombres
—`col_span` a `colSpan`, `operational_question` a `pregunta`—, compone `nombre`
desde `first_name` y `last_name`, y mapea por tabla los tres enumerados que
cambian de idioma: `shape`, `family` y `min_grain`.
**Hereda dos correcciones de F1.36** (2026-09-14): `/config/catalog` y
`/config/blocks` devuelven **un arreglo desnudo** en `data`, no `{ metrics }` ni
`{ blocks }`. Se mudaron acá porque cambian el tipo de retorno del cliente, y
quien lo recibe es este adaptador.

**Criterio de aceptación.**
- `render/` y `catalog/` no cambian ni una línea: la frontera de §4 se sostiene.
- Lo que el cable no trae queda **ausente**, nunca inventado. `alcance`,
  `tenant.etiqueta`, `role.puedeAprobar`, `tabs[].key` y `user.capacidades` no
  se rellenan con un valor plausible.
- El mapeo de familia es explícito y verificado: las cinco familias del cable
  producen las cinco del contrato, que son las que nombran los tokens
  `--color-fam-*`.
- Una prueba por cada una de las cuatro respuestas, con el fixture escrito desde
  `synapse-console-wire.yaml` y no de memoria.

**Cerrada el 2026-09-14.** `src/api/adapt.ts`, conectado en el borde de
`client.ts`: `request<…>` pide el tipo del CABLE y lo que sale de `api.*` es el
tipo del CONTRATO. **`render/` y `catalog/` no cambiaron ni una línea CON ESTA TAREA** —
`git diff --stat` sobre las dos carpetas salía vacío el 2026-09-14—, y con ellas
las 15 reglas de `design-lint` y las 10 anclas. *(F1.40 sí tocó `KpiBody.tsx`
más tarde, y con razón: era un defecto de render. La afirmación es de esta tarea
y no una promesa permanente — anclada por la auditoría del 2026-09-14.)*

**Las dos heredadas de F1.36 entraron acá**: `/config/catalog` y `/config/blocks`
llegan como arreglo desnudo.

**Los mocks pasaron al cable, y eso es lo que hizo el trabajo.** Mientras
`handlers.ts` hablaba el idioma del contrato, el adaptador no se ejecutaba en
ninguna prueba. Al cambiarlos **fallaron 16 solas**, y cada una señaló algo real:
la ventana que no llega, los períodos como cadenas, la pestaña que el mock
emitía como spread en vez de `{ tab, panels }`.

**Y una de esas 16 encontró un bug MÍO.** Había fijado `grano: 'mes'` en vez de
deducirlo de la forma del id, que es lo que el contrato sanciona explícitamente.
Con eso, un período semanal se ofrecía como mensual y el selector no lo
deshabilitaba — la garantía de F1.7 rota en silencio. La prueba del grano existía
desde antes y la agarró.

**Lo que NO se rellenó, y con qué queda en su lugar:**

| Campo | Qué pasa | Por qué |
|---|---|---|
| `alcance` | `usuario` | Es el único que este servicio sostiene: `plataforma` necesita `tenantsDisponibles`, que tampoco existe |
| `role.puedeAprobar` | `false` | Dirección a prueba de fallo. Con `true` el panel pinta APROBAR para todos |
| `tenant.etiqueta` | El nombre completo | Fallback VISIBLE —se ve largo— y no una etiqueta recortada por nosotros |
| `tabs[].key` | El id | Estable y único, que es para lo que sirve. Un slug del nombre se rompe al renombrar |
| `metric.ventana` | **Vacía** | No se deriva del período: dos métricas con el mismo mes pueden tener ventanas distintas · B1.25 |
| `periodo.etiqueta` | El id crudo | «AGO 2026» necesita un locale, y `Contexto.locale` tampoco llega |
| `direccionSemantica` | El código, tal cual | Traducir a «MÁS ALTO = MEJOR» es escribir copy de producto |
| `capacidades`, `preferencias`, `icono`, `chatSugerencias` | Ausentes | No llegan y no se inventan |

**Y una consecuencia visible que hay que decir:** la línea de BASE sale
`Base · 48 tiendas sobre 52 ·`, con el separador colgando, porque falta la
ventana. Hay una prueba que lo AFIRMA —`la ventana llega VACÍA`— en vez de borrar
la aserción vieja: una prueba borrada no avisa cuando el campo aparece; esta
falla el día que B1.25 llegue.

**Verificada por mutación, cinco casos:** familia mapeada mal, lo desconocido
descartado en silencio, el grano fijo en vez de deducido, `colStart` ignorado y
**la ventana inventada**. Las cinco rompen pruebas. La cuarta enseñó algo aparte:
la primera corrida del arnés no la detectó porque el `sed` tenía la indentación
mal — la mutación que «pasa» hay que verificarla también.

#### ➕ F1.34 ✅ `api/adapt.ts` · payload, valor y presentación
**Descripción.** Los cinco estados —`AVAILABLE`, `DEGRADED`, `BLOCKED`,
`FORBIDDEN`, `ERROR`—, el `Gobierno` que viene anidado en `governance`, las nueve
formas de `Valor` que el backend materializa y la `Presentacion` de las dos que
la tienen.
**Criterio de aceptación.**
- Los cinco estados producen las cinco variantes de la unión discriminada, y el
  `switch` exhaustivo de `Panel.tsx` sigue compilando sin cambios.
- Las nueve formas se verifican una por una contra el fixture del cable. Las
  siete que el backend no materializa —`distribucion`, `serieConBanda`,
  `categoricaComparada`, `perfilMultiatributo`, `matriz`, `grafo`, `flujo`—
  quedan declaradas como no alcanzables hoy, con la razón.
- **`porcentaje` ausente en una composición no se deriva.** El contrato dice que
  lo calcula el backend porque redondear en el cliente da columnas que suman
  99,9. Sin él, el panel entra en `ERROR` con la razón escrita.
- `BLOQUEADO` sin `unlocks_with` no se inventa un «qué lo desbloquea».
- Verificada por mutación: cambiar un nombre de campo en el adaptador tiene que
  romper una prueba.

**Cerrada el 2026-09-14.** Los cinco estados, las nueve formas y la presentación.
**las pruebas del repositorio**, y `render/` y `catalog/` siguen sin una línea tocada.

**El cable NO es una unión discriminada, y ahí está el trabajo real.**
`ports.DDPayloadDTO` es un struct con campos `omitempty`: su tipo permite un
`AVAILABLE` sin `governance` y un `BLOCKED` con valor. El contrato lo hace
imposible de construir. **El adaptador es donde eso se vuelve a cerrar**, y por
eso puede fallar: un payload que no cumple la variante sale como `ERROR` con la
razón escrita, nunca como una variante a medias. `ERROR` y no `BLOQUEADO` a
propósito — bloqueado es «no hay dato y no puede haberlo», esto es un dato que
llegó mal, y el usuario tiene que poder distinguirlos.

**Lo que NO se deriva, con la cita que lo prohíbe:**

- **`porcentaje` de una composición.** El contrato: «lo calcula el backend y no
  el front: la suma tiene que dar 100 y redondear en el cliente produce columnas
  que suman 99,9». En el cable es opcional, así que su ausencia rompe la
  composición entera en vez de producir una que casi suma.
- **La banda de un pronóstico.** Regla dura 6: «prohibida la estimación puntual
  sin intervalo». Sin `lo`/`hi`/`nivel` el panel entra en `ERROR`.
- **El «qué lo desbloquea» de un `BLOQUEADO`.** El servicio deja `unlocks_with`
  vacío ahí; solo lo escribe al derivar `DEGRADED`.
- **El `solicitarA` de un `SIN_PERMISO`.** Pasa la constante `"administrator"`
  tal cual: mejorarla sería inventar a quién pedirle.

**Las siete formas no alcanzables quedan declaradas con una prueba propia** que
recorre `distribution`, `series_with_band`, `compared_categorical`,
`multi_attribute_profile`, `matrix`, `graph` y `flow`. No son paneles rotos: son
formas que el `switch` de `TransformValue` no produce. El día que alguna llegue,
esa prueba falla y alguien decide qué se pinta.

**Dos huecos más quedaron atestiguados por pruebas en vez de tapados**, igual que
la `ventana` de F1.33: `BLOQUEADO` no promete un desbloqueo —con su par, que
comprueba que SÍ se pinta cuando el servicio lo manda, para que el hueco quede
del lado correcto— y un panel no escalar llega sin `presentacion`, que es §4 ask
13 contra la regla dura de «ningún número desnudo».

**Verificada por mutación, seis casos:** `label` leído como `etiqueta`, el
porcentaje derivado, un desbloqueo inventado, el gobierno sin aplanar, el
pronóstico sin banda publicado, y el pilar leyendo `valor` en vez de `value`.
Las seis rompen pruebas.

**Y el arnés de mutación volvió a fallar por comillas**, igual que en F1.33 con
la indentación. Dos de las seis dijeron «pasa» sin haberse aplicado. **Una
mutación que pasa hay que verificarla también**: ahora el script sale con 1 si el
texto a reemplazar no está.

#### ➕ F1.35 ✅ Los enumerados cerrados no se abren en el cable
**Descripción.** En el cable `shape`, `family`, `layer` y `block_type` son
`string` libre; en el contrato son enumerados cerrados. `make sync-catalog` hace
upsert de lo que diga una vista de Snowflake, así que un valor desconocido no es
hipotético. El adaptador es el único lugar donde se puede detectar.
**Criterio de aceptación.**
- Una `family` fuera del enumerado **no pasa**. Si pasara, el color de la serie
  sería `var(--color-fam-vendors-1)`, que no existe: la serie se pinta sin color
  y nadie se entera. Es el mismo modo de falla que `text-labell`.
- Una `shape` o un `block_type` desconocidos ponen ese panel en `ERROR` con la
  razón —qué valor llegó y qué valores hay—, no rompen la pestaña entera ni se
  sustituyen por un default.
- El error es explícito. **Nunca se arregla un valor inválido en silencio**:
  principio 6 de §1.
- Verificada por mutación con una familia inventada en el fixture.

**Cerrada el 2026-09-15.** La mitad estaba desde F1.33 —`adaptCatalog` ya
separaba lo que no podía adaptar en `rejected`— y **lo que faltaba era que la
razón llegara a la pantalla**. Un arreglo de rechazos que nadie lee deja un panel
que no dibuja y no explica, que es la misma falla con otra cara.

**Ahora la pantalla nombra el valor que llegó**: «Métrica no dibujable ·
ventas_dia · familia desconocida: «vendors»» en vez de «Métrica no resuelta» a
secas. **Y las dos siguen siendo distintas a propósito**: una métrica ausente del
catálogo probablemente sea un layout que referencia algo que este rol no ve
—problema de permisos—, y una rechazada es un valor fuera del enumerado.
Confundirlas manda a buscar al lugar equivocado.

**Y apareció un cast que era una afirmación sin evidencia.** `adaptBlocks` hacía
`b.type as Block['tipo']` sobre un dato de red: el compilador se calla y un tipo
inventado entra a la tabla como si fuera bueno. Ahora se comprueba contra una
lista de los quince **en runtime**, porque `PanelType` es una unión de TypeScript
y se borra al compilar.

Esa lista es una copia del enumerado del contrato, así que lleva **su prueba de
paridad contra el yaml** —`enumOf('TipoPanel')`, el mismo camino que ya usa
`registry.test.tsx`—. Una copia a mano sin esa prueba se desactualiza con el
contrato adelante.

**Verificada por mutación, tres casos:** una familia inventada que pasa (5
fallas), un tipo faltante en la lista de runtime (1), y la razón que no llega a la
pantalla (2).

##### Corrección del 2026-09-15 · una sola tabla contestaba dos preguntas

Al medir `/config/blocks` contra el servicio corriendo apareció que el mapa de
nombres de forma tenía **nueve de dieciséis** entradas, y que las que faltaban se
descartaban **en silencio**: `flatMap` sobre un `undefined` devuelve `[]` y no
deja rechazo ni razón. Consecuencia concreta: tres de los quince bloques llegaban
a la biblioteca del builder con la lista de formas vacía.

No lo vio ninguna prueba porque todas ejercitaban `bars`, cuyas dos formas sí
estaban. **Un fixture que solo recorre el caso que funciona no cubre nada.**

**Lo que estaba pasando es que una tabla contestaba dos preguntas.** «Cómo se
llama esta forma en el cable» es una tabla de nombres y tiene que estar completa;
«el backend sabe materializar esta forma» es un hecho sobre su `transform.go`,
que tiene nueve casos. Mientras coincidieran, faltar en una significaba faltar en
la otra.

Al separarlas, la prueba `una forma que el backend no materializa tampoco pasa`
—que estaba bien escrita— falló, y ahí se vio que el rechazo del catálogo salía
de la ausencia en el mapa y no de una comprobación. **Se hizo explícita.**

Ahora el mapa es `Record<Shape, string>` completo: agregar una forma al contrato
sin su nombre de cable **deja de compilar**. Es el mismo mecanismo que pide el
criterio de F4.20 para el registro de cuerpos, puesto donde hoy sí se sostiene.

**Verificada por mutación, diez casos sobre línea de base verde:** cinco formas
que pierden su nombre de cable, `flujo` y `grafo` cruzados, la puerta de
materializable apagada, `distribucion` declarada materializable, el comodín de
`blocked` expandido a las dieciséis y recortado, y las formas aceptadas
descartadas enteras. Mueren las diez.

**Y el mock de desarrollo estaba escrito de memoria.** Las quince filas de
`dev/mocks/datos.ts` diferían del servicio: cinco `accepted_shapes` equivocadas,
los quince `ui_name` traducidos al español —el cable los manda en inglés— y casi
todos los rangos de span. Las formas son lo que importa, porque son lo que decide
`invalidReason`: componer contra el mock daba una validación que el servidor no
da. Reemplazadas por la captura del servicio, con su fecha y su endpoint escritos
en el archivo. Es la otra mitad de lo que ya dice `BITACORA-2026-09-14.md` —«un
mock que habla el idioma de tu capa interna no prueba la frontera, la esconde»—:
uno que habla mal el idioma del cable tampoco.

#### ➕ F1.36 ✅ `client.ts` contra las rutas, los cuerpos y el error de este servicio
**Descripción.** Seis correcciones: el batch manda `{ panel_ids, period }` y no
`{ panelIds, periodo }` —los dos son `required` en el binding, así que hoy
devuelve 400—; las preferencias van a `/config/me/preferences` con `{ theme }`;
el catálogo y los bloques llegan como arreglo desnudo; los hilos apuntan a un
endpoint que no existe; y **el envelope de error de este servicio es
`{ success: false, error: "cadena" }`**, no el objeto de §4.1.
**Criterio de aceptación.**
- Ninguna llamada de la consola devuelve 400 ni 404 por forma del request contra
  el servicio real.
- Un error del servicio produce un `ApiError` con `message` legible. Hoy
  `body.error.codigo` sobre una cadena da `code: undefined` y `message: ""` —una
  pantalla de error sin una palabra—, que es el defecto exacto por el que existe
  `api/auth.ts`.
- El desenvolvimiento del envelope sigue ocurriendo **en un solo lugar**.
- Mientras el servicio no emita códigos, el `code` es explícitamente desconocido
  y el front no decide sobre él.

**Cerrada el 2026-09-14, en dos tramos.** Cuatro correcciones entraron con la
tarea —el cuerpo del batch (`panel_ids` / `period`), la ruta y la clave de
preferencias (`/config/me/preferences`, `{ theme }`), el envelope de error como
cadena, y `threads()` documentado contra un endpoint que el servicio no tiene— y
**las dos de respuesta entraron con F1.33**, donde el tipo de retorno tiene quien
lo reciba: el catálogo y los bloques llegan como arreglo desnudo.

Se partió así y no por tiempo. Hacerlas antes del adaptador dejaba dos salidas y
las dos malas: el árbol en rojo hasta que existiera `adapt.ts`, o un
`request<Metric[]>` afirmando que el cable devuelve el tipo del contrato — un
cast que miente y que el compilador deja pasar.

**Los cuatro criterios, verificados y no asumidos:**

| | Cómo se comprobó |
|---|---|
| Ninguna llamada difiere del cable | Cruzando las rutas y los cuerpos de `client.ts` contra `synapse-console-wire.yaml`. Las seis coinciden |
| El error produce un `message` legible | Prueba con el envelope del cable, más la mutación que descarta el mensaje |
| El envelope se desenvuelve en UN lugar | `grep` de `res.json()` y `body.success` sobre `src/`: una sola vez, en `client.ts` |
| El `code` es explícitamente desconocido | `SIN_CODIGO`, y una prueba afirma que su familia NO es `CAMPO`, `REGLA` ni `FALLO` |

**La única ruta que no existe es `/config/chat/hilos`, y no la llama nadie**:
`useThreads` no tiene consumidor en `src/`. Se conserva porque F3.7 está escrita
y bloqueada, no equivocada — lo que no se hace es montarla en la consola, que un
riel que pide un 404 al abrir es peor que un riel ausente.

**Y al cerrarla apareció algo que conviene decidir, no hacer de pasada.** La
razón por la que `api/auth.ts` existe aparte era su envelope: «§4.1 declara el
error como objeto y el servicio como cadena, y pasarlo por `client.ts` daba
`code: undefined`». **Eso dejó de distinguirlos**: ahora `client.ts` lee el mismo
envelope de cadena, así que los dos archivos hacen lo mismo con la misma forma.

Lo que todavía los separa es poco: `auth.ts` asigna códigos con sentido
—`AUTH_CREDENCIALES` frente a `AUTH_FALLO` según el 401— donde el cliente pone
`SIN_CODIGO`, y estrecha los opcionales del spec. Es candidato a fundirse, y no
se hizo acá porque toca el flujo de acceso entero —F0.5, F0.13, F0.15 y F0.16,
las cuatro cerradas y probadas— y eso es una tarea con su propio criterio, no un
arreglo al pasar.

**Y esa separación ya costó un defecto, encontrado el mismo día levantando la
app.** La guarda de JSON de F1.36 quedó solo en `client.ts`; `auth.ts` hacía
`await res.json()` **cinco veces sin un `try`**. Con el backend apagado, el proxy
devuelve un 502 vacío y la PRIMERA pantalla —`AuthGuard` llama a `tokenInfo()` al
montar— decía «Failed to execute 'json' on 'Response': Unexpected end of JSON
input»: un mensaje sobre el parser y no sobre el servicio que no está.

Arreglado con un helper en `auth.ts`, y con tres pruebas: 502 vacío, 502 con
HTML, y la que impide que la guarda se trague el error real —si lo hiciera,
«credenciales inválidas» se volvería «respondió sin cuerpo»—. Verificado por
mutación y en pantalla: ahora dice «El servicio de acceso respondió 502 sin
cuerpo».

**Lo encontró correr la aplicación, no una prueba.** Ninguna de las 406 lo
cubría porque todas responden JSON: MSW no tiene forma de devolver un cuerpo
vacío si nadie se lo pide. Es el mismo hueco que los mocks de F1.38, un nivel más
abajo — el transporte también tiene estados que los fixtures no imitan por
defecto.

**El `code` es `SIN_CODIGO`**, y la familia `SIN` no es ninguna de las tres de
§4.1 a propósito: ninguna rama futura sobre `CAMPO_`, `REGLA_` o `FALLO_` lo va a
agarrar por accidente. Lo que sí queda es `httpStatus`, que el transporte declara.

**Apareció una quinta corrección que no estaba en la lista**: `res.json()` tira
cuando el 502 del proxy o un panic de Go devuelven HTML, y el mensaje que veía el
usuario hablaba del parser y no de que el servicio no está.

**Y el helper `fail()` de MSW emitía la forma del contrato** —es la razón por la
que `body.error.codigo` sobrevivió meses sin que ninguna prueba se quejara: los
mocks le daban de comer exactamente lo que esperaba—. Es F1.38 en chico, y
confirma por qué esa tarea no se deja para el final.

**Verificada por mutación, cuatro casos**, cada uno rompiendo una corrección:
claves viejas del batch, ruta vieja de preferencias, mensaje del servicio
descartado, y el `try` del JSON quitado. Las cuatro hacen fallar una prueba.

#### ➕ F1.37 ✅ Una sola base de API
**Descripción.** `/auth/*`, `/config/*` y `/admin/*` los sirve el mismo binario
bajo el mismo `/api/v1`. Las dos bases del front dejan de tener razón de ser.
**Criterio de aceptación.**
- `VITE_AUTH_URL` ausente cae a `VITE_API_URL`, que es el comportamiento que ya
  estaba previsto «si algún día quedan detrás del mismo origen».
- Un `.env.example` declara las variables con el puerto real del servicio
  (`4010`) y el `README` dice cómo levantar los dos lados.
- `CLAUDE.md` deja de decir «son DOS servicios».

**Cerrada el 2026-09-14.** La caída de `VITE_AUTH_URL` a `VITE_API_URL` ya estaba
escrita desde F0.5 «por si algún día quedan detrás del mismo origen»; lo que
faltaba era todo lo demás, que seguía asumiendo dos destinos.

**El proxy de Vite enumeraba prefijos, uno por uno**, con la razón escrita: «la
API de la consola es otro servicio y va a tener otro destino». Resultó no serlo.
Enumerar ya había costado una vez —`password-reset-requests` cae fuera de `/auth`
y el proxy devolvía 404, así que parecía que el endpoint no existía— y con
`/config/*` y `/admin/*` la lista solo se alargaba. Ahora es `/api/v1` entero.

`API_ORIGIN` reemplaza a `AUTH_ORIGIN`, que **sigue funcionando** para no romper
entornos que ya lo tienen puesto.

**El encabezado de `api/auth.ts` afirmaba que era otro servicio y ya no lo es.**
Se corrigió dejando escrito qué se sabía cuando se escribió. Lo que NO cambia es
que el archivo siga existiendo: su razón de ser es el envelope de error, y que
sea un solo servicio no lo arregla.

#### ➕ F1.38 ✅ MSW responde la forma del cable, no la del contrato
**Descripción.** Hoy `tests/mocks/handlers.ts` responde la forma del contrato.
Si se queda así, **el adaptador no se ejecuta en ninguna prueba y las 350 siguen
verdes con el adaptador roto** — el modo de falla exacto del 2026-08-20, cuando
el colapso responsive violaba §3.1 de tres formas con 184 pruebas en verde.
**Criterio de aceptación.**
- Los handlers responden lo que responde Go: snake_case, `error` como cadena,
  arreglos desnudos, estados en inglés, `governance` anidado, `shape` como
  discriminador.
- El adaptador queda en el camino de **toda** prueba de superficie: no hay ruta
  por la que una prueba vea la forma del contrato sin pasar por él.
- Los fixtures se escriben desde `synapse-console-wire.yaml`. Un fixture
  inventado verifica el fixture.
- Verificada por mutación: romper el adaptador tiene que romper pruebas de
  superficie, no solo las del propio adaptador.

**Cerrada el 2026-09-15, y la mayor parte se había hecho sola.** Los handlers
pasaron al cable en F1.33 y F1.34 porque **no había otra forma de ejercitar el
adaptador**: mientras hablaban el idioma del contrato, no se ejecutaba en ninguna
prueba. Ahí fallaron 16 solas y una encontró un bug propio.

Lo que faltaba era la garantía, no la migración. **Auditado: ni un solo fixture
HTTP habla el idioma del contrato.** Las dos apariciones que quedan están en
`tests/render/state.test.ts`, que es una prueba unitaria de `render/` — y `render/`
habla el contrato por diseño. Son correctas.

**Y lo que impide que vuelva atrás es el COMPILADOR, no una revisión.** Los
fixtures compartidos ya estaban tipados contra `WireContext`, `WireMetric` y
`WirePanel`; los seis payloads de `states.test.tsx` y los de `tab.test.tsx` no lo
estaban. Ahora van contra `WirePayload`, así que escribir `estado` en vez de
`status` **deja de compilar**:

    error TS2353: Object literal may only specify known properties,
    and 'estado' does not exist in type '{ status: "AVAILABLE" | … }'

Verificado por mutación devolviendo `SIN_PERMISO` al idioma del contrato. Lo
sostiene `tsc`, que ya corre en la puerta — **una garantía que no necesita que
nadie se acuerde.**

#### ➕ F1.39 ✅ Humo contra el servicio real
**Descripción.** Una corrida contra el servicio levantado con su seed —login,
`/config/me`, `/config/catalog`, `/config/blocks`, `/config/tabs/:tabId`,
`panels:batch`— que compare lo que llega contra
`contracts/synapse-console-wire.yaml`. Una prueba verde contra MSW demuestra que
el adaptador es coherente con lo que nosotros creemos del cable, no con el cable.
**Criterio de aceptación.**
- Se corre a mano con credenciales y no forma parte de `npm run verify`: la
  puerta no puede depender de un servicio externo.
- Sale con 2 —BLOQUEADO— si no hay servicio al que apuntar, nunca con 0. Un
  chequeo que pasa por falta de fuente miente sobre su cobertura.
- Una diferencia entre el cable real y el yaml transcripto se reporta con el
  campo y los dos valores, y **se corrige el yaml**, que es lo que puede estar
  mal: el yaml es nuestra transcripción, el servicio es el hecho.
- Queda registrado qué se verificó y con qué commit del backend.

**Cerrada el 2026-09-15.**

`tools/humo.py` pide las cinco rutas al servicio y compara la respuesta contra
los `required` de cada esquema del yaml, más las dos propiedades que no son de
campos sino de forma: que `/config/catalog` y `/config/blocks` devuelvan
**arreglo desnudo** y que `panels:batch` devuelva un **mapa**.

**Verificado en sus dos caminos de BLOQUEADO**, que es la mitad del criterio: sin
credenciales y sin servicio sale con **2**, nunca con 0, y las dos veces dice que
no es un fallo del front. Un chequeo que pasa por falta de fuente miente sobre su
cobertura.

**LA CORRIDA, REGISTRADA · 2026-09-15 · las cinco rutas conformes.**

| Endpoint | Esquema | Requeridos |
|---|---|---|
| `/config/me` | `ContextResponse` | 6 / 6 |
| `/config/catalog[0]` | `CatalogMetric` | 12 / 12 |
| `/config/blocks[0]` | `BlockRule` | 7 / 7 |
| `/config/tabs/{id}` | `TabWithPanels` | 2 / 2 |
| `panels[0]` | `PanelDTO` | 6 / 6 |
| `panels:batch[0]` | `Payload` | 1 / 1 |
| `governance` | `Governance` | 5 / 5 |

**Contra `AntPack-dev/synapse-api-go` en `733c13c`** —`feature/dynamic-dashboard-backend`,
del 2026-09-11, confirmado con `npm run backend-drift`—, con el seed de UA MX.
Cero diferencias: el yaml transcripto describe lo que el servicio sirve.

**Y eso no era obvio.** La corrida a mano del 2026-09-14 había encontrado una
—`semantic_direction` es texto ya redactado y no un código, al revés del
comentario de Go del que se transcribió—. Se corrigió el yaml ese día; esta
corrida confirma que no quedó ninguna otra.

    SYNAPSE_EMAIL=… SYNAPSE_PASSWORD=… npm run humo

**No entra a la puerta**, y esa es una decisión: necesita el servicio levantado y
credenciales, así que en CI saldría ⊘ todos los días — y un bloqueado cotidiano
es cómo se deja de mirar un chequeo.


#### ➕ F1.40 ✅ `Presentacion` llega al cuerpo · hoy está declarada y nadie la pasa
**Descripción.** `BodyProps.presentation` existe en `render/types.ts`, está
documentada correctamente —«rótulos y cifras de apoyo, redactados por el backend;
viajan con el dato y no con el layout porque dependen del período»— y **ningún
cuerpo la lee, ninguna superficie la pasa**. `KpiBody` toma `label`,
`comparativo` y `medidor` de `params`, o sea de `PanelConfigurado.opciones`, que
es el layout.

**Es nuestro, no del backend, y contradice nuestro propio contrato.** `Presentacion`
declara esos tres campos y dice por qué van en el payload: «el medidor marca 61%
este mes y otra cosa el siguiente». Con el layout de por medio, el rótulo del KPI
queda congelado en la composición.

MSW lo tapaba porque los fixtures escribían el rótulo en `opciones`. El cable lo
destapa: manda `options: { comparative: true, meter: true }` —interruptores— y
los datos en `presentation`.
**Criterio de aceptación.**
- `Panel` pasa `presentation` al cuerpo, y `KpiBody` lee de ahí `label`,
  `medidor` y `comparativo`. En `params` quedan los interruptores, que es lo que
  el contrato llama «interruptores de composición, no datos».
- Un KPI cuyo medidor cambia de período cambia en pantalla **sin republicar el
  layout**. Es la garantía que justifica que `Presentacion` exista.
- Verificada por mutación: mover el rótulo de vuelta a `opciones` tiene que
  romper una prueba.
- **Queda UN solo lugar que la pasa y uno solo que la lee.** Los doce cuerpos
  comparten `BodyProps`, así que `PanelInGrid` se la pasa a todos y la
  declaración de quién la usa es **destructurarla o no**: hoy solo `KpiBody`.
  Verificable con `grep`, y esa es la forma correcta del criterio — el que se
  escribió primero pedía «el que no la usa no la recibe», que con un tipo de
  props compartido no se puede cumplir sin partirlo en dos, y partirlo sería
  peor: el día que un segundo cuerpo la use no habría nada que cambiar.
  *Criterio corregido por la auditoría del 2026-09-14; el cierre lo
  reinterpretaba y un criterio que el cierre reinterpreta no es un criterio.*

**Cerrada el 2026-09-14, y dejó de ser teórica ese mismo día.** Al correr la
consola contra el servicio real apareció la evidencia: el payload traía

    "presentation": { "label": "USD · TOTAL",
                      "meter": { "label": "PERFORMANCE WEIGHT", "percentage": 61,
                                 "note": "USD 2.61M OF USD 4.28M" },
                      "comparative": [ { "label": "VS PREVIOUS MONTH", "delta": 6.4 },
                                       { "label": "VS PRIOR YEAR",     "delta": 11.2 } ] }

y la pantalla mostraba **`TOTAL` y `4.28M`**, nada más. `TOTAL` ni siquiera era
ese label: era el default de `KpiBody`. El dato llegaba, el adaptador lo
traducía, y se perdía en el último salto.

**El arreglo son dos líneas y un cambio de tipo.** `PanelInGrid` pasa
`payload.presentacion`, y `KpiParams` deja de llevar datos —`label`,
`comparativo`, `medidor` con su contenido— para llevar los dos interruptores que
el layout sí decide. Ausente muestra lo que el payload traiga; solo un `false`
explícito oculta. Con el interruptor en `true` y sin dato no se inventa nada: el
interruptor dice «acá va», no «inventá uno».

**Las pruebas del cuerpo fijaban el defecto.** `KpiBody.test.tsx` metía el
rótulo y el medidor en `params`, así que pasaban con el cuerpo leyendo del
layout — la prueba verificaba que el bug funcionara. Movido el helper a
`presentation`, y agregada la que faltaba: **el mismo layout con otro payload
cambia el medidor**, que es la garantía por la que `Presentacion` existe.

**Y una de superficie, porque un cuerpo solo no puede verla.** `KpiBody` prueba
que pinta lo que le pasan; lo que faltaba era que ALGUIEN se lo pasara. La cadena
`batch → adaptPayload → ConsoleContainer → PanelInGrid → Body` son cuatro saltos
—la que `CLAUDE.md` nombra— y ninguna prueba la recorría entera con presentación.

**Verificada por mutación, tres casos:** nadie pasa la presentación (el estado de
ayer, 1 falla), el rótulo vuelve al layout (4 fallas), el medidor se descarta (6
fallas). Y confirmada en pantalla contra el servicio real.

**Sobre el criterio de «el que no la usa no la recibe»:** los doce cuerpos
comparten `BodyProps`, así que `PanelInGrid` la pasa a todos y la declaración es
no destructurarla. Once no la tocan. Dejarlo así y no partir el tipo es lo
correcto mientras `Presentacion` siga siendo opcional en el contrato — el día que
un segundo cuerpo la use, no hay nada que cambiar.

#### ➕ F1.41 ✅ Los nombres de los params, del cable al contrato
**Descripción.** `PARAM_SCHEMAS` espera los params en español —`maximo`,
`horizonte`, `orden`, `tope`, `normalizacion`, `pilares`, `columnas`, `banda`,
`corte`, `ventana`— y el cable los manda en inglés: `maximum`, `horizon`,
`order`, `cap`, `normalization`, `pillars`, `columns`, `band`, `cut`, `window`.
La tabla `blocks` los declara en `layout_params`.

**El caso que lo hace urgente es `gauge`.** El backend **exige**
`options.maximum` y emite `ERROR` si falta, así que el panel siempre llega con
`{ maximum: 100 }`. `GaugeBody` espera `maximo`. `adaptPanelParams` descartaba
`maximum` por desconocido y **el panel mostraba «Sin máximo declarado» teniendo
el dato en la mano**.

*Corregido el 2026-09-15 al escribir la prueba:* esta descripción decía antes que
«el arco se dibuja contra otro máximo, en silencio». **Era falso.** `GaugeBody`
comprueba `maximo === undefined` y **se niega a dibujar** — que es lo correcto, y
por eso el defecto se veía en pantalla en vez de esconderse. El error era del
diagnóstico, no del código. Lo mismo `forecast` con
`horizon`.
**Criterio de aceptación.**
- El mapeo vive en el adaptador de `api/` y en un solo lugar, junto al de
  familias y formas.
- Un param del cable que el mapeo no conoce **se reporta**, no se descarta: es la
  misma regla que `unknownParams` ya aplica, y ahora con dos vocabularios hay el
  doble de superficie para que uno se pierda.
- `paramsDisponibles` que llega de `/config/blocks` se traduce con la misma
  tabla, para que la validación compare peras con peras.
- Un `gauge` del seed dibuja su medidor contra el `maximum` que mandó el
  backend. Verificado cambiando el valor en el fixture y viendo moverse el arco.
- Queda declarado qué params del cable **no tienen contraparte** —`brand`,
  `components`, `interval_level`, `stats`, `scale`, `clustering`, `reference`,
  `profile_cap`, `cuts`— y por qué: son de los tres cuerpos que no existen y de
  opciones que ningún cuerpo lee todavía.

**Cerrada el 2026-09-15.** La tabla vive en `api/adapt.ts` **junto a la de formas
y la de familias**, que era la mitad del criterio: tres tablas de traducción en
tres archivos es cómo una se queda atrás.

Trece nombres traducidos, y los nueve sin contraparte **pasan sin tocar** para que
`validateParams` los reporte. Descartarlos en el adaptador habría sido peor: el
panel se vería igual y quien compone no sabría por qué su opción no hace nada.

**`paramsDisponibles` se traduce con la MISMA tabla**, y eso no es simetría
estética: `validateParams` exige que el param esté en el esquema **y** en esa
lista, así que traducir un lado y no el otro haría que todo saliera desconocido —
el mismo síntoma que no traducir nada, y más difícil de encontrar.

**Y el fixture de `ConsoleContainer` dejó de mentir.** Tenía `layout_params` en
español con la deuda anotada al lado —«no es fiel al cable»—, puesta ahí cuando
se escribió F1.33. Ahora manda `order` y `cap`, como el servicio.

**Verificada por mutación, tres casos:** sin el mapeo de `maximum` (3 fallas),
`cuts` traducido por descuido (1), y traducir el panel pero no la lista (2).

### La corrección que trajo esta tarea

**«El arco se dibuja contra otro máximo, en silencio» era falso**, y se repitió
en el plan, en `CLAUDE.md` y en el análisis desde que se abrió F1.41.

`GaugeBody` comprueba `maximo === undefined` y **se niega a dibujar**: muestra
«Sin máximo declarado · no se puede leer como proporción». El defecto real era
otro y peor de explicar aunque mejor de detectar — el backend manda el máximo, el
adaptador no lo traducía, y **el panel declaraba que no lo tenía teniéndolo**.

Lo encontró **leer el cuerpo al escribir su prueba**, no una revisión. Es el
recordatorio de por qué las pruebas se escriben desde el contrato y el código y
no desde lo que uno cree que pasa: el diagnóstico venía repitiéndose sin que
nadie abriera el archivo.


---

#### ➕ F1.42 ⚠️ El mes en curso está incompleto y el selector no lo dice · 🔒 el período no declara QUÉ PARTE del mes cubre
**Verificado el 2026-09-26 contra el servicio corriendo** · commit `8633b10`. **EL CANDADO CAMBIÓ DE RAZÓN, NO VENCIÓ.** Decía «`Periodo` no declara si está cerrado» y eso llegó con B1.27: `open_period` está en `/config/me`, el adaptador lo lee como `enCurso` y `PeriodPicker` ya pinta «· en curso» y su aviso.

**Lo que falta es el otro bullet del criterio**: «con qué parte del mes cubre». El período llega como cadena suelta —`"2026-09"`— así que `rango` nunca se define y esa línea no se pinta nunca.

**Y no se puede derivar**, que es lo que el propio criterio prohíbe: «el texto sale de lo que el período declara, **no de comparar contra `new Date()`**». Tener `tenant.timezone` desde hoy no lo cambia — el reloj seguiría siendo el del navegador.

**Cerrado el 2026-09-28 con `periods_detail`.** El `.pen` dibuja `1 – 31 JUL 2026`, que es exactamente `[start, end)`, y el `MTD CERRADO` de al lado sale de comparar contra `open_period`. Lo que falta es dibujarlo, y es nuestro. Pedía: **que cada período declare su cobertura** — qué parte del mes abarca el que está en curso. El `.pen` lo dibuja en B5: «PERÍODO · 1 – 31 JUL 2026». Hoy `periods` son doce cadenas y `open_period` dice **cuál** está abierto pero no **cuánto** lleva.

**Este pedido no estaba registrado**: la tarea tenía `🔒` y ninguna `**Espera del backend.**`, así que su hueco nunca llegó a `PARA-BACKEND.md`. Es el segundo caso del día — el otro fue B4.9.

**Espera del backend.** Que `availablePeriods()` normalice al día 1 antes de
restar meses. **Medido contra `de881e1` el 2026-09-29**: `GET /config/me` devuelve
doce entradas que **no son doce meses distintos** — `['2026-09', …, '2026-04',
'2026-03', '2026-03', '2026-01', …]`, marzo dos veces y **febrero ausente**, en
`periods` y en `periods_detail`.

Es `internal/core/services/dd_config_service.go:690`, que resta con
`now.AddDate(0, -i, 0)` sin normalizar el día: el 29 de septiembre menos siete
meses cae en «29 de febrero», que no existe, y Go desborda al 1 de marzo.
Reproducido con su misma aritmética: **pasa 29 días de los 365** —los 29, 30 y 31
de un mes cuyo mes objetivo es más corto—, y los otros 336 la lista sale bien. Por
eso nunca se había visto.

**El arreglo ya está escrito en su propio repositorio**: `snowflake/period.go:66`
hace `firstOfMonth(now).AddDate(0, -i, 0)`, que es exactamente lo que falta acá. Y
`dd_seed_panel_data.go:123` repite el patrón sin normalizar, así que conviene
mirarlo en la misma pasada.

**Lo nuestro ya está hecho y no espera**: el adaptador colapsa los ids repetidos
—`id` es una clave que atraviesa el batch, la caché y el hilo del chat— con la
respuesta capturada como fixture. **Lo que el front no hace es rellenar el mes que
falta**: no sabe si el servicio no lo tiene o no lo quiere dar, y ofrecer un
período que el batch va a rechazar es peor que no ofrecerlo. Hasta que normalicen,
29 días al año la consola ofrece once meses y no doce. · Bloquea nada, **degrada
F1.42**.

**Descripción.** El equipo de datos avisó el 2026-09-15 que
`GLD_ECOMM_DAILY_PERFORMANCE` tiene filas hasta **dic-2028 con valores en 0**
—metas de planeación— y que **el mes en curso está incompleto**.

**La mitad de ese aviso no aplica, y conviene devolvérselo.** Lo verificamos
contra el código: `availablePeriods()` genera **doce entradas hacia atrás desde
hoy** y nunca una futura, así que la consola no puede ofrecer dic-2028. Esa
preocupación es real para quien consulte Snowflake a mano, no para el front.

**Pero «los últimos doce meses» era de más, y lo dijimos hasta el 2026-09-29.**
Son doce entradas, no doce meses distintos: 29 días al año una se repite y se come
la anterior. Está medido en la espera de arriba. Es la clase de afirmación que se
vence sin que nadie lo note — leída del código y cierta salvo en el detalle que no
se miró.

**La otra mitad sí, y es nuestra.** El mes en curso se ofrece igual que los
cerrados, y `PeriodPicker` no lo distingue: alguien compara septiembre contra
agosto y lee una caída que es «el mes todavía no terminó». Es el mismo problema
que un panel degradado mostrando un número aproximado — **la cifra es correcta y
la lectura es falsa**.

El `.pen` ya lo dibuja en B5: «PERÍODO · 1 – 31 JUL 2026 · **MTD CERRADO**».
**Criterio de aceptación.**
- El período en curso se marca como **parcial**, con qué parte del mes cubre. No
  se deshabilita: mirar el mes en curso es legítimo, lo que no es legítimo es que
  se vea igual que uno cerrado.
- El texto sale de lo que el período declara, **no de comparar contra `new
  Date()` en el front**: el corte del día es del tenant y su huso, no del
  navegador · la regla de las dos zonas horarias.
- **Eso lo hace esperar un campo**: hoy `Periodo` no declara si está cerrado. Va
  pedido a backend.

**Parcial el 2026-09-22.** Se hizo la mitad que se podía, y la otra mitad está
declarada en vez de inventada.

**El bloqueo se movió y por eso se pudo tomar.** Decía «el período llega como
cadena suelta», y eso dejó de ser cierto: `open_period` existe **en el fork**
—lo escribimos nosotros en `2fafe82`, B1.27— aunque `82da946` no lo traiga. Se
construye contra el fork y queda en ⚠️ hasta que se despliegue, que es
exactamente el camino de F4.3 y F4.12.

**Lo hecho**, de punta a punta:

| | |
|---|---|
| El cable | `open_period` transcripto en `/config/me`, marcado `x-origen: fork` |
| El contrato | `Periodo` gana **`enCurso`**, que es un HECHO y no el texto de `estado` — con texto libre el front no puede decidir sin parsearlo |
| El adaptador | Marca el que el cable declara. **Sin el campo no marca ninguno**: es el comportamiento de antes, y es la respuesta correcta — no sabemos cuál está abierto |
| El selector | `2026-09 · EN CURSO` en el chip, y la razón debajo **cuando está elegido**, que es cuando la lectura puede salir falsa |

**No se deshabilita**, que el criterio lo pide con todas las letras: mirar el mes
en curso es legítimo. Y **se marca con una palabra, no con un color** — un chip
teñido diría «atención» sin decir de qué, y el `.pen` lo resuelve con una
palabra al lado del rango: «1 – 31 JUL 2026 · MTD CERRADO».

**Lo que falta para ✅ es «con qué parte del mes cubre».** El criterio lo pide y
el cable no manda ni `rango` ni `estado` —los dos están en el contrato interno,
con los literales del `.pen`—, así que el chip dice que está en curso y no dice
«1 – 9 SEP». Inventarlo obligaría a contar días contra `new Date()`, que es el
bug de las dos zonas horarias que el propio criterio prohíbe.

Ocho pruebas, cinco mutaciones cazadas —marcar el primero, marcar sin el campo,
perder la palabra, deshabilitarlo y pintar la razón siempre—. Verificado
abriéndolo contra el servicio local.

#### ➕ F1.43 ✅ Los TIPOS de los params, no sólo sus nombres
**Descripción.** F1.41 tradujo los NOMBRES de los params del cable al contrato y
dejó abierta la otra mitad: que el tipo que `PARAM_SCHEMAS` declara sea el que el
cuerpo lee.

**No lo era, y costó seis de doce paneles.** F1.40 mudó el rótulo, el medidor y
los comparativos de `opciones` a `presentacion` — los escribe el backend, no
quien compone el layout. `KpiParams` pasó ese día a declarar dos **interruptores
booleanos**, y `PARAM_SCHEMAS` se quedó diciendo `array` y `object`, que era la
forma anterior. El servicio manda `{"meter": true, "comparative": true}` en seis
de los doce paneles del layout sembrado, el validador los rechazaba, y los seis
salían BLOQUEADO diciendo «"medidor" tiene el valor true y espera un objeto».

**Nada lo vio.** No el compilador —las dos mitades no se tocan—, no el lint, no
las pruebas, y **no MSW**, cuyos mocks nunca mandaron `meter`. Es el modo de
falla de F1.38 otra vez: un mock que habla el idioma de nuestra capa interna no
prueba la frontera, la esconde. Se midió abriendo la consola contra el binario
local.

**Criterio de aceptación.**
- `ParamSpec` gana el `kind` que faltaba —`boolean`— y `kpi` declara sus dos
  params como los interruptores que son. `label` sale: `KpiBody` lo lee de
  `presentacion` desde F1.40 y `/config/blocks` tampoco lo declara.
- La deriva **deja de ser verificable y pasa a ser imposible**: un cruce de tipos
  en `tests/api/params-esquema.ts` compara la tabla contra los `*Params` de los
  doce cuerpos en `npm run typecheck`, en los dos sentidos —nombres exactos, y el
  tipo que cada `kind` deja pasar—. Lo único que no comprueba es el contenido de
  `array` y `object`, y está escrito por qué.
- La prueba usa el payload **capturado**, no uno inventado: los doce paneles con
  sus `options` tal como los devuelve `GET /config/tabs/{id}`, con fecha.
- Se verifica **abriendo la consola**, que es donde el defecto vivía.

**Cerrada el 2026-09-22.** Los seis `kpi` dibujan medidor y comparativos contra
el servicio local. Siete mutaciones sobre el cruce de tipos y tres sobre las
pruebas de runtime, todas cazadas — **la primera versión del cruce eximía
`array` y `object` enteros y dejaba pasar justo la deriva que lo motivó**; se
acotó la exención al contenido. El conteo «siete paneles kpi» se escribió de
memoria y **lo corrigió una aserción antes del commit**: son seis.

#### ➕ F1.44 ⚠️ El orden de una tabla se anuncia, no se aplica · 🔒 `cut` de `series` no lo lee nadie
**Descripción.** Después de F1.43 quedaba **un solo panel de los doce en
BLOQUEADO**: «Investment and return by platform», porque el cable manda
`{"order": "investment"}` —el nombre de una columna— y `TableBody` ordenaba con
`{ columna, direccion }`. La lectura inicial fue que faltaba la dirección y que
era pregunta para el backend.

**Era nuestra, y las tres fuentes lo decían.** Se miraron el 2026-09-22:

| Fuente | Qué dice |
|---|---|
| El cable | `{"order": "investment"}` · el nombre de la columna, sin dirección |
| El `.pen` · `§6 · Sec · table armado` | La BASE dice «ORDENADO POR INVERSIÓN» y la nota al pie lo repite. **El encabezado no marca la columna**: los seis rótulos llevan el mismo `$dim` y ninguno tiene flecha |
| El payload | Llega **ya ordenado** · 412K · 318K · 148K · 96K · 41K · 25K, el mismo orden y los mismos números que el `.pen` dibuja. Y su `governance.base` dice «MONTH · SORTED BY INVESTMENT» |

Así que el orden de una tabla **se declara en la BASE, no se ejecuta en el
front**. Ordenar acá era reordenar lo que ya venía ordenado, con una dirección
que habría que elegir — y elegirla es la invención que el adaptador tiene
prohibida: una tabla ordenada al revés se ve perfecta y miente.

**Lo que enseñó, que es la mitad que vale.** El bloqueo lo habíamos escrito
nosotros esa misma mañana, con la conclusión razonada y sin abrir el `.pen`. El
dibujo estaba a tres líneas de Python. **Es la regla de septiembre otra vez**, y
esta vez costó un panel y media hora en vez de cuatro tareas.

**Dos diferencias más contra el `.pen`, anotadas y no corregidas** —son del dato,
no del render—: el dibujo tiene **seis columnas** y el servicio manda cinco,
falta **CPA**; y la participación se dibuja «39.6%» donde la celda sale «39.6»,
porque la columna no declara unidad.

**Contestado el 2026-09-28.** `series.cut` es la granularidad declarada del panel y ningún código suyo la lee; el índice del pronóstico se renombró a **`horizon_cut`**, así que la ambigüedad desaparece. Era: qué significa `cut` en un panel `series`. El cable lo
declara en `layout_params` de `series` y de `forecast`, y el layout sembrado
manda `{"cut": "day"}` y `{"cut": "month"}`. En `forecast` es el punto donde
termina lo observado y empieza la proyección —un índice— y así lo lee
`ForecastBody`; en `series` parece granularidad, que es otra cosa con el mismo
nombre. **Y el dato no permite deducirlo**: los dos paneles traen las mismas
ocho estampas mensuales —`jan`, `feb`, `mar`…— sin importar el `cut`, así que el
que declara `31 DAYS` en su BASE **dibuja ocho puntos mensuales**. Eso es una
segunda cosa que revisar, y hasta que alguna de las dos se aclare el param se
descarta con aviso en vez de leerse mal. · Bloquea **F1.44**.

**Criterio de aceptación.**
- Ninguno de los doce paneles del layout sembrado queda en BLOQUEADO, y el de
  tabla dibuja sus seis filas en el orden en que llegan. **Verificado abriéndolo**,
  no sólo con pruebas.
- `TableBody` no ordena y `orden` sale de `TableParams` y de `PARAM_SCHEMAS`: un
  param que nadie lee se descarta como desconocido, que es la regla de
  `api/params.ts` y acá además es cierto. El cruce de tipos de F1.43 obliga a que
  las dos mitades se muevan juntas — y lo hizo: quitar una sin la otra rompió
  `typecheck`.
- La prueba que verificaba el ordenamiento **se reemplaza, no se borra**: la
  nueva afirma la garantía nueva —las filas se dibujan en el orden en que
  llegan— con un fixture desordenado a propósito, para que pueda fallar.
- `cut` de `series` o se lee —con su nombre y su `ParamSpec`— o sale de
  `layout_params` de `series`. **Queda pendiente**: es lo único de esta tarea que
  no depende de nosotros, y por eso la tarea está en ⚠️ y no en ✅.

**Parcial el 2026-09-22.** La mitad de la tabla está cerrada y verificada en
pantalla: doce de doce paneles dibujando, cero en BLOQUEADO. La de `series`
espera respuesta.

**Espera del backend.** Que `cut` salga de `layout_params` de `series`, o que
digan quién lo lee. **Medido contra `de881e1` el 2026-09-29** y verificado en su
repositorio: **las dos mitades del candado vencieron y apareció la respuesta
real, que es que el param no hace nada.**

| Lo que decía este bloqueo | Lo medido el 2026-09-29 |
|---|---|
| «no se sabe qué significa `cut` en `series`» | Contestado: es la granularidad declarada, y el índice del pronóstico se renombró a `horizon_cut`. Verificado en `dd_seed_blocks.go:44,48` y `manual_migrations.go:190`, no en su prosa |
| «el dato no permite deducirlo: los dos paneles traen las mismas ocho estampas mensuales sin importar el `cut`» | **Falso ahora.** `cut=month` trae **12** estampas mensuales —`2025-10-01`, `2025-11-01`…— y `cut=day` trae **28** diarias —`2026-09-01`, `2026-09-02`…— |

**Pero el grano no sale de `cut`: sale de la MÉTRICA.** `git grep '"cut"'` sobre
`de881e1` lo encuentra en tres lugares —la semilla del panel, la declaración del
param y la migración— y **en ningún lector**. Los dos paneles difieren porque son
dos métricas distintas, `daily_trend` y `twelve_month_efficiency`, materializadas
cada una a su grano natural. Ellos ya lo dijeron: «ningún código suyo la lee».

**Y el `.pen` tampoco le da dónde dibujarse.** `Plot/CONSOLA · Tendencia diaria`
son cuatro líneas de grilla en `$w2` y los trazos: **ni eje de tiempo ni rótulos
ni marcas**, que es exactamente lo que `PlotSeries` implementa. Leído el
2026-09-29.

Así que la cuarta viñeta del criterio se resuelve por su segunda rama y no por la
primera: **declararlo en `PARAM_SCHEMAS` sería declarar un param que nadie lee**,
que es lo que el encabezado de `api/params.ts` prohíbe en dos párrafos y lo que ya
se decidió para `orden` de `table` en esta misma tarea. El front lo sigue
descartando como desconocido, con aviso en desarrollo, y eso es la respuesta
correcta. · Bloquea **F1.44**.

**Y `min_grain` quedó anotado aparte, que es de DATOS.** Las dieciocho métricas
del catálogo declaran `min_grain: 'month'`, **incluida `daily_trend`**, que viene
de Snowflake —`catalog_version=3`, fuente «Reporte **diario** de ecommerce del
cliente»— y cuyo panel sirve 28 puntos diarios. `coarsestRequired` toma el más
grueso de la pestaña, así que con las dieciocho en `month` el selector no puede
ofrecer días ni semanas **para ninguna pestaña**.

Hoy no se ve: los doce períodos que el servicio manda son todos mensuales, y
`PeriodPicker` sólo pinta los granos que tienen períodos. **Se ve el día que haya
períodos diarios o rangos libres, que es F5.13** — y es un segundo bloqueo de esa
tarea que no estaba escrito. La columna es `SYNAPSE_METRIC_CATALOG.MIN_GRAIN`, así
que es de la misma familia que las seis filas de `SEMANTIC_DIRECTION`.


## Fase 2 — Los estados de materialización en pantalla

Depende de B2.5–B2.7 para los estados REALES: hasta que el backend los emita,
solo se pueden probar contra el seed (B1.20) o contra MSW.

**Arrancada el 2026-09-03**, en cuanto B0.9 contestó la 1171. Lo primero que
apareció al abrirla: **MSW emitía únicamente `DISPONIBLE`**, así que los otros
cinco estados nunca habían atravesado el contenedor, el adaptador de params ni
el registro de cuerpos. Estaban probados a nivel de componente —con payloads
montados a mano— y ni una vez de punta a punta. Eso es
`tests/surfaces/console/states.test.tsx`, 29 pruebas.

### F2.1 ✅ `DEGRADADO`
**Criterio de aceptación.** Muestra **la cifra**, más `razon` y `desbloqueaCon`.
El badge lo pinta el shell. El front **no decide** si algo está degradado.

**Cerrada el 2026-09-03.** Ya estaba implementado desde F1.13d; lo que faltaba
era la prueba de punta a punta. La aserción que la hace valer es la negativa:
el mismo `valor` con estado `DISPONIBLE` **no** pinta el badge, que es lo que
demuestra que sale del `estado` del backend y no de una heurística del front.

### F2.2 ✅ `BLOQUEADO`
**Criterio de aceptación.** Sin cifra y sin aproximación. Razón, qué lo
desbloquea y CTA. El shell conserva título y BASE.

**Cerrada el 2026-09-03**, con una salvedad escrita: **el CTA no se pinta**, y
es correcto. La consola no pasa `onUnblock`, y la regla del CTA muerto dice que
un botón sin manejador no se dibuja —«un botón que se aprieta y no hace nada es
peor que uno ausente»—. El estado no queda sin salida: el detalle sigue
diciendo qué lo desbloquea. Cuando exista a dónde mandar el desbloqueo, se
cablea.

La prueba de «sin aproximación» no busca un texto: busca que no haya **ninguna
forma de cifra** en el panel —ni `USD `, ni `4.28M`, ni miles con separador—,
porque un número aproximado que se cuele no va a llamarse como el fixture.

### F2.3 ✅ `SIN_PERMISO` · con el copy del servicio y sin CTA
**CERRADA EL 2026-09-29 · y se cerró resolviendo NOSOTROS, no esperando.**

El candado decía que `/config/solicitudes` daba 404. **Sigue dando 404 y ya no importa**: el backend contestó ese día que **la ruta no está planeada**, y que mientras tanto el estado se pinta sin CTA. Es lo que este repositorio ya proponía — «un botón que se aprieta y devuelve 403 es peor que un botón ausente».

**Y al mirarlo apareció que la mitad que sí había llegado estaba sin usar.** Pedimos `reason` y `unlocks_with` para `FORBIDDEN`, llegaron en `de881e1`, y `ForbiddenState` seguía pintando una frase **nuestra** escrita a mano: «Esta métrica no está disponible para tu rol». Eso es el adaptador inventando copy de producto, que la regla prohíbe — el dueño del texto que describe datos es quien los emite.

**El modo de falla no avisa**: el campo llega, el front lo ignora, y la pantalla se ve bien. Un día entero así.

Cableado de punta a punta —contrato, adaptador, `Panel`, estado— con la frase nuestra degradada a **respaldo** para un servicio que no las mande.

**Y la mutación encontró el hueco de las pruebas.** Revertir el adaptador mataba una prueba; **revertir el ESTADO a su frase fija pasaba las 53**: se verificaba que el campo viajara y ninguna que se pintara. Es el mismo modo de falla que la cadena de `chart`. Se agregó la que faltaba, y ahora mueren las tres mutaciones.

**Lo único que no se hace es el CTA**, y queda dicho por qué: no hay a dónde llevar.

**Criterio de aceptación.** Muestra `solicitarA` y ofrece pedir acceso. Si D3
resuelve conservar el viaje de solicitud, se cablea contra
`/config/solicitudes`: la solicitud ya hecha sale del servidor y **no de estado
local** —con estado local, recargar borraba el pedido y la consola volvía a
ofrecer el CTA como si nada.

**Parcial el 2026-09-03.** La mitad que se puede hacer sin backend está hecha y
probada: el estado llega del batch y nombra el rol que decide. **Falta el CTA**,
y falta entero: `/config/solicitudes` ya existe en el contrato —línea 591,
`operationId: solicitarAcceso`—, así que lo que queda es cablearlo y leer del
servidor las solicitudes ya hechas.

**Medido el 2026-09-22, y el bloqueo es más preciso de lo que decía.** El
servicio **sí** tiene una ruta de solicitud —`POST /access-requests`,
`accessRequestHandler.Submit`— pero es la del **login**: «no tengo cuenta», ya
transcrita en `synapse-auth.yaml` y usada por `RequestAccess`. **No es la de
esta tarea**, que es un usuario con cuenta pidiendo acceso a una métrica que su
rol no recibe.

**Y falta la mitad que importa en las dos**: la única ruta que LISTA solicitudes
es `GET /admin/access-requests`, que es sólo para administradores. Un usuario de
consola **no puede leer si ya pidió**, y ése es exactamente el motivo por el que
el criterio dice «no de estado local» — con estado local, recargar borraba el
pedido y la consola volvía a ofrecer el CTA como si nada. Hay una prueba que fija el estado actual:
verifica que el botón **no** esté, para que aparezca el día que se cablee y no
antes.

### F2.4 ✅ `ERROR` con reintento por panel
**Criterio de aceptación.** El reintento re-pide **ese** panel, no el batch
entero. El mensaje es el del backend, no uno inventado por el front.

**Cerrada el 2026-09-03, y era un defecto real.** `ConsoleContainer` pasaba
`onRetryPanels={() => void batch.refetch()}`: apretar «Reintentar» en el panel
que falló volvía a pedir **los N paneles**, y los N−1 que habían cargado bien
parpadeaban. Se reemplazó por `useRetryPanel`, que pide ese panel —el mismo
endpoint con una lista de uno, que el contrato ya soporta porque declara fallo
parcial— y funde el resultado con `setQueryData`. **No `invalidateQueries`**:
invalidar dispara de nuevo la consulta original, o sea los N, que es el mismo
defecto por otro camino.

La prueba necesita **dos** paneles: con uno solo, «re-pedir el batch» y
«re-pedir ese panel» son la misma llamada y no distinguen nada. Verificada por
mutación: con el `refetch()` viejo llegaban `['p-1','p-2']` donde va `['p-1']`.

### F2.5 ✅ Frescura relativa en la procedencia
**Criterio de aceptación.** «hace 3 h» calculado contra el `ahora` que baja por
props. Refleja cuándo se materializó (B2.10), no cuándo se abrió la página.

**Cerrada el 2026-09-03.** Ya venía de F1.13e: `format.freshness` lee
`payload.frescura` —que es cuándo se materializó— contra un `now` único por
pantalla. Faltaba la prueba de punta a punta, y se escribió con la distancia
calculada en el momento y no con una fecha quemada: una fecha fija diría «HACE
8000 H» el año que viene y habría que tocarla.

### F2.6 ✅ Gobierno visible en los seis estados
**Criterio de aceptación.** Incluso cargando: la BASE sale de `Metric.base` del
catálogo (D6). Es la garantía de §5.2 verificada estado por estado.

**Cerrada el 2026-09-03.** La prueba que la hace valer de verdad es una sola:
`BLOQUEADO`, `SIN_PERMISO` y `ERROR` **no llevan `Gobierno`** —el contrato lo
intersecta solo en los dos estados con cifra—, así que si la BASE sigue en
pantalla con un payload que no la trae, es porque salió del catálogo. Eso es D6
verificada y no declarada. La prueba además **afirma que el fixture no trae
`base` ni `capa`**, para que agregárselos no la deje verde sin verificar nada.

#### ➕ B2.14 ⬜ `/config/solicitudes` · pedir acceso a una métrica que no se ve
**Espera del backend.** **La ruta no existe** · medido el 2026-09-28: `GET /config/solicitudes` da **404**.

**Lo tiene: PRODUCTO** · decidir si existe una ruta de solicitud. **La mitad que nos bloqueaba llegó**: el estado ya declara razón y desbloqueo, así que F2.3 se puede construir sin CTA.

**Medido contra `de881e1` el 2026-09-29** · `GET /config/solicitudes` → **404** · y el payload `FORBIDDEN` es `{status, request_from}` y nada más.

**Bloquea F2.3.** Y el hueco tiene una forma concreta: el payload `FORBIDDEN` es hoy `{status, request_from}` **y nada más** —medido pidiéndole al token de `planner` los tres paneles que su rol oculta—. Sin `reason` ni `unlocks_with`, que es la gramática de §8 que los otros cinco estados sí traen.

**Así que son dos cosas y conviene no mezclarlas:** que el estado declare qué lo desbloquea, y que exista dónde pedirlo.

**Criterio de aceptación.**
- `FORBIDDEN` trae `reason` y `unlocks_with`, redactados, como los otros estados.
- La redacción **no promete una acción que no existe**: mientras no haya ruta de solicitud, `unlocks_with` dice a quién pedirle, no «solicitá acceso».
- Si se decide que no va a haber ruta de solicitud, **eso cierra F2.3** con el estado declarado y sin CTA — un botón que devuelve 404 es peor que su ausencia.

**CONTESTADO EN PARTE EL 2026-09-28.** Sobre la ruta: *«Es decisión de producto y la llevamos. Mientras tanto el estado ya viene declarado, así que pueden pintarlo **sin CTA**; si producto dice que sí, la ruta sería `POST /config/access-requests` reusando el flujo de `access_requests` que ya existe».*

**Coincide con lo que habíamos propuesto**, así que el camino de F2.3 queda claro: pintar el estado sin CTA.

**Y LA MITAD QUE LO DESBLOQUEA LLEGÓ** · medido el 2026-09-29 contra `de881e1`:

```
FORBIDDEN
  reason       : Tu rol no tiene acceso a esta métrica
  unlocks_with : Pedile al administrador del tenant que la habilite para tu rol
  request_from : admin
```

**Con eso F2.3 se puede construir**: el estado ya declara qué pasa y qué lo desbloquea, y la redacción **no promete una acción que no existe** — dice a quién pedirle, no «solicitá acceso». Es exactamente lo que el criterio pedía.

**Lo que sigue esperando es sólo la ruta**, y es decisión de producto de su lado.

#### ➕ B2.15 ⚠️ Encender `DD_MATERIALIZE_PROSE_ENABLED` y avisar
**Espera del backend.** **Corregir `locale`, `currency` y `timezone` del tenant de
UA MX**, que hoy son colombianos —`es-CO`, `COP`, `America/Bogota`— por el
**default de la columna** en `internal/core/domain/tenant.go`. **Medido contra
`de881e1` el 2026-09-29** al probar la prosa: el agente redactó el resumen del
mes en **pesos colombianos para un cliente mexicano**.

**El caro es el huso**, no la moneda: el corte del día del negocio sale del
tenant, y un tenant mexicano cerrando el día en Bogotá produce cifras plausibles
y no auditables — que es justo lo que la regla de las dos zonas horarias existe
para impedir. Y el `locale` mete el separador de miles colombiano en TODAS las
cifras de la consola, no sólo en la prosa.

Pedido en `docs/MENSAJE-2026-09-29-backend-tenant-colombiano.md`, con la
propuesta de que los tres pasen a ser obligatorios al crear el tenant: **un
default que nombra un país es una decisión sobre el próximo cliente que nadie va
a tomar a conciencia.** · Bloquea nada, **ensucia todo**.

**PROBADO ACÁ EL 2026-09-29, Y ANDA.** No hacía falta esperar al despliegue para
saber si funciona: el flag es del binario y el agente de Cortex contesta desde el
24. Levantado con `DD_MATERIALIZE_PROSE_ENABLED=true` contra `de881e1` y con
`POST /admin/tenants/{id}/materialize` sobre `2026-09`:

```
run: available 18 · blocked 0 · errors 0 · preserved 0 · 45 s
executive_summary → AVAILABLE · «En septiembre de 2026 los ingresos alcanzaron
  COP 1.144.876, un avance de 24,6% frente al mes anterior (COP 918.978)…»
decisions         → AVAILABLE · con pilares · «Frenar: erosión…», «Vigilar:
  brecha en órdenes», con su nota cada uno
```

**Resuelve las tres cosas que estaban mal en esos dos paneles:**

| Antes | Ahora |
|---|---|
| El texto de la semilla, en **inglés** | En **español**, porque el generador recibe el `Locale` del tenant |
| **La misma cifra en todos los períodos** —«USD 4.28M»— | Las del período materializado, con su comparación contra el mes anterior y el mismo mes del año pasado |
| `DEGRADED` con dato de tres semanas | `AVAILABLE` con la frescura de la corrida |

**Y la prosa NO pasa por el registro de consultas de Snowflake**, que es lo que
hacía que estas dos salieran `BLOCKED · No Snowflake query registered` en los
demás períodos: `dd_materializer_service.go:139` evalúa la rama de prosa **antes**
del bloqueo, así que con el generador puesto el `Blocked: true` de `exec_resumen`
y `month_decisions` no aplica.

**Queda en ⚠️ y no en ✅** porque lo que la tarea pide es que se encienda **en
dev**, y eso sigue siendo del equipo de despliegue. Lo que cambia es que ya no es
una apuesta: está medido.

**UNA MEDICIÓN FLOJA, ANOTADA PORQUE ES BARATA DE REPETIR.** La primera lectura
dijo que `executive_summary` no se había regenerado. Era falso: la ruta devuelve
**202 y corre asíncrono**, y se consultó antes de que terminara. El `status` de la
corrida —`/admin/materialize/runs`— es lo que dice cuándo mirar.

**Espera del backend.** **Que se encienda en dev y nos avisen** — lo ofrecieron ellos en `docs/RESPUESTA-2026-09-28-cinco-que-quedan.md` §5: «lo prendemos en dev en la próxima corrida diaria… Les avisamos el día que se prenda para que puedan cerrar la tarea contra dato real».

**Lo tiene: DESPLIEGUE** · prender el flag en dev después del próximo despliegue. **Fecha, no código.**

**Medido contra `de881e1` el 2026-09-29** · `ProseGeneratorEnabledFromEnv` lee el flag con default `false`.

Hasta entonces los dos paneles de prosa se sirven con el valor de la semilla, **en inglés**, y salen `DEGRADED`.

**Criterio de aceptación.**
- Los dos paneles traen `governance.source = agent:<nombre>` y un `headline`, no el valor de la semilla.
- Queda registrado contra qué corrida y con qué agente se verificó.
- **Es lo último que le falta a B2.12** para dejar de tener dos paneles sirviendo maqueta.

#### ➕ B2.16 ✅ El materializador emite `presentation`
**EL PEDIDO NO HACÍA FALTA · verificado el 2026-09-28 contra `f70cec2`, antes de mandarlo.**

Se escribió desde `docs/MENSAJE-2026-09-24-materializador.md`, que el 24 decía que el materializador no emitía `presentation` y que al correr pisaba la de la semilla, dejando **los seis paneles `kpi` como una cifra sola**.

**Era cierto ese día y dejó de serlo.** Su código lo tiene: `materialize/presentation.go` define `PresentationFromRows`, `transform.go:31` la calcula y `dd_materializer_service.go:412` la escribe **sólo cuando no viene vacía** —`if len(mat.Presentation) > 0`—, que es justamente la otra mitad del pedido.

Y el dato lo confirma · medido en `POST /config/panels:batch`: **los seis paneles `scalar` traen `presentation`**, con medidor y comparativos:

```json
{"label":"TOTAL","meter":{"percentage":81,"label":"% DE LA META","note":"2.6M DE 3.19M"},
 "comparative":[{"label":"VS MES ANTERIOR","delta":134.3},{"label":"VS AÑO ANTERIOR","delta":-33.9}]}
```

**Criterio de aceptación.**
- Un panel `kpi` materializado trae `presentation` con medidor y comparativos · **medido: 6 de 6**.
- El materializador no la pisa con vacío · **verificado en `dd_materializer_service.go:412`**.

---

## Fase 3 — Chat contextual

### F3.1 ✅ `ChatOverlay` — la hoja lateral
**Criterio de aceptación.** Escape cierra. El foco entra al abrir y vuelve al
disparador al cerrar. Una sola hoja abierta a la vez: apilarlas deja al usuario
sin saber qué cierra el Escape.

**Cerrada el 2026-09-03, sin `<dialog>` nativo y con la razón escrita.**
`showModal()` daría Escape, trampa de foco y devolución del foco gratis, pero
**jsdom no lo implementa** —verificado— así que las pruebas tendrían que
polirrellenarlo y estarían verificando el polyfill en vez de la hoja. Hecho a
mano, el retorno del foco queda explícito en vez de confiado al navegador.

Lo de «una sola hoja» es estructural: la consola sostiene un único estado. El
contador del componente es la red por si alguien monta una segunda desde otro
lado, y **avisa en vez de fallar en silencio**.

### F3.2 ✅ Construir `ContextoDePanel` al abrir
**Criterio de aceptación.** Manda `panelId` y `periodo`. **Nunca SQL.**

**El criterio se REESCRIBIÓ el 2026-09-17**, por decisión humana sobre el
informe de `82da946`. Pedía doce campos —`metricId`, `metricKey`, `nombre`,
`base`, `fuente`, `capa`, `familia`, `tipo`, `valorActual`,
`dimensionesDisponibles`— porque cuando se escribió no había ningún campo por
donde mandar el panel y se asumió que habría que transcribirlo entero.

**El backend lo resolvió al revés y mejor:** `panel_context: {panel_id, period}`,
y el servicio arma el resto leyendo el panel por su id. Transcribir doce campos
desde el front habría sido mandarle al backend datos que él ya tiene, con la
posibilidad de que difirieran.

**Construida el 2026-09-21** en `src/api/chat.ts` —`alCable()`— y
`src/api/useChat.ts` —`PanelContext`—. Lo prueba
`tests/api/chat.test.ts`, contra el cable transcripto y no contra nuestro
vocabulario interno.

### F3.3 ✅ «Ver detalle» y «Preguntar» en el shell del panel
**Criterio de aceptación.**
- Los dos son CALLBACKS del shell, no navegación escrita adentro: `render/` no
  sabe a dónde llevan y la superficie es dueña del viaje.
- **Sin manejador no se pinta el botón.** Es la regla del CTA muerto, que el
  shell ya aplica: «Ver detalle» está diferido por D3, así que hoy no se pinta
  ninguno de los dos y eso es correcto.
- «Preguntar» abre la hoja con el panel desde el que se preguntó.

**Ya no espera a T4**, que se cerró el 2026-09-17: el contexto del panel viaja
como `panel_context: {panel_id, period}` y `useChat` ya lo recibe. Lo que falta
es puramente de este lado — el callback en el shell y la superficie que abre la
hoja con el panel desde el que se preguntó.

**Hecha el 2026-09-21.** `Console` recibe `onAskPanel` y lo baja como `onChat`;
`ConsoleContainer` sostiene **un solo** `askingPanelId` y monta `PanelChat`, la
hoja atada a un panel. El lado de `render/` ya estaba: el shell pinta
«Preguntar» sólo si hay manejador —la regla del CTA muerto— y sigue sin saber a
dónde lleva.

**«Ver detalle» sigue sin pintarse, y es correcto**: D3 lo difirió, así que no
hay manejador que pasarle. El criterio decía «hoy no se pinta ninguno de los
dos»; pasó a ser «hoy se pinta uno».

**El campo donde se escribe la pregunta no tenía tarea.** F3.1 es la hoja, F3.5
son los mensajes, F3.8 es el hook: ninguna es el compositor. Se descubrió acá,
porque sin él «Preguntar» abre una hoja que invita a preguntar y no deja. Vive
en `PanelChat`.

**La prueba es que la pregunta LLEGUE con el panel correcto**, no que el botón
exista: son cinco saltos con spread condicional —`ConsoleContainer → Console →
PanelInGrid → Panel → PanelShell`— y ahí una prop mal nombrada compila.
Verificada rompiendo el código: cinco mutaciones, las cinco muertas. **Una
sobrevivió primero** y mostró que la prueba del arrastre de turnos cerraba la
hoja antes de saltar de panel, con lo cual React desmontaba igual y la `key` no
se estaba verificando. La hoja NO tapa la pantalla: se puede saltar de panel sin
cerrarla, y ése es el caso que la `key` defiende.

**Y se abrió en el navegador**, que es la mitad que no se automatiza. Modo mock,
apretando «Preguntar» en el SEGUNDO panel: la hoja se tituló con su métrica, el
texto llegó de a fragmentos, el botón dijo «Esperando» mientras transmitía y
«Cómo se calculó» quedó al pie. **Ahí apareció F3.13**, que ninguna prueba vio.

El modo mock tiene handler de chat desde hoy, y **responde el cable** —`event:`
+ `data:`— porque uno que hablara nuestro dialecto volvería a esconder la
frontera.

### F3.4 ✅ Cliente SSE
**Criterio de aceptación.** Lee los seis eventos que declara el contrato.
Cerrar la hoja aborta el stream. Un `error` a mitad deja lo ya recibido visible
y dice qué pasó.

**El criterio decía otros nombres y estaba equivocado.** Pedía «`pensando`,
`fragmento`, `dato`, `sql`, `error`, `fin`», que salía de `tareas-front-back.md`.
El contrato declara `texto`, `dato`, `auditoria`, `sugerencias`, `fin` y `error`:
`pensando` no existe, `fragmento` es `texto`, `sql` es `auditoria`, y
**`sugerencias` faltaba en el plan**. Gana el contrato, que es su casa. Corregido
acá el 2026-09-03.

**Cerrada el 2026-09-03.** Dos decisiones de implementación que el criterio no
anticipaba:

**No se usa `EventSource`.** `POST /config/chat` lleva la pregunta en el cuerpo
y `EventSource` solo hace GET sin cuerpo: la pregunta tendría que viajar en la
URL, donde queda en logs de proxy y en el historial del navegador. Se usa `fetch`
con `ReadableStream`, que además da `AbortController` de verdad. (El criterio de
F3.8 menciona «no deja el `EventSource` abierto»; lo que hay que no dejar
abierto es el cuerpo de la respuesta.)

**El parseo trocea por `\n\n`, no por chunk.** Un chunk de la red no es un
evento: puede partir un JSON al medio, traer tres juntos, o terminar sin cerrar
el último. Un parser escrito «un chunk, un evento» funciona en desarrollo —donde
el servidor local manda cada evento entero— y falla detrás de un proxy. Las
pruebas arman las tramas partidas en lugares incómodos a propósito, y las dos
mutaciones lo confirman.

### F3.5 ✅ UI de mensajes con estado de streaming
**Criterio de aceptación.**
- Recibe una lista de turnos y un estado. **No sabe qué es SSE**, no abre nada y
  no acumula: se puede montar con turnos fijos, sin conexión.
- El estado de streaming se anuncia por `aria-live`, y la región viva es la
  RESPUESTA y no el turno entero: envolviendo todo, un lector de pantalla
  relee la pregunta con cada fragmento.
- **Ningún spinner** · la casa usa esqueleto o nada.
- §7.1: toda respuesta muestra su SQL en un desplegable, cerrado por defecto, y
  con el límite declarado al lado.
- Un corte dice si lo recibido sigue valiendo. **El criterio decía «leyendo
  `parcial` del backend» y desde el 2026-09-21 eso es falso**: el frame `error`
  del cable manda `{code, message}` y no declara nada. Lo deriva `api/chat.ts`
  de si ya se entregó contenido, apoyado en que el servicio persiste la
  respuesta acumulada antes de cerrar. Pedido como campo en
  `docs/MENSAJE-2026-09-21-dos-tareas-del-chat.md`.

**Cerrada el 2026-09-03.** El indicador de streaming resultó ser menos de lo que
parecía: **la prosa que aparece ES el indicador**, así que lo único que hace
falta cubrir es el hueco ANTES del primer fragmento, cuando el agente está
consultando Gold y no hay nada que mostrar.

### F3.6 ✅ Reutilizar cuerpos de panel para respuestas estructuradas
**Criterio de aceptación.** Si llega `{ forma, datos, procedencia }`, se renderiza
con el **mismo** cuerpo que un panel — un solo modelo de datos. Y con la misma
anatomía: una cifra en el chat también declara BASE y procedencia.

**Bloqueada por el contrato, descubierto el 2026-09-03.** `DatoDeRespuesta` trae
`valor`, `familia`, `presentacion`, `metricId` y `titulo`, más `Gobierno`
intersectado — o sea que la procedencia sí viaja pegada a la cifra, que es la
mitad difícil. Lo que **no declara es con qué tipo de panel se dibuja**.

Y no se puede derivar: `Bloque.formasAceptadas` es de muchos a muchos —varios
tipos aceptan `escalar`— así que el front tendría que ELEGIR uno. Eso es
inventar una decisión que el contrato no tomó, y el color de una cifra del chat
ya se inventó una vez: el front tenía `familia` cableada a `demanda` porque el
evento no la traía. Se arregló agregando el campo al contrato, que es lo que
corresponde acá también.

Cuidado con el nombre: `EventoDato.tipo` es `'dato'` —el discriminador de la
unión de eventos— y no un `TipoPanel`. Es fácil leerlo como si el campo ya
existiera.

Mientras tanto la UI **declara cuántas cifras trajo la respuesta** en vez de
pintar una con un cuerpo elegido a dedo. Es la pregunta 11 de B0.9.

**Sigue bloqueada, y desde el 2026-09-21 se sabe por qué con precisión.** El
backend ya manda el evento `data` con `{shape, data, provenance}`, que de lejos
parece lo que el criterio pide. Medido contra `82da946`, no alcanza:

`EventoDato` exige `familia` más los cinco campos de `Gobierno`. **Cuatro se
podrían cruzar del catálogo por `metric_key`** —`familia`, `capa`, `fuente` y
`catalogVersion`—, y **dos no**, y son los que sostienen la garantía:

- **`base`.** El catálogo trae la BASE de la MÉTRICA. La cifra que compuso el
  agente puede tener otro denominador: si filtró a una tienda, «48 tiendas sobre
  52» es falso. Copiarla es declarar un denominador que nadie calculó.
- **`frescura`.** La cifra del chat no se materializó — la calculó el agente al
  vuelo—, y el catálogo no tiene fecha que sirva.

Y cuando el agente compone una métrica que no está en el catálogo —caso que el
contrato contempla con `metricId: null`— no hay ni fila contra la cual cruzar.

**Cerrada el 2026-09-22, y la destrabó el backend.** Se pidió el 21 en
`docs/MENSAJE-2026-09-21-dos-tareas-del-chat.md` y `55e8419` lo entregó entero:
`provenance` ganó `base`, `base_source`, `family`, `layer`, `source_system`,
`catalog_version`, `freshness` y `queried_at`. Con eso `EventoDato` se puede
armar completo.

**`frescura` sale de `queried_at`, no de `freshness`, y es una decisión.** Los
dos vienen y significan cosas distintas: `freshness` es cuándo se materializó la
MÉTRICA y `queried_at` cuándo el agente produjo ESTA cifra. Una cifra calculada
al vuelo es tan fresca como su consulta. Sin `queried_at` —el agente no
consultó— cae a `freshness`, que es lo único que queda.

**Con qué cuerpo se dibuja era la otra mitad, y la respuesta no fue un campo
nuevo.** `EventoDato` trae la forma del valor, no un `TipoPanel`, y
`formasAceptadas` va de muchos a muchos. **El chat se abre DESDE un panel, y ese
panel tiene tipo**: la cifra se dibuja con el cuerpo de ese panel, y sólo si
`acceptsShape` dice que acepta la forma que llegó. Cuando no, se declara en vez
de adivinar — el agente puede devolver un desglose donde el panel es un KPI, y
dibujarlo con `KpiBody` se vería bien y sería otra cifra.

**Eso contesta la pregunta 11 de B0.9 sin agregar nada al contrato**, y queda
como propuesta de spec: si algún día el evento declara su tipo, la regla
desaparece.

**Y NO se reusó `Panel`, aunque el lint lo pedía.** `Metrica` exige `ventana` y
`key`, que `EventoDato` no trae; componer una métrica falsa para satisfacer al
shell sería inventar justo el campo cuya ausencia deja la línea de BASE con el
separador colgando. **La regla L5 pasó a verificar su intención** —o el shell, o
que el archivo escriba la BASE y monte `Provenance`—: un cuerpo pelado sigue
marcado, verificado rompiéndolo.

Verificada rompiendo el código: cuatro mutaciones, las cuatro muertas. Y abierta
en el navegador: la cifra con su `TOTAL`, su BASE y `GOLD · ERP · RECIÉN` —
«recién» porque la frescura es la de la consulta.

### F3.7 ✅ Historial de hilos
**Descripción.** Listado de conversaciones previas del usuario, desde
`GET /config/chat/hilos`.
**Criterio de aceptación.**
- Cada hilo muestra con qué panel y período se abrió.
- Retomar un hilo reenvía su contexto; no arranca uno nuevo en silencio.

**Parcial el 2026-09-04.** El riel está hecho: agrupado por tiempo, título
entero, badge de decisión, hilo activo marcado y selección que dispara con su
`id`. Retomar funciona —`useChat` ya manda `hiloId`, así que continúa la
conversación en vez de arrancar una nueva.

**La primera mitad del criterio se DESTRABÓ el 2026-09-17.** Estaba bloqueada
porque `HiloResumen` trae `id`, `titulo`, `creadoEn`, `actualizadoEn`,
`esDecision` y `decisionId` — **ni panel ni período**—, que era el mismo hueco
que T4 por el otro lado: si el contexto del panel no viajaba al abrir, tampoco
volvía al listar.

`82da946` lo cierra: `GET /config/chat/threads` devuelve `thread_name`,
`tab_name`, `metric_name`, `metric_key` y `period`. Lo que queda es trabajo de
este lado — transcribir esa ruta al cable y adaptarla, que hoy **no está
transcrita** a propósito: una ruta transcrita que nadie llama envejece sin que
nadie lo note.

**Cerrada el 2026-09-21.** `/config/chat/threads` transcrita al cable con
`x-origen: 82da946`, `adaptThread` en el adaptador, el riel montado dentro de la
hoja del panel y `useChat.resume`.

**Los DOS IDS eran el riesgo, no el listado.** El cable manda `id` —uuid, con el
que se piden los mensajes de un hilo— y `thread_id` —entero, con el que se
continúa la conversación—. Después del adaptador los dos son `string`, así que
**el compilador no los distingue**: pasar `resume` directo como `onSelect` del
riel compila y manda el uuid donde va el entero. Da 400, y el síntoma es
«retomar no hace nada». Hay una prueba que mira **qué número sale por la red**.

`HiloResumen` ganó cinco campos y el segundo id · **propuesta de spec ejecutada,
anotada en el yaml**: el criterio pedía mostrar el panel y el período y no había
dónde ponerlos. Era el mismo hueco que T4 por el otro lado.

**El filtro por panel lo aplica el SERVICIO**, y va en la clave de caché además
de en la petición: sin eso, abrir el chat de otro panel muestra la lista del
anterior hasta que conteste la red.

**Una fila sin contexto se dibuja igual.** Los hilos abiertos antes de que
existiera el contexto de panel no lo traen, y el servicio los declara
`omitempty`: la línea desaparece en vez de quedar con un separador colgando, que
es el defecto que la línea de BASE tuvo con `ventana`.

Verificada rompiendo el código: seis mutaciones, las seis muertas. **Una
sobrevivió primero** —la cadena vacía del cable— y mostró que la prueba de
superficie no la podía ver, porque el riel filtra las vacías igual: se probó
donde vive, en `adaptThread`.

**Se abrió en el navegador:** tres hilos agrupados en HOY, AGOSTO y JULIO, cada
uno con su métrica y **su** período, y el viejo sin línea de contexto.

**Lo que NO hace, y es del criterio:** retomar no trae los mensajes del hilo.
Eso es `GET /config/chat/threads/{id}/messages`, otra ruta, y el criterio pide
que retomar **reenvíe el contexto** — no que muestre la conversación. El riel
dice de qué se hablaba; la hoja arranca vacía y sigue el mismo hilo. Esa ruta no
se transcribe hasta que alguien la llame.

**El agrupado por tiempo es la excepción a que el front no calcule**, y el
contrato la concede explícitamente: «el agrupado por tiempo —HOY, ESTA SEMANA,
JULIO— lo hace el front: es presentación y depende del huso del usuario».

Dos decisiones que el criterio no anticipaba:

- **«Hoy» se mide contra medianoche LOCAL, no contra «hace 24 horas».** A las
  15:00, un hilo de las 02:00 de hoy es de hoy y uno de las 23:00 de ayer no lo
  es. Con una ventana de 24 horas los dos caerían mal.
- **El mes lleva el año cuando no es el corriente.** La retención es de 12 meses
  y el contrato nombra «reabrir la consulta del mismo mes del año previo»: sin
  el año, dos grupos se llamarían «julio» y no habría cómo distinguirlos.

El riel **no reordena**: el backend manda por `actualizadoEn` y esa decisión es
suya. Una lista que llegue desordenada deja dos bloques del mismo mes **a la
vista**, en vez de fundirlos y esconder que el backend mandó algo raro.

### F3.8 ✅ `useChat(contextoPanel)` — envío y stream fuera de la UI
**Descripción.** La lógica de envío, acumulación de fragmentos y cierre del
stream, separada del componente que la pinta.
**Criterio de aceptación.**
- El componente de mensajes recibe una lista y un estado; no conoce SSE.
- Desmontar la hoja aborta el stream y no deja el `EventSource` abierto.

**Cerrada el 2026-09-03**, sin el `contextoPanel` del nombre: ese parámetro era
F3.2 y esperaba a T4, así que el hook tomaba `tabId`.

**Desde el 2026-09-21 el nombre de la tarea es literal.** T4 se cerró y F3.2 se
construyó: `useChat` toma `PanelContext` —`panelId` + `periodo`— y `tabId`
desapareció del cuerpo, porque el cable no lo acepta. Lo que la tarea cerró
—dónde vive el envío y la acumulación— no cambió.

`apply` —toda la acumulación— quedó **pura y exportada**, y por eso sus nueve
pruebas no montan nada ni abren una conexión. Si probarla necesitara React, la
separación que pide el criterio no existiría de verdad.

Tres decisiones que la acumulación tuvo que tomar:

- **Las cifras van aparte de la prosa**, no intercaladas, porque cada una se
  pinta con el cuerpo de panel que le toca · F3.6. Y se guarda el evento
  entero, no solo `valor`: es lo que conserva la procedencia pegada a la cifra.
- **Las sugerencias reemplazan, no se acumulan.** El evento manda la lista
  completa; acumularlas dejaría en pantalla sugerencias de una vuelta anterior.
- **`fin` y `error` no tocan la respuesta**, solo el estado del turno. Mezclarlos
  haría que `apply` decidiera dos cosas distintas.

Y una del hook: **abortar no es un error del agente.** Si la señal está abortada
se sale en silencio — pintarle «algo salió mal» a quien acaba de cerrar la hoja
sería mentir.

Qué se conserva de lo recibido lo decide `parcial`, y **acá decía que venía del
backend, que era cierto del contrato y dejó de serlo del cable**: el frame
`error` de `82da946` manda `{code, message}`. Hoy lo deriva `api/chat.ts` y está
pedido como campo. Ver F3.5.

### ➕ F3.9 ✅ Drill-down C2
**Estado: hecha** · 2026-10-01 · `src/surfaces/console/DrillSheet.tsx` · §PEN:C2.

**El candado D3 venció, y se puede mostrar cuál.** Decía «entra cuando el backend
llegue a ese tramo», y llegó: `GET /config/panels/{panelId}/drilldown/dimensions`
y `POST /config/panels/{panelId}/drilldown` son de `168a761` —verificado con
`git log -L` sobre las dos líneas de su router y con `git log --` sobre los cinco
archivos del camino, **ninguno con un commit nuestro**— y las dos contestan 200.

**CERRADA CONTRA DATO DE SNOWFLAKE, y se dice qué se miró**, porque «contra el
servicio real» se dice solo. El 2026-10-01, con el período en `2026-09`:

| Qué se abrió | Qué se vio |
|---|---|
| El pie de los quince paneles | **Siete «Ver detalle» y ocho sin él** · exactamente los siete que el servicio declara `supported: true`, medido ruta por ruta |
| La hoja sobre `Sales` | La cifra, su BASE y procedencia, las tres dimensiones como pestañas, y `TABLA ORIGEN` y `LINAJE` declarados ausentes con su razón |
| `DAY` | Las 30 barras del mes, con su fecha |
| `PLATFORM` | Las 37 plataformas · el cambio de dimensión rehace la consulta |

**La corrida que la construyó se había cortado en la auditoría** —su QA quedó
colgado esperando una `npx vitest run` que bajo contención se pasó de su timeout—
así que esta mitad se hizo a mano. La tarea estuvo en ⚠️ hasta tenerla.

**Dos cosas observadas al mirar, anotadas y NO corregidas**, porque son de
producto y no defectos de esta pantalla: la dimensión `day` llega ordenada por
VALOR y no cronológicamente —así la manda el servicio, y en una dimensión de
tiempo eso esconde la tendencia—, y la cola de plataformas en cero es el mismo
cero-por-ausencia que la auditoría de usabilidad ya levantó.

**Descripción.** v2 tiene 128 líneas construidas: desagregación por las
`dimensiones` que declara la métrica. `nuevo-desarrollo.md` lo baja a F5.4.

**Criterio de aceptación.** Las dimensiones salen del catálogo, no de una lista
escrita en el front.

**Cómo se cumple, y la mitad que no es nuestra.** El front **no escribe ninguna
lista**: los ejes salen de la lectura de dimensiones, respaldada por el registry
del servicio. La otra mitad es pedido: `Metrica.dimensiones` existe en el
contrato y en el cable y llega **vacía en las 21 métricas**, medido el
2026-09-30, así que hoy no puede ser la fuente. La aserción que lo ata pone
`['region']` en el catálogo y `['day','week']` en la lectura y exige que se
pinten las dos de la lectura y ninguna del catálogo.

**Contra qué se cerró.** Contra el binario de `:4010` levantado desde el fork, con
`dev@synapse.local`, tenant «Under Armour México», dashboard `overview`, período
`2026-09`; y **abierta en `dev:mock`**, que es donde aparecieron dos defectos que
ninguna prueba vio: los chips y los botones del pie se pintaban sin borde ni
fondo —`border-0` y `bg-transparent` en la cadena base ganaban sobre lo que cada
rama ponía, porque el orden en la cadena no decide nada— y la desagregación por
día apilaba treinta barras en 320px con las etiquetas pisando el dibujo.

**Lo que NO se construyó, con su razón y su aserción**, está en la fila del
registro de pantallas y en `docs/PROPUESTA-2026-09-30-divergencias-C2.md`.

### ➕ F3.10 🕓 Accionables y hallazgos C4
**Estado: diferida** (D3). No se descarta ni se planifica todavía; entra cuando el backend llegue a ese tramo. El contrato ya la cubre, así que lo que falta es el servicio, no el diseño.
**Descripción.** El framework de `PS-17`: responder aceptado/rechazado sobre un
ítem, promover un hallazgo con autor y fecha, y medirlo después. El contrato ya
lo cubre: `/config/accionables`, `/config/accionables/{id}/respuesta`,
`/config/decisiones`.
**Criterio de aceptación.** El cuerpo declara qué se decidió y
sobre cuál **por callback**, y la superficie es dueña del viaje. `render/` sigue
sin importar de `api/`. El ítem se identifica por su `ref` opaco, no por índice:
el `tope` del panel recorta antes de pintar, así que la posición no identifica
nada.

### ➕ F3.11 🕓 Módulo MMM
**Estado: diferida** (D3). No se descarta ni se planifica todavía; entra cuando el backend llegue a ese tramo. El contrato ya la cubre, así que lo que falta es el servicio, no el diseño.
**Descripción.** Monitor y controlador. `nuevo-desarrollo.md` lo cita solo como
anti-patrón —la rama `if (metricId === 'mmm_canales')` en la consola— y la
crítica es correcta, pero el reemplazo necesita destino: o es un `tipo` de panel
propio, o es configuración de layout.
**Criterio de aceptación.** Cero ramas por `metricId` en la superficie. Y **Synapse no ejecuta** (§1.3.16): promueve un accionable con su
autor y su fecha, no aplica un reparto.

### ➕ F3.12 ✅ El cliente SSE habla el cable, no nuestro vocabulario
**Descripción.** Traducir las tramas de `POST /config/chat` al `EventoDeChat`
del contrato, y mandar el cuerpo con los nombres que el servicio declara.

**No reabre F3.4.** Su criterio —«lee los seis eventos que declara el
contrato»— se cumplió y sigue cumpliéndose. Lo que cambió es el cable. Es la
hermana de F1.38 para el chat, y por eso es una tarea nueva y no una
corrección de aquélla.

**Criterio de aceptación.**
- El discriminador se lee de la línea `event:` de la trama, no de adentro del
  JSON. **Es el defecto concreto**: hasta el 2026-09-21 la línea se descartaba
  a propósito y `useChat` conmutaba sobre `undefined` — el chat no pintaba una
  sola palabra.
- El cuerpo viaja como `question` + `panel_context: {panel_id, period}`, que es
  lo que pide el binding. El anterior habría dado 400 aunque el parseo
  estuviera bien.
- **Las pruebas emiten tramas del CABLE**, no del vocabulario interno. Una
  prueba que emite el dialecto propio pasa en verde con el chat roto: es el
  mismo modo de falla que F1.38 encontró en `panels:batch`.
- Lo que el cable no permite traducir se descarta **con una prueba que lo
  atestigua**, no en silencio: `data` por F3.6 y `thinking` por no tener
  equivalente.

**Hecha el 2026-09-21.** `src/api/chat.ts` y `tests/api/chat.test.ts`, con
`/config/chat` transcrito en `contracts/synapse-console-wire.yaml`. Verificada
rompiendo el código: cuatro mutaciones, las cuatro muertas.

**Lo que NO demuestra, y está dicho a propósito:** no se abrió contra el
servicio. Para eso hacen falta F3.3 —que no hay por dónde entrar al chat— y las
migraciones de B3.11, pedidas en la tarea 1 de
[`MENSAJE-2026-09-21-dos-tareas-del-chat.md`](docs/MENSAJE-2026-09-21-dos-tareas-del-chat.md).

### ➕ F3.14 ✅ Preguntas sugeridas por panel, y como chips
**Descripción.** Consumir `GET /config/panels/{panelId}/chat-suggestions` y
pintar las sugeridas como el `.pen` las dibuja.

**Es la tarea sin número que el plan del 2026-09-17 dejó anotada** al final de
la Fase 3, más la §7 de la auditoría del 21.

**Criterio de aceptación.**
- Las sugeridas **se aprietan y preguntan**. Sin manejador no se pintan.
- Se piden para ESE panel y ESE período. Sin `period` el servicio usa el mes
  actual en UTC, que no es el del tenant ni el que se está mirando.
- El texto llega redactado del servicio: **el front no escribe copy**.

**Hecha el 2026-09-21.** La ruta transcrita al cable con `x-origen: 82da946`,
`adaptSuggestion`, `useSuggestions` y `Suggestions`.

**Eran una lista de texto**: se leían y no se podían usar, que es la mitad de lo
que una sugerencia es para. §PEN:C3 las dibuja como chips bajo `SUGERIDAS`, y
**pegadas al campo** — no al pie de cada respuesta, que es donde estaban.

**Son DOS fuentes y no una.** Antes de preguntar, las del panel: el servicio las
arma con su contexto, **determinista y sin Cortex**, así que cambian con el
estado —un panel sin datos sugiere «¿qué falta para que tenga datos?» en vez de
«¿por qué está en ese nivel?»—. Después, las del agente, por el evento
`sugerencias`.

**Y las del panel NO vuelven cuando el agente no manda ninguna.** Lo descubrió
una prueba: la primera versión caía a las del panel y **reaparecía la que el
usuario acababa de apretar**. Son un abridor; una vez que se preguntó, o sugiere
el agente o no sugiere nadie.

**`intent` se descarta**, con una prueba que lo atestigua. El cable manda
`explain`, `compare`, `drivers`, `breakdown`, `forecast` o `data`, y ninguna
pantalla lo lee: conservarlo es cómo `BodyProps.presentation` estuvo meses
declarada sin un solo consumidor.

Verificada rompiendo el código: tres mutaciones, las tres muertas. Y al escribir
las pruebas volvió a morder el orden de `server.use` —el último registrado gana,
así que la base pisaba el override— que es la trampa que `roles.test.tsx` ya
tenía anotada.

**Abierta en el navegador**: tres chips, apretar uno pregunta, y el bloque
desaparece al responder.

#### ➕ F3.15 ✅ El chat tiene presencia en la consola
**Verificado el 2026-09-26 contra el servicio corriendo** · commit `8633b10`. **Contestó Cortex de verdad con contexto de pestaña**, desde la barra inferior: el agente nombró la pestaña y el período, enumeró sus siete bloques, declaró «FUENTES CONSULTADAS · paneles de la pestaña Overview (período 2026-09)» y —lo que más vale— su propio **LÍMITE DECLARADO**: «dos paneles de texto aparecen marcados como DEGRADED, su detalle puede estar incompleto».

**Las dos entradas del `.pen`, construidas desde el FRAME.** Medidas en el navegador contra el dibujo: barra de **56**, padding **24**, botón de **32** con borde **1**, radio **8** —que es `--radius-lg`, comprobado— e icono de **14**.

**Y el frame dice tres composiciones donde el plan decía una.** Esto sólo aparece comparando los dieciséis frames de consola: a 768 y 360 la barra mide **52** y no 56, el padding baja a 20, el fondo `$dock` desaparece, el botón pasa a 28 con `$elev` y sin icono, y el texto a mono 9. A 360 además **el pie suelta el contexto**, que es literal de su nota.

**Lo que NO se construyó, y por qué:** el `DECISIONES` que el frame de 360 pone a la derecha. `/config/decisiones` no existe —el cable lo declara en «lo que no está»— así que sería un CTA que devuelve 404.

**Lo que NO se pudo VER:** las dos composiciones responsive. La ventana del navegador no se achicó —está maximizada— así que se verificó la de escritorio en pantalla y las otras dos sólo contra el frame. Queda dicho en vez de darse por mirado.

**MIRADAS EL 2026-09-28** · `docs/AUDITORIA-2026-09-28-pen-vs-responsive.md`. La barra a 768 coincide con el frame en los nueve números —alto 52, padding 20, sin fondo, borde 1, botón 28 / `$r-md` / `$elev` / sin borde / mono 9—, medidos con `getComputedStyle` y no a ojo. **Y apareció una divergencia de una línea**: la línea de contexto se pintaba en mono 10 en los tres anchos y el frame de 768 la dibuja en **9**. Corregida — `Note` abajo de 1280, `Label` arriba. Se veía bien: un punto de mono a ese tamaño no se nota mirando.

**A 360 exactamente no se pudo medir**: Chrome no achica la ventana por debajo de ~500 en macOS. 500 cae en el mismo escalón `<768`, así que la composición es la misma; lo que queda sin comprobar es el ancho literal.

**Y salió algo que NO es de esta tarea**: el `.pen` dibuja **tres navbars** y pintamos uno. A 360 el frame suelta el tenant, el rol, el período y el CTA, y convierte el menú de pestañas en un desplegable. **Planteado y sin tomar** — es una tarea con su propio criterio, y los renglones del registro de pantallas son de la sesión de diseño.

**La hoja se ensanchó en vez de duplicarse**: `PanelChat` pasó a `ChatSheet` y toma una **unión** —panel o pestaña, nunca las dos—, porque el servicio devuelve 400 con ambos y con dos campos opcionales ese estado se podría escribir. Lo que el contexto de pestaña no tiene queda declarado: sin sugeridas —esa ruta cuelga de un panel— y sin cuerpo para la cifra, que es §7 de la propuesta del 22 y sigue abierta.

**Y apareció una colisión de nombres accesibles.** Tres botones dicen «Preguntar» en la misma pantalla —el del navbar, el de cada panel y el de enviar—. El literal visible es el del dibujo y no se toca; lo que se agregó es el `aria-label` con el alcance: «Preguntar sobre esta pestaña», «Preguntar sobre {métrica}».


**MEDIDO CONTRA `75b8ecc`.** Decía «el cable exige un panel» y ya no: el handler
acepta **exactamente uno** de `panel_context` o `tab_context` —si vienen los dos
o ninguno devuelve 400— y su propio comentario cita esta tarea.
`GET /config/chat/threads` acepta `tab_id`, que es el par del riel.

Lo pedimos el 2026-09-25 y lo hicieron el mismo día. **Se deja anotado y no se
toma**: abrir un candado es decisión humana, y queda puesto a propósito hasta que
alguien la tome — sin él, `ESTADO.md` lo ofrecería como trabajo libre.

**Descripción.** Decisión humana del **2026-09-22**: *«el chat debe tener
presencia, es una funcionalidad importante para el uso de Synapse, no un
complemento — algo flotante o una persiana que abre sobre el dashboard»*.

**El `.pen` ya lo dibuja, en las dos formas, y en TODAS las pantallas de
consola** —C1 ×5, C2, C3 ×2, C4 ×2, C5 y los dos responsive—. No se construyó
ninguna de las dos, y es la tercera vez que algo estaba dibujado y no se abrió:

| Dónde | Qué dibuja |
|---|---|
| `Navbar/CTA Synapse` | Botón `PREGUNTAR` · alto 32 · fondo `$acc` · icono `sparkles` 14 en `$on-acc` · mono 10 w500 |
| `Barra inferior` | Banda de **56 de alto**, ancho completo, `$dock` con borde superior `$w2`, padding 0/24. Izquierda: `PREGUNTAR A SYNAPSE` —alto 32, `$r-lg`, borde `$w3`, `sparkles` en `$dim`—. Derecha: punto de 7 en `$fam-medios-1` y la línea de contexto |

**La persiana ya existe** —`ChatOverlay`, la hoja de 940 con velo de F5.17—. Lo
que falta es la presencia, que es exactamente lo que se pidió.

**Y el contexto pasa a ser de PESTAÑA** · decisión humana del 2026-09-22, opción
(a) de `docs/PROPUESTA-2026-09-22-divergencias-con-el-pen.md` §5. Eso **cierra**
esa propuesta y **reemplaza la decisión del 2026-09-17**, que se había tomado
sobre la forma que el backend ya tenía y no sobre cuál era mejor. El razonamiento
que la sostiene: **un chat «del panel» no puede tener presencia permanente**,
porque el panel es quien da el contexto; uno «de la pestaña» sí.

**El `PREGUNTAR` de cada panel no se va**: sigue existiendo y es más específico.
Son dos entradas con dos alcances, que es lo que el `.pen` dibuja.

**Verificado el 2026-09-26 contra el servicio corriendo** · commit `8633b10`. **EL BLOQUEO VENCIÓ.** Pedía que `POST /config/chat` aceptara contexto de
PESTAÑA porque `panel_context` estaba `binding:"required"`. Hoy los dos son
punteros y el handler exige **exactamente uno**:

- sin ninguno → 400 · «se requiere panel_context o tab_context (uno solo)»
- con los dos → el mismo 400
- con `tab_context` incompleto → el validador nombra
  `ddChatRequest.TabContext.Period`, que prueba que el campo se parsea

Medido sin gastar una llamada a Cortex. `DDTabContext` lleva `TabID`, `TabName`,
`OperationalQuestion`, `Period` y un resumen de los paneles, y el cable ya lo
tiene transcrito desde el 2026-09-25.

**Así que esta tarea es del front y no espera a nadie.**

Lo que decía el pedido, como registro: La línea que el `.pen` dibuja en esa barra es, literal:
`CONTEXTO · UA MX · ECOMMERCE OVERVIEW · JUL 2026 · 12 PANELES`.

Alcanza con que el contexto admita una de las dos formas —`{tab_id, period}` o
`{panel_id, period}`— y que el servicio arme el resto, igual que ya hace con el
panel. **No pedimos los doce campos**: esa parte del criterio de F3.2 ya se
retiró el 2026-09-17 y esto no la reabre. · Bloquea **F3.15**.

**Criterio de aceptación.**
- La barra inferior y el CTA del navbar salen del **frame**, no de la nota, y con
  las medidas de arriba.
- La barra declara el contexto que va a viajar, y **lo que declara es lo que
  viaja**: si dice «12 paneles», la pregunta alcanza a esa pestaña.
- **El botón no se pinta hasta que el cable lo acepte.** Regla del CTA muerto: un
  `PREGUNTAR A SYNAPSE` que devuelve 400 es peor que su ausencia.
- El `PREGUNTAR` de panel sigue funcionando y sigue mandando `panel_id`.
- Se abre la pantalla antes de darla por construida.


### ➕ F3.13 ✅ La respuesta del agente es MARKDOWN y se pinta literal
**Descripción.** Renderizar el markdown que el agente devuelve, en vez de
volcarlo como texto plano.

**Encontrado el 2026-09-21 al ABRIR el chat**, no por una prueba. En pantalla se
lee `### Límite declarado` con los tres numerales incluidos. El `openapi.yaml`
de `82da946` lo declara: la respuesta es «markdown en español que abre con una
conclusión de 1-2 frases y, cuando aplica, las secciones `### Puntos de
lectura`, `### Fuentes consultadas` y `### Límite declarado`».

**No reabre F3.5**, cuyo criterio se cumplió: se escribió antes de saber que el
agente contesta markdown, y ninguna de sus aserciones es falsa hoy. Es la misma
distinción que F3.12 con F3.4 — lo que cambió es el cable.

**Criterio de aceptación.**
- Encabezados, listas y énfasis se pintan con los tokens de la escala
  tipográfica. **Ni `text-[13px]` ni `text-sm`**: las dos se saltan el sistema.
- **No se inyecta HTML del agente.** El texto lo compone un modelo que consulta
  datos del tenant; pintarlo con `dangerouslySetInnerHTML` convierte una
  respuesta en un vector.
- Las tres secciones que el backend declara se ven como secciones y no como una
  línea más de prosa. §7.1 pide el límite declarado **al lado** del SQL.
- `[SIN_COMPETENCIA]` en la primera línea no se muestra crudo: el backend lo usa
  para decir que no puede responder con las fuentes que tiene.

**Hecha el 2026-09-21.** `parseMarkdown.ts` —puro, probado sin React— y
`Markdown.tsx`, que decide con qué token se pinta cada bloque.

**Un parser propio y mínimo, y la razón no es el peso.** Un renderizador general
emite HTML: encabezados con tamaños que no son los nuestros, enlaces que el
agente podría inventar, imágenes. El parser devuelve una estructura cerrada
—sección, párrafo, lista— y **no existe ruta por la que llegue marcado del
agente a la pantalla**. Hay una prueba que le da `<img onerror>` y comprueba que
no haya ni un `<img>` en el DOM.

**Los `###` se pintan con el rótulo de la casa**, no con un encabezado grande:
la escala tipográfica tiene nueve tamaños y ninguno es «subtítulo dentro de una
respuesta de chat». Es el mismo rótulo que llevan «Preguntaste» y «Cómo se
calculó» en esa hoja.

**La mitad de las pruebas son de texto A MEDIO LLEGAR**, que es la mitad que
importa: la prosa entra por fragmentos, así que el parser corre sobre cada
estado intermedio. Un marcador sin cerrar se pinta literal en vez de tragarse el
resto — esperar el cierre haría que media frase desapareciera y volviera
mientras se escribe. Una prueba recorre **todos los prefijos** del mismo texto.

**Y esa prueba encontró un defecto antes de que lo hiciera una pantalla:** `###`
a secas, recién tecleado por el stream, caía a párrafo y los tres numerales se
veían — el defecto de esta misma tarea en chico.

Verificada rompiendo el código: cinco mutaciones, las cinco muertas. **Dos no
contaron la primera vez** y hubo que rehacerlas: una rompía el JSX —o sea que el
archivo no compilaba y la prueba no corría, que se lee igual que una prueba
débil— y la otra dejaba el índice retrocediendo, así que colgaba en vez de
fallar.

**Se abrió en el navegador**: `### Límite declarado` se lee «LÍMITE DECLARADO».

**Lo que NO hace, y es una decisión:** no extrae la sección «Límite declarado»
del markdown para moverla al lado del SQL, que es donde §7.1 la quiere. Hacerlo
sería reconocer un encabezado por su texto, y el día que el agente lo escriba
distinto la sección **desaparecería en silencio**. El lugar del contrato para eso
es `auditoria.limiteDeclarado`, que el cable todavía no manda y ya está pedido.

---

## Fase 4 — Admin y Builder

Es lo genuinamente nuevo: v2 **no tiene una sola línea** de estas dos
superficies. El documento las estima en 3–4 semanas de front y es la única
estimación que no bajaría.

### F4.1 ✅ `surfaces/admin/` — layout base y navegación
### F4.2 ✅ Lista de tenants
### F4.3 ✅ Gestión de usuarios y roles por tenant · A3 con alcance de plataforma
**Verificado el 2026-09-26 contra el servicio corriendo** · cerrada. El candado decía «el alcance de plataforma no tiene ruta» y venció: `GET /admin/users` llegó con `6e521cc` · B4.17. A3 pasó a ser de plataforma, con `CLIENTE` como columna —seis, las del dibujo— y los dos conteos del servicio.

**La razón por la que no se compensaba se cumplió, no se salteó.** Decía: «un total armado acá se leería como un número de plataforma y sería una suma nuestra: si un cliente falla, el total baja sin decirlo». `total` y `tenants` los cuenta el servicio, y hay una prueba que pasa una lista de uno con un total de diecisiete para que un `length` nuestro no pueda colarse.

**Y la pantalla afirmaba en pantalla que `/admin/users` da 404.** Quedó falso el día que la ruta llegó; una afirmación vencida a la vista del usuario es peor que un hueco, porque no tiene con qué dudarla. Hay una prueba que afirma su ausencia.

Quedan tres huecos declarados, que eran cuatro: invitación pendiente, quién dio de alta y reenviar invitación · ninguno tiene campo ni ruta.
### F4.4 ✅ Configuración de agente Snowflake por tenant
### F4.5 ✅ Vista del catálogo de métricas del tenant
**Criterio de aceptación (los cinco).**
- **No se muestra vocabulario de infraestructura** (§7.3 de `design.md`): ni
  base, ni rol técnico, ni grants, ni warehouse. Se declara la consecuencia
  —acceso vigente, última verificación— no la plomería. Única excepción: la lista
  de subprocesadores, que es obligación legal.
- La credencial de Snowflake **no se muestra ni se edita** desde acá: se
  referencia por identificador del gestor de secretos.
- Un usuario ve su propia fila marcada «sin acción sobre tu cuenta».

**F4.1 y F4.2 cerradas el 2026-09-15.** `AdminChrome`, `pantallas.ts`,
`TenantList` y el contenedor `Admin`. 449 pruebas.

**Las cinco pantallas de §7.3 están declaradas con su alcance**, y eso es lo que
esta superficie tiene de distinto: en la consola el alcance sale del token y vale
para toda la sesión; **acá cambia con la pantalla**. A1 y A3 cruzan clientes y no
llevan selector; A2, A4 y A5 operan dentro de un tenant y sí. A3 es la que parece
incoherente y §7.3 explica por qué no lo es: «cruza clientes porque su regla dura
—el tenant de un usuario no se edita— solo es visible cuando el tenant es una
columna que se compara».

**F4.4 se destrabó con alcance recortado el 2026-09-17**, por decisión humana
sobre el informe de `82da946`. Estaba esperando a B3.9, de la que solo existía
`POST /admin/agents`; ahora hay CRUD completo por tenant —listar, crear, leer,
actualizar y un `DELETE` que es baja lógica— más `semantic_views` y
`system_prompt_base`.

**Se construye con eso, mostrando activo/inactivo. Lo que NO se construye es el
estado del acceso** —si está vigente y cuándo se verificó—, que es justo lo que
§7.3 pide con «se declara la consecuencia, no la plomería». Eso se declara
**pendiente en la pantalla**, no se deduce: `is_active` es una baja lógica que
alguien apretó, no una verificación de que la credencial funcione, y leer uno
como el otro sería decir «acceso vigente» porque nadie apagó el interruptor.

**Hecha el 2026-09-21**, contra MSW. `/admin/tenants/{tenantId}/agents`
transcrita al cable con `x-origen: 82da946`, `adaptAgent` y `AgentConfig` dentro
de A2.

**Lo que la pantalla NO muestra es la decisión, no lo que muestra.** El cable
manda `snowflake_db`, `snowflake_schema`, `warehouse` y los nombres de las
vistas semánticas; §7.3 prohíbe los cuatro. **Se recortan en el ADAPTADOR**, no
en el componente: si llegaran al render, taparlos sería una decisión de cada
pantalla que los use y alcanza con que una se olvide. De las vistas sobrevive
**cuántas son**, que contesta «¿tiene datos asignados?» sin nombrar ninguna.

**El estado del acceso se declara pendiente, y ahí está el cuidado.** Dos campos
se parecen y no lo son: `is_active` es una baja lógica que alguien apretó y
`updated_at` dice cuándo se editó la fila. Leer cualquiera como «acceso vigente»
es afirmar algo que nadie verificó — la columna dice **«Sin verificar»**, y
debajo se declara qué falta y qué lo desbloquea. Es lo que §7.3 pide con «se
declara la consecuencia, no la plomería».

Verificada rompiendo el código: cuatro mutaciones, las cuatro muertas. **Una
sobrevivió primero** —esconder la declaración con `hidden`— porque la aserción
miraba `textContent`, que incluye lo oculto: la prueba leía un texto que nadie
ve. Ahora usa `toBeVisible`.

**Y al abrirla apareció una duplicación que ninguna prueba veía:** la lista de
«lo que §7.3 pide y no llega» de `RoleEditor` ya declaraba el estado del acceso,
así que la ficha lo decía **dos veces**, y la versión vieja era la más vaga. Sale
de esa lista —que pasó de tres a dos, con el conteo derivado de `.length`— y
queda solo en el bloque del agente. Hay una prueba que cuenta las apariciones.

**Lo que NO se construyó, y es alcance:** no se edita ni se da de baja un agente
desde acá. El criterio de las cinco pantallas no lo pide, y un `DELETE` que es
baja lógica merece su propia decisión de producto.

**Contra el servicio no se puede verificar todavía**: las tres columnas que ese
CRUD escribe no existen en la base compartida, medido el 2026-09-21, así que da
**500 y no 404**. Espera **B3.11**. La pantalla lo contempla: si la petición
falla, el bloque del agente se pinta igual con la razón, porque un bloque que
desaparece haría parecer que el cliente no tiene agente.

**El ancho mínimo es 1280 y no hay colapso**, que es la corrección de §4 del
`.pen`: «las tablas no son grillas» y perdían contenido en silencio (PS-5). Hay
scroll, que es visible.

**Tres pantallas se declaran pendientes en vez de mostrarse vacías**, cada una
con qué la desbloquea. Una pantalla que dice qué le falta no es lo mismo que una
en blanco.

#### F4.3 · abierta el 2026-09-25

**Las dos mitades existen desde el 2026-09-25**: la de roles se veía desde que
`/roles/composition` respondió, y A3 se construyó ese día —`§PEN:A3` en
`src/surfaces/admin/UserList.tsx`—. Vista contra el servicio real.

**Queda en ⚠️ y no en ✅ por el alcance**, que no es un detalle: el dibujo declara
A3 de PLATAFORMA —«17 usuarios · 2 clientes con usuarios»— y la única ruta que
existe es por tenant; `/admin/users` da 404. La pantalla lo declara y **no lo
compensa sumando N llamadas**. Faltan además el estado de invitación pendiente,
quién dio el alta y reenviar la invitación, los tres sin campo ni ruta.

**DESBLOQUEADA el 2026-09-25 (humano)**, con la medición delante.
El candado decía «`/admin/users` y `/admin/roles` dan 404» y **seguía siendo
literalmente cierto**: esas dos rutas dan 404. Lo que venció es su sustancia — `/admin/users` y `/admin/roles` **siguen dando
404**, así que la frase no miente. Pero la capacidad existe en otras rutas:
`GET /admin/tenants/{tenantId}/users` → 200 y
`GET /admin/tenants/{tenantId}/roles/composition` → 200 —**tomaron la ruta que
propusimos y escribimos en el fork**—.
**No se toma sin decidirlo.** Es exactamente la forma del 2026-09-16 con
F4.17–F4.20: un candado cuya razón venció en parte. Lo que cambia acá es que
venció del todo y la frase quedó nombrando la ruta equivocada; lo que no cambia
es que la decisión de tomarla no es del agente.
**La mitad de roles ya se ve contra el servicio real**, verificado en pantalla el
2026-09-25: A2 dibuja los tres roles con su composición y el aviso de las
métricas que `planner` no recibe.

### F4.3 parcial el 2026-09-15 · la mitad de roles, no la de usuarios

`RoleEditor` y el cliente de las rutas del fork. **590 pruebas**, doce nuevas,
once mutaciones muertas.

**Queda en ⚠️ y no en ✅ porque su título nombra dos cosas.** El CRUD de roles
está —A2 lo sostiene entero—; **la lista de usuarios de A3 no**, y no por orden
del plan: **ninguna ruta lista usuarios.** Existe `POST /admin/users` y nada más,
así que §7.3 —«lista filtrable por tenant y rol, CRUD»— no tiene de dónde leer.

### Las dos aserciones que sostienen esta tarea son de VOCABULARIO

**`pestañas` vacío significa «ve TODAS», no «no ve ninguna».** Es la diferencia
entre un rol recién creado —que ve todo hasta que alguien lo acote— y un rol
tapiado. Pintar «0 pestañas» diría lo segundo, y quien administra actuaría sobre
eso.

**Ocultar una métrica NO es un permiso** · §1.4.20. El servidor vuelve a
verificar en `/config/catalog` y en el batch, así que un rol con
`hidden_metric_ids` **no es un rol que no pueda pedir esa métrica**. La pantalla
lo declara una vez y siempre — no por fila, que la volvería decoración—, porque
quien no lo sepa va a usar el campo como si fuera un permiso, y eso se descubre
en una auditoría y no antes.

**Ni los UUID de pestaña ni los de métrica se pintan**, que es la misma regla
dura de §7.3 aplicada a otro campo.

### Borrar, y por qué el conteo viaja en el listado

Un rol con usuarios no se puede borrar. **El botón no aparece**, y en su lugar se
dice qué lo impide y qué lo desbloquea — reasignar a los usuarios. Es la misma
regla que `puedeResponder` en `RecoBody`: «un botón que se aprieta y devuelve 403
es peor que un botón ausente». Para eso `user_count` viaja en el listado y no se
descubre con el 409.

### Dos pruebas que pasaban por el motivo equivocado

**El fixture de layouts tenía el publicado en la posición 0.** La mutación que
cambiaba «el publicado» por «el primero de la lista» sobrevivía, porque eran el
mismo. Con el borrador primero, se separan.

**Y el helper `base()` de MSW registraba los overrides AL FINAL.** `server.use`
antepone los handlers y, entre los de una misma llamada, gana el primero — así
que un override de una ruta que la base ya declaraba **nunca se aplicaba**. La
prueba de «no ofrece las pestañas de un borrador» estaba escrita y no corría.
Corregido en los tres archivos que usan ese helper, y los arneses de F4.13,
F4.14 y F4.15 se volvieron a correr para confirmar que no dependían del bug.

**Es la quinta vez en dos días que el arnés de mutación encuentra algo que las
pruebas no podían ver**, y las cinco tienen la misma raíz: el fixture no
distinguía los dos casos.

**Verificadas por mutación, once casos:** «vacío» pintado como «ninguna», los
UUID de pestaña, los ids de métrica, la advertencia de permiso borrada, borrar
ofrecido con usuarios, el formulario sin precargar, guardar sin nombre, las
pestañas de cualquier layout, el 404 como error genérico, el cuerpo sin métricas
ocultas, y el 204 tratado como JSON.

### El choque de F4.2, y cómo se resolvió

**§7.3 pide seis columnas para la banda de clientes y el cable trae dos.**
`GET /admin/tenants` devuelve `ports.TenantPublicOption` —`id` y `name`—, que se
llama «public option» porque nació para llenar un selector, no para sostener una
tabla de administración. Faltan estado, vertical, cantidad de usuarios, frescura
del feed más atrasado y última publicación.

**Las cinco no se inventan ni se omiten.** Omitirlas daría una tabla que parece
completa: quien la mire concluiría que no hay nada que saber del estado de un
cliente. **La pantalla las declara ausentes**, con la gramática de §8 —qué falta,
por qué, y que se desbloquea con B4.1—, que es la misma que el producto usa para
un feed vencido.

Por eso F4.2 queda cerrada **como lo que se puede construir hoy** y su carencia
está registrada como pedido, no como deuda oculta.

### Dos defectos propios que encontraron las herramientas

**`design-lint` rechazó `AdminChrome` en su primera corrida**: exportaba
`PANTALLAS` junto al componente y §4 regla 3 pide uno por archivo. Movido a
`pantallas.ts` — que además deja que una prueba verifique la tabla de alcances
sin montar nada, y silencia el aviso de fast-refresh de oxlint.

**Y `tests/tokens/escala.test.ts` encontró `tracking-label`, un token que no
existe.** Los que hay son `tracking-rotulo`, `tracking-titulo` y `tracking-kpi`.
Es exactamente el silencio que esa prueba persigue —«una utilidad que nombra un
token inexistente no es un error, es silencio: compila, pasa el lint y se pinta
sin tracking»— y **no lo vio el typecheck ni el lint**: lo vio el chequeo que
cruza cada utilidad contra las variables declaradas.

**Verificadas por mutación, tres casos:** A3 pasada a alcance tenant, el selector
apareciendo en una pantalla de plataforma (7 fallas), y las columnas faltantes
omitidas en silencio.

### F4.5 cerrada el 2026-09-15 · y lo que encontró

`CatalogView` y el contenedor `Catalogo` dentro de `Admin`. **462 pruebas**, trece
de ellas nuevas, seis mutaciones muertas.

**A4 es la única de las cuatro pantallas de tenant que tiene ruta**, y §7.3 le
pide ocho campos por métrica. `GET /admin/tenants/{tenantId}/catalog` sostiene
cuatro: forma, capa, fuente y dirección semántica.

**Los otros cuatro no se rellenan, y dos de ellos son la trampa de esta
pantalla.** `frescura` y «en cuántos paneles se usa» simplemente no están y se
declaran como tales. Pero `ventana` y `estado` **sí existen en el tipo `Metrica`,
compilan y tienen valor**: el adaptador de F1.33 escribe `ventana: ''` y `estado:
'DISPONIBLE'` fijo porque el contrato los exige como obligatorios y el cable no
los trae. Una columna «Estado» con doce `DISPONIBLE` idénticos se ve exactamente
igual que un catálogo verificado, y no lo es.

**Es el mismo modo de falla que el spread condicional y que `text-labell`**: algo
que compila, pasa el lint y miente. Por eso la lista de ausentes de esta pantalla
se escribió mirando `adaptCatalog`, no el tipo — el tipo dice que los ocho campos
están.

**El filtro por estado que §7.3 pide no se puede ofrecer**, y en su lugar hay uno
por capa **que declara que no es el que el diseño pide**. Sustituirlo en silencio
daría una pantalla que parece cumplir §7.3 y no cumple.

**El origen de cada columna se declara** —derivado o editorial—, que es lo que
§7.3 pide con PS-13: «sincronizar y editar no compiten, cada campo tiene un solo
dueño», y A4 muestra los derivados con su origen. Editar no se ofrece: **ninguna
de las seis rutas de `synapse-admin-wire.yaml` escribe sobre el catálogo**, así
que el aviso de «qué paneles afecta» que §7.3 pide antes de guardar no tiene
dónde dispararse. Tampoco la acción de sincronizar: hoy es `make sync-catalog`,
un CLI, no una ruta.

**Las métricas rechazadas por el adaptador se nombran con su razón.** Acá pesa
más que en la consola: una forma fuera del enumerado no solo no se dibuja,
tampoco se puede asignar a un panel, y quien compone tiene que saber por qué no
está en la lista.

**Lo que NO se hizo, con la razón escrita.** Contar los paneles que usan cada
métrica sobre el layout **publicado** es un `GET` más y da un número — y sería el
número equivocado: una métrica usada solo en un borrador saldría en cero, y quien
la mire va a leer «no se usa» y va a considerar retirarla. Contarlo bien exige
recorrer todos los layouts del tenant, uno por borrador, y esa es una decisión de
costo que no corresponde tomar en una vista.

**Y esta tarea cambió una decisión de B1.17.** Ese pedido decía que `state` y
`state_reason` «no los pedimos: hoy no los lee nadie en el front». Dejó de ser
cierto el día que A4 existe — §7.3 le pide filtro por estado. Queda pedido.

**Verificadas por mutación, seis casos:** una columna de `estado` agregada a la
tabla, el filtro devolviendo todo, el encabezado sin su origen, uno de los cuatro
ausentes borrado de la lista, las rechazadas ocultas, y el hueco de dirección
semántica en blanco en vez de «—». Las seis mueren.

### F4.6 ✅ `surfaces/builder/` — composición visual
### F4.7 ✅ Selector de tenant y plantilla base
### F4.8 ✅ Editor de pestañas: nombre, pregunta operativa, orden, sugerencias
### F4.9 ✅ Canvas de 12 columnas — arrastrar y colocar
### F4.10 ✅ Configurador de panel: métrica, tipo, spans, opciones
### F4.11 ✅ Validación en tiempo real contra `/config/blocks`
### F4.12 ✅ Preview por rol · con la grilla y los huecos
**Verificado el 2026-09-28 contra el servicio corriendo** · commit `5924bf2b`.

**Cerrada el 2026-09-28 contra `5924bf2b`.** El candado —«el preview de upstream no trae paneles»— venció al llegar B4.9, y la grilla volvió: sale de `render/grid.ts`, la misma que aplica la consola, así que si el reflujo cambia cambian las dos.

**Y se agregaron los huecos, que son la otra mitad de §3.4 regla 3**: «el hueco se muestra en el builder, nunca en la consola · B5 dibuja los huecos en su posición original». El dibujo los rotula «HUECO · 3 COLUMNAS · NO LLEGA A ESTE ROL · AL PUBLICAR SE CIERRA».

**Un hueco NO se deduce de un espacio vacío en la grilla**, y ésa es la decisión que sostiene la pantalla: un layout puede tener lugar libre porque el admin lo dejó, y decir «no llega a este rol» ahí afirmaría una causa que nadie verificó. Se calcula por diferencia contra el layout sin lente, **y por id**: el lente `planner` trae los paneles movidos por override —`col_span` 4 donde el admin tiene 12—, así que comparar por posición daría un hueco fantasma en la columna original y el panel presente en la nueva. Hay prueba y mutación de eso.

**Sin el layout sin lente los huecos se declaran no calculables** en vez de inferirse.

**Dos pruebas viejas fallaron y era lo que tenían que hacer.** Una se llamaba «no hay NINGÚN panel en la vista · **y el día que lleguen, esto falla**». Llegaron y falló: una prueba escrita contra una carencia tiene que avisar cuando la carencia termina, en vez de quedar como leyenda.
**Verificado el 2026-09-28 contra el servicio corriendo** · commit `5924bf2b`, construido y levantado acá porque el binario que teníamos era del 26 · `docs/ESTADO-backend-2026-09-28.md`. **El candado era «el preview de upstream no trae paneles» y ya no es cierto**: `5924bf2b` devuelve `tabs[].panels[]` filtrados por rol, medido 12 contra 9. Lo que falta ahora es nuestro: `RolePreview` perdió su grilla cuando el alcance se achicó y hay que devolvérsela.

**Verificado el 2026-09-26 contra el servicio corriendo** · el candado del fork venció: `GET /admin/layouts/{layoutId}/preview` responde 200 en upstream. Y de paso apareció que **la pantalla nunca pudo haber funcionado** contra el servicio real: mandábamos `?roleId=` donde va `role_id`, y devuelve 400. MSW no podía verlo — su handler leía nuestra propia grafía. Ahora exige `role_id`, y volver el cliente atrás rompe nueve de catorce pruebas.

**Sigue en ⚠️ por otra razón, y es una pérdida de alcance.** El preview de upstream devuelve qué pestañas ve el rol y **no sus paneles**, así que ya no se puede ver qué recorta `hidden_metric_ids`. `RolePreview` perdió su grilla y lo declara: armarla del lado nuestro diría «esto ve el Planner» sobre paneles que nadie filtró, que es lo que esta pantalla existe para no adivinar.

**Está pedido en B4.9.** No hay ruta alterna: `GET /config/tabs/{tabId}` resuelve el rol desde el token y no acepta lente.
### F4.13 ✅ Guardar borrador
### F4.14 ✅ Validar antes de publicar
### F4.15 ✅ Publicar sin deploy
### F4.16 ✅ Hooks dedicados: `useLayouts`, `useLayoutEditor`, `usePublishLayout`
**Criterio de aceptación destacado.**
- F4.8: **una pestaña que no contesta una pregunta no se compone.** La pregunta
  operativa es obligatoria, no un subtítulo opcional.
- F4.11: usa `catalog/blocks.ts`, que ya está escrito. Un tipo incompatible con
  la forma de la métrica se marca **con la razón**, no con «inválido».
- F4.11: la validación del front es feedback inmediato; **el servidor decide**
  (B4.6). Nunca se publica algo que el front dio por bueno y el servidor no vio.

### F4.6 cerrada el 2026-09-15 · el ancho, que no es uniforme

`pantallas.ts`, `BuilderChrome` y el contenedor `Builder` reemplazan el stub de
una línea que `routes.tsx` ya importaba. **472 pruebas**, diez nuevas, seis
mutaciones muertas.

**En administración lo que cambia con la pantalla es el alcance; acá cambia el
ancho mínimo**, y §4 da dos números con dos razones que conviene no fundir:

- **1600 en B1–B4 y B6** = 1200 de lienzo 1:1 más 300 de biblioteca. Si el lienzo
  se escala, un panel de `colSpan` 4 deja de medir cuatro columnas en pantalla y
  **el arrastre pierde su unidad**.
- **1440 en B5**, que es la excepción que §4 escribe: la vista previa no es una
  maqueta del builder, es la consola del cliente a su ancho real. A 1600 se
  mostraría a un ancho que ningún usuario tiene.

Ninguno colapsa: §4 gobierna el grid de paneles y «las otras dos superficies no
son grids y declaran ancho mínimo en vez de colapso».

### Un modo de falla nuevo, que encontró la mutación

**Una utilidad de Tailwind armada por interpolación compila, deja el atributo
`class` correcto en el DOM y nunca llega al CSS.** Es el hermano de
`text-labell`: aquel nombra un token que no existe, éste arma un nombre que el
escáner no puede leer.

Lo encontró una mutación que cambiaba la tabla de anchos de `BuilderChrome` por
`min-w-[${ancho}px]`: **sobrevivía a las diez pruebas de la superficie**, porque en
jsdom las dos formas producen exactamente el mismo atributo. Lo que cambia es el
build, no el DOM — y ninguna prueba de render puede verlo.

Quedó cubierto en `tests/tokens/escala.test.ts`, que es donde vive el otro medio
silencio: cruza toda plantilla que va a `className` y falla si un `${…}` queda
pegado dentro de una utilidad. Un `${…}` entre espacios sí vale — ahí la
interpolación aporta la utilidad entera y las dos ramas están escritas.

**Y el propio chequeo encontró algo**: `text-labell` escrito en un comentario de
`BuilderChrome` lo disparó. El escáner no distingue comentario de código, así que
esa prueba no puede citar literalmente el token roto. Reescrito el comentario.

### Las cinco pantallas pendientes, y qué frena a cada una

Lo que las frena **no es lo mismo**, y esa distinción es la que importa:

| | Qué falta | De qué orden |
|---|---|---|
| B2 · Canvas | La interacción de arrastre no está en `design.md` | **Diseño**, no cable |
| B3 · Selector de gráfico | `/config/plots` · B1.21 · es F4.21 | Cable |
| B4 · Binder de métrica | Nada: es F4.10 y se puede tomar | Orden del plan |
| B5 · Vista previa por rol | Roles por tenant · B4.9, que escribimos nosotros | Cable |
| B6 · Historial | Ni **quién** publicó ni **qué cambió** · pedido en B4.2 | Cable |

**ESA TABLA ES DEL 2026-09-15 Y CINCO DE SUS SEIS FILAS YA VENCIERON** · anotado
el 2026-09-30 para que no se lea como el estado de hoy: B3 se construyó con F4.21,
B4 con F4.10, B5 con F4.12 y **B6 con F5.19** —su candado era falso: el cable trae
autor y diff desde `168a761`—. La única viva es B2, que sigue esperando una
decisión de diseño.

**B2 es la que hay que mirar dos veces.** §7.2 describe el RESULTADO del arrastre
—slot vacío con su label, badge `HEREDADO`, colisión marcada, nada se suelta
encima— y no la INTERACCIÓN: qué agarra el cursor, cómo se redimensiona por
handles, qué pasa al soltar fuera de la grilla. F4.9 no se toma sin esa decisión,
y decirlo en la pantalla es lo que impide que alguien la invente creyendo que
solo falta cable.

**Verificadas por mutación, seis casos:** B5 perdiendo su excepción de ancho, el
ancho interpolado, el chrome sin decir el ancho, B2 diciendo que espera código en
vez de diseño, B6 sin nombrar lo que falta, y una pantalla pendiente mostrándose
vacía.

### F4.7 cerrada el 2026-09-15 · dos de las cuatro cosas que B1 pide

`ContextView` más el estado del contenedor. **484 pruebas**, doce nuevas, ocho
mutaciones muertas.

§7.2 le pide a B1 cuatro cosas: «elegir **tenant y rol**; muestra qué pestañas
existen, cuáles **heredan de la plantilla de vertical** y cuáles tienen
**override**». El cable sostiene el tenant y las pestañas.

**El selector de rol es el que había que mirar dos veces, porque sí se podría
armar.** `LayoutDetail` trae `RoleIDs` por pestaña, así que la unión de todas
llena un `select` sin pedir nada a nadie. Y sería la lista equivocada por dos
razones distintas:

1. **Son IDs, no nombres.** Ninguna ruta resuelve un `RoleIDs` a un nombre, así
   que el selector ofrecería UUID — que es exactamente la plomería en pantalla
   que §7.3 prohíbe del otro lado.
2. **Le faltaría justo el rol que importa.** La unión de los roles que las
   pestañas nombran deja afuera a **todo rol que todavía no tiene pestaña**, y
   ése es el rol para el que uno abre el builder. Un selector que esconde el caso
   de uso se ve igual que uno completo.

**Y la herencia de plantilla no existe en ningún lado.** Supone tres cosas que el
cable no tiene: que el tenant declare una vertical —no está ni en `TenantOption`
ni en la ficha—, que exista una plantilla por vertical, y que una pestaña sepa si
es propia o heredada. Con dos de tres se pintaría mal.

**Tres cosas que la pantalla sí dice y que no son obvias.** Un borrador muestra
«sin publicar» y no una fecha de creación. Una pestaña con `roles` vacío muestra
«todos los roles», que no es lo mismo que «ninguno» — y es la mitad del dato. Y
una pestaña sin pregunta operativa se declara: el cable deja el campo en cadena
vacía y el producto dice que «una pestaña que no contesta una pregunta no se
compone», así que una celda en blanco se leería como un dato que falta y no como
una regla violada.

**El bug que la prueba encontró antes de que existiera.** `/admin/layouts/{id}`
no cuelga del tenant, así que un `layoutId` del cliente anterior **sigue
resolviendo**: sin limpiarlo al cambiar de cliente, la pantalla mostraría las
pestañas de un cliente bajo el nombre de otro. No lo ve el typecheck ni el lint.

### El arnés de mutación necesita una línea de base verde

**Encontrado el 2026-09-15, y es un modo de falla nuevo de los tres ya
anotados.** Las ocho mutaciones de F4.7 salieron «✓ muere» en su primera corrida
y **ninguna lo había demostrado**: el arnés corría todo
`tests/surfaces/builder/`, y ahí adentro `builder.test.tsx` ya estaba en rojo
—B1 había pasado a traer datos y su prueba montaba el componente sin proveedor—.
Con el árbol roto, cualquier mutación «mata» algo.

Es primo del que ya estaba escrito —«una mutación que pasa sin haberse aplicado
se lee igual que una prueba débil»— pero al revés: **una mutación que muere sobre
un árbol roto se lee igual que una prueba fuerte**. El arnés ahora corre la línea
de base primero y sale 2 si no está verde, que es la misma convención de
BLOQUEADO de la puerta: no hay contra qué comparar todavía.

**Verificadas por mutación, ocho casos, con la línea de base en verde:** cambiar
de cliente sin efecto, la versión no olvidada, las pestañas en el orden del
arreglo, un borrador con fecha, la pestaña sin pregunta en blanco, «vacío» pintado
como «ninguno», los UUID de rol en pantalla, y uno de los tres faltantes borrado.

### F4.8 cerrada el 2026-09-15 · el reemplazo completo, y lo que borraría

`borrador.ts` —funciones puras— y `TabEditor`, colgando de B1. **509 pruebas**,
veinticinco nuevas, doce mutaciones muertas.

**Vive en B1 y no en una pantalla propia.** §7.2 tiene seis y ninguna es «editor
de pestañas»; B1 ya «muestra qué pestañas existen», así que hacer esa lista
editable es el único lugar donde cabe sin inventar una séptima. La tabla de solo
lectura de F4.7 se fue: dos vistas del mismo dato es la otra forma de deriva, y
sus aserciones se mudaron a `editor.test.tsx` en vez de borrarse.

### La trampa: un PUT de reemplazo completo con un editor parcial

**`PUT /admin/layouts/{id}` manda el layout entero y lo que no venga se borra.**
§7.2 le pide a F4.8 cuatro campos —nombre, pregunta, orden, sugerencias—, así que
el editor natural produce un cuerpo de tres campos… y **renombrar una pestaña le
borraría sus paneles y su asignación de roles**. Con 200 y sin aviso.

Por eso el borrador tiene la forma de `TabParaGuardar` —que es exactamente el
cuerpo del PUT— y **arrastra lo que no edita**. No hay una segunda traducción
donde perder un campo, y la pantalla lo declara por pestaña: «1 panel(es) · todos
los roles · se conservan al guardar».

**La segunda mitad de la trampa es `id`.** Una pestaña sin `id` **genera una
nueva** en vez de editar la existente. Así que ausente no significa «no sé»:
significa «creá una», y solo `agregar` lo produce — y la pantalla lo dice,
«Nueva · se crea al guardar».

### La pregunta operativa la sostiene el front solo

`OperationalQuestion` no es requerido en el cable y el servicio acepta la cadena
vacía. §7.2 y el contrato dicen lo contrario con la misma frase: «una pestaña que
no contesta una pregunta no se compone». La diferencia entre lo que el servicio
acepta y lo que el producto permite se sostiene en `problemas()`: la pestaña se
marca, **se cuenta** y bloquea la composición. No en un borde rojo —§2 lo
prohíbe, y de todas formas un color no dice qué hacer—. Queda anotado en B4.4
como una pregunta para ellos, no como un pedido.

### Dos pruebas que no demostraban nada, y la mutación las encontró

**`mover` fuera de rango, con dos pestañas.** Sin la guarda, `splice(0, 1)` y
después `splice(-1, 0, …)` inserta antes del último — y **con dos elementos eso
devuelve el mismo arreglo**. La prueba pasaba con la guarda y sin ella. Hacen
falta tres para verlo: sin guarda, `[A,B,C]` mover A hacia arriba da `[B,A,C]`.

**El borrador atado a su versión, probado cambiando de CLIENTE.** Ahí la versión
se limpia a `null`, el detalle vuelve `undefined` y el editor desaparece entero,
así que la prueba pasaba con o sin la atadura. Lo que la destapa es cambiar entre
**dos versiones del mismo cliente**: el editor sigue en pantalla, y sin el
`layoutId` adentro del borrador la segunda versión mostraría las pestañas
editadas de la primera.

Las dos son la misma forma: **una prueba escrita sobre el caso más fácil de
montar, no sobre el caso que distingue**.

**Verificadas por mutación, doce casos:** roles no arrastrados, paneles no
arrastrados, `roles` compartido en vez de copiado, `sembrar` sin ordenar,
`agregar` naciendo con id, `quitar` dejando huecos, `mover` sin guarda, la
pregunta vacía dejando de ser problema, `sucio` contando pulsaciones, el campo de
nombre sin `onChange`, el editor sin contar las inválidas, y el borrador sin atar
a su versión.

### F4.10 cerrada el 2026-09-15 · el rechazo explicado

`PanelConfigurator` más las cinco operaciones de panel en `borrador.ts`. **543
pruebas**, treinta y cuatro nuevas, veinte mutaciones muertas.

**La frase de §7.2 que decide la pantalla no es la primera, es la última:** «las
incompatibles aparecen listadas y deshabilitadas con la razón. **El rechazo
explicado es lo que enseña el sistema**». Filtrar las incompatibles sería más
corto, más limpio y no enseñaría nada — quien compone aprendería que «esa métrica
no aparece» en vez de que un medidor no dibuja una serie temporal. Aparecen todas,
en el mismo orden, y las que no sirven dicen por qué con `invalidReason`, que ya
estaba escrito desde F1.3.

**Y la razón se pregunta con los spans del BLOQUE, no con los del panel.** Si el
panel tuviera un span fuera de rango —posible mientras el layout venga del
servidor— todas las métricas saldrían rechazadas por una razón que no es de la
métrica: «ocupa entre 3 y 4 columnas y se pidieron 8». La lista contestaría la
pregunta equivocada.

### Cuatro autoridades distintas en una sola pantalla

| | Quién manda |
|---|---|
| Qué formas acepta un tipo | `/config/blocks` |
| Qué rangos de span | La misma tabla |
| Qué params **existen** por tipo | La misma tabla · `paramsDisponibles` |
| Qué **valores** acepta cada param | `PARAM_SCHEMAS`, del front |

La última es la duplicación declarada de F1.29, y acá se vuelve visible: el
configurador muestra lo que el validador acepta llamando a `describirParam` —que
se exportó para esto—, no una descripción escrita a mano. Si el esquema suma un
valor, la pantalla lo dice sola. **Un param que el backend declara disponible y
el front no sabe describir no se ofrece**: se declara, porque un campo libre ahí
produce un param que `validateParams` descarta.

### Cambiar el tipo borra las opciones, y eso no se ve venir

Recortar los spans al rango nuevo es obvio. Lo otro no: **los params son por
tipo** —`maximo` es de `gauge`, `bins` de `distribution`—, así que conservarlos al
cambiar de tipo deja en el cuerpo del PUT un param que el tipo nuevo no lee.
`validateParams` lo descartaría **al leerlo de vuelta**, pero entre medio se
guarda y se publica basura. `cambiarTipo` los borra.

### Lo que no se hizo, con la razón

**`colStart` no se edita.** §7.2 lo pone en B2 —el canvas, F4.9— y un número
elegido en un formulario es una columna que nadie eligió mirando. Se muestra y se
declara de dónde va a salir.

**Las opciones se editan acá y no en F4.11**, aunque el primer cierre de esta
tarea las dejó solo listadas. Es lo que `npm run verify` no mira: «opciones» está
en el título de F4.10, así que empujarlas a la tarea siguiente era el criterio
cumplido a medias sin bajar el estado a ⚠️ — el modo de falla que la auditoría del
plan persigue. Corregido en la misma jornada, antes de tomar F4.11.

Un param de `enum`, `number` o `string` se edita. Los de `array` y `object`
**no**, y no es lo mismo que un param sin esquema: acá el esquema existe, pero son
estructuras —`columnas` es una lista de definiciones de columna, `banda` un objeto
con umbrales—. Un textarea de JSON compilaría y sería la peor salida: el error
aparecería al publicar.

**Y el vacío de un enum es «sin declarar», no un valor.** El default lo aplica el
cuerpo; escribirlo en el layout lo congelaría el día que el cuerpo cambie de
opinión.

**Y el param de desagregación que §7.2 pide no existe en ningún lado** —ni en
`paramsDisponibles`, ni en `PARAM_SCHEMAS`, ni en ningún cuerpo de `render/`—.
`dimensiones[]` llega por métrica pero su único consumidor previsto es el
drill-down de F5.4, diferido. **Es una decisión de diseño, no un campo que falte
en un extremo**: quedó como la pregunta 14 de `docs/B0.9-preguntas-abiertas.md`,
con las tres salidas posibles. No frena nada.

### Una mutación que no se podía matar desde el DOM, y qué se hizo

**El campo de un param numérico manda `Number(texto)` y no el texto**, porque
`opciones` viaja como JSON y `validateParams` pide `typeof === 'number'`: un
`"10"` compila, viaja igual y **recién degradaría el panel la próxima vez que
alguien lo abriera**.

La mutación que quitaba la coerción **sobrevivía**, y no porque la prueba fuera
floja: el valor mostrado es idéntico con `Number()` y sin él —`String(valor)` los
iguala—, así que **el DOM del campo no distingue**. No era una prueba débil ni un
cambio sin efecto: era un efecto real fuera del alcance de la superficie.

La salida no fue una aserción más astuta sino **terminar el diseño**: el
configurador corre `validateParams` sobre lo que el panel tendría si se guardara
así, y pinta la razón. Con eso el número se vuelve observable —un `"10"` aparece
como «espera un número entero»— y de paso la pantalla gana lo que §7.2 pide de
ella: el rechazo explicado, también para los valores.

**Verificadas por mutación, veinte casos:** las incompatibles filtradas, las
incompatibles habilitadas, la razón no pintada, el rango que no acota el campo, la
fórmula de altura cambiada, el panel sin métrica sin declararse, un param sin
esquema ofrecido como si se supiera, un valor inválido sin explicar, `cambiarTipo`
sin recortar, `cambiarTipo` conservando opciones, `cambiarTipo` perdiendo el id, el
panel nuevo naciendo con métrica, `editarPanel` pisando el id, la selección sin
resolver a `null` sobre un hueco, un param de estructura ofrecido como campo
libre, el enum sin «sin declarar», borrar la opción dejando un objeto vacío
colgado, `editarOpcion` pisando las otras, el número mandado como texto, y el
botón de panel sin decir que le falta métrica.

### F4.11 cerrada el 2026-09-15 · feedback inmediato que no decide

`validar.ts` y `ValidationSummary`. **560 pruebas**, diecisiete nuevas, doce
mutaciones muertas.

**No reimplementa reglas.** Corre `invalidReason` de `catalog/blocks.ts` y
`validateParams` de `api/params.ts` —las mismas que la consola usa para detectar
un layout mal formado— sobre el borrador entero. Es lo que hace que el builder y
el renderizador no puedan opinar distinto.

**Y lo que dice con la misma claridad es que no decide.** El criterio lo escribe
así: «la validación del front es feedback inmediato; **el servidor decide**
(B4.6). Nunca se publica algo que el front dio por bueno y el servidor no vio». Por
eso el aviso está **siempre**, no solo cuando hay problemas: **el caso peligroso
es el limpio**, porque es donde alguien podría leer «listo para publicar».

Cada problema dice qué pestaña, qué panel y la razón. Y se direcciona por
**índice, no por id**: una pestaña o un panel recién agregados no tienen id
todavía — lo asigna el servidor al guardar. Los problemas que devuelve `validate`
sí vienen por id, y juntarlos es trabajo de F4.14.

### Tres lugares que muestran lo mismo, una sola cuenta

La pantalla marca composición en tres sitios —junto a la pestaña, en el botón del
panel y en el resumen— y al principio cada uno lo calculaba por su cuenta:
`TabEditor` llamaba a `problemas()`, `PanelConfigurator` a `validateParams()` y el
resumen a `validarBorrador()`. **Tres cálculos que pueden discrepar es peor que
un mensaje repetido**, así que `validarBorrador` corre una vez en el contenedor y
los tres leen de ahí. Que la misma frase aparezca junto al campo y en el resumen
es deliberado: son dos preguntas distintas —«¿este valor sirve?» y «¿qué bloquea
publicar?»— y ahora no pueden contestarse distinto.

### Una regla que se escribió y se sacó

«Una pestaña sin paneles no contesta su pregunta con nada» era la regla obvia de
agregar, y **no está escrita en ningún lado** — §7.2 B2 hasta contempla el slot
vacío como estado legítimo del canvas. Inventarla haría que el front **bloqueara
una publicación que el servidor acepta**, que es la falla de F4.11 al revés: no
darse por bueno a uno mismo, pero tampoco ponerse más estricto que la autoridad.
Quedó el comentario donde estaba el código, y una prueba que afirma que no es un
problema.

### Y una mutación que pedía una prueba que no existía

`const invalidas = new Set(problemas.map((p) => p.tab)).size` cambiado por
`problemas.length` **sobrevivía**: todos los fixtures tenían un problema por
pestaña, así que las dos cuentas daban el mismo número. Hace falta una pestaña con
dos problemas para que se separen. Es la tercera vez en dos días que el arnés
encuentra lo mismo — **una prueba escrita sobre el caso más fácil de montar, no
sobre el que distingue**.

**Verificadas por mutación, doce casos:** el tipo sin validar contra la forma, el
panel sin métrica sin marcar, una métrica fuera del catálogo pasando, el id de la
métrica borrada pintado, los params sin validar, un param desconocido callado, los
problemas de la pestaña sin recoger, la regla inventada de vuelta, el resumen sin
decir que el servidor decide, el resumen sin decir en qué pestaña, el botón del
panel sin marcar, y el contador contando problemas en vez de pestañas.

### F4.13 cerrada el 2026-09-15 · el defecto que aparece la SEGUNDA vez

`SaveBar` y el cableado de `useSaveLayout`. **568 pruebas**, ocho nuevas, ocho
mutaciones muertas.

**El borrador local se descarta al guardar, y eso es la tarea.** El PUT devuelve
el layout con los `id` que el servidor acaba de asignar a las pestañas y paneles
nuevos. Si el borrador sobreviviera, esos **seguirían sin `id`** y el guardado
siguiente los crearía otra vez: duplicados. `useSaveLayout` ya deja el detalle
fresco en el cache, así que soltar el borrador hace que la pantalla lea de ahí.

**El síntoma solo aparece la segunda vez**, que es lo que lo hace peligroso: el
primer guardado se ve perfecto. La prueba guarda dos veces y mira los dos cuerpos
del PUT — `[tab-a, undefined]` y después `[tab-a, tab-nueva]`.

### Tres decisiones sobre qué se bloquea y qué se avisa

**Una versión publicada no se edita, y se dice antes de intentar.** El servicio
contesta 409; dejar apretar para que falle es enseñar que el botón a veces no
anda. Y la salida existe —duplicar la versión en un borrador nuevo, mandando su
`versionId` de origen—, así que se ofrece ahí mismo y la pantalla salta al
borrador creado.

**El 409 igual puede llegar**, porque alguien puede publicar entre que la
pantalla leyó la versión y el PUT sale. Se nombra con su causa y su salida, no
como «error al guardar» — que taparía la única acción que desatasca.

**Los problemas de composición NO bloquean guardar.** Un borrador es justamente
donde una composición a medias puede vivir; lo que no se puede es publicarla, y
eso lo deciden F4.14 y F4.15 contra el servidor. Se avisa cuántos quedan.

**Y el indicador de «sin guardar» se mudó del editor a la barra**, que es donde
está el botón: dos indicadores del mismo hecho envejecen igual que dos contadores.

### La cuarta vez que la mutación pide la prueba que distingue

`disabled={!sucio || guardando || publicada}` sin `publicada` **sobrevivía**:
todas las pruebas de versión publicada tenían el borrador limpio, así que
`!sucio` ya deshabilitaba el botón y las dos razones nunca se separaban. Hace
falta editar una versión publicada para verlo.

**Verificadas por mutación, ocho casos:** el borrador sobreviviendo al guardado,
guardar habilitado sin cambios, una versión publicada dejando apretar, la versión
publicada sin declararse, los problemas bloqueando, el 409 como error genérico,
duplicar sin mandar el `versionId` de origen, y duplicar sin saltar al borrador
nuevo.

### F4.14, F4.15 y F4.16 cerradas el 2026-09-15 · publicar es una secuencia

`PublishBar` y el cableado de `useValidateLayout` y `usePublishLayout`. **578
pruebas**, diez nuevas, diez mutaciones muertas.

**«Nunca se publica algo que el front dio por bueno y el servidor no vio.»** Eso
hace que publicar no sea un botón sino el final de tres pasos, y cada uno
invalida al siguiente:

1. **Guardar.** `POST /validate` valida lo que está **guardado**, no lo que se ve
   en pantalla. Con cambios sin guardar, un «válido» estaría contestando sobre
   otra composición — así que validar se deshabilita mientras el borrador esté
   sucio, y se dice por qué.
2. **Validar.** Y acá está la trampa del servicio: **responde 200 aunque la
   composición sea inválida.** El 200 dice que la validación corrió, no que el
   layout esté bien; lo que decide es `valido`. Leer el status sería dar por
   bueno cualquier cosa.
3. **Publicar**, solo si el servidor dijo `valido`. **Cualquier edición posterior
   retira el permiso**, y guardar también: el veredicto era sobre lo que había.

**El estado por defecto no es «listo».** Sin veredicto la pantalla dice «el
servidor todavía no vio esta composición», porque el silencio se lee como
aprobación. Es la misma razón por la que el resumen de F4.11 declara siempre que
el servidor decide.

**Los problemas del servidor vienen por id y acá ya no es un problema**: solo se
valida lo guardado, y lo guardado tiene id. Se resuelven contra el detalle para
nombrar la pestaña en vez de pintar su UUID.

**El 422 de publicar es información, no un fallo** · B4.15: el servidor rechaza
la publicación si hay paneles inválidos, y decirlo así es lo que distingue «hay
algo que arreglar» de «se rompió el sistema».

**Y publicar no despliega**, que la pantalla declara: es un cambio de dato sobre
qué layout sirve la consola, no un build. Por eso `usePublishLayout` invalida
también `me` y `tab` — las dos cachés de la consola—, que es el defecto silencioso
que F4.23 había anticipado y que `tests/api/admin.test.tsx` sostiene.

### F4.16 · los hooks estaban, y ahora tienen consumidor

`useLayouts`, `useLayoutDetail`, `useCreateDraft`, `useSaveLayout`,
`useValidateLayout` y `usePublishLayout` se escribieron en F4.23. **Lo que
cambió hoy es que los ocho tienen consumidor**, que es la diferencia entre un
hook y `BodyProps.presentation` — declarada meses, sin un solo llamador.

**Una desviación de nombre, dicha:** el plan pedía `useLayoutEditor` y lo que hay
son dos, `useLayoutDetail` para leer y `useSaveLayout` para escribir. Fundirlos en
uno habría mezclado una consulta con una mutación, que en TanStack son cosas
distintas con cachés distintos. La intención del nombre está cubierta; el nombre
no.

**Verificadas por mutación, diez casos:** publicar autorizando con que el servidor
haya contestado, editar sin retirar el permiso, validar con cambios sin guardar, el
motivo sin decirse, el silencio leído como aprobación, los problemas del servidor
sin listar, el UUID pintado en vez del nombre, guardar sin invalidar el veredicto,
el 422 como error genérico, y publicar sin mandar el `versionId`.
- F4.12: el preview llama al endpoint con rol simulado (B4.9). No se simula del
  lado del cliente filtrando lo que ya se tiene: eso probaría el filtro del
  front, que no existe.
- F4.15: publicar surte efecto sin deploy, y se ve en la consola en la siguiente
  carga.

### ➕ F4.21 ✅ Selector de gráfico en el builder
**CERRADA EL 2026-09-29**, con la ruta que escribimos el mismo día. `PlotPicker`
· §PEN:B3, leído antes de escribir la primera línea.

**Y AL CONSTRUIRLO APARECIÓ ALGO PEOR QUE LO QUE FALTABA: el builder BORRABA el
gráfico de todos los paneles al guardar.** `adaptarPanel` no leía `chart` y el
cuerpo del `PUT` no lo mandaba — y el `PUT` **reemplaza el layout entero**, con
esas palabras en el cable: «se envía el layout entero y lo que no venga se
borra». Abrir en el builder el layout que se publicó esa mañana con doce
gráficos y apretar Guardar los perdía los doce, en silencio.

**La cabecera de `borrador.ts` decía justo lo contrario** —«que el borrador tenga
la forma del cuerpo y no una intermedia es la decisión que sostiene todo lo
demás: **no hay una segunda traducción donde perder un campo**»—. Es cierto, y el
campo se perdió igual: **la forma nunca lo tuvo**. Una sola traducción protege de
perder lo que se transcribió; no protege de lo que no se transcribió nunca.

**Y una prueba vieja se puso roja al arreglarlo**, que es para lo que sirve fijar
el cuerpo del `PUT` entero con `toEqual`: un campo nuevo no entra sin que alguien
lo mire.

**Los cuatro bullets del criterio, y dónde quedó cada uno:**

| Bullet | Cómo |
|---|---|
| La lista se filtra por `formas`; los incompatibles **no se muestran** | El grupo de cada forma lista sólo los que la sirven. Un gráfico de dos formas aparece en los dos grupos, **y no es repetición**: su mínimo cambia con la forma |
| Cada opción **declara** su mínimo y su tope | Textual, con la razón del repertorio. **El mínimo es el de ESA forma**: `treemap` pide 2 en `categorica` y 3 en `composicion`, y mostrar el primero diría que alcanza con dos |
| Con `serieConBanda`, sólo gráficos con banda | Lo sostiene la estructura: las únicas entradas cuyas `formas` incluyen `serieConBanda` son las tres que declaran `soportaBanda: true` |
| No elegir nada es válido | Se dice en pantalla —«sin elegir · usa el de por defecto del tipo»— y hay un botón para quitarlo |

**Quitar necesitó su propia función**, y la razón es un modo de falla conocido
del otro lado: `editarPanel` mezcla con spread, así que `{ grafico: undefined }`
**deja la clave intacta** y «quitar» se vería funcionando sin hacer nada.

**TRES COSAS DEL DIBUJO QUE NO SE CONSTRUYERON, cada una con su razón escrita en
el componente:**

1. **El preview.** La nota del `.pen` es explícita —«el preview es el espécimen de
   la librería, no una miniatura aparte: un Plot no escala»— y tiene razón, por
   eso no se dibujó una miniatura. Lo que falta es el **espécimen**: un valor de
   muestra por forma que no declara ni el contrato ni `/config/plots`. Inventarlo
   sería meter cifras fabricadas en el producto.
2. **La opción deshabilitada por tope.** Necesita el DATO para saber si se
   excede, y el builder va sin payloads por decisión escrita de F4.12.
3. **La descripción de una línea** —`UNA CATEGORÍA, UNA MEDIDA` en el frame—. El
   repertorio no la lleva y escribirla acá sería inventar copy de producto.

**Y una que sí cambia respecto del dibujo:** la nota dice «se abre al soltar un
tipo», y acá se abre desde el configurador, con la métrica ya puesta. Mover el
selector al drop reordena el flujo entero —gráfico antes que métrica— y eso es
F4.10, no esta tarea.

**Seis mutaciones fieles, seis muertas**: las dos del campo que se borraba —leer
y escribir—, la del borrador que lo perdía al serializar, la de «quitar» con
spread, la del mínimo tomado del primero de la lista, y la de la lista sin
filtrar por forma.

**Descripción.** El configurador de panel ofrece los gráficos **compatibles con
la forma de la métrica elegida**, no los 49. Consume `/config/plots` vía
`catalog/plots.ts`.
**Criterio de aceptación.**
- La lista se filtra por `formas`; los incompatibles no se muestran, no se
  muestran deshabilitados sin explicación.
- Cada opción declara su mínimo y su tope, para que quien compone sepa antes de
  publicar que el gráfico va a quedar vacío en un tenant chico.
- Con `serieConBanda`, solo aparecen gráficos con `soportaBanda`.
- No elegir nada es válido: el panel usa el gráfico por defecto de su tipo.

**EL CABLEADO DEL 2026-09-29 NO DESTRABA ESTO Y AGRANDÓ SU HUECO.** Ahora hay
quince ids con dibujo de los 49, y el builder **sigue ofreciendo los 49 sin
saber cuáles existen**: no se tocó `src/surfaces/builder/`. Un admin puede
guardar un panel con un id que esta versión declara en vez de dibujar, y lo que
verá en la consola es `UnknownPlotState` con el id adentro — que es honesto pero
llega después de publicar. El feedback inmediato del front todavía no distingue
«no compatible» de «no construido», y esa distinción es de `/config/plots`.

### F4.12 parcial el 2026-09-15 · la composición, no las cifras

`RolePreview` y el cableado de `usePreview`. **604 pruebas**, doce nuevas, once
mutaciones muertas.

**Queda en ⚠️ por una razón que decidimos nosotros y está escrita.** §7.2 pide
«renderiza la composición exactamente como la verá el rol, **con datos reales**»,
y B4.9 decidió que el preview va **sin payloads**: con el layout alcanza para
«CEO vs Planner», con payloads habría que fijar qué período usa y si un panel
oculto llega como `SIN_PERMISO`, y materializar costaría lo mismo que la consola
real. La mitad que falta es deliberada, no un olvido — y la pantalla la declara.

**Los paneles NO se dibujan con `render/Panel`, y esa es la decisión del día.**
Hacerlo exigiría inventarle un payload: un `BLOQUEADO` que ningún servidor emitió,
o un `CARGANDO` que no está cargando. Compila, se ve bien y miente — que es
exactamente lo que este repositorio persigue. Se dibuja **la grilla con las
posiciones reales** —`gridStyle`, `panelStyle` y `readingOrder` de
`render/grid.ts`, así que la colocación es la misma que la consola aplica— y cada
hueco dice qué métrica va ahí y de qué tamaño. Hay una prueba que verifica que
ninguno de los cuatro nombres de estado aparezca en pantalla.

**El recorte lo hace el servidor y las pruebas lo respetan.** Los fixtures
devuelven lo que `/admin/layouts/:id/preview?roleId=` contestaría, ya filtrado, y
hay una prueba de que cambiar de rol **pide otro preview** en vez de filtrar acá.
«Filtrar en el front lo que ya se tiene probaría el filtro del front, que no
existe.» La clave de cache lleva los dos ids: un preview servido desde el cache de
otro rol es la mentira que B4.9 existe para no cometer.

### Un campo que nadie leía, encontrado por mutación

`sinPayloads` viajaba desde el cable, se adaptaba… **y no lo leía nadie**: el
aviso de «esta vista no trae cifras» estaba escrito fijo. Es el modo de falla de
`BodyProps.presentation` —declarada meses, sin un solo consumidor— y la mutación
que lo ponía en `false` sobrevivía.

Ahora el aviso cuelga del campo. **El día que el servicio empiece a mandar cifras,
el aviso se apaga solo**; escrito fijo habría seguido diciendo que no las hay, y
nadie lo habría notado hasta mirar.

### Y B4 · el binder dejó de declararse «pendiente»

Su razón decía «falta construir la pantalla · F4.10» y eso era falso desde que
F4.10 cerró: el binder existe y **vive dentro de B1**, porque configurar un panel
exige tenerlo elegido y elegirlo es de B1. Una pantalla suelta obligaría a
duplicar la selección de pestaña y de panel para llegar al mismo formulario.

**Es una desviación de §7.2, que lo describe como pantalla propia, y va dicha**:
la pantalla ahora dice «está construida, en otra pantalla» y dónde. Decirle
«Pendiente» a algo hecho miente sobre trabajo hecho, que es el mismo error que
marcar ✅ algo a medias, por el otro lado.

**Verificadas por mutación, once casos:** el cache compartido entre roles, el
aviso de «sin cifras» borrado, el aviso escrito fijo, el toggle que no dispara, la
posición sin pintar, el id de métrica en vez del nombre, el rol vacío sin
declarar, el 404 como error genérico, sin roles sin mandar a definirlos, el
adaptador perdiendo `sinPayloads`, y el adaptador leyendo el preview en
PascalCase.

### El chrome del builder, rehecho el 2026-09-15 contra el `.pen`

**Divergencia 1 de la auditoría.** `BuilderChrome`, `pantallas.ts`, `SaveBar` y
`PublishBar`. **609 pruebas**, cuatro nuevas, diez mutaciones muertas.

**El contexto va en la cabecera y es persistente.** El `.pen` dibuja
`TENANT · ROL · PESTAÑA` arriba en B2, B4 y B6, con «3 CAMBIOS SIN GUARDAR`,
`VISTA PREVIA` y `PUBLICAR`. F4.6–F4.15 los habían puesto en barras dentro del
cuerpo, y eso tiene dos consecuencias: **al salir de B1 se perdía de vista sobre
qué cliente y qué rol se estaba componiendo**, y el aviso de cambios sin guardar
desaparecía al cambiar de pantalla — que es justo cuando hace falta.

**El chrome tiene cuatro formas y cada pantalla declara la suya**, igual que el
ancho: `identidad` (B1, que elige el contexto y por eso no lo muestra resuelto),
`composicion` (contexto + guardar + vista previa + publicar), `contexto` (B6, que
mira y no toca) y `ninguno` — **B5, que pinta la consola del cliente**: «SIN
CHROME DE EDICIÓN · DATOS REALES · ASÍ SE PUBLICA».

**B1 usa `composicion` prestada, y está dicho en una línea.** En el `.pen` B1 solo
elige el contexto y la composición ocurre en B2; acá B1 hospeda además el editor
porque **B2 no existe todavía** — es F4.9. Sin el contador y el botón de guardar,
la pantalla donde se edita no tiene cómo guardar. **El día que F4.9 mueva la
composición a B2, vuelve a `identidad`** y el cambio es esa línea.

### El selector de rol, que F4.7 declaró imposible y ahora es posible

**F4.7 tenía razón entonces y dejó de tenerla.** El único origen de roles era
`RoleIDs` de `LayoutDetail`: UUID sin nombre, y su unión deja afuera a todo rol
que todavía no tiene pestaña — justo el rol para el que uno abre el builder.
**B4.8 lo desbloqueó**: `GET /admin/tenants/:id/roles` devuelve todos, con nombre.

El `.pen` confirma que va en B1: «EL TENANT DEFINE EL CATÁLOGO Y LA PLANTILLA · EL
ROL DEFINE QUÉ PESTAÑAS SE EDITAN». Y la prueba usa un fixture con un rol **sin
ninguna pestaña asignada**, que es el que la vieja aproximación no habría
encontrado nunca.

### Dos cosas que dijo el compilador y no una prueba

**El rótulo de «ancho 1440» era código muerto.** Al estrechar por la forma de
chrome, TypeScript marcó que `pantalla.ancho === 1440` no puede ser cierto dentro
de la cabecera: **la única pantalla de 1440 es B5, y B5 no lleva cabecera.** El
1440 sigue declarado y verificado en `pantallas.ts`; lo que no existe es un lugar
en la UI donde decirlo.

**Y la rama de `identidad` quedó marcada como muerta también**, porque hoy
ninguna pantalla la usa. Ahí la respuesta no era borrarla —vuelve con F4.9— sino
**preguntar por predicados tipados en vez de comparar en línea**: un parámetro no
se estrecha en el sitio de llamada, así que `sinChrome(forma)` y
`conContexto(forma)` dicen lo que el componente soporta y no lo que la tabla usa
hoy.

### Una desviación del `.pen` que va dicha

**El `.pen` no dibuja un botón de guardar.** Muestra «3 CAMBIOS SIN GUARDAR» y, al
lado, solo `VISTA PREVIA` y `PUBLICAR`. §7.2 sí exige el guardado explícito, así
que el botón hace falta y el único lugar coherente es junto al indicador que lo
motiva. Queda anotado en el componente: si diseño resolvió el guardado de otra
forma que no llegó al `.pen`, eso es lo que hay que cambiar.

**Verificadas por mutación, diez casos:** B5 recuperando chrome, el contexto sin
persistir, el contexto sin rótulos, el contador ausente, el contador contando
pulsaciones, guardar ofrecido sin cambios, guardar sobre una versión publicada,
publicar sin veredicto, el selector de rol desaparecido, y el vacío de roles sin
decir a dónde ir.

### F4.9 cerrada el 2026-09-15 · el canvas

`disposicion.ts`, `grupos.ts`, `Library`, `Canvas`, más `reubicarPanel` y
`redimensionarPanel` en el borrador. **656 pruebas**, cuarenta y siete nuevas,
veintiuna mutaciones muertas.

**La propuesta se aprobó y se revisó contra el `.pen`** —
`docs/PROPUESTA-CANVAS-2026-09-15.md`—, con una condición del humano: «debe ser
fácil y clara la interacción». Eso se tradujo en dos cosas concretas que el frame
`B2` ya dibujaba: la grilla visible con guías, y el aviso de colisión que
**nombra el panel** en vez de solo marcarlo.

### El hecho del modelo que condicionó todo

**`PanelConfigurado` no tiene `rowStart`.** Declara `colStart`, `colSpan` y
`rowSpan`; la fila la resuelve la colocación automática de CSS y el único control
sobre ella es **el orden de los paneles**. Dos consecuencias que el canvas no
puede esquivar:

1. **Mover hacia arriba o hacia abajo es reordenar**, no fijar una fila. Soltar en
   la fila 5 se traduce a una posición del arreglo · `ordenPara`.
2. **No se puede dejar un hueco a propósito.** Los huecos que se ven son los que
   la colocación dejó, y por eso se **derivan** en vez de guardarse.

Y para saber qué panel está bajo el cursor hay que saber en qué fila cayó cada
uno — eso lo decide el navegador, así que `disposicion.ts` **repite el algoritmo
de `grid-auto-flow: row`**: orden del documento, primera fila libre desde un
cursor que no retrocede. No es `dense`, y hay una prueba de que un hueco que quedó
atrás no se rellena.

### Las celdas son elementos, y eso borra toda la matemática de píxeles

El lienzo pinta **12 × N celdas reales** detrás de los paneles, y cada una es su
propio destino de soltado. «En qué celda cayó el cursor» lo contesta el navegador
y no una cuenta con `getBoundingClientRect` —que además habría que recalcular en
cada scroll—. **Y esas mismas celdas son las guías** que §7.2 pide. Una cosa para
las dos, y en jsdom se puede probar, que con píxeles no: ahí todo mide cero.

### Tres cosas que el arnés encontró y no eran pruebas débiles

**Una guarda que dependía de un estado que a veces miente.** La verificación del
borde usaba `arrastrando` —el estado que marca el ítem en vuelo— en vez del dato
que el navegador entrega al soltar. Una prueba que soltaba sin pasar por la
biblioteca pasaba igual. Ahora el estado solo alimenta la vista previa; las
decisiones salen del `dataTransfer`.

**Una verificación multifila que no se podía alcanzar.** La colocación revisaba
las `rowSpan` filas antes de aceptar una posición, y la mutación que la reducía a
una sola **sobrevivía**. No era una prueba floja: es que **alcanza con la primera
fila, y se puede demostrar** — un panel que bloqueara una fila posterior sin
bloquear la primera tendría que empezar más abajo que el cursor, y el cursor no
retrocede. Comprobado además por fuerza bruta sobre **531.441 combinaciones de
cuatro paneles: cero diferencias**. Se sacó el código en vez de inventarle un
caso: **código defensivo que no se puede ejercitar es código que nadie va a
mantener bien.**

**Y un fixture que no distinguía.** Las pruebas de reubicación movían paneles en
horizontal, donde el orden no cambia el resultado. La mutación que quitaba el
reordenamiento sobrevivía; hace falta un movimiento vertical para verla.

### El agrupado de la biblioteca vive en el front, y es una deuda declarada

§7.2 nombra los cinco grupos y no dice qué tipo va en cuál; el reparto sale del
`.pen`. **`/config/blocks` no manda el grupo**, así que la tabla está acá — la
misma clase de duplicación que `PARAM_SCHEMAS`, y merece la misma propuesta de
spec. Mientras tanto, **un tipo que el backend agregue no desaparece**: sale
aparte, con su rótulo, igual que `adaptCatalog` hace con una forma desconocida.

### Lo que no se implementó, con la razón

**El arrastre continuo del handle.** Los handles redimensionan de a una celda por
pulsación, y `shift` + flechas hace lo mismo. Un arrastre continuo que termina
redondeando a la celda **no agrega ninguna posición alcanzable**: agrega la
sensación del gesto. Es una mejora de interacción, no una capacidad que falte.

**Y el badge `HEREDADO` sigue fuera**, como F4.7 ya había declarado: el cable no
tiene herencia — ni vertical del tenant, ni plantillas, ni un campo que diga de
dónde viene un panel.

**Verificadas por mutación, veintiuna:** el alto sin marcar, el cursor
retrocediendo, el `colStart` sin recortar, `choqueCon` sin ignorar el movido,
pegado contado como encima, los huecos sin fundir, los huecos inventados abajo, la
colisión sin nombrar, el borde sin verificar, el span sin salir del bloque, el
teclado saltándose las reglas, `shift` sin redimensionar, `Escape` sin
deseleccionar, la vista previa apagada, la fórmula de altura cambiada, los handles
sin seleccionar, un tipo desconocido tragado, un grupo vacío desaparecido, el
rango del tipo ignorado, reubicar sin reordenar, y la biblioteca sin declarar el
rango.

### El estado de carga de administración · divergencia 3, cerrada el 2026-09-15

`SkeletonRows` y el cableado en A1, A2 y A4. **666 pruebas**, diez nuevas, doce
mutaciones muertas.

**Esqueleto y nunca spinner**, que es lo que la nota de `A1 · Clientes ·
cargando` escribe: «la tabla ya sabe cuántas columnas tiene y de qué ancho, así
que **puede prometer la forma que va a llegar**. Un spinner solo dice "esperá"».
Es la misma decisión que `render/states/LoadingState` toma para un panel, con una
vuelta de tuerca: una tabla promete más, porque su encabezado ya dice qué columnas
van a venir.

**Lo que cambió no es solo el widget: es qué se reemplaza.** Antes la pantalla
entera se sustituía por «Cargando el catálogo…», y eso **tira información que ya
estaba lista** — el encabezado, los filtros, los CTA y la declaración de los
cuatro campos que §7.3 pide y el cable no trae no dependen de los datos. Ahora se
pinta la pantalla y solo las filas son esqueleto.

**Y los conteos dicen CARGANDO, no una cifra.** «3 clientes» mientras carga
afirma algo que todavía no llegó — la misma regla que impide pintar un número
aproximado en un panel degradado.

**Una sola variante para las cuatro**, como pide la nota: el esqueleto no sabe de
qué tabla es, recibe cuántas columnas tiene. A2 no es una tabla y lleva tarjetas
con forma de ficha de rol — misma idea, otra forma.

### Dos afirmaciones que el código hacía y nadie comprobaba

**«Las barras no son todas del mismo ancho»**, que el componente justifica con
que «una grilla de barras idénticas se lee como un patrón y no como texto que va a
llegar». La mutación que las igualaba **sobrevivía**: el comentario decía algo que
ninguna prueba miraba. Ahora hay una que cuenta anchos distintos.

**Y el esqueleto de A4 no estaba verificado**: la prueba miraba `aria-busy` y no
las filas, así que la tabla podía quedar vacía y marcada como ocupada.

Es la misma forma que el arnés viene encontrando toda la jornada — **una
aserción que mira el borde del efecto y no el efecto**.

### Los tres tipos de vacío · divergencia 4, cerrada el 2026-09-15

`EmptyRow`, más la búsqueda de A4. **673 pruebas**, siete nuevas, once mutaciones
muertas.

**Son tres cosas distintas y la salida cambia con la causa**, que es lo que las
tres notas de vacío del `.pen` repiten: «un estado sin salida es una queja».

| | Qué pasó | La salida |
|---|---|---|
| `sistema` | Nadie dio de alta nada todavía | Crear el primero |
| `filtro` | Los datos están · el filtro los esconde | **Deshacer lo que uno hizo** |
| `alta` | El cliente es nuevo y el trabajo está por hacerse | El siguiente paso |

**Confundir el de filtro con el de sistema manda a crear lo que ya existe**, y
es el error concreto que esto evita. Por eso el conteo lleva el total —«0
métricas con este filtro · 28 en total»—: sin él, cero con filtro y cero sin nada
se leen igual.

**Y el encabezado se conserva en los tres.** «Las columnas siguen diciendo qué
habría acá», así que el vacío es una FILA con `colSpan` y no un reemplazo de la
pantalla. Antes A1 y A4 se salían de la tabla y perdían lo único que explicaba
qué falta.

### El vacío de filtro era INALCANZABLE, y lo encontró la prueba

`CatalogView` filtraba solo por capa, **y el selector de capas se arma con las
capas que hay**: elegir una siempre devuelve al menos una métrica. El estado que
se estaba implementando no podía ocurrir.

La salida no fue relajar la prueba sino **completar la pantalla**: el `.pen` pone
«BUSCAR» al lado de los dos selectores, y una búsqueda sí puede dejar la tabla en
cero. Con eso el estado existe de verdad y la prueba lo alcanza.

**Es la segunda vez en la jornada que aparece código para un estado imposible** —
la primera fue la verificación multifila de la colocación. Las dos veces el arnés
lo mostró como una mutación que sobrevivía, y las dos veces la pregunta correcta
fue «¿esto puede pasar?» y no «¿cómo lo pruebo?».

### Y una guarda redundante, demostrable

`filtroVacio` preguntaba además si había un filtro puesto. Sobra: sin filtro,
`visibles` es `metrics` entero, así que con métricas cargadas la única forma de
que `visibles` quede en cero es que algún filtro esté activo. Se sacó.

**Verificadas por mutación, once:** el vacío de filtro sin deshacer, el vacío sin
`colSpan`, el vacío sin salida, A1 saliéndose de la tabla, A4 confundiendo los dos
vacíos, el conteo sin el total, el vacío mostrándose con la tabla llena, limpiar
sin limpiar la búsqueda, la búsqueda sin filtrar, A2 sin distinguir el de alta, y
A2 sin decir la consecuencia.

### El agrupado del binder · divergencia 2, cerrada el 2026-09-15

`PanelConfigurator`. **677 pruebas**, seis nuevas, once mutaciones muertas.

**Dos cambios, y el segundo es el que importa con treinta y cuatro métricas.**

**Uno · la razón se escribe desde la MÉTRICA.** El `.pen`: «REQUIERE
serieTemporal · ESTA ES escalar». `invalidReason` la dice desde el bloque —«un
bloque kpi no sabe dibujar la forma escalar»— y **ahí está bien y no se tocó**:
lo consume también la consola, donde el sujeto es el panel que no pudo dibujar.
Acá el sujeto es la métrica que se está por elegir, y la frase tiene que
contestar «¿por qué no puedo usar ésta?».

**Dos · las incompatibles van agrupadas.** «30 · AGRUPADAS POR RAZÓN», y después
«+ 24 MÁS · escalar (13) · prosa (2) · categorica (2)…». Seis individuales con su
razón **enseñan la regla**; treinta la esconden. Con dos métricas el agrupado no
se ve, y por eso la prueba usa un catálogo de veinticuatro: es el tamaño donde la
diferencia existe.

La razón de agrupar por **forma** y no por el mensaje completo: todas las
escalares fallan por lo mismo contra un tipo dado, así que agrupar por el mensaje
daría los mismos grupos con un rótulo más largo.

### Y tres cosas del `.pen` que faltaban

**Qué acepta el tipo, declarado** —«TIPO series · ACEPTA serieTemporal ·
seriesMultiples»—, que es la regla que gobierna las dos listas. **Que §5 la
gobierna**, dicho: «el binder no ofrece lo que el tipo no puede renderizar». Y
**la procedencia de cada métrica compatible** —«seriesMultiples · GOLD · ERP +
GA4»—, que es lo que deja elegir entre dos que sirven las dos.

**Verificadas por mutación, once:** las incompatibles filtradas, la razón desde el
bloque, sin agrupar, el resumen sin conteos, el resumen con cero, sin declarar qué
acepta el tipo, sin decir que §5 gobierna, el conteo sin el total, la métrica sin
procedencia, la lista en blanco cuando ninguna sirve, y las incompatibles
elegibles.

### La columna `USO` de A4 · divergencia 6, cerrada el 2026-09-15

`uso.ts` y la celda en `CatalogView`. **690 pruebas**, trece nuevas, diez
mutaciones muertas.

**F4.5 la había declarado ausente con un argumento que sigue siendo válido**:
contarla sobre el layout publicado le da **cero** a una métrica que solo se usa
en un borrador, y quien lo lea va a concluir «no se usa» y considerar retirarla.

**Lo que cambió no es el argumento sino qué está en la mano.** Desde F4.3, la
ficha de cliente ya pide el layout publicado y los roles del tenant, así que el
conteo **no cuesta un viaje más**. Y el problema del cero se resuelve diciendo
sobre qué se contó: la columna se rotula «del layout publicado», y una métrica
que no aparece dice **«sin uso publicado · puede estar en un borrador»** en vez
de «0».

**Los borradores no se recorren**, y es una decisión de costo declarada: serían N
viajes, uno por versión, para un dato que no cambia lo que los usuarios ven hoy.

### Y el conteo sirve para lo que §7.3 realmente pide

El `.pen` no muestra solo un número: la celda dice «2 · PANELES» y al desplegar,
«PEGA EN · Inventory & Shopping» y **«EDITAR SU NOMBRE, FAMILIA O TIPO CAMBIA LO
QUE VEN 2 ROLES»**. Ese aviso es lo que §7.3 pide antes de guardar una edición —
«editar una métrica en uso advierte qué paneles afecta antes de guardar»— y es lo
que hace útil al conteo **mientras editar todavía no existe**.

**La regla que se aplica mal, y tiene prueba:** un rol con `pestanas` vacío **las
ve todas**. Leerlo como «no ve ninguna» haría que A4 dijera que editar una
métrica no afecta a nadie, que es lo contrario de lo que el aviso existe para
decir.

### Los faltantes de A4 bajan de cuatro a tres

Y los tres que quedan cambiaron de razón con lo que se aprendió hoy: **frescura y
estado ya no esperan un campo del catálogo sino la salud de feeds** · B2.13. La
ventana sigue igual · B1.17 y B1.25.

**Verificadas por mutación, diez:** el rol sin pestañas dejando de ver todas, las
pestañas repetidas, el rol repetido, un panel sin métrica contado, los paneles sin
sumar, el «0» a secas, el aviso de roles borrado, la columna sin declarar sobre
qué contó, las pestañas sin nombrar, y el uso calculado sobre otro layout.

### El humo llega a `/admin/*`, y un modo para mirar · 2026-09-15

**Tres usuarios probados contra el servicio real, ninguno es `admin`.**
`gerardo.riarte@buentipo.com` y `rolando.aleman@underarmour.com` entran y son
`Planner`; `jose.rodriguez@lobueno.co` da **401**, y se descartó que fuera el
arnés —la contraseña llega intacta y el mismo script con otro usuario devuelve
200—, así que o la clave no es ésa o ese usuario no está en la base que corre.

**Lo que hace falta, con precisión:** el middleware compara el claim `role`
contra `"admin"`, y ese claim sale de **`user.Role.Name`** — el nombre del rol en
la tabla `roles`, en minúsculas y sin espacios. No es un permiso aparte ni un
flag: hace falta un usuario cuyo rol **se llame** `admin`.

**`npm run humo` ya cubre `/admin/*`** y **sale 2 · BLOQUEADO** cuando el usuario
no es admin, con la consola verificada igual y dicho aparte — «un chequeo que
pasa por falta de fuente miente sobre su cobertura». El día que exista el usuario
es correr el comando.

**Dos rutas se saltean a propósito.** `publish` demota el layout publicado del
tenant y cambia lo que la consola sirve: un chequeo de humo no toca producción. Y
las del fork dan 404 por diseño, así que contarlas como diferencia sería llorar
por algo que ya sabemos.

### `npm run dev:mock` · la Fase 4, navegable

Un servicio falso completo —consola, admin, builder y las cinco rutas del fork—
con estado en memoria: se compone, se guarda, se valida y se publica. Uno de cada
cuatro paneles llega degradado y otro bloqueado, porque con todo en `DISPONIBLE`
los siete estados de §8 no se ven nunca.

**Vive en `dev/`, con entrada propia**, y eso no es comodidad: F0.8 está
«cumplida por construcción» y la construcción es que **no exista ruta de import
desde `src/` hasta un mock**. Un import condicionado por `import.meta.env.DEV`
compila, anda, y deja el bundle a merced del tree-shaking.

**Y ahora hay una máquina que lo sostiene.** `mocks-fuera` recorre `src/**` y
falla si algún import —relativo o por alias, **incluido `import type`**— cae en
`tests/` o en `dev/`. Verificado rompiéndolo: con la ruta puesta sale 1 y la
nombra. La puerta suma un chequeo más · el conteo sale de `npm run verify`.

**Una garantía que depende de que nadie escriba una línea es una convención, no
una garantía** — y este repositorio ya había pagado por esa diferencia con
`plan:ancestro` y con `docs-registro`.

### Segunda tanda en el fork · 2026-09-15 · B1.25, B1.27, B4.1, B4.2 y B4.4

**Decidido por el humano tras ver el alcance:** el front escribe también estas
cinco, en el mismo fork. Commit `6f10b8e`, once pruebas nuevas, nueve mutaciones
muertas, y las suyas verdes sin tocar una sola línea que no fuera una firma que
cambió.

**El commit cambió de hash el 2026-09-16 · era `b13fccd`.** Se reescribió para
sacarle 44 líneas de reindentación: `gofmt` alinea bloques de campos
**contiguos**, así que un comentario metido en medio de un struct parte el bloque
y realinea líneas que nadie tocó. Los campos nuevos ahora van al final del
struct, con su comentario, formando su propio grupo. **De 63 borrados a 19**, y
los 19 que quedan son cambios de firma que se propagan a los mocks de ellos.

**Y se aprendió algo que vale para la próxima:** su repositorio **no está
`gofmt`-limpio** —hay varios archivos que `go fmt ./...` cambiaría hoy—, así que
correr el formateador sobre archivos suyos mete ruido ajeno al cambio. Es la
segunda vez que pasa: la primera se revirtieron tres archivos enteros. **La regla
es no formatear archivos de ellos**, aunque el editor lo ofrezca.

**Las cinco quedan en ⚠️, no en ✅**, por la misma regla que B4.8 y B4.9: una
`B*` pasa a ✅ **verificada contra el servicio corriendo**, y el fork no está
desplegado.

**Cinco columnas nuevas, y las migraciones NO las corrimos.** Son campos en los
structs, así que las aplica `AutoMigrate` — y la base es **la RDS compartida de
producción**. Escribir el campo es código; correrlo es un cambio de esquema en
producción, y esa decisión no es nuestra. Las cinco son aditivas y con default,
así que el servicio viejo sigue funcionando contra el esquema nuevo.

### Tres cosas que salieron de leer su código, no de escribirlo

**Una de seguridad.** B4.1 pedía cinco campos en `/admin/tenants`, y esa lista la
sirve `ListPublicOptions` — **que también alimenta el flujo PÚBLICO de solicitud
de acceso**. Sumarle `user_count` ahí filtraría cuántos usuarios tiene cada
cliente a quien todavía no es usuario de ninguno. Va en un DTO aparte. Es la
tercera vez que la misma forma aparece —`RoleRepository`, `TenantPublicOption`—:
**una estructura compartida se ensancha para todos sus consumidores, y no todos
tienen el mismo permiso.**

**Una que retira un pedido nuestro.** B1.13 pedía `presentation` para las siete
formas que no son escalares, «porque choca con ningún número desnudo».
**Estaba mal**: `presentation` la lee **un solo cuerpo, `KpiBody`**, y los demás
sacan sus rótulos del propio valor —`BarsBody` usa `i.etiqueta` de cada ítem—.
`PresentationFromRows` devolviendo `nil` para las otras siete **es correcto**.
Pedirlas habría sido pedir un campo que nadie lee.

**Y una de alcance.** De los cinco campos de B4.1, solo dos se pueden calcular:
`status` y `vertical` no existen como columna y la frescura del feed más atrasado
necesita B2.13. Se entregan los dos y se dice cuáles faltan.

### Lo que NO tomamos, y por qué

| | Por qué |
|---|---|
| B2.13 · salud de feeds | Crear la entidad exige acordar el modelo con el equipo de datos y una ingesta que no existe |
| B3.9 · estado del acceso | Exige saber cómo se verifica ese acceso hoy |
| B1.21 · mínimos por gráfico | Es una decisión de producto |
| Correr `sync-catalog` y `materialize` | Es operar su servicio contra Snowflake productivo |

**Y la regla que nos pusimos: paramos acá hasta que tomen lo que hay.** «Un fork
que nunca vuelve es un segundo backend»; con dos endpoints era una excepción, con
siete es una implementación paralela que alguien va a tener que reconciliar.

### Por qué F4.9 no se toma · y una trampa del propio parser

**La interacción del arrastre no está declarada, y el bloqueo NO es del
backend.** §7.2 describe el RESULTADO —slot vacío con su label, badge
`HEREDADO`, colisión marcada, nada se suelta encima— y no qué hace el cursor: qué
agarra, cómo se redimensiona, qué pasa al soltar fuera de la grilla, si hay
teclado.

**Hay propuesta escrita:** `docs/PROPUESTA-CANVAS-2026-09-15.md`, con cinco
puntos, la razón de cada uno y la alternativa descartada. Espera revisión de
diseño.

**Y la mitad de `HEREDADO` queda fuera igual**, aunque el arrastre se decida: el
cable no tiene herencia —ni vertical del tenant, ni plantillas, ni un campo que
diga de dónde viene un panel—, que es la misma carencia que F4.7 declaró en B1.

### Dos formas de escribir esto mal, y las dos se cometieron primero

**Una.** El bloqueo se marcó con `**Espera del backend.**`, que era la única
forma que el plan tenía de decir «esta tarea no se puede tomar y la razón no es
nuestra». Eso metió F4.9 en `docs/PARA-BACKEND.md` — **el documento que se le
manda al equipo de backend**. Una pregunta de diseño no es de ellos. El `🔒` del
título alcanza: `plan-a-csv.py` lo lee y marca la tarea bloqueada sin generar un
pedido.

**Dos, y es del parser.** Puesta la explicación como `**Descripción.**` debajo del
encabezado de F4.9, **se la quedaron también F4.6, F4.7 y F4.8**. No es un bug:
es la regla de agrupado —«varias tareas pueden compartir un bloque de descripción;
acá se les reparte a todas»— y F4.6 a F4.9 son cuatro encabezados seguidos sin
cuerpo. Darle cuerpo al último se lo da a los cuatro, y tres de ellos estaban
cerradas.

**La regla que queda escrita: en una corrida de encabezados, el cuerpo es de
todos.** Para decir algo de una sola tarea del grupo hay dos caminos —darle
cuerpo propio a cada una, o escribirlo en una sección de evidencia como ésta, que
el parser no reparte—. Se eligió el segundo, que es el que ya usan las once
tareas cerradas de esta fase.

### F4.17 ✅ `ComparisonBody` + `PlotDumbbell`
### F4.18 ✅ `MatrixBody` + `PlotHeatmap`
### F4.19 ✅ `GraphBody` + `PlotSankey`
### F4.20 ✅ Registrar los tres con carga diferida · el registro pasó a `Record` completo

**CERRADAS EL 2026-09-30 CONTRA DATO DE SNOWFLAKE, Y ESO ES LO QUE SE CIERRA.**
No «contra el servicio real», que se dice solo: los tres paneles se compusieron
sobre las tres métricas que corrimos contra Snowflake, se sirvieron por
`GET /config/tabs` del binario local y **se miraron en la consola** — el pie dice
15 paneles. `carga-diferida ✓ 15 cuerpos en 15 chunks`.

**Las dos condiciones del criterio se cumplieron el mismo día y por caminos
distintos:** el contrato declara las cinco formas desde el 2026-09-26, y la
métrica que las usa la escribimos nosotros —`platform_gap`,
`platform_month_matrix` y `spend_flow`, en `MetricRegistry`—. El candado decía
«se construyen cuando el backend envíe esas formas», y resultó que enviarlas era
trabajo nuestro.

**Qué se hizo, además de los tres archivos:**

| | |
|---|---|
| `adaptValue` | Tres `case` nuevos · `compared_categorical`, `matrix` y `flow` |
| `DIBUJABLES` | Las tres agregadas · de once a catorce formas |
| `registry.ts` | `LOADERS` y `BODIES` pasaron de `Partial<Record>` a `Record` completo · `MISSING_TYPES` quedó **vacía** |

**LAS DOS QUE QUEDAN AFUERA, cada una por su razón, y no es simetría pendiente:**
`perfilMultiatributo` tiene un solo gráfico en el repertorio —`radar`— y no está
construido; `grafo` no tiene ni gráfico **ni dato del cual salir**, porque ninguna
columna de las dos tablas Gold trae aristas origen→destino. Las dos se declaran
en pantalla con `UnknownPlotState`, que nombra el id — no caen al dibujo de al
lado.

**Y LOS TRES CUERPOS ACEPTAN LAS DOS FORMAS DE SU BLOQUE, que es un cambio de
criterio.** `GraphBody` llegó como `BodyProps<'flujo'>` con el argumento de que
restringir el tipo es más fuerte que una rama. **Es falso apenas el cuerpo entra
al registro:** `ErasedBodyProps` ancha `value` a la unión entera —lo dice su
propio comentario— así que un `grafo` compuesto sobre un bloque `graph` llega
igual y `PlotSankey` leería `etapas` de un valor que trae `nodos`. El tipo
estrecho no impedía nada; escondía la rama.

#### Lo que encontró MIRARLO, que es lo que ninguna prueba dijo

**NINGUNO DE LOS TRES TIENE TOPE, y con la cardinalidad real los tres fallan
distinto.** Medido en la consola el 2026-09-30, con los paneles servidos por el
binario local:

| Gráfico | Filas reales | Qué se ve |
|---|---|---|
| `dumbbell` | 22 de 37 ítems | Se **recorta** al alto del panel y nada dice que faltan |
| `heatmap` | 38 × 12 | Los rótulos de fila **se pisan** entre sí: ilegibles |
| `sankey` | 23 etapas | Las veinte cintas chicas se apilan en una banda sin rótulos |

**El repertorio declara mínimos para las tres formas y tope para ninguna.** El
mecanismo existe —`tope` lo evalúa `catalog/plots.ts` y lo hace cumplir
`plotProblemOf`, y `radar` ya lo usa— así que lo que falta es el NÚMERO, y ése es
producto: se avisó a datos en
`docs/MENSAJE-2026-09-30-datos-lo-que-encontro-correrlo.md` y queda como
propuesta, no se decide acá.

**A cardinalidad sana los tres se leen bien**, y eso se comprobó aparte en
`dev:mock` con cinco y seis filas: el problema es el corte del dato, no el plot.

#### Dos defectos que salieron de construir esto, los dos arreglados

- **`PlotHeatmap` recortaba los rótulos de COLUMNA con el presupuesto de las
  FILAS.** Un solo `cap`, sacado de la canaleta de rótulos de fila, aplicado a
  los dos ejes. Miente en las dos direcciones y las dos se midieron: con filas de
  30 caracteres el tope sube a 29 y los rótulos de columna pasan enteros con
  149px sobre celdas de 52; con filas cortas un rótulo de columna se recorta a
  siete caracteres aunque su celda mida 261. **Lo encontró una mutación que
  SOBREVIVIÓ** —ningún fixture tenía las dos longitudes desacopladas, así que el
  error no podía salir— y su prueba se escribió con el arreglo puesto.
- **`GET /config/plots` no tenía handler en MSW.** La consola en `dev:mock`
  corría con el **repertorio vacío**, así que ningún mínimo ni tope se ejercitaba
  ahí; MSW lo avisaba por consola y la aplicación seguía andando. Ahora
  `tools/gen-plots.py` emite también `dev/mocks/repertorio.json`, de modo que las
  49 filas del mock son las mismas que las del servicio y no una tercera tabla
  escrita aparte.

#### Y el patrón del caso negativo rancio apareció otras tres veces

Las tres en el mismo commit, y las tres las atrapó la puerta en rojo:

1. `adapt.test.ts` afirmaba que **cinco** formas no se adaptaban; tres pasaron a
   adaptarse. Se movió a las dos que quedan y se agregaron siete positivas.
2. «una forma que el front todavía NO DIBUJA» usaba `matrix` —ya había mudado de
   `distribution` el 2026-09-25—. Ahora usa `graph`, que es la que menos probable
   es que se mueva: no tiene gráfico **ni** dato.
3. `registry.test.tsx` recorría `MISSING_TYPES` para afirmar que un tipo sin
   cuerpo no cae en un fallback. Con la lista vacía el `for` no ejecuta ninguna
   afirmación: habría quedado verde sin verificar nada. Se reemplazó por un tipo
   **inventado**, que es lo que la hace permanente — `bodyFor` recibe su
   argumento de `block_type`, una cadena libre en el cable.

**Criterio de aceptación.**
- Se construyen cuando el contrato declare esas formas **y** exista una métrica
  que las use. Las dos mitades se cumplieron el 2026-09-30.
- Al estar los quince, el registro pasa de `Partial<Record<PanelType, …>>` a
  `Record` completo, y **agregar un tipo al enumerado sin su cuerpo deja de
  compilar**. Hecho, y verificado por mutación: quitar `graph` de `LOADERS` deja
  de compilar y rompe la paridad contra el enumerado del yaml.
**PEDIDO A DATOS EL 2026-09-29** · `docs/MENSAJE-2026-09-29-datos-formas-sin-metrica.md`.

**Espera de datos.** **La fila del catálogo y el esquema de Gold** · el SQL lo
escribimos nosotros. **Medido contra `de881e1` el 2026-09-29.**

**CORREGIDO ANTES DE MANDAR EL PEDIDO, y la corrección es la mitad de esto.** El
mensaje decía «nada del backend» y era falso: al leer `queries.go` apareció que
**la consulta de cada métrica NO vive en Snowflake** sino en `MetricRegistry`, un
mapa en el Go del backend, con `Shape` y `BuildSQL func(t Tables, b Bounds) string`.
Una métrica nueva necesita su entrada ahí — **y esa entrada la sabemos escribir**:
es lo mismo que hicimos con `/config/plots`.

**Tres de las cuatro formas salen del dato que YA existe**, leído de las
consultas que el backend tiene escritas:

| Forma | De dónde sale |
|---|---|
| `compared_categorical` | `goals_vs_actual` devolviendo `v` y `ref` por separado en vez del cociente `real/objetivo` |
| `matrix` | `FUENTE × mes` de `GLD_PAID_MEDIA`, o día-de-semana × semana de la diaria |
| `flow` | El embudo `VISITS → SESSIONS → ORDERS` de la diaria · tres etapas |

**`graph` no sale** —ninguna columna de las dos Gold tiene aristas origen→destino—
y **`multi_attribute_profile` tampoco** mientras los atributos no compartan
unidad, que es una regla de nuestro contrato: un radar con pesos en un eje y
porcentaje en otro dibuja un área que depende del orden de los ejes.

**CONTESTADO EL 2026-09-30**, y de su nota salieron un dato nuevo y un hallazgo:

- **El default de `MIN_GRAIN` es del SYNC, no de la view.** Verificado en
  `dd_catalog_sync_service.go`: `if minGrain == "" { minGrain = "month" }`. Así
  que «las dieciocho declaran `month`» tiene dos causas y desde Postgres no se
  distinguen — la consulta que desambigua es de datos, porque nosotros no
  corremos SQL en Snowflake.
- **Su afirmación de que una forma nueva se materializa «sin cambios de código»
  es falsa**, y está en su propio `dd_materializer_service.go`: sin entrada en
  `MetricRegistry` la métrica sale `BLOCKED · No Snowflake query registered`. Es
  el mismo error que nosotros cometimos al revés el 29 —«nada del backend»— y
  las dos veces la causa fue no leer `queries.go`.
- **Y LA FORMA SE DECLARA DOS VECES.** `Materialize(spec.Shape, ...)` usa la del
  REGISTRO; el front lee la del CATÁLOGO en `/config/catalog`. Si difieren, el
  único efecto es un `slog.Warn` en el servidor: **un panel compuesto para una
  forma recibiendo otra**, que es el modo de falla que este producto persigue.
  Propuesto que falle en vez de avisar ·
  `docs/MENSAJE-2026-09-30-backend-registry-y-forma.md`.

**LAS TRES ENTRADAS ESTÁN ESCRITAS Y PROBADAS CONTRA SNOWFLAKE · 2026-09-30** ·
`8876b4d` en `feature/config-plots` del fork. `platform_gap`
(`compared_categorical`), `platform_month_matrix` (`matrix`) y `spend_flow`
(`flow`), **las tres sobre columnas que `platform_return` ya leía**. Corrida real:
`available 19 · blocked 2 · errors 0`, y los dos bloqueados son los de prosa.

**Churn +100 −2 en archivos de ellos**, y los 2 son una expectativa que quedó
rancia: `AffectedMetrics` decía «sólo `platform_return`» y ahora son cuatro las
métricas de paid media — que las cuatro se afecten si falta la tabla es el
comportamiento correcto.

**Y correrlo encontró tres cosas del dato**, que es lo que ningún esquema habría
dicho: dieciséis plataformas con retorno y **sin costo**, `Daily Motion` y
`Dailymotion` como dos filas distintas, y **38 plataformas** donde habíamos
estimado seis —el panel muestra seis porque tiene un tope, no porque haya seis—.
Avisado en `docs/MENSAJE-2026-09-30-datos-lo-que-encontro-correrlo.md`.

**Esa última es la mejor evidencia de por qué el inventario va primero**: una
suposición sobre la cardinalidad ya nos hizo escribir mal un pedido.

**Lo de datos son dos cosas y ninguna es la consulta:**

1. **La fila en `SYNAPSE_METRIC_CATALOG` con su copy** — `NAME`, `BASE`,
   `SOURCE`, `MEASUREMENT_WINDOW`, `SEMANTIC_DIRECTION` y el `SHAPE`. Los cinco
   primeros **se pintan textuales en pantalla**, así que es copy de producto y su
   dueño es el catálogo.
2. **El esquema de las dos tablas Gold.** Hoy lo conocemos de forma **indirecta**:
   las columnas las dedujimos de las consultas del backend, no de mirarlo.
   `schema-check` no sirve — verifica que los objetos existan, no lista columnas.

| Pieza | Estado |
|---|---|
| `TransformValue` del backend | **las 16**, quince `case` sin lista blanca |
| `contracts/synapse-api.yaml` | **las 16** `Valor*` |
| `GET /config/blocks` | **las 16** en `accepted_shapes` |
| El catálogo de métricas | **5 de 16** |

**Tres capas saben recibir once formas que ninguna métrica emite**, y el mensaje
lleva además **qué columnas tiene que devolver la consulta de cada forma**, leído
de su transformador y no de nuestra documentación — acepta alias en español e
inglés, que es lo que más cuesta adivinar.

**Y no hay nada del backend en esto**, aunque el pedido empezó redactado para
ellos: su transformador no tiene compuerta por forma. Es la corrección que la
medición obligó, y por eso el mensaje la lleva adelante.

**Lo tiene: DATOS**

**Verificado el 2026-09-26 contra `8633b10`.** **EL BLOQUEO CAMBIÓ DE DUEÑO.** El criterio decía «se construyen cuando el backend envíe esas formas (B5.3), no antes», y esa mitad ya no lo frena: `transform_v11.go` transforma **las cinco** —`compared_categorical`, `multi_attribute_profile`, `matrix`, `graph`, `flow`— y el `switch` principal las enruta con constantes.

**Son las mismas siete que `grep "case \""` no veía el 2026-09-25**, y por las que se les mandó un mensaje equivocado. Leerlas bien es lo que corrigió esto.

Su respuesta del 25 lo dice del otro lado: «sobre las cinco formas v1.1: de acuerdo, **entran juntas cuando ustedes las declaren**».

**Así que lo que queda son dos cosas, y ninguna es del backend:**

1. ~~**Declarar las cinco en `contracts/synapse-api.yaml`.**~~ **HECHO** · medido
   el 2026-09-29: el contrato declara **las dieciséis** `Valor*`, incluidas
   `ValorMatriz`, `ValorGrafo`, `ValorFlujo`, `ValorCategoricaComparada` y
   `ValorPerfilMultiatributo`, cada una con sus campos requeridos. Esta mitad del
   bloqueo venció y el plan seguía diciendo que no.
2. **Una métrica que las use.** Las 18 del tenant declaran `scalar`, `categorical`, `prose`, `tabular`, `multi_series` y `time_series`. Un cuerpo para una forma que nadie emite es código sin consumidor.

**Nuestra mitad se hizo el 2026-09-26**: el contrato declara las cinco, con sus decisiones en cada esquema y en `docs/DECISIONES-2026-09-26-formas-v11.md`. Al declararlas **`isEmpty` dejó de compilar**, que es para lo que su `switch` está escrito exhaustivo, y las cinco decisiones de «vacío» quedaron tomadas con su razón.

**El `🔒` se queda, y ahora apunta a DATOS**: hace falta una métrica que use una de las cinco. Las 18 del tenant declaran `scalar`, `categorical`, `prose`, `tabular`, `multi_series` y `time_series`.

**Y `adapt.ts` las sigue rechazando** con su razón —«forma que el front todavía no dibuja»— hasta que existan los cuerpos. Es correcto: una forma declarada sin cuerpo daría un panel en blanco sin decir por qué.
**Criterio de aceptación.**
- Se construyen cuando el contrato declare esas formas **y** exista una métrica
  que las use. Hoy ninguna las usa; existen para que el builder pueda ofrecerlas.
- Al estar los quince, el registro pasa de `Partial<Record<PanelType, …>>` a
  `Record` completo, y **agregar un tipo al enumerado sin su cuerpo deja de
  compilar**.

#### La lista de «se puede tomar hoy» decía el doble de lo que era · 2026-09-15

**Ocho de las dieciséis que `docs/ESTADO.md` ofrecía estaban bloqueadas**, y el
documento no podía saberlo: `estado.py` lee `🔒` en el título o
`**Espera del backend.**` en el cuerpo, **y de nada más** —está escrito en su
propia cabecera—. La razón de cada una vivía en prosa, y la prosa no llega a la
herramienta.

Es el mismo modo de falla que ya está registrado con «once chequeos» cuando ya
eran quince: un dato escrito a mano que se vence sin que nadie lo note. Acá era
peor que un número desactualizado, porque **la lista es lo que alguien lee para
decidir qué hacer después**, y ofrecía trabajo imposible.

Las ocho, cada una verificada hoy y no deducida:

| Tarea | Qué la frena | Cómo se comprobó |
|---|---|---|
| F1.13b | `Contexto` no trae locale, moneda ni zona | `/config/me` devuelve `tenant: {id, name}` y nada más |
| F1.31 | `/config/plots` | **404** contra el servicio corriendo |
| F4.17–F4.19 | `Valor` no declara sus formas | El yaml, con su decisión del 2026-08-19 |
| F4.20 | Espera a las tres de arriba | — |
| F4.21 | `/config/plots` | **404**, la misma corrida |
| F5.3 | Los plots de F4.17–F4.19 | — |

Y al verificar las ocho que quedaban, **las ocho también estaban bloqueadas**.
La lista quedó en **cero**, que es el número real.

| Tarea | Qué la frena | Cómo se comprobó |
|---|---|---|
| F1.42 | El período llega como cadena suelta | `/config/me` manda `['2026-09', '2026-08', …]`: sin `estado` ni cobertura. Y el criterio **prohíbe** derivarlo de `new Date()` en el front |
| F2.3 | `/config/solicitudes` | **404** |
| F3.3 | La mitad que queda espera a T4 | La otra mitad ya está bien: «hoy no se pinta ninguno de los dos y eso es correcto», dice su propio criterio |
| F3.7 | `HiloResumen` no trae panel ni período | El yaml. Es el mismo hueco que T4, por el otro lado |
| F4.3 | Ninguna ruta lista usuarios | `/admin/users` **404**, `/admin/roles` **404** |
| F4.12 | La ruta es del fork, sin desplegar | `/admin/roles` **404** |
| F5.1 | `Contexto` no declara `layouts` | El yaml, y `/config/layouts` **404** |
| F5.10 | La casilla 13 espera a T4 | `POST /config/chat` no tiene campo para el panel · **vencido: T4 cerró el 2026-09-17 y la casilla el 21** |

**No se marcó ninguna sin medirla.** Las que dicen 404 se probaron contra el
servicio corriendo el 2026-09-15 con un token válido; las que dicen «el yaml» se
leyeron del contrato.

#### Y eso deja el front sin trabajo tomable · 2026-09-15

> **Corte con fecha · vencido.** Se conserva porque explica cómo se midió, no
> porque siga siendo cierto: el 2026-09-17 el backend cerró T4 y el 2026-09-21 se
> ejecutaron las decisiones. **El número de hoy sale de `docs/ESTADO.md`**, que
> se genera. Las tres palancas de abajo se movieron: T4 está cerrada, el fork
> sigue sin desplegar y `/config/plots` sigue sin existir.

**Cero no es un error del conteo: es el estado.** Lo que queda del front son
veintiocho tareas y **ninguna depende de nosotros**. Tres cosas las desbloquean,
y en este orden de rendimiento:

1. **T4 · el contexto del panel en `POST /config/chat`.** Desbloquea F3.2, la
   mitad de F3.3, la casilla 13 de §17 —y con ella F5.10— y la primera mitad de
   F3.7. Es **un campo en el cuerpo del endpoint**. *(Cerrada el 2026-09-17: el
   campo llegó, y las cuatro se cerraron entre el 17 y el 21.)*
2. **Que tomen el fork.** Desbloquea F4.12 entera y la mitad de roles de F4.3.
   El código está escrito y probado; falta desplegarlo.
3. **`/config/plots`** · desbloquea F1.31, F4.21 y F5.3.

Lo demás son campos sueltos: `layouts` en `Contexto` (F5.1), locale y moneda en
`tenant` (F1.13b), el estado del período (F1.42), panel y período en
`HiloResumen` (F3.7), una ruta que liste usuarios (F4.3).

**Las cinco formas de `Valor` (F4.17–F4.20) son las únicas que no conviene pedir
todavía**, y por la razón que el propio yaml escribe: no hay métrica que las
declare, así que declararlas sería agregar una forma que ningún endpoint
devuelve.

#### Se intentaron el 2026-09-15 y siguen cerradas · con la razón medida

**El argumento para tomarlas era que la primera razón del plan había vencido.**
«Su único consumidor es el builder, que no se puede empezar» dejó de ser cierto:
el builder está construido y la biblioteca ofrece los quince tipos. De ahí salía
que la consola no puede dibujar tres de los que el builder ofrece.

**La segunda razón no venció, y es la que manda.** `Valor` no declara
`categoricaComparada`, `perfilMultiatributo`, `matriz`, `flujo` ni `grafo` —lo
dice el propio yaml, con su decisión fechada el 2026-08-19—, así que escribir los
tres cuerpos sería escribir contra formas inventadas. Es lo mismo que ya está
escrito en `registry.ts` sobre `MISSING_TYPES`.

**Y el hueco que motivaba tomarlas no existe.** Medido contra el servicio
corriendo, `GET /config/blocks` declara que esos tres tipos aceptan **solo** esas
cinco formas —`comparison` → `compared_categorical` y
`multi_attribute_profile`; `matrix` → `matrix`; `graph` → `graph` y `flow`—, y
ninguna métrica del catálogo declara ninguna. `invalidReason` rechaza el panel
antes de publicar, así que la consola no recibe un tipo que no sabe dibujar.

**Lo que la medición sí encontró está abajo**, y es de otra tarea.

### La integración con el builder real · 2026-09-11

**Las ocho rutas existen** en la rama `feature/dynamic-dashboard-backend`:
`GET /admin/tenants`, `GET/POST /admin/tenants/:tenantId/layouts`,
`GET/PUT /admin/layouts/:layoutId`, `POST /admin/layouts/:layoutId/validate`,
`POST /admin/layouts/:layoutId/publish` y `GET /admin/tenants/:tenantId/catalog`.
Con eso **trece de las veintiuna tareas de esta fase dejan de estar bloqueadas**.

Siguen bloqueadas dos. **F4.3 y F4.12 ya no esperan a otro equipo**: B4.8 —el
CRUD de roles por tenant—, **F4.12** espera B4.9 —el preview por rol—, **F4.21**
espera `/config/plots` y B1.21, y **F4.4** espera decidir si `POST /admin/agents`
y `GET /admin/agents` alcanzan para la configuración de agente.

**F4.17–F4.20 no se mueven**, y ahora con dos razones en vez de una: su único
consumidor es el builder, y el backend tampoco materializa sus formas —
`transform.go` tiene nueve casos y las tres que estas tareas necesitan no están.

#### ➕ F4.22 ✅ Transcribir el cable de admin y builder
**Descripción.** Las ocho rutas en `contracts/synapse-admin-wire.yaml`, con el
mismo tratamiento que F1.32. Los **cuerpos** de `PUT /admin/layouts/:id` son
snake_case y razonables; las **respuestas** de `GET /admin/layouts/:id`,
`POST .../layouts` y `POST .../publish` serializan structs de dominio de Go sin
etiquetas `json:`, así que llegan en PascalCase: `ID`, `Status`, `ColStart`.
**Criterio de aceptación.**
- La deuda de PascalCase queda **declarada en el yaml**, no absorbida en
  silencio: es una pregunta abierta al backend, no una convención nuestra.
- El yaml declara que rompe los propios tests de Postman del backend
  —`scriptCreateDraft` afirma `lv.status === 'draft'` y lo que llega es
  `Status`— para que la pregunta tenga evidencia y no sea una preferencia.
- `admin-drift` verifica que los tipos generados no deriven del yaml.
- `DDLayoutValidationResult` y `DDCatalogMetric` sí traen etiquetas `json:` y se
  transcriben tal cual.

**Confirmado contra el servicio el 2026-09-16.** Hasta esa fecha este yaml era la
única de las cuatro transcripciones **sin verificar contra el servicio corriendo**
—las rutas piden rol `admin` y nuestro usuario era `planner`—, así que estaba
deducido del código de Go. El backend cambió el rol de
`gerardo.riarte@buentipo.com` a `Admin` y `npm run humo` recorrió las ocho rutas
campo por campo: **coinciden**.

**El PascalCase es real.** `GET /admin/tenants/{id}/layouts` devuelve `ID`,
`TenantID`, `Status`, `VersionID` y `PublishedAt`. La deuda que el yaml declaraba
como pregunta abierta tiene respuesta, y la respuesta es que sí.

**Dos quedan sin probar, y a propósito**: `publish` demotaría el layout publicado
del tenant, y las del fork devuelven 404 porque no está desplegado. El humo las
imprime como ⊘, que es distinto de verde.

**Y apareció algo que no es nuestro pero conviene que sepan.** Esa respuesta trae
un `Tenant` embebido que hoy llega en cero; `domain.Tenant` serializa
`PrivateKeyPEM`, `PrivateKeyPassphrase` y `KmsKeyArn` **sin `json:"-"`**, así que
un `Preload("Tenant")` en esa consulta mandaría la llave privada al navegador.
Hoy no pasa. Va en el mensaje del 2026-09-16 como latente, no como urgente.

**Cerrada el 2026-09-15.** `contracts/synapse-admin-wire.yaml` — seis rutas, ocho
operaciones, trece esquemas. Cuarto contrato del repositorio, con su
`gen:admin-wire` y su `admin-drift` en la puerta, que ahora son dieciséis
chequeos.

**Y una diferencia con F1.32 que hay que declarar: este NO se pudo verificar.**
El cable de la consola se transcribió igual y después `npm run humo` lo confirmó
contra el servicio, cero diferencias. Las ocho rutas de admin cuelgan de
`AdminOnlyMiddleware` y el usuario de prueba disponible es `Planner`, así que
`GET /admin/tenants` devuelve **403** — comprobado. **Este archivo describe lo
que el código de Go dice que devuelve, no lo que se vio llegar**, y eso está
escrito en su cabecera. Con un usuario `admin` se extiende `tools/humo.py` a
estas rutas.

**La deuda de PascalCase quedó declarada, no absorbida en silencio**, con su
evidencia: rompe los propios tests de Postman del backend —`scriptCreateDraft`
compara `lv.status` contra `'draft'` y lo que llega es `Status`—, que es lo que
demuestra que es un descuido y no una convención.

**Tres trampas que el yaml documenta y que no avisa nada:**

- **`PUT /admin/layouts/:id` es un REEMPLAZO COMPLETO**, no un parche. Lo que no
  venga se borra.
- **Una tab sin `id` genera una NUEVA.** Mandar el UUID existente conserva el id
  al reemplazar el contenido; omitirlo recrea. Es la diferencia entre editar y
  duplicar.
- **`validate` responde 200 aunque la composición sea inválida.** El resultado
  va en `data.valid`; un 200 quiere decir que la validación corrió, no que esté
  bien.

**Verificado por mutación** en los dos casos —generado editado a mano, yaml
cambiado sin regenerar— y comprobando que los otros tres contratos siguen
conformes.

#### ➕ F4.24 ✅ A5 · Salud de feeds · la pantalla que explica por qué una métrica está degradada
**Construida el 2026-09-25**, el mismo día que llegó su ruta. `§PEN:A5` en
`src/surfaces/admin/FeedHealth.tsx`, con el estado derivado y no leído, los tres
huecos del cable declarados en la pantalla, y los dos vacíos. Vista contra el
servicio real —cuatro fuentes sin carga— y en el modo mock con los tres estados.
**Descripción.** La quinta pantalla de §7.3, dibujada en `§PEN:A5` y sin
construir. **Su ruta llegó el 2026-09-25**: `GET /admin/tenants/{tenantId}/feeds`
· B2.13 · verificada contra `1e080ee`.

La nota del `.pen` la define en una línea: «la pantalla que explica por qué una
métrica está degradada». Su pregunta operativa, del frame: *¿Por qué una métrica
está degradada, y qué la desbloquea?*

**Alcance TENANT**, y por eso su navbar **sí** lleva selector de cliente —A1 no lo
lleva porque opera sobre la plataforma—. Ancho mínimo 1280, como el resto de
administración.

**Criterio de aceptación.**
- Las ocho columnas del dibujo: `FUENTE`, `CAPA`, `CADENCIA`, `ÚLTIMA CARGA`,
  `FRESCURA`, `FILAS`, `FALLAS S › G` y `MÉTRICAS`.
- **El estado NO se lee: se DERIVA.** El pie del dibujo lo dice con todas las
  letras —«el estado no se escribe, se deriva · si frescura > cadencia ×
  tolerancia, degrada»— y es la razón por la que B2.13 se pidió como ruta y no
  como campo. El payload trae `status` igual; **usarlo sería reintroducir las dos
  fuentes que el pedido evitó**. Si `status` y la derivación difieren, se muestra
  la derivación y se declara la diferencia.
- Una fila se expande y muestra la razón, **qué la desbloquea** y las métricas
  afectadas con su tipo de panel, con salida al catálogo.
- El resumen del encabezado —«9 fuentes · 8 al día · 1 degradada»— sale de contar
  lo derivado, no de un campo.
- **El vacío de alta**, que es el tercer tipo: `A5 · Feeds · tenant sin fuentes`.
  «No falta un filtro ni falla nada: el cliente es nuevo y el trabajo está por
  hacerse», y **el encabezado se conserva** — las columnas siguen diciendo qué
  habría ahí.
- **Lo que el cable NO trae se declara, no se inventa**, medido el 2026-09-25
  contra `1e080ee`:
  - **La CAPA no llega.** El dibujo la pone como columna y el payload no tiene
    `layer`. Se declara el hueco y se pide.
  - **«VER RECHAZOS» y «SINCRONIZAR TODO» no tienen ruta.** Sin manejador no se
    pinta el CTA · la regla del botón muerto.
  - Una fuente sin cargar nunca llega con `freshness_hours`, `last_load_at`,
    `rows_processed` y `rows_failed` en `null` y `status: "unknown"`. **No es un
    error: es una fuente sin Gold**, y la pantalla lo dice.
- **Se abre el `.pen` antes de escribir la primera línea** y el archivo lleva
  `§PEN:A5`, que es lo que `pen-pantallas` verifica.

#### ➕ F4.23 ✅ Los hooks del builder contra el cable
**Descripción.** `useTenants`, `useLayouts`, `useLayoutDetail`, `useSaveLayout`,
`useValidateLayout` y `usePublishLayout`, con su adaptador, siguiendo la figura
de F4.16. El ciclo del builder es `crear borrador → PUT → validate → publish`, y
solo un `draft` es editable: un `PUT` sobre un publicado devuelve 409.
**Criterio de aceptación.**
- **El servidor decide.** La validación del front es feedback inmediato; nunca se
  publica algo que el front dio por bueno y el servidor no vio — es el criterio
  que F4.11 ya declara y acá se sostiene con `POST .../validate` real.
- Publicar invalida la caché de la consola: `/config/me` y las pestañas se
  vuelven a pedir, porque publicar **demota el layout publicado anterior a
  borrador** y lo que estaba en pantalla dejó de ser el layout vigente.
- Un 409 sobre un layout publicado se muestra con la razón —«este layout ya está
  publicado; duplicalo para editarlo»—, no como «error al guardar».
- Los `errors[]` de validate se muestran **por panel**, que es como vienen
  (`tab_id`, `panel_id`, `field`, `message`), y no como una lista suelta al pie.
- El `PUT` es un **reemplazo completo** de tabs y paneles: se envía el layout
  entero, y mandar una tab sin `id` genera una nueva. Queda escrito donde se
  llama, porque es la clase de cosa que se descubre borrando el trabajo de
  alguien.

**Cerrada el 2026-09-15.** `src/api/admin.ts` —cliente y adaptador— más seis
hooks en `hooks.ts`. 437 pruebas.

**Los hooks del builder viven en `hooks.ts` y no en un archivo aparte**, y no es
comodidad: **publicar tiene que invalidar la caché de la CONSOLA**, y para eso
las dos familias de claves tienen que estar al alcance. Separarlas obligaría a
importar las de la consola desde el builder, que es la dependencia al revés.

**Ese es el defecto silencioso de esta tarea y tiene su prueba.** Publicar demota
el layout publicado anterior del tenant a borrador, así que cambia la lista de
layouts —lo evidente— y también **lo que la consola está mostrando**: sus
pestañas y su contexto salen del layout publicado. Sin invalidar `me` y `tab`,
quien acaba de publicar sigue viendo el layout viejo y cree que no funcionó:
**todo responde 200 y la pantalla no cambia.**

**La forma que sale del adaptador es una PROPUESTA, no el contrato.**
`synapse-api.yaml` declara en su alcance que admin y builder entran «cuando esas
superficies prueben qué necesitan». Así que esto es lo que va a proponerse en
B0.6, y sigue las convenciones del contrato: español, camelCase, y **reusa
`PanelConfig`** — un panel del builder es el mismo que la consola dibuja, y darle
dos formas sería garantizar que se separen.

**Tres decisiones que quedaron escritas donde se toman:**

- **El 409 tiene código propio** —`REGLA_LAYOUT_PUBLICADO`—. Sin distinguirlo, el
  builder diría «error al guardar» sobre algo que tiene una salida concreta:
  duplicar el layout.
- **Un `Status` desconocido cae en `borrador`, no en `publicado`.** Es la lectura
  segura: un layout del que no se sabe si está publicado no se trata como
  publicado. La dirección importa.
- **`validar` no cachea.** Es una pregunta sobre el estado de ESTE momento; una
  respuesta guardada diría «válido» sobre una composición que ya cambió. Por eso
  es mutación y no consulta.

**Verificada por mutación, y la cuarta enseñó algo.** Tres rompieron pruebas:
publicar sin invalidar la consola, el 409 sin su código, y un estado desconocido
leído como publicado. **La cuarta —quitar el spread condicional del `id`— no
rompió ninguna, y no era una prueba débil**: `JSON.stringify` descarta las claves
`undefined`, así que mandar `id: undefined` produce el mismo JSON. El spread es
una garantía de TIPO —`exactOptionalPropertyTypes`— y no de cable. Corregido el
comentario, que decía otra cosa.

Es la tercera forma de «una mutación que pasa»: no que el arnés fallara ni que la
prueba fuera débil, sino que **el cambio no tenía efecto observable**. Las tres
se distinguen mirando; ninguna se puede dar por buena sin hacerlo.


---

### B1 y B2 contra el `.pen` · 2026-09-16

**Revisado frame por frame** después de que la revisión humana dijera «no veo la
serie de pantallas B». **B2 estaba construido**: las guías de doce, la regla
—«Grilla 12 · columna 80 · gap 16 · fila base 80»—, el slot vacío, los handles y
la colisión. Lo que no estaba era **cómo llegar**.

**El `.pen` lo dice y nosotros no lo teníamos.** La nota de B1 lo llama «el punto
de entrada del builder» y cada pestaña lleva su CTA `COMPONER ‹PESTAÑA›` con el
rótulo `AL ENTRAR SE ABRE B2 CON ESTE CONTEXTO`. Sin eso había que elegir versión
y después acordarse de ir a «Canvas» por la navegación; quien no hacía las dos
cosas veía «Elegí una versión…» y concluía que el canvas no existía.

**Ahora el gesto hace las dos cosas** —fija la pestaña y cambia de pantalla—, que
es lo que la prueba fija: cada mitad por separado se ve bien y no resuelve nada.
Verificado por mutación, seis casos sobre línea de base verde.

**Sin conteo en el CTA**, y lo destapó una prueba: la fila ya declara «N panel(es)
· N rol(es)» y el `.pen` dice `COMPONER ECOMMERCE OVERVIEW` a secas. Repetirlo
hacía que dos elementos de la misma fila dijeran lo mismo.

#### Lo que queda de B1 y B2, y las dos esperan al backend

**Ningún contrato declara herencia.** Ni `PanelConfigurado` ni `LayoutPanel`
tienen un campo que diga si un panel viene de la plantilla o es propio del
tenant, y sin eso no se pueden pintar:

- **La proporción heredados/propios por pestaña** que B1 dibuja —«11 HEREDADOS DE
  LA PLANTILLA · 1 PROPIO»—. Ya estaba declarado como hueco en `ContextView`.
- **El estado `heredado` del panel en el canvas.** La nota de B2 pide cuatro
  estados —heredado, seleccionado con handles, slot vacío y colisión— y tenemos
  tres.

**No se rellenan.** Inventar la distinción haría que el builder afirmara algo que
el dato no sostiene, y un panel marcado «propio» que en realidad se hereda es
peor que ninguna marca.

### La navegación entre superficies · decidida el 2026-09-16

**El `.pen` no la dibuja.** Recorridos los quince frames uno por uno: cada
superficie se declara a sí misma con su chip —`ADMINISTRACIÓN`, `BUILDER`— y
navega hacia adentro con su nav horizontal, y **ninguna navega hacia al lado**.
No hay «ir a administración» en la consola ni «volver» en el builder.

**Decisión humana: el builder y administración los ve solo el admin.**

**Dónde vive, y por qué ahí.** `design.md` §7.1 ya declaraba que el punto de
usuario «abre un panel con nombre, correo, rol con su descripción y cliente». Ese
panel estaba especificado y el código tenía el nombre suelto como rótulo. Las dos
entradas cuelgan de ahí: es el lugar que el diseño ya tenía abierto, en vez de un
control nuevo en el navbar —que sí habría sido inventar—.

**Y esconder no es proteger.** `esAdmin` decide si se PINTA la entrada, no si se
puede entrar: el permiso lo aplica `AdminOnlyMiddleware` con un 403, y quien
escriba `/admin` a mano llega igual a la pantalla. Es la regla de siempre —«un
botón que se aprieta y devuelve 403 es peor que un botón ausente»— y por eso **no
va en `AuthGuard`**, que a propósito no decide por rol.

**Se normaliza la mayúscula porque el servicio la normaliza.** El rol llega como
`Admin` y `/admin/tenants` le responde 200; comparar contra `'admin'` a secas
habría escondido una entrada que el servidor sí habilita.

**Tres cosas que salieron al construirlo:**

- **El chrome no navega.** El primer intento puso `useNavigate` dentro de
  `AdminChrome`, y **rompió doce pruebas que lo montan sin router**. Tenían
  razón: el propio archivo ya declaraba «la navegación es del contenedor, no del
  chrome». Ahora es un callback, y `undefined` no pinta el control.
- **Las pruebas de contenedor ahora montan en un `MemoryRouter`**, que es lo que
  la app real hace. Montarlos afuera probaba una app que no existe.
- **El modo mock decía dos cosas distintas del mismo usuario**: el login devolvía
  `role: 'admin'` y `/config/me` devolvía `CEO`. La consola lee el segundo, así
  que el menú escondía las dos salidas — justo lo que ese modo existe para poder
  recorrer. Corregido con id propio: el super-admin es del plano plataforma, no
  un rol del cliente.

**Verificada por mutación, nueve casos sobre línea de base verde.** Las entradas
a cualquier rol, a ninguno, el rol sin normalizar, **la entrada que se pinta y no
navega** —el botón muerto—, las dos al mismo destino, el panel sin correo, sin
cliente, el nombre que deja de abrir y Escape que no cierra. Mueren las nueve.

---

## Fase 5 — Multi-dashboard, pruebas y pulido

### F5.1 ✅ Selector de dashboard cuando hay más de uno
**EL SELECTOR CAMBIABA DE DASHBOARD Y LA CONSOLA QUEDABA VACÍA · encontrado y
arreglado el 2026-09-29.** Publicando una pestaña en «Marca» y cambiando a él:
`/config/me` devolvía la pestaña, la superficie pintaba su pregunta operativa, y
`GET /config/tabs/{ese mismo id}` contestaba **404 «pestaña no encontrada»**.
Encabezado y **cero paneles**.

**No era del backend.** Su handler —`dd_config_handler.go`, leído en `de881e1`—
acepta `?layoutId=` y `?dashboardId=`, y sin ninguno de los dos resuelve contra el
layout del dashboard **por defecto**: una pestaña de otro dashboard no existe para
esa consulta. `ConsoleContainer` llamaba `useTab(activeTab?.id)` **sin el
parámetro desde siempre**, aunque `useTab` y el cliente ya lo aceptaban.

**Andaba de casualidad, y eso es lo que conviene registrar.** Mientras hubo un
solo dashboard, el activo y el de por defecto eran el mismo y la caída del
backend acertaba. Es el modo de falla que este repositorio persigue: correcto por
coincidencia, y el día que deja de serlo **no falla el código que está mal**.

**Y MSW no podía verlo**, por la misma razón que no vio la `Authorization` del
chat: sus handlers coinciden con la ruta **sin mirar el query string**, así que
responden igual con parámetro y sin él. Por eso
`tests/surfaces/console/layoutEnLaConsulta.test.tsx` no afirma lo que se dibuja
—eso ya pasaba— sino **lo que se pidió**: captura la URL y lee su `layoutId`.
Mutación verificada: quitar el parámetro la mata.


**AJUSTADA AL DIBUJO EL 2026-09-28** · §PEN:C6. F5.1 puso un `<select>` en el navbar con la pregunta de dónde iba **abierta como propuesta de spec**, y C6 la contestó: no va ahí, porque «de ocho elementos a 768 el navbar no entra». Lo abre el chevron del bloque de cliente, **que ya estaba dibujado, y por eso el navbar no crece**.

Con eso quedan contestadas las cuatro preguntas de `docs/PROPUESTA-2026-09-26-selector-de-dashboard.md`, incluida la del nombre: **dashboard es lo que se elige, layout es su composición publicada**, y ninguna pantalla dice layout.

**Sin velo, y eso lo decidió mirarlo**: la primera versión del dibujo copió el patrón de la hoja de C3 y al abrir el render se vio que «un velo oscurece la aplicación entera y eso dice MODAL, que es lo que una hoja es y un desplegable no». El panel se separa con su sombra.

**Y la sublínea del dibujo no se puede pintar entera**: pide «4 PESTAÑAS · 12 PANELES» y `Contexto.dashboards` trae `{id, nombre, esDefault}`. De los dashboards que no son el activo no se sabe ni cuántas pestañas tienen ni si están compuestos, así que se pinta lo que se sabe y el hueco se declara.
**Verificado el 2026-09-26 contra el servicio corriendo** · commit `8633b10`. **El ciclo entero, en pantalla**: el selector lista «Overview» y «Marca», cambiar a «Marca» muestra «todavía no se compuso», y «Volver a Overview» devuelve a la consola compuesta.

**Para poder verificarlo se creó el segundo dashboard** con `POST /admin/tenants/{tenantId}/dashboards`, en vez de esperar — igual que el usuario restringido de B1.19. Con uno solo no hay selector, que es su propio criterio, así que no había nada que mirar. Queda documentado en `dev/postgres/README.md`.

**Y crearlo destapó dos defectos que ninguna prueba habría encontrado:**

1. **`tabs` puede ser `null`.** Un dashboard sin layout publicado devuelve `active_layout_id: null` y `tabs: null`; el cable lo declaraba arreglo requerido y el adaptador hacía `w.tabs.map(...)`. Se cayó.
2. **Y el mensaje decía «No se pudo cargar tu contexto · sin detalle del servidor»** — un fallo NUESTRO atribuido al servicio. Es la familia del 401 del chat, que también culpaba al agente.

**Cambiar de dashboard es escribir una PREFERENCIA**, y eso no lo elegimos: el servicio resuelve el activo con **preferencia > rol > default del tenant**, así que no hay parámetro de consulta. Un selector que creyera lo contrario no habría cambiado nada.

**El vacío lleva salida propia**, y eso se vio abriéndolo: el estado reemplaza la pantalla entera —navbar incluido—, así que quien cambiaba a un dashboard sin componer **quedaba encerrado**. Mismo precedente que B5 el 2026-09-25. No se ofrece si el vacío ya es el default: sería un botón que no hace nada.

**Y el contrato no declaraba nada de esto.** La descripción de esta tarea decía «el selector aparece solo si `ctx.layouts.length > 1`» y `Contexto` no tenía el campo. Ahora declara `dashboards`, `dashboardActivoId` y `layoutActivoId`, con `null` como estado y no como ausencia.

**Lo que NO se decidió solo, y va a diseño** · `docs/PROPUESTA-2026-09-26-selector-de-dashboard.md`: **ni el `.pen` ni `design.md` dibujan este control**. §7.1 lista el navbar entero y no lo incluye; el `.pen` tampoco, y sus «capítulos» son pestañas de un layout. Se siguió la vecindad que sí dibuja —el `chevrons-up-down` del bloque de cliente— y la forma del selector de período, que ya vive en esa barra. Queda abierto dónde va, qué pasa a 768, y fijar la palabra.

**El `🔒` se saca**, porque su propio título decía «el candado VENCIÓ el 2026-09-25» y el emoji la contaba como bloqueada igual — el mismo defecto que tenía F3.15.

Remedido: `/config/me` devuelve `dashboards[{id, name, slug, is_default}]`, `active_dashboard_id` y `active_layout_id`. **Lo que no se puede comprobar todavía es el filtrado por rol**: el tenant tiene un solo dashboard, así que `admin` y `planner` ven el mismo.


**MEDIDO CONTRA `75b8ecc`.** `DDContextResponse` declara `dashboards` —con `id`,
`name`, `slug` e `is_default`—, `active_dashboard_id` y `active_layout_id`, y
`PUT /config/me/preferences` acepta `preferred_dashboard_id`. El orden de
resolución lo escribe su propio comentario: **preferencia > rol > default del
tenant**.

Llegó con `168a761` el 2026-09-21 y **estuvo cuatro días sin transcribirse**,
porque el cable declaraba `733c13c` para `/config/me` y nadie la releyó. Lo
encontró reverificar el cable ruta por ruta.

**Se deja anotado y no se toma**, igual que F3.15.

**Descripción.** Un tenant puede tener varios dashboards —«Operaciones»,
«Marca», «Ejecutivo»—. El selector aparece solo si `ctx.layouts.length > 1`.
**Criterio de aceptación.**
- Con un solo layout no hay selector: no se ofrece una elección que no existe.
- Cambiar de layout reinicia la pestaña activa, porque la pestaña de un layout no
  existe en el otro.

### F5.2 ✅ Pasar `layoutId` a `GET /config/tabs/{tabId}`
**Criterio de aceptación.**
- El `layoutId` entra en la clave de cache de la pestaña: dos layouts no comparten
  entrada.
- Sin `layoutId` el backend resuelve el layout por defecto del rol.

**Cerrada el 2026-09-15 · el código estaba y la prueba que importaba no.**
`api.tab` ya aceptaba el `layoutId` y `keys.tab` ya lo ponía en la clave, desde
que se escribieron los hooks del builder. Lo que había era **media prueba**:
`client.test.ts` verificaba la URL —«escapa el tabId y agrega el layoutId solo si
vino»— y nada verificaba la clave, que es el punto del criterio.

**No son la misma mitad.** La URL puede estar perfecta y la clave estar mal: si
`keys.tab` ignorara el `layoutId`, la segunda pestaña se leería del cache **sin
pedir nada**, con una URL correcta escrita en un fetch que nunca ocurre. El
síntoma sería el builder mostrando el borrador donde va lo publicado, y los dos
se ven igual de bien.

`tests/api/useTab.test.tsx` lo afirma sobre lo observable a los dos lados —qué
URLs se pidieron y qué datos llegó a cada hook—, no sobre el arreglo que
`keys.tab` devuelve: una aserción sobre la clave fija la forma de la clave, no su
consecuencia.

**Y hubo que congelar la frescura para que el conteo hablara de la clave.** Con
el `staleTime: 0` de fábrica una entrada COMPARTIDA se vuelve a pedir igual —el
segundo hook lee del cache y dispara un refetch de fondo—, así que la red se ve
idéntica compartiendo entrada y no compartiéndola. Medido: la prueba del mismo
layout salía `['layout-a', 'layout-a']` con el código correcto. Contar llamadas
medía la política de frescura y no la clave.

**Verificada por mutación, siete casos sobre línea de base verde.** Seis mueren
de entrada; el séptimo —sacar el `tabId` de la clave— **sobrevivía**, porque las
tres primeras pruebas usaban una sola pestaña. La clave tiene dos partes
variables y solo una estaba sostenida. Se agregó la cuarta prueba y muere.

### F5.3 ⬜ Completar los plots que falten · 🔒 espera a F4.17–F4.19
**Descripción.** Los gráficos que necesiten los cuerpos v1.1 (F4.17–F4.19).
**Criterio de aceptación.**
- Cada uno acepta `PlotProps<F>` y compone primitivas de `core/`. Si necesita algo
  que no está en `core/`, **falta una primitiva, no sobra un componente a medida**.

**LOS TRECE PLOTS DEL 2026-09-29 NO SON DE ESTA TAREA**, y decirlo evita cerrarla
por error: son gráficos de los cuerpos que YA existen —`escalar`, `serieTemporal`,
`seriesMultiples`, `categorica`— y su registro está bajo F1.31. Lo que esta tarea
espera son los plots de `matriz`, `grafo` y `flujo`, que no tienen cuerpo todavía:
F4.17–F4.19 siguen ⬜ porque `Valor` no declara esas formas **y** B5.3 pide que el
dato exista.

### F5.4 🕓 Overlay de drill-down
**Estado: diferida** (D3). No se descarta ni se planifica todavía; entra cuando el backend llegue a ese tramo. El contrato ya la cubre, así que lo que falta es el servicio, no el diseño.
**Descripción.** Cubierto por F3.9; queda acá el enganche desde el CTA «Ver
detalle» del shell.
**Criterio de aceptación.**
- Se abre con el `panelId` y las `dimensiones` que declara la métrica en el
  catálogo, nunca con una lista escrita en el front.

### F5.5 ✅ Prueba por cuerpo, con props mínimas válidas
### F5.6 ✅ Prueba: cada `PanelType` del contrato tiene componente registrado
### F5.7 ✅ Prueba: cada `Payload.estado` muestra el estado correcto
### F5.8 ✅ Pruebas de contenedor con MSW
### F5.9 ✅ E2E de una pestaña completa con fixtures HTTP
**Criterio de aceptación (los cinco).**
- **Las pruebas se escriben desde el contrato y desde la cita de la spec, no
  mirando la implementación.** Una prueba escrita desde el código fija lo que el
  código hace y no puede fallar nunca, ni cuando el código está mal. Es lo que
  pasó el 2026-08-20 con 184 pruebas en verde.
- F5.6 es un chequeo de paridad, no una lista escrita a mano: recorre el
  enumerado del contrato.
- F5.8 y F5.9 usan **HTTP mockeado**, nunca fixtures JS importados.

**Auditadas contra las 297 pruebas el 2026-09-04.** Dos estaban cumplidas y se
cierran; tres no, y en un caso la prueba que parecía cubrirlo tiene el defecto
exacto que el criterio nombra.

**F5.7 ✅.** `Panel.test.tsx` recorre los siete estados con `it.each` y
`states.test.tsx` los seis que llegan del batch, de punta a punta. Pero lo que
la cierra de verdad no es la cobertura: **el `switch` de `Panel.tsx` es
exhaustivo**, así que un estado nuevo en el contrato deja de compilar hasta que
alguien decida qué se pinta. La paridad la sostiene el compilador, que es más
fuerte que una prueba.

**F5.8 ✅.** `ConsoleContainer.test.tsx` y `states.test.tsx` montan el contenedor
y lo dejan hacer los mismos `fetch` que en producción; lo único distinto es quién
responde. Cero fixtures JS importados por la superficie: los datos entran como
respuesta HTTP.

**F5.5 ✅ · cerrada el 2026-09-04.** Faltaban seis de doce —`BarsBody`,
`BlockedBody`, `DistributionBody`, `ProseBody`, `RecoBody` y `SeriesBody`— y
ahora los doce tienen prueba. Los tres que dibujan un plot se verifican por lo
que le PASAN al plot —ordenar, recortar, normalizar— porque el SVG en jsdom no
tiene tamaño y no dibuja nada.

**Y encontró un tipo que prometía una cosa y entregaba otra.** `BodyProps`
declaraba `onRespond?: (ref: string, ...)` y `RecoBody` pasaba el
`accionableId` desde siempre — que es lo correcto, porque quien lo recibe llama
a `POST /config/accionables/{id}/respuesta`. Se corrigió el nombre del
parámetro: un tipo que miente es cómo alguien pasa el `ref` un día y el 404
aparece en producción.

**F5.6 ✅ · la prueba que existía tenía el defecto que el criterio nombra.**
`registry.test.tsx` comparaba contra `CONTRACT_TYPES`, **un arreglo de quince
escrito a mano en el propio archivo**, con un comentario que decía «no leídos
del registro: si se leyeran, la prueba no podría detectar que falta uno». La
intención era correcta y se quedó a mitad de camino: una copia a mano del yaml
se desactualiza igual que el registro.

No se puede resolver con tipos —`PanelType` es una unión de TypeScript y se
borra al compilar—, así que la paridad sale del yaml: `tests/contract.ts` lee el
enum de `TipoPanel`, como ya hacen `spec-anclas` con `design.md` y `token-drift`
con el `.pen`. Verificado por mutación agregando `sankey` al contrato: **la
prueba nueva falla y la vieja habría pasado.**

Leer el yaml destapó dos trampas, las dos cerradas: el contrato tiene un
`components/responses/NoExiste` —el 404— así que buscar por nombre en el archivo
entero encontraba una respuesta creyendo que era un esquema; y el `enum:` hay
que acotarlo al nivel del esquema, porque si no agarra el de una propiedad
anidada.

**F5.9 ✅ · cinco paneles, cinco tipos, cinco formas.** Lo que un panel solo no
puede verificar: que cada panel resuelva SU métrica y no la del vecino, que la
grilla los coloque donde dice el layout, que cinco tipos carguen cinco cuerpos
distintos, y que un panel en `ERROR` no arrastre a los otros cuatro.

**Los fixtures se escribieron de memoria y el contrato pilló dos.**
`columnas` pide `titulo` y `numerica` —se había escrito `etiqueta`— y los
pilares de `prosa` piden `label`, no `etiqueta`. El segundo es el que más
enseña: el rótulo salía vacío y **la prueba de `ProseBody` pasaba igual**,
porque solo miraba el `valor`. Ahora verifica los dos.

Dos cosas del entorno que parecían fallos y no lo eran: jsdom abre en 1024px, o
sea seis columnas, así que la grilla colapsaba —F1.30 funcionando— y el alto no
es un `height` sino `gridRow: span N` sobre `gridAutoRows`. Y la celda se busca
por su panel y no por índice, porque `readingOrder` ordena el DOM.

### ➕ F5.21 ⬜ Qué hace un gráfico cuando el dato excede lo legible

**Descripción.** Hoy nada frena un payload que no se puede leer. El repertorio
declara un **tope** para cuatro gráficos de 49 —la dona lo tiene: «más de cinco
partes, ilegible en dona»— y el builder deshabilita la opción cuando el dato lo
excede. Para el resto no hay nada, y el gráfico se dibuja prolijo e ilegible.

**Medido el 2026-10-01**, poniendo los paneles en el dashboard de UA:

| Gráfico | Dato real | Qué pasa |
|---|---|---|
| `heatmap` sobre `platform_month_matrix` | 38 filas × 12 columnas | A `colSpan 12 · rowSpan 7` —el máximo que el bloque admite, 656 px— quedan ~17 px por fila contra rótulos de 9 px. Se encabalgan |
| `tornado` sobre `platform_gap` | 37 ítems | Ilegible, y además los dos valores de cada fila se superponen en su franja |

**Las dos salidas no se excluyen, y la segunda es una propuesta de spec.**

1. **Un tope declarado** por gráfico, como el de la dona. Son dos líneas en
   `tools/gen-plots.py` y hace que el builder deje de ofrecer la combinación en
   vez de que alguien la descubra mirando.
2. **Scroll interno en el plot.** `design.md` principio 11 lo sanciona —«listas
   largas con scroll interno propio»— y el `.pen` lo dibuja: `Cuerpo
   Lista/Viewport/Scroll`, un frame de 3 px de ancho y radio 2. **Pero lo declara
   para LISTAS**, y para un plot no hay regla. Es la propuesta.

**Por qué no se resuelve de una.** Una lista se lee fila por fila y lo que queda
abajo no hace falta para entender lo de arriba; **una matriz se lee entera** —el
sentido de un mapa de calor es ver el patrón de un vistazo— así que scrollearla
la convierte en una tabla con colores, que además se ordena y dice las cifras.
Puede que la respuesta sea distinta por forma.

**Decidido el 2026-10-01 (humano): se prueban LAS DOS con dato real y se mira**,
antes de elegir. No se construye ninguna a ciegas.

**Candado.** Espera a `media_platform_investment_matrix`, que datos entregó el
2026-10-01 y el backend está registrando. Su eje de columnas se decidió el mismo
día —plataforma × mes, doce meses— así que el dato que va a llegar tiene
exactamente la forma que hace falta para probar. Sin él la prueba se haría sobre
`platform_month_matrix`, que **no se puede recalcular**: su consulta vive en un
commit de nuestro fork que upstream no tomó.

**Criterio de aceptación.** Con el dato real de
`media_platform_investment_matrix` servido, el mismo panel se arma de las dos
maneras y **las dos se miran**: (a) con las filas acotadas por un tope declarado
en el repertorio, y (b) con el plot dibujado a su alto natural dentro de un
contenedor que scrollea. Se elige una por forma, se escribe cuál y por qué, y si
la elegida es el scroll **se abre propuesta de spec** porque `design.md` sólo lo
declara para listas. Queda una aserción que ate la decisión: si es tope, el
repertorio lo declara y `gen-plots.py` lo emite; si es scroll, una prueba exige
que el contenedor desborde en vez de comprimir.

### ➕ F5.20 ✅ A2 · Ficha · tenant en alta · §PEN:A2
**Descripción.** La variante que faltaba de A2. Su nota lo dice: «axo_mx vive en
SYNAPSE_TENANTS con roles: [] y A1 ya lo lista, pero A2 no sabía dibujarlo: la
banda de roles quedaba en blanco sin explicar nada». Trae los tres bloques que
§7.3 le pide a la ficha y no estaban —los datos del cliente, el estado del acceso
y los subprocesadores— y el estado de alta, que **no es un campo: se deriva**.

**Y no es una pantalla de alta.** `POST /admin/tenants` devuelve 400 pidiendo las
cuatro credenciales de Snowflake que §7.3 prohíbe mostrar, así que el alta la hace
el equipo interno por runbook y esta ficha **adopta** al cliente que ya existe.

**Criterio de aceptación.**
- `estadoDeAlta` y `versionDeCatalogo` viven en `src/surfaces/admin/alta.ts` y
  **no en el adaptador**: son reducciones sobre filas, y el adaptador renombra y
  reformatea. Mismo precedente que `saludDeFuente.ts`.
- La versión del catálogo es el **MÁXIMO** de las filas, que es la definición del
  servicio y no una elección nuestra —`GET /config/me` devuelve 4 para el cliente
  cuyas 21 métricas traen 1, 3 y 4—. Con cero métricas es **`null`, no `0`**.
- `EN ALTA` se deriva de no tener roles **ni** catálogo. **`status` NO se lee** —
  llega vacío por decisión escrita del servicio— y hay una prueba que falla el día
  que alguien lo lea: es una reapertura de la decisión, no un bug escondido.
- El bloque de acceso queda `BLOQUEADO` cuando el cliente tiene **cero ROLES, no
  cero agentes**, y ese estado **reemplaza** la tabla en vez de sumarse a ella.
- El CTA `DEFINIR PRIMER ROL` **dispara** —abre el formulario de rol nuevo— y es
  el único: en el vacío de alta la cabecera no repite el suyo.
- Las tres columnas sin dato salen en un guión atenuado y **no en blanco ni en
  cadena vacía**, y la que no tiene ni campo ni ruta —`PLANTILLA`— conserva su
  rótulo con una línea al pie que declara la falta.
- La frase del aporte de la plantilla **no se compone con las cifras que hay a
  mano**: las pestañas del layout y las métricas del catálogo no son «lo que
  aporta la plantilla». Se omite entera y una aserción atestigua la ausencia.
- El adaptador gana **una línea** —`creadoEn`— y nada más.
- `npm run pen-pantallas`, `npm run copy-producto` y `npm run design-lint` en
  verde, y el ancla `§PEN:A2` en cada archivo que el registro nombra.

**Construida el 2026-09-30.** `alta.ts`, `StatusChip.tsx`, `TenantIdentity.tsx` y
`Subprocessors.tsx`; la rama `BLOQUEADO` de `AgentConfig.tsx`, el CTA del vacío de
`RoleEditor.tsx` y el cableado de `Cliente` en `Admin.tsx`. Las pruebas son
`tests/surfaces/admin/alta.test.ts` —siete, con tres mutaciones muertas sobre
línea de base verde— y `tests/surfaces/admin/enAlta.test.tsx` —**veinticinco**,
montadas desde `Admin` y no desde los componentes, que es lo único que cubre el
paso de props—. **El número se movió dos veces el mismo día**: dieciséis al
construirla, veinte cuando QA ató cinco mutaciones que sobrevivían, veinticinco
cuando la auditoría ató los literales del dibujo y la quinta cosa que apareció al
volver a abrirla. La suite entera queda en **1561 en 113 archivos**.

**LO QUE QA DEJÓ ABIERTO Y LA AUDITORÍA CERRÓ · 2026-09-30.**

| Qué estaba abierto | Qué se hizo |
|---|---|
| Dos literales del vacío **divergían del `.pen`** y la divergencia no estaba declarada · QA lo dejó como decisión humana porque afirmar el dibujo ponía la suite en rojo | **La cadena de autoridad no lo deja abierto** —«gana el `.pen` para lo visual y el literal de la UI»—, así que se corrigió la pantalla: `SIN ROLES DEFINIDOS` en el resumen y la frase del frame en `$font-body`, no dos labels mono. Tres aserciones nuevas y **dos mutaciones muertas** |
| El caso negativo de `carga.test.tsx` se volvía a desapuntar con ese cambio | Retargeteado al literal nuevo y **comprobado con la mutación que QA usó** —que sólo el bloque del vacío ignore `cargando`—: muere |
| `celda()` resolvía por `getByText` global y `Estado` es también encabezado de la tabla de agentes | Acotado a la tarjeta de identidad. **Comprobado, no deducido**: con el ayudante viejo y un escenario con agentes, `Found multiple elements with the text: Estado`; con el nuevo, pasa |
| La procedencia del fixture decía «copiados de la respuesta medida» y `currency: 'MXN'` no salió de ahí —los dos clientes sembrados vienen en `COP` por un default de columna— | Corregida la línea: la FORMA está medida, el `MXN` es del dibujo y está a propósito sobre un `locale` colombiano |
| El conteo de pruebas citado en prosa había quedado viejo | Corregido acá, y con la suite entera al lado para que se vea de dónde sale |

**Lo que NO se cerró, porque no es del front:** las tres filas de subprocesadores
siguen siendo una afirmación legal construida desde un mockup cuya propia nota
dice que la lista es inventada. Las regiones y el «sin retención» los confirma
quien sea dueño del acuerdo de tratamiento, no una prueba.

**CERRADA CONTRA EL MODO MOCK, Y HAY QUE DECIRLO ASÍ.** El estado que esta
pantalla dibuja **no es alcanzable contra el servicio**, y la mitad que sí lo es
está medida aparte. **Remedido por la auditoría el 2026-09-30, contra el binario
que corre en `:4010`, que es `de881e1` —leído de su clone, no citado de memoria—**
y no contra `6e521cc`, que es donde nacieron las rutas y es su ancestro:

| Lo medido | Qué contestó | Qué decide |
|---|---|---|
| `GET /admin/tenants` | **Trece campos**, los mismos que el fixture · `status` y `vertical` en `null` y `label` en `""` **en los dos clientes** | Que las tres columnas sin dato salgan en un guión, y que `status` no se lea |
| Los dos clientes | `currency: COP`, `locale: es-CO`, `timezone: America/Bogota` · **ninguno en `MXN`** | Que el `MXN` del fixture sea del dibujo y no una medición · corregida la línea de procedencia |
| `.../catalog` y `.../roles/composition` | `1111…` → 12 métricas todas en `catalog_version: 1` y **3 roles** · `e65f…` → 21 métricas en 1, 3 y 4 y **4 roles** | Que ningún cliente del servicio esté en alta: las dos condiciones fallan en los dos |
| `GET /config/me` de `e65f…` | `catalog_version: 4` | Que **MAX sea la definición del servicio** y no una elección nuestra |
| `GET /admin/templates` y `/admin/verticals` | **404** los dos | Que `PLANTILLA` conserve el rótulo con la falta declarada al pie |

O sea: no se puede llegar al estado dibujado desde el servicio, y tampoco crear un
cliente desde la pantalla. Así que se agregó un tercer cliente al modo mock —«Grupo
Axo», sin roles, sin catálogo y sin layout— y **la pantalla se abrió y se miró**,
en sus dos mitades: en alta y en servicio.

**Y mirarla encontró cuatro cosas que ninguna prueba iba a decir:**

| Qué se vio | Qué era |
|---|---|
| Dos botones idénticos a diez píxeles uno de otro | La cabecera repetía `NUEVO ROL` al lado del `DEFINIR PRIMER ROL` del vacío. El dibujo pone **uno solo**, adentro |
| «0 rol(es) · 3 pestaña(s) · 24 paneles» | El modo mock servía los layouts de otro cliente al que no publicó nunca |
| Una ruta y un identificador de tarea pintados en la ficha | `Y LA LISTA DE USUARIOS DE A3 · … · SOLO EXISTE POST /admin/users`, **y encima falso** desde que la ruta global contesta. `copy-producto` no lo ve: sólo mira cadenas entre comillas, y esto es texto suelto entre etiquetas |
| «El permiso se aplica en el backend» | Vocabulario nuestro en la ficha de un cliente. Lo que importa decir es CUÁNDO se aplica, no dónde |
| **Y una quinta, en la auditoría** · abrirla de nuevo después de corregir los literales: debajo del vacío aparecía «OCULTAR UNA MÉTRICA NO ES UN PERMISO · EL SERVIDOR LA VUELVE A VERIFICAR EN EL CATÁLOGO Y EN EL BATCH» | Una advertencia sobre un mecanismo **que no está presente**: el cliente no tiene un rol ni una métrica que ocultar, y el frame de alta no dibuja nada en ese hueco. Es la misma familia que declarar una carencia ya cubierta. Atada por las dos mitades —sin roles no está, con un rol vuelve— y **dos mutaciones muertas** |

**El fixture del modo mock servía 3 de los 13 campos** que `GET /admin/tenants`
devuelve, y arreglarlo destrabó también A1: sus cinco columnas se veían vacías.

**Lo que queda levantado y no es código:** las tres filas de subprocesadores son
una **afirmación legal** construida desde un mockup cuya propia nota dice que la
lista es inventada. Las regiones y el «sin retención» no son decisiones de diseño:
hay que confirmarlas con quien sea dueño del acuerdo de tratamiento antes de que
esto lo vea un cliente. No bloquea el píxel; bloquea la afirmación.

---

### ➕ F5.19 ✅ B6 · Historial de versiones · §PEN:B6
**Descripción.** La sexta y última pantalla del builder —el `.pen` lo dice:
«CIERRA EL BUILDER: B1→B2→B3→B4→B5→B6»— y la que hace reversible un error de
composición en producción. §7.2 en una línea: «quién, cuándo, qué cambió. Permite
revertir».

**La razón escrita en el registro de pantallas era FALSA** y decía «ninguna ruta
lista versiones con su autor y fecha». Existían las dos: el historial desde
`168a761` y el revert desde `5924bf2b`, las dos de ellos, las dos contestando 200.

**Y la ruta que el registro nombraba no alcanza.**
`GET /admin/layouts/{layoutId}/publications` devuelve **una sola fila** —medido: 1
contra 5 para el mismo dashboard—. La razón es estructural y está en su código:
revertir **copia** a un layout nuevo y nunca reactiva el archivado, así que cada
layout se publica exactamente una vez. La lista sale de
`GET /admin/dashboards/{dashboardId}/publications`.

**Criterio de aceptación.**
- La lista sale de `GET /admin/dashboards/{dashboardId}/publications`, más
  recientes primero, y **no se reordena en el front**.
- `adaptarPublicacion` **renombra y reformatea**: el único normalizado es `?? []`
  sobre las ocho listas del diff, porque está medido que la misma clave vuelve
  `[]` en las filas nuevas y `null` en las viejas — el diff se persiste en `jsonb`
  y `de881e1` cambió la serialización después de escribirlas.
- Un `diff` en `null` **no se colapsa a un diff en cero**: «no hay registro de qué
  cambió» y «no cambió nada» se pintan distinto.
- El badge `EN PRODUCCIÓN` aparece **exactamente una vez**, y se DERIVA cruzando
  `layoutId` contra el layout cuyo estado es `publicado`.
- `REVERTIR A ESTA` **dispara** con el layout publicado en el path y el destino en
  el cuerpo, y **no se pinta** ni en la fila publicada ni cuando no hay layout
  publicado. Es la misma regla que el servicio hace cumplir con
  `CONFLICT_REVERT_SELF`.
- El nombre del autor se resuelve en la superficie contra `GET /admin/users`; si no
  resuelve, la línea arranca por el rol y **el uuid no aparece en el DOM**.
- El nombre de la métrica sale del catálogo; si no resuelve, «MÉTRICA FUERA DEL
  CATÁLOGO» y nunca el uuid.
- Las cuatro cosas que el dibujo pide y el cable no da quedan **declaradas y sin
  componer**, con una prueba que atestigua su ausencia.
- `npm run pen-pantallas`, `npm run admin-drift` y `npm run design-lint` en verde.

**Construida el 2026-09-30.** `src/surfaces/builder/VersionHistory.tsx`,
`VersionCard.tsx` y `cambios.ts`; el cable, el adaptador y los dos hooks.

**CERRADA EL 2026-09-30, Y CONTRA QUÉ:** cableada en `Builder.tsx` y **abierta en
la aplicación corriendo** contra el binario de `:4010` levantado desde el fork
—login `dev@synapse.local`, tenant `e65f81ae…`—. No es una foto de la semilla: las
cinco filas de «Marca» son las que el servicio devolvió ese día, con sus autores,
sus fechas y sus diffs, y los seis contadores de la primera cruzan con las diez
líneas que pinta. **Los tres casos se miraron**, no sólo el feliz:

| Qué se abrió | Qué se vio |
|---|---|
| «Marca» · 5 publicaciones | El badge `EN PRODUCCIÓN` una sola vez, `REVERTIR A ESTA` en las otras cuatro, `REVERSIÓN` en la fila del rollback |
| «Overview» · 0 publicaciones | El vacío de sistema, no «cargando» ni un error — es el caso medido: tiene layout publicado y cero filas |
| El OTRO cliente del mismo nombre | El título dice sólo el cliente: `/config/me` es del usuario que mira y no resuelve el nombre de un dashboard ajeno |

**El 200 del revert sigue SIN MEDIR contra el servicio, y es a propósito:**
correrlo publica una versión nueva y cambia el layout que la consola está
sirviendo. La cadena está cubierta de punta a punta en
`tests/surfaces/builder/historialCableado.test.tsx`, que afirma el **método, la
URL con el layout publicado y el cuerpo con el destino** — y una mutación que
invierte los dos ids la mata.

**Y el cableado destapó dos defectos más, los dos del chrome y los dos invisibles
hasta que hubo una pantalla que montar:**

- **`BuilderChrome` no distinguía `contexto` de `composicion`.** La tabla de
  `pantallas.ts` dice «Contexto · volver a editar» desde el 2026-09-15 y el
  componente las mandaba a las dos al mismo bloque, así que B6 ofrecía `VISTA
  PREVIA`, `PUBLICAR` y el contador de cambios sin guardar sobre una pantalla de
  sólo lectura. El `.pen` lo dibuja explícito: frame `Volver`, `gwJUk`, icono
  `pencil` y `VOLVER A EDITAR`, **y nada más a la derecha**. No se vio antes
  porque la única pantalla con esa forma mostraba un aviso de «Pendiente», y un
  aviso no tiene nada que publicar.
- **La entrada de `PENDIENTES` decía «Está en construcción»** con los tres
  archivos escritos y probados. Un aviso que describe el estado del TRABAJO y no
  el del producto es un defecto, y lo leía el admin del cliente — la misma clase
  que las dos entradas vencidas que se corrigieron esa mañana. `PENDIENTES` quedó
  **vacío**, con la forma declarada, igual que `Admin.tsx` desde el 2026-09-25.

**Y un tercero que no es del chrome:** `useRevertLayout` tomaba el layout
publicado como parámetro del hook, lo que obligaba al contenedor a derivar por
**segunda vez** cuál es —una vez para pintar el badge y otra para armar la URL—.
Los dos ids pasaron a viajar en la mutación, que es como `VersionHistory` ya los
entregaba: así no queda un campo del callback ignorado, que se lee como si se
usara.

**El título puede no tener nombre de dashboard, y se dice.** El único cable
transcripto con nombres de dashboard es `/config/me`, que es del usuario que
MIRA. Para un cliente ajeno haría falta `GET /admin/tenants/{tenantId}/dashboards`
—que el servicio tiene desde `168a761` y **nuestro cable no declara**: es trabajo
nuestro, no un hueco suyo, y por eso no entró en la lista de faltantes de la
pantalla—. Sin nombre el título dice sólo el cliente: decir menos, no decir algo
falso.

**Doce pruebas nuevas de cableado y siete mutaciones sobre línea de base verde,
las siete muertas**: el `dashboardId` que no sale de la versión, el chrome que
vuelve a ofrecer composición, el nombre de dashboard que nunca se resuelve, los
dos ids de la reversión invertidos, la lista de usuarios que no llega, el
historial pedido a la ruta de `layouts`, y B6 vuelta a declarar pendiente.

**DOS ARREGLOS QUE ESTA PANTALLA DESTAPÓ, Y LOS DOS ERAN MENTIRAS EN PRODUCCIÓN.**

`EstadoDeLayout` declaraba dos estados y el dominio tiene **tres**. `archived` no
es raro: es **el más común** —4 de los 7 layouts medidos—. Con el enum en dos,
`ESTADOS['archived']` era `undefined` y el `?? 'borrador'` entregaba **`borrador`
para las cuatro versiones archivadas**, así que `ContextView` ofrecía editar
cuatro versiones que no se pueden editar. El fallback estaba escrito como «la
lectura SEGURA» y con la clave ausente era una afirmación falsa con cara de
prudencia — el mismo modo de falla que el PascalCase, con otra causa.

**Y la prueba que debía atraparlo lo CODIFICABA.** `tests/api/admin.test.tsx`
decía «un estado desconocido cae en `borrador`» y usaba `archived` como ejemplo de
desconocido. No verificaba un fallback: verificaba la mentira, y pasaba porque
estaba escrita mirando el mapa de `ESTADOS` en vez del enum del cable. Es el
antecedente del 2026-08-20 otra vez.

El segundo: `adaptarVersion` **tiraba `dashboard_id`**, que el cable manda desde el
multi-dashboard. Sin él no hay manera de saber qué historial pedir.

**DOS FRASES DEL PROPIO PLAN ESTABAN MAL, Y LAS DOS SE ESCRIBIERON DE UNA LECTURA.**
Decía que `tabs_added` trae la **`key`** de la pestaña: trae el **nombre
normalizado** —`tabKey(name)` es `ToLower(TrimSpace(name))`—, así que cruzarlo
contra `TabDeLayout.clave` no encuentra nada. Y decía que las colecciones vacías
vuelven «`null`, no `[]`»: vuelven **de las dos formas**. Las dos las atrapó abrir
`internal/core/dashboard/diff.go`, no releer el plan.

**Verificada por mutación, nueve casos sobre línea de base verde** —1496 pruebas—.
Ocho mueren de entrada: el `?? []` del adaptador, `ESTADOS.archived`,
`dashboardId`, una lista del diff olvidada, un glifo reasignado, el `layoutId` y
el `toLayoutId` invertidos, la prop del callback mal escrita —que **compila**, por
el spread condicional— y el ancla borrada del archivo.

**La novena SOBREVIVIÓ y era la prueba que faltaba.** Borrar el `!enProduccion` de
`VersionCard` no hacía fallar nada, porque la pantalla nunca le pasa `onRevertir`
en la fila publicada: la guarda quedaba sin cubrir. **No se borró la guarda, se
cubrió** — la tarjeta es reusable y el patrón de `enabled` del `.pen` es normativo.

### ➕ F5.18 ✅ `ROLES Y COMPOSICIÓN` en A2 · el desglose por rol
**Descripción.** El séptimo y último punto mediano de la auditoría
`docs/AUDITORIA-2026-09-21-pen-vs-chat-y-ficha.md` · §9, y **el hueco más
grande** que había quedado: `Sección · Roles` del `.pen` no es una lista de
nombres sino **una tarjeta por rol con cuántos paneles ve y en qué pestañas**, y
debajo una fila por pestaña con su **pregunta operativa**. La pantalla decía
«Pestañas · A · B · C» — el mismo dato sin lo que lo vuelve legible.

Casi todo llegaba ya: las pestañas, sus paneles y la pregunta están en el layout
publicado, que A2 pide para el editor de roles. `Admin.tsx` los tiraba al
adaptar —`{ id, nombre }`— y nadie los echaba de menos.

**Criterio de aceptación.**
- La tarjeta sale del **frame**, no de la nota: `$panel`, `$r-xl`, borde `$w3`,
  padding 24; cifra a la derecha con su rótulo debajo; una línea `$w2` antes del
  desglose; una fila por pestaña con nombre, pregunta y conteo.
- **«Vacío = todas» se resuelve en aritmética, no en una nota.** Un rol sin
  pestañas elegidas suma los paneles de **todas**; leerlo como «ninguna» pintaría
  «0 paneles» y se vería perfecto.
- Lo que el cable no manda **no se inventa y su ausencia se prueba**: los
  heredados de plantilla y la descripción del rol. El resumen se corta antes,
  **sin separador colgando** — que es el defecto que le señalamos al backend en
  la línea de BASE.
- El enlace al catálogo **dispara**, verificado desde la superficie y no desde la
  hoja.
- Se abre la pantalla antes de darla por construida.

**Cerrada el 2026-09-22.** Trece pruebas sobre `RoleCard` con seis mutaciones
cazadas, dos más de punta a punta con tres mutaciones.

**Y apareció un defecto que sólo vio abrirla.** `Cliente`, en `Admin.tsx`,
desestructuraba las props de roles una por una; al sumar `onVerCatalogo`
—opcional— **el compilador no dijo nada**: la prop llegaba a `Cliente` y se
perdía ahí, así que el enlace del `.pen` nunca se pintaba. Es la familia del
spread condicional con cuatro saltos —`Admin → Cliente → RoleEditor →
RoleCard`—, y ni el typecheck, ni el lint, ni las 826 pruebas lo vieron. Se pasó
a reenviar por spread, y la prueba que lo fija **mira desde la superficie**.

**Dos carencias nuevas, declaradas en la pantalla**: la descripción del rol —el
contrato declara `descripcion` y el cable no la trae— y los heredados de
plantilla, que no existen como noción en el cable.

**Propuesta de spec.** El `.pen` pone el nombre del rol en 17 y el de la pestaña
en 12.5, y **la escala que el propio `.pen` emite no tiene ninguno de los dos**:
va de 15 a 20 y de 12 a 13. Se usan los tokens vecinos, igual que con el radio 16
de la hoja del chat: la autoridad del `.pen` no obliga a copiar un valor que el
propio `.pen` no puede emitir.


### ➕ F5.17 ✅ La hoja del chat mide 940, con riel lateral y colapso
**Descripción.** Rehacer `ChatOverlay` y `PanelChat` con la forma que §PEN:C3
dibuja, y construir la pantalla del historial colapsado.

**Criterio de aceptación.**
- Dos columnas: historial 220 y conversación 720, dentro de una hoja de 940.
- El riel colapsa a 52 conservando **el control para reabrir, el «+» y la
  cuenta**.
- La hoja tiene velo, filo y radio sólo del lado que entra.

**Hecha el 2026-09-21.** Medía 480 y el riel iba debajo de la conversación.

**La estructura salió del frame, no de la nota**, y ahí aparecieron dos cosas
que la nota no decía:

- **Un `Velo`** a pantalla completa por detrás. **Es lo que vuelve cierto el
  `aria-modal`**, que estaba declarado desde el principio y era mentira: sin
  velo, todo lo de atrás seguía siendo clickeable y alcanzable por teclado, así
  que a un lector de pantalla se le decía que el resto estaba inerte cuando no
  lo estaba.
- **La cabecera y el campo van en `$elev` sobre una conversación en `$panel`**,
  y el riel en `$dock`. Son tres superficies, no una.

**Los tres anchos del dibujo son tokens exactos**: `w-55` son 220, `w-13` son
52 y `h-0.5` son los 2 del filo, porque `--spacing` es 4px.

**Dos valores del `.pen` NO se copiaron, y es porque el `.pen` se contradice.**
El frame lleva `radius [16, 0, 0, 16]` y un velo `#0B0B0CCC`, los dos **como
literales** —los otros nodos de esa pantalla usan tokens, `$r-lg` en el botón—,
y la escala que el propio `.pen` emite termina en `--radius-xl: 10px` y no tiene
color de velo. Se usan `rounded-l-xl` y `shad`, que además **se invierte con el
tema** cosa que un hex fijo no hace. Quedan como propuesta de spec.

**Y al abrirlo apareció un defecto que ninguna prueba veía:** «HISTORIAL» salía
dos veces, una arriba de la otra — el control de colapso y la cabecera del riel
decían la misma palabra. El control pasó a ser una flecha con su `aria-label`.

Verificada rompiendo el código: cuatro mutaciones, las cuatro muertas —la
cuenta, el «+», el velo y la columna—.

**Una consecuencia anotada en su prueba:** saltar de panel sin cerrar la hoja
**dejó de ser alcanzable para un usuario**, porque el velo tapa los paneles. En
jsdom no hay hit-testing, así que la prueba los alcanza igual; lo que sigue
verificando es que `PanelChat` no arrastre turnos, que es lo que sostiene la
`key`. Hoy es un cinturón sobre tirantes.

### ➕ F5.16 ✅ El chrome de la consola son tres bandas, no un bloque
**Descripción.** Separar el navbar del título y el título del contenido, como
el `.pen` los dibuja.

**Criterio de aceptación.**
- El tema y la identificación del usuario viven en el **navbar**, no al lado
  del título de la pantalla.
- El navbar es una banda propia, con su fondo y su borde.
- Entre las pestañas y los paneles hay una separación declarada, no aire.

**Pedido por el humano el 2026-09-21** —«separá el header más del contenido, el
título está muy cerca, la identificación del usuario y el tema van en el
header»—, y **§PEN:C1 lo confirma campo por campo**: el frame de C1 tiene seis
hijos y los cuatro de arriba son `Navbar` (60), `Header` (96), `Chapter Tabs`
(52) y `Regla` (1). Dentro del `Navbar` están `Tema` y `Usuario`.

**Estaba todo en un bloque.** El logotipo en una línea, y el nombre del cliente,
el título, el usuario y el tema en la siguiente — así que la identidad de la
plataforma y el título de la pantalla se leían como una sola cosa.

**El navbar lleva fondo `dock` y borde `w2`**, que es lo que el dibujo usa para
separarlo: no es aire, es una banda. `dock` no se usaba en ninguna parte hasta
hoy. Y `h-15` son exactamente los 60 del dibujo, porque `--spacing` es 4px.

**El tema y el usuario son de la PLATAFORMA**: no cambian con la pestaña ni con
el período. Al lado del título parecían parte de la pantalla.

**El padding dejó de envolver la cabecera.** Con `p-6` en el `main`, la banda
quedaba flotando con aire a los costados, que es lo contrario de una banda. Cada
zona pone el suyo.

**Lo que NO se movió, y el dibujo sí lo pone en el navbar:** el selector de
período, las notificaciones y el `CTA Synapse`. No estaba pedido y son tres
piezas con su propia decisión. Queda como divergencia abierta de
`docs/AUDITORIA-2026-09-21-pen-vs-chat-y-ficha.md`.

Verificado con una mutación: devolver el tema y el usuario al bloque del título
mata la prueba.

### ➕ F5.15 ✅ El logotipo de la plataforma, que no estaba en ninguna pantalla
**Descripción.** Portar el wordmark de Synapse desde el repositorio archivado y
montarlo en los tres chromes.

**Criterio de aceptación.**
- El logotipo es el ARTE, no la palabra en `font-display`. **No tiene símbolo:**
  es solo la palabra · decidido por el humano el 2026-08-20.
- Se invierte con el tema **sin un segundo archivo**.
- Tiene nombre accesible: el glifo vive en una máscara y no en el texto.

**Reportado por el humano el 2026-09-21** —«el header de la plataforma no se
ve»— y la causa resultó ser más grande que la consola: **el `.pen` empieza las
tres pantallas de chrome con «Synapse»** —C1, A1 y B2— y no estaba en ninguna.
El arte y el componente existían en `synapse_v2` y **nunca se portaron**: es un
hueco del traslado, no una decisión.

**En el builder estaba la invención que v2 ya había corregido**: la palabra
escrita en `font-display`. El capítulo `Identidad` del `.pen` dice que el
logotipo tiene su propia tipografía, no la del producto.

**Es una máscara y no una imagen, y eso resuelve dos cosas de una.** El arte es
blanco puro sobre transparente, así que como `<img>` desaparece sobre fondo
claro. Usando su alfa como máscara y pintando el fondo con `ink`, el color sale
del token: **se invierte con el tema sin un segundo archivo**, y el SVG deja de
importar porque la máscara viene a 4x sobre 20px de alto. Verificado en los dos
temas.

**El ancho va en píxeles y el alto en token.** Una máscara con `contain` sobre
una caja de ancho automático **colapsa a cero**: no hay contenido que la estire.
Los 90 salen de la relación real del arte contra los 20 de alto que declara la
anatomía del navbar, y el alto es `h-5`.

**La URL va en un `style` y no en una utilidad de Tailwind**: escrita como valor
arbitrario, Vite no la reescribe y el archivo no se encuentra en producción. El
color, que es lo que la regla de tokens gobierna, sigue saliendo de la utilidad.

**Queda como propuesta de spec**, igual que en v2: el capítulo `Identidad` manda
la versión en degradado para superficie clara, y ese degradado **está prohibido
sobre superficies con datos** porque su azul y su violeta chocan con las
familias `demanda` e `inventario`. La monocroma sirve en los dos temas.

### ➕ F5.14 ✅ Los literales de C3 y A2, del `.pen`
**Descripción.** Los cuatro ajustes chicos de la auditoría
`docs/AUDITORIA-2026-09-21-pen-vs-chat-y-ficha.md` · §3, §4, §6 y §8.

**Criterio de aceptación.**
- Los literales de UI son los del `.pen`, que es su autoridad. Donde el dibujo
  nombra algo que acá no es lo mismo, **se adapta y se dice por qué** — no se
  copia una etiqueta que miente.
- Cada archivo que implementa una pantalla dibujada lleva su `§PEN:<id>`.
- La regla del CTA muerto sigue: un botón del dibujo sin manejador no se pinta.

**Hecha el 2026-09-21.**

**C3** · la cabecera pasa a `PREGUNTAR A SYNAPSE` con su línea de `CONTEXTO`
debajo; el botón de cerrar dice `ESC` —y conserva «Cerrar» como nombre
accesible, porque `ESC` no se lee en voz alta como una acción—; el desplegable
del SQL dice `VER LA CONSULTA QUE PRODUJO ESTA RESPUESTA`; el riel gana su
cabecera `HISTORIAL` + `NUEVA CONSULTA`, **la marca de tiempo en cada fila** y el
pie `LAS CONSULTAS QUEDAN EN EL TENANT · VISIBLES SOLO PARA TU ROL`; y
`SIN COMPETENCIA` pasa de una línea a su bloque con `NO ES UNA NEGATIVA
GENÉRICA`.

**Dos literales se ADAPTARON, y está dicho en el código.** El `.pen` dice
«Preguntá sobre esta pestaña» y nombra cada hilo `DESDE <PESTAÑA>` porque ahí el
chat es de la pestaña; acá es del panel —decisión del 2026-09-17—, así que el
campo dice «Preguntá sobre este panel» y el contexto nombra la métrica. Copiar el
literal sin su decisión dejaría una etiqueta que miente.

**La marca de tiempo tiene dos formas y las dos son del dibujo**: la hora cuando
el hilo es de hoy, el día y el mes cuando no. Con la hora sola, dos hilos de días
distintos se leen como del mismo rato; con la fecha sola, los seis de hoy dicen
lo mismo. Sale de `format.threadStamp`, que es donde vive todo `Intl`.

**`NUEVA CONSULTA` suelta el hilo, no solo limpia la pantalla.** Con el `hiloId`
puesto, lo que parece una consulta nueva seguiría colgando de la anterior del
lado del servidor: el riel mostraría una fila donde el usuario ve dos.

**A2** · el bloque se llama `ACCESO A DATOS` —«Agente de datos» era nuestro y
describía la plomería—, el **rol va primero** porque la pregunta que contesta la
ficha es «¿qué ve cada rol?», y se escribe la nota dura del `.pen`: *el permiso
se aplica en el backend, no en la composición · un rol sin acceso no ve el dato
aunque el panel exista*.

**Lo que NO se pintó, y es la regla del CTA muerto:** `VERIFICAR AHORA` de A2 y
los dos CTAs de `SIN COMPETENCIA` —`PROYECTAR 4 SEMANAS`, `SOLICITAR LA FUENTE`—
no tienen manejador.

**Abierto en el navegador**: la hoja con sus literales y las dos formas de la
marca —`14:27`, `14 AGO`, `2 JUL`—, y la ficha con `ACCESO A DATOS` y su nota.

**Lo que queda de esa auditoría** son los tres grandes: la hoja de 940 con riel
lateral y su colapso (§1), `ROLES Y COMPOSICIÓN` en A2 (§9) y las sugerencias
como chips contra `chat-suggestions` (§7). Más dos que no son ajustes: el
contexto pestaña-contra-panel (§2) y las fuentes con capa y frescura en el
evento `auditoria` (§5).

### ➕ F5.13 ⬜ Períodos libres en el selector · 🔒 espera el patrón de `PeriodoId`
**Descripción.** Decisión del 2026-09-04 (humano): **se va con manejo de períodos
libres.** El usuario elige un rango y la consola lo contesta, en vez de elegir de
una lista cerrada que manda el backend.

**Lo que YA está resuelto y no hay que rehacer.** El selector no tiene ni un
período escrito: agrupa por `grano`, deshabilita lo que la pestaña no puede
contestar y declara la razón. Un rango libre declara `grano: dia` —se corta en
días— así que `coarsestRequired` **ya** sabe que una métrica mensual no lo puede
contestar. La lógica difícil está escrita desde F1.7.

**Criterio de aceptación.**
- Un rango libre viaja como `PeriodoId` —`2026-07-01_2026-07-17`— y **no** como
  un campo paralelo. `periodo` ya es una clave única que atraviesa el batch, la
  caché, los payloads y el hilo del chat: dos formas de decir «cuándo» obligan a
  cada consumidor a entender las dos.
- **La superficie sostiene el período elegido como objeto, no como id.** Hoy
  `ConsoleContainer` lo busca en `Contexto.periodos` y cae al primero si no está;
  un rango libre nunca va a estar en esa lista.
- **Se valida MIENTRAS se elige, no después.** Con la lista cerrada el selector
  deshabilita antes de que el usuario toque nada; con rango libre elige y recién
  ahí se entera de que media pestaña quedó vacía. Se valida contra
  `coarsestRequired`, que ya existe.
- El rango entra en la clave de caché como cualquier otro período.

**Bloqueada.** El patrón de `PeriodoId` rechaza días, trimestres y rangos —y se
contradice con la descripción de `grano`, que dice que el front deduce
`2026-07-15` como día. Es la pregunta 12 de B0.9, con el patrón propuesto listo.

**El costo real de esta decisión es de backend, no de front:** los períodos de
hoy son snapshots materializados —`estado: 'MTD CERRADO'`, `'CERRADO'`— y un
rango arbitrario hay que calcularlo a demanda.

### F5.10 ✅ Checklist de conformidad §17 por tipo de bloque integrado
### F5.11 ✅ Verificar tema oscuro y claro en todo componente
### F5.12 ✅ Verificar la carga diferida
**Criterio de aceptación.**
- F5.11: automatizable — el chequeo de contraste de v2 (`tools/contraste.py`)
  verifica los pares de tokens en los dos temas y corre en cada build.
- F5.12: una pestaña que usa cinco tipos descarga cinco chunks de cuerpo, no
  quince. Verificable sobre el output del build.

**F5.10 auditada el 2026-09-04 · once de trece**, después de cerrar dos que la
propia auditoría destapó: la garantía del período, que no verificaba nadie, y la
prueba de render mínimo, que era F5.5. §17 tiene trece casillas.
Verificadas hoy, y por quién:

| Casilla | Quién la sostiene |
|---|---|
| Layout de `GET /config/tabs`, no de código | `states.test.tsx` contra MSW |
| Payload de `panels:batch`, no de fixture | ídem |
| Catálogo de `GET /config/catalog` | ídem |
| Gobierno visible en los 6 estados | F2.6 · la prueba del payload sin `Gobierno` |
| Ningún hex literal | `design-lint` L1 |
| `render/` no importa `api/` | `design-lint` L14 |
| Sin `any`, props según `BodyProps` | `typecheck` + `registry.test.tsx` |
| Cuerpos y plots puros | L14 + las pruebas de cuerpo |
| Eventos suben por callbacks | `states.test.tsx`, `Panel.test.tsx` |

**Faltaban dos, y ninguna dependía de nosotros. Las dos se cerraron:**

- **«Cambiar tenant/rol recomponen sin deploy»** · el 2026-09-15, abajo.
- **«Clic abre chat con `metricId` + contexto»** · el 2026-09-21, abajo del
  todo. Esperaba a F3.2, que esperaba a T4.

##### Doce de trece desde el 2026-09-15 · la casilla del tenant y el rol

**La razón por la que estaba bloqueada venció.** «Necesita el contrato de admin y
builder, que no existe» se escribió el 2026-09-04; el contrato existe desde F4.22
—`contracts/synapse-admin-wire.yaml`, con `admin-drift` en la puerta— y la vista
previa por rol está construida en F4.12. Lo que faltaba era la prueba.

**Y no la cubría la casilla 1.** «Layout viene de `GET /config/tabs`, no de
código» dice que la composición llega del servidor; ésta dice que **el tenant y
el rol son los que la mueven**. Un front que pintara el layout que llega y además
tuviera escrito «si el rol es CEO, esta pestaña no» cumpliría la primera y
fallaría ésta — y la diferencia solo se ve cambiando el rol.

`tests/surfaces/console/porRolYTenant.test.tsx` monta **el mismo componente dos
veces** contra dos contextos distintos: otro tenant, otro rol, otra pestaña, otra
pregunta operativa, otra métrica, otro tipo de panel y otra cifra. Sin build en
el medio. La segunda prueba aísla el eje del rol —mismo tenant, dos paneles
contra uno, porque `hidden_metric_ids` ya se aplicó del lado del servidor— y la
tercera fija que **el front no reimplementa el filtro**: un panel cuya métrica
este rol no ve se dice, no se esconde. Esconderlo sería lo mismo que
`RolePreview` explica que no hay que simular.

##### Trece de trece desde el 2026-09-21 · la casilla del chat

**Lo que la destrabó fueron F3.2 y F3.3**, no un cambio en esta tarea: T4 se
cerró el 2026-09-17, el contexto del panel viaja y «Preguntar» existe en el
shell.

**La casilla dice `metricId` y el cable pide `panel_id`, y eso NO se resolvió en
silencio.** §17 de `nuevo-desarrollo.md` se escribió antes de que existiera
`POST /config/chat`; el 2026-09-17 se decidió —decisión humana sobre el informe
de `82da946`— adoptar la forma del backend, que es
`panel_context: {panel_id, period}`, y el servicio resuelve la métrica leyendo
el panel por su id. **Queda como propuesta de spec sobre §17**, que es un
documento normativo y no se edita desde acá.

**Lo que la casilla protege sigue en pie, y es lo que se verifica**: que el chat
quede anclado a la métrica del panel que se apretó. Un front que mandara el
panel equivocado cumpliría «manda un panel_id» y abriría una conversación sobre
otra cifra — y eso no lo ve ninguna prueba que solo mire que el botón existe.

`tests/surfaces/console/preguntar.test.tsx` lo verifica **de punta a punta y no
por partes**: lee el título de la hoja, busca en el catálogo qué métrica se
llama así, busca qué panel la lleva, y exige que sea **ese** el `panel_id` que
salió por la red. Más el período. La segunda prueba cubre la otra línea de §17
—«el componente no navega solo»—: montada la consola y sin apretar nada, no hay
hoja.

**Verificada por mutación**: anclar el chat al primer panel del catálogo en vez
de al apretado mata cuatro de las nueve.

**Verificada por mutación, seis casos sobre línea de base verde.** La pregunta
operativa escrita en el front, el nombre de la métrica escrito en el adaptador,
los paneles recortados a uno, el filtro por rol reimplementado, el orden de
lectura ignorado y el catálogo cayendo a una métrica fija. Mueren los seis.

**Queda una, y sigue 🔒 de verdad.** «Clic abre chat con `metricId` + contexto»
es F3.2 y espera a **T4**: `POST /config/chat` acepta `pregunta`, `tabId` y
`hiloId`, y **no hay campo por donde mandar el panel**. La cadena de callbacks
está construida hasta el botón —`Console → PanelInGrid → Panel → PanelShell`—;
lo que no existe es el manejador arriba, y por la regla de este repositorio un
CTA sin manejador **no se pinta**. Inventar el campo sería escribir contra un
contrato que no lo declara.
- ~~«Cambiar período no re-fetch layout»~~ · **cerrada el mismo día que la
  auditoría la encontró.** Estaba implementada —`keys.tab` no lleva el período—
  y escrita en un comentario de `hooks.ts`, pero **ninguna prueba la sostenía**:
  se cumplía por accidente de quien la escribió, que es como se pierde una
  garantía en la siguiente refactorización. Ahora hay una prueba que cambia de
  período y comprueba que el layout se pidió UNA vez y el batch dos. Verificada
  por mutación metiendo el período en la clave del layout.
- ~~«Prueba de render mínimo con props válidas»~~ · **cerrada con F5.5** el
  mismo día: los doce cuerpos tienen prueba.

**F5.11 cerrada el 2026-09-04, y encontró una violación real en su primera
corrida.** El port agrega una cosa al de v2: **el fondo puede ser una PILA.** Un
wash no es un fondo, es una capa sobre uno — la pestaña activa, el hilo activo
del riel y el badge de degradado se pintan sobre `w2`/`w3` encima de la
superficie, así que medir contra la superficie a secas mide un fondo que nadie
ve.

Y eso es exactamente lo que encontró: **`DegradedBadge` queda en 4.17 contra el
umbral de 4.5 en tema oscuro.** Es un `<Label>` —mono 10px, `dim`— sobre
`bg-w3`. Sobre `panel` a secas da 5.04 y pasa; **es el wash lo que lo hunde**, y
el chequeo de v2 medía sin la capa, así que habría dicho «conforme». En tema
claro da 4.60, que pasa raspando.

Queda REGISTRADA, no arreglada: los tokens salen del `.pen` y las tres salidas
—subir `dim`, bajar el alfa de `w3`, o que el badge deje de usar `dim`— son
decisiones de diseño que tocan más cosas que este badge. Es la pregunta 13 de
B0.9. El chequeo sale verde imprimiéndola como pendiente, y **falla si el
número se mueve**: verificado por mutación, junto con una desviación nueva y con
el caso arreglado.

**F5.12 ✅ · `tools/carga-diferida.py`, sobre `dist/`.** Lo que había verificaba
`preloadBodies`, que es la FUNCIÓN. Lo que decide si el usuario descarga cinco
cuerpos o quince es si el bundler los separó, y eso solo se ve en el build.

**Lo que se cuenta es la existencia de un chunk por cuerpo**, y es la métrica
correcta por cómo falla esto de verdad: nadie escribe «cargá los quince», lo que
pasa es que alguien importa un cuerpo de forma normal —para una prueba de tipos,
para reusar una constante— y Vite, que ve un import estático, lo mete en el
chunk principal. **El `lazy()` sigue ahí y ya no sirve: el código viaja igual, y
el síntoma es que el chunk desaparece.**

Verificado por mutación con un `import { KpiBody }` desde `Console.tsx`: el
chequeo lo detecta y nombra el cuerpo. Sin `dist/` sale BLOQUEADO en vez de
pasar. Corre **después** del build en la puerta, que ahora son diez chequeos.

---

# Transversales

| ID | Tarea | Responsable | Criterio de aceptación |
|---|---|---|---|
| **T1** | `contracts/synapse-api.yaml` es la fuente de verdad | Backend escribe · front consume | Un cambio en el yaml que el backend no implemente rompe CI de alguno de los dos |
| **T2** | Documentar las reglas de los 15 bloques | Backend valida · front muestra | La tabla vive en un solo lugar y se sirve por `/config/blocks` |
| **T3** | Acordar el formato de eventos SSE | Backend | Los seis eventos con su forma, en el yaml |
| ✅ **T4** | Acordar `ContextoDePanel` · **CERRADA el 2026-09-17** | Ambos | Declarado en el cable del backend: `panel_context: {panel_id, period}`. Lo resolvieron ellos en `82da946` y la decisión humana del 2026-09-17 fue adoptar **su** forma en vez de los doce campos que pedía F3.2 — el servicio arma el resto leyendo el panel por su id. Transcrito en `contracts/synapse-console-wire.yaml` |
| **T5** | Seed de demo | Backend | Ver B1.16 y B1.20 |
| **T6** | Ambiente de desarrollo: backend + front + Postgres | Ambos | Un comando levanta los tres. El front apunta a `VITE_API_URL` |
| **T7** | Revisión de conformidad con `design.md` y `parametros-front.md` | Front | Automatizada en F0.11, no manual |
| ➕ **T8** | Cerrar D6: `Metrica.base` a `design.md` · **decidido, falta ejecutar** | Front propone · humano aprueba | `design.md`, el yaml y el catálogo dicen lo mismo. Un panel `BLOQUEADO` puede mostrar su BASE |
| ➕ **T9** | Destino de las cuatro superficies de v2 · **cerrada por D3** | Humano | Quedan diferidas: se retoman cuando el backend llegue a ese tramo |

---

# Camino crítico

**Lo que bloquea a más gente, primero.** Las seis decisiones se cerraron el
2026-09-01, así que lo que queda son dependencias reales de trabajo.

1. **B0.9** — las cinco preguntas abiertas del contrato. Bloquean F2.1, F2.3 y el
   diseño de estados. Es lo más barato del plan y lo que más desbloquea.
2. **B0.10** — endpoint de login. Sin él F0.5 no cierra y el front no entra a la
   aplicación.
3. **F0.9 + F0.11** — runner de pruebas y puerta de calidad, **antes** del
   traslado. Portar 2.800 líneas sin puerta es repetir el fallo del 2026-08-20.
4. **F1.13a → F1.13j** — el traslado, en ese orden: las primitivas no dependen de
   nada y los cuerpos dependen de todo lo anterior.
5. **B1.16 + B1.20** — seed determinista. Desbloquea F1.25 y toda la Fase 2 del
   front.
6. **B1.21** — los mínimos por gráfico. Habilita F1.31, y F1.31 habilita B4.16 y
   F4.21. Es el orden que fija D2: primero qué necesita cada gráfico, después
   quién lo elige.
7. **T8** — cerrar `Metrica.base` en `design.md`. No bloquea código, pero mientras
   siga abierto las tres fuentes de autoridad dicen cosas distintas.

**Lo que puede correr en paralelo desde el día uno:** B0.1–B0.4 del backend y
F1.13a–F1.13d del front, que no dependen de nada.

# Sobre las estimaciones

`tareas-front-back.md` estima la Fase 1 de front en 2–3 semanas. **Con `render/`
portado, la Fase 1 de front es integración, no construcción** — el motor de panel
ya existe, es conforme y pasó por el loop de revisión. Lo que sí es de cero es
admin + builder, que el documento estima en 3–4 semanas y es la parte que v2 no
tiene en absoluto.

Las tres tareas que agrego a Fase 0 —runner, puerta de calidad, generador de
tokens— suman trabajo por delante y lo devuelven en la primera semana del
traslado: son las que hacen que una violación de spec falle en vez de pasar.
