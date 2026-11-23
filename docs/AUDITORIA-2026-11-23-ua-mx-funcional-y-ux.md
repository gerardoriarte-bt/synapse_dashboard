# UA MX en QA: si está completo, y cómo se usa · 2026-11-23

**Medido en QA el 2026-11-23**, como superadmin y con el cliente Under Armour
MX. Las dos revisiones se hicieron en paralelo:

- **La funcional** la hizo el agente principal: por la API (`/config/me`,
  `/config/tabs/{tabId}`, `POST /config/panels:batch` para cada período) y
  mirando la consola y el editor.
- **La de experiencia** la hizo un agente aparte, sin el contexto de la
  construcción y en solo lectura.

Backend: lo último publicado es `fb3ca0c`. Front: el bundle de QA es del
2026-11-18 a las 20:08 GMT.

## 1 · Funcional

**El dashboard publicado es «UA MX» v12**, del 2026-11-18: 3 pestañas y 13
paneles. Overview sigue existiendo como segundo dashboard.

| Período | Paneles | Estado |
|---|---|---|
| 2026-11 y 2026-10 | 13 de 13 | `AVAILABLE`, con cifra |
| 2026-01 a 2026-09 | 13 de 13 | `DEGRADED`: «Los datos tienen más de 3 días: la última actualización fue el 2026-11-18» |
| 2025-12 | 13 de 13 | `BLOCKED`: «No hay datos calculados para este período». Nunca se cargó |

Noviembre: ingresos 1.492.583 USD, 14.183 órdenes, 1.595.165 visitas, AOV
105,24 y CVR 0,89 %. Las tres pestañas dibujan.

**El editor dibuja cada panel con su cifra** y el borrador pasa la validación
del servidor. Lo del 2026-11-17 quedó resuelto. Al abrirlo se creó el
**borrador v15**, sin publicar. Trae una pestaña «Performance Campaigns», que
alguien está armando.

**El chat:** el único agente de UA MX atiende a `Planner` (11 usuarios). Desde
la consola, un superadmin elige ese agente y la respuesta llega. `Admin`
(1 usuario) no tiene agente propio.

| # | Qué falta | De quién |
|---|---|---|
| F1 | Los meses cerrados salen `DEGRADED` con «Se actualiza en la próxima materialización», y eso no va a pasar. El backend dice que lo corrigió en 8366936 (sin publicar) (`docs/backend-respuesta-front-meses-cerrados-2026-11-18.md`), pero ese commit no está publicado ni desplegado | Backend |
| F2 | Diciembre de 2025 está en el selector y nunca se cargó | Operación · «Cargar meses» |
| F3 | La zona horaria de UA MX es `America/Bogota` | Configuración, después de que QA reconozca zonas horarias |
| F4 | `Admin` no tiene agente propio | Configuración |

## 2 · Experiencia

**Veredicto del agente:** la base es buena. Las tarjetas de noviembre, la
prosa de «Decisions», «Ver detalle» y el chat permiten llegar a una
conclusión. Pero un planner de UA MX tropieza con tres cosas:

- el diseño se rompe (prosa y tarjetas con estado);
- los meses cerrados aparecen como inválidos;
- las cifras no cuadran entre pantallas.

El inglés y el voseo hacen que se sienta inacabado.

| id | Gravedad | Qué pasa | De quién |
|---|---|---|---|
| U1 | alta | El texto de «Decisions» se sale del panel y se encima con «HIGHER = BETTER». La última recomendación queda tapada | **Nuestro**: el cuerpo de prosa no recorta ni hace scroll |
| U2 | alta | Los meses cerrados muestran «DEGRADADO … SE ACTUALIZA EN LA PRÓXIMA MATERIALIZACIÓN» en cada tarjeta | Backend (F1). El aviso repetido por tarjeta y la jerga son nuestros |
| U3 | alta | En las tarjetas KPI con estado, el aviso empuja el contenido: la meta se encima y el comparativo queda fuera de la tarjeta | **Nuestro** |
| U4 | alta | El mismo dato da cifras distintas: Charged Assert 10 es 36.562 en Producto y 37.762 en el chat; el 22 de noviembre, 14.970 en la tendencia y 19.611 en el detalle de ingresos | A medir: puede ser fuente o definición distinta |
| U5 | alta | El catálogo de métricas dice «Sin uso publicado» para métricas que están en la consola, y cuenta el uso de Overview | **Nuestro** o del cable: a medir |
| U6 | media | Inglés: «Decisions», «Investment», «Twelve-month efficiency», «GENERAL OVERVIEW UA MX», «DAY / WEEK / PLATFORM», «HIGHER = BETTER» | Títulos: catálogo y semilla. Pestaña: quien edita. Desagregación y rótulo de dirección: a medir |
| U7 | media | Voseo en un producto para México: «Preguntá», «Elegí», «abrí», «reasignalos», «VOS» | **Nuestro** |
| U8 | media | Las preguntas de cabecera son largas, se truncan y tienen erratas («mas», «o ue») | Quien edita el dashboard |
| U9 | media | El selector de dashboard y el cliente se llaman igual, «UA MX» | Nombre del dashboard, y nuestro rótulo |
| U10 | media | «Twelve-month efficiency» pone ROAS (12,9) en el mismo eje que ventas (3 M) | **Nuestro** o del gráfico elegido |
| U11 | media | «Tendencia diaria» mezcla USD y conteos en un eje, en tres azules parecidos | **Nuestro** o del gráfico elegido |
| U12 | media | nCAC sin cifra actual ni unidad en el eje. «Dependencia de promociones» con rótulo «TOTAL» | A medir |
| U13 | media | Producto: un panel en media pantalla, nombres con SKU, decimales dispares («21,136.6») | Composición, datos y nuestro formato |
| U14 | media | Chat: columnas crudas («PRODUCT_ID»), un id con separador de miles, el pie «LA CONSULTA NO LA DECLARA», y el riel dice «Todavía no preguntaste nada» mientras responde | **Nuestro** en gran parte |
| U15 | media | La cabecera del chat muestra el agente como desplegable de plomería | **Nuestro** |
| U16 | media | Reportes sin reportes se queda con filas esqueleto | **Nuestro** · a revisar contra el backend desplegado |
| U17 | media | Salud de feeds lista fuentes que no son las que citan los paneles | Backend y datos |
| U18 | media | Ficha: Bogotá como zona, roles duplicados, «1 PESTAÑA · 12 PANELES» frente a 3 y 13, «0 CONJUNTOS DE DATOS», rol editable en línea | Mezcla · a medir |
| U19 | baja | El historial dice que v12 añadió «performance campaigns», y la consola no la muestra | A medir |
| U20 | baja | Las órdenes salen «14,183» en un mes y «6.41K» en otro | **Nuestro** |
| U21 | baja | El detalle por plataforma muestra unas 20 filas en cero | **Nuestro** o del cable |
| U22 | baja | Ids hexadecimales bajo cada cliente, y navegaciones distintas en administración y consola | **Nuestro** |
| U23 | baja | La prosa compara contra el año y contra el mes sin decirlo | Backend (prompt de prosa) |

**Lo que no se pudo ver:** el ancho de teléfono, porque la ventana no cambió
de tamaño, y el editor desde el punto de vista de experiencia.

**Lo que conviene no tocar:**
- las tarjetas KPI de noviembre;
- el aviso de período en curso;
- la ficha BASE / VENTANA / PROCEDENCIA;
- la prosa de «Decisions»;
- «Ver detalle»;
- el chat.

**Lo primero, según el agente:**
1. El desborde (U1, U3).
2. La alarma en meses cerrados (U2).
3. Explicar o alinear las cifras (U4, U5, U17).
4. Una pasada de idioma (U6, U7, U8).
5. Gráficos legibles (U10, U11, U12).
