# La experiencia de los reportes por correo, auditada · 2026-11-18

**La hizo un agente aparte, sin el contexto de la construcción**, a pedido del
humano: «debe ser muy intuitivo». Miró las ocho pantallas `A7 · …` del `.pen`,
exportadas a PNG desde una copia y con sus notas, y lo construido en el PR #103
(`front/reportes-por-correo`). Lo construido lo leyó en el código; de la app
corriendo vio sólo una captura de la lista.

**Lo corrigió la misma rama**, decidido por el humano ese día: «corrige todo».
Lo que se hizo con cada hallazgo está en §5.

## 1 · El veredicto

La lista se entiende bien. **El problema es el recorrido**: después de cada
acción el usuario no sabe dónde quedó ni qué sigue. Lo que más confundía:

- **«Validar ✓»** generaba las respuestas y validaba en el mismo clic. El
  reporte quedaba validado antes de que nadie leyera nada, y la tarjeta seguía
  diciendo «Antes de validar».
- **La navegación interna no vivía en la URL.** «Reportes» en el menú y «atrás»
  en el navegador no volvían a la lista.
- **Ninguna acción confirmaba lo que hizo.**
- **Si la lista no cargaba, el error no se veía**: quedaba cargando para
  siempre.

## 2 · Los hallazgos

### Gravedad alta

| | Qué pasaba | Dónde |
|---|---|---|
| **A1** | Si la lista o los envíos fallaban, la pantalla quedaba cargando para siempre: no se leía el error, ni el 403 | Construido |
| **A2** | «Validar ✓» validaba sin que nadie hubiera leído, y contradecía «validar es leer las respuestas antes de activar» | Construido |
| **A3** | La vista no estaba en la URL: «Reportes» en el menú no volvía a la lista, «atrás» sacaba de la sección y se perdía lo escrito | Construido |
| **A4** | Guardar, activar y pausar no decían nada; activar desde la lista ni siquiera decía cuándo sale | Construido · el dibujo tampoco lo resuelve |
| **A5** | Editar un reporte activo lo devolvía a borrador y dejaba al usuario en la lista, sin decir que había que validar | Construido |

### Gravedad media

| | Qué pasaba |
|---|---|
| **M1** | El editor nuevo mostraba un error al abrirse: «Falta el nombre del reporte», antes de escribir nada |
| **M2** | El rol había que elegirlo antes que los usuarios, y estaba abajo. Cambiarlo sacaba usuarios en silencio. El dibujo no tiene rol |
| **M3** | Cancelar y la migaja descartaban los cambios sin preguntar. El dibujo tenía «Cambios sin guardar» |
| **M4** | Desde la validación no se podía corregir una pregunta |
| **M5** | Se podía guardar y activar un reporte sin destinatarios |
| **M6** | La lista mostraba la fecha del último envío como si hubiera salido bien. El dibujo marca la falla en la fila |
| **M7** | «Sólo un reporte activo envía» se leía como «sólo puede haber uno activo» |
| **M8** | Quien buscara «Borrar» no encontraba cómo dar de baja. La nota del dibujo de la lista todavía nombra «Borrar» |
| **M9** | «Ver las respuestas validadas» abría los envíos, con la primera corrida elegida, que podía ser un envío |
| **M10** | «Al activar» decía «Sale mensual · día 3 · 08:00»: el formato corto de la lista, no una frase |
| **M11** | «Reportes» salía dos veces seguidas: el título de la pantalla y la migaja |

### Gravedad baja

| | Qué pasaba |
|---|---|
| **B1** | El alta arrancaba sin preguntas: había que apretar «Agregar pregunta» tres veces |
| **B2** | El paso que hace avanzar el estado pesaba lo mismo que «Editar» |
| **B3** | Las filas de envíos sólo se elegían con el mouse |
| **B4** | «Bien» como resultado de un envío se leía flojo |
| **B5** | El día del mes va del 1 al 28 sin explicar por qué |
| **B6** | Validar podía no refrescar los envíos |
| **B7** | Podía salir un punto doble al final del error de una respuesta |
| **B8** | La fila pausada dice sólo «Pausado», sin la fecha |

### Para diseño, del dibujo

- El editor no tiene el campo de rol, que el servicio exige.
- El editor no ofrece camino a validar ni a activar: sólo Guardar y Cancelar.
- La nota de «A7 · Reportes del cliente» todavía nombra «Borrar», contra P6.9.

## 3 · Lo que el agente recomendó primero

1. Los estados de error y de sin permiso (A1).
2. El paso de validación, con «Generar las respuestas» y la tarjeta que cambia
   según el momento (A2).
3. Confirmar cada acción, y llevar a validar cuando una edición vuelve a
   borrador (A4 y A5).
4. La vista en la URL, y el aviso de cambios sin guardar (A3 y M3).
5. En el editor: el rol arriba, sin error al abrir y al menos un destinatario
   (M1, M2 y M5).

## 4 · Lo que conviene no tocar

- **La lista y el vacío**: la pregunta operativa, «Cuándo sale» con su
  subtítulo, las acciones por estado, y la frase del vacío.
- **Los avisos del editor antes de guardar**, el «N de 50», «Entre 3 y 5», la
  hora «la del cliente» y el rechazo del correo de un usuario como externo.
- **La validación**: «Activar» deshabilitado con «Se activa después de
  validar», y una respuesta que falló diciendo que bloquea.
- **Cambiar de cliente** vuelve a la lista y no arrastra un formulario.

## 5 · Lo que se corrigió

Cada corrección grave tiene su prueba en `tests/surfaces/admin/reportes.test.tsx`,
y **cada prueba se verificó rompiendo el código**: siete mutaciones sobre base
verde, las siete muertas.

| | Qué se hizo | Dónde |
|---|---|---|
| **A1** | La lista y los envíos dicen «No se pudieron cargar …» con «Reintentar»; un 403, «Esta pantalla pide rol de administrador.» | `FallaDeCarga.tsx`, `Reportes.tsx` |
| **A2** | El botón dice «Generar las respuestas». La tarjeta cambia: «Antes de activar», «Respuestas generadas · léelas» con «Activar confirma que leíste estas respuestas. Desde ahí sale solo.», o «N respuestas fallaron · vuelve a generarlas para poder validar» | `ReportValidation.tsx` |
| **A3** | Cada vista tiene su ruta: `/admin/reportes/nuevo`, `/:id`, `/:id/validar`, `/:id/envios`. «Reportes» en el menú y «atrás» vuelven a la lista | `Reportes.tsx`, `Admin.tsx` |
| **A4** | Un aviso arriba de la vista a la que lleva: «Activado. El primer envío sale el …», «Reanudado. Próximo envío: …», «Pausado. No se envía hasta que lo reanudes.», «Cambios guardados.» | `Reportes.tsx` |
| **A5** | Si guardar lo devolvió a borrador, va a validar con «Volvió a borrador: no se envía hasta que lo valides de nuevo.» Un alta también va a validar | `Reportes.tsx` |
| **M1** | El motivo va como pista junto al botón: «Para guardar: falta el nombre del reporte.» Error sólo el del servicio | `ReportEditor.tsx` |
| **M2** | El rol va debajo del nombre. Sin rol, «Elige primero el rol: …» junto a «Elegir usuarios». Al cambiarlo, «Sacamos N usuarios que no tienen el rol X.» | `ReportEditor.tsx` |
| **M3** | «Cambios sin guardar» junto a Cancelar, y salir con cambios pregunta «¿Salir sin guardar?» con «Seguir editando» y «Salir sin guardar» | `ReportEditor.tsx`, `Reportes.tsx` |
| **M4** | «Editar el reporte» en la tarjeta de validación | `ReportValidation.tsx` |
| **M5** | «Falta al menos un destinatario.» | `reporte.ts` |
| **M6** | Debajo de la fecha del último envío: «El resultado, en Ver envíos». No se muestra como si hubiera salido bien | `ReportList.tsx` |
| **M7** | «Solo los reportes activos se envían · validar es leer las respuestas antes de activar» | `ReportList.tsx` |
| **M8** | Se suma al pie: «Los reportes no se borran: pausar detiene los envíos y se puede reanudar» | `ReportList.tsx` |
| **M9** | El botón se llama «Ver envíos y validaciones →» | `ReportEditor.tsx` |
| **M10** | «Sale cada mes el día 3 a las 08:00 (hora del cliente), a 2 destinatarios: 1 usuario y 1 externo.» | `reporte.ts`, `ReportValidation.tsx` |
| **M11** | En las vistas internas no se pinta el título de la pantalla: la migaja y el título del reporte ocupan ese lugar, como en el dibujo | `AdminChrome.tsx`, `Admin.tsx` |
| **B1** | El alta arranca con tres campos vacíos. No son las sugeridas de P6.3, que sigue abierta | `ReportEditor.tsx` |
| **B2** | Validar, Activar y Reanudar van primero y destacados | `ReportList.tsx` |
| **B3** | La fecha de cada envío es un botón | `ReportRuns.tsx` |
| **B4** | «Enviado» en vez de «Bien» | `ReportRuns.tsx` |
| **B5** | «Del 1 al 28, para que salga todos los meses, también en febrero.» | `ReportEditor.tsx` |
| **B7** | El punto final del error no se duplica | `ReportValidation.tsx` |

### Lo que no se cambió, y por qué

- **B6 ya estaba bien.** La clave del cache de los envíos cuelga de la de los
  reportes, así que validar, que invalida los reportes, también los refresca.
- **B8 no tiene dato**: el servicio no guarda cuándo se pausó.
- **Salir por el menú o por «atrás» con cambios sin guardar no pregunta.** Sólo
  preguntan Cancelar y la migaja. Interceptar la navegación del enrutador pide
  otro tipo de router; se suma si hace falta.
- **Lo del dibujo es de diseño**: el campo de rol en el editor, un camino a
  validar desde el editor y la nota que nombra «Borrar». No se tocó el `.pen`.
