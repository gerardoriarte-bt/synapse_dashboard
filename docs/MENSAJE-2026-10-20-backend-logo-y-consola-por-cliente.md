# Para el equipo de backend · el logo del cliente, y la consola por cliente · 2026-10-20

> **Histórico.** Un mensaje con fecha: qué se pidió y con qué evidencia.
> No se actualiza.

**Medido contra `7324b26` el 2026-10-20**: el binario corriendo acá con la base
local y un operador en `PLATFORM_OPERATOR_USER_IDS`. Del lado del front medimos
lo nuestro primero: la forma corta (`label`) ya la leemos y ya la editamos con
`PUT /admin/tenants/{tenantId}`, medida en cuatro casos (puesta, vacía, 400 y
404); el cliente activo se elige en una barra igual en las tres superficies; y la
consola, cuando el cliente elegido no es el del token, lo declara bloqueado en
vez de mostrar datos de otro. Todo eso está en la rama
`docs/propuesta-identidad-de-cliente` del front, con la propuesta en
`docs/PROPUESTA-2026-10-20-identidad-del-cliente-y-ficha.md`.

**Lo manda el humano.**

---

Hola. Estamos haciendo que se entienda sobre qué cliente se está trabajando:
hoy un operador cambia de cliente y la pantalla casi no lo dice. Del front ya
está casi todo. Les pedimos dos cosas.

## 1 · El logo del cliente

El logo es lo que más rápido distingue a un cliente de otro, y hoy no hay dónde
guardarlo. Medido en `7324b26`: `domain.Tenant` no tiene el campo y no hay ruta.
Lo que necesitaríamos:

1. **Un campo con la URL del logo** —por ejemplo `logo_url`— que viaje en
   `GET /admin/tenants` y en el `tenant` de `GET /config/me`. Vacío cuando no hay
   logo.
2. **Una ruta para subirlo y otra para quitarlo**, sobre el cliente
   (`/admin/tenants/{tenantId}/…`). Vimos que el `ImageUploader` a S3 de los
   tickets ya hace la subida; quizás sirva el mismo.
3. **Que la URL se pueda pedir desde el navegador sin el token**, para pintarla
   en un `<img>`.

Para que lo validen como les quede mejor: nosotros aceptaríamos PNG o SVG, hasta
512 KB. Si es SVG, conviene que validen el tipo de contenido.

**Mientras no llegue, no frena nada**: el front muestra dos letras del nombre en
el lugar del logo. Cuando llegue, lo reemplaza y nada más cambia.

## 2 · Que la consola pueda mostrar otro cliente

Hoy el cliente de `/config/*` es el del token —`claims.TenantID`—, y está bien
así. Lo que falta es que un operador que elige otro cliente pueda ver **su**
consola. En su respuesta del 13 dijeron que sería «un token nuevo por cliente»
cuando exista el super-admin: es eso mismo, y lo volvemos a poner arriba porque
ahora el front ya tiene dónde usarlo.

Lo que necesitaríamos saber:

- **Cómo pide el front una sesión para otro cliente**, para un usuario que puede
  verlo (los de `PLATFORM_OPERATOR_USER_IDS` hoy).
- **Si esa entrada queda auditada.** El `.pen` lo dibuja así: toda entrada a
  datos de otro cliente deja rastro.

**Hasta entonces**, la consola dice que está bloqueada para ese cliente y lleva a
administración. No muestra datos de un cliente con el nombre de otro.

## Y una cosa chica, sin apuro

`status` de `GET /admin/tenants` sigue llegando vacío (`Tenant` no tiene la
columna). Las cards de clientes lo omiten. Cuando esté, lo mostramos.

Gracias.
