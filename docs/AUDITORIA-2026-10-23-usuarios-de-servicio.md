# Auditoría · pasar Keralty y Terpel a sus usuarios de servicio · 2026-10-23

> **Histórico.** Un cruce puntual, con fecha. No se actualiza.

**Qué se miró:**

- La respuesta de datos, `docs/RESPUESTA-2026-10-22-datos-usuarios-de-servicio.md`.
- El código del backend en `26eae4b`: `tenant_key_service.go`,
  `dd_onboarding_handler.go`, `agent_handler.go`, `agent_service.go`,
  `snowflake_config.go`, `snowflake_sql_client.go`, `snowflake_jwt.go`,
  `dd_panel_access.go` y `router.go`.
- El binario de ese commit corriendo en local, con la base de `dev/postgres`,
  sobre **un cliente y un agente de prueba**. No se tocó la llave de UA, que es
  la real.

**Nada contra QA.** Todo lo de abajo es una escritura, y QA es de sólo lectura
para nosotros.

Sigue a `docs/AUDITORIA-2026-10-22-catalogo-de-keralty-y-terpel.md`.

---

## Lo que trae la respuesta de datos

| Cliente | Usuario nuevo | Rol | Warehouse | Hoy |
|---|---|---|---|---|
| Keralty | `SVC_SYNAPSE_KERALTY` | `RL_HNO_KY_BI` · el mismo | `WH_HNO_KY_BI` | `LUIS_ROJAS` · `RL_HNO_KY_BI` |
| Terpel | `SVC_SYNAPSE_TERPEL_COMBS` | `RL_BT_TERPEL_COMBS_CLIENT_BI` · sólo lectura | `WH_BT_TERPEL_COMBS_BI` | `LUIS_ROJAS` · `SYSADMIN` |

Datos propone que el backend genere el par con openssl, cargue la privada «en
su secreto» y les pase la pública.

## Lo que encontró la medición

**1 · El servicio ya genera el par, y es mejor que openssl a mano.**
`POST /admin/tenants/{tenantId}/service-key` genera un RSA de 2048, guarda la
privada **cifrada en la fila del cliente** y devuelve la pública con su huella.
La privada no sale del servidor ni pasa por una persona. Medido:

| Pedido | Respuesta |
|---|---|
| `GET` sin llave | **404** `NOT_FOUND_KEY` |
| `POST` sin cuerpo | **201** · `public_key_pem`, `fingerprint`, `generated_at` |
| `POST` otra vez, sin `rotate` | **409** `CONFLICT_KEY_EXISTS` |
| `GET` | **200** · la pública y la huella, sin `generated_at` |
| `POST` con `rotate: true` | **201** · otra huella |

**La llave es del cliente, no del entorno.** No hay un «secreto» por cliente en
el despliegue: la privada vive en `tenants`, junto con la cuenta, el usuario y
el rol. Por eso conviene que el backend **no** la genere con openssl: el camino
del producto ya existe, y uno paralelo es una privada que circula.

**La huella es la que Snowflake muestra** como `RSA_PUBLIC_KEY_FP` en
`DESC USER`. Así datos confirma que registró la correcta sin que nadie compare
textos de 400 caracteres.

**2 · Reemplazar la llave corta la conexión, y no tiene vuelta atrás.** Hay una
sola privada por cliente y la consulta la firma con lo que haya en ese momento.
No hay caché del JWT (`snowflake_jwt.go`). Con la llave nueva y `LUIS_ROJAS`
todavía como usuario, Snowflake rechaza. La privada vieja se pisa, así que no
se puede volver a `LUIS_ROJAS` sin registrarle la pública nueva. **Hoy no se
pierde nada visible**: los dos clientes no muestran cifras.

**3 · El warehouse vive en el agente, no en el cliente.** La consulta manda el
warehouse del agente que resuelve (`statementRequest`, `snowflake_sql_client.go`),
y `resolveTenantAgent` elige el del rol de producto o el primero de la lista.
**Un cliente con varios agentes tiene un warehouse por agente**, y hay que
cambiarlos todos.

**4 · El warehouse no se valida.** Medido con `PUT …/agents/{agentId}`:
`"  WH_NUEVO  "` queda con los espacios, y `""` da **200** y deja al agente sin
warehouse. El `PUT` del cliente, en cambio, recorta y da 400 con vacío. El front
recorta y no manda un valor en blanco. Se les avisa, sin pedido.

**5 · El chat con Cortex sigue sin mandar el rol**, ya anotado el 2026-10-21.
Con el usuario nuevo, el chat usa **el rol por defecto del usuario**. Datos lo
cubre fijando `DEFAULT_ROLE`.

## Lo que se construyó · F5.56

En la ficha, con alcance de plataforma, «Acceso a datos» tiene ahora tres
partes, en el orden en que se cambia de usuario:

1. **Llave de servicio.** Generar, o reemplazar con confirmación. Muestra la
   huella y la pública **sin los delimitadores**, que es como la pide
   `ALTER USER … SET RSA_PUBLIC_KEY`, con un botón para copiarla.
2. **Conexión · equipo interno.** La de F5.55: usuario, rol, cuenta y URL, y
   verificar.
3. **Almacén virtual de cada agente.** Una fila por agente, con el actual y el campo
   para cambiarlo.

Un admin de un cliente no ve ninguna de las tres, y la llave ni se pide.
Mirado en el navegador contra `26eae4b` en local: generar, reemplazar con
confirmación y cambiar el warehouse con espacios, que quedó recortado en el
servicio.

## El procedimiento, cliente por cliente

**Antes, de datos, una vez por usuario:**

- El rol otorgado al usuario: `GRANT ROLE … TO USER …`.
- `DEFAULT_ROLE` y `DEFAULT_WAREHOUSE` fijados. La consulta manda el rol, pero
  el chat no.
- El rol con `USAGE` sobre el warehouse.
- Si el usuario tiene una política de red propia, que incluya la IP de salida
  del backend de QA.

**Después, en este orden y sin pausas largas entre 1 y 4:**

| # | Quién | Qué |
|---|---|---|
| 1 | Superadmin, en la ficha | «Generar llave», o «Reemplazar la llave» si ya tiene. Copiar la pública y la huella |
| 2 | Datos | `ALTER USER <usuario nuevo> SET RSA_PUBLIC_KEY = '<pública>'`, y `DESC USER` para comparar `RSA_PUBLIC_KEY_FP` con la huella |
| 3 | Superadmin | En «Corregir la conexión»: el usuario nuevo y, en Terpel, el rol nuevo. «Guardar y verificar» |
| 4 | Superadmin | El warehouse en **cada** agente del cliente |
| 5 | Superadmin | «Verificar ahora» |

**Lo que tiene que decir la verificación:** el usuario nuevo y su rol,
`SYNAPSE_METRIC_CATALOG` en «Está», y las dos tablas GLD en «No está». Lo
segundo es correcto hoy: es B1.26, y no depende del usuario.

**Si falla el paso 5**, el mensaje dice cuál de las cuatro cosas es:

- 401 o error de JWT: la llave no está registrada o la huella no coincide.
- Rol no otorgado: falta el `GRANT ROLE`.
- Error de warehouse: falta el `USAGE`, o un agente quedó con el viejo.
- Error de red: la política del usuario.

**Después de los dos clientes:** `LUIS_ROJAS` y `SYSADMIN` dejan de usarse
desde Synapse. Lo que haga datos con ellos es suyo.

## Lo que no destraba

**Las cifras.** Con el usuario bien conectado, Keralty y Terpel siguen sin
métricas calculables. Es la decisión de B1.26 que pide
`docs/MENSAJE-2026-10-22-backend-b126-con-dos-clientes.md`. Esto arregla la
seguridad del acceso, no los datos.
