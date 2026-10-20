# Para el equipo de backend · la consola por cliente, medida · 2026-10-20

> **Histórico.** Un mensaje con fecha: qué se pidió y con qué evidencia.
> No se actualiza.

**Medido contra `d794a3e` el 2026-10-20**: el binario corriendo acá, con la base
local migrada y un usuario de prueba con rol `superadmin`. Del lado del front
medimos lo nuestro primero: la consola ya salta de cliente con su ruta, y lo
miramos en el navegador contra ese binario. El detalle está en
`docs/AUDITORIA-2026-10-20-consola-por-cliente.md`.

**Responde a `RESPUESTA-2026-10-20-backend-consola-por-cliente.md`**, que es su
respuesta del 20.


---

Hola. Medimos el salto de cliente y anda como lo describen. El front ya lo usa.

## Lo que medimos

- Un `admin` llega en `single_tenant` y el salto le da 403; un `superadmin`
  llega en `multi_tenant` con todos los clientes.
- `POST /auth/switch-tenant` devuelve el token del cliente elegido, y con él
  `/config/me`, el catálogo y administración son de ese cliente.
- Los errores salen como los documentaron: 400 sin `tenant_id` o con uno que no
  es UUID, 404 `NOT_FOUND_TENANT` con un cliente que no existe.

## Lo que hicimos

- La consola pide el token nuevo al elegir otro cliente, lo guarda, vacía lo del
  cliente anterior y vuelve a pedir el contexto. También salta si se llega con
  otro cliente elegido en administración o en el builder.
- «superadmin» no aparece en ninguna lista de roles del front. Por ahora lo
  manejamos así: es de asignación interna, nunca de un cliente.

## Para desplegar en QA

1. **`d794a3e`**, con las migraciones corridas: el rol lo crea la migración.
2. **El front de `main`**.

Después José tiene que volver a iniciar sesión.

## Dos preguntas

1. **Un cliente creado desde la plataforma, ¿tiene el rol `superadmin`?** En el
   código vemos que lo crean la migración de arranque y la semilla, no el alta
   de cliente. Si es así, saltar a un cliente nuevo daría 404 `NOT_FOUND_ROLE`
   hasta el próximo arranque con migraciones. No lo medimos.
2. **¿La entrada a otro cliente va a quedar registrada?** Lo preguntamos el 20
   y el diseño lo pide. Hoy `SwitchTenant` firma el token y no escribe nada.

## Para que lo tengan presente, sin pedido

- **Un `admin` puede asignar `superadmin`.** Como el rol existe en cada cliente,
  `PATCH` del usuario lo acepta igual que cualquier otro rol activo, y el alta de
  usuario también lo acepta por nombre. El front ya no lo ofrece, pero eso no lo
  impide. Si en algún momento quieren cerrarlo de su lado, es ahí.
- **El logo** (el punto 1 del mensaje del 20) sigue abierto. Mientras tanto la
  placa lleva dos letras.

Gracias.
