# Para el equipo de backend · Terpel en tres clientes, y la zona horaria en QA · 2026-11-20

**Medido contra `fb3ca0c` el 2026-11-20**. Del código leí el `Dockerfile`,
`tenant_service.go` (`Create`), `dd_seed.go` (`seedDDDefaultDashboard`),
`dd_dashboard_access.go`, `domain/user.go` y `agent_repository.go`
(`FindByTenantAndRole`). En QA, ese mismo día y como superadmin: la conexión
de Terpel, «Cargar meses» de julio a noviembre, el alta de dos clientes,
`PUT /admin/tenants/{tenantId}` y la consola.

Hola. Terpel ya consulta como `SVC_SYNAPSE_TERPEL_COMBS`, y las 8 métricas de
pauta salen con cifra. Al mirarlo en la consola vimos que la pauta trae tres
líneas de negocio, y producto decidió que **cada una sea un cliente**:
«Terpel Combustibles» (el de siempre, renombrado), «Terpel Lubricantes» y
«Terpel Lealtad». Los dos nuevos los dimos de alta en QA. Datos separa las
vistas.

**De su lado no hace falta código para separar los clientes**: las consultas
de pauta usan la vista sin base ni esquema, y el agente de cada cliente los
pone. Lo que sigue apareció al hacerlo.

## 1 · QA no reconoce ninguna zona horaria · el más importante

El alta de un cliente con `"timezone": "America/Bogota"` contesta **400 ·
«no es una zona IANA válida»**, y `PUT /admin/tenants/{tenantId}` con el mismo
valor sobre Terpel, que ya lo tiene, también. Es lo que pasó el 2026-10-02:
el `Dockerfile` arma la imagen sobre `alpine:latest` sin `tzdata`, y nada
importa `time/tzdata`, así que `time.LoadLocation` falla con cualquier zona.

**El 400 es lo de menos.** `tenantNow` cae a UTC cuando `LoadLocation` falla,
así que **en QA todos los clientes calculan el mes en UTC**, sin aviso. Las
cinco últimas horas de cada mes en Colombia quedan en el mes siguiente.

**Y los reportes por correo también**: `NextReportRun`
(`dd_report_schedule.go`) cae a UTC con la misma falla. Un reporte a las 08:00
«hora del cliente» saldría en QA a las 03:00 de Bogotá, y la pantalla, que
muestra la hora del cliente, diría «03:00».

**Pedido:** `apk add --no-cache tzdata` en la imagen de ejecución, o
`import _ "time/tzdata"` en el binario. Lo segundo no depende de la imagen.

Mientras tanto, a los dos clientes nuevos los dimos de alta en `UTC`, que es lo
único que acepta, y con eso calculan igual que los demás. Apenas esté el
arreglo les ponemos `America/Bogota`.

## 2 · La semilla de UA se aplica a todos los clientes

`seedDDDefaultDashboard` corre en cada arranque **para todos los tenants**:
crea las métricas de la semilla y el dashboard Overview. Por eso:

- **Terpel calcula 12 métricas de UA todos los meses, y las 12 fallan**: buscan
  `GLD_ECOMM_DAILY_PERFORMANCE` y `GLD_PAID_MEDIA`, que Terpel no tiene. Cada
  carga termina en 8 disponibles, 2 bloqueadas y 12 con error, y en Salud de
  feeds parece que falla la mitad.
- **Overview vuelve.** Armamos «Terpel · Pauta digital» y sacamos Overview de
  los cinco roles con `PUT /admin/roles/{roleId}/dashboards`. Pero una lista
  vacía significa «todos» (`roleCanSeeDashboard`), así que cualquier rol nuevo
  lo ve. Los dos clientes nuevos lo van a recibir en el próximo arranque.

**Pedido:** que la semilla no se aplique a un cliente que no es UA, o que se
pueda apagar por cliente. Y que un dashboard se pueda archivar.

## 3 · Un usuario no puede estar en dos clientes

Producto quiere que algunas personas, quizás todas por ahora, vean Combustibles
y Lubricantes. Hoy un usuario tiene un solo `TenantID` y su correo es único en
toda la base (`uniqueIndex`), así que no se puede. Solo un `superadmin` cambia
de cliente, y ese rol es interno.

**Pregunta:** ¿cómo lo resolverían? Lo que nos serviría es lo mismo que ya
hace `POST /auth/switch-tenant`, pero para un usuario con acceso a varios
clientes. Hasta entonces, los usuarios se quedan en Terpel Combustibles.

## 4 · El chat necesita un agente por rol

`FindByTenantAndRole` da un agente por rol, así que para que los tres roles de
un cliente tengan chat creamos **tres agentes iguales**: «Terpel Combustibles ·
admin», «· Planner» y «· user», los tres sobre la misma base y el mismo agente
de Cortex. Lo mismo en Lubricantes.

Funciona, pero cambiar el almacén virtual es cambiarlo tres veces. **Pregunta,
sin urgencia:** ¿se puede tener un agente por cliente que atienda a todos sus
roles, y uno por rol solo cuando haga falta?

Gracias.
