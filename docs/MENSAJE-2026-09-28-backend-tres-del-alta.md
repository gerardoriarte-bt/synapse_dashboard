# Para el equipo de backend · tres pedidos chicos que destraban el alta de un cliente · 2026-09-28

> Producto decidió hoy optimizar el alta de clientes nuevos para que sea **lo más
> fácil posible**. Medimos qué la encarece y salieron tres cosas, **las tres
> suyas y ninguna grande**.
>
> **Antes de pedirlas revisamos qué ya existe**, que es lo que nos faltó hacer el
> 25 cuando les dijimos que no emitían dos formas que emitían hacía cuatro días.
> Listamos las **78 rutas que su binario registra al arrancar** y encontramos dos
> que no conocíamos. Una de ellas **ya resuelve la mitad del pedido 1**, y por eso
> el pedido es más chico de lo que iba a ser.

## Lo que medimos, y es el diagnóstico

**El costo de un alta no está en la cantidad de pasos: está en dos silencios.**

| Silencio | Qué pasa hoy |
|---|---|
| Falta una columna en el esquema del cliente | El panel sale `BLOCKED` **sin razón**. No dice qué columna ni que el problema sea de esquema |
| Una `METRIC_KEY` no cae en `MetricRegistry` | Sincroniza bien, compone bien, y **después** sale bloqueado |

Los dos se descubren al final, y los dos se ven igual. Eso es lo que convierte un
alta en un día de depuración.

---

## 1 · Verificar el CONTRATO DE ESQUEMA · y ya tienen media pieza

### Lo que encontramos que ya existe

**`GET /api/v1/agents/ping`** · lo medimos contra `f70cec2`:

```json
{"agent_name":"Synapse UA","status":"ok","latency_ms":898,
 "base_url":"https://…snowflakecomputing.com"}
```

y su propio comentario dice qué hace: *«Firma el JWT con las credenciales del
tenant y ejecuta `SELECT 1` contra Snowflake»* (`agent_handler.go:24`).

**Eso resuelve la mitad credencial del problema y no lo sabíamos.** Con eso, en un
alta ya se puede comprobar que la clave RSA, el rol y el warehouse funcionan
**antes** de intentar nada.

**Y también miramos `GET /admin/tenants/{id}/catalog/health`**, que no conocíamos.
No es esto: contesta **frescura de feeds por métrica** —`status`, `last_load_at`,
`freshness_hours`—, que es otra pregunta y está bien resuelta.

### Lo que falta · la mitad de ESQUEMA

Lo que ninguna de las dos contesta es: **¿el `db.schema` de este cliente tiene la
forma que el materializador necesita?**

Son dos `DESCRIBE` y una comparación de listas:

| Objeto · en `<agent.db>.<agent.schema>` | Columnas |
|---|---|
| `GLD_ECOMM_DAILY_PERFORMANCE` | `DATE` `REV_TOTAL` `REV_TARGET` `ORDERS_TOTAL` `ORDERS_TARGET` `UNITS_TOTAL` `UNITS_TARGET` `VISITS_TOTAL` `VISITS_TARGET` `GROSS_SPEND` `BUDGET_TARGET` |
| `GLD_PAID_MEDIA` | `DATE` `FUENTE` `COST_USD` `INGRESOS_USD` |
| `SYNAPSE_METRIC_CATALOG` | las doce de su `SELECT` en `dd_catalog_sync_service.go:69` |

**Lo pedimos como hermana de `ping`**, porque ya tienen ahí la firma del JWT, el
cliente SQL y la forma de respuesta:

```
GET /api/v1/admin/tenants/{tenantId}/schema-check
```

```json
{ "ok": false,
  "objetos": [
    { "nombre": "GLD_ECOMM_DAILY_PERFORMANCE", "existe": true,
      "faltan": ["BUDGET_TARGET"] },
    { "nombre": "GLD_PAID_MEDIA", "existe": true, "faltan": [] },
    { "nombre": "SYNAPSE_METRIC_CATALOG", "existe": false, "faltan": [] } ],
  "afecta": ["goal_attainment"],
  "claves_sin_query": ["ventas"] }
```

### Los dos campos que hacen que valga la pena

**`afecta`** es el que convierte el chequeo en una decisión. «Falta
`BUDGET_TARGET`» no le dice nada a nadie; «no vas a poder tener `goal_attainment`»
sí. Ustedes ya tienen el mapa que lo resuelve —qué query usa qué columna—, y
nosotros no.

**`claves_sin_query`** cierra el segundo silencio: las `METRIC_KEY` del catálogo
del cliente que no caen en `MetricRegistry` ni por alias. Es un `diff` entre lo
que devuelve la vista y las doce claves de `keys.go`.

**Con esos dos campos el alta deja de fallar al final.** Y del lado nuestro esto
**sí puede tener pantalla**: su salida es consecuencia —«este cliente no va a
poder tener Cumplimiento de objetivo»— y no infraestructura, que es lo que §7.3
de nuestro diseño permite mostrar.

---

## 2 · `sync-catalog` como ruta HTTP

Medido el 2026-09-28:

| | |
|---|---|
| `POST /admin/tenants/{id}/materialize` | **202** ✓ |
| `POST /admin/tenants/{id}/sync-catalog` | **404** |

**Es lo único en toda el alta que obliga a entrar a la máquina del backend.** Todo
lo demás —crear el tenant, crear el agente, materializar— tiene ruta.

Pedimos la simétrica de materialize:

```
POST /api/v1/admin/tenants/{tenantId}/sync-catalog   → 202
```

**No es comodidad.** Es lo que separa «hay un proceso» de «hay un alta»: con esa
ruta, dar de alta un cliente deja de necesitar a alguien con acceso al servidor.

---

## 3 · Que la plataforma genere el par de claves RSA

`POST /admin/tenants` exige `private_key_pem`. Eso significa que hoy, por cada
cliente, **alguien genera un par a mano y transporta una clave privada** hasta
donde se haga el alta.

Buscamos si ya lo generan y no: no hay `rsa.GenerateKey` en `internal/`.

### Lo que proponemos

```
POST /api/v1/admin/tenants/{tenantId}/service-key   → { public_key_pem }
```

El servicio genera el par, guarda la privada cifrada como ya hace, y devuelve
**sólo la pública**, para que el admin de Snowflake del cliente la registre en su
usuario de servicio.

| | Hoy | Con esto |
|---|---|---|
| Quién genera | Una persona | El servicio |
| Qué circula | **La privada** | **La pública** |
| Pasos | Generar · transportar · pegar | Copiar la pública |

**Es más fácil y además más seguro**, que es la combinación que no obliga a
elegir. Y el ciclo se cierra solo con lo que ya tienen: generar → el cliente
registra la pública → **`GET /agents/ping` confirma que funciona**.

Eso implica que `private_key_pem` deje de ser obligatorio en el alta, o que haya
un orden —crear el tenant, pedir la clave, completar—. **Cuál de los dos es
decisión suya**; nosotros no dependemos de la forma.

---

## Por qué estos tres y no otros

Ordenados por cuánto ahorran por cliente nuevo dividido por lo que cuestan:

| | Qué ahorra | Tamaño |
|---|---|---|
| **1 · `schema-check`** | Convierte un día de depuración en un minuto | Dos `DESCRIBE` y un `diff`, sobre piezas que ya tienen |
| **2 · `sync-catalog`** | Saca la única dependencia de acceso al servidor | Una ruta sobre un comando que ya existe |
| **3 · `service-key`** | Saca un paso manual y un canal de secreto por cliente | Generación de clave + un campo opcional |

**Ninguno cambia el modelo de datos** y ninguno depende de los otros dos: se
pueden tomar sueltos y en cualquier orden.

## Lo que NO pedimos, y conviene decirlo

- **No pedimos tocar el `MetricRegistry`.** La discusión de si el registro debe
  ser dato sigue abierta de nuestro lado —es `B1.26`— y **el pedido 1 la vuelve
  menos urgente**, porque el silencio que la hacía doler se cierra con
  `claves_sin_query`.
- **No pedimos nada de plantillas de vertical** en este mensaje, aunque es lo que
  más ahorraría a partir del segundo cliente. Es más grande y va aparte.
- **No pedimos cambiar `catalog/health` ni `agents/ping`.** Las dos hacen bien lo
  suyo; el pedido 1 es la pieza que falta al lado, no un reemplazo.
