# Auditoría · administración: clientes, ficha y usuarios · 2026-10-08

> **Histórico.** Un cruce puntual, con fecha. No se actualiza.

**Qué se pidió** (humano, 2026-10-08): el administrador «no es comprensible ni
lineal» entre *Clientes y plataforma* y *Ficha de cliente*, que deberían ser una
sola pantalla; los usuarios están mezclados y deberían verse y organizarse por
cliente; y no hay forma de dar de alta un cliente ni un usuario.

**Cómo se midió:**

- **El dibujo:** se leyeron las notas y el texto de los frames `A1`, `A2`,
  `A2 · Ficha · tenant en alta` y `A3` de `design/Synapse_v2.pen`.
- **Lo construido:** `src/surfaces/admin/`, recorrido en el navegador contra el
  binario `9dc481e` del backend, levantado acá con la base local.
- **El backend:** `internal/adapters/handler/router.go` y los handlers de
  tenants, usuarios y solicitudes de acceso en `9dc481e`. Las cinco rutas de
  alta que se citan abajo ya estaban en `c8b9247`, el commit que QA tiene
  pedido.

---

## 1 · Lo que se encontró

### 1.1 · Clientes y Ficha: el dibujo las une; lo construido las separa

**El `.pen` no tiene «Ficha de cliente» en la navegación.** Las cuatro entradas
dibujadas son `CLIENTES · USUARIOS · MÉTRICAS · FEEDS`. A la ficha se llega
desde la fila del cliente con `ABRIR FICHA`, y la ficha lleva migas
`CLIENTES / UNDER ARMOUR MÉXICO` para volver. **Es un solo recorrido**: lista y
detalle del mismo objeto.

Lo construido tiene cinco pestañas, con *Ficha de cliente* al lado de *Clientes
y plataforma*, y **dos formas de elegir cliente** que no se hablan:

- el botón `Ver ficha` de la fila, en A1;
- un selector `CLIENTE` arriba a la derecha, en la ficha.

Entrar a la pestaña *Ficha* sin pasar por A1 abre un cliente que no se eligió
en esa pantalla, y no hay migas para volver a la lista. **Esto explica el «no
es lineal»**, y es una divergencia con el dibujo, no una decisión de diseño.

### 1.2 · A1 está a medio construir

| El dibujo | Lo construido |
|---|---|
| `NUEVO CLIENTE` en la cabecera de la tabla | **No está** |
| Columnas `CLIENTE` (con su id), `VERTICAL`, `ESTADO`, `USUARIOS`, `FEED MÁS ATRASADO`, `ÚLTIMA PUBLICACIÓN` | Cliente, usuarios, feed, publicación. **Sin id ni forma corta** |
| Banda `SUPER-ADMINS` con `INVITAR`, MFA y último acceso | **No está** |
| Buscar y filtrar por estado | **No está** |

**Dos clientes con el mismo nombre no se distinguen.** En la base local hay dos
«Under Armour México», uno con 0 usuarios y otro con 2, y la fila no dice cuál
es cuál. El dibujo pone el id (`ua_mx`) debajo del nombre justamente para eso.

### 1.3 · La ficha manda a otra pantalla para ver a sus usuarios

La ficha cuenta usuarios por rol («1 USUARIO(S)») pero no dice quiénes son, y
lo declara: *«Quiénes son los usuarios de este cliente: hoy se ven en la
pantalla de usuarios, no acá.»* **El dato está disponible**: nuestro cable ya
transcribió `GET /admin/tenants/{tenantId}/users`. El `.pen` no dibuja esa
lista en A2, así que agregarla es una propuesta de spec, no un ajuste.

### 1.4 · Usuarios: sin organizar y sin acciones

| El dibujo | Lo construido |
|---|---|
| Filtros `CLIENTE`, `ROL` y `ESTADO` | **Sólo búsqueda libre** |
| `INVITAR USUARIO` | **No está** |
| Por fila: candado en `CLIENTE` (no editable), estado con invitación pendiente, `REENVIAR INVITACIÓN` | **Ninguna acción por fila** |
| Reglas al pie | Están, **pero describen acciones que la pantalla no ofrece**: «Suspender corta el acceso…» sin un botón de suspender |

**«Mezclados» es exacto**: el cliente es una columna más, y el filtro dibujado
para separarlos no se construyó.

### 1.5 · Lo que el backend ya sirve y el front no usa

| Ruta | Qué hace | ¿En nuestro cable? |
|---|---|---|
| `PUT /admin/tenants/{tenantId}/users/{userId}` | Cambia el rol (`role_id`) o suspende y reactiva (`is_active`) | **No** |
| `DELETE /admin/tenants/{tenantId}/users/{userId}` | Desactiva al usuario | **No** |
| `GET /admin/access-requests` y `POST …/{id}/approve` · `…/reject` | La cola de solicitudes de acceso. **Aprobar crea el usuario con una contraseña temporal y se la manda por correo** | **No** |
| `PUT /admin/tenants/{tenantId}` | Edita nombre, forma corta, locale, moneda y huso | Sí, para el huso |
| `POST /admin/users` | Crea un usuario | **No** · ver §2 |
| `POST /admin/tenants` | Crea un cliente | **No** · ver §2 |

**Las tres primeras se pueden construir hoy sin pedirle nada a nadie.** Con
ellas Usuarios deja de ser de sólo lectura: cambiar rol, suspender, dar de baja
y aprobar a quien pidió acceso desde el login.

---

## 2 · Lo que choca con una decisión escrita

**Dar de alta un cliente desde la pantalla fue descartado el 2026-09-30, por
decisión humana.** Es la D1 de `PROPUESTA-2026-09-28-pantallas-de-alta.md`,
opción (c):

> El equipo interno crea el tenant con sus credenciales por runbook; el
> super-admin lo **adopta** eligiendo plantilla y definiendo el primer rol.

**La razón sigue en pie:** el alta de cliente del backend exige siete campos de
Snowflake (`snowflake_url`, `snowflake_account`, `snowflake_user`,
`snowflake_role` como obligatorios, y la clave privada), y §7.3 de `design.md`
prohíbe mostrar vocabulario de infraestructura. Pedirlos en un formulario es
pegar una clave privada RSA en la web.

**Pedir el alta de clientes en pantalla reabre D1.** No se resuelve acá: se
pregunta.

**El alta de usuarios tiene un choque parecido, más chico.** El alta de usuario
del backend exige `password`, y el dibujo de A3 dice «EL ALTA ES POR
INVITACIÓN · NADIE FIJA LA CONTRASEÑA DE OTRO, NI SIQUIERA UN SUPER-ADMIN». **El
backend ya tiene el mecanismo de invitación**, pero sólo detrás de aprobar una
solicitud: genera una contraseña temporal y la manda por correo. Lo que falta
es poder invitar sin que la persona haya pedido acceso antes.

**Y la plantilla de vertical, que el dibujo exige para crear un cliente**
(«CREAR UN CLIENTE EXIGE ELEGIR PLANTILLA DE VERTICAL»), **sigue sin backend**:
no hay ruta de plantillas en `router.go`. Era la D2 de la misma propuesta.

---

## 3 · La propuesta

### 3.1 · Lo que se arregla sin decidir nada · alinear con el `.pen`

1. **Clientes y Ficha pasan a ser un solo recorrido**, como en el dibujo: se
   quita la pestaña *Ficha de cliente*, la fila abre la ficha, y la ficha lleva
   migas `CLIENTES / <cliente>`. El cliente se elige en un solo lugar.
2. **A1 completa**: id o forma corta debajo del nombre, búsqueda y estado.
3. **Usuarios con los filtros dibujados**: cliente, rol y estado.
4. **Acciones por fila en Usuarios**: cambiar rol, suspender y reactivar, dar de
   baja. Las rutas existen; hay que transcribirlas al cable.

### 3.2 · Lo que necesita una decisión

| | Qué | Quién decide |
|---|---|---|
| **P1** | **¿Una sola pantalla para Clientes y Ficha?** El dibujo las une como lista y detalle con migas (§3.1.1). Si además se quieren **lado a lado** —lista a la izquierda, ficha a la derecha— es una divergencia con el `.pen` | Producto y diseño |
| **P2** | **Los usuarios del cliente dentro de su ficha.** El dato existe; el `.pen` no lo dibuja | Diseño |
| **P3** | **Reabrir D1: alta de cliente desde la pantalla.** Con las credenciales en el formulario —excepción a §7.3— o con el backend aceptando un cliente sin credenciales, que el equipo interno completa después | Producto, y backend si es la segunda |
| **P4** | **Invitar usuario.** Construir ya la cola de solicitudes de acceso (backend listo), y pedirle al backend una invitación directa que reuse su mecanismo de contraseña temporal por correo | Producto · el pedido es al backend |

**Recomendación:** hacer §3.1 entero, que sale del dibujo y no pide nada a
nadie, más la cola de solicitudes de P4. Eso cubre «lineal», «organizados por
cliente» y la mitad del CRUD de usuarios. P1-lado-a-lado, P2 y P3 se deciden
con lo anterior a la vista.

---

## Lo que NO se midió

- Que `PUT` y `DELETE` sobre usuarios del tenant funcionen contra el servicio.
  Se leyó el handler; no se llamaron.
- Si el correo de aprobación sale en QA. Depende de que el mailer esté
  configurado allí; en el código, sin mailer, se registra una advertencia y no
  se envía.
- Por qué hay dos «Under Armour México» en la base local. Puede ser residuo de
  pruebas; el defecto de que la fila no los distinga vale igual.
