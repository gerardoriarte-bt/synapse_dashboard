# Para el equipo de backend · cinco cosas, ordenadas por lo que destraban · 2026-10-01

> **Histórico.** Un mensaje mandado, con fecha: qué se pidió y con qué evidencia.
> No se actualiza.

Hola. **Se nos juntaron cinco mensajes en tres días y mandarlos de a uno era
peor**, así que van juntos y ordenados por lo que destraban. Cada uno tiene su
documento con el detalle; acá va lo que hace falta para decidir.

**Dos de los cinco no les piden código**: uno es una pregunta y otro es una
entrega.

---

## 1 · ¿Hay un Synapse desplegado? · **la que decide todo lo demás**

**Lleva tres días preguntada y es la única que no podemos contestar desde acá.**
Todo lo que verificamos esta semana —la consola, el chat contra Cortex, los
dieciséis gráficos, el drill-down, el historial de publicaciones— vale contra un
binario que **levantamos nosotros** en `:4010` desde un clone de su repositorio.

Tres preguntas, en este orden:

1. **¿Existe un servicio corriendo en algún AWS?** Si no existe, el front no
   tiene a dónde apuntar y lo demás es teórico.
2. **¿En qué commit está?** Si no es `de881e1`, nada de lo medido esta semana
   vale ahí: corremos `npm run humo` contra ése, que es exactamente para lo que
   existe.
3. **¿Contra qué base?** La RDS compartida dejó de respondernos el 22, y
   `DB_AUTO_MIGRATE=true` sigue prohibido contra una base compartida.

**Y una entrega, que no es una pregunta**: el front ya tiene su `Dockerfile`, su
`nginx.conf.template` y su `.dockerignore`, construidos y probados — 77,3 MB, sin
Node en la imagen final. `try_files` se comprobó **rompiéndolo**: sin él `/` sigue
dando 200 y `/admin` da 404, que es por qué no se nota probando desde el login.

→ `docs/MENSAJE-2026-09-29-backend-el-despliegue.md`

---

## 2 · El tenant de México está registrado en Colombia

`GET /config/me` devuelve, para Under Armour México:

```
locale: es-CO · currency: COP · timezone: America/Bogota
```

**Es un default de columna**, no un dato que alguien cargó. Se vio al encender la
prosa por agente: el resumen ejecutivo escribe «los ingresos alcanzaron **COP**
1.144.876» sobre un cliente mexicano.

**El caro de los tres es el huso**, y por eso lo separamos: el corte del día del
negocio sale del tenant, y uno mexicano cerrando en Bogotá produce cifras
plausibles y no auditables. La moneda se ve mal; el huso se lee bien y está mal.

→ `docs/MENSAJE-2026-09-29-backend-tenant-colombiano.md`

---

## 3 · La última etapa de un flujo muestra el número de la anterior

`transformFlow` calcula el valor de cada etapa desde su flujo **saliente**. Para
un embudo eso corre todas las cifras un lugar:

```
VISITAS ──▶ SESIONES ──▶ ÓRDENES
   ↑ muestra sesiones   ↑ muestra órdenes
```

**Y no falla ruidosamente**: dibuja un embudo prolijo con los números corridos.

**Por qué lo pedimos ahora**: sacamos un panel por esto. Habíamos puesto
`spend_flow` —cada plataforma hacia un nodo «total»— y con dato real son 22
enlaces al mismo destino, que es la suma de los otros 22. Un gráfico de barras
dibujado como sankey. Lo detectó quien lo miró, no una prueba.

**El flujo que sí se entiende es el embudo**, y es el que esta regla traba. No
pedimos una métrica: el dato está en la tabla diaria que ya consultan y la
entrada del registro la escribimos nosotros, como las tres de ayer.

→ `docs/MENSAJE-2026-10-01-backend-la-ultima-etapa-del-flujo.md`

---

## 4 · Cuánto histórico muestra un dashboard debería ser del dashboard

`availablePeriods()` en `dd_config_service.go:690` devuelve **doce meses fijos**,
sin mirar tenant ni dashboard. Producto decidió que la profundidad es una
decisión del admin al crear el dashboard.

Nos sirve cualquiera de las dos formas —`history_months` o `history_from`—, y lo
que importa es el default: **un dashboard sin el campo tiene que seguir dando
doce meses**, porque ninguno de los que existen hoy lo tiene.

**Y esa misma función arrastra el defecto de `AddDate`** que ya está pedido: el
día 29, 30 o 31 un mes aparece dos veces y otro falta —medido: `2026-03` dos
veces y sin `2026-02`—. El arreglo ya existe escrito del lado de ustedes, en
`snowflake/period.go:66`. Si van a tocar esta función, es el momento.

→ `docs/MENSAJE-2026-10-01-backend-profundidad-historica.md`

---

## 5 · Payloads opcionales en el preview por rol

`GET /admin/layouts/{layoutId}/preview` devuelve el layout y no los payloads.
Para «CEO contra Planner» alcanza y está bien.

**Donde no alcanza es en el selector de gráfico**: nuestro repertorio declara un
tope por gráfico —cuántos elementos lo vuelven ilegible— y el dibujo deshabilita
la opción cuando el dato lo excede, con este literal:

```
⊘  Dona                                    composicion
   NO DISPONIBLE · MÁS DE CINCO PARTES, ILEGIBLE EN DONA
```

Saberlo exige el dato, y el builder no lo tiene.

**Y esto lleva adelante una pregunta que ustedes mismos dejaron escrita** en el
criterio de B4.9: «queda escrito si el preview incluye payloads o solo el layout
… decidirlo antes, no durante». Nunca se decidió, y ahora hay una pantalla que
depende de la respuesta. El documento lleva las dos sub-preguntas contestadas de
nuestro lado.

**No es urgente**: mientras tanto el tope se declara como texto.

→ `docs/MENSAJE-2026-09-30-backend-payload-en-el-preview.md`

---

## Dónde quedamos

| | Qué | Quién |
|---|---|---|
| 1 | ¿Hay un servicio desplegado? · y el empaquetado del front | **Ustedes responden** · nosotros ya entregamos |
| 2 | Locale, moneda y huso del tenant | Ustedes |
| 3 | El valor de una etapa de flujo | Ustedes · la entrada del registro la escribimos nosotros |
| 4 | La profundidad histórica por dashboard | Ustedes |
| 5 | Payloads en el preview | Ustedes · no urgente |

**Y gracias por lo de ayer**: aceptaron las dos correcciones e implementaron que
una discrepancia de forma sea `ERROR` y no un `Warn`, midiendo antes de cambiarlo
—una sola discrepancia en todos los tenants, y era suya—. Eso es exactamente lo
que evita que un panel compuesto para una forma reciba otra.
