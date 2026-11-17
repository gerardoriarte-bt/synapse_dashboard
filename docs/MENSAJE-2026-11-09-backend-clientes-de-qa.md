# Para el equipo de backend · ordenar los clientes de QA · 2026-11-09

**Medido contra `dc58ef5` el 2026-11-09**, leyendo su rama
`feature/dynamic-dashboard-backend`: las rutas de `/admin/tenants` en
`router.go` y lo que acepta `UpdateSettings` en `tenant_handler.go`. Del
servicio de QA, ese mismo día y sólo con `GET`, desde la sesión de un
superadmin: `/admin/tenants` y, por cada cliente, sus usuarios, dashboards,
agentes, feeds y catálogo.

Hola. QA tiene cinco clientes y dos sobran. Queremos dejar sólo los reales, y
para quitar uno **no hay ruta**: en `router.go` los únicos `DELETE` bajo
`/tenants` son de usuarios, agentes y feeds. Por eso se lo pedimos a ustedes.

## 1 · Lo que hay hoy en QA

| Cliente | Usuarios | Dashboards | Agente → esquema | Moneda |
|---|---|---|---|---|
| Synapse UA HTML | 12 | UA MX, Overview | «Under Armour México» → `BT_UA_MART_ANALYTICS` | es-MX · USD |
| Lobueno Analytics | **0** | Overview | «Synapse UA» → `BT_UA_MART_ANALYTICS` | es-CO · COP |
| Lobueno Analytics Terpel | 10 | Overview | Terpel Combustibles y Terpel Lubricantes | es-CO · COP |
| Keralty | 8 | Overview | Keralty → `HNO_KY_MART_ANALYTICS` | es-CO · COP |
| Sistema | 2 | Overview | **ninguno** | es-CO · COP |

**«Synapse UA HTML» es Under Armour**: tiene a los usuarios de UA, el
dashboard «UA MX» y la moneda correcta. **«Lobueno Analytics» lee el mismo
esquema de UA, pero no tiene usuarios** y está en pesos colombianos. Es una
copia de UA que quedó de las pruebas.

## 2 · Lo que pedimos

### Quitar «Lobueno Analytics»

No tiene usuarios. Sí tiene un dashboard publicado el 2026-11-04, su agente,
cuatro feeds y 41 métricas en su catálogo.

**Preferimos que se desactive y no que se borre**, si tienen forma de
hacerlo. `/admin/tenants` devuelve un campo `status`, que hoy está reservado y
siempre viene nulo. Si un cliente desactivado deja de aparecer en
`/admin/tenants` y en la lista pública del formulario de acceso, y el
programador deja de materializarlo, alcanza. **El mecanismo lo deciden
ustedes.**

**Mientras tanto, el programador sigue consultando Snowflake por ese
cliente**, porque su agente está activo. Su `router.go` ya tiene la ruta que
lo desactiva (`agentHandler.DeactivateForTenant`). Nosotros no la tenemos
transcripta, así que preferimos que lo hagan ustedes, o que nos confirmen que
la podemos usar.

### «Sistema»: una pregunta antes de quitarlo

No tiene agente, así que no muestra datos. Su `created_at` es
`0001-01-01`, que parece un registro sembrado. El 2026-10-13 nos dijeron que
el código no lo trata como cliente de plataforma.

**Pero tiene dos usuarios**, uno `admin` y otro `user`. Antes de quitarlo
necesitamos saber:

1. ¿De quién son esas dos cuentas? Si alguna es de una persona del equipo,
   ¿hay que pasarla a otro cliente primero?
2. ¿Alguna parte del servicio o de la semilla lo necesita? Por ejemplo, el
   cliente por defecto de un usuario nuevo.

Si las dos respuestas son que no, va igual que «Lobueno Analytics».

### Renombrar «Synapse UA HTML»: no es un pedido

Pasa a llamarse **«Under Armour MX»**. Lo hacemos nosotros con
`PUT /admin/tenants/{tenantId}`, que ya acepta `name`. Se lo avisamos para que
no les sorprenda en la base.

## 3 · Cómo lo comprobamos

`GET /admin/tenants` devuelve cuatro clientes: Under Armour MX, Lobueno
Analytics Terpel, Keralty y, si se queda, Sistema. Los usuarios de UA siguen
entrando a su dashboard «UA MX» como antes.

Gracias.
