# Estado del proyecto

> **GENERADO** desde `plan-de-trabajo.md` con `npm run plan`. Se pisa entero
> en cada corrida: si un número de acá no cuadra con el plan, el que está mal
> es este archivo y se arregla regenerándolo, no editándolo.


**93 de 194 tareas cerradas.** 12 parciales · 84 pendientes · 5 diferidas.


## Front · 86 de 112

| Fase | Avance | Hechas | Parciales | Pendientes |
|---|---|---|---|---|
| 0 · Fundamentos | `██████████████████████` | 16/16 | 0 | 0 |
| 1 · Consola y render/ | `████████████████████··` | 40/43 | 1 | 2 |
| 2 · Estados | `██████████████████····` | 5/6 | 1 | 0 |
| 3 · Chat contextual | `████████··············` | 4/11 | 1 | 3 |
| 4 · Admin y Builder | `█████████████·········` | 14/23 | 2 | 7 |
| 5 · Pruebas y pulido | `████████████··········` | 7/13 | 1 | 4 |

## Backend · 7 de 82

> ⚠️ **Este número está bajo y no refleja al backend.** El plan de acá
> es la fuente del FRONT; el estado de las tareas `B*` solo se mueve
> cuando el front lo verifica contra el servicio, y eso se hizo por
> primera vez el 2026-09-14 y solo para las de Fase 1.
>
> El backend lleva su propio avance en
> `docs/dynamic-dashboard-backend.md` de su repositorio, donde hay
> mucho más marcado como hecho. **Para informar avance del backend hay
> que mirar ahí, no acá** — y para cruzarlo, la tabla de equivalencias
> de `docs/ESTADO-B1.13-B1.19-2026-09-14.md`, porque los
> identificadores no coinciden.

| Fase | Avance | Hechas | Parciales | Pendientes |
|---|---|---|---|---|
| 0 · Fundamentos | `██····················` | 1/10 | 1 | 8 |
| 1 · API de consola | `████··················` | 5/26 | 3 | 18 |
| 2 · Materialización | `██····················` | 1/13 | 0 | 12 |
| 3 · Chat contextual | `······················` | 0/10 | 0 | 10 |
| 4 · Admin y Builder | `······················` | 0/16 | 2 | 14 |
| 5 · Multi-dashboard y pulido | `······················` | 0/7 | 0 | 6 |

---

## Se puede tomar hoy · 16 del front

- **F1.13b** · Portar format.ts e inyectar el locale
- **F1.31** · Registro de gráficos y verificación de mínimos
- **F2.3** · SIN_PERMISO · B0.9 (línea 1171) contestada
- **F3.3** · «Ver detalle» y «Preguntar» en el shell del panel
- **F3.7** · Historial de hilos
- **F4.12** · Preview por rol
- **F4.17** · ComparisonBody + ComparePlot
- **F4.18** · MatrixBody + HeatmapPlot
- **F4.19** · GraphBody + GraphPlot
- **F4.20** · Registrar los tres con carga diferida
- **F4.21** · Selector de gráfico en el builder
- **F4.3** · Gestión de usuarios y roles por tenant
- **F5.1** · Selector de layout cuando hay más de uno
- **F5.10** · Checklist de conformidad §17 por tipo de bloque integrado
- **F5.2** · Pasar layoutId a GET /config/tabs/{tabId}
- **F5.3** · Completar los plots que falten

---

## Bloqueadas · 27

Lo que el front espera del backend está detallado en
[`PARA-BACKEND.md`](PARA-BACKEND.md), que también se genera desde el plan.


**Front**

- **F1.25** · Conectar a la API real
- **F3.2** · Construir ContextoDePanel al abrir
- **F3.6** · Reutilizar cuerpos de panel para respuestas estructuradas
- **F4.4** · Configuración de agente Snowflake por tenant
- **F4.9** · Canvas de 12 columnas — arrastrar y colocar
- **F5.13** · Períodos libres en el selector

**Backend**

- **B0.4** · Middleware de auth y envelope
- **B0.6** · Extender el contrato con admin y builder
- **B1.1** · GET /config/me
- **B1.13** · Presentacion opcional
- **B1.14** · Transformar a las formas de Valor
- **B1.15** · Validar reglas mínimas por forma antes de enviar
- **B1.16** · Seed de demo: 1 tenant, 1 layout, 1 pestaña, 4–6 paneles
- **B1.17** · Modelo Metrica
- **B1.18** · Sincronizar el catálogo con las semantic views de Snowflake
- **B1.19** · Filtrar el catálogo por permisos de rol
- **B1.21** · Declarar los mínimos de datos por gráfico
- **B1.6** · POST /config/panels:batch
- **B2.13** · Salud de feeds por fuente · de acá sale el ESTADO de cada métrica
- **B2.7** · Estado SIN_PERMISO en el batch
- **B3.1** · POST /config/chat con SSE
- **B3.9** · CRUD /admin/tenants/{id}/agents
- **B4.1** · GET /admin/tenants
- **B4.10** · Asignación de layout publicado a roles
- **B4.2** · GET /admin/tenants/{id}/layouts
- **B4.4** · PUT /admin/layouts/{id} — editar pestañas y paneles
- **B5.1** · Varios layouts por tenant

---

## Qué consultar para qué

| Pregunta | Dónde |
|---|---|
| ¿Cómo va el proyecto? | **este archivo** |
| ¿Qué le falta al backend? | `docs/PARA-BACKEND.md` |
| ¿Qué hace exactamente una tarea? | `plan-de-trabajo.md` · la fuente |
| ¿Qué sigue en el código? | `CLAUDE.md` · «Dónde retomar» |
| ¿Qué hay que hacer en Snowflake? | `docs/snowflake/INSTRUCCION-ALTA-TENANT.md` |

