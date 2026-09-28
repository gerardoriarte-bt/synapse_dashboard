# Para el equipo de backend · sus tres pedidos, y dos cosas que salieron al medir · 2026-09-28 (tarde)

> Contesta `docs/RESPUESTA-2026-09-28-cinco-que-quedan.md`. **Remedimos las nueve rutas contra
> `f70cec2`**, una por una, construyendo y levantando su binario acá. Cuatro de los cinco puntos
> entraron y se comprobaron contra el servicio corriendo; el quinto sigue abierto y abajo está
> medido por qué. `PARA-BACKEND.md` está regenerado.

## Sus tres pedidos

### 1 · El repertorio de 49 · **acá van los tres archivos**

Están en este repositorio, en la rama `Gerardo`:

| Archivo | Qué trae |
|---|---|
| `docs/REPERTORIO-2026-09-28-los-49-graficos.md` | La tabla: los 49 con su forma, su mínimo, su tope y de dónde sale cada uno |
| `docs/DECISIONES-2026-09-26-minimos-por-grafico.md` | Por qué el mínimo es **de la forma** y no del gráfico, y los tres que lo suben |
| `contracts/synapse-api.yaml` | `GraficoId` (el enum de 49), `Grafico` y `MinimoDeDatos` |

**Una cosa de la estructura que conviene no perder al implementarla**, porque es lo que más va a
durar: **el mínimo es de la FORMA, y un gráfico lo SUBE sólo si su geometría lo exige.** Es la
simetría de `tope`, que baja el techo por gráfico. Un número a mano para cada una de las 49
entradas serían 49 juicios y la mayoría arbitrarios — `bars` y `lollipop` comen el mismo dato y
fallan en el mismo punto. Sólo tres suben el de su forma: `treemap`, `pareto` y `waterfall`, a 3.

**Y `MinimoDeDatos` declara la razón como obligatoria.** Un panel que se apaga sin decir por qué
manda a buscar un error donde hay una regla.

**Ojo con un campo que no estaba en la primera versión: `MinimoDeDatos.forma`.** Apareció al
transcribir la tabla y no antes — nueve de los 49 sirven **dos** formas con umbrales distintos
sobre la misma variable, así que el mínimo no se puede indexar sólo por gráfico.

### 2 · `roles.tab_keys` · **sí, así**

Nos sirve exactamente como lo proponen, con el fallback a `tab_ids` mientras migramos. Dos cosas
que pedimos que queden en el mismo movimiento:

- **`GET .../roles/composition` devolviendo las dos** — es lo que nos deja migrar sin una ventana
  en que la consola de roles muestre menos de lo que el rol ve.
- **Que `tab_keys` valide contra las keys del layout PUBLICADO** y devuelva un 422 nombrando la
  que no existe. Una key que no resuelve es una pestaña que el rol pierde en silencio, que es el
  defecto que estamos cerrando, no uno nuevo.

### 3 · Remedir y regenerar · **hecho, y `backend-drift` quedó verde**

Las nueve rutas leídas contra `f70cec2` y `PARA-BACKEND.md` regenerado. Los cuatro puntos ya no
figuran. Quedan **seis tareas** esperando algo suyo, y las que movimos son:

| | Antes | Ahora |
|---|---|---|
| **B0.4** · `error` en español | Dos handlers crudos | **Uno** · abajo |
| **B1.21** · mínimos por gráfico | `chart` + `/config/plots` | **Sólo `/config/plots`** |
| **B2.12** · los seis estados | 4 de 6 | **5 de 6** · abajo |

## Lo que sí quedó de su punto 1

**`POST /config/chat` sigue volcando el validador de Go**, y es la única de las nueve. Su documento
dice «Nunca aparece un nombre de struct de Go ni un tag»; en `PUT /config/me/preferences` es cierto
y lo medimos —`el campo 'theme' debe ser uno de: dark, light`—. Acá no:

```
POST /api/v1/config/chat   {}
→ 400 VALIDATION_REQUEST
  "solicitud inválida: Key: 'ddChatRequest.question' Error:Field validation
   for 'question' failed on the 'required' tag"
```

**No es el anidamiento** — lo probamos con un campo de primer nivel y con uno anidado, y los dos
salen crudos. **Es por handler**: `dd_chat_handler.go:52` manda
`SendError(c, 400, "solicitud inválida: "+err.Error())` donde los demás mandan
`SendCodedError(c, 400, "VALIDATION_REQUEST", BindingErrorMessage(err))`. De los 32 sitios que
enlazan JSON en `internal/adapters/handler/`, **9 pasan por el traductor**.

**Y son DOS rutas, no una** · agregado el 2026-09-28 al revisar el alta de un tenant nuevo.
`POST /admin/agents` hace lo mismo:

```
POST /api/v1/admin/agents   {}
→ "solicitud inválida: Key: 'createAgentRequest.tenant_id' Error:Field validation
   for 'tenant_id' failed on the 'required' tag…"
```

Ésa importa por otra razón: **es una de las rutas del alta de un cliente**, así que el error lo
va a leer quien esté dando de alta, no un usuario final. `POST /admin/tenants`, en cambio, **sí
está traducida** —«el campo 'name' es obligatorio; el campo 'snowflake_url' es obligatorio…»—,
que es la prueba de que el traductor funciona y de que falta aplicarlo en estas dos.

**Por qué insistimos con esta ruta y no con las otras 22:** `ErrorState` pinta la frase del
servicio tal cual —decidido así porque un lector genérico decía menos— y ésta es la ruta de F3.15,
el chat presente en la consola. Es la que un usuario va a ver.

## Dos cosas que salieron al remedir, y ninguna la pedimos

### `reason` y `unlocks_with` ya vienen en ESPAÑOL

No estaba en el pedido y cambió:

```
DEGRADED · reason:       "Esta métrica todavía no se calculó con datos reales;
                          el valor que se muestra es de referencia"
         · unlocks_with: "Falta registrar la fuente de datos de esta métrica"
```

La tabla de idioma de nuestro `CLAUDE.md` los tenía en la fila «inglés · backend» y dejó de ser
cierto. Gracias, y queda anotado.

**`message` sigue en inglés** —`Requires BT_UA_DECISION_LOG actionable framework (not in Snowflake
Gold yet)`— y **no lo pedimos**: nuestro adaptador sólo lo pinta en `ERROR`, así que en `DEGRADED`
no llega a pantalla. Si en algún momento quieren que sí, avisen y lo tratamos como copy.

### Su B2.12 se confirma en NUESTRA base, no sólo en la suya

Corrimos lo que pidieron. `executive_summary` y `decisions` salen `DEGRADED` con las tres claves de
estado, así que el punto queda cerrado de los dos lados.

**Y con eso `FORBIDDEN` dejó de ser inalcanzable**, que era uno de los dos estados que nos faltaban:
el usuario `planner` oculta tres métricas, y pidiéndole al lote los tres paneles que le faltan
contesta `FORBIDDEN` en los tres. **Quinto de seis.**

## Tres pedidos nuevos, chicos, y el tercero es una pregunta

1. **`BindingErrorMessage` en `dd_chat_handler.go:52`** · arriba. Es un cambio de una línea en la
   ruta de F3.15.

2. **`FORBIDDEN` sin `reason` ni `unlocks_with`.** El payload medido es exactamente
   `{"status":"FORBIDDEN","request_from":"admin"}`. Los otros estados traen la gramática de §8 —qué
   pasa, qué lo desbloquea— y éste no, así que el panel dice «no podés ver esto» y nada más.
   Pedimos las dos, y con una redacción que no prometa una acción que no existe: hoy no hay ruta
   para solicitar acceso a una métrica.

   **`request_from` está bien como está** y no pedimos cambiarlo — el literal `"admin"` es lo único
   que hay y redactarlo de nuestro lado sería inventar a quién pedirle.

3. **`ERROR` ya no se puede provocar, y queremos saber con qué se prueba.** El criterio de B2.12
   dice «un `gauge` sin `maximum`», y **el builder ahora lo rechaza antes de guardar**:

   ```
   PUT /admin/layouts/{id}   panel gauge sin options.maximum
   → 400 VALIDATION_LAYOUT · "el bloque gauge necesita options.maximum"
   ```

   **Eso está bien de su parte** —es la validación haciendo su trabajo— y deja el estado sin
   disparador conocido. **¿Qué hace que un panel salga `ERROR` hoy?** Si la respuesta es «una falla
   del transformador que no se puede provocar a mano», nos alcanza saberlo: lo anotamos como no
   alcanzable con su razón, que es distinto de no haberlo intentado.

## Y una cosa nuestra que encontramos, para que no la busquen

**`request_from` estaba mal en nuestro cable, y no por adivinar: por no bajar un aviso suyo.**
Decía `"administrator"`. Ustedes lo cambiaron a `"admin"` y **nos lo avisaron por escrito** el
2026-09-25, en §B1.6 de su respuesta, con el ejemplo al lado. Lo guardamos en el documento y nunca
llegó al yaml, que es de donde sale el tipo. Corregido.

Lo anotamos porque es un modo de falla que teníamos sin nombre: **un cambio anunciado no está
transcripto hasta que está en el cable.** Nuestra regla escrita era «nada se escribe de memoria», y
acá nadie escribió de memoria — el aviso llegó y se archivó en prosa, que `openapi-typescript` no
lee.

## Lo que seguimos esperando, ordenado por lo que destraba

| | Qué | Destraba |
|---|---|---|
| 1 | `GET /config/plots` con la tabla de 49 | **B1.21** · y el selector de gráfico del builder |
| 2 | `roles.tab_keys` | Que un rol restringido sobreviva a una publicación |
| 3 | `BindingErrorMessage` en el chat | **B0.4** a ✅ |
| 4 | `reason`/`unlocks_with` en `FORBIDDEN` | La gramática de §8 en el sexto estado |
| 5 | Con qué se provoca `ERROR` | **B2.12** · es una pregunta, no código |
| 6 | `DD_MATERIALIZE_PROSE_ENABLED` | Los dos paneles de prosa con dato real · avisan ustedes |
