# Propuesta de spec · el sexto uso del naranja · 2026-09-28

> **Propuesta abierta, para diseño.** Pide **una línea en `design.md` §2.1**, que
> es el único archivo que sigue intocable incluso con el permiso del
> `docs/INSTRUCCIONES-2026-09-28-diseno-en-el-pen.md`. No hay nada que dibujar:
> el `.pen` ya está del lado que esta propuesta quiere declarar.

## Qué falta

§2.1 cierra los usos del acento en cinco:

> Usos permitidos: CTAs, estado activo, enlaces, cifras resaltadas dentro de un
> titular en prosa, barra lateral del ítem activo.

**Y el `.pen` usa el naranja en un sexto**: el badge de degradación
—`Panel/Badge Degradado`, borde, icono y texto en `$acc`, mono 9, sin relleno—,
que no es ninguno de los cinco.

## Por qué no alcanza con dejarlo así

Porque ya se «arregló» una vez. El 2026-09-28, citando §2.1, se redibujó el badge
a neutro —borde `$w4`, icono y texto en `$ink`—: la regla dura estaba del lado del
neutro y la medición de contraste también, `ink` sobre `panel` da 14.89 y 17.38
contra 4.91 y 5.43 del naranja.

**Duró horas.** Una decisión humana lo devolvió a `$acc` el mismo día, con el
argumento que la lista de §2.1 no contempla: **un panel degradado no es una
anotación, es algo que reclama una acción**, y el acento es el color de la acción
por la razón que §2.1 escribe de sí misma —«su exclusividad como color de acción
es lo que lo hace legible»—.

Mientras la lista siga teniendo cinco entradas, **cualquiera que lea §2.1 y mire
el dibujo va a encontrar la misma contradicción y va a volver a corregirla.** Eso
es lo que esta propuesta quiere cortar.

## Lo que se pide, concreto

Una sexta entrada en la lista de §2.1, con su límite. La redacción la decide
diseño; lo que el código necesita es que el límite sea verificable. Una forma:

> **estado que reclama una acción** — degradación, bloqueo, vencimiento. No
> cualquier estado: los que sólo informan van en neutro.

**El límite importa más que la entrada.** Sin él, «estado» abre la puerta a
pintar en naranja cualquier cosa que cambie, y ahí se pierde la exclusividad que
es el argumento entero de la regla.

## Lo que ya está resuelto y no es parte de esto

- **El wash no va.** El badge del `.pen` no tiene relleno; el `bg-w3` era
  invención del código, y era lo único que hundía el par bajo 4.5. Corregido.
- **El tamaño es mono 9**, el de nota, no mono 10. Corregido.
- **El contraste pasa**: `acc` sobre `panel` da 4.91 y 5.43, los dos sobre 4.5.
  La pregunta 13 de B0.9 quedó cerrada.
- **La superficie de hover es `$elev` y no un wash**, que §2.1 ya declaraba en su
  tabla con `--panel-raised`.

## Quién decide y qué bloquea

**Decide diseño**, sobre `design.md`. **No bloquea nada**: el dibujo y el código
ya coinciden en `$acc`, la puerta está verde y el contraste pasa. Lo que queda
abierto es que la regla escrita no describe lo que el producto hace, y eso se
paga la próxima vez que alguien la lea con cuidado.
