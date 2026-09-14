# Lo que el front necesita del backend

> **GENERADO.** Sale de `plan-de-trabajo.md` con `npm run plan` y se pisa
> entero en cada corrida — editarlo a mano es trabajo que se pierde. Lo que
> se pide vive **en la tarea que lo espera**, así que una tarea que se
> desbloquea saca su pedido de acá sola.


Cada punto dice **qué falta y por qué bloquea**, con el identificador de la
tarea que está esperando. Los identificadores son los de
`tareas-front-back.md`, el **ancestro común de los dos planes** — verificado
en cada corrida de la puerta con `npm run plan:ancestro`.


---

## Lo que ya está de nuestro lado

No hace falta que esperen nada de estas para probar: están en `main` del
front, con prueba y con la puerta en verde.

- **F1.32** · Transcribir el cable de consola a un contrato versionado
- **F1.33** · api/adapt.ts · contexto, catálogo, bloques y pestaña
- **F1.34** · api/adapt.ts · payload, valor y presentación
- **F1.36** · client.ts contra las rutas, los cuerpos y el error de este servicio
- **F1.37** · Una sola base de API
- **F1.40** · Presentacion llega al cuerpo · hoy está declarada y nadie la pasa

---

## Lo que esperamos · 16 pedido(s)


### B0.4 · Middleware de auth y envelope

*Estado de la tarea: pendiente.*


**El envelope de error estructurado de §4.1.** Hoy `error` es una cadena, así que el front no puede distinguir «error de campo» de «regla de negocio» de «fallo técnico». La propuesta está en el yaml desde el 2026-09-03 y es barata: `FAMILIA_DETALLE`, con la familia como prefijo hasta el primer `_`. **El front solo necesita el prefijo**, nunca la lista completa, así que pueden agregar códigos sin que nos desincronicemos.


### B0.6 · Extender el contrato con admin y builder

*Estado de la tarea: pendiente.*


**Cerrar su B0.7: declarar `/config/*` y `/admin/layouts/*` en el OpenAPI que el binario ya embebe.** Mientras no esté, el front mantiene `contracts/synapse-console-wire.yaml`, que es una **transcripción nuestra leyendo structs de Go** — y eso ya costó un error con el servicio de acceso. Con el spec emitido, ese archivo se reemplaza por el suyo y `console-drift` lo verifica solo.


### B1.1 · GET /config/me

*Estado de la tarea: pendiente.*


**`theme` en la respuesta.** El campo existe en `users`, la migración lo creó y `PUT /config/me/preferences` ya lo escribe — pero `/config/me` no lo devuelve, así que **la preferencia se guarda y no se puede leer**. El front la necesita antes del primer pixel: leerla en una segunda llamada haría que la consola pinte oscura y cambie a clara a la vista del usuario. Y falta el resto del contexto: `alcance`, `tenant.etiqueta` y `vertical`, `role.puedeAprobar`, `user.capabilities`, y en la pestaña `key`, `icon` y `chat_suggestions`.


### B1.6 · POST /config/panels:batch

*Estado de la tarea: pendiente.*


**`unlocks_with` en `BLOCKED`** —hoy llega vacío; el servicio solo lo escribe al derivar `DEGRADED`, y §8 pide estado, razón **y qué lo desbloquea**— y **`request_from` real** en `FORBIDDEN`, que hoy es la constante `"administrator"` escrita en el código y no el rol que decide sobre la métrica.


### B1.13 · Presentacion opcional

*Estado de la tarea: pendiente.*


**`presentation` para las formas que no son escalares.** `PresentationFromRows` devuelve `nil` para siete de las nueve, así que un panel de barras, de tabla o de serie llega **sin rótulo** — y «ningún número desnudo» es regla dura. Falta también la `nota` de panel, distinta de la `note` que va dentro del `meter`. Verificado: de doce payloads, solo los seis escalares traen `presentation`.


### B1.14 · Transformar a las formas de Valor

*Estado de la tarea: pendiente.*


**`decimals` y `unit` por columna en `tabular`.** Sin `decimals` una columna de ROAS sale «4.2 · 4.5 · 3.5 · 3»: cada celda está bien y la columna se lee mal porque la coma deja de alinearse. Y las siete formas que faltan —`distribution`, `series_with_band`, `compared_categorical`, `multi_attribute_profile`, `matrix`, `graph`, `flow`— **no son urgentes**: entran cuando exista una métrica que las use, y el front tampoco tiene sus cuerpos.


### B1.15 · Validar reglas mínimas por forma antes de enviar

*Estado de la tarea: pendiente.*


**`percentage` siempre en `composition`**, y la banda completa en `scalar_with_interval`. Hoy el porcentaje solo sale si venía en la fila, y el front **no lo puede calcular**: el contrato dice por qué —la suma tiene que dar 100 y redondear en el cliente da columnas que suman 99,9—. Sin él, el panel entra en `ERROR`.


### B1.16 · Seed de demo: 1 tenant, 1 layout, 1 pestaña, 4–6 paneles

*Estado de la tarea: pendiente.*


**La métrica «Brand Momentum»**, que esta tarea pide por nombre y el seed no incluye. Si el requisito quedó viejo, conviene sacarlo de `tareas-front-back.md` —que es de los dos equipos—: mientras esté escrito, el próximo que lea la tarea la va a dar por incompleta.


### B1.21 · Declarar los mínimos de datos por gráfico

*Estado de la tarea: pendiente.*


**La ruta `/config/plots` y el repertorio de gráficos con sus mínimos.** Bloquea F1.31 y F4.21: sin ella el builder no puede ofrecer gráficos filtrados por la forma de la métrica, y la consola no puede decir «este corte necesita al menos tres categorías; llegaron dos».


### B1.17 · Modelo Metrica

*Estado de la tarea: pendiente.*


**`window` en el catálogo** — una columna de texto hermana de `base`, redactada («Venta media de los últimos treinta días»). Es lo único de esta lista que **se ve en pantalla**: el shell pinta `Base · {base} · {window}` en los doce paneles y en los siete estados, y sin él la línea queda `Base · COMPLETED · MONTH ·` con el separador colgando. No se puede derivar del período — dos métricas con el mismo `2026-09` pueden tener ventanas distintas. Verificado el 2026-09-14 contra el servicio.


### B1.18 · Sincronizar el catálogo con las semantic views de Snowflake

*Estado de la tarea: pendiente.*


**La vista `SYNAPSE_METRIC_CATALOG`**, que no existe en ninguna base de la cuenta —verificado con `SHOW OBJECTS`, cero filas—, así que `make sync-catalog` falla. El SQL está escrito y listo para revisar en `docs/snowflake/SYNAPSE_METRIC_CATALOG.sql`, con los pasos en `INSTRUCCION-ALTA-TENANT.md`. **Nosotros no corremos nada en Snowflake.**


### B1.19 · Filtrar el catálogo por permisos de rol

*Estado de la tarea: pendiente.*


**Un usuario de prueba con un rol restringido.** El mecanismo está en el código, pero con el usuario que tenemos —rol `Planner`— el catálogo devuelve las doce métricas, incluidas `executive_summary`, `roas` y `decisions`, que su propio documento dice que `planner` oculta. No decimos que esté roto: no se puede comprobar. Con un usuario así se cierran las dos mitades en un minuto — el catálogo recortado y un panel en `FORBIDDEN`.


### B3.1 · POST /config/chat con SSE

*Estado de la tarea: pendiente.*


**`POST /config/chat` con `ContextoDePanel`.** Es la transversal T4 y bloquea F3.2, F3.3, F3.6 y la mitad de F3.7. El chat que el servicio sí tiene es **otro producto** —decidido el 2026-09-08—: el nuestro es el chat contextual del panel, se abre desde un panel y lleva su métrica.


### B4.8 · CRUD de roles por tenant

*Estado de la tarea: pendiente.*


**CRUD de roles por tenant** —`tab_ids[]`, `hidden_metric_ids[]`, `layout_overrides`—. Bloquea F4.3, que es la gestión de usuarios y roles de la superficie de admin.


### B4.9 · Preview por rol

*Estado de la tarea: pendiente.*


**El preview por rol.** Bloquea F4.12, y su criterio dice por qué no se puede resolver del lado del cliente: filtrar en el front lo que ya se tiene probaría el filtro del front, que no existe — el filtrado es del servidor.


### B5.1 · Varios layouts por tenant

*Estado de la tarea: pendiente.*


**La lista de layouts que el usuario puede ver, en `/config/me`.** `GET /config/tabs/:tabId?layoutId=` ya funciona, pero no hay forma de saber qué layouts le tocan a alguien, así que el selector de F5.1 no se puede construir: no se ofrece una elección que no se sabe si existe.


---

## Cómo avisar que algo llegó

No hace falta tocar este archivo. Con decirlo alcanza: el front quita el
marcador de la tarea, la desbloquea y este documento se regenera sin ese
punto. **Si un pedido sigue acá, es que sigue faltando.**

