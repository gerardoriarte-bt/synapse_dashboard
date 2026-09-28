# Auditoría del dibujo · C6 y el punto de identidad · 2026-09-28

> **Primera auditoría del trabajo en paralelo.** La sesión que dibuja entregó
> `95f514e` con su inventario; esto es el cruce contra las fuentes. Reporta, no
> corrige — cambiar `src/` a partir de esto es una decisión de quien la pidió.

## 1 · Lo que está mal

**Nada del dibujo.** Las tres cosas que están mal son nuestras, y dos son mías.

### a · El commit `90294ea` se llevó trabajo ajeno · **mío**

Verificado: arrastró `design/Synapse_v2.pen` (+2.234), `docs/B0.9-preguntas-abiertas.md`
(+34) y una fila de `plan-de-trabajo.md`, bajo un mensaje que habla de Snowflake.

**Causa: `git add -A` con dos sesiones escribiendo.** No se perdió nada y no se
reescribió historia. La regla —rutas explícitas— quedó escrita en §6 de
`docs/INSTRUCCIONES-2026-09-28-diseno-en-el-pen.md`.

### b · La hoja de instrucciones decía una falsedad · **mío**

Decía que «los dashboards de MMM y forecast no están mapeados». **El de MMM
existe**: `Consola · C1 · Media Mix`, con cinco paneles, **y ya estaba declarado
en el registro del plan** como F3.11.

**El error es el del 2026-09-25 otra vez**: miré «Synapse · Plots» y las
pantallas que conocía en vez de listar los **97 nodos raíz**. Corregido, con el
snippet que los lista.

### c · El badge de degradado diverge del dibujo, y esa divergencia ES el defecto

Lo encontró la sesión que dibuja. Verificado acá con `tools/contraste.py`:

| | `acc` sobre `panel` | `acc` sobre `w3`+`panel` | `dim` sobre `panel` | `dim` sobre `w3`+`panel` |
|---|---|---|---|---|
| **oscuro** | **4.91** ✓ | 4.07 ✗ | **5.04** ✓ | 4.17 ✗ |
| **claro** | 5.43 ✓ | 4.55 ✓ | 5.49 ✓ | 4.60 ✓ |

El `.pen` (`V9PYxO`) dibuja un chip **sin relleno**: borde `$acc`, icono y texto
**mono 9** en `$acc`. Lo construido es `bg-w3` con `<Label>` —mono 10, `dim`—.
**El wash, el gris y el tamaño son invención nuestra**, y el wash es lo único que
hunde el par bajo 4.5.

**Corrección menor a su medición**: el wash hunde al gris apenas *más* que al
naranja —`dim` cae 0.87 y `acc` 0.84—. No cambia la conclusión: **sin wash pasan
los dos**, y eso cierra la pregunta 13 de B0.9 sin necesitar ninguna de sus tres
salidas escritas.

**Y hay una tensión que no resuelvo acá.** §2.1 cierra los usos del naranja:
«CTAs, estado activo, enlaces, cifras resaltadas dentro de un titular en prosa,
barra lateral del ítem activo», y agrega la razón: «**su exclusividad como color
de acción es lo que lo hace legible**». Un badge de degradación no es ninguno de
los cinco.

Donde el `.pen` y `design.md` difieren gana el `.pen` en lo visual **y `design.md`
en las reglas duras**, y ésta lo es. Así que:

- **Sacar el wash no tiene discusión** · es nuestro, no está dibujado, y con
  `dim` sobre `panel` da 5.04 / 5.49.
- **Pintar el badge en `acc`** sí la tiene, y es decisión de diseño y producto.

## 2 · Lo que se verificó y está bien

Cruzado el `.pen` de `90294ea~1` contra el de `90294ea`:

| | |
|---|---|
| Pantallas | **+2** · `C6 · Selector de dashboard` y su nota · **cero borradas** |
| Nodos | 7.231 → 7.310 · **+79, −0** · no se destruyó nada |
| Tamaños de texto nuevos | **ninguno** |
| Colores nuevos | **uno: `$shad`** — token, no literal |
| Hex nuevos | **ninguno** |

**El auto-reporte de la sesión que dibuja fue exacto en todo.**

- `C6` está declarada en el registro del plan **con su divergencia escrita** —que
  lo construido en F5.1 es un `<select>` y el dibujo lo reemplaza—, que es
  exactamente lo que la hoja pide.
- El velo de C6 usa `$shad` y no un literal · decisión del 2026-09-22.
- `npm run verify` sale verde sin bloqueados; `pen-pantallas` pasó de 33 a 34.

## 3 · Lo que no se pudo verificar, y es información

**Nadie miró C6.** El CLI headless no exporta imagen —la sesión que dibuja probó
`screenshot`, `export`, `render` y `preview`—, así que «lo que existe para
mirarse se abre» **sigue sin cumplirse** para esa pantalla. Lo que la auditoría
garantiza es la estructura, no el aspecto.

**Y `#0B0B0CCC` sigue siendo un hex**, en tres pantallas y no en una:
`C2 · Drill-down`, `C3 · Chat expandido` y `C3 · Chat · historial colapsado`. La
sesión que dibuja nombró la de C3; las tres son la misma propuesta abierta.

**Los hexes de `Synapse · Identidad`** —`#E75710`, `#B7450D`, `#6B6963`,
`#1A1A1C`, `#FFFFFF`— no se cuentan como violación: son los colores propios del
logotipo, que es marca y no interfaz. Queda dicho para que no se «arregle».

## 4 · Las cuatro tareas de código, y quién decide cada una

Ninguna tomada. Las declaró la sesión que dibuja y `src/` no es suyo.

| | Qué | Quién destraba |
|---|---|---|
| **a** | Sacar el wash del badge · cierra B0.9 q13 y mueve el par de `contraste.py` | **Nadie** · se puede tomar ya |
| **a'** | Pintar el badge en `acc`, mono 9, con borde e icono | **Diseño y producto** · choca con §2.1 |
| **b** | El selector de dashboard pasa de `<select>` a panel de C6 | Se toma cuando se acepte C6 |
| **c** | `IR A` reemplaza al «← Consola», y el tema entra al punto de identidad | Ídem |
| **d** | La identidad en A1 y B2 | Ídem |

**Al tomar `a` hay que mover el par de `contraste.py` a `("acc", ["panel"], …)` o
`("dim", ["panel"], …)` según cuál se elija**, y el chequeo **falla si el número
se mueve** — que es a propósito.
