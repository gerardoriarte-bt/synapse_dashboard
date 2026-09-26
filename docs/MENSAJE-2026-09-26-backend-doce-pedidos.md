# Para el equipo de backend · qué queda, remedido · 2026-09-26

> Contesta su `RESPUESTA-2026-09-25-para-backend.md`. **Todo lo de acá se midió
> contra `8633b10` con el servicio corriendo**, no contra su documento.

## Lo primero: cuatro de nuestros pedidos estaban vencidos

Tenían razón en la premisa. Su respuesta abría diciendo que la mayoría de
nuestras mediciones eran contra `82da946` o `6e595e3`, «anteriores a todo lo de
hoy», y al remedir aparecieron **cuatro pedidos que ya no correspondían y uno que
no hacía falta**. De quince quedaron doce, contando uno nuevo.

Lo decimos primero porque es la tercera vez que nos pasa en tres días, y ya nos
costó un mensaje equivocado el 25.

| Pedido | Qué decía | Qué medimos el 26 |
|---|---|---|
| **F3.15** | que `POST /config/chat` acepte contexto de pestaña, porque `panel_context` era `binding:"required"` | **Hecho en `8da70de`.** Los dos son punteros y el handler exige exactamente uno. Sin ninguno → 400; con los dos → 400; con `tab_context` incompleto el validador nombra `ddChatRequest.TabContext.Period` |
| **B2.12** · una de sus dos mitades | que el materializador produzca `presentation` y deje de pisar la de la semilla | **La produce.** 6 de 12 paneles con `label`, `meter` y `comparative`, con cifras de Snowflake. **Su otra mitad sigue abierta** y está más abajo |
| **B5.1** | la lista de layouts que el usuario ve, en `/config/me` | **Llegó con otro nombre**: `dashboards[]`, `active_dashboard_id`, `active_layout_id` |
| **B3.1** | poder verificar el chat sin las migraciones | Vencido: el chat contesta contra Cortex desde el 24 |
| **B1.19** | un usuario de prueba con rol restringido | **No hacía falta pedirlo** · ver abajo |

### B1.19 lo cerramos nosotros, y es el que más enseña

Pedíamos un usuario con rol restringido porque el filtrado por rol «no se podía
comprobar». Con `POST /admin/tenants/{tenantId}/roles` y `POST /admin/users` ya
servidas, lo creamos:

| | `admin` | `planner` |
|---|---|---|
| `GET /config/catalog` | 18 métricas | **15** · el rol oculta tres |
| `POST /config/panels:batch` | 10 `AVAILABLE` · 2 `DEGRADED` | 9 `AVAILABLE` · **3 `FORBIDDEN`** |

**No estaba roto: nunca lo estuvo, y no se podía saber.** El pedido llevaba
semanas abierto por algo que dependía de nosotros.

### Y `unlocks_with` en `BLOCKED` también estaba hecho

Lo leímos en `dd_materializer_service.go`: al bloquear escribe
`blockedUnlocksWith` y `BatchPanels` lo pasa en **todos** los estados, no sólo al
derivar `DEGRADED`. No lo pudimos medir en vivo porque ningún panel del tenant
llega bloqueado.

---

## Lo que sigue faltando · doce

Ordenado por lo que destraba, no por número.

### Uno · bloquea una pantalla entera

**B4.9 · los paneles de cada pestaña en el preview por rol.** Es nuevo, salió de
medir hoy.

`GET /admin/layouts/{layoutId}/preview?role_id=` devuelve `tabs[]` con `id`,
`name`, `operational_question` y `sort_order`, y nada más. Con eso el preview
contesta **qué pestañas** ve un rol y no **qué paneles**, que es justo lo que
`hidden_metric_ids` recorta y la razón por la que §7.2 pide la pantalla.

**No hay otra ruta que lo dé.** `GET /config/tabs/{tabId}` resuelve el rol desde
el token y no acepta lente, así que un admin no puede pedir una pestaña con los
ojos de otro rol. Dos caminos, el que les quede mejor:

- devolver `tabs[].panels[]` ya filtrados en el preview, reusando `GetTab`
- o aceptar un `role_id` en `GET /config/tabs/{tabId}` bajo la compuerta de admin

**El segundo es lo que su propio comentario ya describe como si existiera**, en
`dd_config_handler.go`: «es lo que hace `GetTab` cuando el admin manda
`?roleId=`». `GetTab` toma el rol sólo del token y descarta ese parámetro.

### Dos · bloquean una tarea cada una

**B1.21 · `/config/plots`** con el repertorio de gráficos y sus mínimos.
**La primera mitad es nuestra y la tenemos pendiente**: decidir cuántos puntos
necesita una serie, cuántas categorías una barra y cuántas partes una composición
para no engañar. Cuando la declaremos, va como dijeron: con la misma figura que
`/config/blocks`.

**B4.4 · `chat_suggestions` e `icon` en la pestaña.** Los dos están en §2 de
`design.md` y en `Pestana` del contrato, y no están en `DDTab` ni en `TabInput`:
no hay dónde escribirlos ni de dónde leerlos. `chat_suggestions` es lo que C3
pinta como chips por pestaña; sin el campo, el chat abre sin sugerencias.

### Tres · se ven en pantalla

**B1.1 · el resto del contexto.** `theme` llegó y lo confirmamos, junto con
`locale`, `currency` y `timezone`, que no habíamos pedido y nos destraban F1.13b.
De lo que queda, **dos se ven**:

- **el `grano` de cada período.** Hoy `periods` son doce cadenas sueltas, así que
  el front sabe que una métrica es mensual pero no si `2026-W32` es una semana.
- **`alcance` con `tenantsDisponibles`**, sin el cual no se puede pintar el
  selector de cliente del navbar.

De acuerdo con que el resto son definiciones de producto; `vertical` va con B4.1
y `icon`/`chat_suggestions` con B4.4, como proponen.

**B1.13 · la `nota` de panel.** Es lo único que queda de esta tarea. El pedido
grande que había —`presentation` para las siete formas no escalares— **lo
retiramos nosotros el 15**: estaba mal, y lo corrigió leer nuestro propio código.

**B0.4 · el envelope de error estructurado.** Hoy `error` es una cadena, así que
el front no distingue error de campo, de regla de negocio, de fallo técnico. La
propuesta está en el yaml desde el 3 y es barata: `FAMILIA_DETALLE`, con la
familia como prefijo hasta el primer `_`. **El front sólo necesita el prefijo**,
nunca la lista completa, así que pueden agregar códigos sin desincronizarnos.

### Cuatro · no bloquean nada hoy, pero envejecen

**B4.2 · la reversión.** De los tres que pedimos —autor, diferencia, reversión—
**llegaron dos**: `DDLayoutPublication` trae `action`, `actor_user_id`,
`actor_role`, `previous_layout_id`, `diff` y `created_at`, que es «quién, cuándo,
qué cambió». Falta revertir, que no tiene ruta. `previous_layout_id` da con qué
hacerlo y publicar el anterior sería el camino, pero eso es una decisión suya.

**B2.12 · los paneles de prosa.** `executive_summary` y `decisions` no son
métricas sino interpretación, así que no se curan en Snowflake y **es el
materializador quien tendría que llamar al agente**. Hoy no hay camino: los dos
paneles se sirven con el valor viejo de la semilla, y por eso el resumen dice
«4.28M» mientras las cifras de al lado cambian todas.

**B1.16 · la métrica «Brand Momentum»**, que `tareas-front-back.md` pide por
nombre y el seed no incluye —confirmado, no está entre las 18—. **Si el requisito
quedó viejo, conviene sacarlo de ahí**, que es un archivo de los dos equipos:
mientras esté escrito, el próximo que lea la tarea la va a dar por incompleta.

**B3.11 · las migraciones sobre la base compartida.** Sigue en pie **sólo para la
compartida**: en local corren solas con `DB_AUTO_MIGRATE=true`, y ya no es lo que
frena el chat.

### Y dos preguntas, que no son pedidos

**B1.6 · ¿`request_from` constante es la decisión?** Vale `"admin"` —era
`"administrator"` cuando lo pedimos— y sigue siendo `forbiddenRequestFrom` en el
código, pero el comentario de al lado dice que es a propósito: «el rol que decide
sobre la visibilidad de la métrica». Si es eso, lo cerramos y lo anotamos.

**F1.44 · ¿qué significa `cut` en un panel `series`?** El cable lo declara en
`layout_params` de `series` y de `forecast`, y el layout sembrado manda
`{"cut": "day"}` y `{"cut": "month"}`. En `forecast` es el punto donde termina lo
observado y empieza la proyección —un índice— y así lo lee el front; en `series`
parece granularidad, que es otra cosa con el mismo nombre. **Y el dato no permite
deducirlo**: los dos paneles traen las mismas ocho estampas mensuales sin importar
el `cut`. Vimos que planean renombrarlo a `horizon_cut`; con eso alcanza.

---

## Lo que les debemos

Tres, y las tres dependen de nosotros:

1. **Declarar las cinco formas v1.1** en nuestro contrato —`compared_categorical`,
   `multi_attribute_profile`, `matrix`, `graph`, `flow`—. De acuerdo con que
   entran juntas; el contrato las nombra en el enum y **no declara el objeto de
   ninguna**, así que hoy no hay contra qué implementar.
2. **Los mínimos por gráfico de B1.21**, que es la mitad nuestra de esa tarea.
3. **Los valores de `status` y `vertical`** para `GET /admin/tenants`. Los campos
   ya llegan en `null` y la pantalla los declara como huecos **nuestros**, no
   suyos. Lo llevamos a producto.

---

## Una nota sobre cómo medimos, porque nos falló tres veces

Los cuatro pedidos vencidos no los encontró nadie leyendo: los encontró
**comparar respuestas reales contra nuestra transcripción en las dos
direcciones**. Nuestro chequeo de humo sólo preguntaba «¿está lo que el yaml
exige?», y toda la deriva estaba del otro lado — campos que ustedes mandan y
nosotros no declarábamos. Once en dos semanas.

Al corregirlo apareció algo que les sirve: **el cable de admin declaraba
PascalCase y ustedes pasaron a snake_case con B4.10**, y nuestro front leía
quince campos que devolvían `undefined`. El peor no fallaba, mentía:
`ESTADOS[w.Status] ?? 'borrador'` afirmaba que **todo layout era borrador,
incluido el publicado**. Ya está corregido de nuestro lado.

Y de paso: **`GET /admin/layouts/{layoutId}/preview` quiere `role_id`**, no
`roleId`. Nosotros mandábamos camelCase y da 400, así que esa pantalla nunca
funcionó contra el servicio real. No se deduce del resto —`/config/tabs` usa
`layoutId` y `dashboardId`—, y si les parece mejor unificar, lo seguimos.
