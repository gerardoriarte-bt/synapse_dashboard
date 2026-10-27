# Instrucciones · pasar Keralty y Terpel a sus usuarios de servicio · 2026-10-27

> **Histórico.** Un procedimiento con fecha, para hacerlo una vez. No se actualiza.

**Medido el 2026-10-27:**

- El front que sirve `qa-synapse.lobueno.co` ya trae «Llave de servicio» y
  «Almacén virtual de cada agente» (F5.56). Se leyó el bundle publicado; no se
  escribió nada en QA.
- La ficha mostró la misma pública en Keralty y en Terpel. Se comparó byte a
  byte y se leyó en el backend (`d296e6d`) por qué: ver el paso 1.

El porqué de cada paso está en `docs/AUDITORIA-2026-10-23-usuarios-de-servicio.md`.

---

## Quién hace qué

| # | Quién | Qué | Estado |
|---|---|---|---|
| 1 | Superadmin, en la ficha | **Reemplazar** la llave de cada cliente y copiar la pública y la huella | **Pendiente en los dos** |
| 2 | **Datos** | Registrar cada pública en su usuario y comprobar la huella | Pendiente |
| 3 | Superadmin, en la ficha | Cambiar el usuario y, en Terpel, el rol | Después del 2 |
| 4 | Superadmin, en la ficha | Cambiar el almacén virtual en **cada** agente | Después del 2 |
| 5 | Superadmin, en la ficha | «Verificar ahora» | Al final |

**Del 1 al 4 hay que hacerlo el mismo día.** Desde que se genera la llave, el
cliente queda sin conexión hasta que datos la registre y se cambie el usuario.
Hoy no se pierde nada visible, porque ninguno de los dos muestra cifras.

---

## Paso 1 · Generar la llave · superadmin

En Administración, abrir el cliente y bajar a «Acceso a datos» →
«Llave de servicio».

1. Si dice «Este cliente no tiene llave», apretar «Generar llave». Si ya tiene
   una, apretar «Reemplazar la llave» y luego «Sí, reemplazar».
2. Apretar «Copiar la pública». Sale sin las líneas `BEGIN` y `END` y en una
   sola línea, que es como la pide Snowflake.
3. Copiar también la **Huella** (`SHA256:…`).

**Cada cliente tiene su propia llave, y dos clientes nunca dan la misma.** Si
dos públicas salen iguales, se copió dos veces la misma.

### Lo que pasó el 2026-10-27 · la ficha mostró la misma llave en los dos

La ficha de Keralty y la de Terpel mostraron **la misma pública**, idéntica byte
a byte:

```
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA35xmf6T+vUeCEcXjB2b3Xat4BhQ9AqNJRvff35wcI8XxrjpWgFq1vE7CfZGtZh/eE6lIwHpMFx+VautdTclmHwo0qqs0j9sj91jM0suikWfSH0s0RrWV1K/knV7zevaHlc713IgCdbT07lPIOe+gZpSrFk7luQC/0KTbXNzbnPM0UHYbVsvzfFR/MZRNHPhSwVPIqSBgq2o2qP4R+UK5b7m3i2RXmmu3D7qs4ZFxPy9t23GLcq5i44BECcw6LWDlwrio9S/V/R8Yp8SMIP9WNnBgl+6nazuCBhCD/zBb3YjU6DEBEPZ4aOO8KtXSpD+wkZZqxtM281xDRmP0vW84fwIDAQAB
```

Huella: `SHA256:P+H8FZWITRF3ZU0Moa/adFu2CDpGx7YKnAem+uCkBHU=`.

**No es una llave generada ahora, y no se registra.** Leído en el backend
(`d296e6d`, `tenant_key_service.go`):

- **Generar crea un par nuevo cada vez**, con `crypto/rand`. Dos generaciones
  no pueden dar la misma llave.
- **Si el cliente ya tiene llave, la ficha muestra la GUARDADA**: el `GET` la
  deriva de la privada que está en la fila del cliente.
- Por lo tanto **los dos clientes tienen guardada la misma privada**. Es la de
  `LUIS_ROJAS`, el usuario personal con el que se dieron de alta los dos
  (`docs/AUDITORIA-2026-10-21-keralty-con-su-rol.md`), cargada a mano y la
  misma en ambos.

Registrarla en los usuarios nuevos andaría, y es justo lo que este cambio
quiere evitar: esa privada se generó fuera de la plataforma, pasó por manos, y
con ella se podría entrar como los dos usuarios de servicio a la vez.

**Lo que hay que hacer: «Reemplazar la llave» en cada cliente**, no «Copiar la
pública». Así cada cliente queda con su propia privada, generada en el
servicio, que no sale de ahí.

### Cómo saber que la llave es la correcta

- **Las dos públicas son distintas**, y ninguna empieza con `…AQEA35xmf6T+…`.
- **La huella de la ficha cambia** al reemplazar: deja de ser
  `SHA256:P+H8FZWI…`.

Reemplazar corta la conexión con `LUIS_ROJAS` en los dos clientes. Hoy no se
pierde nada visible: ninguno muestra cifras.

---

## Paso 2 · Registrar las llaves · se le pide a datos

Mensaje listo para mandar. Antes de enviarlo, reemplazar los cuatro marcadores
con lo que muestre la ficha **después de reemplazar**. Las dos públicas tienen
que ser distintas.

> Hola. Les paso las públicas de los usuarios de servicio, generadas por la
> plataforma. La privada queda guardada en el servicio y no sale de ahí.
>
> ```sql
> ALTER USER SVC_SYNAPSE_KERALTY SET RSA_PUBLIC_KEY = '<PÚBLICA DE KERALTY>';
> DESC USER SVC_SYNAPSE_KERALTY;
>
> ALTER USER SVC_SYNAPSE_TERPEL_COMBS SET RSA_PUBLIC_KEY = '<PÚBLICA DE TERPEL>';
> DESC USER SVC_SYNAPSE_TERPEL_COMBS;
> ```
>
> En cada `DESC USER`, `RSA_PUBLIC_KEY_FP` tiene que coincidir con:
>
> - Keralty: `<HUELLA DE KERALTY>`
> - Terpel: `<HUELLA DE TERPEL>`
>
> Y para cada usuario, por favor confirmen:
>
> 1. El rol otorgado: `GRANT ROLE <rol> TO USER <usuario>`.
> 2. `DEFAULT_ROLE` y `DEFAULT_WAREHOUSE` fijados. Las consultas mandan el rol,
>    pero el chat todavía no.
> 3. `USAGE` del rol sobre su warehouse.
> 4. Si el usuario tiene una política de red propia, que incluya la IP de salida
>    del backend de QA, la misma que habilitaron para UA.
>
> | Usuario | Rol | Warehouse |
> |---|---|---|
> | `SVC_SYNAPSE_KERALTY` | `RL_HNO_KY_BI` | `WH_HNO_KY_BI` |
> | `SVC_SYNAPSE_TERPEL_COMBS` | `RL_BT_TERPEL_COMBS_CLIENT_BI` | `WH_BT_TERPEL_COMBS_BI` |
>
> Avísenme cuando esté. Hasta que lo registren, el cliente queda sin conexión.

---

## Pasos 3 a 5 · Cambiar la conexión · superadmin, cuando datos confirme

En la ficha de cada cliente, en «Acceso a datos»:

**3 · «Corregir la conexión»**

| Cliente | Usuario | Rol |
|---|---|---|
| Keralty | `SVC_SYNAPSE_KERALTY` | `RL_HNO_KY_BI`, no cambia |
| Terpel | `SVC_SYNAPSE_TERPEL_COMBS` | `RL_BT_TERPEL_COMBS_CLIENT_BI`, **cambia**: hoy dice `SYSADMIN` |

Apretar «Guardar y verificar».

**4 · «Almacén virtual de cada agente»**

Poner el almacén en **cada** agente del cliente: el warehouse vive en el agente,
y uno que quede con el viejo sigue fallando.

| Cliente | Almacén virtual |
|---|---|
| Keralty | `WH_HNO_KY_BI` |
| Terpel | `WH_BT_TERPEL_COMBS_BI` |

**5 · «Verificar ahora»**

Lo correcto es:

- El usuario nuevo y su rol.
- `SYNAPSE_METRIC_CATALOG` en «Está».
- Las dos tablas GLD en «No está». Es lo esperado hoy: es B1.26 y no depende del
  usuario.

---

## Si la verificación falla

| Lo que dice | Qué falta | A quién |
|---|---|---|
| 401, o un error de JWT | La pública no está registrada, o la huella no coincide | Datos · repetir el paso 2 |
| Rol no otorgado | El `GRANT ROLE` | Datos |
| Error de warehouse | El `USAGE`, o un agente quedó con el almacén viejo | Datos, o repetir el paso 4 |
| Error de red | La política de red del usuario | Datos |

## Lo que esto no arregla

**Las cifras.** Con el usuario bien conectado, Keralty y Terpel siguen sin
métricas calculables. Eso depende de la respuesta del backend sobre B1.26,
pedida en `docs/MENSAJE-2026-10-22-backend-b126-con-dos-clientes.md`. Esto
arregla la seguridad del acceso, no los datos.
