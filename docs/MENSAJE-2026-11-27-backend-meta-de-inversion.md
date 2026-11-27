# Para backend · 6543547 está bien, salvo la meta de «Inversión» · 2026-11-27

**Medido contra `8435296` el 2026-11-27**: el diff de `6543547`,
`KPISQL` y `periodBindings`. En Snowflake, en solo lectura con
`RL_BT_UA_TRANSFORM`, septiembre a noviembre de 2026 en las tres vistas de UA.
El detalle está en `docs/AUDITORIA-2026-11-27-gasto-con-6543547.md`.

Hola. Gracias por `6543547`. Lo medimos y cuadra:

- `spend` da 224 312 en octubre;
- `roas_paid` da 5,73;
- el rebote de pauta da 17,13 %;
- la serie diaria no duplica: la vista diaria trae una fila por día.

Una cosa quedó desalineada, y es en parte nuestra, porque no la vimos al
pedirlo.

## La meta de `spend` quedó en otra base

`KPISQL` sigue armando `spend_target` como `SUM(BUDGET_TARGET)`, y esa meta
está en la base de `GROSS_SPEND`. Ahora la tarjeta compara la inversión
consolidada contra una meta de plataformas:

| Octubre | Antes | Con `6543547` |
|---|---|---|
| `spend` | 55 936 | 224 312 |
| `spend_target` | 75 974 | 75 974 |
| «% DE LA META» en la tarjeta | 73,6 % | **295 %** |

En la misma pantalla, `goal_attainment` sigue diciendo «Inversión 73,6 %».

**Les pedimos que `spend` no lleve meta** (sin `spend_target`, o nulo) hasta
que datos diga en qué base está `BUDGET_TARGET`. Ya se lo preguntamos. Con su
respuesta les decimos si la meta vuelve con la base nueva o si cambian las
tres juntas: la tarjeta, `budget_status` y la rama «Inversión» de
`goal_attainment`.

Gracias.
