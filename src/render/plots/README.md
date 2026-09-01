# `render/plots/` · F1.21

SVG responsivo. Un plot **no conoce la métrica, ni el período, ni el tenant**:
recibe `PlotProps<F>` y dibuja.

**El color no se elige acá.** Llega `familia` del catálogo y el plot pinta con
`var(--color-fam-${familia}-N)` sin saber cuál le tocó — regla dura 1. Por eso
`tokens.css` usa `@theme static`: el nombre se arma en runtime y Tailwind no lo
puede ver.

`formatear` se inyecta. Un plot que importe el formateador decide locale por su
cuenta, y el locale es del tenant.

`core/` son las primitivas compartidas: escalas, ejes, rejilla, series, bandas.
Si un plot necesita algo que no está en `core/`, falta una primitiva — no sobra
un componente a medida.
