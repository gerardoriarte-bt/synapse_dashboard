# La respuesta del backend, medida · 2026-10-01

> **Un corte verificado contra el servicio, con fecha.** No se actualiza: se
> reemplaza. Mide `d9147c3`, que es la respuesta del backend a los cinco pedidos
> del 2026-10-01 — el corte anterior es `docs/ESTADO-backend-2026-09-22.md`.

**Esto existe porque la primera lectura de `RESPUESTA-2026-10-01-cinco-pedidos.md`
se relató como si fuera una medición.** Era su prosa. La pregunta que lo atajó
fue la misma de siempre, y la hizo un humano: **«¿revisaste el repo de backend?»**
No. Acá está hecho.

Es la tercera vez que el mismo modo de falla aparece —el 25 citando una
transcripción nuestra, el 28 leyendo un diff de rebase— y la primera **con un
documento de ellos** como fuente. La regla no cambia: un documento, venga de
donde venga, es prosa hasta que se lee el código y se corre el endpoint.

---

## Contra qué se midió

| | |
|---|---|
| Repositorio | `AntPack-dev/synapse-api-go` |
| Rama | `feature/dynamic-dashboard-backend` |
| Commit | **`d9147c3`** · «respuesta a MENSAJE-2026-10-01: flujo por etapa, history_months por dashboard, payloads en preview y huso del tenant» |
| Sobre | `fa8ac88` → `de881e1`, que es lo último que teníamos medido |
| Base | la local de `dev/postgres`, descartable, con `DB_AUTO_MIGRATE=true` |
| Puerto | `:4011`, en un worktree aparte · **`:4010` no se tocó** |

`go build` ✓ · `go vet` ✓ · `go test ./...` **todo verde**, incluidas las cuatro
pruebas nuevas de `tests/services/dd_cinco_pedidos_test.go`.

**Y lo primero que hay que decir es lo que el documento no dice:** nada de esto
estaba corriendo. El binario de `:4010` es `de881e1` y **no tiene ninguno de los
cinco** — `/config/me` no devolvía `history_months`. «Implementado» y «corriendo»
son dos afirmaciones distintas, y la segunda la hicimos nosotros hoy.

---

## 1 · ¿Hay un Synapse desplegado? · **sigue sin contestar, y es verdad**

Lo que se puede verificar desde el repositorio, y da:

```
origin/main                       c366289 · 2026-08-13
rama mergeada a main?             NO
```

Confirmado los dos. Las tres preguntas —si existe el servicio, en qué commit y
contra qué base— **siguen abiertas** y ellos dicen que las confirma Mario con
despliegue. Es la respuesta honesta: no se contesta con código.

## 2 · Locale, moneda y huso · **anda**

`PUT /admin/tenants/{tenantId}` existe en `router.go:120` y acepta los tres
campos como punteros (parcial).

```
PUT {"locale":"es-MX","currency":"MXN","timezone":"America/Mexico_City"}   → 200
GET /config/me  →  tenant: es-MX · MXN · America/Mexico_City
PUT {"timezone":"Mars/Olympus"}
   → 400 · «timezone "Mars/Olympus" no es una zona IANA válida» · VALIDATION_REQUEST
```

**El tenant de la base local quedó corregido**, que es lo que ellos pidieron que
hiciéramos de nuestro lado. En dev y prod lo hacen ellos.

`tenantNow()` existe en `dd_config_service.go:744` y `open_period` sale de ahí.

## 3 · El valor de una etapa de flujo · **la regla cambió**

`transform_v11.go:175` declara el orden: explícito → entrante → saliente sólo
para orígenes. `setExplicit` acepta cuatro alias por lado (`from_v`, `from_value`,
`desde_v`, `desde_valor`).

No hay panel con dato de flujo para medirlo de punta a punta, así que se
verificó con sus pruebas:

```
TestTransformV11_Flow                      PASS
TestTransformV11_FlowEtapaUsaLoQueEntra    PASS
TestTransformV11_FlowValorExplicitoGana    PASS
TestTransformV11_FlowVariosOrigenesUnDestino PASS
```

Leída la segunda, que es la que importa: con `visitas→sesiones 900` y
`sesiones→ordenes 120`, afirma `sesiones = 900` y `ordenes = 120` —el corrimiento
se fue— **y `visitas = 900`**, o sea que la primera etapa sigue mostrando lo que
sale de ella. Es exactamente lo que su documento advierte: **sin `from_v` el
embudo sigue mal en su primera etapa.** No es una omisión suya, es la condición
que tenemos que cumplir al escribir la entrada del registro.

## 4 · Profundidad histórica · **anda, y el defecto de `AddDate` también**

```
dd_dashboards.history_months  integer NOT NULL DEFAULT 12   ← migración corrida
PUT /admin/dashboards/{id} {"history_months":18}  → 200
GET /config/me  →  18 períodos, 18 únicos, 2026-10 → 2025-05, consecutivos ✓
PUT {"history_months":0}  → 400 · VALIDATION_HISTORY_MONTHS
```

`EffectiveHistoryMonths()` cae a 12 fuera de rango y `availablePeriods` ahora se
apoya en `sfspec.PeriodsBack`, que retrocede desde el día 1. **Los 18 salieron
únicos y consecutivos**, que es la prueba del defecto viejo: antes el día 29, 30
o 31 repetía un mes y salteaba otro.

Restaurado a 12 después de medir.

## 5 · Payloads en el preview · **anda, y cierra B4.9**

```
sin include                        → claves: dashboard_id, layout_id, role, status, tabs
include=payloads&period=2026-09    → + payloads (14) + period · los 14 AVAILABLE
include=zzz                        → 400 · «include solo admite el valor payloads»
period=septiembre                  → 400 · VALIDATION_PERIOD
```

**Esto vence lo que dijimos hoy**: al mirar la vista previa por rol contra
`:4010` salió alambre sin payloads y se relató como «confirma el pedido 5». Era
cierto del binario viejo y falso de su trabajo. **El selector de gráfico ya puede
deshabilitar la opción que el dato excede**, que es el literal del dibujo —`NO
DISPONIBLE · MÁS DE CINCO PARTES, ILEGIBLE EN DONA`—, y hoy el front no llama a
`include=payloads`: eso es trabajo nuestro, nuevo y desbloqueado.

---

## Un incidente del procedimiento, que conviene no repetir

Al levantar el binario copié el `.env` del repositorio del backend al worktree.
**Ese archivo apunta a la RDS compartida de producción**, no a la base local:

```
DB_HOST=postgresql.…rds.amazonaws.com   DB_SSLMODE=require   DB_AUTO_MIGRATE=false
```

El binario arrancó contra ahí. **No escribió nada** —`DB_AUTO_MIGRATE=false` y la
única llamada fue un login que falló con credenciales inválidas— y se bajó al
verlo, pero no debió pasar: la receta de `dev/postgres/README.md` pasa las
variables **en la línea de comando**, y copiar el `.env` las pisa todas.

**La regla para adelante: para levantar el backend local no se usa su `.env`.**
Las dos únicas variables que hay que sacar de ahí son `DATA_ENCRYPTION_KEY` y
`JWT_SECRET`, y es más seguro leerlas del proceso que ya está corriendo bien
—`ps eww <pid>`— que del archivo.

---

## Dónde quedamos, medido

| | Qué | Estado |
|---|---|---|
| 1 | ¿Hay servicio desplegado? | **Abierto** · no es código · esperamos a despliegue |
| 2 | Locale, moneda y huso | **Verificado corriendo** · la base local ya quedó en `es-MX` |
| 3 | Valor de etapa de flujo | **Verificado por sus pruebas** · y necesitamos mandar `from_v` en la primera etapa |
| 4 | `history_months` y `AddDate` | **Verificado corriendo** · 18 períodos únicos y consecutivos |
| 5 | Payloads en el preview | **Verificado corriendo** · 14 payloads · **destraba trabajo nuestro** |

**Y lo que falta decir del lado nuestro:** `:4010` sigue en `de881e1`. Para que
cualquiera de estos cuatro se vea en la aplicación hay que levantar el backend en
`d9147c3`, y eso es una decisión, no un trámite — cambia el binario contra el que
está medido todo lo demás.
