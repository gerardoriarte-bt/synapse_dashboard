# Estado del proyecto

> **GENERADO** desde `plan-de-trabajo.md` con `npm run plan`. Se pisa entero
> en cada corrida: si un número de acá no cuadra con el plan, el que está mal
> es este archivo y se arregla regenerándolo, no editándolo.


**168 de 223 tareas cerradas.** 15 parciales · 35 pendientes · 5 diferidas.


## Front · 111 de 125

| Fase | Avance | Hechas | Parciales | Pendientes |
|---|---|---|---|---|
| 0 · Fundamentos | `██████████████████████` | 16/16 | 0 | 0 |
| 1 · Consola y render/ | `█████████████████████·` | 43/46 | 2 | 1 |
| 2 · Estados | `██████████████████████` | 6/6 | 0 | 0 |
| 3 · Chat contextual | `██████████████████····` | 12/15 | 0 | 0 |
| 4 · Admin y Builder | `█████████████████·····` | 19/24 | 0 | 5 |
| 5 · Pruebas y pulido | `██████████████████····` | 15/18 | 0 | 2 |

## Backend · 57 de 98

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
>
> **Y para RE-verificar está `docs/ESTADO-BACKEND.md`**, que dice
> contra qué commit suyo se verificó cada `B*` y cuáles quedaron
> contra uno anterior. Este número dice cuántas; ése dice **desde
> cuándo**, que es lo que hace falta para volver a medirlas.

| Fase | Avance | Hechas | Parciales | Pendientes |
|---|---|---|---|---|
| 0 · Fundamentos | `█████████████·········` | 6/10 | 1 | 3 |
| 1 · API de consola | `█████████████·········` | 20/34 | 6 | 8 |
| 2 · Materialización | `███████████···········` | 8/16 | 2 | 6 |
| 3 · Chat contextual | `██████················` | 3/11 | 2 | 6 |
| 4 · Admin y Builder | `████████████████████··` | 18/20 | 1 | 1 |
| 5 · Multi-dashboard y pulido | `██████················` | 2/7 | 1 | 3 |

---

## Se puede tomar hoy · 0 del front

Nada del front está libre: todo lo pendiente espera algo.


---

## Bloqueadas · 18

Lo que el front espera del backend está detallado en
[`PARA-BACKEND.md`](PARA-BACKEND.md), que también se genera desde el plan.


**Front**

- **F1.31** · Registro de gráficos y verificación de mínimos
- **F1.42** · El mes en curso está incompleto y el selector no lo dice
- **F1.44** · El orden de una tabla se anuncia, no se aplica
- **F4.17** · ComparisonBody + ComparePlot
- **F4.18** · MatrixBody + HeatmapPlot
- **F4.19** · GraphBody + GraphPlot
- **F4.20** · Registrar los tres con carga diferida
- **F4.21** · Selector de gráfico en el builder
- **F5.13** · Períodos libres en el selector
- **F5.3** · Completar los plots que falten

**Backend**

- **B1.21** · Declarar los mínimos de datos por gráfico
- **B1.29** · schema-check · decir qué le falta al cliente ANTES de intentar
- **B1.30** · sync-catalog como ruta HTTP
- **B1.31** · La plataforma genera el par de claves del usuario de servicio
- **B1.34** · Declarar qué es el t de una serie, o mandar el tramo vencido
- **B2.12** · Correr el materializador contra datos reales y verificar los seis estados
- **B2.14** · /config/solicitudes · pedir acceso a una métrica que no se ve
- **B2.15** · Encender DD_MATERIALIZE_PROSE_ENABLED y avisar

---

## Qué consultar para qué

| Pregunta | Dónde |
|---|---|
| ¿Cómo va el proyecto? | **este archivo** |
| ¿Qué le falta al backend? | `docs/PARA-BACKEND.md` |
| ¿Qué hace exactamente una tarea? | `plan-de-trabajo.md` · la fuente |
| ¿Qué sigue en el código? | `CLAUDE.md` · «Dónde retomar» |
| ¿Qué hay que hacer en Snowflake? | `docs/snowflake/INSTRUCCION-ALTA-TENANT.md` |

