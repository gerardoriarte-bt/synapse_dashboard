# Para datos · registrar las llaves de los usuarios de servicio · 2026-10-23

**Medido contra `26eae4b` el 2026-10-23**, con el binario del backend en local,
sobre un cliente de prueba. El detalle está en
`docs/AUDITORIA-2026-10-23-usuarios-de-servicio.md`.

Gracias por los dos usuarios de servicio y por el rol de Terpel. Con eso
dejamos `LUIS_ROJAS` y `SYSADMIN`.

## Un cambio en cómo llega la llave

**El par no lo genera una persona con openssl.** La plataforma ya tiene cómo:
genera el par, guarda la privada cifrada en el cliente y muestra la pública.
La privada no sale del servidor. Desde la ficha del cliente, el equipo interno
les pasa dos cosas por cliente:

- **La pública, sin las líneas `BEGIN` y `END`**, en una sola línea. Es como la
  pide `ALTER USER`.
- **La huella**, `SHA256:…`. Es la misma que Snowflake muestra en
  `RSA_PUBLIC_KEY_FP`.

## Lo que les pedimos, por usuario

**Antes de la llave** (pueden hacerlo ya):

1. **Otorgarle el rol**: `GRANT ROLE <rol> TO USER <usuario>`.
2. **Fijar el rol y el warehouse por defecto**: `DEFAULT_ROLE` y
   `DEFAULT_WAREHOUSE`. Las consultas mandan el rol, pero el chat todavía no,
   y sin esto usaría `PUBLIC`.
3. **`USAGE` del rol sobre el warehouse.** Para Terpel ya lo dijeron. Les
   pedimos confirmarlo para `RL_HNO_KY_BI` sobre `WH_HNO_KY_BI`.
4. **La política de red**: si el usuario tiene una propia, que incluya la IP de
   salida del backend de QA, la misma que habilitaron para UA.

| Usuario | Rol | Warehouse |
|---|---|---|
| `SVC_SYNAPSE_KERALTY` | `RL_HNO_KY_BI` | `WH_HNO_KY_BI` |
| `SVC_SYNAPSE_TERPEL_COMBS` | `RL_BT_TERPEL_COMBS_CLIENT_BI` | `WH_BT_TERPEL_COMBS_BI` |

**Con la llave** (cuando se la pasemos):

```sql
ALTER USER SVC_SYNAPSE_KERALTY SET RSA_PUBLIC_KEY = '<pública de Keralty>';
DESC USER SVC_SYNAPSE_KERALTY;  -- RSA_PUBLIC_KEY_FP tiene que ser la huella
```

Y lo mismo con `SVC_SYNAPSE_TERPEL_COMBS`.

**El tiempo importa.** Al generar la llave, el cliente queda sin conexión hasta
que la registren y cambiemos el usuario. Hoy no se ve ninguna cifra de los dos,
así que no se pierde nada, pero conviene hacerlo en el mismo rato. Les avisamos
antes de generarla.

## Después

- **Con los dos clientes pasados**, Synapse deja de usar `LUIS_ROJAS` y
  `SYSADMIN`. Si ese usuario tiene una pública registrada sólo para Synapse,
  pueden quitarla.
- **Esto no trae cifras todavía.** El catálogo de cada cliente se lee, pero
  ninguna de sus métricas tiene cálculo. Eso lo decide el backend con B1.26 y
  se lo pedimos el 22.
