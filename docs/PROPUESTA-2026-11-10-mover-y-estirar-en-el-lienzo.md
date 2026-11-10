# Mover y estirar paneles en el lienzo · propuesta de spec · 2026-11-10

**Para diseño.** Ya está construido por **decisión humana** del 2026-11-10, y
esto deja escritas las diferencias con B2 del `.pen` para que diseño las acepte
o las corrija. El agente no modifica el `.pen` ni `design.md`.

## Qué se pidió

> «Podrías revisar cómo refinar la grilla de las cards de métricas, porque para
> mover y ajustar los tamaños…»

## Qué se midió, en local y con un dashboard descartable

1. **Correr un panel una o dos columnas con el mouse no se podía.** El cursor
   terminaba encima del propio panel, y ahí el lienzo no aceptaba soltar. Sólo
   se podía con las flechas.
2. **El panel caía con la esquina en la celda del cursor**, sin importar de
   dónde se lo agarró: uno de 6 columnas tomado por el medio saltaba tres.
3. **Al mover no se veía dónde iba a caer.** El rectángulo de «span al soltar»
   sólo salía para lo que venía de la biblioteca.
4. **Un «Ancho +» en una fila llena bajó dos paneles de fila** y dejó un hueco
   de 5 × 4. Con el guardado automático, eso quedó guardado, y no había cómo
   deshacerlo.
5. **El tamaño se cambiaba de a una celda, con botones.** B2 dibuja ocho asas.

## Qué quedó construido

| | Antes | Ahora |
|---|---|---|
| Mover con el mouse | Sólo a celdas libres, por la esquina | A cualquier celda, **respetando de dónde se agarró**. Mientras se arrastra, los paneles dejan pasar el cursor a las celdas de abajo |
| Al mover | Sin vista previa | El rectángulo con el nombre del panel y su medida, o **con quién choca** |
| Estirar | Botones − y + | **Asas en los bordes**, con la medida a la vista mientras se estira. Los botones y Shift + flechas siguen |
| Tamaño que no entra | Empujaba a los demás | **No se aplica, y se dice por qué**: «Se solapa con «ROAS»», «Correría a «Órdenes» de su lugar», o el rango del tipo |
| Deshacer | No había | **Deshacer y Rehacer**, con botones y con Cmd/Ctrl + Z |

**La regla del tamaño es una sola**, y vale para las asas, los botones, el
teclado y el campo del configurador: un cambio de tamaño se aplica sólo si
ningún otro panel cambia de lugar. Decisión humana del mismo día, entre
«bloquear y avisar» y «empujar a los vecinos».

## Lo que diseño tiene que decidir

1. **Cinco asas de ocho.** El `.pen` dibuja las cuatro esquinas y los cuatro
   lados. Las tres de arriba no se construyeron: **el panel no guarda su
   fila** —la decide la colocación automática—, así que el borde de arriba no
   se puede estirar. Si se agrega la fila al modelo (abajo), se pueden sumar.
2. **Deshacer y Rehacer no están en el dibujo.** Van a la derecha de la línea de
   ayuda del lienzo, en el registro de acción compacta. Si diseño prefiere otro
   lugar —la barra de guardado, por ejemplo—, se mueve.
3. **Dónde se dice por qué no.** Hoy es una línea debajo de los controles del
   panel elegido, y la misma razón aparece en el rectángulo mientras se estira.
   El `.pen` dibuja el aviso de colisión al soltar («SE SOLAPA CON "DOCE
   MESES"»); para el tamaño no dibuja nada.
4. **Los rangos de cada tipo.** Salen del contrato de panel
   (`parametros-front.md` §4): un indicador va de 3 a 4 columnas, una serie de
   5 a 7, un medidor tiene alto fijo de 4. **Usados en el editor se sienten
   angostos**: una serie no puede ir a lo ancho de la pantalla. Si alguno se
   amplía, el cambio es del contrato, y el backend sólo lo siembra.
5. **Una fila opcional por panel.** Sin ella no se puede dejar un espacio
   vacío a propósito. Choca con el reflujo por rol (§3.2 del mismo documento:
   «los paneles suben preservando el orden» cuando un rol no ve uno). Le
   preguntamos al backend la forma y el costo, sin pedirle que empiece:
   `docs/MENSAJE-2026-11-10-backend-orden-y-fila-de-los-paneles.md`.

## Lo que no se automatiza

Que el arrastre se sienta bien. Las pruebas cubren dónde cae el panel, qué se
bloquea y qué se deshace. **Se miró en Chrome** contra el backend local:
- «Ancho +» en la fila llena dice «Se solapa con «ROAS»» y no mueve a nadie.
- El asa de abajo estira una fila.
- Cmd + Z deshace.
- Un panel de 6 × 5 agarrado por su tercera columna y soltado dos columnas a la
  derecha cae exactamente dos columnas más allá.

El arrastre de HTML no se puede disparar desde la automatización del
navegador: se simuló con los eventos reales del navegador dentro de la página.
