# Las recomendaciones de UX, cruzadas con el código y el `.pen` · 2026-11-09

**Qué es esto.** Llegó una evaluación de UX en una hoja de cálculo, «Evaluación»:
30 hallazgos, EV-001 a EV-030, cada uno con lo que se vio, el impacto y lo que
proponen, y 30 capturas. Acá se valida cada uno: si aplica, **de quién es**, y
si choca con algo ya decidido.

**Cómo se midió.** Se leyó cada texto citado contra `src/` en `Gerardo`
(`341601d`), contra los frames del `.pen` (`C1`, `C2`, `C3 · historial
colapsado`) y contra `design/design.md`. **No se miró QA**: las capturas son de
ahí y se toman como evidencia de lo que QA sirve. La evaluación habla de octubre
de 2026 en UA.

## El saldo

| Veredicto | Cuántos | Cuáles |
|---|---|---|
| **Aplica y es nuestro**, sin chocar con nada | 9 | EV-001, 002, 008, 011, 015, 022, 024, 025, 027 |
| **Aplica en parte**: una mitad es nuestra, la otra de otro | 7 | EV-003, 009, 012, 019, 021, 026, 028 |
| **Choca con una regla o con el `.pen`** · decide el humano o diseño | 5 | EV-006, 016, 020, 023, 030 |
| **Es del dato o del backend** · el front no lo puede arreglar | 5 | EV-007, 010, 017, 018, 029 |
| **Es composición del tablero** · se hace desde el builder, decide producto | 4 | EV-004, 005, 013, 014 |

**La evaluación es buena, y lo dice algo concreto**: dos de sus hallazgos son
defectos nuestros que ninguna prueba vio — EV-024 y EV-027, abajo. Los dos se
leen como «se ve raro» en la hoja, y en el código son condiciones mal escritas.

## Dos defectos nuestros que la evaluación encontró sin nombrarlos

**EV-024 · «Consultando» sigue con la tabla ya dibujada.** `ChatThread.tsx`
muestra el esqueleto mientras `turn.streaming && turn.respuesta.texto === ''`.
Mira sólo el TEXTO: si el agente manda la tabla antes que la primera palabra, la
tabla se dibuja y el esqueleto sigue debajo contando segundos. Es exactamente la
captura: tabla visible con «Consultando · 19 s». Tiene que mirar también
`respuesta.datos`.

**EV-027 · la consulta desplegada no es la que armó la tabla.** `useChat.ts`
guarda **una** `auditoria` por respuesta y cada evento nuevo pisa al anterior.
Cuando el agente consulta dos veces —el detalle diario y después los totales del
mes— la tabla es de la primera y el SQL que se muestra es el de la segunda. La
captura muestra eso: tabla diaria, SQL de totales. **Es nuestro y rompe §7.1**
(«toda respuesta muestra el SQL generado»): mostramos uno que no la generó. La
mitad de la procedencia —«la consulta no la declara»— sí es del backend y ya está
pedida en `docs/MENSAJE-2026-10-08-backend-procedencia-por-nombre.md`.

**Antes de arreglar los dos, se reproducen**: el primero con un stream de MSW que
mande la tabla antes del texto, y el segundo con dos eventos de auditoría.

## Uno por uno

### Aplica y es nuestro

| ID | Qué | Dónde | Nota |
|---|---|---|---|
| EV-001 | El error de acceso dice «credenciales inválidas» sin estado ni salida | `Login.tsx` | El texto es el del servicio, pasado tal cual. El estado de error de los campos, el ícono y el enlace a recuperar son nuestros. El `.pen` no dibuja el login: sólo le reserva el wordmark |
| EV-002 | «Solicitar acceso» y «Olvidé mi contraseña» entre los campos y «Entrar», con el mismo traje de rótulo | `Login.tsx` | Es el defecto que corrigieron los cuatro registros de texto del 2026-10-06 —«un botón con el traje del rótulo»— y el login quedó afuera |
| EV-008 | La barra de meta no marca el 100 % ni el excedente | `KpiBody` | Dibujo nuestro. Lo del color de «Cumplimiento de objetivo» sale de la familia del catálogo y hay que mirarlo antes de opinar |
| EV-011 | «VER DETALLE › PREGUNTAR» se lee como una ruta | `PanelShell.tsx` | La flecha de «Ver detalle» queda pegada a «Preguntar», que va en `dim`. Separarlas es nuestro; antes de tocarlo, el pie del panel en el `.pen` |
| EV-015 | El mes o el día en curso se dibuja como una caída | plots de serie | Ya estaba anotado como abierto el 2026-10-10: el tramo en curso en el trazo. Hoy sólo `PlotSmallMult` lo dice, con «· en curso» en la cifra; el adaptador ya trae `parcial` por punto |
| EV-022 | El envío del chat es la palabra «PREGUNTAR» en texto | `ChatSheet.tsx` | **Divergimos del `.pen`**: `C3 · historial colapsado` lo dibuja como botón relleno `$acc`, con radio `$r-md`. Lo nuestro es texto en `acc` que se ve gris mientras el campo está vacío, que es cuando se capturó |
| EV-024 | Carga y respuesta conviven | `ChatThread.tsx` | Ver arriba. Lo del riel vacío es otra cosa: se refresca al llegar el `fin` (F5.26), no al enviar. Registrar la pregunta al enviar es un cambio de comportamiento, no un defecto |
| EV-025 | «Una tabla que no se dibuja» | `ChatFigure.tsx` | Copy nuestro, escrito para nosotros. La causa es del backend —la columna `label` que se descarta, pedida el 2026-10-09—, pero el mensaje a quien consulta lo escribimos nosotros |
| EV-027 | Procedencia y consulta de la respuesta | `useChat.ts` | Ver arriba |

### Aplica en parte

| ID | Lo nuestro | Lo de otro |
|---|---|---|
| EV-003 | El orden del encabezado y qué rotula el selector | «Synapse UA HTML» es el nombre del cliente cargado en QA: se corrige desde la ficha, no en código. La barra del cliente sigue la decisión humana del 2026-10-20 y la `Propuesta · Header` del `.pen` |
| EV-009 | `render/format.ts`: abreviar o no, el `%` que falta, los decimales de `0.00` | La moneda la declara el catálogo (`unit`). **Una guía de formato es una decisión de diseño**, y el `.pen` ya abrevia («USD 4.28M») |
| EV-012 | «Recién» sale de `format.ts` para menos de una hora; agregar la hora exacta es nuestro | «Gold» se queda (ver abajo). «Venta» contra «Ingresos» y el origen de la meta son del catálogo |
| EV-019 | Usar el ancho de la columna libre es de composición; el rótulo «% de inversión» lo pone el cable | **La fila de total y el «Otras» son cálculos**, y el front no calcula lo que el backend no manda. Se piden |
| EV-021 | La línea que dice qué responde el asistente | **Las sugeridas ya existen** —F5.33, se cargan por pestaña en el builder— y UA no tiene ninguna cargada. Es configuración, no código |
| EV-026 | — | Los encabezados `UNIDADES_DIA`, `UPT_DIA` y la falta de prosa salen del agente. Es de datos, que maneja el agente de Cortex |
| EV-028 | Titular las barras con la métrica y su unidad | Que los valores no sean un ROAS es de la desagregación que sirve el backend |

### Choca con una regla o con el `.pen`

| ID | Qué proponen | Contra qué choca | Quién decide |
|---|---|---|---|
| EV-006 | Flecha o texto de «favorable» en cada variación | La regla 7 de color de `design.md`: «el color no codifica juicio»; el signo comunica dirección. Una flecha sí cabe; un «favorable» es juicio. **Y «HIGHER = BETTER» en inglés y en Inversión es del catálogo**: el `.pen` dibuja «MÁS ALTO = MEJOR» | Diseño para el juicio; datos para el texto |
| EV-016 | Español neutro en vez de voseo | **El `.pen` está en voseo** —«Preguntá sobre esta pestaña»— y es normativo para el literal de UI. El glosario de métricas (Ingresos, Ventas, Venta) es del catálogo | Producto y diseño |
| EV-020 | Subir el tamaño mínimo del texto mono | `design.md` §2.3 cierra los cuatro tamaños mono —9, 10, 11, 12— con «ningún otro tamaño mono». `npm run contraste` ya mide los pares en los dos temas, y hay uno abierto: `DegradedBadge` da 4,17 en oscuro | Diseño. **Lo medible está medido**; lo que piden es cambiar la escala |
| EV-023 | Un ícono de cierre en vez de «ESC» | El `.pen` dibuja «ESC», en C2 y en C3. El nombre accesible ya existe: `aria-label="Cerrar"`. El «‹» del historial también lo tiene | Diseño |
| EV-030 | Sacar términos internos | **«Gold» se queda por decisión**: las capas Medallion son nombres propios (CLAUDE.md, «Lo que queda en inglés»). «HIGHER = BETTER», «DAY», «PLATFORM_RETURN» y «Generated by Cortex» vienen del cable o del agente. Sólo «builder» y «composición» son nuestros | Mezclado |

### Es del dato o del backend

| ID | Qué | A quién |
|---|---|---|
| EV-007 | Contra qué rango se compara un mes en curso: ¿los mismos días o el mes entero? | Backend. El front sólo puede rotular «vs 1–29 sep» si el cable lo declara |
| EV-010 | Inversión 51 698 USD en la tarjeta contra 2 235 316 de Dailymotion en la tabla | Datos: moneda, fuente o período |
| EV-017 | ROAS `0.00` donde no hay ventas | Backend. Si manda `0`, el front no distingue «sin ventas» de «no reporta» |
| EV-018 | «Dailymotion» y «Daily Motion» en filas separadas | Datos |
| EV-029 | El detalle de «Retorno por plataforma» sólo se abre por `DAY` | Backend: las dimensiones las sirve el servicio, y el front no elige el corte |

### Es composición del tablero

**EV-004, EV-005, EV-013 y EV-014 no son código**: son qué paneles, con qué
gráfico y con qué alto. Se cambian desde el builder.

**Y EV-013 y EV-014 pueden ser lo que el 2026-10-05 dejamos a propósito.** El
tablero de UA se publicó en QA **sin los tres gráficos** —`smallmult` en
`daily_trend` y en `media_efficiency_12m`, `radial` en `goal_attainment`—
porque QA no servía `/config/plots`. `smallmult` es justamente «gráficas pequeñas
alineadas por fecha», que es lo que propone EV-013. **Hay que medir si QA sirve
`/config/plots` ahora** antes de rediseñar nada: si lo sirve, es correr
`tools/aplicar-dashboard.py` sin `--sin-graficos`.

EV-005 —tarjetas sin meta con medio panel vacío— es el `rowSpan`: toda altura es
un `rowSpan` y las seis se compusieron con el mismo. Bajarlo en las cuatro sin
meta es composición.

## Lo que se propone tomar, en orden

1. **EV-024 y EV-027**: son defectos, se reproducen y se arreglan con su prueba.
2. **EV-022**: alinearnos al `.pen`.
3. **EV-001 y EV-002**: el login, que no tiene dibujo y es todo nuestro.
4. **EV-011, EV-015, EV-008, EV-025**: pie de panel, tramo en curso, barra de meta
   y copy de la tabla.
5. **Medir `/config/plots` en QA** antes de tocar EV-013 y EV-014.

**Lo que no se toma sin decisión**: EV-006, 016, 020, 023 y 030 piden cambiar el
`.pen` o `design.md`, y el agente no modifica ninguno de los dos. Van a diseño
como propuesta.
