# Auditoría de usabilidad · las tres superficies, usadas · 2026-09-30

> **Histórico.** Un cruce puntual, con fecha. No se actualiza.

**Hecha usando la aplicación**, no leyendo el código: sesión completa desde el
login, contra el servicio real y con dato de Snowflake. Las tres superficies —
consola, administración y builder.

**No repite la propuesta de navegación** de `docs/PROPUESTA-2026-09-25-navegacion-entre-superficies.md`,
que ya tiene cuatro preguntas abiertas a diseño. Lo de acá es lo que aparece al
recorrerlo.

---

## Lo que está muy bien, y conviene no romperlo

Se dice primero porque es lo que distingue a este producto y es fácil de perder
al arreglar lo de abajo.

**Cada panel declara de dónde sale su número.** `BASE · ALL CHANNELS`,
`GOLD · ERP · RECIÉN`. Ningún dashboard que yo conozca hace esto, y es lo que
convierte una cifra en algo discutible en una reunión.

**Los estados explican en vez de fallar.** «Su fuente tiene 31 h y se refresca
cada hora · qué lo desbloquea: esperar la próxima materialización». Un panel
apagado dice qué pasa, por qué y qué hacer.

**La prosa del agente es buena de verdad.** «El tráfico se mantuvo casi en meta
(3.152.381 sesiones, 98,8% del objetivo), pero las órdenes quedaron en 9.931
(79,2% de la meta de 12.543), lo que evidencia una brecha de conversión como
restricción principal.» Eso es un analista, no un resumen automático.

**El medidor «% DE LA META» con su barra** hace legible de un vistazo algo que
normalmente exige comparar dos números.

---

## 1 · Lo que un usuario leería como un error del producto

### 1.1 · Notas de desarrollo renderizadas como interfaz · **lo más urgente**

En **administración**, al pie de la tabla de clientes:

> FALTAN 2 COLUMNAS QUE EL DISEÑO PIDE · ESTADO · DECIDIDO · ACTIVO, PILOTO Y
> SUSPENDIDO · FALTA LA COLUMNA EN EL SERVICIO · VERTICAL · SON DOS CAMPOS…

En el **builder**, en la pantalla de contexto:

> FALTAN 3 COSAS QUE §7.2 PIDE DE ESTA PANTALLA · CUÁNTOS PANELES DE CADA PESTAÑA
> SON HEREDADOS Y CUÁNTOS PROPIOS · EL `.PEN` PIDE LA PROPORCIÓN REAL…

**La intención es correcta y es la mejor costumbre de este repositorio**: declarar
lo que falta en vez de esconderlo. **El registro es el equivocado.** Cita
secciones de la spec, nombra el `.pen` y habla de «el cable» — vocabulario del
equipo, en la pantalla de un cliente.

**Qué haría:** conservar la declaración y cambiarle el idioma. «Esta tabla va a
mostrar el estado y la vertical de cada cliente cuando el servicio los informe»
dice lo mismo sin pedirle al lector que sepa qué es §7.2. Y si la nota es para
nosotros, va en el código, no en el DOM.

### 1.2 · Datos faltantes que se leen como catástrofe

En `Investment and return by platform`:

| PLATFORM | INVESTMENT | SALES | ROAS |
|---|---|---|---|
| Dailymotion | 1.883.185 | **0** | **0,00** |
| GCM-Other | 1.058.397 | **0** | **0,00** |

Las dos mayores inversiones del mes con **cero ventas**. Un director que vea eso
concluye que se quemó el presupuesto. **Lo cierto es que no hay retorno atribuido
a esas plataformas** — medido: 16 de 37 plataformas tienen retorno sin costo, y
éstas al revés.

**Un cero medido y un cero por ausencia se ven igual, y no son lo mismo.** El
producto ya tiene la distinción resuelta a nivel de panel —`DEGRADADO` con su
razón— pero no a nivel de **celda**. Una celda sin dato debería decir «sin dato»,
no `0,00`.

### 1.3 · Dos clientes con el mismo nombre

La tabla de administración lista dos veces **«Under Armour México»**, uno con 0
usuarios y feed «Nunca cargó», otro con 2 usuarios y 42 h. **No hay forma de
distinguirlos** desde la pantalla.

Puede ser dato de prueba, pero la pantalla no ofrece nada —ni id corto, ni fecha
de alta, ni slug— para desempatar. Con dos clientes reales del mismo grupo
—«Under Armour México» y «Under Armour Chile»— alcanzaría; con dos entornos del
mismo cliente, no.

### 1.4 · La moneda y el idioma del cliente son de otro país

El resumen dice **«los ingresos alcanzaron COP 1.144.876»** para **Under Armour
México**. Ya está reportado —es un default de columna en el backend— y se anota
acá porque **está en el panel que más se lee** y porque el mismo default arrastra
el separador de miles y el huso horario.

---

## 2 · Cifras que no se pueden leer

### 2.1 · Las series no dicen CUÁNDO

`Tendencia diaria` y `Twelve-month efficiency` dibujan sus líneas con eje de
valores y **ningún eje de tiempo**. Se ve la forma y no se sabe si el pico fue en
marzo o en agosto.

**El `.pen` dibuja el plot así** —cuatro líneas de grilla y los trazos, sin
rótulos— así que el componente es fiel. Pero en el dibujo el panel es un espécimen
y en el producto es la única fuente. **Vale preguntarle a diseño si el eje se
omitió o si se dio por supuesto.**

Y hay un motivo técnico detrás: el campo `t` llega como días desde época sin
declarar —B1.34, pedido al backend—, así que hoy no se podría rotular sin
adivinar la unidad.

### 2.2 · Barras sin ninguna cifra

`Goals vs actual` dibuja cinco barras con un eje 0–150 y **ningún número**. Se ve
que VISITAS supera a INVERSIÓN, pero no cuánto vale ninguna. La regla del producto
—«ningún número desnudo»— se cumple al revés en este panel: **hay etiqueta y no
hay número.**

### 2.3 · Unidades que faltan en la celda

La columna `SHARE` muestra `59,45` y `33,41` **sin el signo de porcentaje**. Ya
está anotado en el repositorio —la columna no declara unidad— y desde la pantalla
es ambiguo: podrían ser millones.

### 2.4 · Un timestamp crudo

El builder muestra `PUBLICADO V1 2026-09-22T09:19:06.985933-05:00`. **Microsegundos
y offset** en la pantalla de alguien que quiere saber cuándo se publicó.

### 2.5 · Un título truncado

`Tendencia diar…`. El título del panel compite en la misma fila con el bloque de
BASE y procedencia, que en esa métrica es largo. **Lo que se recorta es lo único
que identifica al panel.**

---

## 3 · Navegación y descubrimiento

### 3.1 · Las salidas entre superficies viven detrás de «Identidad»

Desde administración, el único control que lleva a la consola está dentro del menú
rotulado **«Identidad · Dev Local»**. Adentro están `Consola` y `Builder`.

**Nadie busca «cómo vuelvo al dashboard» haciendo clic en su propio nombre.** Es
el patrón de «cerrar sesión» y de «mi perfil», no el de cambiar de sección.

Esto entra en la propuesta de navegación ya abierta, y se agrega como evidencia:
la pregunta 1 de esa propuesta —«¿dónde vive la salida?»— tiene ahora una
respuesta medida de por qué la de hoy no funciona.

### 3.2 · El navbar muestra el nombre del cliente dos veces

`UNDER ARMOUR MEXICO · UNDER ARMOUR MÉXICO`, uno al lado del otro y escritos
distinto. Son `name` y `label` del cable, y el segundo existe para ser la forma
corta — pero en este tenant son casi iguales, así que se lee como un error.

### 3.3 · En el login, los dos enlaces parecen rótulos

`SOLICITAR ACCESO` y `OLVIDÉ MI CONTRASEÑA` usan **el mismo mono gris** que los
rótulos `CORREO` y `CONTRASEÑA`, sin subrayado ni color. Quien no sepa que están
ahí no los ve.

Es el único punto de la interfaz donde alguien está bloqueado por definición —no
puede entrar— y es donde menos se ve la salida.

---

## 4 · Lo que falta y el usuario no puede saber que falta

**36 pantallas dibujadas, 18 construidas.** La mitad de los recorridos que el
diseño define no existen, y desde la aplicación **no hay ninguna señal de cuáles**.

Las que más se notan al usar:

| Recorrido | Estado |
|---|---|
| Historial de versiones · B6 | Pestaña presente en el builder, sin ruta que liste versiones |
| Cola de accionables · A6 | No construida · diferida |
| Drill-down de un panel · C2 | No construido · diferido |
| Alta de un cliente nuevo · A2 | No construida · no hay alta en el front |

**No es un defecto**: es un producto a medio construir y el plan lo dice. Se anota
porque **el builder ya muestra la pestaña «Historial de versiones»**, y una
pestaña que existe y no contesta es distinta de una que no está.

---

## 5 · Lo que yo arreglaría primero, y por qué

1. **Las notas de desarrollo** · 1.1 · Es lo único de esta lista que un cliente
   leería como «esto no está terminado», y el arreglo es reescribir dos textos.
2. **El cero por ausencia** · 1.2 · Es el que puede hacer que alguien tome una
   decisión equivocada, que es el peor resultado posible de un producto de
   inteligencia de negocio.
3. **La moneda y el huso** · 1.4 · Ya está pedido; se repite porque afecta toda
   cifra de la consola y no sólo la prosa.
4. **La salida hacia la consola** · 3.1 · Barato y desbloquea la propuesta de
   navegación con evidencia.

**Lo que NO tocaría sin preguntar a diseño**: el eje de tiempo de las series
(2.1) y las cifras sobre las barras (2.2). Los dos son fieles al `.pen`, así que
el cambio es de spec y no de implementación.

---

## 6 · Cómo se hizo

Sesión completa contra el servicio real en `localhost:4010`, con dato
materializado de Snowflake del período `2026-09`. Login con el usuario sembrado,
recorrido de consola → administración → builder, con el árbol en `HEAD`.

**Lo que esta auditoría NO cubre**: los anchos responsive —el `.pen` dibuja tres
navbars y hay uno construido, diferido por decisión—, el chat expandido, y el
recorrido de un usuario con rol `planner`, que ve menos métricas.
