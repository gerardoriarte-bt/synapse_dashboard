# Respuesta de datos · usuarios de servicio y rol de Terpel · 2026-10-22

> **Histórico.** Transcripción de la respuesta de datos al pedido
> `docs/MENSAJE-2026-10-21-datos-usuario-y-rol-de-servicio.md`, tal como la
> pasó el humano el 2026-10-22. No se actualiza.

**1 · Usuarios de servicio**, que reemplazan a `LUIS_ROJAS`:

| Cliente | Usuario | Tipo | Rol | Warehouse |
|---|---|---|---|---|
| Keralty | `SVC_SYNAPSE_KERALTY` | SERVICE | `RL_HNO_KY_BI` | `WH_HNO_KY_BI` |
| Terpel | `SVC_SYNAPSE_TERPEL_COMBS` | SERVICE | `RL_BT_TERPEL_COMBS_CLIENT_BI` | `WH_BT_TERPEL_COMBS_BI` |

**2 · Rol de sólo lectura de Terpel.** Usaron `RL_BT_TERPEL_COMBS_CLIENT_BI`,
que ya existía vacío para esto, en vez de crear uno nuevo. Tiene USAGE en la
base y el esquema, SELECT ALL y FUTURE, y el warehouse. La prueba del catálogo
desde ese contexto devolvió 10 filas.

**3 · Llaves RSA.** Está documentado en su `GRANT_ACCESS.sql`, sección 5.3. El
backend genera el par, guarda la privada y les pasa la pública para:

```sql
ALTER USER SVC_SYNAPSE_KERALTY SET RSA_PUBLIC_KEY = '<PEM_PUBLICO_KERALTY>';
ALTER USER SVC_SYNAPSE_TERPEL_COMBS SET RSA_PUBLIC_KEY = '<PEM_PUBLICO_TERPEL>';
```
