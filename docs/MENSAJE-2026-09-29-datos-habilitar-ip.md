# Para el equipo de datos · habilitar la IP de salida, y una pregunta de fondo · 2026-09-29

> **Histórico.** Un mensaje mandado, con fecha: qué se pidió y con qué evidencia.
> No se actualiza.

Hola. **Nos volvió a bloquear la red de Snowflake**, y esta vez con una diferencia
que conviene mirar antes de habilitar nada: **no es la misma IP que habilitaron el
24**. Abajo está todo medido hoy contra la cuenta `MAA16864`.

---

## 1 · Qué está bloqueado ahora

El backend de Synapse ganó tres rutas nuevas para dar de alta clientes. **Las tres
funcionan y ninguna llega a Snowflake:**

```
GET  /api/v1/admin/tenants/{id}/schema-check    → 502
POST /api/v1/admin/tenants/{id}/sync-catalog    → 502

  snowflake sql: status 401: 390422 · Incoming request with IP/Token
  190.27.36.15 is not allowed to access Snowflake.
```

**Las rutas llegan hasta intentar la consulta**, o sea que están bien cableadas:
lo único que falta es la red.

## 2 · Qué se pide, en una línea

**Agregar `190.27.36.15` a la política de red de `SYNAPSE_SERVICE_USER`** —o a la
que aplique a la cuenta—, igual que hicieron con `201.244.209.190` el 2026-09-24.

**Verificación:** `GET /admin/tenants/{id}/schema-check` deja de dar 502.

---

## 3 · LA PARTE QUE IMPORTA MÁS QUE LA IP

**No es la misma dirección de la vez pasada, y no cambió por nada raro.**

| Cuándo | IP que Snowflake vio |
|---|---|
| 2026-09-24 | `201.244.209.190` · la habilitaron y el chat funcionó |
| 2026-09-29 | **`190.27.36.15`** |

**Cinco días, dos direcciones.** Si habilitamos ésta, es razonable esperar que en
otros cinco días vuelva a cortar — y cada vez cuesta un ida y vuelta entre dos
equipos para desbloquear a una persona.

### Y hay algo más que descubrimos midiendo

**La salida a Snowflake NO es la misma que la salida general.** En el mismo
instante:

```
Snowflake ve   →  190.27.36.15
Un «cuál es mi IP» genérico ve  →  186.31.4.152
```

Así que **la única IP que sirve para la lista es la que Snowflake reporta en el
error** — si alguien pregunta «¿cuál es tu IP?» y se habilita esa, no va a
funcionar y va a parecer que la política no se aplicó. Lo decimos porque es
exactamente el tipo de cosa que hace perder una tarde.

*(Dentro de una misma sesión sí es estable: tres llamadas seguidas, la misma
dirección.)*

### Las tres salidas que se nos ocurren, y ninguna es nuestra decisión

| | Qué implica | Costo |
|---|---|---|
| **a · Habilitar ésta y seguir** | Lo que hicimos el 24 | Barato hoy · se repite cada vez que cambie |
| **b · Un rango del ISP** | Habilitar el bloque del que salen estas direcciones | Un pedido en vez de N · **más permisivo**, y esa decisión es de ustedes |
| **c · Una salida fija** | Que el desarrollo salga por una IP estable —VPN, bastión o un túnel— | El más caro de montar · el único que cierra el problema |

**Lo que nos frena hoy es (a)**, así que con eso alcanza para desbloquear. Pero
**(b) o (c) es lo que evita este mensaje la próxima vez**, y quien puede evaluar
el riesgo de cada uno son ustedes, no nosotros.

---

## 4 · Para qué lo necesitamos, en dos líneas

Las dos rutas bloqueadas son las que hacen que **dar de alta un cliente nuevo deje
de necesitar acceso a la máquina del backend**:

- **`schema-check`** comprueba que el esquema del cliente tenga las quince
  columnas que el materializador necesita, **antes** de crear nada. Hoy, sin ella,
  una columna faltante se descubre cuando los paneles salen bloqueados sin razón.
- **`sync-catalog` por HTTP** reemplaza al `make sync-catalog` que hay que correr
  entrando al servidor.

**No bloquean la consola**, que anda con los datos ya materializados. Bloquean el
alta del próximo cliente.

## 5 · Lo que NO pedimos

- **No pedimos tocar ningún grant ni ningún objeto.** Los permisos de
  `SYNAPSE_APP_ROLE` sobre `SYNAPSE_METRIC_CATALOG` están bien desde el
  2026-09-15 y no cambiaron.
- **No pedimos nada del agente de Cortex.** La clave que registraron sigue
  funcionando; lo que corta es la red, no la credencial.
- **Nosotros no corremos nada en Snowflake.** Todo lo de arriba salió de leer el
  error que el servicio devuelve.
