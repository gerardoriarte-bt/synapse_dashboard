# Para el equipo de backend · dos correcciones a su nota, y una que encontramos leyéndola · 2026-09-30

> **Histórico.** Un mensaje mandado, con fecha: qué se pidió y con qué evidencia.
> No se actualiza.

Hola. Contesta `RESPUESTA-2026-09-30-formas-sin-metrica.md`. **Dos de las tres
cosas que dicen las confirmamos leyendo su código; la tercera no se sostiene**, y
al verificarla apareció una cuarta que no había visto ninguno de los dos.

---

## 1 · Lo que confirmamos

**El default de `MIN_GRAIN` es de ustedes y tienen razón.** Verificado en
`dd_catalog_sync_service.go`:

```go
minGrain := rowString(row, "MIN_GRAIN", "GRANO_MINIMO")
if minGrain == "" {
    minGrain = "month"
}
```

Es un dato que no teníamos y cambia el pedido a datos: «las dieciocho declaran
`month`» efectivamente tiene dos causas y desde Postgres no se distinguen. **La
consulta que proponen para desambiguar es de datos, no nuestra** — nosotros no
corremos SQL en Snowflake—, así que se la pasamos a ellos tal cual.

**Y de acuerdo con dejar el default.** Una métrica sin grano declarado no debe
romper el sync, y el lugar de la corrección es la view.

---

## 2 · Lo que no se sostiene

Dicen:

> «Si una métrica nueva declara `matrix`, `graph`, `flow`, `compared_categorical`
> o cualquiera de las once, se materializa con el siguiente `sync-catalog` +
> corrida, **sin cambios de código**.»

**Eso no es lo que hace `dd_materializer_service.go`.** Después de buscar la
métrica en el registro:

```go
spec, ok := sfspec.MetricRegistry[canonical]
...
if !ok {
    saveBlocked(..., BlockedReasonNoSource,
        fmt.Sprintf("No Snowflake query registered for metric %q", metric.Key))
    continue
}
```

**Una métrica que no esté en `MetricRegistry` sale `BLOCKED`.** El
`sync-catalog` la trae al catálogo y el front la ve, pero el panel queda
bloqueado con «No Snowflake query registered».

**No lo decimos como reproche, porque es exactamente la conclusión a la que
llegamos nosotros ayer** — y también al revés: el mensaje que les mandamos el 29
decía «nada del backend» y **también era falso**, por lo mismo. Lo corregimos
antes de mandarlo porque alguien preguntó «¿no podemos definirlos nosotros?».

**Y la conclusión práctica no cambia el reparto**: esa entrada la escribimos
nosotros, con su `BuildSQL`, y se la devolvemos en un fork. Es lo que hicimos con
`GET /config/plots` — `b6f0e09` en `feature/config-plots` de nuestro fork.

Lo que sí cambia es **el orden**: no alcanza con que datos cure la fila. Hacen
falta las dos cosas, y la del registro va primero o el panel nace bloqueado.

---

## 3 · Lo que apareció al verificarlo · la forma se declara DOS veces

Tres líneas más abajo del bloque anterior:

```go
if metric.Shape != "" && metric.Shape != spec.Shape {
    slog.Warn("materializer: shape del catálogo difiere del registry; se usa la del registry", ...)
}
mat, matErr := materialize.Materialize(spec.Shape, rows, spec.Options)
```

**El materializador transforma con la forma del REGISTRO. El front lee la del
CATÁLOGO.** Son dos declaraciones independientes de lo mismo, y si difieren el
único efecto es un `Warn` en el log del servidor.

### Por qué nos preocupa

El front lee `m.shape` de `GET /config/catalog`, que sale de la view. Con eso:

- **compone**: `acceptsShape` decide qué tipo de panel acepta esa métrica, así que
  el builder deja armar un panel `matrix` si la view dice `matrix`;
- **y después recibe** un payload transformado como lo que diga el registro.

Un panel compuesto para una forma, recibiendo otra. **Es el modo de falla que
este producto persigue en todos lados: se ve bien y muestra otra cosa** — y la
única señal está en un log que nadie mira, en el servidor, no en la pantalla.

### Lo que proponemos

**Que una discrepancia falle en vez de avisar.** Un `saveError` con las dos
formas en el mensaje —«el catálogo dice `matrix` y el registro `categorical`»— lo
convierte en un panel que dice qué pasa, que es lo que §8 pide. Bloquear una
métrica mal declarada es más barato que dibujarla mal.

**Y si prefieren lo contrario** —que la del catálogo gane, o que el registro deje
de declarar forma y la tome de la métrica— también nos sirve: lo que no sirve es
que dos fuentes declaren lo mismo y una gane en silencio.

**Lo dejamos como propuesta y no lo escribimos en el fork**, porque cambia el
comportamiento de una corrida y esa decisión es de ustedes.

---

## 4 · Dónde quedamos

| | Quién | Qué |
|---|---|---|
| El inventario de Gold | Datos | Lo pedimos con su especificación · `docs/snowflake/COMO-ENTREGAR-UNA-METRICA.md` |
| La fila de la view, con su copy y su `SHAPE` | Datos | Y el `MIN_GRAIN` real, con la consulta que ustedes propusieron |
| La entrada en `MetricRegistry` con su `BuildSQL` | **Nosotros** | En un fork, como `/config/plots` |
| Que una discrepancia de forma falle | **Ustedes** | La propuesta de arriba |

Gracias por la nota — el detalle del default de `MIN_GRAIN` nos ahorró mandarle a
datos un pedido mal dirigido por segunda vez en dos días.
