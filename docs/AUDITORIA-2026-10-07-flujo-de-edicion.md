# Auditoría · el flujo de edición del builder · 2026-10-07

**Pedido (humano):** «es poco intuitivo el contexto de edición para llegar al
canvas; no veo cómo crear un canvas nuevo ni un flujo de edición; y en el canvas
no hay un botón de guardar ni algo que indique que los cambios quedaron
aplicados».

**Medido contra** `d1ca9a7` (front) y `7b717aa` (backend, rama
`feature/dynamic-dashboard-backend`), leyendo el código. Sigue a
`AUDITORIA-2026-10-06-builder-contexto-y-canvas.md`, que reordenó cada pantalla
pero no el recorrido entre ellas.

---

## 0 · El diagnóstico en tres líneas

1. **El builder está organizado por VERSIONES y la gente piensa en DASHBOARDS.**
   No hay dónde elegir el dashboard, ni cómo crear uno: se elige una versión
   suelta («Borrador v4») sin saber de qué dashboard es.
2. **El camino a componer pasa por una pantalla de formulario.** Para llegar al
   lienzo hay que bajar en «Contexto de edición» hasta la tarjeta de la pestaña
   y apretar «Componer». El lienzo, que es donde se trabaja, es el segundo paso.
3. **Guardar no da señal.** El botón sólo aparece cuando hay cambios, desaparece
   al guardar y no deja nada en su lugar. Y sobre una versión publicada **se
   puede editar todo y no se puede guardar nada**.

---

## 1 · Lo que se comprobó

### 1.1 · Se edita una versión publicada y los cambios no van a ningún lado

`Builder.tsx:517`: `onGuardar` es `null` cuando `publicada`. Pero el lienzo, el
inspector y el editor de pestañas **no se bloquean**: se arrastra, se cambia la
métrica, sube el contador de cambios… y no aparece «Guardar». El único aviso es
la caja de arriba —«Esta versión está publicada y no se edita»—, que se lee
después de haber trabajado.

**Y es el caso más común**, no un borde: la versión se elige sola —primero el
borrador, si no hay, la publicada—, así que un cliente sin borrador en curso
abre directo sobre la publicada. Es lo que pasa en QA con UA MX.

### 1.2 · Después de guardar no queda ninguna señal

`BuilderChrome.tsx`: «Guardar» se pinta sólo si hay cambios, y el contador sólo
si es mayor que cero. Al guardar bien, **los dos desaparecen**. No hay «Guardado»
ni la hora del último guardado. Desaparecer es también lo que se vería si el
botón se hubiera roto.

### 1.3 · No hay dashboards en el builder

- Las versiones se listan **por cliente**, mezclando todos sus dashboards. En QA
  UA MX tiene dos —«UA MX» y «Overview»— y la lista no dice cuál es cuál.
- **No hay forma de crear un dashboard.** El servicio la tiene —`POST
  /admin/tenants/{tenantId}/dashboards`— y nuestro cable la transcribió
  **leyéndola, sin correrla**: no hay `DELETE` de dashboard, así que medirla deja
  uno para siempre, y `is_default` desplaza al anterior.
- «Crear el primer borrador» sólo aparece cuando el cliente no tiene ninguna
  versión.

### 1.4 · Un defecto real: el borrador puede caer en otro dashboard

`POST /admin/tenants/{tenantId}/layouts` acepta `dashboard_id`
(`dd_layout_builder_handler.go:63-67`). **Sin él, el servicio usa el dashboard
POR DEFECTO** (`resolveDashboard`, `dd_layout_builder_service.go:102`).

Nuestro `crearBorrador` manda sólo `version_id`. Así que «Crear borrador desde
esta versión» sobre una versión de «Overview» —que en QA no es el dashboard por
defecto— **crea el borrador en «UA MX»**, con las pestañas de Overview adentro.

Y le pone el mismo `version_id` que la versión de origen: quedan dos «v3».

### 1.5 · Llegar al lienzo

| Paso | Hoy |
|---|---|
| 1 | Entrar al builder: abre «Contexto de edición» |
| 2 | Bajar hasta la tarjeta de la pestaña, pasando por la revisión, el rol y la versión |
| 3 | Apretar «Componer ‹pestaña›» |
| 4 | En el lienzo, cambiar de pestaña con un `<select>` («Componiendo») |

La pestaña «Canvas» del nav también lleva, a la primera pestaña. Pero nada dice
que ése sea el lugar donde se trabaja, y «Canvas» es una palabra nuestra, no del
producto: el `.pen` la usa sólo como título interno de B2.

---

## 2 · El flujo propuesto

**Dashboard → Editor.** Dos niveles en vez de tres pantallas paralelas.

### 2.1 · Pantalla 1 · Dashboards del cliente

Es lo que hoy es «Contexto de edición», reducida a decidir **qué** se edita:

- Una tarjeta por dashboard: nombre, si es el por defecto, y su estado en
  palabras —«Publicado v3 · 10 sep», «Borrador sin publicar»,
  «Todavía no se compuso» (literal de C6)—.
- En cada tarjeta, **una acción: «Editar»**.
  - Si hay borrador, abre el editor sobre él.
  - Si sólo hay publicada, **crea el borrador a partir de ella** —con su
    `dashboard_id`— y abre el editor diciéndolo: «Se creó un borrador a partir
    de v3. La versión publicada no cambia hasta que publiques».
- **«Nuevo dashboard»**: pide el nombre, lo crea, crea su primer borrador y abre
  el editor con «Agregar la primera pestaña».
- El rol, como filtro, se queda acá o pasa al editor (ver D3).

### 2.2 · Pantalla 2 · El editor (hoy «Canvas»)

Es donde se trabaja, y lo dice:

- **Las pestañas del dashboard como pestañas**, arriba del lienzo, con «+
  Pestaña» al final. Reemplazan al `<select>` «Componiendo».
- Lo que hoy edita la tarjeta de B1 —nombre, pregunta operativa, quién la ve— va
  en el inspector al tocar la pestaña, igual que un panel.
- Biblioteca a la izquierda, inspector a la derecha, como ya está.
- Historial de versiones, vista previa y validar quedan en la cabecera.

### 2.3 · Guardar con estado visible

Un indicador **siempre presente** en la cabecera, con tres estados:

| Estado | Qué se ve |
|---|---|
| Sin cambios | «Guardado · hace 2 min» y «Guardar» deshabilitado |
| Con cambios | «3 cambios sin guardar» y «Guardar» en primario |
| Guardando / error | «Guardando…» / el error con «Reintentar» |

Más un aviso al salir del builder o cambiar de dashboard con cambios sin guardar.

**La alternativa es guardar solo** (ver D2): un borrador es justamente el lugar
donde una composición a medias puede vivir, y el `PUT` reemplaza el layout
entero, así que guardar cada pocos segundos es posible sin cambiar el backend.

### 2.4 · La versión publicada no se edita en el lugar

Si se abre la publicada —desde el historial, por ejemplo—, el editor queda **en
modo lectura**: sin arrastre, sin inspector editable y con una sola acción
arriba, «Editar en un borrador».

---

## 3 · Qué se puede hacer ya y qué necesita una decisión

### Ya, sin decisión de nadie

1. **Mandar `dashboard_id` al crear un borrador** (§1.4). Es un defecto.
2. **Bloquear la edición sobre una versión publicada** (§2.4).
3. **El indicador de guardado** con «Guardado · hace…» (§2.3, versión explícita).

### Con decisión

Las respuestas son del humano, el mismo 2026-10-07, transcriptas literales.

| # | Pregunta | Respuesta (humano) | Cómo se implementó |
|---|---|---|---|
| D1 | ¿Se reorganiza el builder en **Dashboards → Editor** (§2)? | «Si, debe ser entendible el proceso de identificación el Cliente - Dashboard - Editor (Selección de rol y guardado)» | El cliente en la cabecera; la pantalla «Dashboards» en tres pasos —dashboard, rol, abrir el editor— que se van abriendo; el editor con las pestañas como pestañas. La cabecera del editor dice «Dashboard · Borrador vN» y el rol |
| D2 | ¿Guardado **explícito con estado visible**, o **automático**? | «Ambos pero el guardar se debe ver explicito, mostrando los estados del boton cuando quede guardado.» | Se guarda solo a los 3 s sin editar, y el botón no desaparece: «Guardar» con cambios, «Guardando…», «✓ Guardado» con la hora, o el error con «Reintentar». Avisa al salir con cambios |
| D3 | ¿El filtro de rol vive en la lista de dashboards o en el editor? | «En el dashboard, pero debe mostrarse de una manera más clara y progrresiva» | Es el paso 2 de «Dashboards», que aparece recién con un dashboard elegido, y dice qué va a pasar con cada opción |
| D4 | ¿Se corre `POST …/dashboards` en QA para medirlo? | «Si medirlo, se debería poder borrarse dashboards, pero con doble verificación.» | «Nuevo dashboard» está construido; **la medición en QA se hace usándolo**, con el front local apuntando a QA. Borrar necesita una ruta que el servicio no tiene: pedida en `MENSAJE-2026-10-07-backend-borrar-dashboards.md`. El botón no se pinta hasta que exista |
| D5 | ¿«Canvas» pasa a llamarse «Editor»? | «Si mejor Editor, Luego debemos hacer doble click sobre la página de editor para mejorar la experiencia» | Renombrado. **El doble clic queda para la próxima vuelta**, como se pidió («luego») |

## 4 · Lo implementado, además de las decisiones

- **El borrador con su dashboard** (§1.4): `crearBorrador` manda `dashboard_id`, y
  la copia nace con la versión siguiente (`vN`) en vez de repetir la de origen.
  El campo quedó transcripto en el cable, leído en `7b717aa`.
- **La versión publicada no se edita en el lugar** (§2.4): el lienzo pasa a sólo
  lectura, sin biblioteca ni inspector, con «Editar en un borrador».
- **La cabecera queda fija** y el inspector abre debajo: a toda la altura tapaba
  el estado del guardado, justo mientras se editaba. Visto en pantalla.
- **El modo mock dejó de esconder el defecto**: su `POST …/layouts` ponía todo en
  un dashboard fijo y copiaba solo; ahora se comporta como el servicio.

## 5 · Al cerrarla · las pruebas, y cuatro defectos que salieron de ellas y de mirarla

**Las pruebas del builder quedaron describiendo el flujo viejo**: 150 en rojo en
diez archivos, porque elegían versión en B1 y editaban pestañas fuera del lienzo.
Se reescribieron contra Cliente → Dashboard → Editor —ninguna se borró sin
reemplazo, y cada reescritura dice por qué en el archivo—, y lo nuevo se verificó
con **22 mutaciones**, las 22 muertas. Cuatro sobrevivieron en la primera vuelta
y obligaron a corregir pruebas, no código:

- **El guardado automático se afirmaba con el reloj síncrono.** `puts === 0` justo
  después de adelantar el reloj pasaba aunque el `PUT` ya estuviera en camino, así
  que una cuenta que NO se reiniciaba y un error que SÍ se reintentaba solo pasaban
  igual. Ahora el avance es asíncrono y se afirma que lo guardado es lo último
  escrito.
- La biblioteca en la versión publicada y el foco del campo nuevo no tenían
  aserción.

**Los defectos de producto, corregidos:**

| | Qué pasaba | Cómo salió |
|---|---|---|
| `adoptarIds` | Una pestaña nueva **renombrada mientras viajaba su primer guardado** perdía el id, y el guardado siguiente **la duplicaba** en el servicio: se la reconocía por el nombre. Ahora se empareja contra lo ENVIADO, por posición | Una prueba, al reescribir `guardar` |
| La publicada | El aviso «no se edita» salía **dos veces**, con dos botones que hacían lo mismo. Queda el del editor; `SaveBar` sólo dice el error | Al reescribir `guardar` |
| B6 sin versiones | Con un dashboard recién creado y elegido, decía «Elegí un dashboard». Ahora lo nombra y dice que no tiene versiones | Mirando la pantalla |
| «Nuevo dashboard» | El campo abría sin foco, y lo tipeado no iba a ningún lado | Mirando la pantalla |

**Y una deuda que se cerró sola**: el título de B6 sacaba el nombre del dashboard
de `/config/me`, que sólo sirve para el cliente propio, y el comentario pedía
transcribir `GET /admin/tenants/{tenantId}/dashboards`. Ya estaba transcripta: el
nombre sale de ahí para cualquier cliente.

**Lo que NO se hizo:** la medición de `POST …/dashboards` en QA (D4). Necesita
iniciar sesión en QA con una cuenta real, y eso lo hace el humano.
