# Tareas de implementación — Synapse Front Dinámico

**Derivado de:** `nuevo-desarrollo.md` · **Fecha:** 2026-08-31

Este documento desglosa el desarrollo completo en tareas concretas separadas por **Backend** y **Frontend**, organizadas por fases de prioridad.

## Backend

### Fase 0 — Fundamentos e infraestructura

- [ ] **B0.1** Definir esquema Postgres: `tenants`, `roles`, `users`, `layout_versions`, `tabs`, `panels`, `panel_options`, `panel_data`, `catalog_metrics`, `agent_configs`
- [ ] **B0.2** Modelo de versionado de layout (`draft` | `published`) con `versionId` y `publishedAt`
- [ ] **B0.3** Autenticación JWT con claims: `tenant_id`, `role_id`, `user_id`
- [ ] **B0.4** Middleware de auth + envelope de respuesta `{ success, data }` / `{ success, error }`
- [ ] **B0.5** Extender `contracts/synapse-api.yaml` con endpoints de consola (si no están completos)
- [ ] **B0.6** Extender contrato OpenAPI con endpoints admin/builder (§5 del spec)
- [ ] **B0.7** Generar tipos servidor desde OpenAPI (o compartir contrato con front)
- [ ] **B0.8** Configurar secret manager para credenciales Snowflake por tenant (nunca en código ni en respuestas API)

---

### Fase 1 — API consola (usuario final)

#### Contexto y configuración

- [ ] **B1.1** `GET /api/v1/config/me` — devolver: user, tenant, role, tabs (metadatos sin paneles), periodos disponibles, `catalogVersion`, layouts (si > 1)
- [ ] **B1.2** `GET /api/v1/config/catalog` — métricas del tenant filtradas por rol del JWT
- [ ] **B1.3** `GET /api/v1/config/blocks` — tabla tipo ↔ formas ↔ rangos de `colSpan`/`rowSpan` (reglas SYNAPSE_BLOCKS)
- [ ] **B1.4** `PUT /api/v1/config/me/preferencias` — persistir tema dark/light del usuario

#### Layout y datos de paneles

- [ ] **B1.5** `GET /api/v1/config/tabs/{tabId}` — devolver `{ tab, panels[] }` (layout sin datos); soportar query `?layoutId=` para multi-dashboard
- [ ] **B1.6** `POST /api/v1/config/panels:batch` — body `{ panelIds, periodo }` → `{ [panelId]: Payload }`
- [ ] **B1.7** Resolver layout publicado del tenant al servir tabs/panels
- [ ] **B1.8** Filtrar tabs por visibilidad de rol (`role.tabIds`)
- [ ] **B1.9** Filtrar panels por `role.hiddenMetricIds` — **ocultar ≠ permitir** (no enviar en layout ni en batch)
- [ ] **B1.10** Aplicar `layoutOverrides` por rol si existen

#### Modelo de Payload (contrato de datos)

- [ ] **B1.11** Implementar unión discriminada de `Payload` por `estado`: `DISPONIBLE`, `DEGRADADO`, `BLOQUEADO`, `SIN_PERMISO`, `ERROR`
- [ ] **B1.12** Incluir `Gobierno` obligatorio en `DISPONIBLE` y `DEGRADADO`: `base`, `capa`, `fuente`, `frescura`, `catalogVersion`
- [ ] **B1.13** Incluir `Presentacion` opcional: `label`, `medidor`, `comparativo`, `nota`
- [ ] **B1.14** Implementar transformación a las 12+ formas de `Valor` según §8 (escalar, tabular, prosa, serieTemporal, etc.)
- [ ] **B1.15** Validar reglas mínimas por forma antes de enviar (ej. gauge requiere `maximo` en layout; forecast requiere banda)
- [ ] **B1.16** Para v1: seed de 1 tenant + 1 layout publicado + 1 pestaña con 4–6 paneles de ejemplo (Brand Momentum)

#### Catálogo de métricas

- [ ] **B1.17** Modelo `Metrica`: `id`, `key`, `nombre`, `forma`, `familia`, `capa`, `fuente`, `ventana`, `base`, `unidad`, `direccionSemantica`, `granoMinimo`, `dimensiones`, `catalogVersion`
- [ ] **B1.18** Sincronizar catálogo con semantic views de Snowflake (manual o job inicial)
- [ ] **B1.19** Filtrar catálogo por permisos de rol

---

### Fase 2 — Materialización y cache

- [ ] **B2.1** Tabla `panel_data`: snapshot materializado con gobierno completo por `(tenant_id, metric_id, periodo)`
- [ ] **B2.2** Job de materialización (cron o worker): por cada tenant + metricId + periodo activo → consulta Snowflake/semantic layer → transforma a `Forma + Gobierno + Presentacion` → escribe en `panel_data`
- [ ] **B2.3** `POST /config/panels:batch` lee de `panel_data` (Postgres), **no** de Snowflake en vivo
- [ ] **B2.4** Cache Redis opcional encima de Postgres: hit → return; miss → Postgres → populate Redis (TTL 5–15 min)
- [ ] **B2.5** Lógica de estado `DEGRADADO`: si `frescura > cadencia × tolerancia` → marcar degradado con `razon` y `desbloqueaCon`
- [ ] **B2.6** Lógica de estado `BLOQUEADO`: job falló o precondición no cumplida → sin valor, con razón
- [ ] **B2.7** Lógica de estado `SIN_PERMISO` en batch si el rol no puede ver la métrica
- [ ] **B2.8** Invalidar cache al publicar layout nuevo
- [ ] **B2.9** Invalidar cache al completar materialización
- [ ] **B2.10** Campo `frescura` del payload = timestamp de materialización, no "ahora"
- [ ] **B2.11** Filtrado por rol también en batch (no devolver payloads de métricas ocultas)

---

### Fase 3 — Chat contextual

- [ ] **B3.1** `POST /api/v1/config/chat` — SSE con body `{ pregunta, contextoPanel, periodo, hiloId? }`
- [ ] **B3.2** `GET /api/v1/config/chat/hilos` — historial de conversaciones del usuario
- [ ] **B3.3** Modelo `AgenteTenant`: `snowflakeAccount`, `warehouse`, `semanticViews[]`, `systemPromptBase`; credenciales vía secret manager
- [ ] **B3.4** Resolver agente del tenant a partir del JWT (front solo conoce `tenantId`)
- [ ] **B3.5** Inyectar `ContextoDePanel` en system prompt del agente (sin exponer SQL del panel)
- [ ] **B3.6** Consulta Snowflake en vivo para chat (semantic layer / vistas aprobadas)
- [ ] **B3.7** Emitir eventos SSE: `pensando` → `fragmento` → `dato` → `sql` → `error` → `fin`
- [ ] **B3.8** Permitir que respuesta del agente incluya `{ forma, datos, procedencia }` reutilizable por el front
- [ ] **B3.9** CRUD `/admin/tenants/{id}/agents` — configuración de agente por tenant (superadmin)
- [ ] **B3.10** Persistir hilos y mensajes en Postgres

---

### Fase 4 — Admin y Builder (superadmin)

#### Tenants y layouts

- [ ] **B4.1** `GET /admin/tenants` — lista de clientes
- [ ] **B4.2** `GET /admin/tenants/{id}/layouts` — versiones de dashboard (borrador + publicado)
- [ ] **B4.3** `POST /admin/tenants/{id}/layouts` — crear borrador de layout
- [ ] **B4.4** `PUT /admin/layouts/{id}` — editar tabs + panels (nombre, pregunta, orden, sugerencias de chat, paneles con metricId, tipo, colStart, colSpan, rowSpan, opciones)
- [ ] **B4.5** `POST /admin/layouts/{id}/publish` — publicar versión, generar `versionId`, invalidar cache de layout del tenant
- [ ] **B4.6** `POST /admin/layouts/{id}/validate` — validar composición contra reglas SYNAPSE_BLOCKS (tipo ↔ forma ↔ span)
- [ ] **B4.7** `GET /admin/tenants/{id}/catalog` — métricas disponibles para asignar a paneles

#### Roles y permisos

- [ ] **B4.8** CRUD de roles por tenant: `tabIds[]`, `hiddenMetricIds[]`, `layoutOverrides`
- [ ] **B4.9** Preview por rol: endpoint o flag que resuelva layout como lo vería un rol específico (CEO vs Planner)
- [ ] **B4.10** Asignación de layout publicado a roles (multi-dashboard)

#### Validaciones de composición

- [ ] **B4.11** Validar que `metricId` existe en catálogo del tenant
- [ ] **B4.12** Validar que `tipo` es compatible con `forma` de la métrica
- [ ] **B4.13** Validar rangos de `colSpan`/`rowSpan` por tipo de bloque
- [ ] **B4.14** Validar opciones de layout (ej. `maximo` obligatorio para gauge)
- [ ] **B4.15** Rechazar publicación si hay paneles inválidos

---

### Fase 5 — Multi-dashboard y pulido backend

- [ ] **B5.1** Soporte de varios layouts por tenant (ej. "Operaciones", "Marca", "Ejecutivo")
- [ ] **B5.2** Asignar layout por rol o permitir elección si el usuario tiene varios
- [ ] **B5.3** Implementar formas v1.1 cuando haya datos: `categoricaComparada`, `perfilMultiatributo`, `matriz`, `grafo`, `flujo`
- [ ] **B5.4** Endpoint de drill-down bajo demanda (Snowflake en vivo, similar a chat)
- [ ] **B5.5** Auditoría de publicaciones de layout (quién, cuándo, qué cambió)
- [ ] **B5.6** Tests de integración por endpoint consola
- [ ] **B5.7** Tests del job de materialización con fixtures Snowflake

---

## Frontend

### Fase 0 — Fundamentos e infraestructura

- [ ] **F0.1** Estructura de carpetas según §4: `app/`, `api/`, `tokens/`, `catalog/`, `render/`, `surfaces/`
- [ ] **F0.2** Configurar React 19 + TypeScript `strict` (sin `any` en props)
- [ ] **F0.3** Configurar TanStack Query (`QueryClientProvider`)
- [ ] **F0.4** Configurar React Router: `/` (consola), `/admin/*`, `/builder/*`
- [ ] **F0.5** Auth guard: login → guardar JWT → redirigir según rol
- [ ] **F0.6** Generar `src/api/types.ts` desde OpenAPI (`contracts/synapse-api.yaml`)
- [ ] **F0.7** Reutilizar `src/tokens/` del v2 (57 tokens, dark/light)
- [ ] **F0.8** Eliminar del bundle de producción: `synapse-tenants.js`, `synapse-data.js`, `src/api/mock/*`, defaults `ua_mx`/`ceo`

---

### Fase 1 — Consola consumidor (dashboard usuario final)

#### Capa API

- [ ] **F1.1** `src/api/client.ts` — fetch + bearer + envelope; **sin imports de mock**
- [ ] **F1.2** `src/api/hooks.ts` — `useContexto()`, `useCatalogo()`, `useTab(tabId)`, `usePanelesBatch(panelIds, periodo)`
- [ ] **F1.3** `src/catalog/blocks.ts` — validadores runtime tipo ↔ forma ↔ span (desde `GET /config/blocks`)
- [ ] **F1.4** `src/catalog/types.ts` — tipos compartidos de catálogo

#### Superficie consola

- [ ] **F1.5** `surfaces/console/Dashboard.tsx` — orquestación: contexto → tabs → batch
- [ ] **F1.6** `DashboardContainer` — conecta hooks con componentes de render
- [ ] **F1.7** `Topbar` — tenant, selector de periodo, tema
- [ ] **F1.8** `Tabs` — pestañas desde `ctx.tabs` (sin hardcode)
- [ ] **F1.9** `PanelEnGrilla.tsx` — puente payload → Panel → Cuerpo/Estado
- [ ] **F1.10** Selección automática de primera pestaña desde backend (`ctx.tabs[0]`)
- [ ] **F1.11** Cambiar periodo → solo re-fetch `panels:batch`, **no** layout
- [ ] **F1.12** `PUT /config/me/preferencias` al cambiar tema

#### Capa render (reutilizar/adaptar v2)

- [ ] **F1.13** Copiar/adaptar `src/render/` del v2: Panel, shells, plots, estados, grilla
- [ ] **F1.14** `render/grid.ts` — `estiloDeCelda()`, `altoDePanel()` (px = 96×N − 16)
- [ ] **F1.15** `render/Panel/` — anatomía obligatoria: título, BASE, procedencia, dirección semántica, CTA, chevron
- [ ] **F1.16** Shell compacto cuando `colSpan ≤ 3`
- [ ] **F1.17** Registro lazy `cuerpoDe(tipo)` en `render/bodies/registro.ts`
- [ ] **F1.18** Implementar/verificar **12 cuerpos existentes** del v2:

| Tipo | Cuerpo | Prioridad F1 |
|------|--------|--------------|
| `kpi` | `CuerpoKpi` | Alta |
| `gauge` | `CuerpoGauge` | Alta |
| `table` | `CuerpoTable` | Alta |
| `prose` | `CuerpoProse` | Alta |
| `series` | `CuerpoSeries` | Alta |
| `bars` | `CuerpoBars` | Alta |
| `forecast` | `CuerpoForecast` | Media |
| `list` | `CuerpoList` | Media |
| `reco` | `CuerpoReco` | Media |
| `composition` | `CuerpoComposition` | Media |
| `distribution` | `CuerpoDistribution` | Media |
| `blocked` | `CuerpoBlocked` | Alta |

- [ ] **F1.19** Estados de panel: `EstadoCargando`, `EstadoVacio`, `EstadoDegradado`, `EstadoBloqueado`, `EstadoSinPermiso`, `EstadoError`
- [ ] **F1.20** Primitivos: `Label`, `Valor`, `BadgeProcedencia`
- [ ] **F1.21** Plots SVG: `PlotGauge`, `PlotBars`, `PlotLine`, etc. (según cuerpos activos)
- [ ] **F1.22** Error explícito si `tipo` no tiene cuerpo registrado — sin fallback silencioso
- [ ] **F1.23** `memo` en cuerpos y plots; eventos hacia arriba (`onDrill`, `onChat`, `onRetry`)
- [ ] **F1.24** CSS Modules + tokens únicamente — cero hex literal

#### Conexión con backend real

- [ ] **F1.25** Conectar dashboard a API real (aunque solo devuelva 1 pestaña)
- [ ] **F1.26** Manejar estados de carga/error a nivel de superficie (no en cuerpos)
- [ ] **F1.27** Mapa `metricasPorId` desde catálogo para resolver `panel.metricId → Metrica`

---

### Fase 2 — Estados de materialización en UI

- [ ] **F2.1** Renderizar `EstadoDegradado` cuando `payload.estado === 'DEGRADADO'` (mostrar valor + razón + `desbloqueaCon`)
- [ ] **F2.2** Renderizar `EstadoBloqueado` sin cifra cuando `payload.estado === 'BLOQUEADO'`
- [ ] **F2.3** Renderizar `EstadoSinPermiso` con `solicitarA`
- [ ] **F2.4** Renderizar `EstadoError` con botón reintento (`onRetry` → re-fetch batch del panel)
- [ ] **F2.5** Mostrar frescura relativa en procedencia del panel
- [ ] **F2.6** Gobierno visible en los 6 estados (cargando usa `Metrica.base` del catálogo)

---

### Fase 3 — Chat contextual

- [ ] **F3.1** `surfaces/console/ChatOverlay.tsx` — hoja lateral/modal de chat
- [ ] **F3.2** Construir `ContextoDePanel` al hacer clic en panel: `panelId`, `metricId`, `metricKey`, `nombre`, `base`, `fuente`, `capa`, `familia`, `periodo`, `tipo`, `valorActual?`, `dimensionesDisponibles?`
- [ ] **F3.3** Botones "VER DETALLE" y "PREGUNTAR" en shell del panel → abren chat con contexto
- [ ] **F3.4** Cliente SSE para `POST /config/chat` — leer stream: pensando, fragmento, dato, sql, fin
- [ ] **F3.5** UI de mensajes con estados de streaming (pensando, escribiendo…)
- [ ] **F3.6** Si respuesta incluye `{ forma, datos, procedencia }` → reutilizar cuerpo de panel correspondiente
- [ ] **F3.7** `GET /config/chat/hilos` — listado de historial
- [ ] **F3.8** Hook `useChat(contextoPanel)` — lógica de envío y stream separada de UI

---

### Fase 4 — Admin y Builder (superadmin)

#### Superficie Admin

- [ ] **F4.1** `surfaces/admin/` — layout base con navegación
- [ ] **F4.2** Lista de tenants (`GET /admin/tenants`)
- [ ] **F4.3** Gestión de usuarios y roles por tenant
- [ ] **F4.4** Configuración de agente Snowflake por tenant (`CRUD /admin/tenants/{id}/agents`)
- [ ] **F4.5** Vista de catálogo de métricas del tenant

#### Superficie Builder

- [ ] **F4.6** `surfaces/builder/` — composición visual de dashboards
- [ ] **F4.7** Selector de tenant + plantilla base (retail, combustibles, etc.)
- [ ] **F4.8** Editor de pestañas: nombre, pregunta operativa, orden, sugerencias de chat
- [ ] **F4.9** Canvas de grilla 12 columnas — arrastrar/colocar paneles
- [ ] **F4.10** Panel configurator: elegir `metricId` del catálogo, `tipo` de bloque, `colStart`, `colSpan`, `rowSpan`, opciones
- [ ] **F4.11** Validación en tiempo real contra `/config/blocks` (tipo ↔ forma ↔ span)
- [ ] **F4.12** Preview por rol (CEO vs Planner) — llama endpoint con rol simulado
- [ ] **F4.13** Guardar borrador (`PUT /admin/layouts/{id}`)
- [ ] **F4.14** Validar (`POST /admin/layouts/{id}/validate`) antes de publicar
- [ ] **F4.15** Publicar (`POST /admin/layouts/{id}/publish`) — sin deploy
- [ ] **F4.16** Hooks dedicados: `useLayouts`, `useLayoutEditor`, `usePublishLayout` (lógica fuera de JSX)

#### Cuerpos faltantes (v1.1)

- [ ] **F4.17** `CuerpoComparison` + `PlotCompare` — forma `categoricaComparada` / `perfilMultiatributo`
- [ ] **F4.18** `CuerpoMatrix` + `PlotHeatmap` — forma `matriz`
- [ ] **F4.19** `CuerpoGraph` + `PlotGraph` — forma `grafo` / `flujo`
- [ ] **F4.20** Registrar los 3 cuerpos en `registro.ts` con lazy loading

---

### Fase 5 — Multi-dashboard, tests y pulido

- [ ] **F5.1** Selector de layout cuando `ctx.layouts.length > 1`
- [ ] **F5.2** Pasar `layoutId` a `GET /config/tabs/{tabId}?layoutId=`
- [ ] **F5.3** Completar plots faltantes según necesidad de cuerpos v1.1
- [ ] **F5.4** Drill-down overlay (si backend expone endpoint)
- [ ] **F5.5** Tests unitarios: cada cuerpo con props mínimas válidas (snapshot o assert SVG/texto)
- [ ] **F5.6** Test: cada `TipoPanel` del contrato tiene componente en registro
- [ ] **F5.7** Test: cada variante de `Payload.estado` muestra estado correcto
- [ ] **F5.8** Tests de contenedores con MSW (mock HTTP, no fixtures JS)
- [ ] **F5.9** Tests E2E: una pestaña completa con fixtures HTTP
- [ ] **F5.10** Checklist de conformidad §17 por cada tipo de bloque integrado
- [ ] **F5.11** Verificar dark/light en todos los componentes
- [ ] **F5.12** Lazy loading verificado: pestaña no descarga cuerpos que no usa

---

## Tareas transversales (ambos equipos)

| ID | Tarea | Responsable |
|----|-------|-------------|
| **T1** | Mantener `contracts/synapse-api.yaml` como fuente de verdad del contrato | Backend (escribe) + Front (consume/genera tipos) |
| **T2** | Definir y documentar las 15 reglas SYNAPSE_BLOCKS (tipo, forma, span) | Backend (valida) + Front (muestra errores de builder) |
| **T3** | Acordar formato de eventos SSE del chat | Backend |
| **T4** | Acordar estructura de `ContextoDePanel` | Ambos |
| **T5** | Seed de datos de demo (tenant UA MX, pestaña Brand Momentum) | Backend |
| **T6** | Ambiente de desarrollo con backend + front + Postgres | DevOps / ambos |
| **T7** | Revisión de conformidad con `design/design.md` y `handoff/parametros-front.md` | Front |

---

## Definition of Done — checklist rápido

### Por panel integrado (Front)

- [ ] Layout de `GET /config/tabs/{id}`, no de código
- [ ] Payload de `POST /panels:batch`, no de fixture
- [ ] Catálogo de `GET /config/catalog`
- [ ] Clic abre chat con `metricId` + contexto
- [ ] Cambiar periodo no re-fetch layout
- [ ] `render/` no importa `api/`
- [ ] Props tipadas sin `any`
- [ ] Prueba de render mínimo

### Por endpoint (Backend)

- [ ] Auth JWT requerido
- [ ] Envelope `{ success, data }`
- [ ] Filtrado por rol aplicado
- [ ] Tipos alineados con OpenAPI
- [ ] Test de integración

---

## Estimación por fase (referencia del spec)

| Fase | Backend | Frontend | Total aprox. |
|------|---------|----------|--------------|
| 1 — Consola mínima | 2–3 sem | 2–3 sem | 2–3 sem (paralelo) |
| 2 — Materialización | 2 sem | 0.5 sem | 2 sem |
| 3 — Chat | 1–2 sem | 1–2 sem | 1–2 sem |
| 4 — Admin + Builder | 2–3 sem | 3–4 sem | 3–4 sem |
| 5 — Multi-dashboard | 1 sem | 1–2 sem | 1–2 sem |

---