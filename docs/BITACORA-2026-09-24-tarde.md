# La tarde en que el dato real contradijo cuatro cosas dadas por ciertas · 2026-09-24

> **Bitácora**, con fecha. Lo que costó descubrir y no está en el log. Lo que se
> hizo está en los commits; esto es lo que enseñaron. No se actualiza.
>
> Segundo corte del mismo día. `docs/BITACORA-2026-09-24.md` cierra a media
> jornada, con el chat andando contra Cortex y el hallazgo de que el dashboard
> nunca había mostrado un dato del negocio. Esto es lo que pasó **después de
> arreglarlo**.

## Cómo siguió

Con el host corregido por backend en `61d16da`, `sync-catalog` corrió por primera
vez —`created=6 updated=4 catalog_version=2`— y detrás los doce períodos, todos
`available=16 blocked=2 errors=0`. **El dashboard pasó a mostrar el negocio**:
ventas 639.078 en septiembre donde el fixture decía 4.28M.

Y ahí empezó lo que vale anotar. **En una tarde, cuatro cosas dadas por
verificadas resultaron falsas**, y las cuatro por la misma razón.

---

## 1 · Cuatro cierres contra la semilla, y ninguno contra la fuente

| Qué se había cerrado | Cuándo | Qué dijo el camino real |
|---|---|---|
| `semantic_direction` · ask 7 | 2026-09-14 · «CERRADA contra el servicio real» | Seis métricas llegan `HIGHER_IS_BETTER` y salen en pantalla con guiones bajos |
| `presentation` · B1.13 | 2026-09-14 · segunda mitad dada por cerrada | El materializador no la produce **y al correr pisa la que había**: los seis KPI quedaron sin medidor ni comparativos |
| Las claves del catálogo | — | Doce de la semilla, diez de la vista |
| La cabecera del panel · §PEN:§6 | construida del dibujo | Con una BASE real —tres veces más larga— **el título se encogió a cero** |

**Es un solo modo de falla, cuatro veces.** La mañana ya lo había nombrado —
«verificado contra el servicio real» y «verificado con datos reales» son dos
afirmaciones distintas, y la primera se dice sola—. La tarde lo cobró cuatro
veces más, y dos de los cierres llevaban **la misma fecha**: el 2026-09-14, el
día en que apareció el backend y todo se verificó contra lo que ese backend traía
puesto.

**Lo replicable no es «desconfiá de la semilla».** Es que un cierre debería decir
**contra qué** se cerró. «CERRADA contra el servicio real» se lee como definitivo
y era una foto de la semilla; si hubiera dicho «contra la semilla de Postgres,
pendiente el catálogo de Snowflake», nadie lo habría releído como cerrado.

## 2 · El título que desapareció, y por qué ninguna prueba podía verlo

`§PEN:§6` dibuja el título llenando el ancho y la meta abrazando su contenido, y
así estaba escrito: `min-w-0` a la izquierda, `shrink-0` a la derecha. Con el
texto del dibujo —«BASE · TODOS LOS CANALES · MES»— funciona perfecto.

Con la BASE firmada por datos, que mide el triple, la meta no cedió y el título
quedó en cero. **`truncate` sobre una caja sin ancho no pinta una letra**: el
panel se quedó sin nombre.

**Las pruebas no podían verlo porque el fixture copiaba el dibujo.** Es la misma
familia del fixture escrito de memoria, con una vuelta de tuerca: el fixture era
fiel: fiel *al dibujo*, que es un texto de ejemplo y no una cota.

Y el dibujo tampoco podía expresarlo: «abrazá, pero no más de esto» no es algo
que un `.pen` diga. **La regla la tuvo que poner el producto** —el nombre es la
identidad del panel, la BASE es contexto; el título no baja de 128px y la meta
envuelve—, y quedó anotada como elección y no como medida del dibujo.

## 3 · La consola contradiciéndose a sí misma

El panel de resumen seguía diciendo «Sales closed the month at USD 4.28M» al lado
de un KPI que decía 639.078. Y como ese texto no cambia con el período, **decía
lo mismo en los doce meses** mientras las cifras de al lado cambiaban todas.

**Antes de pedir nada, medí de quién era**, descartando las dos derivaciones
posibles desde nuestro lado: `catalogVersion` no los separa —seis paneles de la
versión vieja se refrescaron bien— y derivar «vencido» de la frescura necesita
cadencia y tolerancia, que es B2.13 y da 404.

El mecanismo ya existe del lado de ellos: B2.5 degrada por antigüedad, «older
than 3 days». Lo que no ve es que esas dos filas **nunca se materializaron**:
`last_success_at` es nulo. **«Vieja» y «nunca» son dos estados distintos**, y ese
es todo el pedido.

## 4 · Lo que la aclaración de producto cambió

Preguntando por esas dos métricas apareció que **no son métricas**:
`executive_summary` y `decisions` son el resumen y las propuestas que el agente
elabora **sobre lo que ese dashboard proyecta en el período**. Interpretación, no
medición.

Y la parte que más condiciona: **el dashboard lo compone el admin**. De ahí salen
tres propiedades que no son opcionales —es por dashboard y por período, corre
después del resto porque los consume, y **escala sin curaduría**: el admin agrega
o saca una métrica y el resumen la sigue solo—. Esa última es la que lo vuelve
viable con muchos tenants.

**Y corrigió algo que yo había escrito a medias esa misma mañana.** El SQL que
datos corre decía que esas dos «NO se curan acá», que se lee como «no las
pongas» — y habría sido un error: un panel se ancla a un `metricId` y
`dd_panels.metric_id` es `NOT NULL`, así que sin fila el admin no puede poner el
panel de resumen. La fila hace falta; lo que no hace falta es la expresión.

**Una frase que dice de menos envejece igual de mal que una que dice de más**, y
ésta iba camino a un equipo que no tenía cómo detectar el hueco.

## 5 · El riel de períodos que nadie había dibujado

Pedido de diseño: que los meses fueran un desplegable. Al abrir el `.pen` antes
de tocarlo —que es la regla— apareció que **§PEN:C1 no dibuja ningún selector**:
su `Header` tiene el título a la izquierda y un `Rango` de sólo lectura a la
derecha. El único «CAMBIAR PERÍODO» del archivo es el CTA de un estado vacío.

**El riel de doce chips era invención nuestra**, y llevaba meses. No se notó
mientras el dato era mock; se notó cuando el mes en curso empezó a marcarse y un
chip creció.

Lo anotable es que **el dibujo tampoco tiene la respuesta**: no dibuja cómo se
cambia de período. La decisión la puso producto, y quedó escrita en el componente
justamente porque el `.pen` no la declara — que es lo que evita que dentro de
tres meses alguien la lea como si el dibujo la mandara.

## 6 · Una mutación que sobrevivió, y por qué la anterior no probaba nada

Al reemplazar el riel por el desplegable, la mutación `disabled={!usable}` →
`disabled={false}` **sobrevivió**: apagar el grano que la pestaña no puede
contestar no lo verificaba nadie.

Buscando por qué, apareció que **sí había una prueba que lo cubría** —en
`ConsoleContainer`, de punta a punta— y que el cambio de control la había dejado
roja. Así que la mutación corría **sobre un árbol ya roto**: mataba algo que ya
estaba muerto.

**Es exactamente la trampa que `CLAUDE.md` describe, con la advertencia
escrita.** Salió barata sólo porque el arnés informa el estado de la base antes de
mutar; sin esa línea, el resultado se habría leído como cobertura.

Y el hueco real era anterior: `periodGrain.test.ts` **cita la decisión entera**
—«la métrica lo declara y el selector deshabilita lo que no aplica, con la razón
visible»— y prueba sólo la primera mitad, porque es un archivo de helpers y no
monta nada. **Una cita completa arriba de una cobertura parcial se lee como
cobertura completa.**

---

## Lo que queda abierto

**Todo lo de la tarde va a backend, y está en un solo documento**:
`docs/MENSAJE-2026-09-24-materializador.md`. Son tres: que el materializador emita
`presentation`, que `preserved` degrade en vez de servirse `AVAILABLE`, y el
camino de los paneles de prosa —decidido de nuestro lado que lo llame el
materializador, pendiente de acordar con ellos—.

**De datos queda una sola cosa**, chica: recurar las seis filas de
`SEMANTIC_DIRECTION` que traen el código. El SQL ya lleva la decisión escrita y
la vista de issues las detecta sola, así que no depende de que alguien mire la
pantalla.

**El conteo de tareas y pruebas no se escribe acá**: sale de `docs/ESTADO.md`,
que se genera.
