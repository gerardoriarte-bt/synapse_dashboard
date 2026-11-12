# Propuesta de producto · de consola a asistente de crecimiento · 2026-10-29

> **Abierta.** Es una dirección de producto, no un plan de tareas. La deciden el
> humano y producto; casi todo lo que pide es de backend y datos. Cuando se
> decida, lo que se tome baja al plan y esto no se edita.

**Medido contra:** el front de `main` en `336c545`; el backend en `d296e6d`,
punta de `feature/dynamic-dashboard-backend`, leído con `git show` sin mover su
checkout (`router.go`, `queries.go`, `dd_chat_prompt.go`, `dd_feed_service.go`,
`auth_handler.go` y los adaptadores de correo); y las auditorías de este mes,
citadas donde se usan.

**Lo que NO se midió:** cuánto cuesta en horas, que lo estima cada equipo; y si
los negocios quieren esto, que se pregunta (§7).

---

## 0 · Lo que se pidió, literal

Del humano, el 2026-10-29: «¿Cómo podemos evolucionar esta herramienta a un
asistente de crecimiento de negocios poderoso, algo que todo negocio que quiere
crecer sienta que lo necesita?». Y después de la primera respuesta: «crea el
doc, pero ahonda un poco en qué se necesita para realizar cada punto».

## 1 · La tesis

Quien quiere hacer crecer un negocio se hace cuatro preguntas, en este orden:

| Pregunta | Hoy Synapse… |
|---|---|
| **¿Qué está pasando?** | **La contesta bien**, y con algo que pocos tienen: ninguna cifra sin base, procedencia ni frescura, y un panel degradado lo dice en vez de mostrar un número aproximado |
| **¿Por qué?** | A medias: hay drill-down y chat, pero la desagregación no cierra contra el total, y el agente se puede contradecir con el panel (§2.1) |
| **¿Qué hago?** | **No la contesta**: el cuerpo de recomendaciones existe y el dato no (§2.4) |
| **¿Funcionó?** | **Nadie la contesta**, ni Synapse ni casi ningún competidor |

**Una herramienta que se siente necesaria es la que contesta las cuatro y
recuerda las respuestas.** La cuarta es la que fideliza: un negocio no abandona
el lugar donde está guardado por qué creció.

**El activo que no hay que perder en el camino es la confianza.** Las reglas
duras del producto —ningún número desnudo, ninguna estimación sin intervalo,
degradación declarada— son el diferencial frente a cualquier «IA para tu
negocio». Cada punto de abajo se construye **encima** de ellas.

## 2 · Los cinco puntos

Cada uno dice qué es, qué existe hoy medido, qué se necesita por equipo, el
riesgo, y cómo se sabe que funcionó.

### 2.1 · Que el agente no se contradiga nunca con el dashboard

**Qué es.** Toda cifra que dice el agente es la misma que muestra el panel de
esa métrica y ese período, o declara de dónde sale y por qué difiere.

**Por qué va primero.** Los otros cuatro puntos hablan a través del agente: el
brief lo redacta, la recomendación la propone y el diagnóstico lo explica. Un
asistente que se contradice con su propio dashboard pierde la confianza en un
día, y no se recupera.

**Lo que hay hoy:**
- **La contradicción ya pasó.** Con una instrucción sobre Meta, el agente dijo
  ROAS **7,28** «en alza», mientras el panel `platform_return` de la misma
  corrida decía **2,07** y a la baja
  (`docs/AUDITORIA-2026-10-19-prosa-por-metrica.md`).
- **El prompt lo permite.** `dd_chat_prompt.go` le dice al agente «cita sus
  números y amplía con Snowflake cuando haga falta». Puede ir a otra fuente, y
  nada le pide decir cuál.
- **La definición del agente no está versionada.** La vista semántica que usa
  vive dentro de Snowflake y no está en ningún repositorio: la propuesta
  lite lo declara como lo que no pudo medir. El ROAS del catálogo y el del agente pueden ser dos
  fórmulas distintas sin que nadie lo vea.
- **El drill-down no cierra.** La cifra publicada es 1 232 721; la
  desagregación suma 1 282 259 por día y por semana, y 968 169 por plataforma, porque lee
  otra tabla (F3.9, en el registro de pantallas del plan).
- **En el chat de pestaña, la procedencia se adivina por nombre**, y con el
  dato real las mismas filas salieron como dos métricas distintas
  (`docs/MENSAJE-2026-10-08-backend-procedencia-por-nombre.md`). **No se
  volvió a medir en `d296e6d`.**

**Lo que se necesita:**

| Quién | Qué |
|---|---|
| **Datos** | **Una sola definición por métrica.** La vista semántica del agente calcula cada métrica del catálogo con la misma expresión que el registro, y vive en un repositorio con revisión |
| **Backend** | **Procedencia estructurada por cifra** en la respuesta del agente: o una `metric_key` del catálogo cruzada exacta, o «consulta libre» con las tablas que leyó. Nunca adivinada por nombre |
| **Backend** | **Reconciliación antes de responder.** Si la respuesta trae una métrica del catálogo para un período materializado, se compara contra `dd_panel_data`. Si difiere, la respuesta lo marca; no se corrige en silencio |
| **Backend** | **El prompt cambia de regla**: puede ampliar, pero toda cifra nueva declara su fuente, y una métrica del catálogo se cita del panel |
| **Front** | Un estado «difiere del panel» en la respuesta del chat, con las dos cifras y sus fuentes. **Necesita dibujo** |
| **Todos** | **Un set de preguntas de control por cliente** —unas treinta, con la respuesta sacada de los paneles— que corre en cada despliegue del backend. Es la prueba de regresión del agente |

**Riesgo.** Si la reconciliación marca demasiado, el chat se llena de avisos.
Se mide con el set de control antes de abrirlo.

**Funcionó cuando** el set de control da cero contradicciones en métricas del
catálogo, y el drill-down cierra contra el total o dice por qué no.

### 2.2 · Que pueda entrar cualquier negocio, no sólo quien tiene Snowflake

**Qué es.** Un negocio conecta sus fuentes (tienda, publicidad, analítica) y
ese mismo día ve su dashboard con dato real, sin que nadie escriba código.

**Por qué es el que más abre el mercado.** Hoy un cliente nuevo necesita un data
warehouse, un equipo de datos que le cure el catálogo, y código nuevo en el
backend. Eso deja afuera a casi todos los negocios que quieren crecer.

**Lo que hay hoy:**
- **Las fórmulas son código.** `MetricRegistry`, en `queries.go`, tiene 18
  claves escritas en Go. Una métrica que no está ahí no se calcula.
- **Medido con dos clientes reales esta semana**: Keralty entregó 15 métricas en
  su catálogo y **0 se calculan**; Terpel entregó 10 y **0 se calculan**
  (`docs/AUDITORIA-2026-10-22-catalogo-de-keralty-y-terpel.md`). Es B1.26 —«decidir
  cómo escala el registro antes del segundo tenant»— y ya hay tres clientes.
- **Las interfaces dicen Snowflake en la firma**: no hay un puerto neutro detrás
  del cual cambiar la fuente
  (`docs/PROPUESTA-2026-10-19-version-lite-sin-snowflake.md`, que hoy está sólo
  en `Gerardo`, sin PR).
- **El concepto de fuente ya existe.** `DDFeed` es «una fuente de datos del
  tenant (ERP, Ads API, GA4…)» con cadencia y tolerancia, pero sólo mide la
  frescura de una tabla en Snowflake. No conecta nada.

**Lo que se necesita:**

| Quién | Qué |
|---|---|
| **Backend + producto** | **Decidir B1.26 por la opción B**: la consulta de cada métrica es dato del catálogo, no código. Se valida con `schema-check` al guardarla. Es la decisión de arquitectura de la que depende todo este punto |
| **Backend** | **El puerto neutro de fuente**, que es lo que propone la versión lite: Snowflake pasa a ser una implementación más, y Postgres otra |
| **Backend + producto** | **Conectores para las fuentes comunes**: Shopify, Meta Ads, Google Ads y GA4 primero. Hay que decidir si se construyen o se usa un servicio de extracción y carga existente. Construirlos es OAuth, tokens cifrados (ya hay patrón con `DATA_ENCRYPTION_KEY`), límites de tasa, carga incremental y backfill, por cada fuente |
| **Datos** | **Un catálogo base para comercio**: ventas, pedidos, ticket promedio, conversión, inversión, ROAS y costo por adquisición. Cada uno con su base, ventana y procedencia, definido **una vez** sobre el esquema que deja el conector. Es lo que hoy se escribe a mano por cliente |
| **Front** | El alta guiada: conectar la fuente, ver el estado de la primera carga y elegir una plantilla de dashboard. Parte ya está pensada en `docs/PROPUESTA-2026-09-28-pantallas-de-alta.md`, y el `.pen` dibuja `B7 · Guardar como plantilla` |
| **Producto** | **Elegir el primer segmento.** «Todo negocio» no se construye de una vez: el más directo es comercio electrónico con Shopify y publicidad en Meta y Google, que es la forma del dato de UA |

**Riesgo.** Los conectores son el trabajo más largo y el que más mantenimiento
pide: las API de terceros cambian. Por eso la decisión de construir o usar uno
existente va primero.

**Funcionó cuando** una tienda nueva ve su primer dashboard con dato real el
mismo día, y el backend no tuvo ningún commit para ese cliente.

### 2.3 · Que el asistente vaya a buscar al usuario

**Qué es.** Un brief semanal por correo o Slack —qué cambió, por qué y qué se
recomienda— y, más adelante, alertas cuando una métrica sale de lo esperado.

**Por qué.** Un dashboard espera a que alguien entre; un asistente avisa. Es lo
que más rápido crea hábito, y **es el más barato de los cinco**, porque casi
todas las piezas ya existen.

**Lo que hay hoy:**
- **Correo:** hay un adaptador de SES (`internal/adapters/ses/sender.go`), pero
  sólo lo usan las solicitudes de acceso.
- **Programador:** la materialización ya corre a diario sola, y su estado se lee
  en `GET /admin/materialize/status`.
- **Redacción:** el generador de prosa ya escribe el resumen del período con las
  cifras materializadas, detrás de `DD_MATERIALIZE_PROSE_ENABLED`.
- **Slack:** no hay nada. **Alertas:** no hay nada, ni el modelo que las haría
  confiables (§2.5).

**Lo que se necesita:**

| Quién | Qué |
|---|---|
| **Backend** | **Un trabajo después de la materialización** que compone el brief: las cifras del período contra el anterior y contra la meta, redactadas por el mismo generador de prosa y con las mismas reglas. Todo dato sale de `dd_panel_data`, ninguno del agente libre |
| **Backend** | **Preferencias por usuario**: canal, frecuencia y qué métricas. Baja con un clic, y registro de qué se envió a quién |
| **Backend** | **Slack** como segundo canal: una app con OAuth por espacio de trabajo del cliente |
| **Backend + datos** | **Alertas**, sólo cuando exista la banda esperada por métrica (§2.5). La regla es «fuera de la banda», nunca «bajó 3%», y con tope de alertas por semana |
| **Front** | La pantalla de preferencias; la plantilla del correo con los colores del producto (un correo no lee variables CSS, así que hay que exportar los tokens); y enlaces que abren el panel en su período |
| **Diseño** | El correo y la pantalla de preferencias. No están en el `.pen` |

**Riesgo.** Las alertas falsas destruyen la confianza más rápido que la falta de
alertas. **Se empieza sólo con el brief semanal**, y las alertas llegan con el
modelo de §2.5.

**Funcionó cuando** la mayoría de los usuarios abre el brief cada semana, y una
parte entra a la consola desde él.

### 2.4 · Cerrar el ciclo: decisión → acción → resultado

**Qué es.** Toda recomendación que se aprueba queda registrada con lo que se
esperaba que pasara, y al cumplirse el plazo Synapse mide qué pasó y lo dice.

**Por qué es el que hace que se sienta indispensable.** Con el tiempo, el
asistente sabe qué funciona **en ese negocio**, y el registro se vuelve memoria
de la empresa: por qué se movió el presupuesto, qué pasó, qué aprendimos.
Ninguna planilla ni ningún competidor genérico guarda eso.

**Lo que hay hoy:**
- **El front está listo a medias.** `RecoBody.tsx` dibuja las recomendaciones con
  «Aprobar» y «Rechazar», y el contrato declara `puedeResponder`. Pero **ninguna
  superficie conecta la respuesta**, porque no hay a dónde mandarla.
- **El backend no tiene la ruta.** No hay ninguna en `router.go` para responder
  una recomendación.
- **El registro de decisiones no existe.** En `queries.go`, `month_decisions` y
  `exec_resumen` están bloqueadas con la razón «Requires BT_UA_DECISION_LOG
  actionable framework (not in Snowflake Gold yet)».

**Lo que se necesita:**

| Quién | Qué |
|---|---|
| **Producto + backend** | **Decidir dónde vive el registro.** El bloqueo de hoy lo espera en Snowflake Gold, que es dato del cliente. **Se propone Postgres**, del producto: una decisión es algo que el usuario hace en Synapse, no algo que exista en su warehouse. Y así no depende de que cada cliente tenga Snowflake (§2.2) |
| **Backend** | **El modelo de la decisión**: quién y cuándo; de dónde salió (el agente o una persona); la hipótesis («subir Meta 20% debería subir ventas»); la métrica que se espera mover y con qué banda; el plazo; qué se hizo y cuándo; el estado (propuesta, aprobada, rechazada, ejecutada, evaluada) y el resultado |
| **Backend** | Las rutas para crear, responder y listar decisiones, y **un evaluador** que corre al vencer el plazo. Compara lo que pasó contra lo que se esperaba **sin** la acción, que es la banda del pronóstico (§2.5) |
| **Backend** | **El agente lee el historial** como contexto: «la última vez que subiste Meta 20%, las ventas quedaron dentro de lo esperado». Con las reglas de §2.1 |
| **Front** | Conectar «Aprobar» y «Rechazar»; la lista de decisiones por cliente; construir el resultado, que es F3.10 y ya está dibujado; y marcar en las series la fecha de cada decisión |
| **Diseño** | **El resultado ya está dibujado**: `Consola · C4 · Detalle de hallazgo` y `C4 · Hallazgo fuera de banda`, con la hipótesis, lo estimado con su banda, lo observado y qué cambia. Falta lo que lo rodea —la lista de decisiones y la propuesta que espera aprobación—, dibujado como propuesta en §8 |

**Corregido el 2026-10-29.** La primera versión decía «nada de esto está
dibujado». C4 estaba en el `.pen` desde antes y no se abrió al escribir: es la
falla que la regla del `.pen` existe para atajar, y la encontró abrirlo para
dibujar.

**La honestidad del resultado es una regla, no un detalle.** El evaluador dice
«por encima de lo esperado» o «dentro de lo esperado», **nunca «la decisión
causó»**. En un negocio real pasan diez cosas a la vez. Afirmar causalidad sin
poder medirla es la cifra sin intervalo del razonamiento, y el producto ya la
prohíbe.

**Depende de** §2.1, porque el agente propone, y de §2.5, porque el resultado se
mide contra la banda.

**Funcionó cuando** los clientes registran decisiones cada mes y vuelven a mirar
sus resultados.

### 2.5 · Diagnóstico y escenarios

**Qué es.** «¿Por qué cayó?», contestado con la descomposición del cambio en sus
partes. Y «¿qué pasa si…?», contestado con un rango.

**Lo que hay hoy:**
- **El drill-down está construido** (F3.9) sobre las dos rutas de
  `/config/panels/{panelId}/drilldown`, pero **no cierra contra el total**
  (§2.1), el catálogo trae `dimensiones` vacío, y la etiqueta legible de cada
  dimensión no viaja.
- **No hay ningún pronóstico calculado con dato real.** El cuerpo
  `ForecastBody.tsx` y el bloque `forecast` existen, pero ninguna de las 18
  claves del registro calcula un intervalo. Sin eso no hay alertas (§2.3), ni
  resultado de decisiones (§2.4), ni escenarios.

**Lo que se necesita:**

| Quién | Qué |
|---|---|
| **Datos + backend** | **Una línea base con banda por métrica**: lo esperado para el período según la historia, con su intervalo. Es la pieza que destraba tres puntos y va primero dentro de este. Snowflake tiene funciones de pronóstico propias; en la versión lite habría que llevarlo a un servicio propio. Pide historia: al menos trece meses para ver la estacionalidad, y UA tiene dieciséis cargados en local |
| **Datos** | **Las relaciones entre métricas en el catálogo**: ventas = sesiones × conversión × ticket promedio. Con eso el backend calcula cuánto del cambio aportó cada factor, sin que lo improvise el agente |
| **Datos** | **Que el desglose lea la misma tabla que el total**, para que cierre |
| **Backend** | Exponer la descomposición y la línea base como formas del cable, con su procedencia |
| **Front** | Un cuerpo para la descomposición del cambio. **La cascada ya existe** en la librería del `.pen` —`Plot/CASCADA · Descomposición del crecimiento`— y en el repertorio como `waterfall`, pero el código todavía no la dibuja. Y la pantalla de escenarios, que mueve un supuesto y muestra el rango. Las dos tienen dibujo de propuesta en §8 |

**Corregido el 2026-10-29.** Decía que la cascada «no está en el repertorio»:
está en el `.pen` y en el repertorio, y lo que falta es el cuerpo en el código.
| **Alguien que hoy no está** | **Los escenarios necesitan un modelo de respuesta**: cuánto se mueven las ventas por cada peso invertido en cada canal, con su incertidumbre. Es trabajo de ciencia de datos, y hoy nadie en el equipo lo tiene asignado |

**Más adelante: compararse con negocios parecidos.** Con muchos clientes, «tu
conversión está por debajo de tiendas similares» es muy valioso. Pide
consentimiento explícito en el contrato, anonimización y un mínimo de negocios
por grupo para que ninguno se pueda identificar. **No se empieza hasta tener la
base de clientes y la decisión legal.**

**Riesgo.** Un escenario que parece preciso y no lo es lleva a malas decisiones.
**Se publica siempre como rango**, igual que todo pronóstico.

**Funcionó cuando** el diagnóstico cierra contra el total y explica la mayor
parte del cambio, y la banda de la línea base contiene lo que pasó en la
proporción que promete.

## 3 · El orden, y por qué

```
2.1 confianza del agente ─────────────┐
                                      ├─▶ 2.3 brief semanal ──▶ 2.3 alertas
2.5 línea base con banda ─────────────┤                            ▲
                                      ├─▶ 2.4 decisión → resultado │
2.2 cualquier negocio (en paralelo) ──┘           2.5 escenarios ──┘
```

1. **Ya mismo, y en paralelo:** §2.1, porque todo lo demás habla a través del
   agente, y la decisión de B1.26 de §2.2, que ya está frenando a dos clientes.
2. **Lo primero que se ve:** el brief semanal de §2.3. Casi todo existe, y es
   la mejor forma de averiguar qué valoran los usuarios.
3. **La base:** la línea base con banda de §2.5. Destraba las alertas, el
   resultado de las decisiones y los escenarios.
4. **Lo que fideliza:** el ciclo de §2.4.
5. **Lo que abre el mercado:** los conectores y el catálogo base de §2.2.
   Empieza junto con el punto 1 porque es el trabajo más largo.

## 4 · Lo que no haría

- **Un agente que ejecute solo**, cambiando presupuestos en Meta sin que alguien
  apruebe. La aprobación humana es parte de la confianza. Ejecutar puede ser un
  botón que alguien aprieta, no un piloto automático.
- **Abrirlo a «todo negocio» antes de §2.2.** Mientras haga falta Snowflake y
  código por cliente, el mercado son los clientes que ya tienen un equipo de
  datos.
- **Más paneles como camino al crecimiento.** El valor está en las preguntas 2,
  3 y 4 de §1, no en tener más gráficos para la primera.

## 5 · Lo que el front puede hacer sin esperar

Poco, y conviene decirlo: **casi todo este documento es backend, datos y
producto.** Lo nuestro, sin bloqueo:

- **Dibujar las pantallas nuevas en el `.pen`** para validarlas con negocios
  antes de construir. **Hecho el 2026-10-29**: §8.
- **El cable de las decisiones**, escrito como propuesta de contrato para que
  backend lo discuta. Es lo mismo que se hizo con `/config/plots`.

## 6 · Lo que pide a cada uno, junto

| Quién | Lo principal |
|---|---|
| **Producto** | El primer segmento; dónde vive el registro de decisiones; construir o usar conectores; y validar con negocios (§7) |
| **Backend** | B1.26 por la opción B; la procedencia y la reconciliación del agente; el brief; el registro de decisiones y su evaluador |
| **Datos** | Una definición por métrica, versionada; el catálogo base de comercio; la línea base con banda; las relaciones entre métricas |
| **Diseño** | Revisar los dibujos de §8, y decidir el eje de la cascada |
| **Front** | Dibujar con diseño, el cable de las decisiones, y construir cuando llegue cada parte |
| **Hace falta sumar** | Alguien de ciencia de datos para los escenarios |

## 7 · Antes de construir, preguntar

Esta propuesta apuesta a que **el ciclo de decisión con su resultado** es lo que
más valoran. Es una hipótesis. Antes de comprometer backend y datos, conviene
hablar con cinco a ocho negocios del segmento elegido, y mostrarles los dibujos
del brief, del diagnóstico y de la línea de tiempo de decisiones. Hay que
preguntarles:

- ¿Cómo deciden hoy dónde invertir el próximo mes, y con qué herramienta?
- ¿Qué pagarían por saber si una decisión funcionó?
- ¿Qué los haría dejar de abrir una herramienta así?

La respuesta puede reordenar §3, y es mucho más barato saberlo con dibujos que
con código.

## 8 · Los dibujos

Seis frames en `design/Synapse_v2.pen`, en la fila y = 19100, debajo de las
propuestas del 2026-10-20. Una nota fija arriba del lienzo, «Indicador ·
Propuesta 2026-10-29», lleva a ellos, y cada frame tiene su nota encima.

**Llevan el prefijo «Propuesta ·»**, así que `pen-pantallas` no los exige como
pantallas construidas. Cuando se decidan, se renombran. **Los datos son de
ejemplo**, salvo el ROAS de 7,28 contra 2,07, que es el caso real.

| x | Frame | Punto | Qué se valida con él |
|---|---|---|---|
| 0 | `Propuesta · Crecimiento · 1 · La cifra del agente difiere del panel` | §2.1 | Que la respuesta muestre las dos cifras con su origen y diga cuál vale para decidir. Al costado, las tres reglas y el set de control |
| 1600 | `Propuesta · Crecimiento · 2 · El brief semanal y sus preferencias` | §2.3 | El correo del lunes —qué cambió, por qué, qué se recomienda, qué se cierra— y las preferencias. Las alertas aparecen como «todavía no disponible» |
| 3200 | `Propuesta · Crecimiento · 3 · Las decisiones del cliente` | §2.4 | La lista alrededor de C4: la propuesta que espera aprobación, cada decisión con su resultado en una banda chica, y lo aprendido por clase de decisión |
| 4800 | `Propuesta · Crecimiento · 4 · Por qué cambió` | §2.5 | La cascada que cierra contra el total, los factores con dónde se concentran, y una lectura del agente que sólo cita la tabla |
| 6400 | `Propuesta · Crecimiento · 5 · Un escenario` | §2.5 | Mover inversión entre canales y ver el resultado como rango, diciendo cuándo el rango incluye perder |
| 8000 | `Propuesta · Crecimiento · 6 · El alta conectando fuentes` | §2.2 | Conectar las fuentes comunes y ver qué métrica del catálogo base habilita cada una |

**Una decisión para diseño, escrita en la nota del frame 4:** el eje de la
cascada empieza en USD 1,0M para que se vean los aportes, y el gráfico lo dice.
Un eje que no empieza en cero es una decisión, no un detalle.

**Lo que no se dibujó:** la versión en Slack del brief, los dibujos en móvil y
el tema claro. Se dibujaron en oscuro, como las pantallas de la consola.

**Cómo se dibujó:** con el CLI `pen` 0.3.2 en modo headless, que no migra el
formato: el archivo sigue en 2.17. El `.pen` ganó catorce nodos y no se cambió
ni se borró ninguno de los que había.

