---
name: auditoria-plan
description: Audita el plan de trabajo a demanda · verifica que cada tarea marcada ✅ tenga evidencia real en el código y las pruebas, que el estado de las tareas B* se haya comprobado contra el servicio, y que los documentos no se superpongan. Usar antes de informar avances, al cerrar un tramo, o cuando algo del seguimiento no cuadre. NO usar en loop: los chequeos deterministas ya corren en `npm run verify`.
---

# Auditoría del plan · a demanda

**Lo que esta auditoría agrega sobre `npm run verify` es JUICIO.** Los chequeos
deterministas ya corren solos en la puerta:

| Ya lo hace una máquina | No hace falta repetirlo |
|---|---|
| `plan:ancestro` | Los identificadores no se reasignaron |
| `para-backend` | Ninguna tarea cerrada sigue pidiendo algo |
| `docs-registro` | Ningún documento entró sin declarar su rol |
| `plan` | Ninguna tarea quedó sin criterio de aceptación |
| `plan:diff <export>` | La plataforma no derivó del plan |
| `backend-drift` | El backend no se movió desde lo que transcribimos |

Esta auditoría contesta lo que esos no pueden: **¿lo que dice `✅` está hecho de
verdad?** y **¿hay dos documentos diciendo lo mismo?**

---

## Antes de empezar

```
npm run verify
npm run backend-drift     # necesita red · no está en la puerta a propósito
```

Si `verify` sale en rojo, **se para acá y se informa**: auditar un plan sobre un
árbol roto produce conclusiones sobre código que no compila.

---

## 1 · Un `✅` sin evidencia

**La pregunta no es «está marcado hecho» sino «se puede demostrar».**

Tomar las tareas `✅` de las últimas dos semanas —`git log` sobre
`plan-de-trabajo.md` da las fechas— y para cada una:

1. Leer su **criterio de aceptación** en el plan.
2. Buscar qué lo sostiene: el archivo, la prueba, el chequeo.
3. Decidir si el criterio se cumple **como está escrito**, no como se recuerda.

**Tres formas de falla que ya ocurrieron en este repositorio**, y que son lo que
hay que buscar:

- **La prueba fija el defecto.** `KpiBody.test.tsx` metía el rótulo en `params`,
  así que pasaba con el cuerpo leyendo del layout: **verificaba que el bug
  funcionara**. Señal: una prueba que afirma exactamente lo que el código hace,
  sin citar el contrato ni la regla.
- **El criterio se cumple a medias y nadie lo bajó a ⚠️.** F1.36 tenía seis
  correcciones, se hicieron cuatro. Señal: un criterio con varios puntos y un
  cierre que solo habla de algunos.
- **La prop declarada que nadie pasa.** `BodyProps.presentation` existió meses,
  documentada y sin un solo consumidor. Señal: un tipo o una opción que el
  criterio nombra y que `grep` encuentra una sola vez.

**Verificar por mutación lo que se dude.** Romper a propósito lo que la tarea
dice sostener; si ninguna prueba falla, el `✅` no está sostenido. **Y comprobar
que la mutación se aplicó** —falló tres veces en este repositorio por
indentación y por comillas—: una mutación que «pasa» sin haberse aplicado se lee
igual que una prueba débil.

## 2 · El estado de las tareas `B*`

**Decisión del 2026-09-14: el estado de una tarea de backend lo mueve el front,
y solo después de verificarlo contra el servicio corriendo.** No se copia de su
documento.

Auditar que eso se cumpla: una `B*` en `✅` o `⚠️` tiene que tener al lado **cómo
se verificó** —qué endpoint, qué respuesta, qué fecha—. Una sin eso es una
suposición con forma de hecho.

Recordar que **los identificadores no coinciden** con los de su plan: la tabla de
equivalencias está en `docs/ESTADO-B1.13-B1.19-2026-09-14.md`.

## 3 · Números citados en prosa

**Un conteo escrito en una frase se vence sin que nadie lo note.** La auditoría
del 2026-09-14 encontró «once chequeos» y «doce chequeos» cuando ya eran quince,
y «406 pruebas» cuando eran 416. Se leen como hechos verificados y ya no lo son.

Buscar conteos —chequeos, pruebas, tareas, líneas— en `CLAUDE.md` y en el plan, y
comprobarlos. **La cura no es corregirlos: es sacarlos**, y apuntar a
`docs/ESTADO.md`, que se genera.

Del mismo tipo: **una afirmación verificada sin fecha.** El cierre de F1.33 decía
«`render/` no cambió ni una línea · `git diff` sale vacío», cierto ese día y
falso después, porque F1.40 tocó `KpiBody.tsx` con razón. Una verificación lleva
cuándo se hizo o se lee como una promesa permanente.

## 4 · Documentos que se superponen

`docs-registro` detecta un archivo que entró sin rol. **No detecta que dos
archivos con rol distinto digan lo mismo**, que es como empezó el problema del
2026-09-14: cuatro documentos sobre lo que falta del backend, y el más viejo
anunciando como faltante lo que ya estaba servido.

Para cada documento de `docs/` que no sea generado ni histórico, preguntarse:

- ¿Hay otro que conteste la misma pregunta?
- ¿Alguno afirma algo que hoy es falso? **Los que tienen fecha en el nombre son
  cortes y no se actualizan** — si venció, va a `docs/historico/` con su aviso.
- ¿Algo de acá debería estar en el plan, que es la fuente?

## 5 · Lo que se informa

Un resumen corto, y **en este orden**:

1. **Lo que está mal** — cada hallazgo con la tarea o el archivo, y qué lo
   demuestra. Sin hallazgos, decirlo en una línea.
2. **Lo que se verificó y está bien** — para que el silencio no se confunda con
   no haber mirado.
3. **Lo que no se pudo verificar y por qué** — es información, no un hueco que
   se tapa.

**Nada se corrige sin decirlo.** Esta auditoría reporta; cambiar el estado de una
tarea o mover un documento es una decisión de quien la pidió. Un agente que
arregla el plan solo es cómo se pierde una decisión que alguien tomó a mano.
