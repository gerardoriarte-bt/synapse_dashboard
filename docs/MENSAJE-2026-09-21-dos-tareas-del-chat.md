# Dos tareas para que el chat contextual funcione · 2026-09-21

> **Mensaje**, con fecha. Escrito para mandarse una vez y quedar como registro de
> qué se pidió y con qué evidencia. El detalle tarea por tarea está en
> [`PARA-BACKEND.md`](PARA-BACKEND.md), que se genera del plan.

## Resumen

Tomamos su commit **`82da946`**, lo corrimos contra la base compartida y
conectamos el chat del front. **Dos cosas quedaron pendientes y las dos son de
su lado**, pero ninguna les pide investigar nada: las dos vienen medidas.

| | Tarea | Bloquea | Esfuerzo estimado |
|---|---|---|---|
| **1** | Correr las cinco migraciones manuales sobre la base compartida | **Todo el chat.** Hoy no responde | Una corrida |
| **2** | Que el evento `data` traiga la BASE y la frescura de la cifra | Que el chat muestre cifras, no sólo prosa | Dos campos |

**Lo que encontramos de nuestro lado ya lo arreglamos** y está al final, para
que no tengan que leerlo salvo curiosidad.

---

## 1 · Las migraciones no se corrieron · MEDIDO, no supuesto

### El hallazgo

Corrimos `82da946` con `make run` contra la base compartida el **2026-09-21** y
consultamos `information_schema`. Resultado, tal cual salió:

```
FALTA  user_threads.panel_id
FALTA  user_threads.period
FALTA  user_threads.deleted_at
FALTA  agents.is_active
FALTA  agents.semantic_views
FALTA  agents.system_prompt_base
FALTA  dd_panel_data.last_error
FALTA  dd_panel_data.last_error_at
FALTA  dd_panel_data.last_success_at
FALTA  índice idx_dd_panel_data_tenant_metric_period

9 de 9 columnas faltan
```

**Ninguna de las nueve está.** Fue una consulta de sólo lectura sobre
`information_schema`; no escribimos nada y no tocamos el esquema.

### Qué significa

Las agrega `internal/adapters/repository/manual_migrations.go`, y corren **sólo
con `DB_AUTO_MIGRATE=true`**, que nosotros no activamos nunca sobre esa base.

La consecuencia práctica: **`POST /config/chat` no puede funcionar hoy.** El
handler escribe `user_threads.panel_id` y `user_threads.period`, y esas dos
columnas no existen. **Se va a ver como un 500, no como un 404** — la ruta está,
lo que falta es dónde guardar.

Lo mismo vale para el resto del commit: el agente se resuelve filtrando por
`agents.is_active`, y el registro de errores de materialización escribe
`dd_panel_data.last_error`.

### Qué les pedimos

**Que las corran ustedes, cuando les parezca.** Aplicarlas es un cambio de
esquema sobre una base compartida y esa decisión no es nuestra — por eso no lo
hicimos, pudiendo.

Las nueve son **aditivas y con valor por defecto**, así que no rompen lo que ya
anda. La única que merece un ojo es el índice único de `dd_panel_data`: su
propio código detecta duplicados y, si los hay, **no crea el índice y lo avisa
por log en vez de borrar datos**, que nos pareció la decisión correcta.

### Cómo nos sirve la respuesta

**Un aviso de que corrieron, con la fecha.** Nada más: la comprobación la
volvemos a correr nosotros. Si prefieren, la consulta es ésta — **nueve filas
quiere decir que están todas**, y el índice va aparte:

```sql
SELECT table_name, column_name
FROM information_schema.columns
WHERE (table_name = 'user_threads'  AND column_name IN ('panel_id','period','deleted_at'))
   OR (table_name = 'agents'        AND column_name IN ('is_active','semantic_views','system_prompt_base'))
   OR (table_name = 'dd_panel_data' AND column_name IN ('last_error','last_error_at','last_success_at'))
ORDER BY table_name, column_name;

SELECT indexname FROM pg_indexes
WHERE indexname = 'idx_dd_panel_data_tenant_metric_period';
```

Y si decidieran **no** correrlas todavía, también sirve saberlo: dejamos el chat
en modo simulado y no les reportamos ningún 500 como defecto.

---

## 2 · Al evento `data` le faltan dos campos para poder pintar una cifra

### El hallazgo

Cuando el agente devuelve un número, ustedes lo mandan así:

```json
{ "shape": "...", "data": { ... },
  "provenance": { "source": "cortex_agent", "tool": "...",
                  "metric_key": "...", "period": "...", "sql_available": true } }
```

Nuestro formato exige seis datos para dibujar una cifra. **Cuatro los podemos
sacar del catálogo cruzando por `metric_key`** —la familia de color, la capa, la
fuente y la versión del catálogo—, así que ésos no se los pedimos.

**Dos no podemos, y son justo los que sostienen la garantía:**

| Falta | Por qué no lo podemos deducir |
|---|---|
| **la BASE** — el denominador | El catálogo tiene la BASE de la **métrica**. La cifra que compuso el agente puede tener otro denominador: si filtró a una tienda, «48 tiendas sobre 52» es **falso**. Copiarla sería declarar un denominador que nadie calculó |
| **la frescura** — de cuándo es el dato | La cifra del chat **no se materializó**: la calculó el agente al vuelo. El catálogo no tiene una fecha que sirva |

Y hay un caso donde no podemos deducir ninguno de los seis: cuando el agente
compone una métrica que **no está en el catálogo**. Ahí no hay fila contra la
cual cruzar.

### Por qué importa

Es una regla dura del producto: **toda cifra declara sobre qué se calculó y de
cuándo es.** Un número sin denominador no se puede auditar, y una cifra vieja sin
fecha es peor que no mostrarla.

Por eso hoy **descartamos el evento `data`**: el chat contesta en prosa y muestra
el SQL, que ya es útil, pero no pinta números. Preferimos eso antes que pintar un
número con un denominador inventado.

### Qué les pedimos

**Dos campos más en `provenance`**, con el nombre que ustedes elijan — nos da
igual y lo adoptamos, como hicimos con `measurement_window`:

- **la BASE de esa cifra**, en el texto que corresponda al cálculo que se hizo;
- **la frescura**, es decir de cuándo son los datos que el agente consultó.

Si les resulta más natural mandar los seis juntos, mejor todavía: nos ahorra el
cruce contra el catálogo y cubre el caso de la métrica que no está en él.

Dónde: `internal/core/services/dd_chat_structured.go`, en `wrapStructured`, que
es donde se arma el objeto.

### Cómo nos sirve la respuesta

**El nombre exacto de los campos.** Con eso destrabamos la tarea F3.6 y el chat
pasa a mostrar cifras con el mismo cuerpo de panel que usa la consola.

Si no lo van a agregar pronto, también sirve: sacamos F3.6 de la lista de «casi»
y dejamos el chat en prosa, que es una decisión legítima y no un pendiente.

---

## Lo que arreglamos de nuestro lado · no necesitan hacer nada

**El chat no pintaba una sola palabra, y era nuestro.** Leíamos el tipo de cada
evento adentro del JSON y ustedes lo mandan en la línea `event:` de la trama.
Nuestro cliente conmutaba sobre un valor indefinido y no acumulaba nada. Ya está
corregido, con pruebas escritas contra el cable de ustedes.

**Nuestra petición también estaba mal.** Mandábamos campos viejos; ahora mandamos
`question` y `panel_context: {panel_id, period}` como pide el binding.

**Y un dato que quizá les sirva:** nuestro contrato declaraba el id del hilo como
un uuid, y el que hay que devolver para continuar la conversación es el
`thread_id` **entero** de la trama `thread_info`. Lo corregimos. Al pasar, notamos
que la trama trae dos ids distintos —`thread_id` entero y `user_thread_id` uuid—
y que sirven para cosas diferentes: uno continúa la conversación y el otro pide
el historial. **Si es así, está perfecto**; lo decimos sólo por si el parecido de
los nombres llega a confundir a alguien más.

---

**Gracias por el commit.** La forma del contexto de panel que eligieron —el panel
y el período, y el resto lo arma el servicio— nos simplificó el trabajo en vez de
complicarlo, y el chat contextual es la pieza que nos faltaba para cerrar la
Fase 3.
