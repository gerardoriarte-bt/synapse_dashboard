# La biblioteca del editor es de datos · propuesta de spec · 2026-11-10

**Para diseño.** Invierte el orden de B2 → B3 → B4 del `.pen`. Ya está
construido por **decisión humana** del 2026-11-10, y esto deja escrita la
divergencia para que diseño la acepte o la corrija. El agente no modifica el
`.pen` ni `design.md`.

## Qué dibuja el `.pen`

El flujo empieza por el gráfico:

1. **B2** · la biblioteca lista los 15 **tipos** de panel, agrupados en
   Comparación, Composición, Evolución, Distribución y Estado. Se arrastra un
   tipo al lienzo.
2. **B3** · al soltarlo se elige el **gráfico** de ese tipo.
3. **B4** · y recién ahí la **métrica**: «Elegido el tipo, lista sólo las
   métricas que §5 permite».

## Qué se pidió

> «La biblioteca de tipos creo que debemos cambiar su entendimiento, porque
> ahora se centra en un gráfico y no en los datos que se quieren transmitir.
> Debería mostrar de primera mano qué dato se quiere graficar y luego sí elegir
> el tipo de gráfico. […] Por cada cliente habrá datos diferentes que se pueden
> mostrar de formas diferentes.»

Y tres decisiones del mismo día:

| | Decidido |
|---|---|
| ¿Los datos reemplazan a los tipos? | **Sí**, reemplazan |
| Lo que no sirve para el dato | **Desactivado, con su razón** |
| Qué métricas se listan | **Todas las del catálogo del cliente, con su estado** |

## Qué quedó construido

**La columna izquierda es «Datos del cliente»**: las métricas del catálogo,
agrupadas por familia (Demanda, Medios, Cliente, Inventario, Externo), con su
forma en producto («Cifra única», «Por categoría») y un buscador.

**Al abrir un dato aparece «Cómo se puede mostrar»**:

- Los tipos que dibujan su forma, cada uno con el de por defecto y los
  gráficos del repertorio para esa forma. Cada opción se arrastra al lienzo o
  se agrega con su «+».
- Los que no, plegados en «N tipos no sirven para este dato», cada uno con su
  razón: «Dibuja Serie temporal · este dato es Cifra única».
- **Si el dato ya está en el lienzo, los topes se evalúan** con su cifra real:
  una dona con ocho partes sale desactivada con «más de cinco partes, ilegible
  en dona», la razón del repertorio.

**El panel nace completo**, con su métrica y su gráfico: ya no hay paneles
«Sin métrica» que se crean desde la biblioteca. Un borrador que ya tenga uno
sigue funcionando, y el configurador sigue ofreciendo «Qué muestra».

**Es la misma pregunta que «Cómo se ve» del configurador**, con las mismas
fuentes: `/config/blocks` dice qué formas acepta cada tipo, y `/config/plots`
qué gráficos dibujan cada forma. Está en `src/surfaces/builder/comoMostrar.ts`.

## El dato de cada métrica · resuelto el mismo día

Acá decía que faltaba del backend **el estado de cada dato y su espécimen**
para las métricas que todavía no están en el lienzo. **El backend lo contestó
con `a80c318`** —`GET /admin/tenants/{tenantId}/catalog/data`—, medido en
`docs/AUDITORIA-2026-11-10-respuestas-dato-y-orden.md`, y la biblioteca ya lo
usa:

- **«Sin cifra»** junto a la forma de cada dato que no tiene cifra en el mes
  del lienzo, y su razón —la del servicio— al abrirlo. **No se desactiva**: se
  puede poner igual, y el panel lo dice hasta que la tenga.
- **Si ninguno tiene cifra, se dice una vez arriba** en vez de marcar todos.
  Visto en local: el editor pide el mes en curso, que todavía no tenía dato, y
  marcaba los 33.
- **Los topes se revisan antes de soltar** también para las métricas que no
  están en el lienzo.

**En QA espera el despliegue de `a80c318`**; mientras tanto la biblioteca hace
lo de antes —el dato de lo que ya está en el lienzo—, y lo cubre una prueba.

**Lo que sigue faltando no es del backend: el espécimen**, cada opción dibujada
con la cifra real. Es el punto 3 de abajo.

## Lo que diseño tiene que decidir

1. **Si acepta el orden dato → gráfico.** Cambia B2, B3 y B4.
2. **El agrupado.** Por familia, que es como el catálogo organiza los datos.
   Los cinco grupos de §7.2 eran de gráficos y dejaron de aplicar.
3. **Cómo se ve una opción.** Hoy es una fila con el nombre del gráfico. Con el
   dato por métrica, B3 pide el espécimen dibujado; queda definir su tamaño en
   una columna de 300.
4. **Los nombres del repertorio** llegan en mayúsculas («COLUMNAS», «BULLET»)
   al lado de «Indicador · el de por defecto». Es el mismo texto que ya usa
   el configurador; unificarlo es del repertorio.
