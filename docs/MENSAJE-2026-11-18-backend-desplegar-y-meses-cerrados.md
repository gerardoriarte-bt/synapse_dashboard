# Para el equipo de backend · un despliegue más, y los meses cerrados · 2026-11-18

**Medido contra `fb3ca0c` el 2026-11-18**, leyendo su rama
`feature/dynamic-dashboard-backend`: `PanelDegradation` y sus textos en
`dd_config_service.go`, y `DD_MATERIALIZE_PERIODS_BACK` en
`dd_materialize_orchestrator.go`. Del front, contra `043cddc`, que es `main`
hoy. De QA, ese mismo día y leyendo: el bundle que se sirve desde el
2026-11-17 a las 22:56 GMT, y el estado de cada métrica de UA MX de enero a
noviembre con `GET /admin/tenants/{tenantId}/catalog/data`.

Hola. Gracias por el despliegue de ayer: el editor de UA MX ya dibuja con su
dato. Son dos cosas, una entrega y una pregunta.

## 1 · Desplegar el front de `main` (`043cddc`) en QA

Entra un solo cambio de la aplicación, `798dda2`, y no necesita nada de su
lado.

**Arregla las cards de la consola, que se veían en escalera.** En UA MX,
Órdenes (columna 10), Visitas (7) e Ingresos (1) salían en las filas 5, 6 y 7,
y en el editor estaban las tres en la 5. El servicio guarda el orden de la
lista (`1756d1f`) y no la fila, y está bien así. La consola dejaba la fila a
CSS, que coloca distinto que el editor. Ahora la calcula igual que el editor y
la escribe.

**Cómo lo comprobamos**: en la pestaña «General overview UA MX» de la
consola, Ingresos, Investment, Visitas y Órdenes quedan en una misma fila.

## 2 · La pregunta: ¿un mes cerrado tiene que pasar a dato viejo?

Hoy corrimos «Cargar meses» de enero a septiembre en UA MX. Los meses que vimos
terminar, de enero a junio, quedaron al día, y **en tres días van a volver a
decir «Los datos tienen más de 3 días»**.

`PanelDegradation` marca un dato como viejo cuando su última materialización
tiene más de `DD_FRESHNESS_TOLERANCE_DAYS`, sin mirar de qué período es. Para
el mes en curso tiene sentido. Para septiembre no, porque sus cifras ya no
cambian.

**Y el texto le promete algo que no pasa.** El dato viejo dice «Se actualiza
en la próxima materialización», pero el programador sólo recalcula el mes en
curso y el anterior (`DD_MATERIALIZE_PERIODS_BACK`, 1 por defecto). Un mes
cerrado no se vuelve a calcular solo, así que queda viejo para siempre. Lo
medimos así: antes de la carga de hoy, enero a septiembre estaban todos
degradados, con la última actualización del 2026-10-31.

**Lo que proponemos**, y lo deciden ustedes: que la regla de frescura no se
aplique a un período cerrado cuya materialización fue posterior a su cierre.
Si prefieren mantenerla, que el texto diga cómo se actualiza: «Se actualiza
cargando el mes desde Salud de feeds».

Gracias.
