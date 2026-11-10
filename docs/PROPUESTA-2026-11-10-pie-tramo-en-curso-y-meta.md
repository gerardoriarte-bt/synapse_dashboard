# El pie del panel, el período en curso y la barra de meta · propuesta de spec · 2026-11-10

**Para diseño.** Son cuatro hallazgos de la evaluación de UX del 2026-11-09:
EV-011, EV-015, EV-008 y EV-025. Están clasificados en
`docs/AUDITORIA-2026-11-09-recomendaciones-de-ux.md` como «aplica y es
nuestro». Ya están construidos, por **decisión humana** del 2026-11-10. Esto
deja escrito qué se tomó del `.pen` y qué no está dibujado, para que diseño lo
acepte o lo corrija. El agente no modifica el `.pen` ni `design.md`.

## EV-011 · el pie del panel se leía como una ruta

**Lo que se vio:** «VER DETALLE › PREGUNTAR», con «Ver detalle» en acento y
«Preguntar» en gris, unidos por la flecha.

**Era una diferencia con el `.pen`:** `Panel/Shell › Footer › Acciones` separa
sus acciones por **12**, y el código por 4. Con 4, la flecha de «Ver detalle»
quedaba pegada a la palabra siguiente.

**Lo que no está dibujado:** «Preguntar». El shell del `.pen` tiene sólo «Ver
detalle» y colapsar. §4.1 de `design.md` pone las acciones en el shell, y el
botón se agregó con F3.15. Iba en `dim`, que se lee inactivo; ahora va en tinta,
con un ícono de conversación. El acento sigue siendo de «Ver detalle», que es lo
que el dibujo marca.

**Para decidir:** si «Preguntar» va en el pie de cada panel, y con qué
tratamiento.

## EV-015 · el mes en curso se leía como una caída

**Lo que se vio:** en «Eficiencia de medios», octubre se dibuja como un punto
más y parece una caída frente a septiembre.

**El dato ya lo decía:** el servicio marca `partial` en el punto del mes en
curso, y sólo los múltiplos lo mostraban («· en curso» junto a la cifra).

**Lo que se construyó, en el gráfico de series** (el que se usa por defecto) **y
en los múltiplos**, desde un solo lugar (`render/plots/core/enCurso.ts`):

- el tramo que llega al punto en curso va **punteado y sin área** debajo;
- el punto va **hueco**;
- su fecha dice **«· en curso»**, en el eje, en la leyenda y en la lectura. En
  los múltiplos, que no tienen eje de fechas, lo dice la cifra, como ya hacía.

**El punteado solo no alcanza:** es el mismo trazo que la proyección del
pronóstico. La palabra es lo que evita confundirlos.

**Para decidir:**

1. Si el recurso es éste. El `.pen` no dibuja un período en curso en ningún
   gráfico.
2. **Los otros gráficos de tiempo** —área apilada, combinado, ranking en el
   tiempo, pendiente, micro tendencia— todavía no lo marcan. Con el recurso
   decidido, se extiende a todos con la misma pieza.

**Lo que no es del front:** el día en curso de las series diarias. El
servicio marca sólo el **mes** abierto, y una serie diaria llega sin la marca.
Calcular «hoy» desde acá sería decidir el corte del día con el reloj del
navegador, y el corte es del cliente. Pedido en
`docs/MENSAJE-2026-11-10-backend-dia-en-curso.md`.

## EV-008 · la barra de meta no marcaba el 100 %

**Lo que se vio:** «153 % de la meta con una barra simplemente llena».

**Era otra diferencia con el `.pen`:** `Panel/Medidor` dibuja un riel de **7**
de alto y un **marcador de 2 × 11 en tinta** al final, que es el 100 %. Al
portarlo quedaron afuera los dos: el riel medía 4 y no había marcador.

**Lo que no está dibujado:** qué pasa por encima de 100. Lo construido:

- el riel se reescala hasta el **doble de la meta**, así el marcador queda a la
  vista;
- el excedente va como un tramo aparte, en **otro escalón de la misma
  familia**. El color sigue saliendo del catálogo, como pide la regla dura 1;
- por encima del doble, el riel se llena y el número dice cuánto.

**Para decidir:** el tope de la escala, y si el excedente se distingue por
escalón, por textura o por otra cosa.

**Lo que no se tomó de EV-008:** la gráfica «Cumplimiento de objetivo». El
color de sus barras es el de la familia de **esa** métrica, no el de cada
tarjeta: la persistencia cromática de §2.2 es por métrica. Que «Ventas» e
«Inversión» se vean del mismo azul ahí y de colores distintos en las tarjetas
es consecuencia de la regla, y cambiarlo es una decisión de diseño. Que esa
gráfica siga en el tablero es composición (EV-005).

## EV-025 · el mensaje de una tabla que no se puede mostrar

**Lo que se vio:** «Una tabla que no se dibuja · Sus filas llegaron sin una
columna que diga de qué es cada cifra». Es la causa técnica, escrita para
nosotros.

**Ahora:** «Estos datos no se pueden mostrar», y debajo, en el registro de
ayuda: «Llegaron cifras sin decir a qué corresponde cada una. Pedí lo mismo
diciendo cómo agruparlo —por día, por canal o por campaña— o pedí que te lo
explique en texto».

**La causa sigue siendo del backend:** la columna `label` que se descarta,
pedida el 2026-10-09. Cuando la manden, este mensaje deja de aparecer en la
mayoría de los casos.
