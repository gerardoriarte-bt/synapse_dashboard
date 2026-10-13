# Auditoría · las respuestas del backend del 2026-10-13, remedidas · 2026-10-13

> **Histórico.** Un cruce puntual, con fecha. No se actualiza.

**Qué se cruzó:** lo que el backend contesta en sus tres respuestas del
2026-10-13 contra lo que hace su código. Las respuestas, sin editar:

| Archivo | Contesta |
|---|---|
| `RESPUESTA-2026-10-13-backend-mensajes-pendientes.md` | Los mensajes del 05 al 10, una tabla por mensaje |
| `RESPUESTA-2026-10-13-backend-tablas-del-chat.md` | `MENSAJE-2026-10-09-backend-tablas-del-chat.md`, con una sección sobre la procedencia |
| `RESPUESTA-2026-10-13-backend-permisos.md` | `MENSAJE-2026-10-10-backend-permisos-y-super-admin.md` |

Las tres salen de su rama en `ab462f1`, que sólo anota el hash `8272085` en las
respuestas. **El código es `8272085`.**

**Cómo se midió:** el binario de `8272085` corriendo acá con la base local, y
contra `SYNAPSE_UA` real en el chat. Las dos preguntas son las mismas de los
mensajes originales, en el chat de pestaña. No se usó ninguna credencial real.

---

## Lo que dicen y lo que medimos

### Procedencia del chat · `MENSAJE-2026-10-08-backend-procedencia-por-nombre.md`

Pregunta del 08: ingresos de paid media por mes, enero a agosto de 2026.

| Pedido | Dicen | Medido contra `8272085` |
|---|---|---|
| 1 · No cruzar por nombre | Hecho | ✅ Las dos tablas declaran **la misma** métrica. Contra `9dc481e` eran `revenue` en una y `platform_return` en la otra |
| 2 · Cruzar por el origen | Hecho · SQL + `MetricColumnUsage` | ✅ `platform_return` · familia `media`: es la métrica de `INGRESOS_USD` en paid media |
| 3 · Sin base si la consulta filtra | Hecho, también en panel | ✅ `base: ""`: la consulta filtra por plataforma. Antes decía «Venta total del sitio». **El chat de panel no se midió** |
| 4 · Leer `chart_spec` como texto | Hecho | ✅ El gráfico trae la misma procedencia. Antes llegaba vacío |

### Tablas del chat · `MENSAJE-2026-10-09-backend-tablas-del-chat.md`

Pregunta del 09: distribución del presupuesto de medios por plataforma, agosto
de 2026.

| Pedido | Dicen | Medido contra `8272085` |
|---|---|---|
| Columnas desde `rowType`, sin saltar `label`, en el orden del `SELECT` | Hecho | ✅ `label`, `investment`, `sales`, `roas`, `share`, en ese orden, con `label` poblada en cada fila |
| `numeric` por tipo o mirando todas las filas | Hecho | ✅ `label` no numérica y las cuatro medidas numéricas |
| Por qué llegan tramas duplicadas | No mirado | ⚠️ **Sigue pasando**: dos tramas `tabular` idénticas seguidas, en las dos preguntas |

### Permisos · `MENSAJE-2026-10-10-backend-permisos-y-super-admin.md`

Medido y escrito en §7 de `PROPUESTA-2026-10-10-permisos-y-super-admin.md`. En
corto: el 403 entre clientes está; el puente `PLATFORM_OPERATOR_USER_IDS`
funciona; `GET /admin/layouts/{layoutId}` de otro cliente sigue abierto, como
ellos admiten; los pedidos 2 a 6 no están hechos.

### Respuestas escritas · `MENSAJE-2026-10-10-backend-respuestas-escritas.md`

**Aceptado**: cada mensaje se contesta en un `.md` de su repositorio, con el
formato pedido. Ya lo cumplieron en estas tres.

---

## Lo que quedó abierto

- **Los mensajes del 05 y del 06 no están contestados.** Dicen que no los tienen
  en su repositorio, y piden que se los peguen de nuevo.
- **Las tramas duplicadas.** Piden los tres `data` consecutivos de un turno,
  capturados en QA sobre el commit nuevo.
- **QA no tiene `8272085`.** Todo lo de arriba vale en local hasta que se
  despliegue.
- **Su repositorio guarda copias de nuestros mensajes con nombres que parecen
  respuestas**: `backend-respuesta-front-procedencia-chat-2026-10-08.md` es
  nuestro mensaje del 09, y `front_respuesta.md` es el del 08. No se trajeron.
