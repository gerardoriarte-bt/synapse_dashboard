# Para el equipo de backend · nos equivocamos, y las dos respuestas que pidieron · 2026-09-25

> **Histórico.** Un mensaje mandado, con fecha. No se actualiza.
>
> Contesta `docs/RESPUESTA-2026-09-25-dos-formas.md`, que a su vez contestaba
> nuestro `MENSAJE-2026-09-25-backend-dos-formas.md`. **Ése estaba mal**, y esto
> empieza por ahí.

## 1 · Tenían razón, y el error fue de medición

Corrimos esto:

```bash
grep -n "case \"" internal/core/dashboard/materialize/transform.go
```

El `switch` tiene **quince** casos: los ocho primeros con literal y **siete con
constante** —`case ShapeDistribution:`—, que un patrón con comillas no ve.
Contamos ocho y afirmamos que las otras no existían. `distribution` y
`series_with_band` están desde `168a761`, y el `6e595e3` que medimos ya las
traía. Verificado hoy con su `grep`, sin comillas.

**Hubo una señal y la leímos al revés**: ese mismo grep mostró `ErrUnknownShape`
en la línea 64 justo después de un `case` en la 47. Diecisiete líneas de hueco
que no nos preguntamos.

**Y la corroboración era falsa.** Citamos nuestro propio cable —«las nueve que
`TransformValue` sabe transformar»— como si confirmara la medición. Es una
transcripción **nuestra**, anterior al 21 y hecha con la misma lectura vieja. Una
transcripción que coincide con una medición no es una segunda fuente.

Perdón por el ruido. Nos llevamos la lección de verificar contra su código y no
contra nuestra copia de su código.

## 2 · El hueco era nuestro, y ya está la mitad

`src/api/adapt.ts` mandaba las siete formas de v1.1 al `default`, con un
comentario que decía que ustedes nunca las escriben. **Ese comentario era la
razón por la que nadie miraba**: una métrica con esas formas salía «forma
desconocida» y el panel quedaba rechazado.

Separado, son tres grupos y no uno:

| | Formas | Estado |
|---|---|---|
| Listo | `distribution` | **Adaptada hoy.** Contrato, cuerpo y adaptador |
| Espera un campo suyo | `series_with_band` | Ver punto 3 |
| Nuestro, y pendiente | `compared_categorical`, `multi_attribute_profile`, `matrix`, `graph`, `flow` | Nuestro contrato no declara su esquema. Son F4.17–F4.19 |

Sobre `distribution`: tomamos `bins` con `label` y `v`. **`lo` y `hi` no los
adaptamos**, porque nuestro contrato interno declara los cortes con etiqueta y
valor y nada más. No es que estorben: es que traerlos sin declararlos sería
inventar una forma. Si los quieren usados, lo pedimos como cambio de contrato de
nuestro lado.

## 3 · Sus dos preguntas

### `level` en el payload · **sí, lo necesitamos**

Nuestro contrato declara `nivel` **obligatorio** en `ValorSerieConBanda`, y no es
formalismo: **una banda sin su nivel de confianza no se puede leer.** Un
intervalo al 80% y uno al 95% son afirmaciones distintas sobre el mismo
pronóstico, y el panel tiene que decir cuál está mostrando — es la misma regla
por la que toda métrica declara su BASE.

Como campo de nivel superior está perfecto: uno por valor, no por punto.

**Es lo único que separa a `serieConBanda` de estar adaptada de nuestro lado.**

### `lo`/`hi` obligatorios en `series_with_band` · **sí, mejor estricto**

Su argumento —«una serie sin banda es válida como dato»— es correcto, y por eso
mismo creemos que conviene rechazarla **en esa forma**: una serie sin banda es
una `time_series`. **El nombre de la forma es la banda.**

Si llega un `series_with_band` con puntos sin `lo`/`hi`, del lado del front hay
que elegir entre dos lecturas que no podemos distinguir: un pronóstico al que le
falta el intervalo, o una serie etiquetada mal. La primera es un dato que
`design.md` prohíbe publicar —«prohibida la estimación puntual sin intervalo»— y
la segunda es un error de catálogo. Rechazarlo en el materializador las separa en
el origen.

Tienen razón en que la regla de presentación es nuestra. Lo que pedimos no es que
la apliquen: es que la forma llegue completa, para que podamos aplicarla.

## 4 · Lo de la fuente en Gold · coincidimos

Nada que agregar al punto 4 de su respuesta. Una métrica de esas formas queda
`BLOCKED` con «Esta métrica todavía no tiene fuente de datos», que es el
comportamiento correcto, y registrar la consulta el día que la tabla exista es de
datos.

Tomamos nota de que el motivo técnico va en `last_error` y el de usuario en
`reason`: es exactamente la separación que nuestro panel degradado necesita.

## 5 · Lo que vamos a hacer con sus fixtures

Gracias por `ShapeFixtureRows`. Vamos a mockear `distribution` con eso —el
payload exacto en vez de uno inventado, que es la regla que más nos ha costado
aprender—, y `series_with_band` en cuanto esté `level`.
