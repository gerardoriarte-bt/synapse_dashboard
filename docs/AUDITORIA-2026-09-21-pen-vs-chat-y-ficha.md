# El `.pen` contra lo construido · C3 y A2 · 2026-09-21

> **Auditoría**, con fecha. Un cruce puntual: qué dibuja `design/Synapse_v2.pen`
> y qué se construyó. No se actualiza — si algo de acá se cierra, se dice en el
> plan, que es la fuente.

## Por qué existe

**Las tres pantallas que se construyeron el 2026-09-21 estaban dibujadas y no se
abrieron.** `C3 · Chat expandido`, `C3 · Chat · historial colapsado` y
`A2 · Ficha de cliente` existen en el `.pen` desde antes.

Es el mismo error que este repositorio ya pagó: hasta el 2026-09-15 `CLAUDE.md`
describía el `.pen` como «los tokens, la fuente de `tokens.css`», y con esa
lectura se construyeron diez pantallas de admin y builder sin abrirlo. Esa línea
se corrigió y se escribió la auditoría `AUDITORIA-2026-09-15-pen-vs-construido`,
que cubrió **F4.1–F4.15**. **C3 quedó afuera** — la Fase 3 estaba bloqueada y no
había nada que comparar. Ahora sí lo hay, y la regla falló otra vez con la
corrección ya escrita.

**Ninguna divergencia de acá es un defecto de funcionamiento.** Todo lo
construido pasa la puerta y hace lo que dice. Lo que difiere es qué se muestra y
cómo se dice, que en este producto es la mitad del trabajo.

---

## 1 · C3 · la forma de la hoja

**El `.pen`** · hoja de **940**: riel de historial **220** + conversación
**720**. Riel en `$dock`, hoja redondeada **solo del lado que entra**, **filo de
2px en `$acc`**. Y un segundo estado dibujado: **el riel colapsa a 52** y la
conversación toma 888.

**Construido** · `ChatOverlay` es una hoja de **480** con borde izquierdo de 1px
en `w3`, sin redondeo y sin filo. El riel va **debajo** de la conversación, no al
lado, y no colapsa.

**Es la divergencia de fondo y no un retoque**: el riel lateral cambia el
esqueleto de `PanelChat` y el ancho de `ChatOverlay`. Los 480 vienen de F3.1,
cerrada el 2026-09-03 — también sin abrir el `.pen`.

**Del colapso, la nota dice algo que el diseño no deja deducir:** sobreviven el
control para reabrir, el «+» de nueva consulta y **la cuenta**. *«Un riel
colapsado que no dice cuánto esconde no invita a abrirlo.»*

## 2 · C3 · el contexto es la PESTAÑA, no el panel

**El `.pen`** encabeza la hoja con `PREGUNTAR A SYNAPSE` y debajo
`CONTEXTO · UA MX · ECOMMERCE OVERVIEW · JUL 2026 · 12 PANELES`. El campo dice
**«Preguntá sobre esta pestaña»**, y cada hilo del riel declara
**`DESDE ECOMMERCE OVERVIEW`**, `DESDE BRAND MOMENTUM`, `DESDE PRODUCT SALES`.

**Construido** · la hoja se titula con el **nombre de la métrica del panel** y el
contexto que viaja es `panel_context: {panel_id, period}`.

**Esta NO se resuelve mirando el `.pen`, y por eso se deja abierta.** El `.pen`
gana en lo visual y en el literal de la UI, pero acá lo que difiere es **qué
viaja en la petición**, y eso lo decidió un humano el 2026-09-17 sobre la forma
del backend: el chat es del panel. El riel del `.pen` es coherente con su propia
lectura —si el contexto es la pestaña, el hilo se nombra por pestaña—, así que
adoptar el literal sin la decisión dejaría una etiqueta que miente.

**Es una propuesta de spec sobre el `.pen`**, no una tarea de ajuste.

## 3 · C3 · el literal de la UI, que el `.pen` sí manda

Acá no hay ambigüedad: son textos, el `.pen` es la autoridad y lo construido
dice otra cosa.

| El `.pen` | Construido |
|---|---|
| `VER LA CONSULTA QUE PRODUJO ESTA RESPUESTA` · `PLEGADO` | «Cómo se calculó» |
| `PREGUNTAR A SYNAPSE` como encabezado | el nombre de la métrica |
| `Preguntá sobre esta pestaña` en el campo | «¿Por qué cambió?» |
| `NUEVA CONSULTA` · `HISTORIAL` en el riel | sin encabezado ni «+» |
| `ESC` en la cabecera | «Cerrar» |
| `LAS CONSULTAS QUEDAN EN EL TENANT` · `VISIBLES SOLO PARA TU ROL` | no está |

**El pie del riel no es decorativo**: dice quién puede leer lo que se preguntó, y
es la clase de cosa que se pregunta una vez y se responde mal si no está escrita.

## 4 · C3 · la fila del riel

**El `.pen`** · cada hilo lleva la pregunta entera, **`DESDE <PESTAÑA>`**, **la
hora o la fecha** —`09:52`, `13 AGO`, `28 JUL`— y el badge `DECISIÓN` cuando
corresponde. Agrupado en `HOY`, `ESTA SEMANA`, `JULIO`.

**Construido** · pregunta entera ✓, agrupado ✓, badge `Decisión` ✓, y en vez de
`DESDE <pestaña>` + hora va **`MÉTRICA · PERÍODO`**.

**La hora falta y el `.pen` la dibuja en todas las filas.** El dato está —
`actualizadoEn` llega— y el agrupado ya lo usa. Es un ajuste chico.

## 5 · C3 · lo que el `.pen` estructura y nosotros recibimos como prosa

**El `.pen`** dibuja `PUNTOS DE LECTURA`, `FUENTES CONSULTADAS` y
`LÍMITE DECLARADO` como **estructura**: las fuentes son una tabla de
**fuente + capa + frescura** —`ERP · GOLD · 2 H`, `Ads API · GOLD · 2 H`,
`GA4 · GOLD · 3 H`—.

**El contrato coincide con el `.pen`**: `EventoAuditoria` declara
`fuentesConsultadas` y `limiteDeclarado` como campos.

**El que difiere es el CABLE**: el agente los manda como secciones de markdown
dentro del texto, y por eso F3.13 los pinta como rótulos de sección.

**Esto refuerza un pedido que ya está hecho** y le agrega un campo: además de la
BASE y la frescura de la cifra (tarea 2 del mensaje), las **fuentes con su capa y
su frescura** deberían viajar en el evento `auditoria`, no dentro de la prosa.

## 6 · C3 · `SIN COMPETENCIA`

**El `.pen`** le dedica un bloque entero: el rótulo `SIN COMPETENCIA`, la línea
**`NO ES UNA NEGATIVA GENÉRICA`**, el motivo, `LO QUE SÍ PUEDO · ...` y **dos
CTAs** — `PROYECTAR 4 SEMANAS` y `SOLICITAR LA FUENTE`.

**Construido** · F3.13 traduce `[SIN_COMPETENCIA]` a una línea: «No puedo
responder esto con las fuentes que tengo», y deja el motivo debajo.

**La dirección es correcta y el tratamiento está corto.** Los dos CTAs no se
pueden pintar —no hay manejador, y la regla del CTA muerto lo prohíbe—, pero el
rótulo y la línea «no es una negativa genérica» sí.

## 7 · C3 · las sugerencias

**El `.pen`** las pinta bajo `SUGERIDAS` como **chips accionables** —«Qué
campañas bajan el ROAS», «Cuánto pesa Shopping»—: se aprietan y preguntan.

**Construido** · `ChatThread` las lista como texto en un `<ul>`. No se pueden
apretar.

**Y ahora hay con qué:** el backend sirve
`GET /config/panels/{panelId}/chat-suggestions`, que devuelve `{question, intent}`
—determinista, sin Cortex—. Es la tarea sin número que el plan del 17 dejó
anotada al final de la Fase 3.

---

## 8 · A2 · `ACCESO A DATOS`, y acá el `.pen` contesta lo que declaramos pendiente

**El `.pen`** dibuja un bloque **`ACCESO A DATOS`** organizado **por rol**:

```
ACCESO A DATOS
  ROL · CEO       Acceso vigente     ACCESO VIGENTE
  ROL · PLANNER   Acceso vigente     ACCESO VIGENTE
  ÚLTIMA VERIFICACIÓN   Hoy · 09:40      [ VERIFICAR AHORA ]

EL PERMISO SE APLICA EN EL BACKEND, NO EN LA COMPOSICIÓN ·
UN ROL SIN ACCESO NO VE EL DATO AUNQUE EL PANEL EXISTA
```

**Construido** · `AgentConfig` pinta un bloque **«Agente de datos»** con una
tabla **por agente** —agente, rol que atiende, estado, acceso— y declara el
estado del acceso como pendiente.

**Lo que la auditoría confirma es que la decisión de F4.4 fue la correcta.**
§7.3 pedía «acceso vigente, última verificación» y el `.pen` dibuja exactamente
eso, con su CTA. Declararlo pendiente en vez de deducirlo de `is_active` era lo
que correspondía: el diseño quiere **una verificación**, no un interruptor.

**Lo que hay que ajustar es la forma:**

| El `.pen` | Construido |
|---|---|
| Se llama **`ACCESO A DATOS`** | «Agente de datos» |
| Organizado **por rol** | por agente |
| `ÚLTIMA VERIFICACIÓN` con su fecha | declarado pendiente ✓ |
| CTA **`VERIFICAR AHORA`** | no se pinta · no hay manejador, y es correcto |
| La nota dura del permiso | no está |

**Por rol es derivable de lo que ya llega**: el agente trae `target_role`. Lo que
no llega es la verificación, y eso sigue pedido.

**La nota dura sí se puede escribir hoy**, y es la que más enseña: *el permiso se
aplica en el backend, no en la composición — un rol sin acceso no ve el dato
aunque el panel exista*. Es la misma regla que `RoleEditor` ya declara para las
métricas ocultas, dicha para el acceso.

## 9 · A2 · lo que el `.pen` dibuja y no está

Tres bloques enteros, y **dos ya están declarados pendientes** en la ficha, que
es lo correcto:

| Bloque del `.pen` | Estado |
|---|---|
| `IDENTIDAD DEL TENANT` · id, vertical, plantilla, estado, moneda, catalog version, alta | **Declarado** · «Datos del cliente · `GET /admin/tenants` devuelve id y nombre · B4.1» |
| `SUBPROCESADORES` | **Declarado** · «es obligación legal declararlos y no hay de dónde leerlos» |
| `ROLES Y COMPOSICIÓN` · `2 ROLES · 4 PESTAÑAS · 28 PANELES · 11 HEREDADOS DE PLANTILLA`, y por rol el desglose de pestañas con su pregunta operativa y cuántos paneles hereda | **No declarado y no construido** |
| `NO RECIBE · 3 MÉTRICAS` con la razón en prosa y `VER EN EL CATÁLOGO` | **Parcial** · `RoleEditor` dice «oculta N métricas» y las nombra, sin razón ni enlace |
| `ABRIR EN BUILDER` | **No está** · el viaje existe desde el menú de usuario |

**El desglose de composición es el hueco más grande**, y casi todo el dato ya
llega: las pestañas, sus paneles y la pregunta operativa están en el layout
publicado, que A2 ya pide para el editor de roles. Lo que no llega es
**«heredados de plantilla»**.

---

## Qué sale de acá

**Nada se corrige en este documento.** Lo que sigue es material para el plan:

| | Qué | Tamaño |
|---|---|---|
| **1** | El literal de la UI de C3 · §3 | Chico · son textos |
| **2** | La hora en la fila del riel, y el pie del tenant/rol · §4 | Chico |
| **3** | La nota dura del permiso en A2, y renombrar a `ACCESO A DATOS` por rol · §8 | Chico |
| **4** | `SIN COMPETENCIA` con su rótulo y su línea · §6 | Chico |
| **5** | Las sugerencias como chips, contra `chat-suggestions` · §7 | Medio · hay ruta |
| **6** | La hoja de 940 con riel lateral y su colapso · §1 | **Grande** · rehace el esqueleto |
| **7** | `ROLES Y COMPOSICIÓN` en A2 · §9 | Medio |

**Y dos que no son tareas de ajuste:**

- **El contexto pestaña-contra-panel** · §2 · propuesta de spec sobre el `.pen`.
- **Las fuentes con capa y frescura en el evento `auditoria`** · §5 · se suma al
  pedido al backend.
