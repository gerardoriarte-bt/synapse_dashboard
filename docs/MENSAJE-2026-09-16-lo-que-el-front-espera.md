# Lo que el front necesita para seguir · 2026-09-16

> **Mensaje**, con fecha. Escrito para mandarse una vez y quedar como registro de
> qué se pidió y con qué evidencia. El detalle tarea por tarea está en
> [`PARA-BACKEND.md`](PARA-BACKEND.md), que se genera del plan.

## El estado, en una línea

El front está **sin trabajo tomable**: 88 de 113 tareas cerradas, y de las 25 que
quedan, **21 esperan algo de este lado** y 4 están diferidas por decisión
nuestra. La consola corre contra el servicio real con doce paneles y cero en
`ERROR`; admin y builder están construidos y probados.

**No hace falta que se haga todo lo de abajo** — con los tres primeros puntos
alcanza para meses de trabajo.

**Cómo leer la evidencia.** Todo lo que dice **404** se probó hoy contra el
servicio corriendo, **con un token de rol `Admin`**. El control es
`GET /admin/tenants`, que con ese mismo token devuelve **200**: por eso un 404 es
que la ruta no existe, y no que nos falte permiso. Lo que dice «el contrato» se
leyó del yaml.

---

## 0 · Gracias por el admin · y lo que destrabó

Con el rol `Admin` pudimos correr nuestro humo contra `/admin/*` por primera vez,
y **el cable de admin coincide con lo que transcribimos**. Eso cierra una
pregunta que les habíamos dejado abierta:

**El PascalCase es real y ya lo absorbimos.** `GET /admin/tenants/{id}/layouts`
devuelve `ID`, `TenantID`, `Status`, `VersionID`, `PublishedAt` — structs de Go
sin etiquetas `json:`. Lo teníamos declarado como deuda en
`synapse-admin-wire.yaml` y ahora está confirmado contra el servicio, no deducido
del código.

**Vale la pena saber que rompe sus propios tests de Postman**: `scriptCreateDraft`
afirma `lv.status === 'draft'` y lo que llega es `Status`. No nos bloquea —el
adaptador lo absorbe— pero si lo van a normalizar, mejor antes de que más gente
dependa de la forma actual. Avisen y cambiamos el yaml.

**Un detalle que encontramos de paso, y es latente, no urgente.** Esa misma
respuesta trae un objeto `Tenant` embebido que hoy llega en cero. La estructura
`domain.Tenant` serializa `PrivateKeyPEM`, `PrivateKeyPassphrase` y `KmsKeyArn`
**sin `json:"-"`**, así que el día que alguien agregue un `Preload("Tenant")` a
esa consulta, la llave privada del tenant viaja al navegador. Hoy no pasa. El
arreglo es una etiqueta por campo.

## 1 · Un campo en `POST /config/chat` · el pedido más barato

Hoy el endpoint acepta `pregunta`, `tabId` y `hiloId`. **No hay campo por donde
mandar desde qué panel se preguntó.**

Es un campo en el cuerpo, y desbloquea cuatro cosas nuestras: abrir el chat desde
un panel (F3.2), el botón «Preguntar» del panel (la mitad de F3.3), la última
casilla de nuestro checklist de conformidad (F5.10) y el listado de hilos
diciendo con qué panel se abrió (F3.7 — que también necesita que `HiloResumen`
devuelva ese panel y el período).

**Es el que más suelta por lo que cuesta.** Lo llamamos T4 en nuestro plan.

## 2 · Tomar el fork · el código ya está escrito y probado

Siete tareas de backend están implementadas en
`gerardoriarte-bt/synapse-api-go`, rama `feature/roles-y-preview`:

| Commit | Qué |
|---|---|
| `d326ebf` | CRUD de roles por tenant · y preview de layout por rol |
| `6f10b8e` | `measurement_window`, el período abierto, quién publicó, sugerencias de chat, ícono, y el diff de layouts |

**No hay PR y no lo va a haber**: el código vuelve desde nuestro repositorio y lo
toman cuando quieran, en el orden que quieran.

**Verificado hoy:** está sobre `733c13c` —la cabeza actual de su rama, que no se
movió desde el 2026-09-11, así que **no hace falta rebasar**—, `go build ./...`
sale limpio y **`go test ./...` pasa entero**. Cero churn en código de ustedes.

**Para revisarlo cómodo hay un PR**, en nuestro fork y no en el de ustedes:
<https://github.com/gerardoriarte-bt/synapse-api-go/pull/1>. La base es una copia
exacta de su rama en `733c13c`, así que el diff es exactamente lo que se
agregaría. Nadie del front lo va a mergear.

**Cómo tomarlo está escrito aparte**, para que no haya que leer nuestro plan:
[`ENTREGA-2026-09-16-fork-como-tomarlo.md`](ENTREGA-2026-09-16-fork-como-tomarlo.md).
Ahí están los dos `cherry-pick`, las **cinco `ALTER TABLE` explícitas** —para no
tener que correr `DB_AUTO_MIGRATE` sobre la RDS compartida— y qué destraba cada
commit. Los dos son independientes: se puede tomar solo el primero.

**Dos advertencias que van con eso:**

- La segunda tanda **agrega cinco columnas**. **No corrimos las migraciones**: es
  un cambio de esquema en producción y esa decisión no es nuestra. Las cinco son
  aditivas y con default o nulables, así que el binario viejo sigue andando con
  la tabla nueva — se pueden correr antes de desplegar.
- Mientras el fork no esté desplegado, `/admin/tenants/{id}/roles` y `/preview`
  dan **404**, y con eso quedan bloqueadas dos pantallas nuestras que ya están
  construidas: la gestión de roles y la vista previa por rol.

## 3 · `/config/plots` · el repertorio de gráficos

Da **404**. Desbloquea tres tareas nuestras: el registro de gráficos con
verificación de mínimos, el selector de gráfico en el builder, y completar los
plots que faltan.

Lo que necesitamos de cada gráfico: su id, qué formas acepta, y **sus mínimos y
topes** — cuántos puntos, categorías o partes necesita para no engañar. Hoy nada
impide que un gráfico de barras reciba un ítem y dibuje una barra sola.

---

## Campos sueltos · cada uno destraba una tarea

| Falta | Dónde | Qué destraba |
|---|---|---|
| `layouts` | `Contexto`, en `/config/me` | El selector de dashboard cuando el tenant tiene más de uno. Hoy el front **no puede saber** que hay más de uno |
| Locale, moneda y zona horaria | `tenant`, en `/config/me` | Hoy `/config/me` manda `tenant: {id, name}`. El front formatea con `es-MX` **escrito a mano**, con el supuesto declarado en el código |
| El estado del período | `/config/me` manda `['2026-09', '2026-08', …]`, cadenas sueltas | Que el selector diga que **el mes en curso está incompleto**. Hoy septiembre se ve igual que agosto y alguien lee una caída que es «el mes no terminó». Lo necesitamos del servidor: el corte del día es del tenant y su huso, no del navegador |
| Panel y período | `HiloResumen` | Que el historial diga con qué panel se abrió cada hilo |
| Una ruta que **liste** usuarios | `GET /admin/users` da **404** · en el router solo está `POST /users` | La pantalla de gestión de usuarios por tenant |
| `/config/solicitudes` | Da **404**, y el contrato ya lo declara | El botón de pedir acceso cuando un panel sale `SIN_PERMISO`. Hoy hay una prueba que fija que el botón **no** está, para que aparezca el día que se cablee |

---

## Y dos que no son de backend

**`make sync-catalog` no se corrió.** `/config/catalog` devuelve las **doce
claves de la semilla de Postgres** —`sales`, `investment`, `executive_summary`,
`orders`…— y no las **diez de Snowflake** —`revenue`, `spend`,
`platform_return`…—. La vista `SYNAPSE_METRIC_CATALOG` ya existe en
`DB_BT_UA.BT_UA_MART_ANALYTICS`, entregada por el equipo de datos el 2026-09-15,
con `MEASUREMENT_WINDOW` poblado en las diez.

Dos de las doce de hoy **no están** en Snowflake: `executive_summary` y
`decisions`, que son los paneles de prosa y recomendación. Vale confirmarlo antes
de sincronizar.

**Y las cinco formas de `Valor` que faltan NO las estamos pidiendo**
—`categoricaComparada`, `perfilMultiatributo`, `matriz`, `flujo`, `grafo`—. El
contrato las deja afuera a propósito: ninguna métrica las declara, así que
declararlas sería agregar una forma que ningún endpoint devuelve. Entran cuando
exista una métrica que las use.

---

## Lo que ya está de nuestro lado

Por si sirve para probar sin esperarnos: la consola entera contra el servicio
real, el adaptador que absorbe las diferencias entre el cable y nuestro contrato,
las cuatro transcripciones del cable con verificación de deriva en cada build, y
admin y builder completos.

Todo en la rama `Gerardo` del repositorio del front, con prueba y con la puerta
en verde.
