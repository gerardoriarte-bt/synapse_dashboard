# El editor a cualquier ancho · propuesta de spec · 2026-11-10

**Para diseño.** Cambia el principio 4 de `design.md` en lo que toca al builder.
Ya está construido por **decisión humana** del 2026-11-10 —«debería verse bien
en cualquier resolución»—, y esto deja escrita la divergencia para que diseño
la acepte o la corrija. El agente no modifica `design.md`.

## Qué dice la spec

Principio 4 y la tabla de §4:

> Builder · §7.2 · mínimo **1600**. El lienzo del cliente se renderiza **1:1 a
> 1200px** más 300 de biblioteca: a otra escala las unidades de arrastre
> mentirían. La excepción es B5, que va a 1440.

## Por qué se cambió

**Lo encontró el humano en una laptop Mac.** Con 1600 de mínimo, a 1440 el
editor quedaba 160 px más ancho que la pantalla: la última columna de paneles y
«Cambiar de cliente» quedaban afuera. Y el lienzo tenía ancho fijo dentro de un
contenedor con su propio scroll horizontal, cuya barra quedaba **al pie del
lienzo**. Para ver la derecha había que bajar hasta el fondo de la página.

**La razón de la spec no aplica a esta implementación.** «A otra escala las
unidades de arrastre mentirían» supone un lienzo medido en píxeles. El nuestro
no lo es: sus 12 columnas son `1fr` y cada celda es su propio destino de
soltado (`src/surfaces/builder/Canvas.tsx`). Achicarlo no cambia la unidad: un
`colSpan` 4 sigue siendo un tercio del ancho. Lo que cambia es el ancho
absoluto del panel en el editor, no su proporción.

**Y en B5 el ancho «real» de la consola no es uno**: la consola colapsa sola a
1280 y a 768, así que verla al ancho de la pantalla es ver lo que vería un
usuario con esa pantalla.

## Qué quedó construido

| | Antes | Ahora |
|---|---|---|
| Mínimo de las seis pantallas | 1600 · B5 1440 | **1024** · abajo, scroll visible |
| Lienzo | Fijo, 1136 | El ancho disponible, **entre 720 y 1136** |

Medido en el navegador contra el backend local:

| Ancho | Configurador | Lienzo | ¿Se desborda la página? |
|---|---|---|---|
| 1440 | cerrado | 1068 | No |
| 1440 | una columna abierta | 688 | No |
| 1280 | cerrado | 908 | No |
| 1280 | una columna abierta | **720**, y se corre de costado | No |

**El piso de 720 salió de medir**: sin él, a 1280 con una columna abierta el
lienzo bajaba a 528 y los paneles se rompían —rótulos de tamaño encimados,
textos desbordados—. A 720 un KPI de 3 columnas mide unos 170 y se lee.

## Lo que diseño tiene que decidir

1. **Si acepta los números**: 1024 de piso para la superficie y 720 para el
   lienzo. Salieron de medir lo que se rompe, no de un criterio de diseño.
2. **Si el editor necesita una disposición propia en anchos chicos.** Con una
   columna del configurador abierta, a 1440 el lienzo baja a 688: entra, pero
   apretado —en un KPI estrecho el ícono de información se acerca al título—.
   Una opción sería que las columnas del configurador tapen la biblioteca en
   vez de sumarse a ella. No se construyó: es una decisión de composición.
3. **El alto de las filas no cambió**: sigue siendo `96·N − 16`. Con el lienzo
   más angosto, un panel del editor es más alto en proporción que el de la
   consola a 1600. Para componer alcanza; si diseño quiere el editor
   proporcional, es otra regla.
