# Propuesta de spec · la navegación entre superficies · 2026-09-25

> **Propuesta abierta**, para diseño. El `.pen` no dibuja esto en ninguna de sus
> quince pantallas, y lo que hay hoy lo inventamos nosotros. El agente no
> modifica el `.pen` ni `design.md`.

## De dónde sale

Se levantó mirando las tres superficies juntas: **admin y builder no dicen quién
sos, no ofrecen cambiar el tema, y sólo saben volver a la consola.** La consola
lleva a las otras dos por el menú de usuario; las otras dos no llegan entre sí.

## Qué dibuja el `.pen` hoy

| Navbar | Qué lleva |
|---|---|
| **C1 · consola** | Logotipo · tenant con su rol · selector de período · `PREGUNTAR` |
| **A1 · admin** | Logotipo · `ADMINISTRACIÓN` · cuatro pantallas · **identidad: `SUPER-ADMIN` / `MARÍA BENÍTEZ`** |
| **B2 · builder** | Logotipo · `BUILDER` · contexto (tenant/rol/pestaña) · cambios sin guardar · `VISTA PREVIA` · `PUBLICAR` |

**Ninguno dibuja una salida hacia otra superficie**, y tampoco el cambio de
tema. Los tres navbars son genuinamente distintos, que es la razón por la que
**no proponemos unificarlos**: un chrome común pelearía con el diseño cada vez
que una superficie necesite lo suyo.

## Lo que ya hicimos, porque tenía fuente

**La identidad en admin.** El bloque estaba dibujado en A1 y no se pintaba, sin
que nada dijera que fuera a propósito. Ya está: rol en `dim`, nombre en `ink`,
mono de 9, como el dibujo.

**Un registro único de superficies** —`src/surfaces/superficies.ts`—. Es
estructura, no dibujo: antes eran dos listas del mismo hecho —las rutas del
router y un arreglo escrito a mano dentro del menú— que podían separarse sin que
nada lo notara.

**Lo que NO hicimos**: agregar controles nuevos. Eso es lo que se pregunta acá.

## Por qué preguntamos en vez de resolverlo

Dos veces este mes construimos UI que el `.pen` no dibujaba, y las dos hubo que
rehacerlas:

- **El selector de período.** El dibujo no dibujaba selector; inventamos un riel
  de doce chips, vivió meses y se rehízo el 2026-09-24.
- **El «← Consola».** Inventado el 2026-09-16, asimétrico desde el primer día.

Y hay una razón estructural: **`pen-pantallas` verifica en un solo sentido.**
Comprueba que toda pantalla dibujada esté declarada; no puede detectar lo que
construimos **sin** dibujo. Ningún chequeo nuestro va a cerrar ese agujero.

**Ahora es el momento barato.** Lo que se defina acá lo hereda cada superficie
que agreguen las fases siguientes; pedirlo dibujado una vez cuesta menos que
retrofitear tres superficies después.

---

## Las preguntas, concretas

### 1 · ¿Dónde vive la salida hacia otra superficie?

Tres formas posibles, y la elección no es de estilo:

| | Qué implica |
|---|---|
| **En el punto de identidad** (como hoy en la consola) | Una sola cosa en el navbar. `design.md` ya especifica ese panel —«nombre, correo, rol con su descripción y cliente»— y sumarle las salidas es una extensión chica |
| **Un control propio en el navbar** | Más visible y un clic menos, pero compite con lo que cada superficie ya pone ahí: el builder tiene `VISTA PREVIA` y `PUBLICAR` |
| **Sólo volver a la consola**, como hoy | La consola queda como el centro. Simple, y obliga a dos pasos para ir de admin a builder |

### 2 · ¿La navegación es simétrica?

Hoy no: la consola llega a las dos, las dos sólo vuelven. Si la respuesta es que
sí, el registro ya lo resuelve sin tocar cada chrome. Si es que no —porque la
consola es el centro—, **conviene que quede escrito**, porque hoy se lee como un
olvido.

### 3 · ¿El cambio de tema vive en las tres?

Existe sólo en la consola y el `.pen` no lo dibuja en ninguna. Nuestra sugerencia
es meterlo **dentro** del punto de identidad en vez de al lado: es una
preferencia de usuario, y así las preferencias que vengan después no agregan un
control nuevo al navbar cada vez.

### 4 · ¿El builder muestra identidad?

A1 la dibuja y B2 no. Puede ser deliberado —el builder ya declara tenant y rol en
su contexto, que es otra cosa: **el rol que se está componiendo, no el de quien
compone**— pero conviene confirmarlo, porque esa distinción es exactamente la que
la compuerta de `resolveLayout` confundió del lado del backend.

---

## Lo que proponemos mientras tanto

**No tocar nada más.** El «← Consola» queda como está: es asimétrico y lo
sabemos, y reemplazarlo por otra invención sería la tercera del mes y la más
difícil de sacar, porque la heredarían todas las pantallas futuras.
