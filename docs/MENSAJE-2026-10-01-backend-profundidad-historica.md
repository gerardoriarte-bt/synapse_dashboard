# Para el equipo de backend · cuánto histórico muestra un dashboard · 2026-10-01

> **Histórico.** Un mensaje mandado, con fecha: qué se pidió y con qué evidencia.
> No se actualiza.

Hola. **Un pedido chico, y viene de una decisión de producto de nuestro lado.**

---

## Lo que decidió producto

**Cuánto histórico muestra un dashboard es una decisión del admin al crearlo.**
Hoy no lo es: son doce meses para todos, siempre.

## Lo que mide hoy

`availablePeriods()` en `dd_config_service.go:690`:

```go
func availablePeriods() []string {
	now := time.Now()
	periods := make([]string, 12)
	for i := range periods {
		t := now.AddDate(0, -i, 0)
		periods[i] = fmt.Sprintf("%d-%02d", t.Year(), t.Month())
	}
	return periods
}
```

**Doce, fijos, sin mirar tenant ni dashboard.** Y `/config/me` los sirve tal cual.

## Lo que pedimos

**Que la profundidad sea del dashboard**, con un campo que el admin escriba al
crearlo. La forma la eligen ustedes; lo que necesitamos es que `periods` salga de
ahí y no de la constante:

```
dd_dashboards.history_months  (int)     · cuántos meses atrás ofrece
      o
dd_dashboards.history_from    (text)    · desde qué período, p.ej. "2026-01"
```

**Nos sirve cualquiera de las dos.** La segunda se lee mejor en una pantalla de
alta —«muestra desde enero de 2026»— y no se mueve sola con el calendario.

### Y el default importa

**Que un dashboard sin el campo siga dando doce meses.** Ninguno de los que
existen hoy lo tiene, y un default de cero los dejaría sin períodos.

---

## Lo que NO estamos pidiendo

**No pedimos que filtren por si hay dato.** Eso es la otra mitad y va aparte —
está en el anexo de `docs/PROPUESTA-2026-09-30-divergencias-C2.md`: hoy el mes
abierto llega primero y sin materializar, y la consola cae al anterior mirándolo.
Son dos cosas distintas: **cuánto se ofrece** (esto) y **cuál se abre primero**
(aquello).

## Y un recordatorio del defecto que ya está pedido

Esa misma función arrastra el de `AddDate`: **el día 29, 30 o 31, un mes aparece
dos veces y otro falta.** Medido — `2026-03` dos veces y sin `2026-02`. El
arreglo ya existe escrito del lado de ustedes, en `snowflake/period.go:66`, que
sí normaliza. Si van a tocar esta función, es el momento.

---

## Mientras tanto

**El historial de materializaciones ya está construido** en `A5 · Salud de
feeds`: muestra 2026 por defecto y ofrece los años anteriores que tengan
corridas. No necesitó nada de ustedes — `GET /admin/materialize/runs` ya servía
todo, sólo faltaba transcribirlo y mirarlo.

**Y apenas se abrió mostró algo que nadie veía**: una corrida del 25 de
septiembre con **16 errores**. Estaba en la base desde entonces.

Gracias.
