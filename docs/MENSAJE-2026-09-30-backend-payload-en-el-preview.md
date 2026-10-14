# Para el equipo de backend · el preview sin payloads deja una pantalla a medias · 2026-09-30

> **Histórico.** Un mensaje mandado, con fecha: qué se pidió y con qué evidencia.
> No se actualiza.

Hola. Es **un pedido chico y muy acotado**, y viene con la pregunta que ustedes
mismos dejaron escrita sin contestar.

---

## Lo que pasa

`GET /admin/layouts/{layoutId}/preview?role_id=…&period=…` devuelve **el layout y
no los payloads** — medido el 2026-09-30 contra el binario de `de881e1`.

Para «CEO contra Planner» eso alcanza y está bien: la vista previa por rol
compara **composiciones**, y con `hidden_metric_ids` aplicados el rol ve menos
paneles. Eso funciona.

**Donde no alcanza es en el selector de gráfico.** Nuestro repertorio declara un
**tope** por gráfico —cuántos elementos lo vuelven ilegible— y el dibujo del
selector deshabilita la opción cuando el dato lo excede, con este texto literal:

```
⊘  Dona                                    composicion
   NO DISPONIBLE · MÁS DE CINCO PARTES, ILEGIBLE EN DONA
```

**Saber si son más de cinco partes exige el dato.** No sale del catálogo: la
cardinalidad de una dimensión no es un campo que hoy exista en ninguna de las dos
puntas —está pedida a datos, aparte—, y de todas formas el tope se mide sobre el
valor del período que se está componiendo.

---

## Lo que pedimos

**Que el preview pueda traer los payloads.** Opcional y explícito, para no
encarecer el caso que ya funciona:

```
GET /admin/layouts/{layoutId}/preview?role_id=…&period=…&with_payloads=true
```

Con los payloads en la misma forma que `POST /config/panels:batch` ya devuelve —
no hace falta una forma nueva.

### Y la pregunta que ya estaba escrita, que es lo que más vale de esto

El criterio de B4.9, que escribimos con ustedes, dice textualmente:

> «**Queda escrito si el preview incluye payloads o solo el layout.** Con solo el
> layout alcanza para "CEO vs Planner", que es lo que F4.12 pide; con payloads
> hay que decidir qué período usa y si un panel oculto llega como `SIN_PERMISO` o
> no llega. **Decidirlo antes, no durante.**»

**Nunca se decidió**, y ahora hay una pantalla que depende de la respuesta. Las
dos preguntas siguen abiertas y las contestamos de nuestro lado si les sirve:

| Pregunta | Lo que proponemos |
|---|---|
| **Qué período usa** | El del parámetro `period`, que la ruta ya acepta. Sin él, el abierto |
| **Un panel oculto por rol** | **No llega**, igual que hoy. El preview ya devuelve menos paneles para un rol con métricas ocultas —medido: `admin` 12, `planner` 9— y agregar payloads no debería cambiar esa decisión |

---

## Lo que NO les pedimos, y por qué conviene decirlo

**No pedimos una ruta nueva de datos bajo `/admin`.** Se nos ocurrió llamar a
`POST /config/panels:batch` desde el builder, y **no sirve**: esa ruta es del
tenant de quien pregunta, y el builder compone para OTROS clientes. Andaría
componiendo el propio y no el ajeno, y el mismo selector deshabilitaría o no
según qué cliente se mira, sin decir por qué.

**Ese silencio es exactamente el modo de falla que este producto persigue**, así
que preferimos la pantalla incompleta y declarada antes que una que acierta a
veces.

---

## Mientras tanto, qué hicimos

**El selector declara el tope como texto en cada opción** y no deshabilita nada:

```
○  Dona                                    composicion
   MÁXIMO · más de cinco partes · ilegible en una dona
```

Es una divergencia contra el dibujo, está declarada en el componente y **el
registro de pantallas la lleva escrita** con esta razón. El día que los payloads
lleguen, deshabilitar es una condición más en un componente que ya tiene el
repertorio y su evaluador: `invalidPlotReason(tabla, id, valor)` existe y lo usa
la consola desde el 2026-09-29.

**No es urgente.** Va en la cola detrás de lo que ya les pedimos; lo mandamos
ahora porque la pregunta de B4.9 llevaba quince días esperando y ésta es la
primera vez que algo concreto depende de ella.

Gracias.
