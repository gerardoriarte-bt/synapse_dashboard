# Cuatro preguntas sobre el chat contextual · 2026-09-21

> **Mensaje**, con fecha. Escrito para mandarse una vez y quedar como registro de
> qué se preguntó y con qué evidencia. El detalle tarea por tarea está en
> [`PARA-BACKEND.md`](PARA-BACKEND.md), que se genera del plan.

## De qué se trata, en tres líneas

Tomamos su commit **`82da946`** y conectamos el chat contextual del front contra
el cable nuevo. **Encontramos un defecto nuestro y ya está arreglado**: leíamos
el tipo de evento adentro del JSON y ustedes lo mandan en la línea `event:`, así
que el chat no pintaba una sola palabra.

Nos quedan **cuatro cosas que no podemos contestar solos**. Una nos impide
*verificar* lo que ya construimos; las otras tres son huecos del cable donde
tuvimos que elegir, y preferimos preguntar antes que dejar una decisión nuestra
metida en el código sin que nadie la haya visto.

**Ninguna es urgente salvo la primera.** Las otras tres pueden esperar a que les
quede cómodo.

---

## Cómo nos sirve la respuesta · vale para las cuatro

**No hace falta que escriban un documento.** Al contrario: preferimos la salida
cruda de un comando o de una consulta, pegada tal cual, con la fecha en que la
corrieron.

La razón es concreta y nos pasó a nosotros: **lo que se transcribe de memoria
sale mal**. El 2026-09-16 encontramos cinco afirmaciones nuestras escritas así
—una de ellas, en el documento que estaba por salir hacia ustedes—, y desde
entonces tenemos un chequeo en la puerta que verifica que lo citable de nuestros
documentos se pueda leer de la fuente. Una captura con fecha vale más que un
resumen bien escrito.

Un «sí», un «no» o un «todavía no lo decidimos» también son respuestas
completas. Lo que no nos sirve es el silencio, porque entonces seguimos
adivinando.

---

## 1 · ¿Corrieron las migraciones en la base compartida?

**URGENTE — es la única que nos bloquea hoy.**

### Qué pasa

Su commit agrega columnas nuevas a tres tablas. Por lo que leímos, corren **solo
si el servicio arranca con `DB_AUTO_MIGRATE=true`**, y ese flag nosotros no lo
tocamos nunca, porque la base es la RDS compartida y no una local.

### Por qué importa

Si las columnas no están, las rutas nuevas **no fallan con un 404 sino con un
500**: la ruta existe, pero la consulta pega contra una columna que no existe.
Para nosotros esos dos errores se ven parecidos desde afuera y significan cosas
opuestas — «todavía no está desplegado» contra «está desplegado y roto».

Mientras no lo sepamos, **no podemos verificar nada del chat contra el servicio
real**. Podemos seguir construyendo, pero a ciegas.

### Qué mirar

Las nueve columnas que agrega `internal/adapters/repository/manual_migrations.go`
en su commit — más un índice único sobre `dd_panel_data`, que no hace falta
comprobar para esto:

| Tabla | Columnas |
|---|---|
| `user_threads` | `panel_id`, `period`, `deleted_at` |
| `agents` | `is_active`, `semantic_views`, `system_prompt_base` |
| `dd_panel_data` | `last_error`, `last_error_at`, `last_success_at` |

Contra la base que usa el servicio desplegado, esto alcanza:

```sql
SELECT table_name, column_name
FROM information_schema.columns
WHERE (table_name = 'user_threads' AND column_name IN ('panel_id','period','deleted_at'))
   OR (table_name = 'agents'       AND column_name IN ('is_active','semantic_views','system_prompt_base'))
ORDER BY table_name, column_name;
```

### Cómo nos sirve

**Péguennos la salida de esa consulta, con la fecha.** Seis filas quiere decir
que están; menos, que faltan.

Y con eso ajustamos así:

- **Si están:** abrimos el chat contra el servicio real y verificamos de verdad.
- **Si no están:** nos quedamos en modo simulado y **no reportamos ningún 500
  como defecto suyo** hasta que se corran. Es lo que queremos evitar: abrirles
  un problema que en realidad es esquema faltante.
- **Si las van a correr:** avísennos cuándo, y esperamos. **No les estamos
  pidiendo que toquen producción** — esa decisión es de ustedes, no nuestra.

---

## 2 · Al chat le falta un dato para poder pintar cifras

### Qué pasa

Cuando el agente devuelve un número, ustedes lo mandan en el evento `data` con
esta forma: `{shape, data, provenance}`. Nosotros lo recibimos y **lo tiramos**.

No es capricho. Para dibujar una cifra, nuestro sistema exige tres datos que ahí
no vienen:

| Nos falta | Qué es | Dónde sí lo mandan |
|---|---|---|
| **la familia** | de qué color se pinta | en el catálogo de métricas |
| **la BASE** | sobre qué se calculó — «48 tiendas sobre 52» | en el panel, como `base` |
| **la capa** | BRONZE / SILVER / GOLD | en el panel, como `layer` |

`provenance` trae `source`, `tool`, `metric_key`, `period` y `sql_available`, que
está muy bien, pero no es lo mismo.

### Por qué importa

Son dos reglas duras del producto, no preferencias nuestras:

- **El color de una cifra lo dicta la métrica, nunca el componente.** Ya tuvimos
  ese defecto: el front tenía la familia cableada a un valor fijo y el color de
  una cifra del chat era, literalmente, inventado.
- **Toda cifra declara su BASE y su procedencia.** Un número sin denominador no
  es auditable.

Podríamos adivinar la familia buscando `metric_key` en el catálogo, y no lo
hicimos a propósito: eso es que el front calcule algo que el backend no dijo, y
es exactamente la clase de cosa que después nadie sabe de dónde salió.

### Qué mirar

`internal/core/services/dd_chat_structured.go` — la función `wrapStructured`, que
es donde se arma el `{shape, data, provenance}`.

### Cómo nos sirve

Lo ideal sería que `provenance` creciera con esos tres campos, o que el evento
`data` los traiga al lado. **Nos da igual el nombre** — díganlo ustedes y
nosotros lo adoptamos, como hicimos con `measurement_window`.

- **Si lo van a agregar:** avísennos **el nombre exacto de los campos** y con eso
  destrabamos la tarea F3.6, que está esperando justo esto. El cambio de nuestro
  lado es chico: el evento ya llega y ya se lee, y hay una prueba que deja
  escrito cuáles son los tres campos que faltan y por qué lo descartamos.
- **Si no lo van a agregar pronto:** también sirve saberlo. Dejamos el chat
  contestando en prosa y con el SQL a la vista, que es útil igual, y sacamos F3.6
  de la lista de «casi».

---

## 3 · Cuando el chat se corta, ¿lo que ya se escribió sigue sirviendo?

### Qué pasa

El evento `error` manda `{code, message}`. No dice si lo que el usuario ya vio en
pantalla se conserva o se borra.

Nosotros **tuvimos que decidirlo**, y decidimos conservarlo cuando ya había
llegado texto. El argumento es que leímos que el servicio guarda la respuesta
acumulada antes de cerrar, así que lo que se alcanzó a mostrar no se pierde.

### Por qué importa

Es lo único de este arreglo que decidimos por nuestra cuenta, y queremos que
quede dicho y no escondido. Con streaming no alcanza con reintentar: si el
usuario ve media respuesta y un error, alguien tiene que decir si esa media
respuesta vale o si hay que limpiarla.

### Qué mirar

La función `pump` en `internal/core/services/dd_chat_service.go`, donde se
emiten el `error` y el `done`.

### Cómo nos sirve

Basta una frase: **¿lo que ya llegó se conserva o se descarta?**

- **Si coincide con lo que supusimos** («se conserva»), nos quedamos como
  estamos y dejamos anotado que ustedes lo confirmaron.
- **Si es al revés**, lo cambiamos en una línea.
- **Si prefieren que viaje en el evento** —un campo más en el `error`, con el
  nombre que quieran— mejor todavía: borramos nuestra suposición y lo leemos de
  ahí, que es donde tiene que estar.

---

## 4 · El id del hilo · un entero y un uuid, y nos llevamos solo uno

### Qué pasa

La primera trama del stream, `thread_info`, trae tres ids:

```json
{ "thread_id": 41, "parent_message_id": 7, "user_thread_id": "…uuid…" }
```

Nuestro formato interno tiene **un solo campo** para el id del hilo. Nos
quedamos con `thread_id`, porque es el que hay que devolver para seguir la
conversación. **`user_thread_id` lo perdemos**, y es justo el que hace falta para
pedir el historial de un hilo.

### Por qué importa

No nos bloquea hoy — el historial es una pantalla que todavía no construimos
(F3.7). Lo decimos ahora porque el día que la construyamos vamos a necesitar los
dos ids, y es más barato saberlo hoy que descubrirlo entonces.

Hay además un detalle menor de nuestro lado: nuestro contrato declara ese id como
un uuid y el de ustedes es un entero. **Es error nuestro**, lo vamos a corregir.
Lo mencionamos solo para que no les sorprenda si ven el cambio.

### Qué mirar

Nada, salvo que quieran confirmarlo: los tres ids salen de `pump`, en
`internal/core/services/dd_chat_service.go`.

### Cómo nos sirve

Una confirmación de que entendimos bien:

- **`thread_id` (entero)** es el que se manda de vuelta para continuar la
  conversación.
- **`user_thread_id` (uuid)** es el que identifica el hilo para pedir sus
  mensajes.

**Si es así, no hay nada que hacer de su lado** — lo resolvemos nosotros cuando
toque F3.7. Si nos equivocamos, corríjannos, porque estamos por construir encima
de eso.

---

## Resumen

| | Qué pedimos | Qué destraba | Urgencia |
|---|---|---|---|
| **1** | La salida de una consulta SQL | Poder **verificar** el chat contra el servicio | **Alta** · es la única que bloquea |
| **2** | Familia, BASE y capa junto a la cifra | F3.6 · que el chat pinte cifras, no solo prosa | Media |
| **3** | Una frase, o un campo en el evento | Borrar una suposición nuestra del código | Baja |
| **4** | Una confirmación | F3.7 · el historial de hilos | Baja |

**Gracias por el commit.** El chat contextual es la pieza que nos faltaba para
cerrar la Fase 3, y la forma del contexto de panel que eligieron —el panel y el
período, y el resto lo arma el servicio— nos simplificó el trabajo en lugar de
complicarlo.
