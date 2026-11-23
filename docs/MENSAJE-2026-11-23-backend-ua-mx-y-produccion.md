# Para el equipo de backend · dejar UA MX listo en QA: lo que falta de su lado · 2026-11-23

**Medido contra `fb3ca0c` el 2026-11-23**. Del código leí:

- `queries.go` (`daily_trend`);
- `drilldown.go` (`revenue`);
- `dd_seed.go`;
- su respuesta `docs/backend-respuesta-front-meses-cerrados-2026-11-18.md`.

En QA, ese mismo día y con UA MX:

- `POST /config/panels:batch` para los doce meses;
- la consola, el editor y el chat;
- una auditoría de experiencia, que está en
  `docs/AUDITORIA-2026-11-23-ua-mx-funcional-y-ux.md`.

Hola. UA MX está completo en QA: noviembre y octubre tienen cifra en los 13
paneles, el editor dibuja y valida, y el chat responde. Queremos dejar QA
listo para ir a producción. De nuestro lado ya se publicó la versión del dashboard con las
preguntas corregidas, sacamos Overview de los roles, cargamos diciembre de
2025 y le dimos chat a Admin. El front corrige lo suyo en PRs aparte.

De su lado falta esto. Va ordenado por cuánto se nota.

## 1 · Los meses cerrados salen «DEGRADADO»

De enero a septiembre, los 13 paneles muestran «Los datos tienen más de 3 días
· Se actualiza en la próxima materialización». Eso no va a pasar, porque nada
vuelve a calcular esos meses solo. En la auditoría fue lo que más
desconfianza generó.

Ustedes respondieron el 18 que lo corrigieron en el commit 8366936, pero **ese
commit no está en el repositorio**: lo último de
`feature/dynamic-dashboard-backend` sigue siendo `fb3ca0c`. **Pedido:**
publicarlo, desplegarlo en QA y que quede en la versión que vaya a producción.

## 2 · QA no reconoce zonas horarias

Está detallado en `docs/MENSAJE-2026-11-20-backend-terpel-tres-clientes.md`,
§1. La imagen no trae `tzdata`, así que todos los clientes calculan el mes en
UTC y los reportes salen cinco horas antes. **Antes de producción
es bloqueante**: un mes que corta a las 19:00 de Bogotá no es auditable.

## 3 · Títulos en inglés en el catálogo de UA MX

«Decisions», «Investment» y «Twelve-month efficiency» vienen de la semilla, no
de la vista de datos. El panel no tiene título propio, así que el front no los
puede cambiar. **Pedido:** «Decisiones», «Inversión» y «Eficiencia de doce
meses», o el nombre que defina datos.

## 4 · Dos cifras que no cuadran, para que las confirmen

- **El 22 de noviembre:** la tendencia diaria dice 14.970 de venta y «Ver
  detalle» por día, 19.611. Las dos leen `REV_TOTAL`. Nuestra hipótesis: la
  tendencia es la foto de la última carga, con el día a medias, y el detalle
  consulta Snowflake en vivo. ¿Es así? Si es así, el panel debería decir hasta
  qué hora llega el dato.
- **Charged Assert 10 en noviembre:** la pestaña Producto dice 36.562,43 USD y
  el chat, 37.761,53. ¿El agente consulta otra tabla u otro corte?

## 5 · Más chico

- **Salud de feeds** lista «Actionable framework», «Ads API», «ERP» y «GA4»,
  pero los paneles citan «Reporte diario de ecommerce · Adobe Analytics». Los
  nombres de las fuentes no coinciden con la procedencia.
- **La prosa compara sin decir contra qué**: «la conversión se redujo a la
  mitad» (contra el año anterior) y «convierte mejor que el mes anterior»,
  juntas. ¿Se puede pedir en el prompt que cada comparación nombre su base?
- **Los reportes por correo siguen sin desplegar** en QA: la ruta da 404. Con
  el punto 2 resuelto, van juntos.

Gracias.
