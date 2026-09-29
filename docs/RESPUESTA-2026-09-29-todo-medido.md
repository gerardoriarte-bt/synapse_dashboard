# Para el equipo de frontend · recibido, y lo que queda · 2026-09-29

> Contesta su `MENSAJE-2026-09-29-backend-todo-medido.md`, medido contra `de881e1`.
>
> **No hay commit nuevo con esta respuesta, y no hay código pendiente de nuestro lado.**
> `de881e1` sigue siendo la punta de la rama. Todo lo que queda abierto espera un archivo de
> ustedes, una IP que habilita datos o una fecha de despliegue.

## Quién tiene cada pendiente

| Pedido | Estado | Lo tiene | Qué falta |
|---|---|---|---|
| **B0.4** · errores en español | Cerrado | — | — |
| **B1.28** · `stale_since` | Cerrado | — | — |
| **B4.18** · `roles.tab_keys` | Cerrado | — | — |
| **B2.14** · `FORBIDDEN` con razón | Cerrado | — | — |
| Diff sin `null` | Cerrado | — | — |
| **B1.29** · `schema-check` | Entregado, sin medir por ustedes | Datos | Habilitar su IP en Snowflake |
| **B1.30** · `sync-catalog` | Entregado, sin medir por ustedes | Datos | Habilitar su IP en Snowflake |
| **B1.31** · `service-key` | Entregado, rotación sin probar | Ustedes | Próximo alta real |
| **B1.21** · `GET /config/plots` | Sin empezar | **Ustedes** | Enviarnos el archivo del repertorio |
| **B2.15** · prosa por agente | Código entregado | Despliegue | Prender el flag en dev; avisamos la fecha |

## Antes de medir · tres pasos, en este orden

Las dos confusiones de esta ronda (`tab_keys: []` y el `502` del alta) salieron del entorno, no
del código. Con estos tres pasos no se repiten.

### 1. Levantar con migraciones

```bash
DB_AUTO_MIGRATE=true make run
```

Sin esa variable el servicio **arranca igual y no avisa**: las columnas nuevas no existen y los
campos salen vacíos por defecto. Eso fue el `tab_keys: []` de su primera medición. Las
migraciones son idempotentes; se puede levantar siempre así en local.

`de881e1` agrega **una sola** migración respecto de `f70cec2`: `migrateDDRoleTabKeys`, que crea
`roles.tab_keys` y la rellena una vez desde `tab_ids`.

Esto vale para su base local. En dev y prod las migraciones las corre el equipo de despliegue.

### 2. Verificar que la migración corrió

En el log de arranque, la primera vez:

```
migrateDDRoleTabKeys: columna tab_keys agregada a roles
```

Y en la base, cualquiera de las dos:

```sql
SELECT column_name FROM information_schema.columns
 WHERE table_name = 'roles' AND column_name = 'tab_keys';   -- debe devolver una fila

SELECT name, tab_keys, tab_ids FROM roles ORDER BY name;      -- admin, planner y user en ["overview"]
```

Si la primera consulta no devuelve nada, el servicio se levantó sin `DB_AUTO_MIGRATE=true`.

### 3. Verificar la salida a Snowflake antes de tocar el alta

```bash
curl -s https://checkip.amazonaws.com        # su IP de salida
GET /api/v1/agents/ping                       # firma el JWT del tenant y ejecuta SELECT 1
```

| `ping` responde | Significa | A quién |
|---|---|---|
| `200` con `latency_ms` | Hay salida. `schema-check` y `sync-catalog` se pueden medir | — |
| `502` con `390422 … is not allowed to access Snowflake` | Snowflake rechaza la IP de origen | Datos |
| `502` con otro código de Snowflake | Snowflake contestó y rechazó por otro motivo (p. ej. la clave pública no está registrada) | Datos, con el código del mensaje |
| `422` | La clave guardada del tenant no sirve para firmar el JWT | Consola admin: `service-key` |
| `409` | El tenant no tiene agente activo | Consola admin |

Si `ping` no da `200`, `schema-check` y `sync-catalog` van a dar `502` por el mismo motivo y no
vale la pena medirlos.

## Los tres del alta · la prueba de que es la IP

Medimos el mismo commit desde nuestra red (2026-09-29, 10:53 COT):

```
GET /admin/tenants/3dfdd24c-…/schema-check   → 200 · ok: true  · las dos tablas Gold y la view
GET /admin/tenants/68d48f6c-…/schema-check   → 200 · ok: false · faltan los tres objetos
GET /admin/tenants/2b5008f3-…/schema-check   → 200 · ok: false · faltan los tres objetos
```

Mismo código, misma clave, otra IP: responde. La `190.27.36.15` del error es la salida de
ustedes, y la política de red de Snowflake es por IP de origen. Por eso el materializador diario
nunca se cayó con ese error: consulta desde otra red.

El `ok: false` de los dos últimos tampoco es un fallo: es la respuesta correcta para un tenant
que todavía no tiene tablas Gold ni la view del catálogo. También queda del lado de datos.

La rotación de `service-key` la dejamos como la dejaron ustedes: se prueba en el próximo alta
real, no sobre la clave que sostiene el chat.

## B1.21 · `GET /config/plots` · esperamos el archivo

`docs/ENTREGA-2026-09-29-repertorio-de-graficos.md` está en **su** repositorio; desde el nuestro
no se ve, y tampoco llegó por el canal. Necesitamos el archivo mismo, no la ruta. Es la segunda
vez que lo pedimos: sin la tabla de los 49 y el contrato de `Grafico` y `MinimoDeDatos` no hay
contra qué implementar.

Apenas llegue se implementa, y tomamos nota de las dos advertencias:

- el mínimo es de la forma, y un gráfico lo sube solo si su geometría lo exige (tres casos);
- `MinimoDeDatos` lleva `forma` porque nueve de los 49 sirven dos formas con umbrales distintos.

## B2.15 · `DD_MATERIALIZE_PROSE_ENABLED`

Sin cambios: es fecha, no código. El generador está en la rama desde `5924bf2`. El flag se prende
en dev después del próximo despliegue y les avisamos ese mismo día.

## B2.14 · sin CTA

Bien que pinten sin CTA. Una ruta para solicitar acceso no está planeada hoy; si producto la
decide, se los avisamos como pedido nuevo y no cambia la forma del estado.

## Una cuenta que no nos cierra

Dicen que de los diez quedan **siete**, y que **tres** no dependen de nosotros. Eso deja
**cuatro** de nuestro lado, pero el mensaje nombra **dos** (B1.21 y B2.15). Si los otros dos son
B2.14 y la rotación de `service-key`, están contestados arriba. Si son otros, digan cuáles y los
miramos.

## El documento que no les llegó

`RESPUESTA-2026-09-28-tres-del-alta.md` está en `docs/` de este repositorio desde `e1037d9`, así
que lo tienen en el mismo árbol que construyeron. No trae nada que no hayan medido ya: describe
las tres rutas, sus códigos de error y el orden del flujo de alta.

## Sobre el método

De acuerdo con el orden: commit primero, documento después. Así lo hacemos de acá en adelante.
