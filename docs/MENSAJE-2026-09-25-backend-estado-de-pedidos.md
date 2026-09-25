# Para el equipo de backend · qué esperamos y qué destraba cada cosa · 2026-09-25

> **Histórico.** Un mensaje mandado, con fecha. No se actualiza.
>
> Es el consolidado del día: en vez de otro pedido suelto, esto dice **todo lo
> que el front espera hoy, ordenado por lo que destraba**. El detalle de cada
> punto vive en `docs/PARA-BACKEND.md`, que **se genera** desde nuestro plan —si
> algo de acá y de ahí no coincide, el que está mal es este mensaje.

## Primero: gracias, y lo que ya no hace falta pedir

Hoy contestaron tres pedidos **con código, el mismo día**. Lo medimos contra su
binario limpio, no contra nuestro fork:

| Commit | Qué cerró |
|---|---|
| `6e595e3` | `presentation` en los KPI escalares · y `DEGRADED` para filas nunca materializadas |
| `1e080ee` | **Salud de feeds, usuarios por tenant y el CRUD de roles** |
| `75b8ecc` | `series_with_band` estricta, con `level` y `lo`/`hi` obligatorios |

**Con eso construimos dos pantallas el mismo día** —A5 · Salud de feeds y
A3 · Usuarios— y las cinco de administración quedaron completas. `presentation`
quedó verificada de punta a punta: los seis KPI muestran su medidor y sus
comparativos con dato del negocio, por primera vez.

**Y tomaron `/roles/composition`**, la ruta a la que nos habíamos corrido para no
pisar la suya. La colisión queda cerrada de las dos puntas.

**También pedimos disculpas por un mensaje equivocado de esta mañana**: dijimos
que no emitían `distribution` ni `series_with_band` y las emitían desde el 21. El
error fue de medición y está explicado en
`docs/MENSAJE-2026-09-25-backend-formas-corregido.md`.

---

## Lo que esperamos, por lo que destraba

### 1 · Lo que más rinde: cinco tareas de una

**`/config/plots` · el repertorio de gráficos y sus mínimos** (B1.21).

Hoy da 404. Destraba **F1.31 y F4.21** —el registro de gráficos y el selector del
builder—, y sin él el builder no puede ofrecer un gráfico sabiendo si la métrica
le alcanza.

**Las cinco formas de v1.1 en nuestro contrato** (B5.3, y es mitad nuestra).

Ustedes ya las emiten —`compared_categorical`, `multi_attribute_profile`,
`matrix`, `graph`, `flow`—. Lo que falta de su lado es **que exista el dato**: sin
una métrica que las use, construir los cuerpos es escribir a ciegas. Destraba
**F4.17, F4.18, F4.19, F4.20 y F5.3**.

### 2 · Tres campos chicos que destraban dos tareas cada uno

| Qué | Destraba | Hoy |
|---|---|---|
| **`ventana`** en el catálogo (B1.25) | La línea de BASE sale con el separador colgando **en todos los paneles** | La columna `MEASUREMENT_WINDOW` ya existe en la vista de Snowflake, con valor en las diez |
| **`open_period`** (B1.27) | F1.42 y F5.13 · el mes en curso se ofrece igual que los cerrados y alguien lee una caída que es «el mes no terminó» | Medido hoy: `/config/me` no lo trae |
| **locale, moneda y zona del tenant** (B1.1) | F1.13b y la regla de las dos zonas horarias | El contexto no los declara |

**Las dos primeras están escritas en nuestro fork** y esperan que las tomen —ver
abajo—.

### 3 · Lo que le falta a administración

**`GET /admin/tenants` devuelve sólo `id` y `name`** (B4.1). A1 pide cinco
columnas más: estado, vertical, usuarios, frescura del feed más atrasado y última
publicación. **Es la única de las cinco pantallas de admin que sigue coja**, y
también está escrita en nuestro fork.

**El alcance de plataforma de A3.** La ruta de usuarios es por cliente y la
pantalla está dibujada cruzando clientes —«17 usuarios · 2 clientes»—. No lo
compensamos sumando N llamadas: un total armado de nuestro lado parecería de
plataforma y bajaría sin avisar si un cliente falla.

**Un usuario de prueba con rol restringido** (B1.19). El mecanismo está en su
código y no podemos comprobarlo: con el usuario que tenemos el catálogo devuelve
todo. Con uno restringido se cierran dos cosas en un minuto — el catálogo
recortado y un panel en `FORBIDDEN`, que es el único de los seis estados que
seguimos sin poder verificar.

### 4 · Lo del materializador que quedó abierto

**Los paneles de prosa** · `executive_summary` y `decisions`. Su Fase 6 lo tiene
decidido y pendiente, y coincidimos con el camino: que el materializador llame al
agente. Sin apuro; lo anotamos para que no se pierda.

**`decimals` y `unit` por columna en `tabular`** (B1.14), que es la mitad que
sigue en pie de esa tarea.

---

## Y cinco tareas suyas que están escritas y esperando

Siguen en `gerardoriarte-bt/synapse-api-go`, rama `feature/roles-y-preview`,
**rebasada hoy sobre `6e595e3`**: **B1.25, B1.27 y B4.1**, más **B4.9** (preview
por rol, que sigue dando 404 en su servicio).

`go build` ✓, `go vet` ✓, **+283 −13 en archivos de ustedes** —los 13 son cambios
de firma que se propagan a sus mocks—. Una sola prueba falla, y es la decisión
que sigue abierta: la compuerta de `resolveLayout` confunde **quién pregunta**
con **a quién se simula**, y con eso el preview por rol rechaza un borrador.

**No hay PR contra su repositorio ni lo va a haber**: el código vuelve desde el
nuestro y lo toman cuando quieran.

## Una cosa nuestra que arreglamos hoy, por si les sirve

Nuestro cable declaraba un solo commit para las nueve rutas, así que al
reverificar tres quedaba **rojo permanente** y dejamos de leerlo — ocho días.
Ahora la marca es **por ruta** y el número baja de a una.

Reverificarlas hoy encontró cuatro cosas suyas que llevábamos días sin
transcribir: `dashboards` y `active_layout_id` en `/config/me`,
`preferred_dashboard_id` en preferencias, `tab_context` en el chat y `tab_id` en
el riel. **Ninguna es un problema suyo** — es que nuestra copia envejecía sin que
nadie lo notara, que es justo lo que causó el mensaje equivocado de la mañana.
