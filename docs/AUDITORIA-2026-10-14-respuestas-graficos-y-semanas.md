# Auditoría · las respuestas del backend del 2026-10-14, remedidas · 2026-10-14

> **Histórico.** Un cruce puntual, con fecha. No se actualiza.

**Qué se cruzó:** lo que el backend contesta a los dos mensajes reenviados del
05 y el 06 contra lo que hace su código. Las respuestas, sin editar:

| Archivo | Contesta |
|---|---|
| `RESPUESTA-2026-10-14-backend-graficos-de-ua.md` | `MENSAJE-2026-10-06-backend-graficos-de-ua.md` |
| `RESPUESTA-2026-10-14-backend-semanas.md` | `MENSAJE-2026-10-05-backend-las-semanas-pueden-esperar.md` |

Las dos son idénticas a su versión final en `cb37429`, que sólo las mueve a
`docs/response/`. **El código es `3651d70`.**

**Cómo se midió:** el binario de `3651d70` corriendo acá con migraciones sobre la
base local —descartable—, una materialización de octubre de 2026 para UA contra
Snowflake real, y el dato leído en `dd_panel_data`. Después, el front contra ese
binario, mirado en pantalla.

---

## Gráficos de UA

| Pedido | Dicen | Medido contra `3651d70` |
|---|---|---|
| 1 · La semilla no se sirve como cifra | Hecho, corre al migrar | ✅ Las 143 filas de semilla del cliente con Snowflake quedan `BLOCKED`, con «La fila era de la semilla de demostración». El otro cliente local, sin Snowflake, conserva la maqueta, como dicen |
| 2 · ROAS como ratio | Hecho | ✅ La serie se llama `ROAS` y vale `11.7031`, no ×100 |
| 3 · `unit` por serie | Hecho | ✅ Inversión y Ventas `USD`, ROAS `x`; Sesiones sin unidad |
| 4 · Rematerializar septiembre y octubre | No hecho en QA | Correcto: lo hace una corrida, que ya se puede pedir desde A5 |
| 5 · El mes en curso, parcial | Hecho | ✅ `partial: true` sólo en el último punto de `media_efficiency_12m` |
| 5 · Títulos en español | Hecho | ✅ Plataforma, Inversión, Ventas, ROAS, Participación |

**Una consecuencia que la respuesta no dice:** las filas de semilla que quedaban
`AVAILABLE` en UA eran **los dos paneles de prosa** —`executive_summary` y
`decisions`—. La migración también los bloquea, así que en la consola de UA esos
dos paneles pasan a «bloqueado» hasta que la prosa por agente los llene.

## Semanas

Acuerdo sin código, como pedimos: no hay período semanal. `MIN_GRAIN = week` es
de datos, y las seis claves de forecast y MMM esperan a que datos las deje en la
vista. **Nada que verificar.**

---

## Lo que esto destraba en el front · visto en pantalla

Con `3651d70`, el panel «Eficiencia de medios · 12m» se dibuja mal, y **es
nuestro**:

1. **La línea del ROAS sale plana en cero.** Los tres mini-gráficos comparten
   una escala, y 11,7 al lado de 280.313 dólares no se ve. El ×100 lo
   disimulaba; el ratio correcto lo deja a la vista. La inversión también queda
   casi plana.
2. **El adaptador descarta `unit` y `partial`** (`src/api/adapt.ts`, caso
   `multi_series`), y el contrato interno de una serie sólo tiene `etiqueta` y
   `puntos`. Por eso la cifra dice «11.7» y no «11.7x», y el mes en curso no se
   marca como incompleto.

**Lo que hay que construir:** `unidad` por serie y `parcial` por punto en el
contrato y el adaptador; una escala propia para cada serie con otra unidad; y el
punto parcial marcado.

## Lo que queda del lado de ellos

- **Nada en QA hasta desplegar `3651d70`** y correr una materialización de
  septiembre y octubre.
