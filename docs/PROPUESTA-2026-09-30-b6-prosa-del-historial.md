# Propuesta · B6 · la prosa del historial y los dos huecos de cable

**2026-09-30 · abierta.** Sale de construir `B6 · Historial de versiones` mirando
su frame `bP9lw` y midiendo sus rutas contra `:4010`.

Son **cuatro cosas que el dibujo pide y el cable no da**, más **dos añadidos
nuestros al dibujo** y **un riesgo de contraste sin medir**. Ninguna se resolvió
componiendo: cada una está declarada en la pantalla y atada por una prueba, porque
una divergencia sin prueba deriva en silencio el día que alguien la «arregle».

Va a **diseño y producto** lo de la prosa, y a **backend** lo de las dos rutas.

---

## 1 · El `Resumen` de 13px · **pedido a backend**

El frame pinta, en `font-body 13` y en `$ink`, el renglón más visible de cada
tarjeta:

| Versión | Lo que el dibujo escribe |
|---|---|
| v4 | «Medidores de composición en los seis KPI» |
| v3 | «Anatomía §6 en los doce paneles» |
| v2 | «Panel propio «Unidades» sobre la plantilla» |
| v1 | «Composición inicial desde la plantilla» |

**Las cuatro son frases redactadas por una persona.** El cable manda `version_id`
—`v-1790712673`— y cinco contadores, y nada más.

**No se compone, y es la decisión central de esta pantalla.** Armar «6 paneles
cambiados y 1 quitado» desde los contadores sería escribir copy de producto en el
adaptador, que es exactamente lo que la regla de la casa prohíbe: el día que el
texto de origen exista, habría una frase nuestra compitiendo con la suya y nadie
sabría cuál manda.

**Lo que se pinta en su lugar** son los cinco contadores como pares rótulo+cifra,
cada uno por `<Value size="cell">`: `PESTAÑAS AÑADIDAS`, `PESTAÑAS QUITADAS`,
`PANELES AÑADIDOS`, `PANELES QUITADOS`, `PANELES CAMBIADOS`. **Los cinco siempre,
incluido el cero**: esconder un cero haría que «sin cambios» y «no lo sé» se lean
igual.

### Lo que se pide

Un campo de nota de publicación — lo que uno escribe al publicar, como el mensaje
de un commit.

```
POST /admin/layouts/{layoutId}/publish   { version_id, note }
GET  /admin/dashboards/{id}/publications → … , "note": "…"
```

**El builder ya sabe pedir un `note`**: existe en los paneles desde `5924bf2b`, así
que el patrón está en su código. Y la fila del historial **sólo se inserta, nunca
se edita** —lo dice el comentario de su struct—, así que una nota es una foto del
porqué en el momento en que se tomó la decisión, que es justo lo que un historial
auditable quiere.

**Mientras no exista, el renglón no queda vacío**: quedan los contadores, que son
la parte del dibujo que el cable sí sostiene.

---

## 2 · La línea `RAZÓN · …` · **la misma propuesta**

v4 la pinta con el glifo `!`:

> `!` RAZÓN · los kpi repetían lo que ya muestra «Objetivos contra real»

Es el **porqué de una decisión humana**, y es el mismo pedido que el punto 1: un
`note` de publicación lo cubre entero. No hay campo, no se compone.

**El glifo `!` no quedó sin uso.** El dibujo lo usa dos veces y la otra —en v2— sí
es un hecho: «LA PESTAÑA DEJA DE SER 100% HEREDADA». Así que `!` se le asignó a los
hechos **destructivos** que el cable manda —`tabs_removed` y `panels_removed`—, que
es el mismo tono. Con eso los tres glifos dibujados cubren las ocho listas del diff
**sin inventar un cuarto**:

| Glifo | Qué |
|---|---|
| `+` | pestaña o panel AÑADIDO |
| `~` | MOVIDO, RETIPADO, PARÁMETRO, PESTAÑAS REORDENADAS |
| `!` | pestaña o panel QUITADO |

---

## 3 · La fila de BORRADOR · **falta una ruta, y es chica del lado suyo**

El dibujo la pone primera, con borde `$acc 1.5`, badge `SIN PUBLICAR`, resumen «3
cambios sin publicar», autor «MARÍA RESTREPO · EDITANDO AHORA» y **tres líneas de
cambios pendientes**.

**No se construyó, y son dos candados distintos:**

1. **No existe ruta de diff entre dos layouts.** Verificado con
   `grep -n diff internal/adapters/handler/router.go`: no devuelve nada.
   `dashboard.DiffLayouts` es una función **pura** que sólo corre al publicar.
2. **No existe «quién está editando ahora»** en ningún cable.

Calcular el diff en el front sería exactamente lo que la regla prohíbe —el front no
calcula lo que el back no manda—, y el diff es la mitad de esta pantalla: la nota
del `.pen` dice «sin él un historial es una lista de fechas y revertir es a
ciegas».

### Lo que se pide

```
GET /admin/layouts/{layoutId}/diff?against={layoutId} → LayoutDiff
```

**Del lado suyo es exponer una función pura que ya tienen.** `DiffLayouts` no toca
base ni depende del orden de entrada —su propio comentario lo dice—: lo que falta
es el handler que arme los dos `LayoutSnapshot` y la llame.

### Y una trampa anotada, para que nadie la tome por atajo

El contador «3 cambios sin publicar» del dibujo **ya existe en el chrome**:
`contexto.cambios` de `BuilderChrome`. **No sirve**, y usarlo sería peor que no
tener el número: cuenta **pestañas tocadas en memoria**, que es otra cosa que un
borrador guardado comparado con lo publicado. Sería pintar un número que no
significa lo que dice.

---

## 4 · «Inversión cambia su dirección semántica» · **no es dibujable, y no es un pedido**

v4 pinta:

> `~` «Inversión» cambia su dirección semántica a SIN DIRECCIÓN

**El diff no puede traerlo, y no por un hueco.** Cubre pestañas, posición, tipo y
`options` — o sea el LAYOUT. `semantic_direction` es atributo de la **MÉTRICA** y
vive en el catálogo, que es de datos y no del layout. Un cambio ahí no es una
publicación de layout: no dejaría fila en esta auditoría ni debería.

Queda escrito **para que no se busque dos veces**. Si el producto quiere auditar
cambios de catálogo, es otra pantalla y otro historial.

---

## 5 · Dos añadidos NUESTROS al dibujo

Los dos van a **diseño**, para que los tome o los rechace.

### 5.1 · El chip `REVERSIÓN`

El dibujo no distingue una versión que llegó por reversión, y **el cable sí**:
`action` es `publish` o `rollback`, y de las cinco filas medidas en «Marca» **una es
`rollback`**.

**Si una versión llegó por reversión y el historial no lo dice, el historial miente
sobre cómo se llegó ahí** — y es justo lo que la tercera línea de la cabecera
promete auditar. Se agregó un segundo chip mono 9, sin relleno, borde `$w4`, literal
**«REVERSIÓN»**, sólo cuando `accion === 'rollback'`.

Es copy de chrome nuestro sobre un valor del enumerado, **no traducción de una clave
del contrato**: `accion` sigue siendo `'publish' | 'rollback'` en el tipo.

### 5.2 · El vacío y la etiqueta de versión

**El `.pen` no dibuja los estados de carga ni de error de esta pantalla.** Los tres
vacíos dibujados y el esqueleto son de **tablas** de administración —`EmptyRow` y
`SkeletonRows` son `<tr>`— y B6 es una lista de tarjetas. Lo que se escribió es
nuestro y va dicho como tal:

> SIN PUBLICACIONES REGISTRADAS PARA ESTE DASHBOARD
> LA AUDITORÍA EMPEZÓ A ESCRIBIRSE DESPUÉS DE LAS PRIMERAS PUBLICACIONES · LA
> PRÓXIMA QUE SE PUBLIQUE DEJA SU FILA

**El caso está medido y no es teórico**: el dashboard «Overview» tiene un layout
publicado y **cero** publicaciones, porque la auditoría se empezó a escribir con
`168a761`. Un historial vacío no es un error ni un dashboard sin publicar.

Y la etiqueta de versión: el dibujo le da **34px fijos** y pinta «v4». El servicio
manda `v-1790712673`, `rollback-v-1790630106`, `v1`. Se pinta **verbatim** y el slot
pasa a ancho automático. **No se renumeran `v1..vN` por el orden**: sería inventar
una etiqueta que el servicio no tiene y que además contradiría la que `ContextView`
ya muestra para el mismo layout.

---

## 6 · El título nombra un dashboard y el dibujo nombraba una pestaña

El frame pinta «eCommerce Overview · UA MX». **Es un nombre de pestaña**: el dibujo
es anterior al multi-dashboard.

Una publicación versiona el **layout entero**, con todas sus pestañas — y el diff
trae `tab` en cada entrada justamente porque cruza varias. Así que el título pasó a
`<dashboard> · <cliente>`, hoy «Marca · Under Armour México». El chip `PESTAÑA` del
navbar se deja como el chrome ya lo calcula.

---

## 7 · Un riesgo de contraste que `contraste.py` no mide hoy

El `+` del diff va en **`$fam-medios-1`** sobre **`$elev`**, porque el `.pen` lo
dibuja así y **el `.pen` gana para lo visual**. Hay precedente en código:
`ConsoleDock.tsx` usa `bg-fam-medios-1`.

Es un token de **familia de datos elegido en el componente**, y `design.md` reserva
la familia al catálogo. No dispara L2 —no es el naranja— ni L4 —un `+` de «añadido»
no es un condicional de signo—, pero **el par no está medido**: `#34d399` sobre
`$elev` en oscuro y `#059669` sobre `$elev` en claro.

**Queda registrado con su número pendiente y el token no se cambia por cuenta
propia.** Es el caso de `DegradedBadge` otra vez: si no llega a 4.5, se anota y lo
decide diseño.

---

## Lo que NO es una propuesta, porque ya se arregló

Dos cosas que esta pantalla destapó eran **mentiras en producción**, no preguntas
abiertas, y se arreglaron leyendo la fuente:

- **`EstadoDeLayout` declaraba dos estados y el dominio tiene tres.** `archived` es
  el más común —4 de 7 layouts medidos— y caía en `'borrador'`, así que
  `ContextView` ofrecía editar cuatro versiones que no se pueden editar.
- **`adaptarVersion` tiraba `dashboard_id`**, sin el cual no hay manera de saber qué
  historial pedir.

Y **dos frases del plan estaban mal**, las dos escritas de una lectura y no de la
fuente: `tabs_added` trae el **nombre normalizado** de la pestaña y no su `key`, y
las colecciones vacías del diff vuelven **de las dos formas** —`[]` y `null`— y no
sólo `null`. Corregidas en `plan-de-trabajo.md`.
