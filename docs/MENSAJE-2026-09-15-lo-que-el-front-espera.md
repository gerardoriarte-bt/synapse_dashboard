# Lo que el front necesita para seguir · 2026-09-15

> **Mensaje**, con fecha. Escrito para mandarse una vez y quedar como registro de
> qué se pidió y con qué evidencia. El detalle tarea por tarea está en
> [`PARA-BACKEND.md`](PARA-BACKEND.md), que se genera del plan.

## El estado, en una línea

El front está **sin trabajo tomable**: 95 de 196 tareas cerradas, y las
veintiocho que quedan esperan algo de este lado. La consola corre contra el
servicio real con doce paneles y cero en `ERROR`; admin y builder están
construidos y probados. **No hace falta que se haga todo lo de abajo para
destrabarnos** — con los tres primeros puntos alcanza para meses de trabajo.

Todo lo que dice **404** se probó contra el servicio corriendo hoy, con un token
válido. Lo que dice «el contrato» se leyó del yaml.

---

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
| `b13fccd` | `measurement_window`, el período abierto, quién publicó, sugerencias de chat, ícono, y el diff de layouts |

**No hay PR y no lo va a haber**: el código vuelve desde nuestro repositorio y lo
toman cuando quieran, en el orden que quieran. Está rebasado contra su rama y con
cero cambios en código de ustedes.

**Dos advertencias que van con eso:**

- La segunda tanda **agrega cinco columnas** y las aplica `AutoMigrate`. **No
  corrimos las migraciones**: la base es la RDS compartida de producción y esa
  decisión no es nuestra. Las cinco son aditivas y con default.
- Mientras el fork no esté desplegado, `/admin/roles` da **404** y con eso quedan
  bloqueadas dos pantallas nuestras que ya están construidas: la gestión de roles
  y la vista previa por rol.

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
| Una ruta que liste usuarios | `/admin/users` da **404**; solo existe `POST` | La pantalla de gestión de usuarios por tenant |
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
admin y builder completos contra el cable del fork.

Todo en la rama `Gerardo` del repositorio del front, con prueba y con la puerta
en verde.
