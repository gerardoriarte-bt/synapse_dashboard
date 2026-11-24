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
   en `combo`. También el dibujo en el `.pen`, que se diseña acá.
2. **Datos:** los umbrales de cada indicador, pedidos en
   `docs/MENSAJE-2026-11-24-datos-rentabilidad-ua.md` §5.
