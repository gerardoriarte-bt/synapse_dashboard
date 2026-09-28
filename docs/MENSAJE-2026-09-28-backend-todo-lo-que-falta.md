# Para el equipo de backend · todo lo que falta, auditado de punta a punta · 2026-09-28 (noche)

> Auditamos el plan entero para asegurarnos de que **`docs/PARA-BACKEND.md` los
> tenga a todos**. No los tenía: pasó de **8 pedidos a 15**, y siete estaban
> escritos sólo en documentos que ustedes no leen.
>
> **La causa era nuestra y estructural**, así que va primero.

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

## Los siete que no veían

### Los cuatro que ya habíamos hablado y no eran tarea

| | Qué | De dónde salió |
|---|---|---|
| **B4.18** | **`roles.tab_keys`** · lo propusieron ustedes y dijimos que sí el mismo día | Su respuesta del 2026-09-28 |
| **B2.15** | **Encender `DD_MATERIALIZE_PROSE_ENABLED` y avisar** · lo ofrecieron ustedes | Su respuesta §5 |
| **B2.16** | **El materializador emite `presentation` y no la pisa** | `docs/MENSAJE-2026-09-24-materializador.md` |
| **B4.19** | **La compuerta de `resolveLayout` rompe la vista previa por rol** | El rebase sobre `168a761` |

**B2.16 es el defecto visible más viejo que queda**, y conviene decirlo claro:
cuando el materializador corrió por primera vez, **los seis paneles `kpi`
perdieron su medidor y sus comparativos** — la semilla los traía y el camino real
no. El campo `presentation` llegó en `6e595e3` y está verificado de punta a punta;
lo que falta es que el materializador lo produzca.

**B4.19 no es un arreglo sino una decisión.** `168a761` agregó
`if layout.Status != published && !isAdminRoleName(role.Name) { return nil, nil }`
en `resolveLayout`. El preview pasa el rol **simulado**, que por definición no es
admin, así que **un borrador se rechaza al previsualizarlo**. Confunde quién
pregunta con a quién se simula. Lo encontró una prueba nuestra, no el compilador.

### Los tres que salieron de la auditoría

| | Qué falta |
|---|---|
| **B1.32** | **Qué significa `cut` en `series`** · el param existe en el cable y no está definido |
| **B1.33** | **El patrón de `PeriodoId`** · medido: los períodos siguen siendo sólo `YYYY-MM` |
| **B2.14** | **`/config/solicitudes`** · da 404 · y el payload `FORBIDDEN` es `{status, request_from}` **y nada más** |

**B1.32 bloquea un defecto visible**: el orden de una tabla **se anuncia y no se
aplica**. El panel dice cómo está ordenado y no lo está, que es peor que no
decirlo.

**Y los dos tienen una salida barata que no es código.** Si `cut` ya lo aplican al
materializar y el front no debe hacer nada, **eso es la respuesta** y cierra la
tarea. Si `YYYY-MM` es el único patrón que va a existir, **escribirlo cierra
B1.33**: hoy es un supuesto nuestro.

**B2.14 son dos cosas y conviene no mezclarlas:** que `FORBIDDEN` traiga `reason` y
`unlocks_with` como los otros cinco estados, y que exista dónde pedir el acceso.
**Si deciden que no va a haber ruta de solicitud, eso también cierra la tarea** —
con el estado declarado y sin CTA, porque un botón que devuelve 404 es peor que su
ausencia.

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
