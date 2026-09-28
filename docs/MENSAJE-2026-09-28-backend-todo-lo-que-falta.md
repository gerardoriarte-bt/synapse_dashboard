# Para el equipo de backend · todo lo que falta, auditado de punta a punta · 2026-09-28 (noche)

> Auditamos el plan entero para asegurarnos de que **`docs/PARA-BACKEND.md` los
> tenga a todos**. No los tenía, y al revisar aparecieron huecos en las dos
> direcciones: faltaban pedidos que sólo vivían en documentos, **y sobraban cinco
> que ya no eran ciertos**.
>
> **Validamos LOS ONCE contra su repositorio en `f70cec2` antes de mandar nada.**
> Ninguno de los que quedan sale de una transcripción nuestra: cada uno dice cómo
> se comprobó. Los cinco retirados van explicados, porque el error es nuestro y
> es instructivo.

## El saldo, en una línea

| | |
|---|---|
| Pedidos que el archivo generado mostraba | **8** |
| Los que faltaban, escritos sólo en mensajes | **+7** |
| **Los que se cayeron al validarlos contra su código** | **−5** |
| **Vigentes, cada uno con su verificación** | **11** |

## Por qué siete pedidos no les llegaban

`PARA-BACKEND.md` se genera del plan leyendo un marcador: `**Espera del
backend.**`. Y **once tareas tenían su bloqueo escrito de otra forma** —un `🔒` en
el título—, que el generador parseaba **y tiraba**.

De esas once, cuatro eran pedidos suyos que sólo vivían en mensajes sueltos. Los
otros tres salieron de auditar lo que medimos esta semana y nunca se convirtió en
tarea.

**Arreglado en la herramienta, no a mano:** ahora `PARA-BACKEND.md` trae al final
una sección **«Y esto frena al front»** con los once candados, tal cual los
escribimos. **No decidimos cuáles son suyos** — adivinarlo es un juicio y una
herramienta que juzga se equivoca en silencio. Están listados para que lo
descarten ustedes, que es más barato que se nos pase.

## Los cuatro que no veían, y tres que no existían

### Los cuatro que sí se sostienen

| | Qué | Cómo se verificó |
|---|---|---|
| **B4.18** | **`roles.tab_keys`** · lo propusieron ustedes y dijimos que sí el mismo día | `grep tab_keys` en `internal/` → **cero** |
| **B2.15** | **Encender `DD_MATERIALIZE_PROSE_ENABLED` y avisar** · lo ofrecieron ustedes | El flag existe y su default es `false` · `dd_materializer_service.go:57` |
| **B2.14** | **`/config/solicitudes`** · y el payload de `FORBIDDEN` | La ruta da **404**; el payload es `{status, request_from}` **y nada más**, medido con el token de `planner` |
| **B1.32** | **Si `day` y `month` son todos los valores de `cut`** | Ver abajo · el pedido se achicó leyendo su código |

**B2.14 son dos cosas y conviene no mezclarlas:** que `FORBIDDEN` traiga `reason` y
`unlocks_with` como los otros cinco estados, y que exista dónde pedir el acceso.
**Si deciden que no va a haber ruta de solicitud, eso también cierra la tarea** —
con el estado declarado y sin CTA, porque un botón que devuelve 404 es peor que su
ausencia.

**B1.32 se achicó solo.** Íbamos a preguntar qué significa `cut`; leyendo su
código quedó casi contestado: su semilla trae `{"cut": "day"}` y `{"cut":
"month"}` —`dd_seed.go:113`—, `dd_seed_blocks.go:44` lo declara como
`layout_param` de `series` junto a `normalization`, y **nadie lo lee**: no hay un
consumidor de ninguno de los dos en `internal/core/`. Así que la pregunta que
queda es chica: **¿son sólo esos dos valores, y confirman que lo aplica el
front?** Bloquea un defecto visible — el orden de una tabla se anuncia y no se
aplica.

### LOS CINCO QUE RETIRAMOS ANTES DE MANDARLOS

Los habíamos escrito desde documentos NUESTROS. Al validarlos contra su
repositorio **no se sostuvieron**, y preferimos decirlo a que lo descubran
ustedes:

**`presentation` del materializador.** Nuestro mensaje del 2026-09-24 decía que no
la emitía y que al correr pisaba la de la semilla. **Era cierto ese día y dejó de
serlo**: `materialize/presentation.go` define `PresentationFromRows`,
`transform.go:31` la calcula y `dd_materializer_service.go:412` la escribe **sólo
cuando no viene vacía**, que era justo la otra mitad del pedido. Medido en el
batch: **los seis paneles `scalar` traen `presentation`** con medidor y
comparativos.

**La compuerta de `resolveLayout`.** Una nota nuestra del 2026-09-25 decía que
`168a761` rompía el preview por rol usando `!isAdminRoleName(role.Name)`. **Su
código dice `sel.CallerRole`** —`dd_config_service.go:498`—, que es exactamente la
distinción que decíamos que faltaba. Medido el caso exacto: previsualizar un
**borrador** con lente `planner` contesta **200** con `status: draft`.

**El patrón de `PeriodoId`.** Íbamos a preguntarlo; `period.go` lo contesta
—`expected YYYY-MM`— y sus ayudantes son por mes. No era un pedido: era algo que
no habíamos leído.

**Y DOS MÁS que ya estaban en el archivo desde antes**, y que nadie había vuelto
a mirar:

**`GET /config/me` · «llegaron dos de seis».** De los seis que pedía, **cuatro
llegaron y dos los retiramos nosotros** —`role.puedeAprobar` y
`user.capabilities`, porque no los consume nadie—. Los dos últimos, `tenant.label`
y la `key` de la pestaña, **llegaron en `f70cec2`**, o sea el mismo día que
escribimos que faltaban. Medido: los dos presentes. **Cerrada.**

Y su propio texto se contradecía: la tabla del final decía ✅ desde el 26 mientras
la prosa de arriba seguía listando los dos bullets como incumplidos. **Quien la
lee rápido lee la prosa.**

**La prosa por agente de B2.12** decía «hoy no hay camino». **Lo construyeron**:
`dd_prose_generator.go` implementa `DDProseGenerator`, `bootstrap/app.go:155` lo
cablea al materializador —«Fase 6: prosa por agente»— y queda detrás de
`DD_MATERIALIZE_PROSE_ENABLED`, cuyo default es `false`. **Así que ese pedido se
reduce a encender el flag**, que es B2.15.

**Por qué lo contamos.** El 2026-09-25 les mandamos un mensaje equivocado por
citar una transcripción nuestra como si fuera una medición. **Estos cinco eran lo
mismo otra vez**, y lo que los atajó fue una sola pregunta de nuestro lado: «¿lo
validaste contra el repositorio?». Los cinco quedan en nuestro plan cerrados con
la medición que los retiró, no borrados — así nadie los vuelve a escribir dentro
de un mes.

## Lo que ya sabían, y sigue

`PARA-BACKEND.md` los trae con su detalle. En corto:

| | |
|---|---|
| **B0.4** | El `error` en español · **queda UNA ruta, y ahora son dos**: `/config/chat` y `POST /admin/agents`. `POST /admin/tenants` **sí** está traducida, que es la prueba de que el traductor anda |
| **B1.1** | `/config/me` · dos de seis campos |
| **B1.21** | `GET /config/plots` con la tabla de 49 · **les pasamos los tres archivos** el 2026-09-28 |
| **B1.28** | `PayloadDegradado` no dice desde qué punto el dato está vencido |
| **B1.29 · B1.30 · B1.31** | Los tres del alta de un cliente · `schema-check`, `sync-catalog` como ruta y el par RSA |
| **B2.12** | Los seis estados · **cinco medidos**; `ERROR` quedó sin disparador conocido y es una pregunta |

## Lo que cerramos esta semana, para que no lo trabajen de nuevo

**B4.2 quedó ✅ el 2026-09-28**, y su tercio faltante lo cerramos nosotros
midiendo, no pidiendo. **Su explicación del `[]` era correcta** —la semilla
escribe `dd_layout_versions` sin pasar por `publish`—, así que publicamos sobre un
dashboard vacío y salió todo:

| `action` | `diff.summary` |
|---|---|
| `publish` | `tabs_added 1 · panels_added 1` |
| `publish` | `tabs_added 1 · panels_added 1 · panels_changed 3` |
| `rollback` | `tabs_removed 1 · panels_removed 1 · panels_changed 3` |

Con `actor_user_id` y `actor_role` en las tres, y **`revert` contestó 200** — el
único de sus tres códigos que nunca habíamos medido. **Los cuatro de §7.2 están.**

**Dos detalles de forma**, por si les sirven para documentarla: `tabs_added` trae
la **`key`** de la pestaña y no su id —consistente con `tab_keys`—, y las
colecciones vacías del diff vuelven como **`null`, no `[]`**, distinto de lo que
su documento del 28 dibujaba.

**Y `B4.9` también está**: `GET /admin/layouts/{layoutId}/preview` contesta 200 con
los paneles filtrados por rol. Nuestra nota decía que seguía en 404 y llevaba días
sin ser cierto.

## Lo que NO les pedimos, y por qué

- **Las cuatro formas que faltan** —`categoricaComparada`, `matriz`, `grafo`,
  `flujo`— **no son suyas**: `transform.go` las sabe transformar desde `75b8ecc`.
  Lo que falta es que **exista una métrica de esas formas**, y eso es de datos.
- **`/config/decisiones`** no se pide: es C4, y el producto todavía no decidió si
  esa pantalla entra.
- **El `MetricRegistry` como dato** —nuestra `B1.26`— sigue abierto de nuestro
  lado, y **`B1.29` lo vuelve menos urgente**: con `claves_sin_query` se cierra el
  silencio que lo hacía doler.

## Cómo avisar

**No hace falta tocar `PARA-BACKEND.md`.** Con decirlo alcanza: quitamos el
marcador de la tarea y el documento se regenera sin ese punto. **Si un pedido
sigue ahí, es que sigue faltando.**
