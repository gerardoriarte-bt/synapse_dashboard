# Para el equipo de datos · lo que el backend vio en las tablas Gold · 2026-10-02

> **Histórico.** Un mensaje mandado, con fecha: qué se pidió y con qué evidencia.
> No se actualiza.

**Nada de esto lo encontramos nosotros**: lo midió el backend leyendo las tablas
Gold de UA para escribir las consultas de las métricas nuevas. Lo pasamos porque
se ve en pantalla.

Ordenado por urgencia.

---

## 1 · La inversión no cuadra entre dos tablas · **urgente**

| Septiembre 2026 | |
|---|---|
| `SUM(COST_USD)` en `GLD_PAID_MEDIA` | **USD 3.347.868** |
| De eso, `Dailymotion` + `GCM-Other` | USD 3.092.080 |
| `SUM(GROSS_SPEND)` en `GLD_ECOMM_DAILY_PERFORMANCE` | **USD 118.807** |

**Difieren 28 veces para el mismo mes.**

`Dailymotion` aparece con USD 1.984.511 en septiembre y `GCM-Other` con USD
9.099.434 en octubre de 2025. Parecen montos en otra unidad, o impresiones
cargadas como costo.

**Lo vimos en pantalla**, en el panel de retorno por plataforma: esas dos filas se
llevan el **92 % del share de inversión con cero ventas y ROAS 0,00**.

Mientras sigan así, la matriz y la composición de inversión quedan dominadas por
esas dos filas **y no coinciden con el KPI de inversión**, que sale de la otra
tabla. Es un dashboard que se contradice a sí mismo.

## 2 · `Dailymotion` y `Daily Motion` son dos plataformas distintas

En `FUENTE`, con cifras separadas. Salen como dos filas.

## 3 · Tres celdas de `Metricas.xlsx`

| Fila | Dice | Debería decir |
|---|---|---|
| `media_platform_investment_matrix` | `MEASUREMENT_WINDOW`: «Mes calendario seleccionado» | «Últimos doce meses calendario hasta el seleccionado» · decisión de producto del 01 |
| `platform_return` | `TABLA FUENTE`: `GLD_ECOMM_DAILY_PERFORMANCE` | La consulta lee `GLD_PAID_MEDIA` |
| `instagram_followers_trend` | `BASE`: «total de seguidores» | Ver el punto 4 |

## 4 · Redes sociales · **sin apuro, las métricas están pausadas**

**Producto decidió dejar afuera `instagram_followers_trend` y
`tiktok_comment_sentiment` por ahora**, porque no hay dato con qué publicarlas.
Esto queda escrito para cuando se retomen, no como pedido de hoy.

| Tabla | Último dato |
|---|---|
| `GLD_SOCIAL_MEDIA_FOLLOWERS` · Instagram | 2026-08-01 |
| `GLD_SOCIAL_MEDIA_POSTS` · TikTok con sentimiento | post del 2026-03-05 |

Y dos cosas más de esas tablas:

- **`FOLLOWERS` no parece el total.** Los valores diarios de julio son de 200 a
  400, mientras `GLD_SOCIAL_MEDIA_PROFILE_METRICS` trae 1.157.829 para el 1 de
  agosto. Parece ser seguidores nuevos por día. Además hay tres días con filas
  repetidas: `2026-08-01` (28 filas, nulas), `2026-03-26` (4, nulas) y
  `2026-03-25` (21, en cero).
- **`GLD_SOCIAL_MEDIA_POSTS` no trae comentarios de Instagram**: sus 529 filas
  tienen el sentimiento vacío.

**El backend ya escribió las dos consultas** y quedan listas: se encienden
curando las dos filas del catálogo el día que el dato llegue.

## Dónde quedamos

| | Qué | Urgencia |
|---|---|---|
| 1 | La inversión de `Dailymotion` y `GCM-Other` | **Alta** · hoy domina dos paneles |
| 2 | `Dailymotion` contra `Daily Motion` | Media |
| 3 | Las tres celdas de la planilla | Media |
| 4 | `FOLLOWERS` y el atraso de redes | **Sin apuro** |
