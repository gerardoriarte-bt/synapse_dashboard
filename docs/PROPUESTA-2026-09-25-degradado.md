# Propuesta de spec · el panel degradado · 2026-09-25

> **Propuesta abierta.** Dos diferencias entre fuentes normativas que se
> encontraron al implementar §ANCLA:DEGRAD-1, y que **no se resolvieron en
> silencio**. El agente no modifica `design.md` ni el `.pen`.

> **CONTESTADA el 2026-09-28 · midiendo el dibujo, no razonando sobre §8.**
>
> **1 · El degradado NO lleva CTA, y el dibujo es más explícito que la spec.** En
> `Estados §8 · C1 en degradación` hay doce paneles y **uno solo está degradado**
> —`10 · Doce meses: eficiencia`—. Ese panel no tiene **ningún** CTA: ni
> «SOLICITAR A ADMINISTRACIÓN», ni «REINTENTAR ESTE PANEL», ni «QUÉ LO
> DESBLOQUEA», **ni siquiera «VER DETALLE»**, que tres paneles sanos de la misma
> pantalla sí tienen. Medido resolviendo las instancias y salteando lo que está
> apagado, que es lo que distingue un badge puesto de uno disponible.
>
> El CTA del principio 15 es del **bloqueado**: en esa misma pantalla, `12 ·
> Decisiones de este mes` dibuja «QUÉ LO DESBLOQUEA» y `8 · Objetivos contra real`
> dibuja «SOLICITAR A ADMINISTRACIÓN». **Lo implementado ya era correcto** y no
> hay que tocar código. `design.md` no se edita desde acá; si diseño quiere que la
> fila de §8 lo diga con palabras, es una precisión de redacción y no un cambio.
>
> **2 · La trama del tramo vencido se queda como intención y SE PIDE EL CAMPO.**
> Medido: la trama existe sólo en la biblioteca —`ESTADO · Degradado`, ocho barras
> en `$fam-demanda-1` y **dos en `$w2`**— y **el panel degradado de C1 no la
> aplica**: sus rellenos de datos son los de la familia, sin una sola barra en
> `$w2`. Así que ni dentro del `.pen` está aplicada donde se vería.
>
> **3 · El badge SE QUEDA EN `$acc`** · decisión humana ratificada el 2026-09-28,
> y acá quedó escrito el camino completo porque enseña algo.
>
> La auditoría levantó la tensión con §2.1 —regla dura, cinco usos del acento, y
> un badge de degradación no es ninguno— y **yo la acepté y redibujé el badge a
> neutro**: borde `$w4`, icono y texto en `$ink`. La medición era mejor —`ink`
> sobre `panel` da 14.89 y 17.38 contra 4.91 y 5.43— y el razonamiento parecía
> cerrado.
>
> **Estaba resolviendo la pregunta equivocada.** La pregunta no es cuánto
> contrasta: es **qué es un panel degradado**. Si es una anotación, el neutro
> tiene razón; si es algo que **reclama una acción**, el acento es su color, y
> §2.1 lo permite por su propia razón declarada —«su exclusividad como color de
> acción es lo que lo hace legible»—. Ganó lo segundo, y §8 lo respalda: un
> degradado declara qué lo desbloquea.
>
> **Revertido en el `.pen` el 2026-09-28**: `V9PYxO` vuelve a borde, icono y texto
> en `$acc`, mono 9, sin relleno — el dibujo original, intacto.
>
> **La consecuencia queda dicha de frente: la lista de §2.1 está incompleta**, y
> escribir el sexto uso es de diseño sobre `design.md`, que no se edita desde acá.
> Está pedido en `docs/PROPUESTA-2026-09-28-sexto-uso-del-naranja.md`.
>
> Con eso, la decisión: **el alcance de la trama son las formas con eje temporal**
> —series, área, forecast—, y en las que no lo tienen la regla «obliga a fechar»
> la cumple la procedencia con su frescura, que ya se pinta en los seis estados.
> Para implementarla hace falta **un campo que diga desde qué punto el dato está
> vencido**; sin él no se dibuja, porque adivinar el tramo es inventar el dato.
> Falta abrirle tarea en el plan: es un pedido al backend y no trabajo de diseño.

## De dónde sale

El 2026-09-24 el backend hizo que una fila nunca materializada se sirva
`DEGRADED`. Al abrir la consola aparecieron los dos paneles de prosa con el
badge puesto **y el texto viejo intacto**, sin decir por qué. El shell
descartaba `razon` y `desbloqueaCon`, que el contrato declara **obligatorios**
en `PayloadDegradado`.

Eso ya está corregido: `render/Panel/DegradedNote.tsx`. Lo que sigue abierto son
dos puntos donde las fuentes no dicen lo mismo.

---

## 1 · ¿El degradado lleva CTA?

| Fuente | Qué pide |
|---|---|
| **Principio 15** | «el panel NO muestra un número aproximado: muestra el estado, la razón, qué lo desbloquea **y un CTA**» |
| **§8 · fila «Degradado»** | «El panel muestra el dato con un badge que declara la limitación y su alcance» — sin CTA |
| **§8 · fila «Bloqueado»** | «Sin número. Razón, qué lo desbloquea, **CTA**» |

**Se implementó sin CTA**, por la regla de que gana la fuente más específica
para lo que se está implementando: la fila de §8 describe el tratamiento del
degradado, y reserva el CTA para el bloqueado.

Y hay una razón de producto que apoya lo mismo: **un panel degradado no está sin
salida**. Muestra la cifra y dice qué lo desbloquea; el bloqueado no muestra
nada, así que sin CTA se queda sin ninguna acción posible.

**Lo que hay que decidir:** si el principio 15 se lee como que incluye al
degradado —y entonces §8 tiene que decirlo en su fila—, o si el principio 15
habla del bloqueado y conviene precisarlo.

**Nota de costo, que no es menor.** `design.md` §5 ya advierte que «un `kpi` con
badge de degradación no cabe a colSpan 3 × rowSpan 4: el badge suma una línea».
La nota de limitación suma una o dos más, y un botón sumaría otra. Con
`rowSpan` fijo, todo lo que crece en el shell lo paga el cuerpo.

## 2 · Marcar el tramo vencido

El `.pen` **sí dibuja** el degradado, en
`Librería de gráficos/Row 23 · Estados/ESTADO · Degradado`: una serie de barras
con **las dos últimas en `$w2`** en vez del color de familia, y la nota

> `DEGRADADO NO BLOQUEA: OBLIGA A FECHAR. LA TRAMA MARCA EL TRAMO VENCIDO.`

**Eso no está implementado y no se puede implementar hoy**, por dos razones
distintas:

1. **Es tratamiento del cuerpo, no del shell**, y hay nueve formas de cuerpo. Lo
   que en una serie es «las dos últimas barras» en un escalar no tiene
   equivalente.
2. **Falta el dato.** El cable manda `reason` y `unlocks_with` como texto; no
   dice **qué tramo** está vencido. Sin ese campo, marcar la trama sería
   adivinar cuál, y el front no calcula lo que el backend no manda.

**Lo que hay que decidir:** si esto se pide al backend como un campo —por
ejemplo, desde qué punto de la serie el dato está vencido— o si la frescura del
panel entero alcanza y la trama queda como intención de diseño no implementada.

**Mientras tanto la mitad que sí se cumple es la primera**: «OBLIGA A FECHAR».
La procedencia con su frescura —`SILVER · MERCHANT CENTER · HACE 31 H`— ya se
pinta en los seis estados, y es lo que el dibujo pide que no falte.

---

## Lo que NO es una diferencia

**`razon` es la limitación y su alcance.** Se leyó como que §8 pedía algo que el
contrato no daba, y no: `PayloadDegradado.razon` está descripto en
`contracts/synapse-api.yaml` como «Qué limitación tiene el dato y cuál es su
alcance», que es la fila de §8 con las mismas palabras. La pieza existía; lo que
faltaba era pintarla.
