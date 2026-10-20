# Propuesta de spec · la identidad del cliente, el header y la ficha · 2026-10-20

> **Abierta.** Pide decisiones al humano, a diseño y al backend. Cuando se
> tomen, van a un `DECISIONES-*` y esto no se edita.

**Medido contra:** el front de `main` en `b380a0b` (#35); el backend `7324b26`,
leído con `git show` y corriendo en local con `dev@synapse.local` en
`PLATFORM_OPERATOR_USER_IDS`; QA, `qa-synapse.lobueno.co`, con la sesión abierta
de un superadmin, sólo lecturas, el 2026-10-20; y el `.pen`, leído como JSON.

---

## 0 · Lo que se pidió, literal

Del humano, el 2026-10-19 y 20, después de mirar el cambio de cliente como
operador:

- «Va a ser importante agregar algún elemento para diferenciar los clientes,
  bajo la línea que vamos sólo es evidente a nivel del selector.»
- «Agregar la posibilidad de agregar logo del cliente, creo que es el
  diferenciador principal, y crear un diferenciador visual en el header.»
- «La página de clientes hay que reestructurarla: es un scroll muy grande y se
  puede organizar la mayoría de la info en cards. Es todo explícito, saturado y
  complejo en la lectura.»

## 1 · Lo que ya está, y esto no repite

El #35 resolvió **el recorrido** del cambio de cliente
(`docs/AUDITORIA-2026-10-19-cambio-de-cliente.md`): el cliente viaja en la URL
(F5.38), el propio se marca «tu cliente» (F5.39), «Volver al dashboard» dice
adónde vuelve (F5.40), Usuarios arranca en el cliente de trabajo (F5.41) y
«Cargar meses» lo nombra (F5.42). La ficha ya ofrece saltar por secciones (F5.34).

**Lo que queda es otra cosa: reconocer al cliente de un vistazo.** Hoy lo único
que lo identifica es su nombre, escrito en el selector.

## 2 · Lo medido

### El cliente se reconoce sólo por el nombre

- **En local los dos clientes se llaman «Under Armour México».** Al cambiar de
  uno al otro, el selector dice exactamente lo mismo antes y después; sólo los
  datos cambian —el catálogo pasa de 33 a 12 métricas—. Mirado como operador el
  2026-10-19.
- **En QA los cinco nombres son distintos** —Keralty, Lobueno Analytics, Lobueno
  Analytics Terpel, Sistema, Synapse UA HTML—, así que el selector sí cambia.
  Pero dos empiezan igual, y es lo único que hay. **Y el superadmin ya los ve
  a los cinco**: «Alcance · 5 clientes» y el selector con caja, así que lo que
  pedía `docs/MENSAJE-2026-10-19-backend-operador-en-qa.md` ya está en QA.
- **Donde aparece el cliente cambia según la pantalla**: en Clientes es la lista
  de la izquierda; en Catálogo y Salud de feeds, un selector a la derecha del
  título; en el builder, junto al logotipo; en la consola, texto al lado del
  logotipo.
- **El id corto** (`B7C2DFA4`) desempata en la lista de Clientes, pero no se lee:
  es un pedazo de UUID.

### El backend ya tiene la forma corta, y no la usamos en administración

`Tenant.Label` existe en `7324b26` —«la forma corta del nombre para el navbar
("UA MX"). Vacío = se usa Name»—, se edita con `PUT /admin/tenants/{tenantId}`
(`UpdateSettings`, que acepta `name`, `label`, `locale`, `currency` y
`timezone`) y viaja en `GET /admin/tenants` y en `/config/me`.

- **La consola la lee** (`adapt.ts` → `etiqueta`).
- **Administración y builder no**: `SelectorDeCliente` y `TenantList` pintan el
  nombre.
- **Está vacía en los dos clientes locales**, medido en la base el 2026-10-20.
  En QA la consola muestra «Synapse UA HTML», igual que el nombre, así que o está
  vacía o es igual.
- **Ningún formulario nuestro la edita**, y `PUT /admin/tenants/{tenantId}` no
  está transcripto en `contracts/synapse-admin-wire.yaml`.

### No hay logo de cliente en ningún lado

- **El `.pen` no dibuja un logo de cliente.** Busqué logo, avatar e isotipo en
  todos los nodos: los únicos logos son el de Synapse. Lo que el dibujo usa para
  identificar al cliente es **la forma corta**: `ua_mx` debajo del nombre en A1,
  y un chip «TENANT · UA MX ⌄» en el navbar de A2.
- **El backend no tiene campo ni ruta para un logo.** Sí tiene con qué subirlo:
  `ports.ImageUploader` sube a S3 y devuelve la URL pública, y hoy lo usan sólo
  los tickets (`ticket_handler.go`, multipart con tope de 10 MB).

### La página de Clientes satura

El `.pen` la dibuja como **dos pantallas**: A1 es una tabla de clientes, y
«ABRIR FICHA» lleva a A2, que es otra página con migaja y el nombre del cliente
como título. Nosotros las pusimos lado a lado, por decisión del 2026-10-09.

La ficha de «Synapse UA HTML» en QA, el 2026-10-20, tiene en una sola columna:

| Bloque | Qué pinta |
|---|---|
| Identidad | 7 campos, dos en guión, más una línea de aviso |
| Roles | **6 tarjetas**. Las seis repiten «Overview · 13 paneles». La explicación «Ve TODAS las pestañas…» aparece **4 veces**, y «No se borra con usuarios asignados…», **3** |
| Usuarios | **12 filas**, cada una con un selector de rol. ~~Con las 6 opciones de rol escritas en la fila~~: **corregido el 2026-10-20**, ver abajo |
| Acceso a datos | Una fila, dos párrafos de explicación |
| Subprocesadores | 3 filas y un aviso |
| Avisos sueltos | 3 más, entre bloques |

Todo con el mismo peso visual y nada plegado: por eso se lee como un muro. F5.34
ayuda a saltar, pero no achica lo que hay que leer.

## 3 · Propuesta A · la identidad del cliente: logo y forma corta

**El logo como diferenciador principal**, que es lo que pide el humano, y **la
forma corta como respaldo**, que es lo que dibuja el `.pen` y ya existe.

| Pieza | Qué es | De dónde sale |
|---|---|---|
| **Logo** | La imagen del cliente | Nuevo: lo sube un admin en la ficha |
| **Forma corta** | «UA MX», «KERALTY» | `label`, que ya existe. Si está vacía, el nombre |
| **Monograma** | Dos letras de la forma corta en una placa neutra | Derivado, para el cliente que todavía no tiene logo |

**Dónde va**, siempre los tres juntos y en el mismo orden:

- **El header de las tres superficies** —consola, administración y builder—, en
  el mismo lugar. Ver propuesta B.
- Cada opción del selector de cliente.
- Cada card de Clientes y la cabecera de la ficha. Ver propuesta C.

**Lo que hay que decidir del logo:**

1. **Los dos temas.** El producto tiene tema claro y oscuro, y un logo pensado
   para fondo blanco se pierde en el oscuro. Dos salidas: **una placa clara fija
   detrás del logo en los dos temas**, que es la simple, o pedir dos variantes al
   subir. Recomiendo la placa.
2. **Formato y tamaño.** PNG o SVG, hasta 512 KB, y que se lea a 24 px de alto,
   que es lo que mide en el header. Un SVG se pinta con `<img>`, que no ejecuta
   scripts, pero igual conviene que el backend valide el tipo.
3. **El color del logo no entra a la paleta.** Es una imagen del cliente, no un
   token: no tiñe el header, ni los acentos, ni los datos. §4 explica por qué.

**Lo que es del front y se puede hacer ya, sin backend:** leer `label` en
administración y builder; el monograma; y el campo «Forma corta» en la ficha,
transcribiendo antes `PUT /admin/tenants/{tenantId}` y corriendo el humo.

**Lo que es del backend:**

- Un campo `logo_url` en el cliente, que viaje en `GET /admin/tenants` y en el
  `tenant` de `/config/me`.
- Una ruta para subirlo y otra para quitarlo, por ejemplo
  `POST /admin/tenants/{tenantId}/logo` (multipart) y
  `DELETE /admin/tenants/{tenantId}/logo`, sobre el mismo `ImageUploader` de los
  tickets.
- Que la URL que devuelve se pueda pedir desde el navegador sin el token.

Esto no es un mensaje al backend todavía. Se escribe como `MENSAJE-*` cuando el
humano lo decida.

## 4 · Propuesta B · la barra del cliente activo

**Revisado con el humano el 2026-10-20, después de ver el primer dibujo.** La
versión anterior ponía el cliente dentro del navbar y una franja que decía
«Trabajando sobre Terpel · tu sesión es Under Armour México», con un botón para
volver al propio. El humano la encontró confusa: dos clientes nombrados a la vez,
y un «volver» que no tiene sentido si se está trabajando sobre otro.

**La regla nueva: al cambiar de cliente, todo el entorno es de uso exclusivo de
ese cliente.** No hay un cliente «de la sesión» y otro «de trabajo»: hay uno, el
activo.

- **Una barra bajo el navbar es el cliente activo**: logo o monograma, nombre y
  forma corta. Todo lo que se ve debajo es de ese cliente.
- **El selector va a la derecha de la barra**: «Cambiar de cliente». El
  desplegable muestra la misma identidad en cada opción.
- **Quien tiene un solo cliente ve la misma barra sin selector.**
- **La barra es la misma en consola, administración y builder.** En el builder
  eso saca al cliente de dos lugares donde hoy se elige: la columna «TENANT» del
  cuerpo de B1 y el chip «TENANT» del navbar de B2. B1 queda para el rol y las
  pestañas, y el navbar de B2 para el rol y la pestaña que se editan.
- **El perfil queda como un ícono** a la derecha del navbar, y **a su derecha
  el ≡ del menú de trabajo**, el mismo de hoy: lleva a consola, administración
  (Clientes, Usuarios, Catálogo de métricas, Salud de feeds) y construcción de
  dashboards (Dashboards, Editor, Historial de versiones). El ⋯ del builder son
  acciones del lienzo, no navegación.
- **A1 · Clientes no lleva barra**, porque es de plataforma: lista todos. Ahí la
  card del cliente activo se marca «EN USO», y «Abrir ficha» lo vuelve activo.

**Que la consola siga al cliente elegido no es del front.** Hoy el cliente de
`/config/*` es el del token, y el backend dijo el 13 que eso será «un token nuevo
por cliente» cuando exista el super-admin. Hasta entonces, cambiar de cliente
cambia administración y builder, y la consola queda en el del token. El dibujo
muestra el destino, no lo que se puede construir hoy.

**Con los tokens que ya hay, no con el color del cliente.** La barra va en
`panel` con una línea `w3` abajo. Pintar
el header con el color de marca de cada cliente parece lo natural y choca con
cuatro reglas de `design.md`:

- **Un hex literal es un bug**, y un color de cliente no es un token.
- **El naranja es sólo de acción**, y una marca naranja lo confundiría.
- **Ámbar y amarillo están prohibidos**, y hay marcas de esos colores.
- **La familia cromática se lee del catálogo**, y un color de cliente cerca de
  los datos compite con ella.

El logo ya es el color del cliente: en una placa, y en ningún otro lado.

## 5 · Propuesta C · Clientes en cards, y la ficha como página

**Esto reabre una decisión del humano** —lista y ficha lado a lado, 2026-10-09—
**y diverge del `.pen`**, que dibuja A1 como tabla. Necesita las dos cosas: que
el humano la reabra y que diseño redibuje A1.

### Clientes: una grilla de cards

Cada card es un cliente:

| Arriba | Logo o monograma, nombre y forma corta, y «EN USO» si es el cliente activo |
|---|---|
| En el medio | Usuarios · feed más atrasado y hace cuánto · última publicación |
| Abajo | «Abrir ficha» |

**Todos los datos ya llegan** en `GET /admin/tenants`. `status` y `vertical`
llegan en `null`; la card los deja fuera hasta que lleguen, en vez de mostrar un
guión.

Un feed vencido se marca con la gramática de §8 que ya usa Salud de feeds:
estado y qué lo desbloquea.

### La ficha: página propia, con resumen arriba

Como la dibuja A2: **migaja «Clientes / Synapse UA HTML» y el nombre del cliente
como título**, con su logo. Debajo, **cuatro cards de resumen**, y cada una abre
su sección:

| Card | Qué dice |
|---|---|
| Identidad | Moneda, huso, alta, forma corta y logo, con «Editar» |
| Roles | «6 roles · 1 pestaña · 13 paneles», más el aviso de duplicados si lo hay |
| Usuarios | «12 · 12 activos», y cuántos nunca entraron |
| Acceso a datos | Vigente o sin verificar, y «Verificar ahora» |

**Y dentro de cada sección, menos texto:**

- **Cada explicación, una vez.** La regla de «un rol sin pestañas las ve todas»
  va una vez en la cabecera de Roles, no en cada tarjeta.
- **Roles plegados**: nombre, usuarios y paneles. El detalle se abre.
- ~~**El rol del usuario en un solo control**, no seis opciones en la fila.~~
  **No hacía falta: ya era un solo control.** Corregido el 2026-10-20 al
  construirlo. La medición de QA leyó la página como texto, y el texto de un
  `<select>` incluye todas sus opciones: se leyeron como escritas en la fila. Es
  la falla de citar una transcripción como si fuera la pantalla.
- **Subprocesadores plegados.** Son de plataforma y casi no cambian.

## 6 · Lo que se pide, y a quién

| | Qué | Quién |
|---|---|---|
| 1 | ¿El logo es el diferenciador principal y la forma corta el respaldo? | Humano |
| 2 | ¿Placa clara fija detrás del logo, o dos variantes? | Diseño |
| 3 | La barra del cliente activo, con el selector a la derecha | Diseño |
| 3b | **Que la consola siga al cliente elegido**: un token por cliente | Backend |
| 4 | **Reabrir lado a lado**: Clientes en cards y la ficha como página | Humano |
| 5 | Redibujar A1 como cards y A2 con su resumen | Diseño |
| 6 | `logo_url`, la ruta para subirlo y quitarlo, y la URL pública | Backend |

## 7 · Orden sugerido

1. **La forma corta en administración y builder**, con el campo para editarla.
   No espera a nadie.
2. **La barra del cliente activo**, cuando diseño apruebe. Con
   la forma corta y el monograma ya distingue.
3. **Clientes en cards y la ficha como página**, cuando diseño redibuje.
4. **El logo**, cuando llegue la ruta. Reemplaza al monograma y nada más cambia.

## 8 · Dibujado en el `.pen`, para validar

El 2026-10-20, a pedido del humano, en una banda nueva debajo de
administración (`y` 15500). **Se llaman «Propuesta · …» a propósito**: así
`pen-pantallas` no los toma como pantallas a construir. Cuando se aprueben se
renombran a A1 y A2 y reemplazan a los actuales.

| Id | Frame | Qué muestra |
|---|---|---|
| `JbSzo` | Propuesta · A1 · Clientes en cards | La grilla de cuatro clientes, con el activo marcado «EN USO». UA MX y UA CO comparten logo, y la forma corta los separa. Super-admins plegado |
| `FNeJ3` | Propuesta · A2 · Ficha con resumen | La barra del cliente activo, la migaja, las cuatro cards de resumen, los roles plegados y un solo control de rol por usuario |
| `tUG9S` | Propuesta · Header · identidad del cliente | Seis casos: administración, la consola después de cambiar de cliente, quien tiene un solo cliente, el selector abierto, la placa en los dos temas y el menú de trabajo abierto |
| `nXCtM` | Propuesta · B1 · Contexto con la barra de cliente | Copia de B1 sin la columna «TENANT»: el cliente es el de la barra |
| `d7qsX7` | Propuesta · B2 · Canvas con la barra de cliente | Copia de B2 sin el chip «TENANT» del navbar, con la barra sobre el lienzo |

**No agrega tokens.** La placa clara es `$panel` con el tema Light forzado sobre
el nodo, así que se ve blanca también en el tema oscuro.

**El logo es un marcador**, un ícono de imagen: no hay logos reales para probar.
Los clientes, las personas y los conteos son datos de ejemplo, y las notas lo
dicen.

## 9 · Lo que no se miró

- Cambiar de cliente en QA: se miró sin elegir otro, para no tocar nada.
- El responsive, que sigue diferido.
- Cómo se ve un logo real en el header: no hay ninguno para probar.
