# Para el equipo de backend · quedan cinco · 2026-09-28

> Contesta su `RESPUESTA-2026-09-28-doce-pedidos.md`.
>
> **Todo lo de acá se midió llamando a las rutas contra `5924bf2b`.** Tuvimos que
> construir y levantar su commit: el binario que teníamos era del 26 y daba ✗ en
> los siete campos. Y no usamos `/docs/openapi.yaml` para verificar —está
> `//go:embed`-ido desde un archivo que ustedes mantienen a mano, así que leerlo
> sería volver a leer su propia transcripción—.
>
> **Se cerraron ocho pedidos y quedan cinco.** Dos de los que quedaban los
> retiramos nosotros, y uno de ustedes lo damos por entregado sin haberlo podido
> ver — abajo se dice cuál y por qué.

## Confirmado, midiendo

| | Qué se midió |
|---|---|
| **B4.9** | Preview con `tabs[].panels[]` · lente `admin` **12 paneles**, lente `planner` **9 con `col_span` 4** · el override aplicado |
| **B4.4** | `tab.icon` y `tab.chat_suggestions` en `/config/tabs/{id}` · y la lista **nunca `null`** |
| **B1.13** | Los nueve paneles del planner traen `note` |
| **B0.4** | `code` en cuatro familias: `AUTH_UNAUTHORIZED`, `NOT_FOUND_RESOURCE`, `AUTH_FORBIDDEN`, `VALIDATION_REQUEST` |
| **B1.1** | `period_grain`, `periods_detail` con `[start, end)`, y `scope` |
| **B4.2** | Las dos compuertas del revert: `409 CONFLICT_NO_PREVIOUS` y `409 CONFLICT_REVERT_SELF` |

**Sus dos respuestas también se cierran:** `request_from` constante (B1.6) queda
confirmado, y lo de `cut` (F1.44) también — con el renombre a `horizon_cut` la
ambigüedad desaparece, y `series.cut` como granularidad declarada es lo que
esperábamos.

**B1.16 lo damos por cerrado** con el retiro en su documento.

**Y B3.11 sale de la lista**: si las migraciones las corre el equipo de
despliegue, no es un pedido ni nuestro ni suyo. Lo sacamos de `PARA-BACKEND.md`.

## Lo que retiramos NOSOTROS, y por qué conviene saberlo

Revisamos cada pedido contra quién lo consume antes de reenviarlo. **Tres no los
consume nadie**, así que pedirlos les haría escribir campos que nadie llena:

- **`role.puedeAprobar`** · el adaptador lo fija en `false` y ninguna pantalla lo
  lee. La compuerta real de una acción sobre un panel es `payload.acciones`, que
  ya funciona.
- **`user.capabilities`** · ningún consumidor, hoy ni previsto.
- **`tenant.vertical`** · retirado el 2026-09-26 y lo repetimos porque es el más
  fácil de reponer por error: §3.5 declara `vertical` **y** `plantillaOrigen`, y
  esa cascada no existe de ninguno de los dos lados. Sin la plantilla, la columna
  es un campo que nadie llena.

**Y F1.42 se cierra con lo que ya mandaron.** Pedíamos «que cada período declare
su cobertura»; `periods_detail` la da. El `.pen` dibuja `1 – 31 JUL 2026`, que es
exactamente `[start, end)`, y el `MTD CERRADO` de al lado sale de comparar contra
`open_period`. No hace falta nada más.

---

## Los cinco que quedan

### 1 · El `error` no está en español, y llega a la pantalla

**Es el único de los cinco que se ve.**

Su respuesta dice: «`error` sigue siendo el mensaje en español de siempre».
Medido contra `5924bf2b`:

```
404  "tab not found"
400  "invalid request: Key: 'updatePreferencesRequest.Theme' Error:Field
      validation for 'Theme' failed on the 'oneof' tag"
```

**Esto se pinta tal cual.** Nuestro cliente pasa `error` sin tocarlo —redactar el
error del servidor sin saber qué pasó sería el front inventando— y el estado de
error lo muestra como la frase del panel. O sea que un usuario puede ver el
nombre de un struct de Go y el tag de un validador.

**No es una política suya, son handlers sueltos**, y por eso lo creemos barato:
los errores del revert salen redactados y en español —«el layout no tiene una
versión anterior a la que volver; indique to_layout_id»—. Lo que falta es que el
400 genérico no devuelva el `err.Error()` del validador.

**No lo traducimos de nuestro lado**: el dueño del copy es quien lo emite, y una
tabla de traducción en el front se desincroniza en el primer cambio.

### 2 · `grafico` en el panel · el pedido nuevo, y es el que más destraba

**Un panel no puede decir QUÉ GRÁFICO quiere.** `type` nombra familias de forma
—`bars`, `series`, `composition`— y §5 de nuestro diseño mapea **49 gráficos**
sobre esas formas: `composition` acepta siete, y hoy sólo se puede dibujar uno.

Pedimos un campo **opcional** en el panel del layout:

```
panels[].chart: string   // "waterfall", "control", "stackarea", …
```

- **Opcional, y ausente = el de siempre.** Los doce paneles publicados no lo
  declaran y no hay que migrar ninguno.
- **Va junto a `type`, no en su lugar**, y eso lo decidió una medición: **16 de
  los 49 gráficos sirven a más de una forma** —`donut` a `categorica` y a
  `composicion`, `network` a `flujo` y a `grafo`—, así que el gráfico solo no
  alcanza para saber qué objeto leer.
- **Se escribe desde el builder** con el resto del layout.

Nuestro contrato ya lo declara y tres variantes están construidas contra él
—`control`, `interval` y `stackarea`—, así que **el día que el campo viaje se ven
sin tocar una línea**.

### 3 · `tenant.etiqueta` y la `key` de la pestaña · lo que queda de B1.1

De los seis, llegaron tres y retiramos dos. Quedan dos, y **la segunda contesta
una pregunta que ustedes hicieron**:

- **`tenant.etiqueta`** · la forma corta para el navbar. El `.pen` pinta `UA MX`
  donde hoy mostramos `Under Armour México`, porque caemos a `name`. Se ve.
- **La `key` de la pestaña** · **es lo mismo que su `slug`**, y es la respuesta a
  lo que nos avisaron sobre `roles.tab_ids`. Ver abajo.

### 4 · «Qué cambió» en el historial de versiones · B4.2

**La reversión llegó y la damos por entregada** aunque no la hayamos visto
correr: medimos sus dos compuertas y el `200` no, porque copia y publica y
cambiaría el layout que la consola está sirviendo. Lo decimos para que sepan
exactamente qué verificamos.

**Lo que falta es el diff.** §7.2 pide del historial «quién, cuándo, qué cambió.
Permite revertir». Medido: `LayoutVersion` trae `created_at`, `dashboard_id`,
`id`, `published_at`, `status`, `tenant_id`, `updated_at` y `version_id` — o sea
**cuándo**, y nada más.

- **Quién** · dicen que está en `/admin/layouts/{id}/publications` con su actor.
  **No lo pudimos ver**: la ruta responde `200` con `[]`, porque la semilla
  publicó sin pasar por ahí. Queda pendiente de verificar, no de pedir.
- **Qué cambió** · no existe. No hace falta un diff estructural: alcanza con qué
  pestañas y qué paneles se agregaron, se quitaron o se movieron contra la
  versión anterior. Es lo que B6 dibuja y no se puede construir sin esto.

### 5 · Cuándo se prende `DD_MATERIALIZE_PROSE_ENABLED` · B2.12

Con el flag en `false` los dos paneles de prosa siguen sirviendo el valor de la
semilla — el «4.28M» que reportamos. **No es un pedido de código: es saber
cuándo**, para dejar de mirar un número que no se mueve y para poder cerrar la
tarea contra dato real.

---

## Lo que les debíamos: B1.21 está entregado

**Los mínimos por gráfico están decididos**, y con ellos el repertorio entero:
`docs/REPERTORIO-2026-09-28-los-49-graficos.md` — 49 filas con su `id`, su
nombre, las formas que acepta, si soporta banda, su mínimo **por forma** y su
tope. De dónde sale cada columna está en la cabecera.

**Y el esquema quedó con un campo más de lo que habíamos propuesto.** Al llenar
la tabla apareció que **nueve gráficos sirven a dos formas con mínimos distintos
sobre la misma variable** —`bars` pide `items < 2` como `categorica` y
`items < 3` como `ranking`—, así que cada mínimo declara a qué forma aplica. Sin
eso el consumidor ve dos `items < N` y no puede elegir.

`GET /config/plots` con la misma figura que `/config/blocks`, como propusieron.

## Su pregunta sobre `roles.tab_ids` · sí, y ya la teníamos pedida

Tienen razón en el problema: si `tab_ids` guarda ids de fila y las filas se
recrean en cada versión, **la primera publicación real desde el builder deja sin
pestañas a todo rol con restricción**. Lo confirmamos leyendo la semilla.

**Y la salida que proponen —identidad de pestaña por `slug` dentro del
dashboard— es exactamente la `key` que pedimos en B1.1**, desde antes de que
esto apareciera. Es el mismo campo contestando dos problemas:

- Un rol restringido sobrevive a una publicación.
- Y el front puede referirse a una pestaña sin depender de un uuid que cambia.

**Preferimos eso antes que resolverlo en la consola de roles.** «Ofrecer asignar
las pestañas de la versión nueva» después de publicar es una pantalla que hay que
construir, que alguien tiene que acordarse de usar, y que no ayuda a quien
publique por API. Con `key`/`slug` el problema no existe.

**Si van por ahí, avisen**: cambia cómo guardamos la restricción de rol y
preferimos hacerlo en el mismo movimiento.
