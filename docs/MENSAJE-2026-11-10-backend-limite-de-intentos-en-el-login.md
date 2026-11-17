# Para el equipo de backend · un límite de intentos en el login · 2026-11-10

**Medido contra `4192041` el 2026-11-10**, leyendo su rama
`feature/dynamic-dashboard-backend`: `router.go`, `ratelimit.go`, `cors.go` y
`Login` en `auth_service.go`. De nuestro lado, `deploy/nginx.conf.template` en
`main` (`f6e6572`), que es el proxy por el que el front llega a la API.

Hola. Sale de una revisión de seguridad del front contra ISO 27001
(`docs/AUDITORIA-2026-11-04-hardening-iso-27001.md`, brecha 4). Del front ya
cerramos cabeceras, dependencias y registro de errores. Esto es lo que queda, y
tiene que vivir en la API: **el host de la API de QA es público**, así que un
límite sólo en nuestro nginx se esquiva yendo directo a ella.

## 1 · Lo que hay hoy

- **Las tres rutas sin sesión no tienen límite**: `POST /auth/login`,
  `POST /access-requests` y `POST /password-reset-requests`. Se puede probar
  contraseñas contra una cuenta sin freno, y llenar la cola de solicitudes.
- **Ya tienen un limitador**, `UserRateLimitMiddleware`, pero cuenta por
  `user_id`: sólo sirve detrás del JWT, y hoy sólo cubre el chat.
- **El login no bloquea la cuenta** después de varios fallos.
- **El CORS acepta cualquier origen**, con todos los métodos y cabeceras.

## 2 · Lo que pedimos

**1. Un límite en las tres rutas sin sesión**, por IP y, en el login, también
por correo. Como referencia, cinco intentos por minuto por correo y veinte por
IP. Los números los deciden ustedes. Que conteste **429** con `Retry-After` y
el `RATE_LIMIT_EXCEEDED` que su envelope ya declara. **Del front no hace falta
nada**: el login muestra el mensaje del servicio tal cual.

**2. Fijar los proxies de confianza en Gin.** Este es el que hace que el 1
sirva. `router.go` crea el motor con `gin.New()` y no llama a
`SetTrustedProxies`, así que Gin confía en cualquiera. Nuestro nginx agrega la
IP a `X-Forwarded-For` **sobre lo que mande el cliente**, y con todos los
proxies de confianza `ClientIP()` devuelve el primer valor de esa lista, que
el cliente escribe. **Un límite por IP sin esto se esquiva mandando una IP
inventada en la cabecera.**

**3. Restringir el CORS al origen del front**: `https://qa-synapse.lobueno.co`
en QA, y el que corresponda en cada ambiente. El token viaja en una cabecera y
no en una cookie, así que no es urgente. Pero `*` deja que cualquier página
llame a la API con un token que consiga.

**4. De paso, si lo tocan:** cuando el correo no existe, `Login` contesta antes
de comparar la contraseña, y cuando existe, después. La diferencia de tiempo
dice qué correos tienen cuenta. Se arregla comparando contra un hash fijo
también en ese caso.

## 3 · Una pregunta, para nuestro lado

**¿Qué hay entre internet y nuestro contenedor en QA?** ¿Un balanceador, un
CloudFront, un WAF? ¿Y con qué cabecera llega la IP real del cliente?

Lo necesitamos por dos cosas nuestras:

- **Nuestro nginx registra y limita por `remote_addr`**, y detrás de un
  balanceador ésa es la IP del balanceador. El límite que pusimos al registro
  de errores del navegador —30 por minuto— se estaría repartiendo entre todos
  los usuarios. Con la respuesta configuramos `set_real_ip_from` y lo
  corregimos.
- **La misma respuesta les sirve a ustedes** para el punto 2: los proxies de
  confianza son los de esa cadena.

Si ya tienen un WAF con límite por IP delante de la API, díganlo: puede cubrir
el punto 1 sin código.

## 4 · Cómo lo comprobamos

Contra el servicio desplegado, desde fuera de la red:

- Veinte logins fallidos seguidos contra una cuenta de prueba: después del
  límite, **429**.
- Los mismos intentos con un `X-Forwarded-For` distinto en cada uno: **siguen
  en 429**.
- Un preflight desde un origen que no es el del front: **sin**
  `Access-Control-Allow-Origin`.

Gracias.
