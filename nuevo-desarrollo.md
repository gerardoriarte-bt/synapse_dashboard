# Arquitectura del front dinámico · Synapse

**Documento normativo para el nuevo front · 2026-08-31**

Este documento define **cómo debe funcionar el front de Synapse** cuando deje de ser un prototipo con datos quemados y pase a ser un **renderizador puro de React** que consume servicios. No describe el repo v2 tal como está hoy: describe el objetivo.

---

## 0 · Opinión sobre la propuesta

**Sí, es coherente.** Es el patrón correcto para un producto multi-cliente con dashboards configurables:

| Pieza | Veredicto |
|---|---|
| Backend define layout (qué bloques, dónde, con qué tipo) | ✅ Correcto. Es server-driven UI de verdad. |
| Front solo renderiza lo que recibe | ✅ Correcto. Sin lógica de negocio ni datos hardcodeados. |
| Superadmin configura → usuarios ven sin deploy | ✅ Correcto. Requiere layout en DB + API de escritura. |
| Materializar datos periódicamente (cache) | ✅ Correcto para dashboards. Snowflake en vivo por panel sería lento y caro. |
| Chat al hacer clic en un bloque, con contexto de esa métrica | ✅ Correcto y diferenciador. El yaml ya prevé que chat y paneles comparten la misma unión `Valor + Gobierno`. |
| Multi-tenant, multi-dashboard, multi-agente por cuenta | ✅ Correcto. Cada tenant tiene su layout, su catálogo filtrado y su agente/contexto Snowflake. |

**Advertencias prácticas:**

1. **Cache ≠ fuente de verdad.** Redis (o `panel_data` en Postgres) guarda snapshots materializados. Snowflake sigue siendo la fuente; el job de materialización es quien refresca.
2. **El chat sí puede ir a Snowflake en vivo** (o a un semantic layer), porque es una consulta puntual iniciada por el usuario, no un dashboard entero.
3. **Separar tres cosas que hoy están mezcladas:** layout (estructura), catálogo (metadatos de métricas), payload (valores del período).
4. **El front no valida permisos:** si un rol no debe ver un panel, el backend no lo manda ni en layout ni en batch.

---

## 1 · Principios inviolables

1. **Cero datos quemados.** Ningún número, serie, fila de tabla ni texto de negocio en código o en archivos estáticos del front.
2. **Cero layout quemado.** Ningún panel, pestaña ni posición en grilla en JSX. Todo viene del backend.
3. **Front = render puro.** Recibe props, pinta SVG/HTML, emite eventos (clic, drill-down, chat). No calcula degradación, no filtra por rol, no parsea strings a números.
4. **Un panel se ancla a `metricId`, nunca a SQL ni nombre de tabla.**
5. **Toda cifra lleva gobierno:** `base`, `capa`, `fuente`, `frescura`, `catalogVersion`.
6. **El tipo de bloque es contrato.** El backend declara `tipo`; el front elige el componente. Si el tipo no existe, error explícito — no fallback silencioso.
7. **Separación layout / datos.** Cambiar de período no re-pide el layout. Solo se vuelve a pedir `panels:batch`.
8. **Componentes React con mejores prácticas.** Funciones puras en `render/`, TypeScript strict, composición por capas, datos de servidor vía TanStack Query — ver §4.

---

## 2 · Actores y responsabilidades

```
┌─────────────────────────────────────────────────────────────────────────┐
│ SUPERADMIN (plataforma)                                                 │
│  · Crea/edita dashboards por tenant                                     │
│  · Asigna pestañas, paneles, métricas, spans                            │
│  · Publica versión del layout                                           │
│  · Configura agente Snowflake / semantic layer por tenant               │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ CRUD layout + catálogo
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ BACKEND                                                                 │
│  · Persiste layout, roles, permisos, catálogo                           │
│  · Materializa datos de paneles (job periódico → cache/Postgres)        │
│  · Sirve contexto, layout, catálogo, batch de payloads                  │
│  · Chat: consulta Snowflake con contexto del panel clickeado            │
│  · Filtra por rol: ocultar ≠ permitir                                   │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ JSON por HTTP (REST + SSE)
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ FRONT (React puro)                                                      │
│  · Auth + routing                                                       │
│  · Fetch contexto → tabs → batch                                        │
│  · Grilla 12 cols → Panel → Cuerpo → Plot                               │
│  · Chat overlay con contexto del panel                                  │
│  · Cero imports de fixtures                                             │
└─────────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ USUARIO FINAL (planner, CEO, etc.)                                      │
│  · Ve el dashboard que el superadmin publicó para su rol                │
│  · Cambia período, abre drill-down, chatea sobre un bloque              │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3 · Flujo de trabajo lineal

### Fase A — Superadmin diseña el dashboard

```
1. Superadmin entra a Admin/Builder (superficie plataforma)
2. Elige tenant (ej. UA MX) y plantilla base (retail, combustibles, etc.)
3. Compone pestañas:
   - nombre, pregunta operativa, orden
   - sugerencias de chat por pestaña
4. Por cada pestaña, arrastra/coloca paneles:
   - elige metricId del catálogo del tenant
   - elige tipo de bloque (kpi, gauge, table, …)
   - define colStart, colSpan, rowSpan
   - opciones de presentación (orden, tope, mostrar medidor, …)
5. Previsualiza por rol (CEO vs Planner)
6. Publica → POST /admin/layouts/{id}/publish
   - genera versionId
   - invalida cache de layout del tenant
```

### Fase B — Backend persiste y materializa

```
1. Layout publicado queda en Postgres:
   - tenants, roles, tabs, panels, panel_options
   - versionado (borrador / publicado)
2. Job de materialización (cron o evento):
   - por cada (tenant, metricId, periodo activo):
     · consulta Snowflake / semantic layer
     · transforma a Forma + Gobierno + Presentacion
     · escribe en panel_data (Postgres) y/o Redis (TTL)
3. Catálogo de métricas por tenant sincronizado con semantic views
```

### Fase C — Usuario entra y ve su dashboard

```
1. Login → JWT con tenant_id, role_id, user_id
2. GET /api/v1/config/me
   → user, tenant, role, tabs (metadatos), periodos, catalogVersion
3. GET /api/v1/config/catalog
   → métricas permitidas para este rol (nombre, familia, forma, base, …)
4. Usuario elige pestaña → GET /api/v1/config/tabs/{tabId}
   → panels[] (layout sin datos)
5. POST /api/v1/config/panels:batch
   body: { panelIds: [...], periodo: "2026-07" }
   → { [panelId]: Payload }
6. Front renderiza grilla iterando panels[] + payloads + métricas del catálogo
```

### Fase D — Usuario hace clic en un bloque → chat contextual

```
1. Usuario clic en "VER DETALLE" o "PREGUNTAR" sobre un panel
2. Front abre overlay de chat con contexto:
   {
     panelId, metricId, metricKey, nombre, base, fuente,
     periodo, familia, valorResumido (opcional)
   }
3. POST /api/v1/config/chat  (SSE)
   body: { pregunta, contextoPanel, periodo, hiloId? }
4. Backend:
   - inyecta contexto en el agente del tenant
   - consulta Snowflake en vivo (semantic layer / vistas aprobadas)
   - emite eventos: pensando → fragmento → dato estructurado → sql → fin
5. Front muestra respuesta; si llega Valor+Gobierno, puede reutilizar el mismo cuerpo de panel
```

---

## 4 · Arquitectura del front (React puro)

```
src/
├── app/                    # Router, providers, auth guard
├── api/
│   ├── client.ts           # fetch + bearer + envelope — SIN mock import
│   ├── hooks.ts            # TanStack Query
│   └── types.ts            # generado desde OpenAPI
├── tokens/                 # CSS variables (tema dark/light)
├── catalog/                # SOLO tipos y validadores runtime (desde API)
│   ├── blocks.ts           # validar tipo ↔ forma ↔ span
│   └── types.ts
├── render/                 # PURO — no importa api/
│   ├── Panel/              # Shell + anatomía obligatoria
│   ├── bodies/             # 15 cuerpos (uno por TipoPanel)
│   ├── plots/              # SVG responsivos
│   ├── states/             # 6 estados (carga, vacío, degradado, …)
│   └── grid.ts             # colSpan/rowSpan → px
└── surfaces/
    ├── console/            # Dashboard consumidor
    ├── admin/              # Superadmin: tenants, usuarios, catálogo
    └── builder/            # Composición de dashboards
```

### Reglas de capa

| Capa | Puede | No puede |
|---|---|---|
| `render/` | Recibir props, formatear, pintar | fetch, contexto global, conocer tenant |
| `surfaces/` | fetch, estado de UI, routing | Lógica de negocio, SQL, filtrar permisos |
| `api/` | HTTP, cache, tipos | Conocer JSX |

### Componentes React y mejores prácticas

El front se construye **100 % en React 18 + TypeScript**. No hay otro framework de UI ni librería de charting: los gráficos son SVG propio dentro de componentes. Estas reglas aplican a todo el código nuevo.

#### Modelo de componentes

| Tipo | Ubicación | Responsabilidad | Ejemplo |
|---|---|---|---|
| **Primitivo** | `render/primitives/` | Pieza visual atómica, sin lógica de negocio | `Label`, `Valor`, `BadgeProcedencia` |
| **Plot** | `render/plots/` | SVG responsivo para una forma de dato | `PlotGauge`, `PlotBars` |
| **Cuerpo** | `render/bodies/` | Traduce `Valor` + params → composición de plots/primitivos | `CuerpoKpi`, `CuerpoTable` |
| **Panel** | `render/Panel/` | Shell con anatomía obligatoria (título, BASE, procedencia) | `Panel`, `PanelShell` |
| **Estado** | `render/states/` | Sustituye el cuerpo cuando hay carga, error, bloqueo | `EstadoCargando`, `EstadoBloqueado` |
| **Superficie** | `surfaces/*/` | Orquesta fetch, routing y estado de UI | `Dashboard`, `BuilderCanvas` |
| **Contenedor** | junto a la superficie | Conecta hooks de datos con componentes de render | `DashboardContainer` |

**Jerarquía de composición:**

```
Superficie → Contenedor (hooks) → Grilla → Panel → Cuerpo → Plot / Primitivo
```

Un componente **no salta capas**: un `Plot` nunca importa un hook de API; una `Superficie` nunca dibuja SVG directamente.

#### Reglas de implementación

1. **Funciones puras en `render/`.** Un cuerpo o plot es `(props) → JSX`. Sin `useState` de datos de negocio, sin `useEffect` de fetch. El único estado local permitido es de layout (medir contenedor con `ResizeObserver`).

2. **TypeScript `strict` sin excepciones.** Props tipadas con uniones discriminadas (`Payload`, `Valor`, `TipoPanel`). Prohibido `any` en props de componentes — el v2 lo toleró en el registro de cuerpos; el front nuevo no.

3. **Un componente, un archivo, una exportación nombrada.** Convención: `CuerpoKpi.tsx` exporta `CuerpoKpi`. CSS Module hermano: `Cuerpo.module.css` compartido entre cuerpos, módulo propio si el componente es grande.

4. **Composición sobre configuración.** Preferir componentes pequeños compuestos a props booleanas (`showMedidor`, `isDark`, `variant="compact"`). Si hay variante real (shell compacto en `colSpan ≤ 3`), es un subcomponente o rama explícita documentada, no un flag suelto.

5. **Datos de servidor fuera del árbol de render.** TanStack Query en contenedores o hooks dedicados (`usePanelesBatch`, `useContexto`). Los componentes de `render/` reciben datos ya resueltos por props.

6. **Estado de UI local y acotado.** Tema, pestaña activa, hoja abierta (drill/chat), periodo seleccionado — viven en la superficie o en un hook de la superficie. **No** en Zustand global salvo que varias superficies no relacionadas lo necesiten (hoy no aplica).

7. **Lazy loading por tipo de panel.** Los 15 cuerpos se cargan con `React.lazy` + registro (`cuerpoDe(tipo)`). Una pestaña no descarga cuerpos que no usa. Patrón verificado en v2 — mantenerlo.

8. **`memo` solo en cuerpos y plots.** Son funciones puras que pintan SVG; memoizarlos evita repintados cuando cambia un panel vecino. No memoizar primitivos triviales ni contenedores con hooks.

9. **CSS Modules + tokens.** Cero hex literal en componentes. Todo color, radio y espaciado sale de custom properties en `tokens/`. Un `#FF5A1F` en un `.module.css` es bug.

10. **Sin lógica de negocio en JSX.** Filtrar por rol, calcular degradación, parsear números, decidir permisos — eso es backend. El front solo elige qué componente de estado renderizar según `payload.estado`.

11. **Eventos hacia arriba.** Un panel emite `onDrill`, `onChat`, `onRetry` — la superficie decide qué hacer. Los cuerpos no navegan ni abren modales por su cuenta.

12. **Keys estables.** En listas de paneles, filas de tabla y series: `key={panel.id}` o `key={ref}` — nunca índice de array si el orden puede cambiar.

#### Anti-patrones prohibidos (lecciones del v2)

| Anti-patrón | Por qué está mal | Qué hacer en su lugar |
|---|---|---|
| Importar mock desde una superficie | Acopla UI a datos falsos | Solo `api/client.ts` habla con el backend |
| Defaults de tenant/rol en componente | Quema configuración | Derivar de JWT / `GET /config/me` |
| Ramas `if (metricId === 'mmm_canales')` en consola | Lógica de producto en UI | Configuración en layout o tipo de panel |
| `useState` con datos que vienen del servidor | Duplica fuente de verdad | TanStack Query |
| Componente > 300 líneas | Mezcla orquestación y render | Dividir en contenedor + presentacional |
| Props `data: any` | Pierde garantías del contrato | Tipos generados desde OpenAPI |
| Fetch dentro de `useEffect` en cuerpo | Rompe pureza de render | Contenedor con hook |

#### Estructura de props recomendada

```typescript
// Cuerpo — solo lo que necesita para pintar
type CuerpoProps<F extends Forma, P = Record<string, unknown>> = {
  valor: Extract<Valor, { forma: F }>;
  params: P;
  span: Colocacion;
  familia: Familia;
  metrica: string;       // nombre para aria-label
  unidad?: string;
};

// Panel — shell + gobierno + callbacks
type PanelProps = {
  metrica: Metrica;
  payload: Payload;
  colocacion: PanelConfigurado;
  presentacion?: Presentacion;
  onDrill: () => void;
  onChat: () => void;
  onRetry?: () => void;
  children: React.ReactNode;  // el cuerpo o estado
};
```

#### Testing de componentes

| Qué probar | Cómo |
|---|---|
| Cuerpos y plots | Render con props mínimas válidas; snapshot o assert de texto/SVG |
| Registro de cuerpos | Cada `TipoPanel` del contrato tiene componente registrado |
| Panel + estados | Cada variante de `Payload.estado` muestra el estado correcto sin cifra cuando corresponde |
| Contenedores | Mock de API a nivel de hook (MSW o mock de `api/client`) |
| Integración | Una pestaña completa con fixtures HTTP, no fixtures JS del repo |

#### Checklist por componente nuevo

Antes de dar por terminado un componente:

- [ ] Props tipadas sin `any`
- [ ] No importa de `api/` si vive en `render/`
- [ ] Colores solo vía tokens CSS
- [ ] Sin números ni textos de negocio hardcodeados
- [ ] Exportación nombrada y archivo coherente
- [ ] Funciona en tema dark y light
- [ ] Tiene al menos una prueba de render mínimo

---

## 5 · Contrato API (resumen)

Base: `/api/v1` · Auth: `Authorization: Bearer <JWT>` · Envelope: `{ success, data }`.

### Consola (usuario final)

| Método | Ruta | Qué devuelve |
|---|---|---|
| GET | `/config/me` | Contexto: user, tenant, role, **tabs sin paneles**, periodos |
| GET | `/config/catalog` | Métricas del tenant filtradas por rol |
| GET | `/config/blocks` | Tabla tipo ↔ formas ↔ rangos de span |
| GET | `/config/tabs/{tabId}` | `{ tab, panels[] }` — layout |
| POST | `/config/panels:batch` | `{ [panelId]: Payload }` |
| POST | `/config/chat` | SSE — respuesta con contexto de panel |
| GET | `/config/chat/hilos` | Historial |
| PUT | `/config/me/preferencias` | Tema dark/light |

### Admin / Builder (superadmin)

| Método | Ruta | Qué hace |
|---|---|---|
| GET | `/admin/tenants` | Lista de clientes |
| GET | `/admin/tenants/{id}/layouts` | Versiones de dashboard |
| POST | `/admin/tenants/{id}/layouts` | Crear borrador |
| PUT | `/admin/layouts/{id}` | Editar tabs + panels |
| POST | `/admin/layouts/{id}/publish` | Publicar |
| POST | `/admin/layouts/{id}/validate` | Validar composición |
| GET | `/admin/tenants/{id}/catalog` | Métricas disponibles |
| CRUD | `/admin/tenants/{id}/agents` | Config agente Snowflake |

> El yaml actual (`contracts/synapse-api.yaml`) cubre solo consola. Los endpoints admin/builder se agregan en una extensión del contrato.

---

## 6 · Tres objetos que el front consume

### 6.1 Layout — `PanelConfigurado`

Sin datos. Solo estructura.

```typescript
type PanelConfigurado = {
  id: string;              // UUID
  tipo: TipoPanel;         // kpi | gauge | table | …
  metricId: string;        // UUID — ancla al catálogo
  colStart: number;        // 1–12
  colSpan: number;
  rowSpan: number;
  opciones?: Record<string, unknown>;  // orden, tope, mostrarMedidor, …
};
```

### 6.2 Catálogo — `Metrica`

Metadatos de gobierno. Necesarios aunque el panel esté cargando o bloqueado.

```typescript
type Metrica = {
  id: string;
  key: string;             // ej. brand_score
  nombre: string;          // "Brand Score"
  forma: Forma;            // forma nativa del dato
  familia: Familia;        // demanda | medios | inventario | cliente | externo
  capa: 'BRONZE' | 'SILVER' | 'GOLD';
  fuente: string;          // "Ads API + Brand Lift"
  ventana: string;
  base: string;            // denominador — obligatorio siempre
  unidad?: string;         // USD | % | x | null
  direccionSemantica?: string | null;  // "MÁS ALTO = MEJOR"
  granoMinimo: 'dia' | 'semana' | 'mes';
  dimensiones: string[];   // para drill-down
  catalogVersion: number;
};
```

### 6.3 Payload — datos del período

Unión discriminada por `estado`:

| estado | Cuándo | Campos clave |
|---|---|---|
| `DISPONIBLE` | Dato OK | gobierno + `valor` + `presentacion?` |
| `DEGRADADO` | Frescura vencida pero hay valor | gobierno + `valor` + `razon` + `desbloqueaCon` |
| `BLOQUEADO` | No hay dato / precondición | `razon` + `desbloqueaCon` — **sin valor** |
| `SIN_PERMISO` | Rol no autorizado | `metrica` + `solicitarA` |
| `ERROR` | Fallo técnico | `mensaje` + reintento por panel |

**Gobierno** (obligatorio en DISPONIBLE y DEGRADADO):

```typescript
type Gobierno = {
  base: string;
  capa: string;
  fuente: string;
  frescura: string;        // ISO 8601
  catalogVersion: number;
};
```

**Presentacion** (rótulos del período — vienen del backend, no del layout):

```typescript
type Presentacion = {
  label?: string;          // "USD · TOTAL"
  medidor?: { label: string; porcentaje: number; nota?: string };
  comparativo?: { label: string; delta: number; unidad?: string }[];
  nota?: string;
};
```

---

## 7 · Los 15 tipos de bloque

Registro completo heredado de `SYNAPSE_BLOCKS`. El front **debe implementar los 15**, aunque algunos no se usen en v1.

Fórmula de tamaño: `px = 96 × N − 16` (grilla 12 columnas, gap 16px).

| tipo | Nombre UI | Formas aceptadas | colSpan | rowSpan | Params de layout |
|---|---|---|---|---|---|
| `kpi` | KPI | `escalar` | 3–4 | 3–4 | comparativo, medidor |
| `prose` | Prosa / resumen | `prosa` | 8–12 | 3–4 | pilares |
| `series` | Series temporales | `serieTemporal`, `seriesMultiples` | 5–7 | 4–5 | normalizacion, corte |
| `bars` | Barras | `categorica`, `ranking` | 4–8 | 4–5 | orden, marca |
| `table` | Tabla | `tabular` | 5–8 | 4–5 | orden, columnas |
| `gauge` | Medidor / gauge | `escalar` | 3–7 | 4 | banda, componentes, **maximo** |
| `forecast` | Pronóstico | `escalarConIntervalo`, `serieConBanda` | 4–6 | 4–5 | horizonte, nivelIntervalo, corte |
| `list` | Lista / ranking | `ranking` | 3–5 | 4–5 | orden, tope |
| `reco` | Recomendación | `prosa` | 4–5 | 4–5 | tope, ventana |
| `composition` | Composición / stacked | `composicion` | 4–8 | 4–5 | cortes, orden |
| `comparison` | Comparación | `categoricaComparada`, `perfilMultiatributo` | 5–8 | 4–5 | referencia, orden, topePerfiles |
| `distribution` | Distribución | `distribucion` | 5–8 | 4–5 | bins, estadisticos |
| `blocked` | Panel bloqueado | `*` (cualquiera) | 4–6 | 4 | — |
| `matrix` | Matriz / heatmap | `matriz` | 6–12 | 5–7 | escala |
| `graph` | Grafo / flujo | `grafo`, `flujo` | 6–12 | 7 | clustering |

---

## 8 · Reglas mínimas de datos por forma

El backend **debe** enviar estos campos para que el bloque renderice sin error. El front valida en desarrollo y muestra estado ERROR si faltan.

### 8.1 `escalar`

Usado por: **kpi**, **gauge**

```typescript
{ forma: 'escalar', v: number }
```

| Bloque | Extra obligatorio | Si falta |
|---|---|---|
| `kpi` | `presentacion.label` recomendado | Renderiza cifra con label "Total" |
| `gauge` | `opciones.maximo` o param `maximo` en layout | Mensaje "Sin máximo declarado" — no dibuja arco |

Ejemplo Brand Score (captura):

```json
{
  "estado": "DISPONIBLE",
  "base": "TRIMESTRE · COMPUESTO 0–100",
  "capa": "GOLD",
  "fuente": "Ads API + Brand Lift",
  "frescura": "2026-08-14T06:00:00Z",
  "catalogVersion": 2,
  "valor": { "forma": "escalar", "v": 72 },
  "presentacion": { "label": "SOBRE 100" }
}
```

Layout del panel gauge debe incluir: `{ "maximo": 100 }`.

### 8.2 `escalarConIntervalo`

Usado por: **forecast**

```typescript
{ forma: 'escalarConIntervalo', v: number, lo: number, hi: number, nivel: number }
```

- `nivel`: confianza 0–1 (ej. 0.8 = 80%)
- **Prohibido** enviar pronóstico sin banda

### 8.3 `serieTemporal`

Usado por: **series**

```typescript
{ forma: 'serieTemporal', puntos: [{ t: string, v: number }, ...] }
```

- Mínimo 1 punto; 0 puntos → estado vacío con `vacioRazon`
- `t` ya formateado para el eje (ej. `"jul"`, `"2026-07-15"`)

### 8.4 `serieConBanda`

Usado por: **forecast**

```typescript
{
  forma: 'serieConBanda',
  nivel: number,
  puntos: [{ t: string, v: number, lo: number, hi: number }, ...]
}
```

### 8.5 `seriesMultiples`

Usado por: **series**

```typescript
{
  forma: 'seriesMultiples',
  series: [{ etiqueta: string, puntos: Punto[] }, ...]
}
```

- Mínimo 1 serie, cada serie mínimo 1 punto

### 8.6 `categorica`

Usado por: **bars**, **comparison** (parcial)

```typescript
{ forma: 'categorica', items: [{ etiqueta: string, v: number }, ...] }
```

### 8.7 `ranking`

Usado por: **bars**, **list**

```typescript
{ forma: 'ranking', items: [{ etiqueta: string, v: number, posicion: number }, ...] }
```

- `posicion` ≥ 1

### 8.8 `composicion`

Usado por: **composition**

```typescript
{
  forma: 'composicion',
  partes: [{ etiqueta: string, v: number, porcentaje: number }, ...]
}
```

- Backend calcula `porcentaje`; suma debe ser 100

### 8.9 `distribucion`

Usado por: **distribution**

```typescript
{ forma: 'distribucion', cortes: [{ etiqueta: string, v: number }, ...] }
```

### 8.10 `tabular`

Usado por: **table**

```typescript
{
  forma: 'tabular',
  columnas: [{ clave: string, titulo: string, numerica: boolean, decimales?: number, unidad?: string }],
  filas: [{ [clave: string]: string | number | null }]
}
```

Ejemplo Campañas de marca:

```json
{
  "forma": "tabular",
  "columnas": [
    { "clave": "campana", "titulo": "CAMPAÑA", "numerica": false },
    { "clave": "alcance", "titulo": "ALCANCE", "numerica": true },
    { "clave": "recuerdo", "titulo": "RECUERDO", "numerica": true, "decimales": 1 }
  ],
  "filas": [
    { "campana": "Always-on marca", "alcance": 4120000, "recuerdo": 18.4 },
    { "campana": "Lanzamiento Training", "alcance": 1880000, "recuerdo": 22.1 }
  ]
}
```

### 8.11 `prosa`

Usado por: **prose**, **reco**

```typescript
{
  forma: 'prosa',
  titular: string,
  pilares: [{ ref?: string, label: string, valor: string, nota?: string }]
}
```

- Pilares como objetos, **no strings parseables**
- `ref` opaco para acciones (`acciones.porRef`)

### 8.12 Formas v1.1 (implementar cuerpo, activar cuando backend las envíe)

| Forma | Bloque | Estructura mínima |
|---|---|---|
| `categoricaComparada` | comparison | `{ items: [{ etiqueta, v, referencia, delta }] }` |
| `perfilMultiatributo` | comparison | `{ perfiles: [{ etiqueta, atributos: [{ clave, v }] }] }` |
| `matriz` | matrix | `{ filas: string[], columnas: string[], celdas: number[][] }` |
| `grafo` | graph | `{ nodos: [{ id, etiqueta }], aristas: [{ desde, hacia, peso? }] }` |
| `flujo` | graph | `{ etapas: [{ id, etiqueta, v }], enlaces: [{ desde, hacia, v }] }` |

---

## 9 · Anatomía obligatoria de todo panel

Independiente del tipo, el shell siempre muestra:

1. **Título** con bullet de familia cromática
2. **BASE** (denominador + ventana) — de `Metrica.base` o `Payload.base`
3. **PROCEDENCIA** — capa · fuente · frescura relativa
4. **Dirección semántica** — si la métrica es compuesta
5. **Cuerpo** — según tipo y forma
6. **CTA** — "VER DETALLE" → drill-down; clic también alimenta contexto de chat
7. **Chevron de colapso**

En `colSpan ≤ 3` se usa **shell compacto** (meta en dos líneas).

---

## 10 · Materialización de datos y cache

### Problema

Un dashboard de 20–30 paneles no puede hacer 30 queries a Snowflake por cada carga de página.

### Solución recomendada (capas)

```
Snowflake (fuente de verdad)
        │
        ▼  job cada N minutos (por tenant, por periodo activo)
Materializador (Go/worker)
        │
        ├──► Postgres.panel_data  (persistente, auditable)
        │
        └──► Redis (opcional, TTL 5–15 min)  ← lectura rápida del batch
                │
                ▼
        POST /config/panels:batch  ← lee cache, no Snowflake
```

| Capa | Rol | Cuándo |
|---|---|---|
| **Postgres `panel_data`** | Snapshot materializado con gobierno completo | Fuente del batch; sobrevive reinicios |
| **Redis** | Cache caliente de respuestas batch | Opcional; reduce latencia bajo concurrencia |
| **Snowflake directo** | Solo chat y drill-down bajo demanda | Cuando el usuario pregunta |

### Reglas

- La **frescura** del payload refleja cuándo se materializó, no "ahora"
- Si `frescura > cadencia × tolerancia` → estado `DEGRADADO` (backend decide)
- Invalidar cache al publicar layout nuevo o al completar materialización
- **No inventar datos** si el job falla → `BLOQUEADO` con razón

### ¿Redis es buena idea?

**Sí, como capa opcional encima de Postgres**, no como única fuente. Patrón:

```
batch request → Redis hit? → return
             → Redis miss → Postgres.panel_data → populate Redis → return
```

TTL corto (5–15 min). El job de materialización es quien mantiene Postgres fresco.

---

## 11 · Chat contextual por bloque

### Contexto que el front envía

```typescript
type ContextoDePanel = {
  panelId: string;
  metricId: string;
  metricKey: string;
  nombre: string;
  base: string;
  fuente: string;
  capa: string;
  familia: Familia;
  periodo: string;
  tipo: TipoPanel;
  // Resumen opcional para el agente (no obligatorio)
  valorActual?: number | string;
  dimensionesDisponibles?: string[];
};
```

### Flujo

1. Clic en panel → front abre chat con `ContextoDePanel`
2. Backend selecciona **agente del tenant** (conexión Snowflake, semantic views permitidas)
3. Agente recibe system prompt con contexto de la métrica — **no el SQL del panel**
4. Respuesta vía SSE (`EventoDeChat`: pensando, fragmento, dato, sql, error, fin)
5. Si el agente devuelve `{ forma, datos, procedencia }`, el front puede renderizarlo con el **mismo cuerpo de panel** — un solo modelo de datos

### Multi-agente por cuenta

```typescript
type AgenteTenant = {
  tenantId: string;
  snowflakeAccount: string;
  warehouse: string;
  semanticViews: string[];   // vistas permitidas
  systemPromptBase: string;
  // credenciales vía secret manager — nunca en front
};
```

Cada tenant puede tener semantic views distintas, vocabulario distinto y restricciones distintas. El front solo conoce `tenantId`; el backend resuelve el agente.

---

## 12 · Multi-tenant, multi-dashboard, multi-rol

### Modelo de datos backend (conceptual)

```
Tenant
├── AgentConfig (Snowflake, semantic layer)
├── Catalog (métricas habilitadas)
├── LayoutVersion[]
│   ├── status: draft | published
│   ├── tabs[]
│   │   ├── panels[]
│   │   └── roleVisibility[]
│   └── publishedAt
├── Roles[]
│   ├── tabIds[]
│   ├── hiddenMetricIds[]
│   └── layoutOverrides (opcional por tab)
└── Users[]
    ├── roleId
    └── capabilities[]
```

### Resolución al servir `/config/me`

```
layout = tenant.layoutPublished
tabs = layout.tabs.filter(visible para role)
panels = tab.panels.filter(metricId not in role.hiddenMetricIds)
panels = applyRoleLayoutOverrides(panels, role)
catalog = tenant.catalog.filter(permitido para role)
```

El front recibe **solo lo resuelto**. No aplica filtros.

### Multi-dashboard

Un tenant puede tener **varios layouts** (ej. "Operaciones", "Marca", "Ejecutivo"). El superadmin asigna cuál layout ve cada rol, o el usuario elige si tiene varios asignados.

```
GET /config/me → layouts: [{ id, nombre }]  // si > 1
GET /config/tabs/{tabId}?layoutId=...
```

---

## 13 · Qué reutilizar del repo v2 vs qué descartar

### Reutilizar (copiar/adaptar)

| Pieza | Por qué |
|---|---|
| `src/render/` | Motor de panel puro — Panel, shells, 12 cuerpos, plots, estados, grilla |
| `src/tokens/` | Sistema de diseño (57 tokens, dark/light) |
| `design/design.md` + `.pen` | Referencia visual normativa |
| `contracts/synapse-api.yaml` | Base del contrato — extender con admin/builder |
| Tabla `SYNAPSE_BLOCKS` | Reglas de composición |
| Unión `Valor` + `Gobierno` + estados | Modelo de payload probado |

### Descartar (no llevar al nuevo front)

| Pieza | Por qué |
|---|---|
| `contracts/synapse-tenants.js` | Layout estático — reemplazar por API |
| `contracts/synapse-data.js` | Fixture de diseño |
| `src/api/mock/*` | Mock completo — solo referencia de comportamiento |
| `src/api/mock/adaptador.ts` | Parseo de strings — anti-patrón |
| `src/api/mock/relleno.ts` | Datos inventados |
| Defaults `ua_mx`/`ceo` en Consola | Hardcode |
| Import de mock desde superficies | Rompe frontera |

### Completar (faltante en v2)

| Pieza | Prioridad |
|---|---|
| 3 cuerpos: `comparison`, `matrix`, `graph` | Media — cuando backend envíe esas formas |
| `src/surfaces/admin/` | Alta — superadmin |
| `src/surfaces/builder/` | Alta — composición visual |
| Cliente HTTP real | Alta |
| Routing (react-router) | Alta |
| Auth (JWT) | Alta |

---

## 14 · Ejemplos de código por capa

Referencia mínima para un dev junior o una IA que implemente el front. **Son plantillas simplificadas**, no copiar tal cual: muestran la forma, las props y la responsabilidad de cada pieza.

> Regla: si un ejemplo trae un número de negocio (`682000`, `"Brand Score"`), es solo ilustrativo. En producción **todo eso llega del backend**.

---

### 14.1 Tipos (`src/api/types.ts` · generado desde OpenAPI)

```typescript
// Forma del dato — qué geometría tiene el valor
type Forma = 'escalar' | 'tabular' | 'prosa' | 'serieTemporal' | /* … */;

// Tipo visual del panel — qué componente React se monta
type TipoPanel = 'kpi' | 'gauge' | 'table' | 'prose' | /* … 15 en total */;

// Metadatos de la métrica (catálogo — sin valores del mes)
type Metrica = {
  id: string;
  nombre: string;           // "Brand Score"
  forma: Forma;
  familia: 'demanda' | 'medios' | 'inventario' | 'cliente' | 'externo';
  base: string;             // "TRIMESTRE · COMPUESTO 0–100"
  unidad?: string;          // "%" | "USD" | undefined
  direccionSemantica?: string | null;
};

// Layout — dónde va el panel en la grilla (sin datos)
type PanelConfigurado = {
  id: string;
  tipo: TipoPanel;
  metricId: string;
  colStart: number;   // 1–12
  colSpan: number;
  rowSpan: number;
  opciones?: Record<string, unknown>;  // ej. { maximo: 100 } para gauge
};

// Valor escalar — lo más simple
type ValorEscalar = { forma: 'escalar'; v: number };

// Payload cuando hay dato OK
type PayloadDisponible = {
  estado: 'DISPONIBLE';
  base: string;
  capa: 'GOLD' | 'SILVER' | 'BRONZE';
  fuente: string;
  frescura: string;
  catalogVersion: number;
  valor: ValorEscalar | /* otras formas */;
  presentacion?: {
    label?: string;
    comparativo?: { label: string; delta: number }[];
  };
};

// Unión — el panel puede estar en varios estados
type Payload =
  | PayloadDisponible
  | { estado: 'BLOQUEADO'; razon: string; desbloqueaCon: string }
  | { estado: 'ERROR'; mensaje: string };
```

---

### 14.2 Cliente HTTP (`src/api/client.ts`)

```typescript
const BASE = '/api/v1';

async function pedir<T>(ruta: string, opciones?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token'); // o tu auth store

  const res = await fetch(`${BASE}${ruta}`, {
    ...opciones,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...opciones?.headers,
    },
  });

  const json = await res.json();
  if (!json.success) throw new Error(json.error?.mensaje ?? 'Error de API');
  return json.data;
}

export const api = {
  me: () => pedir<Contexto>('/config/me'),

  catalogo: () => pedir<{ metrics: Metrica[] }>('/config/catalog'),

  tab: (tabId: string) => pedir<{ tab: Pestana; panels: PanelConfigurado[] }>(
    `/config/tabs/${tabId}`,
  ),

  panelesBatch: (panelIds: string[], periodo: string) =>
    pedir<Record<string, Payload>>('/config/panels:batch', {
      method: 'POST',
      body: JSON.stringify({ panelIds, periodo }),
    }),
};
```

---

### 14.3 Hook de datos (`src/api/hooks.ts`)

```typescript
import { useQuery } from '@tanstack/react-query';
import { api } from './client';

// Contexto al montar la app — una sola vez
export function useContexto() {
  return useQuery({
    queryKey: ['config', 'me'],
    queryFn: () => api.me(),
  });
}

// Catálogo de métricas del tenant
export function useCatalogo() {
  return useQuery({
    queryKey: ['config', 'catalog'],
    queryFn: () => api.catalogo(),
  });
}

// Layout de una pestaña
export function useTab(tabId: string) {
  return useQuery({
    queryKey: ['config', 'tab', tabId],
    queryFn: () => api.tab(tabId),
    enabled: tabId !== '',
  });
}

// Datos de todos los paneles de la pestaña — se re-ejecuta al cambiar periodo
export function usePanelesBatch(panelIds: string[], periodo: string) {
  return useQuery({
    queryKey: ['panels', panelIds.join(','), periodo],
    queryFn: () => api.panelesBatch(panelIds, periodo),
    enabled: panelIds.length > 0 && periodo !== '',
  });
}
```

---

### 14.4 Registro de cuerpos (`src/render/bodies/registro.ts`)

```typescript
import { lazy, type ComponentType } from 'react';
import type { TipoPanel } from '../../catalog/types';

// Cada tipo de panel → un componente React (carga diferida)
const CARGADORES: Partial<Record<TipoPanel, () => Promise<{ default: ComponentType<any> }>>> = {
  kpi:    () => import('./CuerpoKpi').then(m => ({ default: m.CuerpoKpi })),
  gauge:  () => import('./CuerpoGauge').then(m => ({ default: m.CuerpoGauge })),
  table:  () => import('./CuerpoTable').then(m => ({ default: m.CuerpoTable })),
  prose:  () => import('./CuerpoProse').then(m => ({ default: m.CuerpoProse })),
  series: () => import('./CuerpoSeries').then(m => ({ default: m.CuerpoSeries })),
  // … los 15 tipos
};

const cache = new Map<TipoPanel, ComponentType<any>>();

/** Dado el tipo que manda el backend, devuelve el componente a renderizar */
export function cuerpoDe(tipo: TipoPanel): ComponentType<any> | undefined {
  if (cache.has(tipo)) return cache.get(tipo);

  const cargador = CARGADORES[tipo];
  if (!cargador) return undefined;

  const Lazy = lazy(cargador);
  cache.set(tipo, Lazy);
  return Lazy;
}
```

---

### 14.5 Primitivo — `Label` (`src/render/primitives/Label.tsx`)

```tsx
import estilos from './Label.module.css';

type Props = { children: React.ReactNode };

/** Todo texto de meta (BASE, procedencia, labels) pasa por aquí */
export function Label({ children }: Props) {
  return <span className={estilos.label}>{children}</span>;
}
```

```css
/* Label.module.css — usa tokens, nunca hex suelto */
.label {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--dim);
}
```

---

### 14.6 Primitivo — `Valor` (`src/render/primitives/Valor.tsx`)

```tsx
type Props = {
  label: string;      // "USD · TOTAL"
  valor: number;    // 682000
  unidad?: string;  // "USD"
};

/** La cifra grande de un KPI */
export function Valor({ label, valor, unidad }: Props) {
  const texto = formatearCifra(valor); // ej. "682K"

  return (
    <div>
      <Label>{label}</Label>
      <p className={estilos.cifra}>
        {unidad && !label.includes(unidad) ? `${unidad} ` : ''}
        {texto}
      </p>
    </div>
  );
}

function formatearCifra(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}
```

---

### 14.7 Plot — `PlotGauge` (`src/render/plots/PlotGauge.tsx`)

```tsx
type Props = {
  valor: number;    // 72
  maximo: number;   // 100
  familia: string;  // color de la serie — viene del catálogo
};

/** SVG semicircular — solo dibuja, no sabe qué es "Brand Score" */
export function PlotGauge({ valor, maximo, familia }: Props) {
  const porcentaje = Math.min(100, (valor / maximo) * 100);
  const color = `var(--fam-${familia}-1)`;

  return (
    <svg viewBox="0 0 200 120" width="100%" height="100%">
      {/* Arco de fondo */}
      <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="var(--w3)" strokeWidth="12" />
      {/* Arco de progreso */}
      <path
        d="M 20 100 A 80 80 0 0 1 180 100"
        fill="none"
        stroke={color}
        strokeWidth="12"
        strokeDasharray={`${porcentaje * 2.51} 251`}
      />
      <text x="100" y="85" textAnchor="middle" className={estilos.numero}>
        {valor}
      </text>
    </svg>
  );
}
```

---

### 14.8 Cuerpo — `CuerpoKpi` (`src/render/bodies/CuerpoKpi.tsx`)

```tsx
type Props = {
  valor: { forma: 'escalar'; v: number };
  params: {
    label?: string;
    comparativo?: { label: string; delta: number }[];
  };
  unidad?: string;
  familia: string;
};

/** tipo: kpi · forma: escalar */
export function CuerpoKpi({ valor, params, unidad }: Props) {
  const { label = 'Total', comparativo = [] } = params;

  return (
    <div className={estilos.cuerpo}>
      <Valor label={label} valor={valor.v} unidad={unidad} />

      {comparativo.map(c => (
        <p key={c.label}>
          <Label>{c.label}</Label> {c.delta > 0 ? '+' : ''}{c.delta}%
        </p>
      ))}
    </div>
  );
}
```

---

### 14.9 Cuerpo — `CuerpoGauge` (`src/render/bodies/CuerpoGauge.tsx`)

```tsx
type Props = {
  valor: { forma: 'escalar'; v: number };
  params: { maximo?: number };
  unidad?: string;
  familia: string;
};

/** tipo: gauge · necesita maximo en params del layout */
export function CuerpoGauge({ valor, params, familia, unidad }: Props) {
  const { maximo } = params;

  if (!maximo || maximo <= 0) {
    return <Label>Sin máximo — no se puede dibujar el medidor</Label>;
  }

  return (
    <div className={estilos.cuerpo}>
      <PlotGauge valor={valor.v} maximo={maximo} familia={familia} />
      <Label>Sobre {maximo}{unidad ?? ''}</Label>
    </div>
  );
}
```

---

### 14.10 Cuerpo — `CuerpoTable` (`src/render/bodies/CuerpoTable.tsx`)

```tsx
type Columna = { clave: string; titulo: string; numerica: boolean };
type Props = {
  valor: {
    forma: 'tabular';
    columnas: Columna[];
    filas: Record<string, string | number | null>[];
  };
};

/** tipo: table · forma: tabular */
export function CuerpoTable({ valor }: Props) {
  const { columnas, filas } = valor;

  return (
    <table className={estilos.tabla}>
      <thead>
        <tr>
          {columnas.map(col => (
            <th key={col.clave}><Label>{col.titulo}</Label></th>
          ))}
        </tr>
      </thead>
      <tbody>
        {filas.map((fila, i) => (
          <tr key={i}>
            {columnas.map(col => (
              <td key={col.clave}>{fila[col.clave] ?? '—'}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

---

### 14.11 Estado — `EstadoCargando` (`src/render/states/EstadoCargando.tsx`)

```tsx
type Props = { tipo: TipoPanel };

/** Esqueleto con la forma del panel — no un spinner genérico */
export function EstadoCargando({ tipo }: Props) {
  return (
    <div className={estilos.esqueleto} data-tipo={tipo} aria-busy="true">
      <div className={estilos.barra} />
      <div className={estilos.barraCorta} />
    </div>
  );
}
```

---

### 14.12 Panel — shell (`src/render/Panel.tsx`)

```tsx
type Props = {
  metrica: Metrica;
  payload: Payload;
  colocacion: PanelConfigurado;
  onDrill: () => void;
  onChat: () => void;
  children: React.ReactNode;  // cuerpo o estado
};

export function Panel({ metrica, payload, colocacion, onDrill, onChat, children }: Props) {
  const estilo = estiloDeCelda(colocacion); // grid CSS desde colStart/colSpan/rowSpan

  return (
    <article className={estilos.panel} style={estilo}>
      {/* Cabecera — siempre visible, incluso si el cuerpo está cargando */}
      <header>
        <span className={estilos.bullet} data-familia={metrica.familia} />
        <h2>{metrica.nombre}</h2>
        <Label>{metrica.base}</Label>
      </header>

      {/* Procedencia */}
      <p className={estilos.procedencia}>
        <Label>{payload.estado === 'DISPONIBLE' ? payload.capa : '—'}</Label>
        · {metrica.fuente}
      </p>

      {/* Cuerpo o estado (carga, bloqueado, error…) */}
      <div className={estilos.slot}>{children}</div>

      {/* Pie */}
      {metrica.direccionSemantica && <Label>{metrica.direccionSemantica}</Label>}
      <button type="button" onClick={onDrill}>Ver detalle</button>
      <button type="button" onClick={onChat}>Preguntar</button>
    </article>
  );
}
```

---

### 14.13 Grilla (`src/render/grid.ts`)

```typescript
type Colocacion = { colStart: number; colSpan: number; rowSpan: number };

/** Convierte posición del backend a CSS Grid */
export function estiloDeCelda({ colStart, colSpan, rowSpan }: Colocacion): React.CSSProperties {
  return {
    gridColumn: `${colStart} / span ${colSpan}`,
    gridRow: `span ${rowSpan}`,
  };
}

/** px = 96 × N − 16 — altura de fila según rowSpan */
export function altoDePanel(rowSpan: number): number {
  return 96 * rowSpan - 16;
}
```

```tsx
/** Contenedor de la grilla */
export function Grilla({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={estilos.grilla}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gap: 16,
      }}
    >
      {children}
    </div>
  );
}
```

---

### 14.14 Contenedor + superficie (`src/surfaces/console/Dashboard.tsx`)

```tsx
/** CAPA SUPERFICIE — aquí sí hay hooks y fetch */
export function Dashboard() {
  const [tabId, setTabId] = useState('');
  const [periodo, setPeriodo] = useState('2026-07');

  const { data: ctx } = useContexto();
  const { data: catalogo } = useCatalogo();
  const { data: tab } = useTab(tabId);

  const panelIds = tab?.panels.map(p => p.id) ?? [];
  const { data: batch } = usePanelesBatch(panelIds, periodo);

  // Primera pestaña por defecto — viene del backend, no hardcodeada
  useEffect(() => {
    if (!tabId && ctx?.tabs[0]) setTabId(ctx.tabs[0].id);
  }, [ctx, tabId]);

  if (!ctx || !catalogo || !tab) return <p>Cargando…</p>;

  const metricasPorId = new Map(catalogo.metrics.map(m => [m.id, m]));

  return (
    <>
      <Topbar tenant={ctx.tenant} periodo={periodo} onPeriodo={setPeriodo} />
      <Tabs tabs={ctx.tabs} activa={tabId} onChange={setTabId} />

      <Grilla>
        {tab.panels.map(panel => (
          <PanelEnGrilla
            key={panel.id}
            panel={panel}
            metrica={metricasPorId.get(panel.metricId)!}
            payload={batch?.[panel.id]}
          />
        ))}
      </Grilla>
    </>
  );
}
```

---

### 14.15 Un panel en la grilla (`PanelEnGrilla.tsx`)

```tsx
/** Puente entre payload del backend y componente de render */
function PanelEnGrilla({
  panel,
  metrica,
  payload,
}: {
  panel: PanelConfigurado;
  metrica: Metrica;
  payload?: Payload;
}) {
  const [chatAbierto, setChatAbierto] = useState(false);

  // Sin payload aún → cargando
  if (!payload) {
    return (
      <Panel metrica={metrica} payload={{ estado: 'CARGANDO' } as any} colocacion={panel}
        onDrill={() => {}} onChat={() => {}}>
        <EstadoCargando tipo={panel.tipo} />
      </Panel>
    );
  }

  // Bloqueado / error → componente de estado, no cuerpo
  if (payload.estado === 'BLOQUEADO') {
    return (
      <Panel metrica={metrica} payload={payload} colocacion={panel}
        onDrill={() => {}} onChat={() => {}}>
        <EstadoBloqueado razon={payload.razon} desbloqueaCon={payload.desbloqueaCon} />
      </Panel>
    );
  }

  if (payload.estado !== 'DISPONIBLE') {
    return <Panel /* … otros estados … */ />;
  }

  const Cuerpo = cuerpoDe(panel.tipo);
  if (!Cuerpo) return <EstadoError mensaje={`Tipo ${panel.tipo} no implementado`} />;

  return (
    <>
      <Panel
        metrica={metrica}
        payload={payload}
        colocacion={panel}
        onDrill={() => abrirDrill(panel.id)}
        onChat={() => setChatAbierto(true)}
      >
        <Suspense fallback={<EstadoCargando tipo={panel.tipo} />}>
          <Cuerpo
            valor={payload.valor}
            params={panel.opciones ?? {}}
            familia={metrica.familia}
            unidad={metrica.unidad}
            metrica={metrica.nombre}
          />
        </Suspense>
      </Panel>

      {chatAbierto && (
        <ChatOverlay
          contexto={{ panelId: panel.id, metricId: panel.metricId, metrica }}
          onCerrar={() => setChatAbierto(false)}
        />
      )}
    </>
  );
}
```

---

### 14.16 Chat contextual (`src/surfaces/console/ChatOverlay.tsx`)

```tsx
type ContextoChat = {
  panelId: string;
  metricId: string;
  metrica: Metrica;
  periodo: string;
};

export function ChatOverlay({ contexto, onCerrar }: { contexto: ContextoChat; onCerrar: () => void }) {
  const [mensajes, setMensajes] = useState<string[]>([]);
  const [input, setInput] = useState('');

  async function enviar() {
    const res = await fetch('/api/v1/config/chat', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ pregunta: input, contextoPanel: contexto }),
    });

    // SSE — leer stream por partes
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      setMensajes(prev => [...prev, decoder.decode(value)]);
    }
  }

  return (
    <aside className={estilos.hoja}>
      <header>
        <h2>Preguntar sobre {contexto.metrica.nombre}</h2>
        <button onClick={onCerrar}>Cerrar</button>
      </header>
      <div>{mensajes.map((m, i) => <p key={i}>{m}</p>)}</div>
      <input value={input} onChange={e => setInput(e.target.value)} />
      <button onClick={enviar}>Enviar</button>
    </aside>
  );
}
```

---

### 14.17 Entrada de la app (`src/main.tsx`)

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Dashboard } from './surfaces/console/Dashboard';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/admin/*" element={<Admin />} />
        <Route path="/builder/*" element={<Builder />} />
      </Routes>
    </BrowserRouter>
  </QueryClientProvider>,
);
```

---

### 14.18 JSON de ejemplo — lo que manda el backend

**Layout** (`GET /config/tabs/brand`):

```json
{
  "tab": { "id": "tab-brand", "nombre": "Brand Momentum", "pregunta": "¿La marca está creciendo?" },
  "panels": [
    { "id": "p1", "tipo": "gauge",  "metricId": "m-brand-score", "colStart": 1, "colSpan": 4, "rowSpan": 4, "opciones": { "maximo": 100 } },
    { "id": "p2", "tipo": "kpi",    "metricId": "m-brand-revenue", "colStart": 5, "colSpan": 4, "rowSpan": 4 },
    { "id": "p3", "tipo": "kpi",    "metricId": "m-exposure", "colStart": 9, "colSpan": 4, "rowSpan": 4 },
    { "id": "p4", "tipo": "table",  "metricId": "m-campaigns", "colStart": 1, "colSpan": 12, "rowSpan": 5 }
  ]
}
```

**Batch** (`POST /config/panels:batch`):

```json
{
  "p1": {
    "estado": "DISPONIBLE",
    "base": "TRIMESTRE · COMPUESTO 0–100",
    "capa": "GOLD",
    "fuente": "Ads API + Brand Lift",
    "frescura": "2026-08-14T06:00:00Z",
    "catalogVersion": 2,
    "valor": { "forma": "escalar", "v": 72 },
    "presentacion": { "label": "SOBRE 100" }
  },
  "p4": {
    "estado": "DISPONIBLE",
    "base": "MES · TOP CAMPAÑAS",
    "capa": "GOLD",
    "fuente": "Ads API",
    "frescura": "2026-08-14T08:00:00Z",
    "catalogVersion": 2,
    "valor": {
      "forma": "tabular",
      "columnas": [
        { "clave": "campana", "titulo": "CAMPAÑA", "numerica": false },
        { "clave": "alcance", "titulo": "ALCANCE", "numerica": true },
        { "clave": "recuerdo", "titulo": "RECUERDO", "numerica": true, "decimales": 1 }
      ],
      "filas": [
        { "campana": "Always-on marca", "alcance": 4120000, "recuerdo": 18.4 }
      ]
    }
  }
}
```

---

### 14.19 Mapa rápido: tipo de panel → componentes que intervienen

| `tipo` | Cuerpo | Plot(s) típico(s) | `forma` del valor |
|---|---|---|---|
| `kpi` | `CuerpoKpi` | — (usa `Valor`) | `escalar` |
| `gauge` | `CuerpoGauge` | `PlotGauge` | `escalar` + `maximo` |
| `table` | `CuerpoTable` | — | `tabular` |
| `prose` | `CuerpoProse` | — | `prosa` |
| `series` | `CuerpoSeries` | `PlotLine` | `serieTemporal` / `seriesMultiples` |
| `bars` | `CuerpoBars` | `PlotBars` | `categorica` / `ranking` |
| `forecast` | `CuerpoForecast` | `PlotBand` | `escalarConIntervalo` / `serieConBanda` |
| `list` | `CuerpoList` | `PlotRanking` | `ranking` |
| `composition` | `CuerpoComposition` | `PlotStacked` | `composicion` |
| `distribution` | `CuerpoDistribution` | `PlotHist` | `distribucion` |
| `reco` | `CuerpoReco` | — | `prosa` |
| `blocked` | `CuerpoBlocked` | — | (estado, no valor) |
| `comparison` | `CuerpoComparison` | `PlotCompare` | `categoricaComparada` |
| `matrix` | `CuerpoMatrix` | `PlotHeatmap` | `matriz` |
| `graph` | `CuerpoGraph` | `PlotGraph` | `grafo` / `flujo` |

---

## 15 · Loop de render en el front (pseudocódigo)

```typescript
function Dashboard({ tabId, periodo }: Props) {
  const { data: ctx } = useContexto();           // GET /config/me
  const { data: catalog } = useCatalogo();       // GET /config/catalog
  const { data: tab } = useTab(tabId);           // GET /config/tabs/{id}
  const { data: batch } = usePanelesBatch(       // POST /panels:batch
    tab?.panels.map(p => p.id) ?? [],
    periodo
  );

  if (!tab || !catalog) return <ShellCargando />;

  const metricas = mapById(catalog.metrics);

  return (
    <Grilla columnas={12}>
      {tab.panels.map(panel => {
        const metrica = metricas.get(panel.metricId);
        if (!metrica) return null;

        const payload = batch?.[panel.id] ?? { estado: 'CARGANDO' };
        const Cuerpo = cuerpoDe(panel.tipo);

        return (
          <Panel
            key={panel.id}
            metrica={metrica}
            payload={payload}
            colocacion={panel}
            presentacion={payload.presentacion}
            onDrill={() => abrirDrill(panel, metrica)}
            onChat={() => abrirChat({ panel, metrica, periodo, payload })}
          >
            {Cuerpo && <Cuerpo valor={payload.valor} params={panel.opciones} />}
          </Panel>
        );
      })}
    </Grilla>
  );
}
```

**Ningún panel, métrica ni valor aparece literal en este código.**

---

## 16 · Fases de implementación sugeridas

### Fase 1 — Front consumidor mínimo (2–3 semanas)

- [ ] Cliente HTTP + auth JWT
- [ ] GET me, catalog, tabs, POST batch
- [ ] Reutilizar `render/` con 12 cuerpos existentes
- [ ] Conectar a backend real (aunque solo devuelva 1 pestaña)
- [ ] Eliminar todo mock del bundle de producción

### Fase 2 — Materialización (backend, paralelo)

- [ ] Job Snowflake → panel_data
- [ ] Cache Redis opcional
- [ ] Estados DEGRADADO / BLOQUEADO reales
- [ ] Filtrado por rol en batch

### Fase 3 — Chat contextual (1–2 semanas)

- [ ] Overlay C3 con contexto de panel
- [ ] SSE + agente por tenant
- [ ] Reutilizar cuerpos para respuestas estructuradas

### Fase 4 — Admin + Builder (3–4 semanas)

- [ ] CRUD layout con validación contra `/config/blocks`
- [ ] Preview por rol
- [ ] Publicar sin deploy
- [ ] Completar 3 cuerpos faltantes

### Fase 5 — Multi-dashboard + pulido

- [ ] Varios layouts por tenant
- [ ] Completar plots faltantes
- [ ] Tests E2E por tipo de bloque

---

## 17 · Checklist de conformidad (Definition of Done)

Un panel está bien integrado cuando:

- [ ] Layout viene de `GET /config/tabs/{id}`, no de código
- [ ] Payload viene de `POST /panels:batch`, no de fixture
- [ ] Catálogo viene de `GET /config/catalog`
- [ ] Gobierno visible en los 6 estados (incluso cargando usa `Metrica.base`)
- [ ] Clic abre chat con `metricId` + contexto
- [ ] Cambiar período no re-fetch layout
- [ ] Cambiar tenant/rol recomponen dashboard sin deploy
- [ ] Ningún hex literal en CSS — solo tokens
- [ ] `render/` no importa `api/`
- [ ] Componente tipado sin `any`; props siguen `CuerpoProps` / `PanelProps`
- [ ] Cuerpos y plots son funciones puras (sin fetch ni estado de negocio)
- [ ] Eventos suben por callbacks (`onDrill`, `onChat`) — el componente no navega solo
- [ ] Prueba de render mínimo con props válidas del contrato

---

## 18 · Referencias

| Documento | Rol |
|---|---|
| `design/design.md` | Reglas duras de producto |
| `handoff/parametros-front.md` | Tokens, grilla, anatomía de panel |
| `contracts/synapse-api.yaml` | Contrato consola (extender) |
| `contracts/synapse-catalog.js` | Referencia de métricas y SYNAPSE_BLOCKS |
| `handoff/arranque-backend.md` | Prioridades backend |
| `handoff/backend-handoff.md` | Materialización, chat, Postgres |

---