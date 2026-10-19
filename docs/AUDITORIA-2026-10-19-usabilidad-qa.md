# Auditoría · usabilidad de QA: builder y gestión de clientes · 2026-10-19

> **Histórico.** Un cruce puntual, con fecha. No se actualiza.

**Qué se miró:** `qa-synapse.lobueno.co`, con la sesión de
`jose.rodriguez@lobueno.co` (rol `Admin`), recorriendo Clientes, Usuarios,
Catálogo, Salud de feeds, el builder y la consola. **Sólo lectura**: en la red
de QA no salió ninguna escritura. El editor por dentro se revisó con el front
de `main` contra el backend local, porque abrir un editor en QA crea o
autoguarda un borrador.

**Qué corre en QA, medido y no supuesto:**

| | Cómo se supo | Conclusión |
|---|---|---|
| Backend ≥ `5af3b86` | `prose_instruction` viene en `/config/catalog` | Ya tiene la instrucción de prosa |
| Backend ≥ `8272085` | El catálogo de otro cliente da 403 | Ya aísla clientes |
| Backend < `727547e` | `GET /admin/agents?tenant_id=<otro>` da 404 «tenant no encontrado», no 403; `runs` de otro cliente da 200 | **Faltan las dos rutas del 19** |
| Prosa prendida | El resumen ejecutivo está redactado por el agente, con cifras al 19-oct | `DD_MATERIALIZE_PROSE_ENABLED` ya está |
| Front anterior a #18 y #24 | La línea del ROAS sale plana en cero en «Twelve-month efficiency»; el chrome dice «Alcance · todas las cuentas» | Hay que desplegar el front de `main` |
| Meses de 2026 | Los diez figuran «cargado» en Salud de feeds | Ya se cargaron |

---

## 1 · Lo que rompe, y es nuestro

### 1.1 · Una pestaña sin paneles deja el borrador sin editor

**Es el hallazgo más grave, y está en `main`, no sólo en QA.**

En QA, «Abrir el editor de UA MX» lleva a una pantalla que dice **«Elegí un
dashboard para abrir su editor»**, con la cabecera mostrando «Dashboard UA MX ·
borrador v1». El borrador tiene una sola pestaña, «Pestaña nueva», del 8-oct,
**sin paneles**.

**La causa:** el backend serializa una pestaña sin paneles como `"panels":
null` —un slice nil de Go— y `adaptarDetalle` hace `t.panels.map(...)`.
Reproducido con la respuesta de QA contra el código actual: «Cannot read
properties of null (reading 'map')». El builder trata el error como «no hay
dashboard elegido», así que **el error se ve como una instrucción**.

**Reproducido de punta a punta en local:** «+ Pestaña» autoguarda (`PUT` 200),
la respuesta trae `panels: null` y la pantalla muestra el error crudo con un
«Reintentar» que no puede resolverlo. Y es peor:

- **Quitar la pestaña no la quita.** El editor compara contra el detalle de
  antes del error, concluye que no hay cambios, **no manda el `PUT`** y dice
  «Guardado». En la base la pestaña vacía seguía.
- Al recargar, el editor queda como en QA: muerto para ese borrador.

**Agregar una pestaña es todo lo que hace falta para caer acá.** Arreglo: el
adaptador toma `null` como lista vacía en cada lectura de `panels` de `src/api/admin.ts`, el
builder muestra el error como error, y el backend manda `[]` · pedido en
`MENSAJE-2026-10-19-backend-lo-que-ya-tiene-qa.md`.

### 1.2 · Cambiar el rol, suspender y quitar una pestaña son de un clic

- En la tabla de usuarios, **elegir otro rol en el `<select>` se aplica en el
  acto**: sin confirmación y sin deshacer. Un error de scroll con la rueda
  sobre el `<select>` le cambia el permiso a una persona.
- **«Suspender»** corta el acceso en un clic.
- **«Quitar pestaña»** borra la pestaña con todos sus paneles en un clic, y el
  borrador se autoguarda.

Eliminar un hilo del chat ya pide confirmación —el #7, «eliminar una consulta
del riel, con confirmación»—. Estas tres pesan más y no la piden.

## 2 · Gestión de clientes

**2.1 · La ficha es una página de seis pantallas.** Identidad, cinco tarjetas
de rol casi iguales, doce usuarios, acceso a datos y subprocesadores, todo
seguido. Los usuarios aparecen recién en la cuarta pantalla de scroll, y la
misma tabla está repetida en «Usuarios». Conviene una navegación interna
—Identidad · Roles · Usuarios · Acceso— o secciones plegables.

**2.2 · Roles duplicados por mayúscula: `admin`/`Admin`, `planner`/`Planner`.**
El aviso existe, pero está **al final** de las cinco tarjetas, y los
duplicados aparecen como opciones en todas partes: en el selector de rol de
cada usuario, en «Rol» del builder y en la vista previa. Es un dato a limpiar,
de producto o del backend, y mientras tanto el aviso va arriba.

**2.3 · «Acceso a datos» dice que el agente atiende sólo al rol `Planner`.**
Los dos `Admin` —José incluido— no tienen agente. Si es intencional, la ficha
debería decir qué le pasa al chat de un rol sin agente; si no, es un dato a
cargar.

**2.4 · Copy y lenguaje:**

- **Mezcla de idiomas en el chrome nuestro**: «IDENTIDAD DEL **TENANT**»,
  «**CATALOG VERSION**». Es nuestro y se arregla acá.
- **Voseo**: «Elegí», «Arrastrá», «reasignalos», «VOS · SIN ACCIONES SOBRE TU
  CUENTA». Los usuarios son de México y Colombia. Es una decisión de producto,
  no un arreglo.
- **Notas para desarrolladores en pantalla**: «El filtro por estado no se puede
  ofrecer todavía: el estado de cada métrica no llega», «Si el acceso funciona
  lo dice la verificación, que vale hasta recargar la página».

**2.5 · Una solicitud de acceso del 8-sep sigue pendiente** («olvidó su
contraseña»). La cola no dice antigüedad ni ordena por ella.

## 3 · Catálogo

- **Las columnas se pisan**: «escalarConIntervalodemanda»,
  «EDITORIALDERIVADODERIVADO».
- **La forma se muestra con el identificador interno**, en camelCase:
  `escalarConIntervalo`, `seriesMultiples`, `categorica`. Es el nombre de
  nuestro contrato, no copy de producto.
- **«EDITORIAL» y «DERIVADO» debajo de cada columna** no se explican en
  ninguna parte de la pantalla.

## 4 · Builder

**4.1 · El selector de métricas tiene pares que no se distinguen**:
«Ingresos» y «Sales», «Inversión» e «Investment», «Visitas» y «Visits». Uno de
cada par es de la semilla, y desde `3651d70` la semilla sale `BLOCKED` en un
cliente con Snowflake. **Quien compone puede elegir la que no tiene dato.** El
selector debería marcar o esconder las que no se materializan.

**4.2 · Con el configurador abierto, el lienzo se corre a la derecha y se
corta**: la cuarta tarjeta de la fila queda afuera de la pantalla.

**4.3 · Los controles de tamaño tapan el panel.** «ANCHO − + · ALTO − +» flota
sobre la cifra del panel elegido.

**4.4 · Rótulos técnicos en la biblioteca**: «4-8 COL × 4-5 FILAS»,
«INDICADOR 3 × 3». Para quien compone el dato útil es «chico, mediano,
grande», o una vista del tamaño.

**4.5 · Publicar es un camino escondido.** El botón no existe hasta validar, y
lo único que lo anuncia es un texto gris: «Para publicar, validá». El paso
podría estar a la vista, deshabilitado y con su razón.

**4.6 · «Abrir el editor de Overview» crea un borrador** desde lo publicado.
Lo dice en una línea gris, pero el botón es el mismo naranja que el de abrir
un borrador existente. Abrir para mirar ya escribe.

**4.7 · El historial no muestra la v1** de «Overview»: empieza en v2. Si la v1
fue de la semilla, conviene decirlo.

## 5 · Lo que ya está arreglado en `main` y QA todavía muestra

- **La línea del ROAS plana en cero** · #18, la escala por unidad.
- **«Alcance · todas las cuentas»** para un admin de un cliente · #24.

Lo arregla desplegar el front de `main`.

## 6 · De la consola, de pasada

- **Títulos en inglés** («Sales», «Investment», «Visits», «Goals vs actual»,
  «Twelve-month efficiency», «Executive summary», «Decisions») al lado de otros
  en español. Salen del catálogo y de la semilla: es un pedido a datos y
  backend, no un arreglo nuestro (regla del 2026-09-25).
- **«HIGHER = BETTER»** al pie de cada panel, en inglés y en mayúsculas.
- **«Cumplimiento de objetivo» promedia ventas (84,8 %) e inversión (41,4 %)
  en un 63 %.** Promediar el cumplimiento de una venta con el de un gasto no
  significa nada. Es la composición elegida para ese panel, no un defecto del
  cuerpo.
- **El texto de «Decisions» se corta** dentro de la tarjeta, sin indicar que
  sigue.

---

## Prioridad propuesta

| | Qué | De quién | Tamaño |
|---|---|---|---|
| 1 | `panels: null` · el adaptador, el error visible y el «Guardado» falso | Front · y `[]` del backend | Chico |
| 2 | Confirmación en rol, suspender y quitar pestaña | Front | Chico |
| 3 | Desplegar el front de `main` y `7324b26` | Backend | — |
| 4 | El selector de métricas marca las que no tienen dato | Front | Mediano |
| 5 | Catálogo: columnas que se pisan y forma con nombre de producto | Front | Chico |
| 6 | La ficha de cliente con navegación interna | Front · y diseño | Mediano |
| 7 | Roles duplicados por mayúscula | Producto o backend | Dato |
| 8 | Copy del chrome: inglés suelto, notas de desarrollo | Front | Chico |
| 9 | Voseo | Producto | Decisión |

**Lo que no se miró:** el responsive —diferido por decisión humana el
2026-09-28—, el chat, y el builder **dentro** de QA, por la razón de arriba.
