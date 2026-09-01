# `render/Panel/` · F1.15

El shell con la **anatomía obligatoria** de §9: bullet de familia, título, BASE,
procedencia, dirección semántica, CTA y chevron.

Regla que este directorio existe para sostener: **un estado reemplaza el cuerpo,
nunca el shell.** El shell recibe el cuerpo por `children` y no lo conoce, así
que un estado no puede borrar la cabecera aunque quiera. Título, BASE y
procedencia siguen visibles mientras el panel carga, falla o está bloqueado.

Variante compacta en `colSpan ≤ 3` (F1.16): misma información, otro reparto —
la meta baja a dos líneas. Es una rama documentada, no un flag suelto.
