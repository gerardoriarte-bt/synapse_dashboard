# Estado del proyecto

> **GENERADO** desde `plan-de-trabajo.md` con `npm run plan`. Se pisa entero
> en cada corrida: si un número de acá no cuadra con el plan, el que está mal
> es este archivo y se arregla regenerándolo, no editándolo.


**123 de 210 tareas cerradas.** 19 parciales · 63 pendientes · 5 diferidas.


## Front · 106 de 125

| Fase | Avance | Hechas | Parciales | Pendientes |
|---|---|---|---|---|
| 0 · Fundamentos | `██████████████████████` | 16/16 | 0 | 0 |
| 1 · Consola y render/ | `████████████████████··` | 41/46 | 3 | 2 |
| 2 · Estados | `██████████████████····` | 5/6 | 1 | 0 |
| 3 · Chat contextual | `██████████████████····` | 12/15 | 0 | 0 |
| 4 · Admin y Builder | `████████████████······` | 18/24 | 1 | 5 |
| 5 · Pruebas y pulido | `█████████████████·····` | 14/18 | 0 | 3 |

## Backend · 17 de 85

> ⚠️ **Este número está bajo y no refleja al backend.** El plan de acá
> es la fuente del FRONT; el estado de las tareas `B*` solo se mueve
> cuando el front lo verifica contra el servicio corriendo. Se hizo por
> primera vez el 2026-09-14 y sólo con las de Fase 1; el 2026-09-26
> se midieron también las de las fases 2, 3 y 4 contra `8633b10`.
>
> **Una `B*` cerrada acá dice CONTRA QUÉ se cerró**, y varias dicen
> que un bullet se leyó de su código porque no hay dato de esa forma
> todavía. Eso es cobertura declarada, no cobertura supuesta.
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
| 1 · API de consola | `█████████·············` | 11/27 | 5 | 11 |
| 2 · Materialización | `███···················` | 2/13 | 1 | 10 |
| 3 · Chat contextual | `······················` | 0/11 | 2 | 9 |
| 4 · Admin y Builder | `████··················` | 3/17 | 4 | 10 |
| 5 · Multi-dashboard y pulido | `······················` | 0/7 | 1 | 5 |

---

## Se puede tomar hoy · 1 del front

- **F1.13b** · Portar format.ts e inyectar el locale

---

## Bloqueadas · 26

Lo que el front espera del backend está detallado en
[`PARA-BACKEND.md`](PARA-BACKEND.md), que también se genera desde el plan.


**Front**

- **F1.25** · Conectar a la API real
- **F1.31** · Registro de gráficos y verificación de mínimos
- **F1.42** · El mes en curso está incompleto y el selector no lo dice
- **F1.44** · El orden de una tabla se anuncia, no se aplica
- **F2.3** · SIN_PERMISO · B0.9 (línea 1171) contestada
- **F4.12** · Preview por rol
- **F4.17** · ComparisonBody + ComparePlot
- **F4.18** · MatrixBody + HeatmapPlot
- **F4.19** · GraphBody + GraphPlot
- **F4.20** · Registrar los tres con carga diferida
- **F4.21** · Selector de gráfico en el builder
- **F5.1** · Selector de layout cuando hay más de uno
- **F5.13** · Períodos libres en el selector
- **F5.3** · Completar los plots que falten

**Backend**

- **B0.4** · Middleware de auth y envelope
- **B1.1** · GET /config/me
- **B1.13** · Presentacion opcional
- **B1.16** · Seed de demo: 1 tenant, 1 layout, 1 pestaña, 4–6 paneles
- **B1.21** · Declarar los mínimos de datos por gráfico
- **B1.6** · POST /config/panels:batch
- **B2.12** · Correr el materializador contra datos reales y verificar los seis estados
- **B2.7** · Estado SIN_PERMISO en el batch
- **B3.11** · Aplicar las migraciones de 82da946 sobre la base compartida
- **B4.2** · GET /admin/tenants/{id}/layouts
- **B4.4** · PUT /admin/layouts/{id} — editar pestañas y paneles
- **B4.9** · Preview por rol · LA TOMARON, y más chica

---

## Qué consultar para qué

| Pregunta | Dónde |
|---|---|
| ¿Cómo va el proyecto? | **este archivo** |
| ¿Qué le falta al backend? | `docs/PARA-BACKEND.md` |
| ¿Qué hace exactamente una tarea? | `plan-de-trabajo.md` · la fuente |
| ¿Qué sigue en el código? | `CLAUDE.md` · «Dónde retomar» |
| ¿Qué hay que hacer en Snowflake? | `docs/snowflake/INSTRUCCION-ALTA-TENANT.md` |

