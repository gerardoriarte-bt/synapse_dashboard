# Semáforos por umbral y eje doble · 2026-11-24

**Decisión humana del 2026-11-24**, a partir del catálogo v3.2 de UA MX
(`docs/RESPUESTA-2026-11-24-datos-catalogo-ua-mx-v3.2.md`): «si bien
nosotros definimos algunas reglas, dato considera que son necesarias,
entonces hagamos las adaptaciones».

Las dos reglas que cambian venían de `design/design.md`, que **no se edita**:
`CLAUDE.md` lo declara intocable. La excepción queda escrita acá y en el
código, igual que el rojo de acción del 2026-10-06 vive en
`src/tokens/decisiones.css`. Si diseño las incorpora a `design.md` o al
`.pen`, se borran de acá.

## 1 · Semáforo por umbral

**Qué cambia.** `design.md` §1.3 regla 7 dice «el color no codifica juicio».
Desde hoy hay **una excepción acotada**: un indicador con umbrales declarados
puede pintar su estado.

**Dónde sí:**
- en el cuerpo del medidor (`gauge`), el `bullet` y la cifra de una `kpi`;
- **y solo** si el panel declara sus umbrales.

**Dónde no:**
- **los deltas siguen en neutro.** La regla 7 vale entera para «VS MES
  ANTERIOR», que es dirección y no juicio;
- en series, barras, tablas o cualquier color de dato.

**De dónde salen los umbrales.** Los define datos, por indicador, y se cargan
en el panel como parámetro de layout, igual que la `banda` que el medidor ya
acepta. El front no inventa un corte: un panel sin umbrales se dibuja como
hoy.

**Los tres estados y su color:**

| Estado | Cuándo | Color |
|---|---|---|
| Bien | Del lado bueno del corte superior | Verde · token nuevo `--color-estado-bien` |
| Aceptable | Entre los dos cortes | **Neutro**, el gris de siempre. No ámbar: el ámbar sigue prohibido porque se confunde con el naranja de marca |
| Mal | Del lado malo del corte inferior | Rojo de dato · token nuevo `--color-estado-mal`, **distinto** de `--color-peligro`, que sigue siendo solo de acción |

**El color nunca va solo**: el estado se escribe («BIEN · > 3,0×»), por
accesibilidad y porque un número no queda desnudo. Los dos tokens se miden
con `npm run contraste` en los dos temas.

### De dos lados · lo bueno en el medio

**Decisión humana del 2026-11-24, a raíz del catálogo de Terpel** que
entregó datos, y que no está en el repositorio. Define el pacing
—gasto sobre presupuesto × 100— como malo por los dos lados: por debajo de
90 % y por encima de 110 %. Con dos cortes sueltos eso no se puede decir: la
primera forma sólo sabe «más alto es mejor» o «más bajo es mejor».

**El param tiene dos formas, y la segunda no rompe la primera.** Las dos se
guardan en el mismo `thresholds` del panel:

| Forma | Ejemplo | Se lee |
|---|---|---|
| Un lado | `{ "bien": 3, "mal": 2 }` | La dirección sale del orden de los cortes, como hasta hoy |
| Dos lados | `{ "bien": [90, 110] }` | Bien adentro del rango; fuera, mal. **Sin `mal`, el rango de mal es el de bien**: no hay tramo aceptable. Es el caso de Terpel |
| Dos lados, con aceptable | `{ "bien": [90, 110], "mal": [80, 120] }` | Bien adentro de `bien`; mal fuera de `mal`; aceptable entre los dos |

**Los bordes, con el mismo criterio de un lado**: el de bien se incluye y el de
mal no. Un pacing de 110 % está bien; uno de 120 % contra `mal: [80, 120]`
todavía es aceptable.

**Lo que se rechaza, con la razón escrita**: un rango que no sean dos números
de menor a mayor y distintos, un `mal` que no contenga al de `bien`, y las
formas mezcladas —`bien` número con `mal` rango, o al revés—.

**El texto dice de qué lado**: «Bien · entre 90 % y 110 %», «Mal · por
debajo de 90 %», «Mal · por encima de 110 %», «Aceptable · entre 110 % y
120 %». **No usa las palabras de datos** —«Subejecución», «Sobregasto»—: son
copy del catálogo, y el lado ya se lee en el texto.

**Los colores son los mismos tres**, y el dibujo no cambia: el medidor y el
`bullet` pintan la marca —el arco, la barra de medida— con el color del
estado, sin zonas. Con el valor del lado que sea, el color es el correcto.

**En el builder** se elige «Un lado» o «Dos lados» y se cargan los bordes.
Cambiar de forma borra los cortes: no se traducen una a otra.

**El dibujo de dos lados en el `.pen` queda para después del 2026-11-29**:
Pencil está bloqueado hasta esa fecha por decisión humana. Hasta entonces
el `.pen` dibuja sólo el medidor de un lado (`Plot/SEMÁFORO`).

## 2 · Eje doble

**Qué cambia.** El 2026-10-19 (F5.25) se decidió que una serie con unidades
mezcladas se dividiera (`smallmult`) en vez de compartir eje. Desde hoy
**también** se puede dibujar con dos ejes.

**Cuándo:**
- **exactamente dos series** con **unidades distintas**, declaradas en el
  cable (por ejemplo, visitas y CVR %);
- **cada eje lleva su unidad escrita**, y cada serie se asocia a su eje por
  posición y por rótulo;
- con tres o más series sigue siendo `smallmult`.

Lo elige quien compone, en el builder (`combo`). `smallmult` sigue siendo la
opción por defecto cuando hay unidades mezcladas.

## Lo que falta para construirlo

1. **Front:** los dos tokens en `decisiones.css`, el semáforo en `gauge`,
   `bullet` y `kpi` con los umbrales como parámetro de panel, y el segundo eje
   en `combo`. También el dibujo en el `.pen`, que se diseña acá; **el de dos
   lados, después del 2026-11-29**.
2. **Datos:** los umbrales de cada indicador, pedidos en
   `docs/MENSAJE-2026-11-24-datos-rentabilidad-ua.md` §5.
