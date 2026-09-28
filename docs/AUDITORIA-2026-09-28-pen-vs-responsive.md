# Auditoría · las dos composiciones responsive de C1 · 2026-09-28

> Sale de terminar F3.15. Su cierre decía: *«Lo que NO se pudo VER: las dos
> composiciones responsive. La ventana del navegador no se achicó —está
> maximizada— así que se verificó la de escritorio en pantalla y las otras dos
> sólo contra el frame.»* Se achicó, se miraron, y apareció esto.

## Lo que SÍ estaba bien · la barra inferior de F3.15

Medido en el navegador a 768 contra el frame `C1 · 768 · seis columnas`:

| | Frame | Medido | |
|---|---|---|---|
| alto de la barra | 52 | `52px` | ✓ |
| padding lateral | 20 | `20px` | ✓ |
| fondo | ninguno | `rgba(0,0,0,0)` | ✓ |
| borde superior | 1 · `$w2` | `1px` | ✓ |
| botón · alto | 28 | `28px` | ✓ |
| botón · radio | `$r-md` | `7px` = `--radius-md` | ✓ |
| botón · fondo | `$elev` | `rgb(31,31,35)` = `#1f1f23` | ✓ |
| botón · borde | sin | `0px` | ✓ |
| botón · texto | mono 9 | `9px` | ✓ |

Y abajo de 768 la barra queda con el botón y **nada a la derecha**, que es lo que
la nota del `.pen` describe —«el pie suelta el contexto»— menos el `DECISIONES`,
que no se pinta porque `/config/decisiones` no existe. Declarado, no olvidado.

## Lo que estaba MAL, y era de una sola línea

**La línea de contexto se pintaba en mono 10 en los tres anchos.** El frame de
768 la dibuja en **9**. Censado sobre los dieciséis frames de consola: las trece
pantallas de escritorio la ponen en 10 y la de 768 en 9, igual que el texto de su
botón.

Corregido: abajo de 1280 usa `Note` —mono 9— y arriba `Label` —mono 10—. Son dos
de los cuatro roles mono que §2.3 declara y cierra, así que no era elegir un
número sino el rol equivocado.

**Se veía bien.** Un punto de diferencia en mono a 768 no se nota mirando; lo
encontró comparar el número del frame con el `getComputedStyle` del nodo.

## Y LO QUE APARECIÓ, QUE NO ES DE F3.15

**El `.pen` dibuja TRES navbars y nosotros pintamos uno.** Leído de los frames,
no de las notas:

| | 1440 | `C1 · 768` | `C1 · 360` |
|---|---|---|---|
| **Navbar** | logo · tenant · rol · período · `PREGUNTAR` · menú · usuario | logo · `UA MX` · `CEO` · spacer · `JUL 2026` · `PREGUNTAR` · menú · usuario | **logo · spacer · menú · usuario** · y nada más |
| **Menú de pestañas** | las pestañas en línea | la activa a **13** y tres **abreviadas a 9** — `BRAND`, `PRODUCT`, `INVENTORY` | **un solo botón con chevron** · desplegable |
| **Cabecera** | 84 | 84, con `12 PANELES · 4 PESTAÑAS` | 84, **sin** el conteo |

A 360 el frame **suelta el tenant, el rol, el período y el CTA del navbar**, y
convierte el menú de pestañas en un desplegable. Nosotros dejamos la composición
de escritorio en los tres anchos.

### Qué se ve, y con qué precisión

Medido a 500 de viewport —Chrome no achica la ventana por debajo de eso en
macOS, así que el ancho exacto de 360 **no se pudo medir**; 500 cae en el mismo
escalón, `<768`—:

- **El navbar NO desborda ni se solapa.** Mantiene sus `60px` y
  `document.documentElement.scrollWidth` es igual al viewport: no hay barra de
  scroll horizontal, que es lo que PS-12 pide.
- **Lo que pasa es que su contenido se APRIETA.** «Tenant · el acceso queda
  auditado» queda en `103×60` —cuatro líneas, ocupando la barra entera—, «UA
  México» en dos líneas, «María Benítez» en dos. La barra es la del dibujo; lo
  que hay adentro no.

**Una corrección de esta misma auditoría:** en la primera lectura se dijo que
«Overview» se solapaba con `PREGUNTAR`. **Era el cursor del mouse dibujado
encima.** Medidos, están en `x=254 w=21` y `x=299`: no se tocan. Queda escrito
porque es el modo de falla de mirar una captura sin medirla, que es el inverso
del de este mismo día — medir sin mirar.

### Y `pen-pantallas` no lo podía atrapar

El registro declara los dos frames así:

```
| `C1 · 768 · seis columnas` | `src/render/useColumns.ts` · el colapso se resuelve en JS · F1.30 |
| `C1 · 360 · una columna`   | ídem · el mínimo son 360 y no 768 · PS-12 |
```

Y es cierto: `useColumns` resuelve el colapso de la grilla, que es lo que esos
frames más obviamente muestran. **Pero el frame tiene tres composiciones más** —el
navbar, el menú de pestañas y la cabecera— y la declaración las da por cubiertas
sin nombrarlas.

El chequeo pide que cada pantalla dibujada **tenga quien la declare**, y la tiene.
Lo que no puede pedir es que la declaración sea completa: eso es leer el dibujo,
y es exactamente lo que el chequeo dice de sí mismo —«lo que NO hace es comparar
el dibujo con la pantalla».

**No es un agujero del chequeo, es su límite escrito.** Se anota acá y no se
cambia la herramienta.

## Qué se hace con esto

**Nada todavía, y a propósito.** Los renglones del registro de pantallas son de
la sesión de diseño, no de ésta, y construir tres navbars es una tarea con su
propio criterio, no un ajuste de F3.15.

Lo que corresponde es que exista una tarea. Queda planteado y **sin tomar**.
