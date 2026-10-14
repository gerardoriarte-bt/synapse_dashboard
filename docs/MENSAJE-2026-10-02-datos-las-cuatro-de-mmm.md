# Para el equipo de datos · las cuatro que piden · 2026-10-02

> **Histórico.** Un mensaje mandado, con fecha: qué se pidió y con qué evidencia.
> No se actualiza.

Contesta su `Informe_MMM_y_Forecast.pdf`, §6. **Las cuatro contestadas**, y una
corrección sobre el grano que les ahorra trabajo.

---

## 1 · Las `METRIC_KEY`

Convención del catálogo actual: minúsculas, `snake_case`, el dominio adelante
cuando agrupa —`media_*`, `platform_*`—.

| Forma | Tabla | `METRIC_KEY` |
|---|---|---|
| `series_with_band` | `GLD_REVENUE_FORECAST` | `revenue_forecast` |
| `series_with_band` | `GLD_INVENTORY_FORECAST` | `inventory_forecast` |
| `scalar_with_interval` | `GLD_REVENUE_FORECAST` · 1 fila | `revenue_forecast_close` |
| `scalar_with_interval` | `GLD_MEDIA_RECOMMENDATION` | `media_roas_recommendation` |
| `composition` | `MMM_RESULTS_CHANNELS` | `mmm_channel_contribution` |
| `multi_series` | `MMM_RESULTS_WEEKLY_HIST` | `mmm_weekly_contribution` |

**Y la clave tiene que existir en TRES lugares**, no dos: su
`DD_EXPECTED_METRIC_KEYS`, la fila del catálogo, y el registro de Go del backend.
Tienen razón en que una clave sin registro sale bloqueada sin explicación — lo
medimos esta semana con `platform_gap`: `BLOCKED · No Snowflake query registered`.
**Les mandamos estas seis al backend en paralelo.**

## 2 · El grano · el selector SÍ soporta semana

**El grano de las seis es `week`.** Declárenlo así.

Su informe dice «si el selector no soporta semana, hay que resolverlo antes de
construir». **Lo soporta, y está medido.** No hay nada que resolver antes:

- `/config/me` trae `period_grain` y `periods_detail[].grain`, y nuestro
  adaptador los traduce —`week` → `semana`—.
- Cuando el cable no lo declara, el grano **se deduce del id**: `2026-W32` es
  semana, `2026-07-15` día, `2026-07` mes.
- `PeriodPicker` **agrupa los períodos por grano** con `optgroup` y deshabilita
  el grano que las métricas de la pestaña no pueden contestar, diciéndolo:
  «algún grano no aplica · alguna métrica se mide por …».
- Dos pruebas lo cubren: `periodGrain.test.ts` y
  `periodGranoDeshabilitado.test.tsx`.

**Lo que falta no es nuestro:** hoy el backend emite sólo períodos `YYYY-MM`, así
que no hay ninguna semana que elegir aunque la métrica la declare. **Es un pedido
al backend y lo hacemos nosotros**, no ustedes.

**Y declarar `week` no rompe nada mientras tanto**: una métrica semanal contesta
igual una pregunta mensual —se agrega—, y el selector apaga el grano más fino,
no el más grueso.

## 3 · El baseline · entra como una parte más

**Opción A.** `mmm_channel_contribution` son **ocho partes**: los siete canales
más el baseline, etiquetado como ustedes proponen.

**Por qué, y es una razón de dibujo, no de gusto:** la cascada existe en el
repertorio —`waterfall`, y el `.pen` la dibuja— **pero no tiene componente**. De
los siete gráficos que §5 le da a `composicion`, hoy están construidos tres:
`donut`, `treemap` y `stacked100`. Elegir «punto de partida de la cascada» dejaría
la métrica esperando un gráfico que no existe.

**Y elegir A no cierra la puerta a B.** El payload es el mismo: ocho partes que
suman 100. El día que construyamos `waterfall`, el mismo dato se dibuja como
cascada sin tocar el catálogo. Lo único que cambia hoy es cómo redactan la BASE.

**La BASE que nos sirve** diría que el total es el revenue del período y que el
baseline es la parte no atribuible a medios pagos — para que nadie lea el 46 %
como un canal.

**Sobre `FB_Brand` en cero:** que se muestre. Una parte en cero es información —el
modelo no le atribuye contribución— y omitirla haría que la suma de lo mostrado
no cierre contra el total declarado. Nuestros cuerpos ya agrupan en «Otros» a
partir de dos partes chicas, así que no ensucia.

## 4 · El tornado · opción A, ROAS

**Opción A**, como recomiendan.

```
v        EXPECTED_ROAS
lo / hi  CONFIDENCE_LOWER / CONFIDENCE_UPPER
nivel    0.95
filtro   SCENARIO = 'BASE'
```

De acuerdo con dejar `ROAS_CONFIDENCE` —HIGH/MEDIUM/LOW— como etiqueta aparte:
`nivel` pide un número y el contrato lo declara así.

**Verificado de nuestro lado:** `tornado` sirve `scalar_with_interval` en el
repertorio, junto con `interval` y `forecast`. Los tres están construidos.

## Y sobre 4.4 · la banda que cruza el cero

Preguntan cómo lo dibujamos. **Nuestra recomendación es NO recortar en cero**, y
va en contra de la suya, así que la razón:

**El plot ya lo dibuja bien hoy.** Su escala toma el envolvente de `lo` y `hi`, y
un `lo` negativo extiende el dominio hacia abajo sin romper nada. No hace falta
código.

**Recortar en cero haría que el panel parezca más seguro de lo que el modelo
está.** Nuestra regla dura es la contraria —«prohibida la estimación puntual sin
intervalo»— y una banda recortada es media verdad: la parte que se esconde es
justamente la que dice que la incertidumbre supera a la estimación.

**Dónde va el contexto que mandan** —31,3 % de error en semanas nuevas, y
subestimó en 11 de las últimas 14—: en el campo de nota de lectura de la métrica,
que el panel pinta al pie. Es información de gobierno y por eso va en el
catálogo, no en el código.

**Si deciden que el recorte va igual, lo construimos** — pero preferimos que la
decisión quede escrita con esta objeción al lado.

---

## Dónde quedamos

| | Qué | Quién |
|---|---|---|
| 1 | Curar las seis filas con estas claves y `MIN_GRAIN = week` | Ustedes |
| 2 | Que el backend emita períodos semanales | **Nosotros se lo pedimos** |
| 2 | Registrar las seis claves en el registro de Go | **Nosotros se lo pedimos** |
| 3 | Redactar la BASE de `mmm_channel_contribution` con el baseline como parte | Ustedes |
| 4 | `media_roas_recommendation` con ROAS, nivel 0.95 y `SCENARIO = 'BASE'` | Ustedes |
| 4.4 | La nota de lectura con el error y el sesgo | Ustedes |
