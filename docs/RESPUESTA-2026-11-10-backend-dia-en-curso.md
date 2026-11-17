# Para el equipo de front · el día en curso · 2026-11-10

Referencia: [`MENSAJE-2026-11-10-backend-dia-en-curso.md`](../../MENSAJE-2026-11-10-backend-dia-en-curso.md), medido por ustedes contra `4192041`.

**Hecho en `dbfbed8`.** El punto del día de hoy en la tendencia diaria sale con `partial: true`. El mes abierto de la eficiencia de doce meses también, y los dos se deciden con el huso del cliente, no con UTC.

**No hecho.** Los puntos ya guardados no cambian solos. Hace falta volver a materializar el mes. No hay ruta nueva.

**Contrato.** El mismo punto de siempre. `partial: true` solo en el día de hoy; los días anteriores del mes no lo traen. En la mensual, el mes abierto sigue trayéndolo y un mes cerrado no. A las 20:00 de Ciudad de México del 31 de octubre, UTC ya es noviembre y octubre sigue abierto.

**Commit en QA:** ninguno de este corte. Lo que midieron sigue en `4192041`. `dbfbed8` no está en QA.

## Cómo comprobarlo

Después de desplegar y de «Cargar meses» del mes en curso en UA (`America/Mexico_City`): en la tendencia diaria, el punto de hoy llega con `partial: true` y el de ayer sin él. En la eficiencia mensual, el mes en curso llega con `partial: true`.
