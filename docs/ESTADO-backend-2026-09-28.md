# Corte del backend · `5924bf2b` medido · 2026-09-28

> **Verificado contra el servicio corriendo**, no contra su documento. Es la
> regla: el estado de una `B*` lo mueve el front y sólo después de medirlo.
>
> Contesta `docs/RESPUESTA-2026-09-28-doce-pedidos.md`.

## Lo primero, porque invalida la medición fácil

**El binario que teníamos en `:4010` era del 26 y no tenía nada de esto.** Su
respuesta dice «verificado contra el servicio corriendo sobre la base local
(tenant **Lobueno**)» — el de ellos, no el nuestro. Leído contra nuestro
`:4010`, **los siete campos nuevos daban ✗**.

Se construyó `5924bf2b` desde `~/Documents/GitHub/synapse-api-go` y se levantó con
la receta de `dev/postgres/README.md`. Binario viejo conservado.

**Y el `/docs/openapi.yaml` NO sirve para medir.** Está `//go:embed`-ido en el
binario desde `internal/adapters/handler/docs/openapi.yaml`: es un archivo que
mantienen a mano, no algo generado del código. Leerlo es volver a leer su
transcripción — la lección del 2026-09-25, «una transcripción que coincide con
una medición no es una segunda fuente». Todo lo de abajo sale de **llamar a las
rutas**.

**Con qué token.** `planner@synapse.local`, que está documentado en
`dev/postgres/README.md` para la base descartable. Alcanza para las rutas de
consola; **las de admin quedaron sin medir**, y se dice cuáles.

## Medido y confirmado

### B1.1 · grano de período y alcance · ✅

`GET /config/me`, valores reales:

```
period_grain    "month"
periods_detail  [{ key: "2026-09", grain: "month", start: "2026-09-01", end: "2026-10-01" }, …]
scope           { kind: "single_tenant", tenants: [{ id: "e65f81ae…", name: "Under Armour México" }] }
```

`[start, end)` como prometieron, y `scope.kind` es `single_tenant` para el
planner — que es lo correcto: no es admin.

### B4.4 · `icon` y `chat_suggestions` · ✅

`GET /config/tabs/{id}` → `tab.icon: ""` y `tab.chat_suggestions: []`.

**Vacíos porque la semilla no los tiene, pero PRESENTES** — y `chat_suggestions`
llega como lista y no como `null`, que es lo que declararon.

### B1.13 · la `nota` del panel · ✅

**Los nueve paneles traen la clave `note`.** Claves medidas: `col_span`,
`col_start`, `id`, `metric_id`, `note`, `options`, `row_span`, `type`.

(Nueve y no doce porque el planner tiene tres métricas ocultas, que es lo
documentado.)

### B0.4 · `code` en todos los errores · ✅ · y con un defecto

Cuatro familias, medidas una por una:

| Caso | HTTP | `code` |
|---|---|---|
| Sin token | 401 | `AUTH_UNAUTHORIZED` |
| Pestaña inexistente | 404 | `NOT_FOUND_RESOURCE` |
| `/admin/tenants` con token de planner | 403 | `AUTH_FORBIDDEN` |
| `theme: "morado"` en preferencias | 400 | `VALIDATION_REQUEST` |

**El `code` funciona. El `error` no.**

## EL HALLAZGO · dos mensajes de error no están en español, y uno filtra el validador

Su respuesta dice: «`error` sigue siendo el mensaje en español de siempre».
**Medido, no lo es:**

```
404  "tab not found"
400  "invalid request: Key: 'updatePreferencesRequest.Theme' Error:Field
      validation for 'Theme' failed on the 'oneof' tag"
```

**Y eso llega a la pantalla tal cual.** `client.ts` pasa `error` sin tocarlo —con
su razón escrita: «redactar el error del servidor sin saber qué pasó sería el
front inventando»— y `ErrorState` lo pinta como `phrase`. O sea que un usuario
puede ver el nombre de un struct de Go y el tag de un validador.

**No es nuestro para arreglar.** El producto habla español y el dueño del copy es
quien lo emite; traducir acá sería una tabla de traducción que nadie mantiene.
**Va como pedido**, y es barato: el 400 genérico necesita un mensaje redactado en
vez del `err.Error()` del validador.

## NO medido, y por qué

| | Por qué |
|---|---|
| **B4.9** · preview con paneles | Ruta de admin · el token de planner da 403. La ruta existe y el esquema declara `panels[]`, pero **eso es su transcripción, no una medición** |
| **B4.2** · revert | Ídem · `POST /admin/layouts/{id}/revert` |
| **B2.12** · prosa por agente | Detrás de `DD_MATERIALIZE_PROSE_ENABLED`, default `false`. Con el flag apagado los dos paneles siguen sirviendo el valor de la semilla — el «4.28M» de siempre |

**Para cerrar las tres hace falta un token de admin.** El de
`gerardo.riarte@buentipo.com` no está documentado en el repositorio, y no se
inventa.

## Lo que nos avisaron, y hay que mirarlo

**`roles.tab_ids` guarda ids de pestaña, y las pestañas son filas de cada versión
de layout.** Al publicar una versión nueva —o al revertir— las pestañas tienen
ids nuevos, así que **un rol con `tab_ids` no vacío deja de ver todas**. Vacío =
todas, así que no afecta a los roles sin restricción.

La semilla deja `admin`, `user` y `planner` apuntando a la pestaña sembrada:
**la primera publicación real desde el builder los deja sin pestañas.**

Es de la consola de roles —ofrecer «asignar pestañas de la versión nueva» después
de publicar— **y no está construido**. Ellos ofrecen resolverlo del lado del
backend con identidad de pestaña por `slug`, y avisan que es un cambio de modelo.
**Conviene decidirlo antes de publicar la primera versión real.**

## Lo que queda de los doce

- **B1.21 · `/config/plots`** · esperan nuestra mitad. **Ya está**:
  `docs/REPERTORIO-2026-09-28-los-49-graficos.md`, escrito el mismo día. Hay que
  avisarles.
- **B3.11 · migraciones en la compartida** · las corre el equipo de despliegue con
  el deploy de este commit. No es de ninguno de los dos.
- **B1.16** · retirado del documento de ellos.
