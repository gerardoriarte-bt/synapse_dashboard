# Plan de diseño · las pantallas del alta de un cliente · 2026-09-28

> **Antes de leer el plan, tres cosas que el `.pen` y `design.md` ya resuelven** y
> que cambian la pregunta. Se abrió el dibujo antes de proponer nada, que es lo
> que la regla pide, y lo que apareció obliga a partir el pedido en dos.

## 0 · Lo que ya está dibujado · NO se diseña de cero

| Frame del `.pen` | Registro del plan |
|---|---|
| `A1 · Clientes y plataforma` | construida · `TenantList.tsx` |
| `A1 · Clientes · sin ningún cliente` | construida · `EmptyRow.tsx` |
| **`A2 · Ficha · tenant en alta`** | **«No construida · no hay alta de tenant en el front»** |

**La pantalla del cliente recién dado de alta existe como dibujo**, con su nota:
*«La variante que faltaba. `axo_mx` vive en `SYNAPSE_TENANTS` con `roles: []` y A1
ya lo lista, pero A2 no sabía dibujarlo.»*

Y el disparador del alta también: A1 tiene **`NUEVO CLIENTE`** en `$acc` y al pie
la regla **«CREAR UN CLIENTE EXIGE ELEGIR PLANTILLA DE VERTICAL · LA PLANTILLA
DEFINE SUS PESTAÑAS Y MÉTRICAS DE ARRANQUE»**.

## 1 · LA REGLA QUE CAMBIA EL PEDIDO

El pedido era «pantallas comprensibles para el admin de **qué se debe hacer en
Snowflake**». §7.3 de `design.md` lo prohíbe, y no como preferencia:

> **Regla dura de toda la superficie: el vocabulario de infraestructura no se
> muestra.** Nombres de base, de rol técnico, de warehouse o de grant no aparecen
> en ninguna pantalla. Esa capa la opera el equipo interno y ningún usuario de
> administración actúa sobre ella; mostrarla sugiere una acción que no existe y es
> una fuente de confusión, no de control. Lo que sí se muestra es la
> **consecuencia**: si el acceso está vigente, cuándo se verificó y qué hacer si
> no lo está.

Con **una sola excepción, y es legal**: la declaración de subprocesadores, «una
obligación legal de nombrar a quién procesa el dato — no una palanca operativa».

**El dibujo la cumple al pie.** `A2 · Ficha · tenant en alta` no nombra ni una
base ni un grant; lo que pinta es:

```
ACCESO A DATOS
  ⬡ BLOQUEADO        TODAVÍA NO CONFIGURADO
  El acceso a datos se configura al confirmar el primer rol:
  sin rol no hay a quién otorgarle lectura.
  LO DESBLOQUEA · DEFINIR EL PRIMER ROL
```

Estado, razón y qué lo desbloquea — la gramática de §8, la misma de un feed
vencido.

### Por qué la regla tiene razón acá, y no es burocracia

Lo medido esta mañana la respalda: **el trabajo de Snowflake no lo puede hacer
quien usa la pantalla.** Requiere crear objetos en la cuenta del cliente, curar
texto de gobierno, dar un grant, generar un par de claves RSA y **entrar a la
máquina del backend**, porque `sync-catalog` no tiene ruta HTTP —`POST
/admin/tenants/{id}/sync-catalog` da **404**, medido—.

Una pantalla que le explique todo eso a un super-admin le está pidiendo algo que
no puede ejecutar. Eso es exactamente «sugiere una acción que no existe».

## 2 · LA PROPUESTA · dos audiencias, dos artefactos

El pedido es legítimo: alguien tiene que entender qué hay que hacer. Lo que no es
uno solo es **quién**.

| | Quién | Qué necesita | Qué es |
|---|---|---|---|
| **A** | Super-admin · en la plataforma | Registrar el cliente y ver en qué estado quedó | **Pantallas** · §3 |
| **B** | Equipo interno · datos y backend | Los pasos de Snowflake, en orden, con verificación | **Runbook** · §4 · NO es pantalla |

**La pantalla no enseña el runbook: declara su resultado.** Es la misma división
que el producto ya usa con un feed vencido — la consola no explica cómo se
arregla un pipeline, dice que está vencido, desde cuándo y a quién pedirle.

## 3 · LAS PANTALLAS · qué se agrega y qué ya está

### 3.1 · A1 · el alta · **una hoja, no una pantalla nueva**

El CTA `NUEVO CLIENTE` ya está dibujado. Lo que falta es qué abre. **Propuesta:
una hoja** —el patrón de C3, que el producto ya tiene— con **cuatro campos y
nada más**:

| Campo | Por qué |
|---|---|
| **Nombre** | Lo único libre |
| **Forma corta** · `label` | Llegó en `f70cec2` · es la del navbar, y si va vacía cae a `name` |
| **Plantilla de vertical** | **Obligatoria** · la regla al pie de A1. Define pestañas y métricas de arranque |
| **Locale · moneda · huso** | Tres selectores. El huso es **del tenant**, no del navegador — es el corte del día del negocio |

**Lo que NO va en esta hoja, y es la mitad de la propuesta:** `snowflake_url`,
`snowflake_account`, `snowflake_user`, `snowflake_role`, `private_key_pem`,
`private_key_passphrase`, `kms_key_arn`.

**Son siete campos que hoy `POST /admin/tenants` exige** —medido: contesta 400
nombrándolos—, y los siete son vocabulario de infraestructura. Ver §5, que es la
decisión que hay que tomar.

### 3.2 · A2 · `tenant en alta` · **construirla como está dibujada**

Cuatro bloques, todos en el frame:

1. **IDENTIDAD** · `ID`, `VERTICAL`, `PLANTILLA`, `ESTADO`, `MONEDA`,
   `CATALOG VERSION`, `ALTA`. Nótese que `CATALOG VERSION` va en `—` y en `$dim`:
   **todavía no sincronizó, y eso se declara en vez de mostrar un cero.**
2. **ROLES Y COMPOSICIÓN** · vacío con invitación, no error. Dice qué falta, qué
   aporta la plantilla —«4 PESTAÑAS Y 12 MÉTRICAS HEREDABLES»— y el CTA
   `DEFINIR PRIMER ROL`.
3. **ACCESO A DATOS** · el bloque citado arriba.
4. **SUBPROCESADORES** · Snowflake, AWS y Anthropic con su región, y al pie
   «SON DE PLATAFORMA: APLICAN DESDE EL ALTA, ANTES DE QUE EXISTA UN SOLO ROL».

### 3.3 · Lo que el dibujo NO cubre y hay que proponer · **el acceso vigente**

`A2 · Ficha de cliente` —la normal— declara «acceso vigente, última verificación,
CTA para reverificar». El dibujo del tenant en alta sólo tiene el estado
`BLOQUEADO`.

**Faltan los estados intermedios**, y son los que un alta real recorre:

| Estado | Cuándo | Qué dice |
|---|---|---|
| `BLOQUEADO` | Sin roles | **Dibujado** |
| **`EN VERIFICACIÓN`** | Hay rol; el equipo interno todavía no habilitó el acceso | Qué falta y **a quién se le pidió**, sin nombrar la plomería |
| **`SIN CATÁLOGO`** | Acceso vigente pero `catalog_version` sigue en `—` | Es el estado de «falta correr el sync», dicho como consecuencia |
| **`VIGENTE`** | Todo | Última verificación · CTA reverificar · **ya está en A2 normal** |

**Propuesta: los dos del medio se dibujan.** Sin ellos, un alta que se traba se ve
igual que una recién empezada, y el super-admin no sabe si esperar o reclamar.

**Y el copy de los dos tiene que pasar §7.3**: «falta habilitar el acceso a los
datos de este cliente · pedido al equipo de datos el 3 de octubre» dice la
consecuencia y a quién, sin decir `GRANT SELECT`.

## 4 · EL RUNBOOK · el otro artefacto, y no es pantalla

Es lo que esta mañana quedó identificado como faltante. **No existe**: los dos
documentos de `docs/snowflake/` son del 2026-09-11, escritos como pedido a datos
para UA MX, y con partes vencidas.

Lo que hay que escribir es uno operable, con los siete pasos que ya están medidos
—las quince columnas, la vista de catálogo, el gobierno curado, el grant, el
`POST /admin/tenants`, el `POST /admin/agents`, y `make sync-catalog` + el
materialize— **y su verificación por paso**.

**Ese documento sí nombra bases, roles y grants.** Su lector es el equipo interno,
que es de quien §7.3 dice que opera esa capa.

## 5 ter · D1 SE REABRIÓ · 2026-10-09 (humano)

**El alta del cliente pasa a hacerse desde la pantalla, y la conexión a
Snowflake no.** Es la P3 de `AUDITORIA-2026-10-08-admin-clientes-y-usuarios.md`,
con la respuesta del humano: «debe poder entender backend cuando se agrega un
cliente a Snowflake, no dar de alta en Snowflake desde el front».

Queda en pie lo que motivó la opción (c): **ninguna credencial pasa por un
formulario**. Cambia quién crea el registro: lo crea el super-admin con los
datos de producto, y el equipo interno conecta Snowflake después.

**No se puede construir todavía**: `POST /admin/tenants` exige las credenciales,
medido el 2026-10-09 contra `9dc481e`. Pedido en
`MENSAJE-2026-10-09-backend-administracion.md`, junto con que el estado de la
conexión —que `schema-check` ya sabe calcular— viaje con el cliente.

## 5 bis · DOS DE LAS TRES ESTÁN DECIDIDAS · 2026-09-30 (humano)

**D1 → opción (c): dos altas, dos roles.** El equipo interno crea el tenant con
sus credenciales por runbook; el super-admin lo **adopta** eligiendo plantilla y
definiendo el primer rol. §7.3 queda intacta —ninguna clave privada pasa por un
formulario— y es lo único que explica por qué el dibujo muestra un tenant que
**ya existe** con `roles: []`.

**Lo que esto significa para construir:** la hoja de alta de A1 **no crea el
tenant**. A2 · `tenant en alta` es la pantalla de adopción, y sus dos CTA
—`ELEGIR PLANTILLA` y `DEFINIR PRIMER ROL`— son el trabajo real del super-admin.

**D3 → derivado, no guardado.** `EN ALTA` se deduce: un tenant con `roles: []` y
sin `catalog_version` está en alta. Un estado que se deduce no se puede quedar
desincronizado, y éste es exactamente deducible.

**Y hay una razón nueva, medida el 2026-09-30, que refuerza la elección:**
`status` llega **siempre nulo**. El campo existe en el cable desde `6e521cc` y su
propio comentario dice «reservados hasta que el cliente defina sus valores
(siempre nil en v1)». Un cuarto valor guardado sobre una columna que nadie
escribe no habría pintado nunca.

**D2 sigue abierta y es del backend.** Ver la corrección de abajo.

### Corrección a D2 · el campo existe, el mecanismo no · 2026-09-30

D2 dice «la palabra `vertical` no aparece en el código del backend», medido el
2026-09-26 contra `6e595e3`. **Eso envejeció**: `ports/tenant.go:46` declara
`Vertical *string` desde `6e521cc`, y `GET /admin/tenants` lo devuelve.

**Pero la conclusión no cambia, sólo su letra.** El campo llega siempre nulo, y
**no hay plantillas**: `/admin/templates` y `/admin/verticals` dan **404**,
medido el 2026-09-30 contra el servicio corriendo. La herencia que §3.4 describe
—plantilla → override por tenant → override por rol— sigue sin backend.

**Es el bloqueo más grande de las dos pantallas y sigue en pie.**

---

## 5 · LAS TRES DECISIONES QUE ESTO NECESITA, Y NO SON DEL FRONT

### D1 · ¿Dónde se cargan las siete credenciales de Snowflake?

`POST /admin/tenants` las exige y §7.3 prohíbe pedirlas en pantalla. **Son
incompatibles y hay que elegir:**

| | Qué implica |
|---|---|
| **a · El alta la hace el equipo interno** | La hoja de A1 crea sólo el registro de producto; las credenciales van por el runbook. Obliga a que el backend acepte un tenant sin credenciales, o a un paso previo |
| **b · Las pide la hoja, como excepción a §7.3** | Es una propuesta de spec y la decide diseño. Contra: pegar una clave privada RSA en un formulario web |
| **c · Dos altas, dos roles** | El equipo interno crea el tenant con credenciales; el super-admin lo «adopta» eligiendo plantilla. Es lo más cercano al dibujo — `axo_mx` ya existe cuando A2 lo muestra |

**Recomendación del front: (c).** Es lo único que explica por qué el dibujo
muestra un tenant que ya existe con `roles: []`, y deja §7.3 intacta sin inventar
una excepción.

### D2 · La plantilla de vertical **no existe en ningún lado**

Medido el 2026-09-26 contra `6e595e3`: la palabra `vertical` no aparece en el
código del backend y `template` son plantillas de correo. **La herencia que
`design.md` §3.4 describe —plantilla → override por tenant → override por rol—
no tiene backend.**

Y el dibujo la usa como carga: «LA PLANTILLA `retail_apparel_v2` APORTA 4
PESTAÑAS Y 12 MÉTRICAS HEREDABLES» es el texto que hace que el vacío sea una
invitación y no una queja. **Sin plantilla, ese bloque no tiene qué decir.**

**Es el bloqueo más grande de las dos pantallas**, y es de backend.

### D3 · `EN ALTA` es un cuarto estado

El dibujo pinta `ESTADO · En alta` y un chip `EN ALTA`. La decisión del
2026-09-26 fijó tres —`ACTIVO`, `PILOTO`, `SUSPENDIDO`— y descartó `ARCHIVADO` y
`BAJA` con esta razón, que aplica igual acá:

> «Inventar un estado para sostener una acción que nadie dibujó es el defecto de
> siempre.»

**Acá está al revés: el estado SÍ está dibujado y la decisión no lo contempló.**
Dos salidas: agregarlo como cuarto valor, o que `EN ALTA` sea **derivado** —un
tenant con `roles: []` y sin `catalog_version`— y no un valor guardado.

**Recomendación del front: derivado.** Un estado que se deduce no se puede quedar
desincronizado, y esto es exactamente deducible. Pero **la decisión es de
producto**, y va con la de `status`.

## 6 · El orden que propongo

1. **D1, D2 y D3** — sin ellas las pantallas se construyen sobre supuestos.
2. **El runbook interno** — no depende de ninguna decisión y destraba el alta
   real hoy, a mano.
3. **`A2 · Ficha · tenant en alta`** — está dibujada; se construye cuando D2 y D3
   estén, y su registro pasa de «no construida» a su archivo.
4. **Los dos estados intermedios de §3.3** — se dibujan primero.
5. **La hoja de alta de A1** — última, porque su forma depende enteramente de D1.

## 7 · Lo que este documento NO hace

**No modifica `design.md` ni el `.pen`.** §7.3 es normativa y el conflicto se
levanta como propuesta, que es la regla: «Donde dos fuentes difieran, gana la más
específica **y se abre una propuesta de spec**. No se resuelve en silencio.»

**Y no propone construir nada todavía.** Las tres decisiones son de producto y
diseño; las dos pantallas están dibujadas y declaradas como no construidas, que es
el estado correcto hasta que alguien decida.
