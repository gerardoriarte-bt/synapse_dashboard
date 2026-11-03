# Estado del proyecto

> **GENERADO** desde `plan-de-trabajo.md` con `npm run plan`. Se pisa entero
> en cada corrida: si un número de acá no cuadra con el plan, el que está mal
> es este archivo y se arregla regenerándolo, no editándolo.


**218 de 281 tareas cerradas.** 16 parciales · 43 pendientes · 4 diferidas.


## Front · 157 de 177

| Fase | Avance | Hechas | Parciales | Pendientes |
|---|---|---|---|---|
| 0 · Fundamentos | `██████████████████████` | 16/16 | 0 | 0 |
| 1 · Consola y render/ | `█████████████████████·` | 44/46 | 2 | 0 |
| 2 · Estados | `██████████████████████` | 6/6 | 0 | 0 |
| 3 · Chat contextual | `█████████████████·····` | 13/17 | 0 | 2 |
| 4 · Admin y Builder | `██████████████████████` | 24/24 | 0 | 0 |
| 5 · Pruebas y pulido | `████████████████████··` | 54/58 | 0 | 3 |
| 6 · Métricas y reporte | `······················` | 0/10 | 1 | 9 |

## Backend · 61 de 104

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
| 1 · API de consola | `███████████████·······` | 23/34 | 5 | 6 |
| 2 · Materialización | `███████████···········` | 8/16 | 3 | 5 |
| 3 · Chat contextual | `████████··············` | 4/11 | 2 | 5 |
| 4 · Admin y Builder | `████████████████████··` | 18/20 | 1 | 1 |
| 5 · Multi-dashboard y pulido | `██████················` | 2/7 | 1 | 3 |
| 6 · Métricas y reporte | `······················` | 0/6 | 0 | 6 |

---

## Se puede tomar hoy · 6 del front

- **F3.16** · El mes en curso se marca en el trazo, no sólo en un aviso
- **F3.17** · Un dato que falta se dibuja como hueco
- **F5.21** · Qué hace un gráfico cuando el dato excede lo legible
- **F6.1** · Pedirle al backend el cálculo de Terpel
- **F6.5** · El plan de diseño: el mapa de UX del reporte programado
- **F6.8** · Los colores del producto en el correo

---

## Bloqueadas · 15

Lo que el front espera del backend está detallado en
[`PARA-BACKEND.md`](PARA-BACKEND.md), que también se genera desde el plan.


**Front**

- **F1.42** · El mes en curso está incompleto y el selector no lo dice
- **F1.44** · El orden de una tabla se anuncia, no se aplica
- **F5.13** · Períodos libres en el selector
- **F5.3** · Completar los plots que falten
- **F6.10** · Validar las respuestas antes de activar
- **F6.2** · Pedirle al backend las de UA
- **F6.3** · Verificar en QA las métricas de Terpel y de UA
- **F6.4** · Transcribir las rutas de reportes al cable de administración
- **F6.6** · Los reportes de un cliente, en administración
- **F6.7** · Crear y editar un reporte
- **F6.9** · Mirar un correo real

**Backend**

- **B2.12** · Correr el materializador contra datos reales y verificar los seis estados
- **B2.14** · /config/solicitudes · pedir acceso a una métrica que no se ve
- **B2.15** · Encender DD_MATERIALIZE_PROSE_ENABLED y avisar
- **B6.2** · Calcular las métricas de UA que faltan

---

## Qué consultar para qué

| Pregunta | Dónde |
|---|---|
| ¿Cómo va el proyecto? | **este archivo** |
| ¿Qué le falta al backend? | `docs/PARA-BACKEND.md` |
| ¿Qué hace exactamente una tarea? | `plan-de-trabajo.md` · la fuente |
| ¿Qué sigue en el código? | `CLAUDE.md` · «Dónde retomar» |
| ¿Qué hay que hacer en Snowflake? | `docs/snowflake/INSTRUCCION-ALTA-TENANT.md` |

