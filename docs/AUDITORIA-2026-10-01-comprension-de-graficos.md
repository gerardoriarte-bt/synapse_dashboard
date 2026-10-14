# Auditoría de usabilidad · ¿se entienden los gráficos? · 2026-10-01

> **Histórico.** Un cruce puntual, con fecha. No se actualiza.

**Hecha mirando los gráficos con dato de Snowflake**, no leyendo el código: los
quince paneles de `overview` y los doce del muestrario `repertorio-real`, con el
2026 entero ya materializado.

**Contesta una pregunta puntual**: algunos gráficos no traen información que
explique qué muestran. Es cierto, y abajo está por caso — pero lo que apareció
primero es peor que un rótulo faltante.

**No repite** `docs/AUDITORIA-2026-09-30-usabilidad.md`, que es del recorrido
general. Lo de acá es sólo si un gráfico se entiende.

---

## 1 · El hallazgo que no esperaba · un gráfico que miente y se ve perfecto

### 1.1 · La dona escribe `461,1` en el centro

El panel `Cumplimiento de objetivo` dibujado como **dona**:

```
            461,1                VISITAS    103,8 · 23%
   CUMPLIMIENTO DE OBJETIVO      UNIDADES   101,6 · 22%
                                 VENTAS      96,7 · 21%
                                 ÓRDENES     85,8 · 19%
                                 OTROS · 1   73,2 · 16%
```

**Los cinco valores son porcentajes de cumplimiento de meta** — la BASE lo dice:
«real sobre meta del mes para 5 indicadores». Visitas llegó al 103,8% de su meta,
órdenes al 85,8%.

**Una dona los trata como partes de un todo**, así que:

- los **suma** → `461,1`, que no significa nada;
- calcula la **participación de cada uno sobre esa suma** → «VISITAS 23%», que no
  es el 103,8% de su meta: es «visitas aporta el 23% de la suma de cinco
  porcentajes que no tienen nada que ver entre sí».

**Es aritméticamente coherente y semánticamente falso**, que es el peor modo de
falla que este producto puede tener: un director lee `461,1` y no tiene de dónde
agarrarse para dudar.

### 1.2 · Y el mosaico hace lo mismo, con menos pistas

El mismo panel como **treemap** muestra sólo `Visitas 23%`, `Unidades 22%`,
`Ventas 21%`, `Órdenes 19%`, `Inver… 16%`. **Las cifras reales no aparecen** —
sólo la participación inventada. Es peor que la dona, porque ésta al menos pone
el `103,8` al lado.

### 1.3 · La causa está en el repertorio, y es nuestra

```
donut    formas ['categorical', 'composition']
treemap  formas ['categorical', 'composition']
```

**Los dos aceptan `categorical`, y ahí está el error.** El contrato ya distingue
las dos formas y la distinción es exactamente ésta:

| Forma | Qué es | Qué trae |
|---|---|---|
| `composicion` | **Un todo repartido** | `porcentaje` **por parte, calculado por el backend** |
| `categorica` | Valores con etiqueta | `etiqueta` y `v`, nada más |

`composicion` existe *porque* las partes suman un todo — hasta trae su porcentaje
calculado del lado del servicio, con su razón escrita: «la suma tiene que dar 100
y redondear en el cliente produce columnas que suman 99,9».

**Una `categorica` no promete eso**, y los dos gráficos de parte-sobre-todo lo
asumen igual. Cuando los valores son porcentajes de metas distintas, el resultado
es `461,1`.

**Propuesta**: que `donut` y `treemap` sirvan **sólo `composicion`**. Es un cambio
de dos líneas en las fuentes de `gen-plots.py`, y hace que el builder deje de
ofrecer la combinación en vez de que alguien la descubra mirando.

### 1.4 · Y el mismo dato, bien dibujado, se lee perfecto

El mismo panel como **anillos**:

```
            92                   VISITAS 103,8
         PROMEDIO                UNIDADES 101,6
                                 VENTAS 96,7
                                 ÓRDENES 85,8
                                 INVERSIÓN 73,2
```

**El promedio de cinco porcentajes de meta sí significa algo**, y la leyenda
muestra los valores reales. Ningún porcentaje inventado.

**Es el mismo dato y el mismo día**: lo único que cambia es el gráfico elegido.

---

## 2 · El eje de tiempo son días desde época

**En tres gráficos a la vez**, y es lo primero que se ve:

```
20362   20393   20423   20454   20485   20513   20544   20574   20605   20635
```

`20362` es el 2025-09-01 contado en días desde 1970. Aparece en el **combinado**,
en el **bump** y en la **pendiente**.

**Ya está pedido —B1.34— y la razón es real**: el campo `t` llega sin declarar su
unidad, así que rotularlo hoy sería adivinar. Lo que esta auditoría agrega es que
**ya no es teórico**: tres gráficos del muestrario lo muestran crudo.

---

## 3 · Lo que sí es «falta información explicativa»

### 3.1 · `Goals vs actual` no dice que 100 es la meta

```
VISITAS   ████████████████████
UNIDADES  ███████████████████
VENTAS    ██████████████████
ÓRDENES   ████████████████
INVERSIÓN █████████████
          0        50       100      150
```

Cinco barras, un eje `0–150` y **nada más**: ni cifras, ni unidad, ni una línea en
100. Y 100 **es** la meta — sin esa línea, que órdenes esté en 85,8 y visitas en
103,8 se ve como «dos barras parecidas».

**Lo que haría**: la cifra al final de cada barra y una marca en 100. Las dos
están en el repertorio —`bullet` hace exactamente eso— así que puede ser cambio
de gráfico y no de componente.

### 3.2 · Tres series en un eje, sin leyenda

`Tendencia diaria` como **multilínea** dibuja tres trazos y **ninguno dice cuál
es**. La BASE nombra las tres —«venta, visitas e inversión»— pero no cuál es cuál.

Y comparten un solo eje de valores: ventas llega a 200K y la inversión queda
**pegada al piso**, ilegible, porque está en otra magnitud.

**El mismo dato como `smallmult` se lee entero**: tres paneles, cada uno con su
escala, su rótulo y su cifra —`VENTAS 37.711`, `SESIONES 67.484`, `INVERSIÓN
5.987`—. Es el mejor gráfico del muestrario.

### 3.3 · `OTROS · 1`

La leyenda de la dona agrupa **un solo elemento** bajo «OTROS». Agrupar uno no
ahorra nada: sólo esconde que ese 73,2 es INVERSIÓN.

**Un tope que agrupa un elemento debería no agruparlo.**

### 3.4 · `ROAS ×100`

Aparece tal cual como rótulo de serie en el bump y en la pendiente. Es un truco de
escala —multiplicar para que entre en el mismo eje— y el lector tiene que dividir
mentalmente: ve `1.079` donde el ROAS es `10,79`.

Viene del nombre de la serie en el dato, así que es un pedido a quien lo emite,
no un arreglo nuestro. Pero conviene decirlo: **es plomería visible.**

---

## 4 · Lo que está bien, y conviene no romperlo

- **Cada panel declara su BASE y su procedencia.** Con el dato real, `Cumplimiento
  de objetivo` explica en una línea de dónde salen las metas. Ningún dashboard que
  yo conozca hace esto.
- **`smallmult`** resuelve el problema de las magnitudes mezcladas sin que nadie
  lo pida.
- **El medidor «% DE LA META» con su barra** en los KPI hace legible de un vistazo
  lo que `Goals vs actual` no logra con un gráfico entero.
- **El bullet dice `SOBRE 5M`** y el medidor `SOBRE 15`: terso, pero el techo está.

---

## 5 · El patrón detrás de todo esto

**El repertorio valida la ESTRUCTURA del dato, no su SIGNIFICADO.**

`catalog/plots.ts` comprueba que la forma del valor sea una de las que el gráfico
acepta, y los mínimos y topes cuentan elementos. Nada de eso puede saber que cinco
porcentajes de metas distintas no son un todo repartido.

**Y el builder ofrece todo lo que el repertorio permite**, así que quien compone
elige una dona para un cumplimiento de objetivo sin que nada lo frene.

Las dos salidas no se excluyen:

1. **Achicar lo que el repertorio permite** donde la forma ya distingue el caso —
   §1.3, que es dos líneas y evita la clase entera.
2. **Que el gráfico diga lo que asume.** Una dona que escribe un total podría
   declarar «sobre un total de 461,1» en vez de dejar la cifra sola; con eso el
   absurdo se ve.

---

## 6 · Lo que yo haría primero

1. **`donut` y `treemap` sólo sobre `composicion`** · §1.3 · dos líneas, y saca de
   circulación el único gráfico que miente.
2. **Las cifras y la marca de meta en `Goals vs actual`** · §3.1 · es el panel que
   más se mira y hoy no se puede leer.
3. **La leyenda de la multilínea** · §3.2 · tres trazos sin nombre es barato de
   arreglar.
4. **`OTROS` con un solo elemento** · §3.3 · una condición.

**Lo que NO tocaría sin preguntar**: el eje de tiempo (§2) espera a B1.34, y
`ROAS ×100` (§3.4) es de quien emite el dato.

---

## 7 · Cómo se hizo

Contra el servicio en `:4010` con el 2026 materializado entero, período `2026-09`,
mirando los quince paneles de `overview` y los doce de `repertorio-real` en los
dos dashboards. Cada hallazgo salió de ver el gráfico, no de leer su componente.

**Lo que esta auditoría NO cubre**: los anchos responsive, el chat, y los gráficos
del repertorio que ningún panel usa todavía — de los 49, el muestrario dibuja 12.
