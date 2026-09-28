# El badge de degradado va en naranja · decisión · 2026-09-28

> **Existe para que no se «corrija» citando §2.1.** El badge usa el acento y la
> lista de usos permitidos de §2.1 no lo incluye. Es una excepción con dueño y
> fecha, no un descuido — que es la diferencia entre una decisión y un defecto.

## Qué se decidió

**El `DegradedBadge` se construye como el `.pen` lo dibuja**: chip sin relleno,
borde `$acc` de 1, radio `$r-xs`, icono `triangle-alert` de 10 en `$acc` y texto
**mono 9** en `$acc`.

**Decisión humana del 2026-09-28**, sobre la tensión que levantó
`docs/AUDITORIA-2026-09-28-dibujo-c6-e-identidad.md`.

## La tensión, que es real

`design.md` §2.1 cierra los usos del acento:

> «Usos permitidos: CTAs, **estado activo**, enlaces, cifras resaltadas dentro de
> un titular en prosa, barra lateral del ítem activo.»

Y da la razón: **«su exclusividad como color de acción es lo que lo hace
legible»**.

Un badge de degradación **no es ninguno de los cinco**. No es un CTA, no es el
estado activo de un control, no es un enlace, no es una cifra en prosa y no es
una barra lateral.

**Y la regla de conflicto no la salva**: donde el `.pen` y `design.md` difieren
gana el dibujo **en lo visual y en el literal de la UI**, y gana `design.md` **en
las reglas duras**. Ésta es una regla dura.

## Por qué se decidió que sí

**1 · El dibujo es de diseño, y diseño es quien manda §2.1.** El nodo `V9PYxO`
lo dibujó quien escribe la regla. Leer §2.1 como si prohibiera lo que el propio
diseño dibuja sería usar la letra de una fuente contra su autor.

**2 · Lo que §2.1 protege es la exclusividad como color de ACCIÓN, y el badge la
respeta.** Un panel degradado **reclama una acción** —§8 le pide estado, razón y
qué lo desbloquea, y el shell pinta el CTA debajo—. El naranja no está diciendo
«malo»: está diciendo «esto pide que hagas algo», que es exactamente lo que dice
en un CTA. La regla dura 3 sigue en pie: **el color no carga el juicio**, la
severidad la carga el texto.

**3 · Para «malo» estarían el ámbar y el rojo, y los dos están prohibidos de
plano.** Si el badge no puede ser naranja, el único camino que queda es un gris
— y el gris es lo que había, con el wash que no llegaba a AA.

## Lo que se descartó

**Sacar sólo el wash y dejar el texto en `dim`.** Pasa el contraste —5.04 en
oscuro, 5.49 en claro— y no toca §2.1. **Se descartó porque deja media
divergencia**: un badge sin relleno, sin borde y en gris no es un chip, es un
rótulo más en la cabecera del panel, y deja de leerse como marca de estado. La
mitad del dibujo no es un compromiso: es un tercer diseño que nadie dibujó.

## RATIFICADA EL MISMO DÍA, CONTRA EL MEJOR ARGUMENTO EN CONTRA

**Este documento dice arriba que existe «para que no se corrija citando §2.1», y
se corrigió citando §2.1 — a las pocas horas.** Conviene que quede acá, porque un
documento que no sobrevive a su propio caso no sirve.

**Qué pasó.** La auditoría levantó la tensión; la sesión que dibuja la aceptó y
**redibujó el badge a neutro** —`d1c5ac8`—: borde `$acc` → `$w4`, icono y texto
`$acc` → `$ink`. Su razonamiento, textual:

> «Donde el dibujo y `design.md` difieren, el dibujo gana en lo visual y
> `design.md` en las reglas duras: ésta lo es, así que **el que se corrige es el
> dibujo**.»

**El argumento es bueno y la medición también.** `ink` sobre `panel` da **14.89 y
17.38**, contra 4.91 y 5.43 del naranja: en contraste el neutro gana por lejos. Y
la analogía es exacta —los deltas de este producto van en color neutro porque el
signo comunica la dirección, no el color—.

**Y aun así queda en naranja · decisión humana del 2026-09-28, sostenida.**

La pregunta de fondo no es de contraste ni de sintaxis de la regla: es **qué es un
panel degradado**. Si es una anotación —«ojo, este dato tiene una limitación»—
entonces el neutro tiene razón. Si es **algo que reclama una acción**, el acento
es exactamente su color, y §2.1 lo permite por su propia razón declarada: «su
exclusividad como color de **acción**».

**Se decidió que es lo segundo**, y §8 lo respalda: un estado degradado no se
limita a informar, declara **qué lo desbloquea** y el shell le pinta un CTA
debajo. Un panel que pide que hagas algo, marcado con el color de las cosas que
piden que hagas algo.

### La consecuencia, que hay que decir de frente

**Entonces la lista de §2.1 está incompleta, y ése es el pedido a diseño.** No se
está ignorando la regla dura: se está diciendo que le falta un sexto uso —«marca
de estado que reclama acción»— y que `design.md` es quien lo escribe. Nosotros no
lo tocamos.

**Mientras tanto el código y el dibujo divergen**, y la divergencia es del dibujo:
`V9PYxO` está en `$w4`/`$ink` y el código en `$acc`. **Lo que hay que ajustar es
el `.pen`, no `src/`** — junto con el párrafo «el color del badge tampoco es
`$acc`» de la pregunta 13 de `docs/B0.9-preguntas-abiertas.md`.

## Lo que esta decisión NO autoriza

**No abre el acento a otros estados.** `BLOQUEADO`, `SIN_PERMISO` y `ERROR`
tienen sus propios estados de cuerpo y **no llevan badge de acento**. Lo que se
decidió es este badge, por el argumento de arriba — no «los estados pueden usar
naranja».

**Y no cambia §2.1.** Si diseño quiere que la lista incluya un sexto uso, eso es
una edición de `design.md`, que no tocamos. Mientras tanto la excepción vive acá.

## Lo medido

| | `acc` sobre `panel` | lo que había · `dim` sobre `w3` sobre `panel` |
|---|---|---|
| **oscuro** | **4.91** ✓ | 4.17 ✗ |
| **claro** | **5.43** ✓ | 4.60 ✓ |

Umbral 4.5 · `tools/contraste.py` · 2026-09-28.

**Y el par viejo no desapareció del chequeo**: `TabEditor` sigue pintando
`text-dim hover:bg-w3`, así que la desviación de 4.17 sigue registrada con su
dueño nuevo. Ver la pregunta 13 de `docs/B0.9-preguntas-abiertas.md`.
