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

---

# Segunda parte · `d9147c3` LEVANTADO en `:4010` y todo remedido

**Decisión del humano, el mismo día: «levantá el backend en `d9147c3` y volvé a
medir todo».** Lo de arriba se midió en `:4011` sin tocar el servicio; esto es
con el binario viejo bajado y el nuevo en su lugar.

| | |
|---|---|
| Binario anterior | `/tmp/synapse-api-v11` · **se conserva**, y volver es correrlo con el mismo entorno |
| Binario nuevo | `/tmp/synapse-api-d9147c3` · `go build` desde el worktree |
| Entorno | leído de `ps eww` del proceso que estaba arriba · **NO de su `.env`**, que apunta a la RDS |
| Puerta | ✓ conforme · 1722 pruebas |

---

## 1 · LO MÁS CARO: `/config/plots` DA 404, Y EL BINARIO VIEJO ERA NUESTRO FORK

**El selector de gráfico del builder desaparece entero contra upstream.**

```
binario viejo (:4010 hasta hoy)   GET /config/plots → 200 · 49 filas
d9147c3 (upstream limpio)         GET /config/plots → 404
git grep "config/plots" d9147c3   → ninguna línea
```

Comprobado levantando los dos, no deducido: el viejo en `:4012` contestó 200 con
las 49, el nuevo contesta 404.

**Es la trampa registrada en `CLAUDE.md` con su cara más cara.** La nota dice
«medir con el fork levantado hace que nuestro propio código se vea como avance de
ellos». Acá fue peor: **hizo que una ruta nuestra se viera como existente**, y
sobre esa lectura se midió el selector de gráfico toda la mañana —incluido el de
la auditoría de los cuatro gráficos, que lo abrió y lo vio ofrecer TORNADO y
COHORTES—. Con upstream real no ofrece nada.

**Qué se apaga, exactamente:** `PanelConfigurator` declara que un repertorio
vacío apaga la sección —«un control que se abre vacío promete una elección que no
se puede hacer»—, así que contra upstream **no hay forma de elegir gráfico ni de
ver el que el panel ya tiene**. La consola sigue dibujando: el `chart` viaja en
el layout y los cuerpos despachan sin el repertorio.

**Y hay una consecuencia que no es de ellos sino nuestra, y queda SIN tocar
porque la decisión está escrita:** la sección se va **en silencio**. La regla dura
del producto dice «degradación declarada: estado, razón, qué lo desbloquea y
CTA», y acá no se declara nada. No se cambió sola — se pregunta.

→ `b6f0e09` en `feature/config-plots` del fork sigue sin que upstream lo tome.
Es el cuarto pedido de la misma ruta.

## 2 · Dos derivas de cable, las dos `history_months`

`npm run humo` contra `d9147c3`:

```
✗ /config/me          · el servicio manda y el yaml no declara: dashboards[].history_months
✗ /admin/layouts/{id} · el servicio manda y el yaml no declara: dashboard.history_months
```

Transcriptas en los dos cables con su descripción, regeneradas, y
`console-drift` / `admin-drift` ✓.

**El compilador encontró los fixtures solo**: cinco literales de `dashboards[]`
en tres archivos de prueba dejaron de compilar al volverse requerido el campo.
Es exactamente para lo que el cable es la fuente del tipo — ninguno se escribió
de memoria, el valor es el medido (12).

Después de eso: **humo ✓ en las 10 rutas que ejercita.** Las tres que quedan son
rutas que el humo no toca, no derivas: `/config/plots` (404, arriba),
`/config/chat` (SSE, cuesta una llamada a Cortex) y las dos de drill-down —medidas
a mano: `dimensions` 200 y `drilldown` 422, o sea que existen—.

`backend-drift` pasó de **12 de 12 sin reverificar a 4**, moviendo la marca sólo
de las ocho que el humo releyó campo por campo.

## 3 · `2026-10` es la MAQUETA, y se abre primero

Al arrancar, el binario siembra el mes en curso. Arrancó el 2026-10-01, así que
sembró octubre:

```
2026-10   AVAILABLE 12 · BLOCKED 2   escalares 4.280.000 · 1.820.000 · 70.700
          prosa: «Sales closed the month at USD 4.28M…»        ← la semilla, en inglés
2026-09   AVAILABLE 14               escalares 1.232.721 · 3.313.885 · 34.548
          prosa: «En septiembre de 2026 los ingresos alcanzaron COP 1.144.876…»  ← Snowflake
```

**La consola abre en octubre y muestra la maqueta.** Y la caída de mes que se
construyó ayer **no se dispara, correctamente**: su condición es «ningún panel
con valor», y octubre tiene valores — son de la semilla.

**Es la lección del 2026-09-24 con fecha nueva**: «los doce paneles pintaban la
maqueta del `.pen` sembrada en Postgres». La diferencia es que ahora se sabe
mirar, y que no es una regresión de ellos: es el sembrado del arranque cayendo
un día 1.

**El riesgo real es que no se nota**: el panel dice `AVAILABLE`, trae cifra,
medidor y comparativo, y nada en pantalla distingue un número del negocio de uno
de la maqueta. Va al backend como pedido.

## 4 · Lo que anda, verificado contra el binario nuevo

| | |
|---|---|
| Consola · `2026-09` | 14 paneles, **14 `AVAILABLE`**, siete formas distintas |
| `/config/me` | tenant en `es-MX` · `MXN` · `America/Mexico_City` · `history_months` 12 en los dos dashboards |
| A1 · Clientes y plataforma | los dos tenants con usuarios, feed más atrasado y última publicación |
| A5 · Salud de feeds | las cuatro fuentes · **el historial de corridas dibuja**, con la corrida de 16 errores del 25 de septiembre en acento |
| `/admin/*` | las ocho rutas del humo ✓ campo por campo |

## 5 · Y una cosa que esta medición NO cambia

**El selector de cliente sigue con dos tenants de nombre idéntico**, y ahora se
ve en tres pantallas: el builder, A1 y A5. En A5 el por defecto es el que no
tiene datos —«4 fuentes · 0 al día · 0 degradadas · 4 sin carga»— y se lee como
si el cliente estuviera roto.

## Cómo volver atrás

```
kill <pid de :4010>
env $(cat <el entorno guardado>) /tmp/synapse-api-v11
```

El binario viejo no se borró. **Y conviene saber por qué querría alguien
volver**: con él vuelve `/config/plots`, o sea el selector de gráfico — a costa
de medir contra código nuestro, que es lo que esta jornada demostró que cuesta.
