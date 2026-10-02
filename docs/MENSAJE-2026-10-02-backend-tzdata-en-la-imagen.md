# Para el equipo de backend · el huso falla en la imagen, no en el código · 2026-10-02

> **Histórico.** Un mensaje mandado, con fecha: qué se pidió y con qué evidencia.
> No se actualiza.

**El código del huso está bien. Lo que falta es `tzdata` en el contenedor.**

Medido contra QA hoy, con el usuario que nos pasaron.

---

## Lo que pasa

```
PUT /api/v1/admin/tenants/{id}   {"timezone":"America/Mexico_City"}
→ 400 · tenant inválido: timezone "America/Mexico_City" no es una zona IANA válida
```

`America/Mexico_City` sí es una zona IANA válida. Así que probamos con **la que
el tenant ya tiene guardada**:

```
PUT /api/v1/admin/tenants/{id}   {"timezone":"America/Bogota"}
→ 400 · tenant inválido: timezone "America/Bogota" no es una zona IANA válida
```

**El servicio rechaza su propio valor almacenado.** Eso descarta que el problema
sea la zona que mandamos y deja una sola causa.

## La causa, en su repositorio · `79d1bab`

```dockerfile
FROM alpine:latest AS runtime
RUN apk add --no-cache ca-certificates && update-ca-certificates
```

**Alpine no trae la base de zonas horarias**, y el binario tampoco la embebe: no
hay `import _ "time/tzdata"` en ninguna línea. Sin una de las dos,
`time.LoadLocation` falla con **cualquier** zona.

**Por eso lo validaron y les funcionó.** En local Go usa el zoneinfo del sistema
operativo, que en macOS y en cualquier Linux de escritorio está. Sólo se rompe en
la imagen.

## La segunda consecuencia, que no se ve

`tenantNow` cae a UTC cuando `LoadLocation` falla — lo dice su propio comentario:
«una zona vacía o inválida cae a UTC».

Así que en QA **`open_period` y `periods` se calculan con el reloj del servidor y
no con el del cliente**. La funcionalidad de `d9147c3` —«el huso ahora decide el
mes en curso»— está apagada en el ambiente, **en silencio**. Hoy no se nota
porque Bogotá y UTC caen el mismo día casi siempre; se va a notar el día que un
tenant esté en un huso que cruce la medianoche antes o después.

**El fallback a UTC está bien como decisión**: lo que no está bien es que hoy
tapa un defecto de despliegue en vez de un dato faltante.

## Los dos arreglos · cualquiera sirve

| | |
|---|---|
| `RUN apk add --no-cache ca-certificates tzdata` en la etapa de runtime | Un cambio de una palabra |
| `import _ "time/tzdata"` en `main.go` | Embebe ~450 KB en el binario y lo vuelve inmune a la imagen base |

**Nos parece mejor la segunda** para ustedes: deja de depender de qué trae la
base, y de que alguien recuerde el paquete la próxima vez que cambie la imagen.

## Lo que quedó aplicado en QA

Mandamos `locale` y `currency` **sin** el huso y entraron con 200:

```
Synapse UA HTML · es-MX · USD · America/Bogota
```

El huso queda en Bogotá hasta que esto se resuelva.

**No tocamos los otros cuatro tenants.** Keralty, Terpel y Lobueno Analytics son
colombianos y su `es-CO`/`COP`/`America/Bogota` parece correcto; el default de
columna sólo estaba mal para el de UA.

## Una aclaración sobre lo que asumimos

Asumimos que la imagen desplegada se construye con el `Dockerfile` del
repositorio. **Si QA usa otro**, el diagnóstico apunta igual a la falta de
`tzdata` en el runtime —la prueba del valor propio rechazado no depende de qué
archivo lo construya— pero el archivo a tocar sería otro.

## Dónde quedamos

| | Qué | Quién |
|---|---|---|
| 1 | `tzdata` en la imagen, o `time/tzdata` en el binario | Ustedes |
| 2 | Cuando esté, el `PUT` del huso a `America/Mexico_City` | Lo corremos nosotros |
| — | `locale` y `currency` de UA | **Ya aplicados** |
