# Para diseño · revisar las pantallas de reportes por correo · 2026-11-18

**Medido contra `8da29ba` el 2026-11-18**, que es `main` con las pantallas
construidas (#103) y el `.pen` ajustado (#102 y #104). Las ocho pantallas
`A7 · …` se exportaron a PNG desde una copia y se miraron. Lo construido se
recorrió de punta a punta en `dev:mock`, porque las rutas todavía no están en QA.

Hola. Las pantallas del reporte programado (F6.5) están dibujadas desde el
2026-11-04 y **todavía nadie de diseño las revisó**. Desde entonces pasaron
tres cosas que conviene mirar juntas:

1. **Producto decidió el 2026-11-18** quedarse con lo que construyó el backend
   donde difería del plan: frecuencia diaria, tope de 50 destinatarios, agregar
   un externo no vuelve a borrador, y no se borra (pausar es la baja).
2. **Se construyeron** la lista, el editor, la validación y los envíos.
3. **Una auditoría de experiencia** encontró que el recorrido no se entendía, y
   se corrigió en la pantalla y en el dibujo. Está en
   `docs/AUDITORIA-2026-11-18-ux-de-reportes.md`.

## 1 · Qué abrir

En `design/Synapse_v2.pen`, la fila de administración desde x = 24250. Cada
pantalla tiene su nota «Nota · A7 …», con el porqué y lo que se ajustó.

| Pantalla | Se construyó en | Se ajustó el 2026-11-18 |
|---|---|---|
| `A7 · Reportes del cliente` | `src/surfaces/admin/ReportList.tsx` | Tope de 50, el pie, «No se borran: pausar es la baja» |
| `A7 · Reportes · sin reportes` | La misma | — |
| `A7 · Editor de reporte` | `ReportEditor.tsx` | «Diaria», «10 de 50», el aviso del externo, la tarjeta «Rol», el camino a validar |
| `A7 · Validar respuestas` | `ReportValidation.tsx` | La acción bloqueada es «Activar» |
| `A7 · Envíos de un reporte` | `ReportRuns.tsx` | — |
| `A7 · Advertencia por un externo` | No es del front: es un correo | «Sigue activo: el externo lo recibe desde el próximo envío» |
| `A7 · El correo del reporte` | No es del front: es del backend | — |
| `A7 · Página de baja` | Todavía no existe la baja | — |

**Un aviso sobre cómo se editó.** Pencil no estaba conectado en esta sesión, así
que los ajustes se hicieron sobre el JSON del archivo con un script, y no con
el MCP como pide `docs/INSTRUCCIONES-2026-09-28-diseno-en-el-pen.md`. El archivo
se reescribe idéntico y los chequeos de diseño pasan, pero **conviene abrirlo
en Pen.app y confirmar que se ve bien**. Si Pen.app guarda solo, migra el
formato: esa decisión sigue pendiente.

## 2 · Lo que les pedimos revisar

**Las decisiones que se tomaron sin diseño**, porque hacían falta para
construir:

1. **La tarjeta «Rol» del editor.** El servicio exige un rol, y decide qué datos
   ve el reporte y quién puede recibirlo. Va debajo del nombre, con las mismas
   opciones de la frecuencia.
2. **Generar y validar son un solo paso.** El servicio genera las respuestas y,
   si todas contestan, deja el reporte validado. La pantalla lo dice: el botón
   es «Generar las respuestas», la tarjeta pasa a «Respuestas generadas ·
   léelas», y **activar es la confirmación de haberlas leído**.
3. **No se borra.** Pausar es la baja, y el pie de la lista lo dice.

**Lo que se construyó y no está dibujado**, para que lo dibujen o lo cambien:

4. **El aviso de lo que se hizo**: una franja arriba de la lista, por ejemplo
   «Activado. El primer envío sale el 3 dic a las 08:00, a 2 destinatarios: 1
   usuario y 1 externo.»
5. **Salir con cambios sin guardar**: una franja con «¿Salir sin guardar? Se
   pierden los cambios de este reporte.», «Seguir editando» y «Salir sin
   guardar».
6. **Una lectura que falla**: «No se pudieron cargar los reportes de este
   cliente.» con «Reintentar». La nota del vacío dice que se usan los `Estado/*`
   del sistema, y no se los usó: se resolvió con una tarjeta propia.
7. **En la lista, el paso que sigue va destacado**: Validar, Activar y Reanudar
   en naranja, primero. En el dibujo todas las acciones pesan igual.
8. **En las vistas internas no se repite el título «Reportes»**: la migaja y el
   título del reporte ocupan ese lugar.

**Lo que el dibujo tiene y la pantalla todavía no**, porque el servicio no lo
manda. Está pedido al backend en
`docs/MENSAJE-2026-11-18-backend-ajustes-de-reportes.md`:

- De dónde sale cada cifra de una respuesta, y la marca «sin dato».
- «Enviarme una prueba».
- El resultado del último envío en la lista, y los rebotes por destinatario.
- La página de baja.

**No hace falta cambiarlo**: el dibujo es el objetivo, y la pantalla lo va a
alcanzar cuando el servicio lo mande.

## 3 · Lo que nos devuelven

- **Qué de §2 aprueban, qué cambian y qué dibujan.** Lo que cambien, lo
  ajustamos en la pantalla.
- **Si el `.pen` se ve bien abierto en Pen.app.**

Gracias.
