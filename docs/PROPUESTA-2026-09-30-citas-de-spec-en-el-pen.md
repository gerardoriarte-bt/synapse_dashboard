# Propuesta a diseño · el `.pen` cita la spec dentro del copy de producto

**2026-09-30 · abierta.** Sale de una decisión humana del mismo día —el
vocabulario interno no se pinta— que choca con dos literales del dibujo.

---

## El conflicto, en una línea

**La decisión del 2026-09-30** dice que una pantalla no nombra secciones de la
spec, identificadores de tarea ni rutas del servicio: le piden al lector un
contexto que no tiene y sugieren una acción que no puede ejecutar. Es la misma
razón que §7.3 da para el vocabulario de infraestructura.

**Y el `.pen` dibuja dos textos con la cita adentro:**

| Dónde | Lo que el frame escribe |
|---|---|
| `A2 · Ficha de cliente` | `EL BACKEND NO ENVÍA EL PAYLOAD · OCULTAR NO ES PERMITIR (§3.3)` |
| `B3 · Selector de gráfico` | `§5 GOBIERNA ESTA LISTA · EL BINDER NO OFRECE LO QUE EL TIPO NO PUEDE RENDERIZAR` |

**Leídos del archivo, no deducidos**, y hay un tercero de la misma familia:
`OCULTAR NO ES PERMITIR (§3.3) · POR ESO NO HAY UN VALOR APROXIMADO QUE MOSTRAR`.

## Por qué no lo resolvemos nosotros

`CLAUDE.md` no deja margen: **«donde el `.pen` y `design.md` difieran, gana el
`.pen` para lo visual y el literal de la UI»**, y **«el agente no modifica
ninguno de los dos»**. Cambiar el texto sería resolver en silencio una
divergencia entre dos fuentes normativas, que es exactamente lo que la cadena de
autoridad prohíbe.

Así que **quedan como están, pintándose tal cual**, y el chequeo que persigue
esta clase de texto —`copy-producto`, en la puerta— los exime **por el texto
exacto**: si alguien los cambia, la exención deja de coincidir y el chequeo
vuelve a saltar. Es una decisión, no un hueco.

## Lo que preguntamos

**¿La cita es parte del copy, o es la anotación del diseñador que se coló en él?**

Las dos lecturas son plausibles y llevan a cosas distintas:

| Si es… | Entonces |
|---|---|
| **Anotación del diseñador** | Se saca la cita y queda `EL BACKEND NO ENVÍA EL PAYLOAD · OCULTAR NO ES PERMITIR`, que dice lo mismo y no pide contexto. El resto de la frase ya es buen copy |
| **Parte del copy a propósito** | Se queda, y entonces la decisión del 2026-09-30 necesita su excepción escrita: «las citas que el `.pen` dibuja se conservan» |

**Nuestra lectura, y es sólo eso:** parece anotación. Las tres apariciones citan
la MISMA sección en contextos distintos, que es el patrón de quien está
justificando una decisión de diseño mientras dibuja — y la frase funciona entera
sin ella. Pero el `.pen` es normativo y la lectura no alcanza.

## Lo que NO estamos pidiendo

No pedimos cambiar la REGLA: que ocultar no sea permitir es una regla dura y la
pantalla tiene que decirla. **Lo único que está en discusión son cinco
caracteres.**
