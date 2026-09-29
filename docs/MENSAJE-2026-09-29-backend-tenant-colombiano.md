# Para el equipo de backend · el tenant de México está registrado en Colombia · 2026-09-29

> **Histórico.** Un mensaje mandado, con fecha: qué se pidió y con qué evidencia.
> No se actualiza.

Hola. Dos cosas, y la primera es una buena noticia.

---

## 1 · `DD_MATERIALIZE_PROSE_ENABLED` anda · lo probamos acá

No hizo falta esperar al despliegue para saberlo: el flag es del binario y el
agente de Cortex contesta desde el 24. Levantamos `de881e1` con el flag en `true`
y corrimos `POST /admin/tenants/{id}/materialize` sobre `2026-09`:

```
available 18 · blocked 0 · errors 0 · preserved 0 · 45 s
```

**Los dos paneles de prosa pasaron de `DEGRADED` con el texto de la semilla a
`AVAILABLE` redactados por el agente**, en español y con las cifras del período.
Eso arregla de una vez las tres cosas que estaban mal en ellos: el inglés, la
cifra que no cambiaba entre períodos, y la frescura de tres semanas.

**Así que lo de B2.15 ya no es una apuesta.** Cuando lo prendan en dev, funciona.

---

## 2 · Y ahí se vio el problema · el tenant tiene locale, moneda y huso de COLOMBIA

El resumen que escribió el agente dice:

> «En septiembre de 2026 los ingresos alcanzaron **COP 1.144.876**…»

El tenant es **Under Armour México**. `GET /config/me` devuelve:

```json
{
  "name": "Under Armour México",
  "locale": "es-CO",
  "currency": "COP",
  "timezone": "America/Bogota"
}
```

**Los tres son colombianos, y no es un error de carga: son los DEFAULT de la
columna.** En `internal/core/domain/tenant.go`:

```go
Locale   string `gorm:"column:locale;not null;default:'es-CO'"`
Timezone string `gorm:"column:timezone;not null;default:'America/Bogota'"`
```

Cualquier tenant que se cree sin fijarlos explícitamente sale colombiano.

### Por qué importa cada uno, y el tercero es el caro

**`currency`** · el agente redacta en pesos colombianos para un cliente mexicano.
Es lo más visible y está en el panel que más se lee.

**`locale`** · nuestro formateador sale de ahí. `1.144.876` con puntos es formato
colombiano; México usa la coma. Todas las cifras de la consola salen con el
separador equivocado.

**`timezone`** · **éste es el que no se ve y es el que duele.** El corte del día
del negocio sale del tenant, y por una razón que está escrita en nuestra guía:
si la zona saliera del navegador, «ventas de hoy» sería un número en Ciudad de
México y otro en Baltimore, **y una cifra que cambia según quién la mira no es
auditable**. Un tenant mexicano cerrando el día en `America/Bogota` es
exactamente ese problema, con la diferencia de que acá nadie lo va a notar
mirando: el corte cae una hora antes y las cifras cierran igual de plausibles.

### Lo que pedimos

1. **Corregir los tres valores del tenant de UA MX** — `es-MX`, `MXN`,
   `America/Mexico_City`.
2. **Mirar el default.** Un default que nombra un país es una decisión sobre el
   próximo cliente que nadie va a tomar a conciencia. Sugerimos que `locale`,
   `currency` y `timezone` sean **obligatorios al crear el tenant**, sin default,
   para que dar de alta un cliente sin decirlos falle en vez de inventarlos. Si
   prefieren conservar un default, que sea el que hoy tiene sentido para la
   operación y quede escrito por qué.

**Y esto toca el alta de clientes**, que es donde más va a doler: el runbook de
alta pide los datos del cliente y hoy nada obliga a declarar su país.

---

## 3 · Lo que NO cambia

`GET /config/me` ya emite los tres campos y nuestro front ya los lee — el
formateador se inyecta con el locale del tenant desde F1.13b. **No hace falta
nada del cable**: lo que está mal es el valor, no la forma.

Gracias.
