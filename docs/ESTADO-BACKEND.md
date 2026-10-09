# Estado del backend · qué sabemos y contra qué

> **GENERADO** desde `plan-de-trabajo.md` con `npm run plan`. Se pisa
> entero en cada corrida.


**Este archivo NO dice cuánto hizo el backend.** Dice **qué verificamos
nosotros y contra qué commit suyo**, que es otra cosa — y es la que hace
falta para re-verificar. Para su avance real está
`docs/dynamic-dashboard-backend.md` en su repositorio.


## En una línea

| | |
|---|---|
| Tareas `B*` en el plan | **98** |
| Verificadas por nosotros · ✅ o ⚠️ | **72** |
| De ésas, **contra el último commit** | **0** |
| ⬜ Esperando algo de ellos | **3** |
| ⬜ **Que NUNCA verificamos** | **22** |
| El último commit que leímos | `9dc481e` |


## ⚠️ 51 verificadas contra un commit anterior

**No quiere decir que estén mal: quiere decir que no lo sabemos.**
Una tarea `B*` afirma algo del servicio, y el servicio cambia.
Re-verificar una es leer su criterio y medirlo de nuevo.


| Tarea | | Verificada contra | Cuándo |
|---|---|---|---|
| **B0.1** · Esquema Postgres | ✅ | `de881e1` | 2026-09-29 |
| **B0.2** · Versionado de layout | ✅ | `de881e1` | 2026-09-29 |
| **B0.3** · Autenticación JWT | ✅ | `de881e1` | 2026-09-29 |
| **B0.4** · Middleware de auth y envelope | ✅ | `de881e1` | 2026-09-29 |
| **B0.10** · Endpoint de login | ✅ | `de881e1` | 2026-09-29 |
| **B1.1** · GET /config/me | ✅ | `de881e1` | 2026-09-29 |
| **B1.2** · GET /config/catalog | ✅ | `de881e1` | 2026-09-29 |
| **B1.3** · GET /config/blocks | ✅ | `de881e1` | 2026-09-29 |
| **B1.4** · PUT /config/me/preferencias | ✅ | `de881e1` | 2026-09-29 |
| **B1.5** · GET /config/tabs/{tabId} | ✅ | `de881e1` | 2026-09-29 |
| **B1.6** · POST /config/panels:batch | ⚠️ | `de881e1` | 2026-09-29 |
| **B1.10** · Aplicar layoutOverrides por rol | ✅ | `de881e1` | 2026-09-29 |
| **B1.11** · Unión discriminada de Payload | ✅ | `de881e1` | 2026-09-29 |
| **B1.12** · Gobierno obligatorio en DISPONIBLE y DEGRADADO | ✅ | `733c13c` | 2026-09-14 |
| **B1.13** · Presentacion opcional | ✅ | `5924bf2b` | 2026-09-28 |
| **B1.14** · Transformar a las formas de Valor | ✅ | `8633b10` | 2026-09-26 |
| **B1.15** · Validar reglas mínimas por forma antes de enviar | ✅ | `8633b10` | 2026-09-26 |
| **B1.16** · Seed de demo: 1 tenant, 1 layout, 1 pestaña, 4–6 paneles | ⚠️ | `733c13c` | 2026-09-14 |
| **B1.17** · Modelo Metrica | ✅ | `8633b10` | 2026-09-26 |
| **B1.21** · Declarar los mínimos de datos por gráfico | ⚠️ | `de881e1` | 2026-09-29 |
| **B1.25** · ventana de punta a punta | ✅ | `8633b10` | 2026-09-26 |
| **B1.27** · El período declara si está cerrado | ✅ | `8633b10` | 2026-09-26 |
| **B1.28** · PayloadDegradado dice DESDE QUÉ PUNTO el dato está vencido | ✅ | `de881e1` | 2026-09-29 |
| **B1.29** · schema-check | ✅ | `de881e1` | 2026-09-29 |
| **B1.30** · sync-catalog como ruta HTTP | ✅ | `de881e1` | 2026-09-29 |
| **B1.31** · La plataforma genera el par de claves del usuario de servicio | ⚠️ | `de881e1` | 2026-09-29 |
| **B1.32** · cut es day o month, y lo aplica el front | ✅ | `de881e1` | 2026-09-29 |
| **B2.1** · Tabla panel_data | ✅ | `de881e1` | 2026-09-29 |
| **B2.5** · Estado DEGRADADO | ✅ | `733c13c` | 2026-09-14 |
| **B2.6** · Estado BLOQUEADO | ⚠️ | `de881e1` | 2026-09-29 |
| **B2.11** · Filtrado por rol también en el batch | ✅ | `de881e1` | 2026-09-29 |
| **B2.12** · Correr el materializador contra datos reales y verificar los seis estados | ⚠️ | `de881e1` | 2026-09-29 |
| **B2.13** · Salud de feeds por fuente | ✅ | `de881e1` | 2026-09-29 |
| **B2.15** · Encender DD_MATERIALIZE_PROSE_ENABLED y avisar | ⚠️ | `de881e1` | 2026-09-29 |
| **B2.16** · El materializador emite presentation | ✅ | `f70cec2` | 2026-09-28 |
| **B3.1** · POST /config/chat con SSE | ⚠️ | `8633b10` | 2026-09-26 |
| **B3.10** · Persistir hilos y mensajes en Postgres | ✅ | `de881e1` | 2026-09-29 |
| **B4.1** · GET /admin/tenants | ✅ | `8633b10` | 2026-09-26 |
| **B4.2** · GET /admin/tenants/{id}/layouts | ✅ | `5924bf2b` | 2026-09-28 |
| **B4.4** · PUT /admin/layouts/{id} — editar pestañas y paneles | ✅ | `5924bf2b` | 2026-09-28 |
| **B4.7** · GET /admin/tenants/{id}/catalog | ✅ | `de881e1` | 2026-09-29 |
| **B4.8** · CRUD de roles por tenant | ✅ | `de881e1` | 2026-09-29 |
| **B4.9** · Preview por rol | ✅ | `de881e1` | 2026-09-29 |
| **B4.15** · Rechazar la publicación si hay paneles inválidos | ✅ | `de881e1` | 2026-09-29 |
| **B4.16** · Declarar el gráfico en el layout | ✅ | `de881e1` | 2026-09-29 |
| **B4.17** · Una ruta que liste usuarios | ✅ | `de881e1` | 2026-09-29 |
| **B4.18** · roles.tab_keys | ✅ | `de881e1` | 2026-09-29 |
| **B4.19** · La compuerta de resolveLayout y la vista previa por rol | ✅ | `f70cec2` | 2026-09-28 |
| **B5.1** · Varios layouts por tenant | ⚠️ | `8633b10` | 2026-09-26 |
| **B5.2** · Asignar layout por rol, o dejar elegir si el usuario tiene varios | ✅ | `de881e1` | 2026-09-29 |
| **B5.5** · Auditoría de publicaciones de layout | ✅ | `de881e1` | 2026-09-29 |


## ⬜ 22 que nunca verificamos · y NO quiere decir que falten

**Un `⬜` de backend dice «no lo miramos», no «no está hecho».** Nuestro
plan sólo mueve una `B*` cuando el front la verifica contra el servicio
corriendo, así que este número es **deuda nuestra de verificación**.

Para contrastar: su propio plan —`docs/dynamic-dashboard-backend.md`
en su repositorio— declara **65 de 69 hechas**, con cuatro abiertas y
tres de ellas de cache opcional. **Las listas no son la misma** y los
identificadores no coinciden, así que los números no se restan; pero
la distancia dice de qué lado está el trabajo pendiente.

**El número que sí es nuestro y sí es un compromiso** son las que
esperan algo de ellos: **3**, y salen en `PARA-BACKEND.md`.


## Todas, por fase


### Fase 0 · Fundamentos — 6 de 10

| | Tarea | Verificada contra | Cuándo |
|---|---|---|---|
| ✅ | **B0.1** · Esquema Postgres | `de881e1` ⚠ | 2026-09-29 |
| ✅ | **B0.2** · Versionado de layout | `de881e1` ⚠ | 2026-09-29 |
| ✅ | **B0.3** · Autenticación JWT | `de881e1` ⚠ | 2026-09-29 |
| ✅ | **B0.4** · Middleware de auth y envelope | `de881e1` ⚠ | 2026-09-29 |
| ✅ | **B0.5** · Contrato de consola | — | — |
| ⬜ | **B0.6** · Extender el contrato con admin y builder | — | — |
| ⬜ | **B0.7** · Tipos de servidor desde OpenAPI | — | — |
| ⬜ | **B0.8** · Secret manager para credenciales Snowflake | — | — |
| ⚠️ | **B0.9** ➕ · Contestar las cinco # PREGUNTA: del contrato | — | — |
| ✅ | **B0.10** ➕ · Endpoint de login | `de881e1` ⚠ | 2026-09-29 |


### Fase 1 · Catálogo y materialización — 22 de 34

| | Tarea | Verificada contra | Cuándo |
|---|---|---|---|
| ✅ | **B1.1** · GET /config/me | `de881e1` ⚠ | 2026-09-29 |
| ✅ | **B1.2** · GET /config/catalog | `de881e1` ⚠ | 2026-09-29 |
| ✅ | **B1.3** · GET /config/blocks | `de881e1` ⚠ | 2026-09-29 |
| ✅ | **B1.4** · PUT /config/me/preferencias | `de881e1` ⚠ | 2026-09-29 |
| ✅ | **B1.5** · GET /config/tabs/{tabId} | `de881e1` ⚠ | 2026-09-29 |
| ⚠️ | **B1.6** · POST /config/panels:batch | `de881e1` ⚠ | 2026-09-29 |
| ⬜ | **B1.7** · Resolver el layout publicado | — | — |
| ✅ | **B1.8** · Filtrar pestañas por visibilidad de rol | — | — |
| ✅ | **B1.9** · Filtrar paneles por hiddenMetricIds — ocultar ≠ permitir | — | — |
| ✅ | **B1.10** · Aplicar layoutOverrides por rol | `de881e1` ⚠ | 2026-09-29 |
| ✅ | **B1.11** · Unión discriminada de Payload | `de881e1` ⚠ | 2026-09-29 |
| ✅ | **B1.12** · Gobierno obligatorio en DISPONIBLE y DEGRADADO | `733c13c` ⚠ | 2026-09-14 |
| ✅ | **B1.13** · Presentacion opcional | `5924bf2b` ⚠ | 2026-09-28 |
| ✅ | **B1.14** · Transformar a las formas de Valor | `8633b10` ⚠ | 2026-09-26 |
| ✅ | **B1.15** · Validar reglas mínimas por forma antes de enviar | `8633b10` ⚠ | 2026-09-26 |
| ⚠️ | **B1.16** · Seed de demo: 1 tenant, 1 layout, 1 pestaña, 4–6 paneles | `733c13c` ⚠ | 2026-09-14 |
| ✅ | **B1.17** · Modelo Metrica | `8633b10` ⚠ | 2026-09-26 |
| ✅ | **B1.18** · Sincronizar el catálogo con las semantic views de Snowflake | — | — |
| ⬜ | **B1.19** · Filtrar el catálogo por permisos de rol | `8633b10` ⚠ | 2026-09-26 |
| ⬜ | **B1.20** ➕ · Seed determinista para desarrollo del front | — | — |
| ⚠️ | **B1.21** ➕ · Declarar los mínimos de datos por gráfico | `de881e1` ⚠ | 2026-09-29 |
| ⚠️ | **B1.22** ➕ · Crear el catálogo de métricas en Snowflake | — | — |
| ⬜ | **B1.23** ➕ · Escribir el gobierno de las métricas | — | — |
| ⬜ | **B1.24** ➕ · Alinear las claves del catálogo con el registro de queries | — | — |
| ✅ | **B1.25** ➕ · ventana de punta a punta | `8633b10` ⚠ | 2026-09-26 |
| ⬜ | **B1.26** ➕ · Decidir cómo escala el registro, antes del segundo tenant | — | — |
| ✅ | **B1.27** ➕ · El período declara si está cerrado | `8633b10` ⚠ | 2026-09-26 |
| ✅ | **B1.28** ➕ · PayloadDegradado dice DESDE QUÉ PUNTO el dato está vencido | `de881e1` ⚠ | 2026-09-29 |
| ✅ | **B1.29** ➕ · schema-check | `de881e1` ⚠ | 2026-09-29 |
| ✅ | **B1.30** ➕ · sync-catalog como ruta HTTP | `de881e1` ⚠ | 2026-09-29 |
| ⚠️ | **B1.31** ➕ · La plataforma genera el par de claves del usuario de servicio | `de881e1` ⚠ | 2026-09-29 |
| ✅ | **B1.32** ➕ · cut es day o month, y lo aplica el front | `de881e1` ⚠ | 2026-09-29 |
| ✅ | **B1.33** ➕ · El patrón de PeriodoId | — | — |
| ⬜ | **B1.34** ➕ · Declarar qué es el t de una serie, o mandar el tramo vencido | `de881e1` ⚠ | 2026-09-29 |


### Fase 2 · Estados y cache — 8 de 16

| | Tarea | Verificada contra | Cuándo |
|---|---|---|---|
| ✅ | **B2.1** · Tabla panel_data | `de881e1` ⚠ | 2026-09-29 |
| ⬜ | **B2.2** · Job de materialización | — | — |
| ✅ | **B2.3** · El batch lee de panel_data, no de Snowflake | — | — |
| ⬜ | **B2.4** · Redis opcional encima de Postgres | `de881e1` ⚠ | 2026-09-29 |
| ✅ | **B2.5** · Estado DEGRADADO | `733c13c` ⚠ | 2026-09-14 |
| ⚠️ | **B2.6** · Estado BLOQUEADO | `de881e1` ⚠ | 2026-09-29 |
| ✅ | **B2.7** · Estado SIN_PERMISO en el batch | — | — |
| ⬜ | **B2.8** · Invalidar cache al publicar layout | — | — |
| ⬜ | **B2.9** · Invalidar cache al completar materialización | — | — |
| ✅ | **B2.10** · frescura = instante de materialización, nunca «ahora» | — | — |
| ✅ | **B2.11** · Filtrado por rol también en el batch | `de881e1` ⚠ | 2026-09-29 |
| ⚠️ | **B2.12** ➕ · Correr el materializador contra datos reales y verificar los seis estados | `de881e1` ⚠ | 2026-09-29 |
| ✅ | **B2.13** ➕ · Salud de feeds por fuente | `de881e1` ⚠ | 2026-09-29 |
| ⬜ | **B2.14** ➕ · /config/solicitudes | `de881e1` ⚠ | 2026-09-29 |
| ⚠️ | **B2.15** ➕ · Encender DD_MATERIALIZE_PROSE_ENABLED y avisar | `de881e1` ⚠ | 2026-09-29 |
| ✅ | **B2.16** ➕ · El materializador emite presentation | `f70cec2` ⚠ | 2026-09-28 |


### Fase 3 · Chat — 3 de 11

| | Tarea | Verificada contra | Cuándo |
|---|---|---|---|
| ⚠️ | **B3.1** · POST /config/chat con SSE | `8633b10` ⚠ | 2026-09-26 |
| ✅ | **B3.2** · GET /config/chat/hilos — historial | — | — |
| ✅ | **B3.3** · Modelo AgenteTenant | — | — |
| ⬜ | **B3.4** · Resolver el agente del tenant desde el JWT | `de881e1` ⚠ | 2026-09-29 |
| ⬜ | **B3.5** · Inyectar ContextoDePanel en el system prompt | — | — |
| ⬜ | **B3.6** · Consulta a Snowflake en vivo para el chat | — | — |
| ⬜ | **B3.7** · Formato de eventos SSE acordado con el front (T3) | — | — |
| ⬜ | **B3.8** · La respuesta puede incluir { forma, datos, procedencia } | — | — |
| ⚠️ | **B3.9** · CRUD /admin/tenants/{id}/agents | — | — |
| ✅ | **B3.10** · Persistir hilos y mensajes en Postgres | `de881e1` ⚠ | 2026-09-29 |
| ⬜ | **B3.11** ➕ · Aplicar las migraciones de 82da946 sobre la base compartida | — | — |


### Fase 4 · Admin y builder — 18 de 20

| | Tarea | Verificada contra | Cuándo |
|---|---|---|---|
| ✅ | **B4.1** · GET /admin/tenants | `8633b10` ⚠ | 2026-09-26 |
| ✅ | **B4.2** · GET /admin/tenants/{id}/layouts | `5924bf2b` ⚠ | 2026-09-28 |
| ✅ | **B4.3** · POST /admin/tenants/{id}/layouts — crear borrador | — | — |
| ✅ | **B4.4** · PUT /admin/layouts/{id} — editar pestañas y paneles | `5924bf2b` ⚠ | 2026-09-28 |
| ✅ | **B4.5** · POST /admin/layouts/{id}/publish | — | — |
| ✅ | **B4.6** · POST /admin/layouts/{id}/validate | — | — |
| ✅ | **B4.7** · GET /admin/tenants/{id}/catalog | `de881e1` ⚠ | 2026-09-29 |
| ✅ | **B4.8** · CRUD de roles por tenant | `de881e1` ⚠ | 2026-09-29 |
| ✅ | **B4.9** · Preview por rol | `de881e1` ⚠ | 2026-09-29 |
| ⚠️ | **B4.10** · Asignación de layout publicado a roles | — | — |
| ✅ | **B4.11** · Validar que metricId existe en el catálogo del tenant | — | — |
| ✅ | **B4.12** · Validar que tipo es compatible con la forma de la métrica | — | — |
| ✅ | **B4.13** · Validar rangos de colSpan / rowSpan por tipo | — | — |
| ✅ | **B4.14** · Validar opciones de layout (maximo obligatorio en gauge) | — | — |
| ✅ | **B4.15** · Rechazar la publicación si hay paneles inválidos | `de881e1` ⚠ | 2026-09-29 |
| ✅ | **B4.16** ➕ · Declarar el gráfico en el layout | `de881e1` ⚠ | 2026-09-29 |
| ✅ | **B4.17** · Una ruta que liste usuarios | `de881e1` ⚠ | 2026-09-29 |
| ✅ | **B4.18** ➕ · roles.tab_keys | `de881e1` ⚠ | 2026-09-29 |
| ✅ | **B4.19** ➕ · La compuerta de resolveLayout y la vista previa por rol | `f70cec2` ⚠ | 2026-09-28 |
| ⬜ | **B4.20** ➕ · (libre) | — | — |


### Fase 5 · Multi-dashboard — 2 de 7

| | Tarea | Verificada contra | Cuándo |
|---|---|---|---|
| ⚠️ | **B5.1** · Varios layouts por tenant | `8633b10` ⚠ | 2026-09-26 |
| ✅ | **B5.2** · Asignar layout por rol, o dejar elegir si el usuario tiene varios | `de881e1` ⚠ | 2026-09-29 |
| ⬜ | **B5.3** · Formas v1.1 cuando haya datos | — | — |
| 🕓 | **B5.4** · Endpoint de drill-down bajo demanda | — | — |
| ✅ | **B5.5** · Auditoría de publicaciones de layout | `de881e1` ⚠ | 2026-09-29 |
| ⬜ | **B5.6** · Tests de integración por endpoint de consola | — | — |
| ⬜ | **B5.7** · Tests del job de materialización con fixtures de Snowflake | `de881e1` ⚠ | 2026-09-29 |


---

## Cómo se lee

- **`—` en una `⬜`** es correcto: no hay nada que verificar todavía.
- **`—` en una `✅` o `⚠️`** sería un hueco, y hoy no hay ninguno. Dos
  tareas cerradas no citan commit **y declaran por qué**: `B0.5` porque
  produce un documento y no una ruta, `B1.18` porque cita el resultado
  medido —`created=6 updated=4`— que es mejor evidencia que un hash.
- **`➕`** marca una tarea que agregamos nosotros, no del ancestro.
- **`⚠` junto al commit** dice que se verificó contra uno anterior al
  último que leímos. No es un error: es lo que hay que re-mirar primero.

