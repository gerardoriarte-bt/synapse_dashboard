# Auditoría · experiencia de usuario, tarea por tarea · 2026-10-19

> **Histórico.** Un cruce puntual, con fecha. No se actualiza.

**Qué se miró:** el front de `main` en `87ae5db` contra el backend local en
`7324b26`, con datos reales de UA, recorriendo las tareas de los tres usuarios
del producto. La revisión de QA del mismo día —sólo lectura, la versión que corre
allá— está en `docs/AUDITORIA-2026-10-19-usabilidad-qa.md`; esta la extiende y
**no repite sus hallazgos**, salvo para ordenarlos en la tabla final.

**Cómo:** cada tarea se hizo de verdad en la pantalla —clics, teclado, el chat
contra Cortex—, y cada causa que se afirma se leyó en el código, nuestro o del
backend. Lo que se escribió en la base local se borró al terminar.

**Severidad:**

- **Alta** — rompe la tarea o la confianza en el dato.
- **Media** — la tarea sale, pero cuesta o confunde.
- **Baja** — pulido.

---

## 1 · Quien lee la consola · «¿cómo va el mes?»

### Alta

**1.1 · La consola compara el mes en curso contra el mes anterior completo, y
dice que no.** El selector de período avisa «Período en curso · incompleto, no
compara contra uno cerrado» (`PeriodPicker.tsx:140`). Debajo, cada tarjeta dice
«VS MES ANTERIOR −74,5 %», «−73,1 %», «−79,4 %»: diecinueve días de octubre
contra treinta de septiembre. **La caída no existe**, y es lo primero que ve un
gerente. Las comparaciones vienen en el payload del backend. O se comparan los
mismos días del mes anterior, o el front marca el delta como parcial y lo apaga
mientras el mes está abierto.

**1.2 · El chat contradice al panel que está en la misma pantalla.** A «¿Qué
plataforma tuvo mejor ROAS este mes?» el agente contestó con datos, bien
formados, y en tabla:

| Este mes | Tabla del dashboard | Chat |
|---|---|---|
| Facebook · inversión | 39.097 | 11.514 |
| Facebook · ROAS | 2,07 | 7,36 |
| Google PMax · ROAS | 5,16 | 16,40 |

**La respuesta misma dice por qué**: consultó `FCT_PERFORMANCE`, «solo campañas
PERFORMANCE … No incluye BRAND», con el ingreso de Adobe sobre el gasto de la
plataforma. Es **otra definición de ROAS** que la del panel, y es casi seguro la
misma causa de lo de Meta en la prosa (`AUDITORIA-2026-10-19-prosa-por-metrica.md`).
**Quien lee ve dos números para lo mismo y ninguno le dice cuál vale.** Es una
decisión de datos y producto: un ROAS, o dos con nombres distintos.

**1.3 · «Ver detalle» por día viene ordenado por valor, no por fecha.** Arriba
el 17, después el 1, el 15, el 13… La serie diaria pierde su lectura en el
tiempo. El servicio la ordena bien (`ORDER BY 1` en `drilldown.go`). **La
desordenamos nosotros**: `DrillSheet.tsx` le pasa `params={}` a `BarsBody`, que
ordena `desc` por defecto. Una línea: `orden: 'natural'` para las dimensiones de
tiempo.

### Media

**1.4 · Tres series de unidades distintas comparten un eje.** En
«Twelve-month efficiency» el ROAS (unidad `x`) queda **plano en cero** al lado de
millones de dólares, y en «Tendencia diaria» las sesiones y los dólares van en el
mismo eje. La escala por unidad del #18 vale **sólo para `smallmult`**
(`SeriesBody.tsx:195`); el gráfico de líneas por defecto sigue con un eje. Medido:
las series sí traen su unidad (`USD`, `USD`, `x`).

**1.5 · Los paneles bloqueados ocupan media pantalla para dos líneas.**
«Retorno contra inversión por plataforma» e «Inversión por plataforma y mes»
conservan su altura completa y muestran «Esta métrica todavía no tiene fuente de
datos». La regla de que el estado reemplaza el cuerpo y no el shell se cumple;
lo que sobra es el alto.

**1.6 · El riel del chat no se entera de la consulta recién hecha.** Después de
preguntar dice «Todavía no preguntaste nada», y al cerrar y reabrir la hoja la
conversación desaparece de la vista. **Sí se guardó** —está en `user_threads`
con su pestaña y período—, y aparece recién al recargar la página. El riel no se
vuelve a pedir después de un envío.

**1.7 · Las tarjetas KPI tienen un hueco en el medio.** La cifra arriba, las
comparaciones abajo, y entre las dos un tercio vacío en «ROAS», «Órdenes»,
«Visits» y «Unidades». El resumen ejecutivo tiene lo mismo entre el texto y los
pilares. Es la altura de la composición (`rowSpan`) más grande que el contenido.

**1.8 · El ⓘ tapa la cifra del panel.** El recuadro «Base · Procedencia» se
abre encima del número. Cierra con Escape y devuelve el foco, que está bien.

**1.9 · El chat arranca vacío.** No ofrece preguntas sugeridas —la ruta existe,
`/config/panels/{panelId}/chat-suggestions`—, y lo único que dice es
«La respuesta llega con su SQL y su procedencia».

### Baja

- **«HIGHER = BETTER» al pie de cada panel**, también en la prosa, la tabla y los
  bloqueados, donde no significa nada.
- **«Goals vs actual»**: 84,8 y 42,1 sin «%», y sin la línea de la meta en 100.
- **La tabla por plataforma se corta en «TapTap»** con scroll interno y sin
  indicarlo; «Participación» sin «%».
- **Los períodos son ids**: «2026-09», no «septiembre 2026», en el selector.
- **El menú de dashboards** dice «1 PESTAÑAS», no marca cuál es el de por
  defecto, y su pie —«SIN PESTAÑAS NI PANELES DE LOS DEMÁS · FALTA EN EL
  CONTEXTO»— no se entiende y se corta.
- **Las columnas de la tabla del chat salen con el nombre de la consulta**:
  «LABEL», «INVESTMENT», «SALES».

## 2 · Quien administra un cliente · «dar acceso, revisar roles»

### Alta

**2.1 · Cambiar el rol, suspender y quitar una pestaña son de un clic**, sin
confirmación ni deshacer · ya en la auditoría de QA, §1.2.

### Media

**2.2 · «Editar» un rol parece no hacer nada.** El formulario se dibuja **debajo
de todas las tarjetas** (`RoleEditor.tsx:303`), y la pantalla no se mueve hasta
él. Con cuatro roles queda fuera de la vista; con los cinco de QA, a dos
pantallas de distancia.

**2.3 · «Métricas ocultas» es una lista plana de 33 casillas**, sin buscador ni
agrupación por familia, y con los pares que no se distinguen —«Ingresos» y
«Sales», «Visitas» y «Visits»—.

**2.4 · La ficha, los roles duplicados por mayúscula, el agente que atiende sólo
a `Planner`, las columnas del catálogo que se pisan** · ver la auditoría de QA,
§2 y §3.

### Baja

- **Pie del riel**: «LAS CONSULTAS QUEDAN EN EL TENANT · VISIBLES SOLO PARA TU
  ROL». «Tenant» no es una palabra de quien lee.
- **«Verificar ahora»** dura hasta recargar, y lo dice en una nota en vez de
  guardarlo.

## 3 · Quien compone · «armar el dashboard de un rol»

### Alta

**3.1 · Una pestaña sin paneles dejaba el borrador sin editor** · **arreglado
hoy en `87ae5db`**, con prueba. Ver la auditoría de QA, §1.1.

**3.2 · El selector de métricas deja elegir una sin dato** · QA §4.1.

### Media

**3.3 · Publicar se explica con la arquitectura.** Al validar dice «El servidor
la dio por válida. Ya se puede publicar; publicar no despliega nada: cambiá qué
versión ve la consola». Lo que quien compone necesita saber es qué va a ver cada
rol al publicar.

**3.4 · La vista previa no deja elegir el período**, y tapa toda la cabecera del
builder. Se compone sobre el mes en curso, que es el parcial —ver 1.1—.

**3.5 · Un dashboard nuevo nace vacío.** «Nuevo dashboard» pide un nombre y
nada más: sin plantilla, sin copiar de otro. Hoy duplicar es abrir el editor de
uno publicado, que es lo que crea un borrador —QA §4.6—.

**3.6 · El lienzo, los controles de tamaño, los rótulos técnicos y el botón de
publicar escondido** · QA §4.2 a §4.5.

## 4 · Lo transversal

**4.1 · Accesibilidad, lo medido:**

- **Los catorce ⓘ se llaman igual** para un lector de pantalla: «Base y
  procedencia», sin el nombre del panel. El de «Preguntar» sí lo dice
  («Preguntar sobre Executive summary»): es la misma idea, a medias.
- **El foco se ve** y Escape cierra lo que abre —el ⓘ, el detalle, la hoja del
  chat, el menú de dashboards—. Eso está bien.
- **El texto chico domina**: rótulos de 9 y 10 px en mono y mayúsculas en todas
  las pantallas, también para frases enteras («SE PUEDE GUARDAR IGUAL; NO SE
  PUBLICA HASTA CORREGIRLOS»). El contraste pasa `contraste`; la lectura cuesta.

**4.2 · El idioma.** Tres capas se mezclan en la misma pantalla:

- **Nuestro chrome**, que se arregla acá: «TENANT», «CATALOG VERSION», «DAY ·
  WEEK · PLATFORM» en el detalle.
- **El catálogo y la semilla**: «Sales», «Investment», «Executive summary»,
  «What moved sales, investment and efficiency this month?».
- **El agente**: «revenue», «spend», «target», «ALL CHANNELS» dentro de texto en
  español.

La regla del 2026-09-25 dice que lo segundo y lo tercero se piden a quien lo
emite. **El voseo** («Elegí», «Arrastrá», «Preguntá») es una decisión de producto
para usuarios de México y Colombia.

**4.3 · Notas de desarrollo en pantalla.** «El filtro por estado no se puede
ofrecer todavía», «Las filas que están detrás de esta cifra todavía no se
publican», «Esta vista no cambia la composición · solo el builder la
modifica», «Se puede guardar igual; no se publica hasta corregirlos. El servidor
tiene la última palabra». **Son verdaderas y son para nosotros.**

**4.4 · Rendimiento: catorce pedidos al abrir la consola**, uno de
`drilldown/dimensions` por panel, antes de que nadie abra un detalle.

---

## Lo que no se miró

- **El responsive**: diferido por decisión humana el 2026-09-28.
- **El login y la solicitud de acceso**: con sesión abierta no se llega sin
  cerrarla. En la primera captura del día se vio un login en tema oscuro con los
  enlaces en mono gris de 10 px.
- **El teclado dentro del lienzo** —flechas y Shift para mover y redimensionar—.
- **Lectores de pantalla de verdad**: lo de arriba sale del árbol de
  accesibilidad, no de usar uno.

## Prioridad · las dos auditorías del día juntas

| | Qué | Sev. | De quién | Tamaño |
|---|---|---|---|---|
| 1 | Comparar el mes en curso contra el anterior completo | Alta | Backend · y el front lo marca | Chico en el front |
| 2 | Dos definiciones de ROAS: el chat y la prosa contra los paneles | Alta | Datos y producto | Decisión |
| 3 | Confirmar rol, suspender y quitar pestaña | Alta | Front | Chico |
| 4 | El selector de métricas deja elegir una sin dato | Alta | Front | Mediano |
| 5 | «Ver detalle» por día en orden de fecha | Alta | Front | **Una línea** |
| 6 | Escala por unidad también en el gráfico de líneas | Media | Front | Mediano |
| 7 | El riel del chat se actualiza al preguntar | Media | Front | Chico |
| 8 | «Editar» rol abre junto a su tarjeta | Media | Front | Chico |
| 9 | Paneles bloqueados y KPI con la altura de su contenido | Media | Front y diseño | Mediano |
| 10 | Preguntas sugeridas en el chat vacío | Media | Front | Chico |
| 11 | Copy: notas de desarrollo, inglés del chrome, «tenant» | Media | Front | Chico |
| 12 | El ⓘ con el nombre del panel, y sin tapar la cifra | Baja | Front | Chico |
| 13 | Períodos con nombre de mes | Baja | Front | Chico |
| 14 | Las dimensiones del detalle, pedidas al abrirlo | Baja | Front | Chico |
| 15 | Voseo, y el inglés del catálogo y del agente | — | Producto, datos | Decisión |
