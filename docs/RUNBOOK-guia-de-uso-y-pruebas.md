# Guía de uso y pruebas · Synapse para el equipo interno

> **Un procedimiento que se CORRE, y se mantiene.** Sin fecha en el nombre a
> propósito: se corrige en su lugar.

**Para:** el equipo interno que va a probar la plataforma. Sirve para recorrerla
de punta a punta, saber qué tiene que pasar en cada pantalla y distinguir un
defecto de una limitación conocida.

**De dónde sale cada cosa.** Los textos entre comillas son los literales de la
interfaz, leídos del código el 2026-10-14. El catálogo, los dashboards y el
estado de las métricas se midieron ese mismo día en la base local, con el
backend en `3651d70` y el cliente UA MX. **QA puede diferir hasta que el backend
despliegue ese commit**: ver §7.

---

## 1 · Qué es Synapse, en tres frases

Synapse es la consola de inteligencia de negocio para clientes de retail. **No
tiene pantallas escritas**: el backend manda qué pestañas y paneles tiene cada
dashboard, qué métricas existen y sus datos, y el front los dibuja. Por eso casi
todo lo que se ve se configura —en el builder y en administración— y no se
programa.

Tres superficies:

| Superficie | Ruta | Quién entra |
|---|---|---|
| **Consola** · lo que ve el cliente | `/` | Cualquier usuario con sesión |
| **Administración** · clientes, usuarios, catálogo, feeds | `/admin` | Rol `admin` |
| **Builder** · componer dashboards | `/builder` | Rol `admin` |

Las dos últimas se abren desde el **«Menú de trabajo»** (el ícono de
hamburguesa de la consola), que para un usuario sin rol de administrador
aparece vacío. Si alguien sin ese rol entra por la URL, ve «Esta superficie pide
rol de administrador.» Desde las dos se vuelve con «Volver al dashboard».

---

## 2 · Entrar

**Login.** «Correo», «Contraseña» y «Entrar». Debajo, «Solicitar acceso» y
«Olvidé mi contraseña».

**Solicitar acceso** no crea la cuenta: deja una solicitud que un
administrador aprueba (§5.2). Pide «Nombre completo», «Correo», «Empresa»,
«Teléfono», «Cargo» y «Para qué vas a usar la información», más los dos
consentimientos. Al enviar dice «Tu solicitud quedó registrada…».

**Primer ingreso con contraseña temporal.** Antes de ver nada, la plataforma
pide «Cambiá tu contraseña para entrar». Es esperado.

**Credenciales de prueba.** En QA las da un administrador. En local están en
`dev/postgres/README.md`; **para probar nunca hace falta una credencial
personal de producción**.

---

## 3 · La consola

### 3.1 · Orientarse

- **Arriba**: «Cliente» con el nombre del cliente, el selector de dashboard y
  «Preguntar».
- **El título grande** es la pregunta operativa de la pestaña; las pestañas van
  debajo.
- **«Cambiar de dashboard»** aparece sólo si el usuario tiene más de un
  dashboard.
- **«Período»** elige el mes. El mes actual dice «· en curso» y avisa «Período
  en curso · incompleto, no compara contra uno cerrado». **Para mirar cifras se
  usa el último mes cerrado**: el día 1 el mes en curso tiene un solo día de
  datos.
- **El menú de usuario** muestra rol, cliente, tema claro u oscuro y «Cerrar
  sesión». Un usuario del equipo interno ve además «Estás entrando como equipo
  interno · este acceso queda registrado».

### 3.2 · Cómo se lee un panel

Cada panel tiene siempre la misma anatomía, y probarla es parte de la prueba:

| Parte | Qué tiene que estar |
|---|---|
| Título | El nombre de la métrica, que sale del catálogo |
| Nota de lectura | Bajo el título, hasta dos líneas, si el panel la tiene |
| ⓘ | «Cómo leer este panel», «Base», «Ventana» y «Procedencia» —capa, fuente y frescura— |
| Cuerpo | La cifra o el gráfico. **Ningún número sin rótulo** |
| Pie | «Ver detalle» y «Preguntar» |

**Los estados reemplazan el cuerpo, nunca el panel entero**: el título y el ⓘ
siguen ahí aunque el panel esté bloqueado.

| Estado | Lo que se ve | Qué significa |
|---|---|---|
| Disponible | La cifra | — |
| Degradado | Distintivo «Degradado» y la razón | El dato existe pero está vencido o incompleto |
| Bloqueado | «Bloqueado · sin valor aproximado» y «Qué lo desbloquea · …» | No hay dato de ese período. **No es un error**: el panel dice por qué |
| Sin permiso | «Sin permiso» | El rol tiene esa métrica oculta |
| Error | «Error» y «Reintentar este panel» | Falló ese panel; el resto cargó |
| Gráfico no disponible | «La cifra está disponible · lo que falta es el dibujo» | El panel pide un gráfico que este front no conoce |

### 3.3 · El chat

- **Sobre un panel**: «Preguntar» en el pie del panel.
- **Sobre la pestaña**: «Preguntar» arriba, o «Preguntar a Synapse» abajo.
- La hoja muestra el **contexto** —cliente, pestaña, período, paneles—, las
  preguntas «Sugeridas» y, para administradores, el selector «Agente».
- Cada respuesta trae «Ver la consulta que produjo esta respuesta»: **toda
  cifra del chat tiene que poder rastrearse**.
- Si la respuesta trae datos, se dibujan. Lo que no se puede dibujar se muestra
  como tabla con su razón: nada desaparece.
- **El riel «Historial»** guarda las consultas, agrupadas en «Hoy», «Esta
  semana» y por mes. «Nueva consulta» abre otra. Para borrar, pasar el mouse por
  la fila, «Eliminar» y confirmar «¿Eliminar del historial?».

---

## 4 · El builder · componer un dashboard

1. **Elegir el cliente** en «Cliente», arriba. Sólo un operador de la plataforma
   ve más de uno.
2. **«¿Sobre qué se va a componer?»** tiene tres pasos:
   - **Dashboard**: uno existente, o «Nuevo dashboard» → nombre → «Crear
     dashboard».
   - **Rol**: «Todos los roles» o uno.
   - **Editor**: «Abrir el editor de …».
3. **Pestañas.** «+ Pestaña» agrega una. «Ajustes de la pestaña» da «Nombre»,
   «Pregunta operativa», «La ven» —qué roles— y «Quitar pestaña».
4. **Paneles.** En «Biblioteca de tipos», arrastrar un tipo al lienzo o
   apretar «+». Al tocar el panel se abre el configurador:
   - **«Qué muestra»**: la métrica del catálogo. Sólo se ofrecen las que el tipo
     puede dibujar.
   - **«Cómo se ve»**: el gráfico.
   - **«Ajustes»**: «Nota de lectura», «Tamaño» —columnas y filas— y las
     opciones del tipo.
   - En el lienzo, «Ancho» y «Alto» cambian el tamaño sin abrir el configurador.
   - «Quitar panel» lo borra.
5. **Guardar, validar, publicar.**
   - **Guarda solo** a los tres segundos de un cambio, o con «Guardar».
   - **«Validar»** es obligatorio antes de «Publicar»: el botón lo dice si falta.
   - **Una versión publicada no se edita**: «Editar en un borrador» crea uno.
6. **«Vista previa»** muestra el dashboard como lo ve un rol: elegir el rol y
   volver con «Volver a edición».
7. **«Historial de versiones»** lista las publicaciones; «Revertir a esta»
   vuelve a una anterior.

**Para que un dashboard publicado aparezca en la consola**, el rol del usuario
tiene que tener sus pestañas. Eso se define en la ficha del cliente (§5.1).

---

## 5 · Administración

### 5.1 · Clientes y su ficha · `/admin`

La lista de clientes a la izquierda y la ficha del elegido a la derecha:

- **«Identidad del tenant»**: id, vertical, plantilla, estado, moneda, versión
  del catálogo y fecha de alta.
- **«Roles y composición»**: «Nuevo rol», con «Nombre», «Pestañas» y «Métricas
  ocultas». **Así se decide qué ve cada rol**: un rol sin una pestaña no la ve,
  y una métrica oculta sale «Sin permiso».
- **Los usuarios del cliente.**
- **«Acceso a datos»**: qué agente atiende a cada rol y «Verificar ahora», que
  comprueba contra Snowflake que el cliente tiene sus tablas. Un cliente que
  verifica bien puede igual listar **métricas sin cálculo** (§6.3): no es falta
  de acceso.

**Dar de alta un cliente NO se hace desde la pantalla todavía**: no hay botón.
Hoy lo hacen datos y backend siguiendo `docs/RUNBOOK-alta-de-cliente.md`. El
alta sin credenciales desde administración está pedida al backend.

### 5.2 · Usuarios · `/admin/usuarios`

- **«Solicitudes de acceso»**: cada una con «Elegir cliente» y «Elegir agente»,
  y «Aprobar» o «Rechazar». Si alguien pidió recuperar la contraseña, el botón
  es «Enviar contraseña temporal».
- **La lista** se filtra por cliente, rol y estado. En cada fila se cambia el
  rol y se usa «Suspender» o «Reactivar».

### 5.3 · Catálogo de métricas · `/admin/catalogo`

**Sólo lectura.** Muestra cada métrica con forma, familia, capa, fuente, grano
y dirección, y en qué paneles publicados se usa. El catálogo lo escribe datos en
Snowflake y se sincroniza; no se edita desde acá.

### 5.4 · Salud de feeds y «Cargar meses» · `/admin/feeds`

Contesta «¿Por qué una métrica está degradada, y qué la desbloquea?».

**«Cargar meses» es el paso que más se olvida.** La carga automática diaria
sólo calcula **el mes en curso y el anterior**. Todo mes más viejo hay que
pedirlo:

1. Elegir el año y los meses. Cada mes dice «cargado», «en curso» o «sin
   cargar», o se usa «Elegir los N sin cargar de AAAA».
2. «Cargar N meses».
3. El «Historial de cargas» los muestra a medida que terminan. **Calcular un mes
   tarda alrededor de un minuto**, medido en local con la prosa encendida.

**Si un panel sale «Bloqueado» en un mes viejo, lo primero es mirar si ese mes
se cargó.**

---

## 6 · Las métricas de hoy · UA MX

**34 filas en el catálogo**, de cuatro procedencias distintas. Saber de cuál
viene cada una es lo que permite leer bien una prueba.

### 6.1 · Con cálculo en Snowflake · **las que valen para probar cifras**

Diecinueve. Su dato sale del Gold del cliente y se puede volver a calcular.

| Métrica | Clave | Forma | Unidad | Grano | Qué mide |
|---|---|---|---|---|---|
| Ingresos | `revenue` | Escalar | USD | Día | Venta total del sitio según Adobe Analytics, sumada en el mes |
| Órdenes | `orders` | Escalar | órdenes | Día | Órdenes del sitio en el mes |
| Unidades | `units` | Escalar | unidades | Día | Unidades vendidas en el mes |
| Visitas | `sessions` | Escalar | visitas | Día | Visitas al sitio en el mes |
| Inversión | `spend` | Escalar | USD | Día | Inversión bruta en medios, incluido el fee no desglosado |
| ROAS | `roas` | Escalar | x | Día | Venta sobre inversión bruta del mes. **No es incremental** |
| Cumplimiento de objetivo | `goal_attainment` | Categórica | % | Día | Real sobre meta en venta, órdenes, unidades, visitas e inversión |
| Tendencia diaria | `daily_trend` | Multiserie | — | Día | Venta, visitas e inversión de cada día |
| Eficiencia de medios · 12m | `media_efficiency_12m` | Multiserie | USD y x | Día | Inversión, venta y ROAS de los últimos doce meses |
| Retorno por plataforma | `platform_return` | Tabla | — | Día | ROAS que **se atribuye cada plataforma**; no es el del modelo ni el bruto |
| Distribución de inversión | `media_investment_composition` | Composición | % | Día | Peso de cada plataforma en la inversión del mes |
| Inversión por plataforma | `media_platform_investment_matrix` | Matriz | USD | Día | Inversión de cada plataforma por mes |
| Funnel de conversión | `conversion_funnel` | Flujo | — | Día | Visitas → carrito → órdenes |
| Top productos por venta | `top_products_revenue` | Ranking | USD | Día | Productos ordenados por ingresos del mes |
| Retorno contra inversión por plataforma | `platform_gap` | Comparada | USD | Mes | Inversión y retorno de cada plataforma |
| Inversión por plataforma y mes | `platform_month_matrix` | Matriz | USD | Mes | Doce meses por plataforma |
| Inversión hacia el total | `spend_flow` | Flujo | USD | Mes | Aporte de cada plataforma al total |
| Tendencia de followers Instagram | `instagram_followers_trend` | Serie | followers | Día | Seguidores de la cuenta oficial |
| Sentimiento de comentarios TikTok | `tiktok_comment_sentiment` | Categórica | comentarios | Día | Comentarios por sentimiento |

**En septiembre de 2026, 17 de las 19 están disponibles.** Instagram y TikTok
salen «Bloqueado · No hay datos de este período todavía»: es el estado
correcto, no un defecto.

### 6.2 · Prosa generada por el agente

| Panel | Clave | Qué es |
|---|---|---|
| Executive summary | `executive_summary` | Titular y de dos a cuatro puntos sobre ventas, inversión y eficiencia del mes |
| Decisions | `decisions` | Qué mover, qué frenar y qué vigilar |

**El texto lo escribe el agente de Cortex** al calcular cada mes, en español y
con las cifras del período. En el ⓘ la fuente dice `agent:Synapse UA`. En local
están en los 16 meses cargados.

**Los títulos siguen en inglés** porque son filas de la semilla del backend.
Renombrarlas es del backend y quedó diferido. **No es un defecto del front.**

### 6.3 · En el catálogo y sin cálculo todavía

Seis. Datos las declara; falta su consulta, y «Verificar ahora» las lista como
métricas sin cálculo:

| Métrica | Clave | Forma | Grano |
|---|---|---|---|
| Proyección de revenue | `revenue_forecast` | Serie con banda del 95 % | Semana |
| Cierre proyectado del mes | `revenue_forecast_close` | Escalar con intervalo | Semana |
| Proyección de inventario por categoría | `inventory_forecast` | Serie con banda | Semana |
| ROAS esperado por canal | `media_roas_recommendation` | Escalar con intervalo | Semana |
| Contribución por canal (MMM) | `mmm_channel_contribution` | Composición | Semana |
| Descomposición semanal MMM | `mmm_weekly_contribution` | Multiserie | Semana |

### 6.4 · De la semilla de demostración · **no sirven para probar cifras**

`sales`, `visits`, `investment`, `goals_vs_actual`, `investment_by_platform` y
`twelve_month_efficiency`, con títulos en inglés. Son la maqueta del diseño
cargada en la base, **con cifras inventadas**. Desde `3651d70` el backend las
bloquea para los clientes con Snowflake. Viven en los dashboards «Overview» y
«Marca», que existen para comparar.

### 6.5 · Los dashboards

| Dashboard | Para qué | Paneles |
|---|---|---|
| **UA MX** · el de inicio | El de verdad: sólo métricas con cálculo | 10 · los seis KPI, `goal_attainment`, `daily_trend`, `media_efficiency_12m` y `platform_return` |
| Overview | La semilla original, con los dos paneles de prosa | 14 |
| Marca | Repertorio de gráficos sobre dato real | 12 |

---

## 7 · Antes de probar en QA

**QA espera el despliegue**: el front desde `main` y el backend en `3651d70`,
pedidos el 2026-10-14. Hasta que el backend confirme qué commit quedó:

- La prosa puede salir bloqueada o con el texto viejo de la semilla.
- Las métricas de la semilla pueden seguir mostrando cifras.
- El ROAS de «Eficiencia de medios · 12m» puede salir ×100.

**Cuando el backend confirme el despliegue**, lo primero es «Cargar meses» para
todo lo anterior a septiembre (§5.4). Recién ahí se prueba.

---

## 8 · Qué probar, en orden

| # | Qué | Tiene que pasar |
|---|---|---|
| 1 | Entrar con un usuario de cada rol | Cada uno ve sus pestañas; la métrica oculta sale «Sin permiso» |
| 2 | Cambiar de período, uno cerrado y el en curso | Las cifras cambian; el en curso avisa que está incompleto |
| 3 | Abrir el ⓘ de cada panel | Base, ventana y procedencia completas, con frescura |
| 4 | Cotejar los seis KPI contra el reporte del cliente | Coinciden en el mes cerrado |
| 5 | Preguntar sobre un panel y sobre la pestaña | La respuesta cita su consulta; si trae datos, se dibujan o se explican |
| 6 | Reabrir y borrar una consulta del historial | Reabre la conversación; borrar pide confirmación |
| 7 | Componer una pestaña nueva en el builder, validar, previsualizar por rol y publicar | Aparece en la consola para los roles que la ven |
| 8 | Revertir a una versión anterior | La consola vuelve a mostrar la anterior |
| 9 | Crear un rol, ocultarle una métrica y asignárselo a un usuario | Ese usuario la ve «Sin permiso» |
| 10 | Aprobar y rechazar una solicitud de acceso | La aprobada puede entrar y cambia su contraseña al primer ingreso |
| 11 | «Verificar ahora» en la ficha de UA | Acceso vigente, con las seis métricas sin cálculo dichas aparte |
| 12 | «Cargar meses» de un mes viejo | Termina en el historial y sus paneles dejan de estar bloqueados |
| 13 | Probar en tema claro y oscuro, y a 360 px de ancho | Todo legible; nada se corta |

### Limitaciones conocidas · **no reportarlas como defectos**

- No se puede dar de alta un cliente desde la pantalla (§5.1).
- El catálogo no se edita desde administración (§5.3).
- Los títulos en inglés de la semilla (§6.2).
- Instagram y TikTok bloqueados por falta de datos (§6.1).
- El selector de dashboard no muestra las pestañas de los dashboards que no
  están abiertos: dice «falta en el contexto».
- El responsive quedó diferido: a 360 px se usa, pero el `.pen` dibuja tres
  barras superiores y hoy hay una.
- La consola muestra siempre el cliente del usuario. Para mirar otro cliente,
  un operador usa el builder.

**Un defecto se reporta con:** usuario y rol, dashboard, pestaña, período, qué
se esperaba y qué se vio, y una captura con el ⓘ abierto si es una cifra.

---

## 9 · Cómo puede crecer · métricas y plataforma

Ordenado de lo que no pide código a lo que pide más de un equipo.

### 9.1 · Sin código · composición desde el builder

**El dashboard de UA usa 10 de las 19 métricas con cálculo.** Siete de las
nueve restantes ya tienen dato. Agregarlas es componer, no programar:

- Una pestaña **«Medios»**: `media_investment_composition`,
  `media_platform_investment_matrix`, `platform_gap`, `platform_month_matrix` y
  `spend_flow`.
- Una pestaña **«Demanda»**: `conversion_funnel` y `top_products_revenue`.
- **Los dos paneles de prosa** en la pestaña principal.
- **Una pestaña «Social»** con Instagram y TikTok, cuando datos cargue esas
  fuentes.

**El repertorio tiene 49 gráficos** (`docs/repertorio-de-graficos.json`), así
que la misma métrica se puede mostrar de varias formas, como hace «Marca».

### 9.2 · Al desplegar `3651d70` · del backend

- La prosa del agente en QA.
- El aislamiento entre clientes.
- La escala por unidad en los gráficos de varias series.

### 9.3 · Pronóstico y atribución · **backend y datos**

Las seis de §6.3 son el salto más grande en valor: **pasan de describir el mes
a proyectarlo** —cierre del mes, revenue e inventario a doce semanas— y a
atribuir la venta por canal con el MMM.

Todas traen intervalo, que es lo que la regla «ningún pronóstico sin banda» exige
para publicarlas. Son de grano semanal y conviven con las mensuales sin apagar
los meses. Las destraba registrar su consulta, entre backend y datos.

### 9.4 · Prosa por card · pedido al backend

Hoy sólo dos paneles reciben prosa, con instrucción fija. Lo pedido es que **cada
card de prosa tenga su propia instrucción** —«explicá qué movió el ROAS de
Meta»— y que el agente consulte los datos de esa card
(`MENSAJE-2026-10-14-backend-instruccion-de-prosa.md`). El texto escrito a
mano ya se resuelve con la nota de lectura.

### 9.5 · Más clientes

**Una métrica nueva sigue siempre el mismo camino**:

1. Datos entrega el inventario de Gold y la fila del catálogo
   (`docs/snowflake/COMO-ENTREGAR-UNA-METRICA.md`).
2. El backend registra la consulta.
3. El catálogo se sincroniza.
4. Se cargan los meses.
5. Aparece en el builder.

**Un cliente nuevo** sigue `docs/RUNBOOK-alta-de-cliente.md`.

**Lo que abarata el segundo cliente**, en orden:
- El alta desde administración, pedida al backend.
- Las plantillas de vertical: hoy la ficha dice «Todavía no hay plantillas de
  vertical que un cliente pueda heredar».
- Reusar las consultas de UA en todo cliente que cumpla el mismo contrato de
  datos: dos tablas, quince columnas.

### 9.6 · Más adelante, decidido y no tomado

- **Otros idiomas.** El idioma es del cliente y viaja en el catálogo. Falta la
  capa de traducción de la interfaz, y se toma cuando un cliente lo pida.
