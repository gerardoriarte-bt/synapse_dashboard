# Hardening del front frente a ISO/IEC 27001:2022 · 2026-11-04

> **Sin medición previa:** no aplica. Esto no es un pedido: es un cruce de lo
> que hay contra los controles del Anexo A. Todo lo de abajo se midió ese día
> contra `main` en `336c545` y, en lo del backend, contra `synapse-api-go` en
> `d296e6d`. Cada hallazgo dice de dónde salió.

## Qué es y qué no es

**Es** una revisión técnica del endurecimiento del front: la imagen, nginx, la
sesión en el navegador, las dependencias y cómo cambia el código. Se cruza
contra los controles tecnológicos y organizativos del **Anexo A de la ISO/IEC
27001:2022** que le tocan a una aplicación web.

**No es** una auditoría de certificación. Las cláusulas 4 a 10 (el sistema de
gestión: alcance, análisis de riesgos, Declaración de Aplicabilidad, auditoría
interna) son de la organización, no de un repositorio, y no se evalúan. Lo que
sí sirve de acá para una certificación es la evidencia: cada control tiene
dónde mirarse.

**Lo del backend se anota y no se arregla.** Aparece porque el front depende de
eso para cumplir, y se marca quién es el dueño.

## El resultado en una tabla

| | Control del Anexo A | Estado | Dueño |
|---|---|---|---|
| 1 | **8.9 · 8.26** · Cabeceras de seguridad HTTP | ❌ No cumple | Front |
| 2 | **8.32 · 8.25 · 8.4** · Cambios a `main` sin protección ni revisión | ❌ No cumple | Front |
| 3 | **8.5** · Sesión: token en `localStorage`, 24 h, sin revocar | ⚠️ Parcial | Front y backend |
| 4 | **8.5 · 8.20** · Login y rutas públicas sin límite de intentos | ❌ No cumple | Backend |
| 5 | **5.15 · 8.3** · La lista de clientes se ve sin sesión | ⚠️ Parcial | Backend y producto |
| 6 | **8.8** · Dependencias e imágenes base | ⚠️ Parcial | Front |
| 7 | **5.12 · 8.12** · Repositorio público con nombres de infraestructura | ⚠️ Parcial | Front |
| 8 | **8.15 · 8.16** · Registro y monitoreo desde el navegador | ⚠️ Parcial | Front y backend |
| 9 | **5.17** · Credenciales con rotación diferida | ⚠️ Riesgo aceptado | Operación |
| 10 | **8.9 · 8.31 · 8.28 · 8.24** · Imagen, ambientes, código seguro, cifrado | ✅ Cumple | — |

## Lo que está bien, y por qué cuenta como evidencia

Primero esto, porque es la mayoría y una auditoría lo pide escrito igual que
las brechas.

- **8.9 · Configuración endurecida de la imagen** (`Dockerfile`):
  - Dos etapas: la imagen final no lleva Node ni `node_modules`.
  - **Corre como no-root (uid 101), y se comprobó corriéndola**, no
    suponiéndolo. Soporta raíz de sólo lectura.
  - `server_tokens off`: nginx no dice su versión.
  - `HEALTHCHECK` sobre el puerto real.
- **8.24 · Criptografía en tránsito al backend** (`deploy/nginx.conf.template`):
  el proxy verifica el certificado del upstream y manda SNI
  (`proxy_ssl_verify on`). Se comprobó rompiéndolo: con un certificado
  autofirmado da 502.
- **8.12 · Fuga de datos en el build** (`.dockerignore`): `.env`, `*.pem`, `*.key`
  y `docs/backdocs/` no entran ni a una capa intermedia.
- **8.31 · Separación de ambientes**:
  - Una sola imagen para todos los ambientes, sin URLs horneadas.
  - Los mocks viven en `dev/` y **no hay ruta de import desde `src/`**:
    `mocks-fuera` lo verifica en la puerta.
- **8.28 · Código seguro**:
  - Ningún `dangerouslySetInnerHTML`, `eval` ni `innerHTML` en `src/`. El
    markdown del agente se dibuja como nodos de React, nunca como HTML
    (`Markdown.tsx`).
  - Ningún `console.log` en `src/`.
  - Sin sourcemaps en el bundle.
- **8.25 · 8.29 · Desarrollo y pruebas**:
  - `npm run verify` corre typecheck, lint, chequeos de diseño, pruebas y build.
  - El build de la imagen tipa: una imagen que se construye es una que compila.
  - La práctica de mutación se aplica a las pruebas nuevas.
- **8.2 · Acceso privilegiado**:
  - La plomería (conexión, llave de servicio) sólo se ve con alcance de
    plataforma.
  - `superadmin` es de asignación interna y el front no lo ofrece (decisión
    del 2026-10-20).
- **8.24 · Llaves de servicio**: la privada la genera el backend y no sale de
  ahí. El front sólo muestra la pública y su huella (F5.56).
- **5.17 · Contraseña inicial**: con `password_updated: false` no se pinta
  ninguna superficie hasta cambiarla, y eso no se puede saltar durante la carga
  (`AuthGuard.tsx`).
- **8.4 · Secretos en el repositorio**: GitHub tiene activados el escaneo de
  secretos y la protección al empujar. En el historial, el único
  `PRIVATE KEY` es un ejemplo truncado de documentación (`50f9b29`).
- **8.8 · Dependencias de producción**: `npm audit --omit=dev` da **0
  vulnerabilidades**. Son siete dependencias, instaladas con `npm ci` sobre el
  lockfile.

## Las brechas

### 1 · Sin cabeceras de seguridad · ❌ · Front · prioridad alta

**Medido:** `deploy/nginx.conf.template` no manda ninguna. Las únicas
`add_header` son de caché y de buffering.

| Falta | Qué deja abierto |
|---|---|
| `Content-Security-Policy` | Si alguna vez entra un script ajeno, puede leer el token (ver 3) y mandarlo afuera |
| `Strict-Transport-Security` | Un primer acceso por HTTP se puede interceptar |
| `frame-ancestors` / `X-Frame-Options` | La consola se puede embeber en otro sitio (clickjacking) |
| `X-Content-Type-Options: nosniff` | El navegador puede adivinar tipos de archivo |
| `Referrer-Policy` | La URL completa, con `?cliente=…`, viaja como referer |
| `Permissions-Policy` | Cámara, micrófono y geolocalización quedan sin negar |

**Por qué es la primera:** es la que más reduce el riesgo de la 3 y es
configuración, sin código de producto. La CSP se puede escribir estricta
porque el front no carga nada de afuera: `script-src 'self'` alcanza, y
`connect-src 'self'` también, porque la API va por el mismo origen. Hay que
medir con el bundle real que Vite no inyecte estilos en línea antes de
cerrar `style-src`.

**HSTS va donde termina el TLS**: si es el balanceador de AWS y no este nginx,
la cabecera la pone él. Se pregunta al desplegar.

### 2 · `main` sin protección ni revisión · ❌ · Front · prioridad alta

**Medido con la API de GitHub:**

- `main` **no tiene protección de rama** (404 `Branch not protected`).
- **0 de los últimos 20 PR mergeados tuvieron una revisión.**
- **No hay CI**: no existe `.github/`. `npm run verify` corre sólo en la
  máquina de quien empuja.

**Qué pide la norma:** 8.32 pide que los cambios pasen por un control, y 8.25
que el ciclo de desarrollo tenga puertas que no dependan de una persona. Hoy
la puerta existe y es buena, pero se puede no correr.

**Lo mínimo:**

1. Un workflow que corra `npm run verify` en cada PR.
2. Proteger `main`: PR obligatorio, ese check obligatorio, sin force-push.
3. Una revisión obligatoria, cuando haya una segunda persona que revise.

### 3 · La sesión · ⚠️ · Front y backend · prioridad media-alta

**Medido:**

- El JWT vive en `localStorage` (`src/app/auth/session.ts`). Cualquier script
  que corra en la página puede leerlo.
- Dura **24 horas** (`auth_service.go:65`).
- **Cerrar sesión sólo lo borra del navegador**: no hay ruta de logout ni lista
  de revocación en el backend. Un token copiado sigue sirviendo hasta que vence.
- No hay cierre por inactividad.

**Lo que lo mitiga hoy:** no hay ninguna vía conocida de inyectar script (ver
8.28 arriba). La brecha 1 es lo que convertiría «no hay vía conocida» en «no
corre aunque la haya».

**Lo que pide 8.5, en orden de costo:**

1. **La CSP de la brecha 1**, que es nuestra y barata.
2. **Cierre por inactividad en el front**, que también es nuestro.
3. **Token corto con renovación y revocación en el logout.** Es del backend.
4. Mover el token a una cookie `HttpOnly; Secure; SameSite=Strict`, que el
   script no puede leer. Es lo más fuerte y cambia el contrato de acceso entre
   los dos lados: se decide con el backend, no se empieza por acá.

### 4 · Login y rutas públicas sin límite · ❌ · Backend · prioridad alta

**Medido en `router.go`:** el único limitador (`UserRateLimitMiddleware`) va
sobre el chat, que está detrás de la sesión. Quedan sin límite:

- `POST /api/v1/auth/login` → fuerza bruta de contraseñas.
- `POST /api/v1/access-requests` y `POST /api/v1/password-reset-requests` →
  pueden llenar la cola de solicitudes o disparar correos.

Las contraseñas se guardan con bcrypt, que frena un ataque fuera de línea pero
no uno en línea.

**Además:** CORS responde `Access-Control-Allow-Origin: *` (`cors.go`). Con
token en cabecera y no en cookie el riesgo es bajo, pero 8.20 pide nombrar
los orígenes.

**Nuestra mitad, si el backend tarda:** nginx puede limitar `location
/api/v1/auth` con `limit_req`. No reemplaza el límite del backend, porque el
backend también se alcanza sin pasar por este nginx.

### 5 · La lista de clientes se ve sin sesión · ⚠️ · Backend y producto

**Medido:** `GET /api/v1/access-requests/tenants` es público y devuelve el id y
el nombre de **todos** los clientes, para el formulario de solicitud de
acceso.

Para una consultora, la lista de clientes es información confidencial (5.12).
Es una decisión de producto, no un defecto: el formulario la necesita. Las
salidas son que quien pide acceso escriba su empresa sin elegirla, o que el
enlace de invitación ya traiga el cliente.

### 6 · Dependencias e imágenes base · ⚠️ · Front · prioridad media

**Medido:**

- `npm audit` sobre todo el árbol da **12 vulnerabilidades (6 altas)**, todas
  en **dependencias de desarrollo**: `vite`, `vitest`, `@redocly/openapi-core`
  y lo que arrastran. **No llegan al bundle**, pero sí corren en las máquinas
  de desarrollo y lo harían en un CI.
- Dependabot está **apagado** en el repositorio.
- Las imágenes base van por etiqueta (`node:22-alpine`, `nginx:1.27-alpine`) y
  no por digest. Una etiqueta se mueve: la imagen de hoy y la de mañana pueden
  no ser la misma.

**Lo que pide 8.8:** prender Dependabot, actualizar las de desarrollo, fijar las
imágenes por digest y renovarlas con un ritmo declarado, y escanear la imagen
con una herramienta como Trivy en el CI de la brecha 2.

### 7 · El repositorio es público · ⚠️ · Front · prioridad media

**Medido:** 23 documentos en `docs/` nombran infraestructura de los clientes:
usuarios de servicio de Snowflake, roles, warehouses y hostnames de QA.

Ninguno es un secreto: con el nombre de un usuario de servicio no se entra.
Pero 5.12 pide clasificar la información, y un mapa de la infraestructura de
cada cliente no es pública. Ya hubo un caso: una grabación con cifras reales
de un cliente se sacó antes de mergear.

**Las salidas:** pasar el repositorio a privado (es lo más simple, y los
despliegues no dependen de que sea público), o reemplazar los nombres por
placeholders. La segunda es frágil: los documentos los escribimos todos los
días.

### 8 · Registro y monitoreo · ⚠️ · Front y backend

- **El front no reporta errores a ningún lado.** Un fallo en el navegador de
  un cliente sólo se sabe si el cliente lo cuenta.
- El backend registra cada petición (`gin.Logger`) y tiene métricas de
  Prometheus para el limitador. No se midió si hay un registro de accesos
  —quién entró, desde dónde, intentos fallidos— que es lo que 8.15 pide.

### 9 · Credenciales con rotación diferida · ⚠️ · Riesgo aceptado

Hay credenciales que circularon fuera de un gestor de secretos y cuya rotación
**se difirió por decisión humana** (2026-09-15, ampliada el 2026-10-06). El
detalle está en `CLAUDE.md`, «Pendiente que no es código».

**Para la ISO esto se resuelve documentándolo, no repitiéndolo.** Un riesgo
aceptado es válido si está registrado en el tratamiento de riesgos, con dueño,
fecha de revisión y quién lo aceptó. Lo que falta es ese registro fuera del
repositorio.

## Por dónde seguir

Ordenado por lo que cambia el riesgo por unidad de trabajo:

| | Qué | Dueño | Esfuerzo |
|---|---|---|---|
| 1 | Cabeceras de seguridad y CSP en nginx | Front | Medio día, más medir la CSP contra el bundle |
| 2 | CI con `verify` y `main` protegido | Front | Medio día |
| 3 | Dependabot y actualizar las dependencias de desarrollo | Front | Una a dos horas, más lo que rompa |
| 4 | Límite de intentos en el login | Backend · `limit_req` en nginx mientras tanto | Chico |
| 5 | Cierre por inactividad | Front | Un día |
| 6 | Decidir si el repositorio pasa a privado | Humano | — |
| 7 | Token corto con revocación | Backend | A acordar |
| 8 | Imágenes por digest y escaneo en CI | Front | Medio día |

**Nada de esto está construido.** Este documento sólo mide; cada fila es una
tarea a decidir.
