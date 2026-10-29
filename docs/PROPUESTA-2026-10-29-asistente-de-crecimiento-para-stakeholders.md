# Synapse: de consola a asistente de crecimiento · versión para stakeholders · 2026-10-29

> **Abierta.** Es la traducción, para una presentación, de
> `docs/PROPUESTA-2026-10-29-asistente-de-crecimiento.md`. Ese documento tiene
> el detalle técnico y lo medido; éste dice lo mismo sin jerga. Si los dos
> difieren, vale el técnico.

**Cómo usarlo.** Cada sección es una lámina: arriba va el mensaje que tiene que
quedar, y abajo lo que se dice al presentarla. Los dibujos que se citan están en
el archivo de diseño (`design/Synapse_v2.pen`, los frames «Propuesta ·
Crecimiento · 1» a «6»), y se pueden exportar como imagen para las láminas.

---

## Lámina 1 · La pregunta

> **¿Cómo hacemos que todo negocio que quiere crecer sienta que necesita
> Synapse?**

Hoy Synapse es una consola de inteligencia de negocio muy confiable. La
propuesta es convertirla en un **asistente de crecimiento**: algo que no sólo
muestra los números, sino que ayuda a decidir qué hacer con ellos y después
dice si funcionó.

## Lámina 2 · Las cuatro preguntas de quien quiere crecer

> **Synapse contesta muy bien la primera. Las que fidelizan son las dos
> últimas.**

| La pregunta del dueño del negocio | Synapse hoy |
|---|---|
| **¿Qué está pasando?** | ✅ La contesta muy bien |
| **¿Por qué está pasando?** | 🟡 A medias |
| **¿Qué hago?** | ❌ No la contesta todavía |
| **¿Funcionó lo que hice?** | ❌ No la contesta casi nadie en el mercado |

La cuarta es la clave. Un negocio no abandona la herramienta donde está guardada
la historia de por qué creció: qué decidió, por qué y qué pasó.

## Lámina 3 · Lo que ya tenemos y otros no

> **Synapse no inventa números. Ése es el diferencial, y todo lo nuevo se
> construye encima.**

- **Ningún número va solo**: cada cifra dice qué mide, sobre qué base y de dónde
  sale.
- **Cuando un dato está viejo o roto, lo dice** en vez de mostrar un número
  aproximado.
- **Toda proyección viene con su rango**, nunca como una promesa de un número
  exacto.
- **Ya tenemos las piezas de un asistente**: un chat que contesta sobre los datos
  del cliente, resúmenes escritos automáticamente, y recomendaciones con botones
  de «aprobar» y «rechazar».

La mayoría de las «IA para tu negocio» del mercado responden con seguridad aunque
se equivoquen. Nuestro argumento de venta es el contrario: **cuando Synapse dice
un número, se puede confiar en él.**

## Lámina 4 · La propuesta en una frase

> **Pasar de mostrar números a proponer acciones, medir si funcionaron, y
> aprender de cada negocio.**

Cinco movimientos, en el orden en que conviene hacerlos:

1. **Que el asistente nunca se contradiga** con sus propios números.
2. **Que entre cualquier negocio**, no sólo los que tienen un equipo de datos.
3. **Que el asistente vaya a buscar al usuario**, con un resumen cada semana.
4. **Que cada decisión quede registrada y se mida** su resultado.
5. **Que explique por qué cambian los números** y simule qué pasaría si…

## Lámina 5 · Movimiento 1 · Que el asistente nunca se contradiga

> **Va primero porque todo lo demás habla a través del asistente.**

**El problema, con un caso real de octubre:** preguntado por el retorno de la
publicidad en Meta, el asistente dijo **7,28 y subiendo**. El tablero, en ese
mismo momento, decía **2,07 y bajando**. Las dos cifras eran «verdad»: venían de
fuentes distintas. Pero el asistente no dijo de dónde sacó la suya.

Un asistente que se contradice con su propio tablero pierde la confianza en un
día.

**Lo que proponemos:** cada cifra que dice el asistente indica de dónde sale. Si
no coincide con el tablero, muestra las dos y dice cuál vale para decidir.
Además, un examen de unas treinta preguntas por cliente que se corre cada vez
que se actualiza el sistema.

**Lo que hace falta:** que el equipo de datos acuerde una sola definición para
cada métrica, y que el equipo de backend haga que el asistente compare antes de
responder.

*Dibujo: «Propuesta · Crecimiento · 1».*

## Lámina 6 · Movimiento 2 · Que entre cualquier negocio

> **Es lo que más abre el mercado, y hoy es el mayor freno.**

**El problema:** hoy, sumar un cliente nuevo pide tres cosas que la mayoría de
los negocios no tiene:

- un almacén de datos propio (Snowflake);
- un equipo de datos que prepare sus métricas;
- y trabajo de programación de nuestro lado **por cada cliente**.

**Lo medimos esta semana con dos clientes reales.** Keralty entregó 15 métricas
y Terpel 10. **Ninguna se puede mostrar todavía**, porque las fórmulas de las
métricas están escritas en el código y hay que programarlas una por una.

**Lo que proponemos:**

- **Que las fórmulas se carguen como configuración**, no como código. Es una
  decisión de arquitectura que ya está pendiente.
- **Conectores directos** a las herramientas que usan casi todos los negocios:
  la tienda en línea (Shopify), la publicidad (Meta, Google, TikTok) y la
  analítica web (Google Analytics).
- **Un paquete de métricas estándar de comercio** —ventas, pedidos, ticket
  promedio, conversión, inversión, retorno— definido una vez para todos.
- **Empezar por un segmento**: comercio electrónico que vende en Shopify y
  anuncia en Meta y Google. Es la misma forma que tienen los datos de Under
  Armour.

**El objetivo:** una tienda nueva ve su primer tablero con sus datos reales **el
mismo día**, sin que nadie programe nada.

*Dibujo: «Propuesta · Crecimiento · 6».*

## Lámina 7 · Movimiento 3 · Que el asistente vaya a buscar al usuario

> **Es lo más barato y lo que más rápido crea hábito.**

Un tablero espera a que alguien entre. Un asistente avisa.

**Lo que proponemos:** un resumen cada lunes por correo, y después por Slack,
con cuatro cosas:

- qué cambió;
- por qué;
- qué recomienda Synapse;
- y qué decisión se termina de medir esa semana.

**Por qué es barato:** casi todo existe. Ya enviamos correos, los datos ya se
actualizan solos cada día, y el resumen escrito ya se genera.

**Las alertas vienen después, a propósito.** Una alerta falsa destruye la
confianza más rápido que la falta de alertas. Sólo se activan cuando cada
métrica tenga calculado «lo esperado» (movimiento 5), y nunca más de tres por
semana.

*Dibujo: «Propuesta · Crecimiento · 2».*

## Lámina 8 · Movimiento 4 · Decisión → acción → resultado

> **Es lo que hace que Synapse se sienta indispensable.**

**Cómo funciona:**

1. Synapse propone algo: «revisar la caída del tráfico orgánico».
2. Alguien lo aprueba, y queda registrado quién, cuándo y qué se esperaba.
3. Al terminar el plazo, Synapse mide qué pasó contra lo que se esperaba.
4. Con el tiempo, aprende qué funciona **en ese negocio**.

**El resultado es la memoria del negocio:** por qué se movió el presupuesto, qué
pasó y qué se aprendió. Ninguna planilla ni ningún competidor genérico guarda
eso.

**Una regla de honestidad:** Synapse dice «el resultado quedó por encima de lo
esperado», nunca «tu decisión causó esto». En un negocio pasan diez cosas a la
vez, y afirmar una causa que no se puede probar sería prometer de más.

**Dónde estamos:** la pantalla del resultado ya está diseñada. Lo que falta es el
registro de decisiones, que hoy no existe en ningún lado.

*Dibujos: «Propuesta · Crecimiento · 3», más las pantallas C4 ya diseñadas.*

## Lámina 9 · Movimiento 5 · Por qué cambió, y qué pasaría si…

> **Explicar el cambio y simular decisiones, siempre con rango.**

**«¿Por qué bajaron las ventas?»** Synapse descompone el cambio en sus partes:
cuánto fue por menos visitas, cuánto por menos conversión y cuánto por el ticket
promedio. Las partes suman exactamente el total. Hoy el desglose existe, pero no
siempre cuadra con el total, y eso hay que arreglarlo primero.

**«¿Qué pasa si muevo 20% de la inversión de Google a Meta?»** Synapse responde
con un rango: «lo más probable es ganar USD 30K, pero el rango va de perder 60K a
ganar 110K». Nunca con un número solo.

**La pieza que destraba tres movimientos:** calcular, para cada métrica, qué es
«lo esperado» con su rango. Hoy no existe con datos reales. Las alertas (3), la
medición de decisiones (4) y los escenarios (5) dependen de ella.

**Lo que hace falta y hoy no tenemos:** alguien de ciencia de datos que construya
el modelo de los escenarios.

*Dibujos: «Propuesta · Crecimiento · 4» y «5».*

## Lámina 10 · El orden

> **Primero la confianza, luego el hábito, después la memoria.**

| Etapa | Qué | Por qué en ese orden |
|---|---|---|
| **Ya, en paralelo** | Que el asistente no se contradiga (1), y decidir cómo se cargan las fórmulas (2) | Todo habla a través del asistente, y la decisión de las fórmulas ya está frenando a dos clientes |
| **Lo primero que se ve** | El resumen semanal (3) | Casi todo existe, y es la mejor forma de saber qué valoran los usuarios |
| **La base** | Calcular «lo esperado» con su rango (5) | Destraba las alertas, la medición de decisiones y los escenarios |
| **Lo que fideliza** | El registro de decisiones y su resultado (4) | Necesita las dos etapas anteriores |
| **Lo que abre el mercado** | Conectores y métricas estándar (2) | Es el trabajo más largo, por eso arranca en la primera etapa |

No ponemos fechas ni horas: cada equipo estima lo suyo.

## Lámina 11 · Lo que no haríamos

> **Decir que no también es parte de la propuesta.**

- **Un asistente que ejecute solo**, que mueva presupuestos sin que alguien
  apruebe. La aprobación humana es parte de la confianza.
- **Abrir a «todo negocio» antes de resolver la entrada** (movimiento 2). Hoy
  sólo pueden usar Synapse los clientes con equipo de datos.
- **Más gráficos como camino al crecimiento.** El valor está en el «por qué», el
  «qué hago» y el «¿funcionó?», no en tener más tableros.

## Lámina 12 · Quién hace qué

> **La mayor parte del trabajo no es de pantallas.**

| Equipo | Lo principal |
|---|---|
| **Producto** | Elegir el primer segmento, decidir dónde se guardan las decisiones, decidir si los conectores se construyen o se contratan, y hablar con negocios |
| **Backend** | Cómo se cargan las fórmulas, el control del asistente, el resumen semanal y el registro de decisiones |
| **Datos** | Una sola definición por métrica, el paquete estándar de comercio y el cálculo de «lo esperado» |
| **Diseño** | Revisar los seis dibujos y decidir los detalles abiertos |
| **Front** | Dibujar con diseño (ya hecho), escribir la propuesta del formato de las decisiones, y construir cuando llegue cada pieza |
| **Por sumar** | Alguien de ciencia de datos para los escenarios |

## Lámina 13 · Lo que pedimos hoy

> **Tres decisiones y una validación.**

1. **¿Cuál es el primer segmento?** La propuesta es comercio electrónico con
   Shopify, Meta y Google.
2. **¿Las fórmulas de las métricas pasan a ser configuración?** Es la decisión
   que hoy frena a Keralty y Terpel.
3. **¿Los conectores se construyen o se contratan?** Es el trabajo más largo, y
   el que más mantenimiento pide.
4. **Validar antes de construir.** Mostrarles los dibujos a cinco u ocho
   negocios del segmento y preguntarles:
   - ¿Cómo deciden hoy dónde invertir el próximo mes?
   - ¿Qué pagarían por saber si una decisión funcionó?
   - ¿Qué los haría dejar de abrir una herramienta así?

**La propuesta apuesta a que medir el resultado de las decisiones es lo que más
valoran.** Es una hipótesis, y es mucho más barato confirmarla con dibujos que
con meses de desarrollo.

---

## Anexo · Glosario para la presentación

| Término técnico | Cómo decirlo |
|---|---|
| Catálogo de métricas | La lista oficial de qué medimos y cómo se calcula cada cosa |
| Procedencia | De dónde sale el número y qué tan fresco es |
| Banda o intervalo | El rango donde razonablemente va a caer el número |
| Línea base | Lo que esperaríamos que pase si no hacemos nada distinto |
| Materialización | La actualización automática de los números cada día |
| Snowflake o warehouse | El almacén de datos de un cliente grande |
| Conector | La conexión directa a una herramienta del cliente, como su tienda o su cuenta de anuncios |
| Agente | El asistente que contesta preguntas en el chat |
| Drill-down o desglose | Abrir un número en sus partes: por canal, por producto, por día |
