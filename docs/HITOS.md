# Hitos · el front dinámico de Synapse

> **Se mantiene.** Cuando un tramo cierra, se agrega al final; lo de arriba no
> se reescribe. Cada hito cita el commit, el PR o el documento que lo sostiene:
> si algo de acá no cuadra con esa fuente, la que manda es la fuente.
>
> **Lo que este documento NO es.** No cuenta tareas —el conteo sale de
> `docs/ESTADO.md`, que se genera—, no dice dónde retomar —eso es `CLAUDE.md`— y
> no reemplaza a las bitácoras: ellas cuentan lo que costó descubrir; esto
> cuenta qué cambió y cuándo.

**Del 2026-08-31 al 2026-10-16** · el primer commit es `4784871` y el último
que cuenta este documento es `b883b50`, del PR #24.

---

## La línea de tiempo en una tabla

| Fecha | Hito | Evidencia |
|---|---|---|
| 2026-08-31 – 09-01 | Arranca el repositorio: la estructura de §4 sobre Tailwind, y el contrato se muda acá | `c29d9e6`, `437d857` |
| 2026-09-02 | **Fase 1 cerrada contra mocks**: el motor de panel portado de v2, la consola de punta a punta y la puerta de calidad en verde | `cdf15f4`, `c894699` · `docs/BITACORA-2026-09-02.md` |
| 2026-09-03 – 04 | Los tokens se generan desde el `.pen`, `design/` entra al repositorio, y arranca el chat contra mocks. El front queda esperando al contrato | `124afa9`, `e9ab356` · `docs/BITACORA-2026-09-04.md` |
| 2026-09-08 | El login y el flujo de acceso, contra `synapse-api-go` | `b650839`, `5e0112e` |
| 2026-09-14 | **Aparece el backend, y habla otro idioma.** La consola pasa al cable real con un adaptador, y el plan pasa a ser la única fuente | `a41b1ef`, `738e0c8` · `docs/BITACORA-2026-09-14.md` |
| 2026-09-15 | **La Fase 4 en un día**: administración y builder, el fork con B4.8 y B4.9, y el hallazgo de que el `.pen` tenía las quince pantallas dibujadas | `96febd0`, `255507e` |
| 2026-09-16 – 17 | Se abre la aplicación por primera vez como usuario: ocho defectos que ninguna prueba vio. Entra `afirmaciones` | `67beb75`, `b53d6f1` · `docs/BITACORA-2026-09-17.md` |
| 2026-09-21 – 22 | El chat pinta y dibuja cifras. La base pasa a Docker local, y entra `pen-pantallas` | `ff37751`, `614517d`, `c66572a` |
| 2026-09-24 | **El chat contesta contra Cortex y el dashboard muestra datos del negocio**, por primera vez | `d2dc57c`, `4120aff` · `docs/BITACORA-2026-09-24-tarde.md` |
| 2026-09-25 | **El producto habla español** (decisión humana) y las cinco pantallas de §7.3 quedan construidas | `36a48e8`, `faa3532` |
| 2026-09-28 | El front, listo para un ambiente de pruebas: `Dockerfile` y `nginx` construidos, corridos y medidos | `dbce7d9`, `e20862c` |
| 2026-09-29 | Los gráficos dibujan con dato de Snowflake, y escribimos `/config/plots` con 49 entradas generadas | `7064f24`, `5bd5a28` |
| 2026-09-30 – 10-01 | Las formas v1.1, el historial de versiones, la ficha en alta, el drill-down, y **un dashboard de UA con dato real** | `3571d7d`, `ab8d03c`, `dfc48a1`, `b356222` |
| 2026-10-02 | **QA medido**: 22 de 22 rutas en verde contra un Synapse desplegado | `77b53db` |
| 2026-10-05 | **El dashboard de UA aplicado en QA**, y es el default al entrar | `2d74255`, `526997c` · `docs/ESTADO-qa-2026-10-05.md` |
| 2026-10-06 – 07 | El builder rehecho: cuatro registros de texto, y el flujo Cliente → Dashboard → Editor con guardado automático. Los gráficos se leen | `bcb0ae5`, `b0a21c5`, `a79f04f` |
| 2026-10-07 – 08 | El gráfico del agente llega al chat, y **el chat dibuja por la forma** (§7 cerrada). Los meses se cargan desde A5 | `8df21ad`, `920ec8d`, `4e3d85c` |
| 2026-10-09 | Administración rehecha (#3). Tablas del chat (#4), el riel reabre y elimina (#6, #7), la puerta deja de reescribir (#8), y el cable se reverifica contra `9dc481e` (#9, #10) | `1e01c11`, `1829449`, `db04bfb` |
| 2026-10-09 – 10 | **Los gráficos del agente se entienden**: los que no tienen familia se dibujan en neutro (#11), el traductor de `chart_spec` es por papel, y nada desaparece (#12) | `a823062`, `151d635` · `docs/AUDITORIA-2026-10-10-graficos-del-chat.md` |
| 2026-10-13 – 14 | El backend contesta por escrito y se remide. La ficha verifica el acceso (#15), los múltiplos pequeños escalan por unidad (#18), la nota de lectura se ve (#19) y **la prosa queda lista para desplegar** | `a1702db`, `8777bc3`, `06b0129` · `docs/BITACORA-2026-10-14.md` |
| 2026-10-16 | El alcance de administración cuenta lo que llegó, y se piden dos rutas que cruzan clientes (#24) | `b883b50` · `docs/AUDITORIA-2026-10-16-selector-de-clientes.md` |

---

## 1 · El arranque · 2026-08-31 a 2026-09-04

**El punto de partida era un repositorio archivado**, `synapse_v2`, con un motor
de panel escrito y ningún backend. El front nuevo nació con la regla que lo
define: **no tiene ninguna pantalla escrita**. El backend manda el layout, el
catálogo y los datos, y el front los dibuja.

- **2026-09-01** · La estructura de §4 de `nuevo-desarrollo.md` sobre Tailwind,
  y `contracts/synapse-api.yaml` se muda a este repositorio (`437d857`).
- **2026-09-02** · En una jornada: el runner de pruebas (F0.9), la puerta de
  calidad reapuntada al stack nuevo (F0.11), **el motor de panel portado de v2**
  —los seis plots, los doce cuerpos— (F1.13), la consola montada, y el colapso
  responsive resuelto en JS (F1.30). Catorce commits, 99 archivos · la bitácora
  del día.
- **2026-09-03** · La escala tipográfica pasa a ser token (F1.28), `design/` entra
  al repositorio, y los tokens se generan desde el `.pen` con `token-drift`
  comparando byte a byte (F0.12). Arranca el motor del chat contra mocks.
- **2026-09-04** · El riel de hilos, el chequeo de contraste, y la decisión de las
  dos zonas horarias: **el corte del día es del tenant y la presentación es del
  navegador**.

**Cómo terminó:** 57 de las 96 tareas de front hechas y **ninguna desbloqueada**.
El front estaba esperando al contrato.

## 2 · El acceso · 2026-09-08

El login (F0.5), el bloqueo por contraseña, recuperar la contraseña y solicitar
acceso, contra el servicio de acceso de `synapse-api-go`. **Se mandó un PR a su
repositorio y se revirtió el mismo día** (`2de76de`): el trabajo del front vive en
el repositorio del front.

## 3 · Aparece el backend · 2026-09-14 y 15

**El backend existía, y no había implementado nuestro contrato.** En vez de
reescribir `render/`, la diferencia la absorbe `src/api/adapt.ts`: la consola
pasó al cable real (F1.32–F1.37) **sin tocar una línea de `render/` ni de
`catalog/`**.

Ese mismo día se ordenó cómo se lleva el proyecto, y sigue así:

- **`plan-de-trabajo.md` es la única fuente.** `docs/ESTADO.md` y
  `docs/PARA-BACKEND.md` se generan desde ahí (`738e0c8`, `df84bcf`).
- **Una lista blanca de documentos** que la puerta hace cumplir, porque había
  cuatro documentos diciendo lo mismo y el más viejo mentía.
- **El estado de las tareas `B*` lo mueve el front**, y sólo verificado contra el
  servicio corriendo.

**El 2026-09-15 se construyó la Fase 4 hasta donde el cable alcanzaba**:
administración, el builder, el canvas de 12 columnas y el flujo de publicar. El
CRUD de roles y la vista previa por rol (B4.8, B4.9) se escribieron en un fork
del backend, que después absorbieron. Ese día **se descubrió que el `.pen` tenía
las quince pantallas dibujadas** (`255507e`), y se habían construido diez sin
abrirlo. Datos entregó el catálogo de métricas en Snowflake.

## 4 · Abrirlo · 2026-09-16 y 17

**Ocho defectos, y los ocho aparecieron al usar la aplicación.** El modo mock
nunca se había abierto en un navegador, y el dashboard publicado se veía apilado
con doce paneles bien compuestos detrás (`b53d6f1`). Ninguno lo encontró una
prueba ni la puerta. De ahí salió la regla de que **lo que existe para mirarse se
abre**, y entró `afirmaciones` a la puerta.

## 5 · El chat habla, y el `.pen` vuelve a cobrar · 2026-09-21 y 22

- El chat pinta la respuesta del agente (F3.13), el historial dice de qué panel
  salió cada hilo (F3.7), y las cifras del agente se dibujan con su BASE y su
  procedencia (F3.6).
- **El `.pen` volvió a cobrar**: la hoja del chat medía 480 donde el dibujo dice
  940. Desde entonces `pen-pantallas` no deja construir una pantalla dibujada sin
  declarar que se miró (`614517d`).
- **La base pasa a ser local, en Docker** (`c66572a`), y con eso se destrabó un
  mes de trabajo sin verificar.
- Se midió el backend contra upstream limpio y casi nos medimos a nosotros: con
  el fork corriendo, nuestro código parecía avance de ellos.

## 6 · El dato es del negocio · 2026-09-24 y 25

- **El chat contesta contra Cortex de verdad**, y al abrirlo apareció que **nunca
  había autenticado** (`d2dc57c`).
- **El dashboard nunca había mostrado un dato de Snowflake**: pintaba la maqueta
  sembrada. Con `sync-catalog` y los doce períodos materializados, **muestra datos
  del negocio** (`4120aff`).
- **El producto habla español** · decisión humana del 2026-09-25 (`36a48e8`).
- **Las cinco pantallas de §7.3 quedan construidas**, con Salud de feeds (F4.24)
  y Usuarios (F4.3).
- `backend-drift` deja de ser binario y pasa a verificar por ruta (`4c25379`).
- **Le mandamos al backend un mensaje equivocado**, por una medición con `grep`
  que no veía las constantes. Se corrigió el mismo día (`e84e5d2`).

## 7 · Listo para pruebas · 2026-09-26 a 2026-09-29

- El chat tiene presencia en la consola (F3.15), el selector de dashboard
  (F5.1), y el locale sale del tenant (F1.13b).
- **Los 49 gráficos del repertorio, transcriptos** (`a13c8e4`), y el 29
  **escribimos `/config/plots`**, generado y no transcripto, porque lo
  habíamos pedido tres veces (`5bd5a28`).
- **El empaquetado**: `Dockerfile` y `nginx.conf` construidos, corridos y medidos,
  y la imagen sin root (`e20862c`, `547b088`).
- `para-backend` avisa cuando un pedido envejece, y **cayeron cinco de once
  pedidos al validarlos contra su repositorio** (`cb2b7bb`).
- **Los gráficos dibujan con dato de Snowflake** (`7064f24`), y se cierran F1.31 y
  F4.21.
- La prosa por agente, probada en local: los dos paneles pasan de la semilla en
  inglés a español con las cifras del período.

## 8 · Dato real en todas partes · 2026-09-30 a 2026-10-02

- **Las formas v1.1** —comparación, matriz, grafo— con sus cuerpos (F4.17–F4.20),
  **el historial de versiones** (F5.19), **la ficha de un cliente en alta**
  (F5.20) y **el drill-down** (F3.9), cerrado contra dato de Snowflake
  (`8f81a20`).
- **Todo 2026 materializado**, de enero a agosto (`20a86e4`).
- **Un dashboard de UA con dato real**: diez paneles y ninguna maqueta
  (`b356222`).
- Se cortó lo que no comunicaba: la dona y el treemap dejaron de servir a una
  categórica, y el sankey salió.
- **QA medido**: 22 de 22 rutas en verde contra un Synapse desplegado
  (`77b53db`). Apareció que la imagen del backend no traía `tzdata`.

## 9 · QA deja de ser una pregunta · 2026-10-05 a 2026-10-07

- **Medir lo nuestro antes de pedir** entra a la puerta (`41746a0`), después de
  tres pedidos cuya respuesta estaba de este lado.
- **El dashboard de UA aplicado a QA, y es el default**: diez de diez paneles con
  dato real (`2d74255`, `526997c`).
- **El builder rehecho** con el humano: cuatro registros de texto —rótulo, ayuda,
  acción y opción—, el flujo Cliente → Dashboard → Editor, y guardado automático
  (`bcb0ae5`, `b0a21c5`).
- **Los gráficos se leen**: leyenda, fechas en el eje y lectura del monto con su
  unidad (`a79f04f`). La BASE y la procedencia van detrás de un ⓘ, por decisión
  humana.
- **Los meses se cargan desde A5** (`4e3d85c`): el programador sólo calcula el
  mes en curso y el anterior, así que todo cliente que llega con historia
  necesita ese paso.

## 10 · El chat dibuja, y se entiende · 2026-10-08 a 2026-10-10

- **El chat dibuja por la forma** (`920ec8d`): si el panel de origen no acepta lo
  que llegó, se usa el único tipo que lo acepta.
- **Administración rehecha** (PR #3): clientes y ficha en una pantalla, usuarios
  por cliente y la cola de solicitudes.
- Del chat: las tablas sin rótulos se declaran (#4), **el riel reabre una consulta
  y la elimina** (#6, #7).
- De la casa: la puerta deja de reescribir `PARA-BACKEND.md` (#8), el cable de
  consola reverificado contra `9dc481e` (#9), los pedidos remedidos —de diez
  quedan tres— y B1.34 cerrada (#10).
- **Los gráficos del agente se entienden.** Un gráfico sin familia se dibuja en
  neutro, por decisión humana (#11). El traductor de `chart_spec` pasa a ser una
  tabla **por papel** —medida, dimensión, serie— y **nada desaparece**: lo que no
  se dibuja va como tabla con su razón (#12).

## 11 · Respuestas escritas, y la prosa lista · 2026-10-13 a 2026-10-16

- **El backend contesta por escrito**, con un `.md` por mensaje, y cada respuesta
  se remide contra su código: `8272085` el 13 y `3651d70` el 14. Llegaron la
  procedencia por origen, las columnas de las tablas del chat, el aislamiento
  entre clientes, el ROAS como ratio y la semilla bloqueada.
- **La ficha verifica el acceso a los datos** (#15). Además, `ok: false` no
  significa «sin acceso».
- **Los múltiplos pequeños escalan por unidad**, y el mes en curso se dice (#18).
  El ROAS correcto había dejado una línea plana en cero.
- **La nota de lectura del panel** se escribe en el builder y se lee en la
  consola (#19, #21). Guardar la borraba en silencio.
- **La prosa, lista para desplegar**: en local, 16 de 16 meses con el agente.
  Falta el despliegue en QA con su bandera, y es del backend.
- **El alcance de administración cuenta lo que llegó** (#24), y se piden dos
  rutas que cruzan clientes sin mirar el token.

---

## Las reglas que nacieron de un incidente

El avance no fue sólo lo construido. Cada una de estas reglas está en la puerta
o en `CLAUDE.md` porque **algo falló sin ella**, y la bitácora del día cuenta qué.

| Desde | Regla | Lo que la originó |
|---|---|---|
| 2026-09-02 | Un CTA sin manejador no se pinta | Tres callbacks que compilaban y no hacían nada · `docs/BITACORA-2026-09-02.md` |
| 2026-09-14 | El plan es la única fuente; los demás documentos se generan | Cuatro documentos de pendientes y el más viejo mintiendo · `docs/BITACORA-2026-09-14.md` |
| 2026-09-14 | Un mock que habla el idioma de la capa interna no prueba la frontera | La consola andaba contra mocks y no contra el cable · ídem |
| 2026-09-16 | Nada se escribe de memoria · `afirmaciones` en la puerta | Cinco afirmaciones falsas en un día, una casi enviada al backend · `docs/BITACORA-2026-09-16.md` |
| 2026-09-17 | Lo que existe para mirarse se abre | Ocho defectos que sólo aparecieron usándola · `docs/BITACORA-2026-09-17.md` |
| 2026-09-21 | El `.pen` se abre antes de construir · `pen-pantallas` | Tres pantallas dibujadas y construidas sin mirarlas · `docs/BITACORA-2026-09-21.md` |
| 2026-09-24 | Una tarea cerrada dice contra qué se cerró | «Verificado contra el servicio» era una foto de la semilla · `docs/BITACORA-2026-09-24-tarde.md` |
| 2026-09-25 | Una transcripción nuestra no es una segunda fuente | El mensaje equivocado al backend · `docs/BITACORA-2026-09-25.md` |
| 2026-09-28 | Cada pedido declara contra qué commit se midió | Cinco de once pedidos falsos · `docs/BITACORA-2026-09-28.md` |
| 2026-10-05 | Antes de pedirle algo a otro equipo, se mide lo nuestro | Tres pedidos cuya respuesta era nuestra · `docs/ESTADO-qa-2026-10-05.md` |
| 2026-10-09 | Sesiones en paralelo: cada una en su rama y su PR | Dos terminales sobre el mismo árbol |

---

## Con quién se construyó

- **Backend**: `synapse-api-go`. Contestó con código, a veces el mismo día, y
  desde el 2026-10-13 contesta por escrito. El historial de lo pedido y medido
  está en los `MENSAJE-*` y `RESPUESTA-*` de `docs/`.
- **Datos**: el catálogo de métricas en Snowflake, el agente de Cortex y su
  acceso · `docs/snowflake/`.
- **Diseño**: el `.pen`, normativo para lo visual. Lo que el código no puede
  decidir solo va como propuesta de spec · `docs/PROPUESTA-*`.
- **Producto**: las decisiones humanas con fecha, escritas donde se tomaron.
