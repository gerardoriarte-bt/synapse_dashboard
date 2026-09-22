# Donde el `.pen` y lo construido difieren · 2026-09-22

> **Propuesta de spec abierta, con fecha.** Lo que las fuentes normativas no
> resuelven y el código no puede inventar. **El agente no modifica `design.md`
> ni el `.pen`**: acá se deja la divergencia escrita y la decisión la toma un
> humano.

## Por qué este documento y no otro

`CLAUDE.md` fija el mecanismo: *«Donde dos fuentes difieran, gana la más
específica para lo que se está implementando **y se abre una propuesta de
spec**. No se resuelve en silencio.»* Cada vez que eso pasó, la divergencia
quedó anotada **en el comentario del archivo donde apareció**. Eso sirve para
quien lee ese archivo y no sirve para decidirlas: nadie las ve juntas.

**Pero no se juntan todas acá, y esa es la parte que importa.** Las que son del
**contrato** ya tienen casa —`docs/B0.9-preguntas-abiertas.md`— y copiarlas
sería el error del 2026-09-14: cuatro documentos diciendo lo mismo y el más
viejo mintiendo. Al final de este hay un índice de dónde vive cada una.

**Lo que se junta acá son las del `.pen`**, que no tienen ninguna: el dibujo y lo
construido difieren, y hace falta decidir **cuál de los dos se corrige**.

Ninguna bloquea código. Todas tienen una lectura implementada y escrita al lado.

---

## 1 · Dos valores que el `.pen` escribe y su propia escala no puede emitir

**Quién decide** · diseño · **Bloquea** · nada

El frame `Chat` de §PEN:C3 lleva dos literales crudos mientras los otros nodos
de esa misma pantalla usan tokens:

| El dibujo | La escala que el `.pen` emite | Se usó |
|---|---|---|
| `radius [16, 0, 0, 16]` | termina en `--radius-xl: 10px` | el token · `rounded-l-xl` |
| velo `#0B0B0CCC` | no hay color de velo | `shad`, el único negro translúcido del sistema |

El segundo tiene un argumento extra: **«un hex literal es un bug» es regla
dura**, y `shad` se invierte con el tema, que un hex fijo no hace.

**La pregunta:** ¿la escala gana un radio de 16 y un color de velo, o el dibujo
usa los que ya hay? No se puede tener las dos: hoy el `.pen` se pide a sí mismo
algo que no puede producir.

## 2 · Dos tamaños más, del mismo modo de falla · A2 §9

**Quién decide** · diseño · **Bloquea** · nada

El mismo caso, encontrado al construir `ROLES Y COMPOSICIÓN` el 2026-09-22:

| El dibujo | La escala | Se usó |
|---|---|---|
| nombre del rol · `font-display` **17** | va de `--text-titulo: 15px` a `--text-titulo-lg: 20px` | `text-titulo` |
| nombre de la pestaña · `font-body` **12.5** | va de `--text-celda: 12px` a `--text-cuerpo: 13px` | `text-celda` |

**Esto NO es una pregunta nueva: es evidencia para la 9 de B0.9**, que ya
pregunta si §2.3 gana una tabla para `font-body` y `font-display`. Ahí está
anotado que `--text-lead` y `--text-titulo-lg` se apoyan en **dos nodos cada
uno** y que con dos no se distingue una decisión de un descuido.

Estos dos tamaños son el otro lado de la misma moneda: nodos del `.pen` que
**no** llegaron a ser token. Si §2.3 gana su tabla, decide qué pasa con ellos.

## 3 · El logotipo a color no entra en una superficie con datos

**Quién decide** · diseño · **Bloquea** · nada

El `.pen` empieza los tres chromes con la marca. La versión a color **choca con
las familias cromáticas**: su azul y su violeta son los de `demanda` e
`inventario`, y en una pantalla que pinta datos eso lee como una serie más.

Va la monocroma, que sirve en los dos temas. Igual que en v2.

**La pregunta:** ¿la marca a color queda reservada para superficies sin datos
—login, correos, documentos— y la monocroma es la de producto? Hoy está resuelto
así por omisión y conviene que esté dicho.

## 4 · El punto decimal, que el `.pen` usa para las dos cosas

**Quién decide** · diseño · **Bloquea** · nada

Ninguna fuente normativa fija el formato numérico, y **el `.pen` se contradice
consigo mismo**: usa el punto como decimal en **85** lugares —«USD 4.28M»,
«6.4%»— y como separador de miles en **12** —«1.284.500»—, a veces en la misma
pantalla. Un punto no puede significar las dos cosas.

Se resolvió con `es-MX`, que es lo que hacen los 85 mayoritarios y lo que
corresponde al primer cliente. **Los 12 restantes quedan como propuesta**: o son
un descuido del dibujo, o son una intención que el front está pisando.

Ojo con no confundirla con la 3 de B0.9, que es otra cosa: **de dónde sale el
locale** —hoy `createFormat('es-MX')` está clavado porque `Contexto` no lo
declara—. Ésta es **cuál es el formato correcto**, una vez que se sepa de dónde
sale.

## 5 · El contexto del chat · la pestaña o el panel

**Quién decide** · producto · **Bloquea** · nada, pero deja literales sin adoptar

La única de esta lista donde **el `.pen` no gana**, y por eso está escrita.

**El dibujo** encabeza la hoja con `PREGUNTAR A SYNAPSE` y debajo
`CONTEXTO · UA MX · ECOMMERCE OVERVIEW · JUL 2026 · 12 PANELES`. El campo dice
«Preguntá sobre esta pestaña», y cada hilo del riel declara `DESDE ECOMMERCE
OVERVIEW`.

**Lo construido** titula la hoja con el nombre de la métrica del panel, y lo que
viaja es `panel_context: {panel_id, period}`.

**Por qué no la resuelve el `.pen`.** Su autoridad es lo visual y el literal de
la UI; acá lo que difiere es **qué viaja en la petición**, y eso lo decidió un
humano el **2026-09-17** sobre la forma del backend: el chat es del panel. El
riel del dibujo es coherente con su propia lectura —si el contexto es la pestaña,
el hilo se nombra por pestaña—, así que **adoptar el literal sin la decisión
dejaría una etiqueta que miente**.

**La pregunta:** ¿la decisión del 17 reemplaza al dibujo, y entonces C3 se
redibuja con el contexto de panel? ¿O el chat vuelve a ser de la pestaña y hay
que pedirle otra forma al backend?

## 6 · Las fuentes del evento `auditoria` · acá el que difiere es el cable

**Quién decide** · backend · **Bloquea** · nada

La única que no es del `.pen`, y va acá porque tampoco tiene casa: no es una
pregunta del contrato sino una diferencia entre el contrato y el cable.

**El `.pen` y el contrato coinciden**: las fuentes consultadas son **estructura**
—una tabla de fuente + capa + frescura, `ERP · GOLD · 2 H`—, y `EventoAuditoria`
declara `fuentesConsultadas` y `limiteDeclarado` como campos.

**El que difiere es el cable**: el agente las manda como secciones de markdown
dentro del texto, y por eso F3.13 las pinta como rótulos de sección.

**Refuerza un pedido que ya existe** y le agrega un campo: además de la BASE y la
frescura de la cifra, **las fuentes con su capa y su frescura deberían viajar en
el evento `auditoria`, no dentro de la prosa**. Va con el pedido del chat.

---

## Dónde vive cada una de las demás

Para que este documento no crezca hasta pisar a los otros:

| Divergencia | Dónde vive |
|---|---|
| `Contexto` no declara locale, moneda ni zona | **B0.9 · 3** |
| `paramsDisponibles` es sólo una lista de nombres | **B0.9 · 5** |
| `PanelConfigurado` no declara `orden` | **B0.9 · 6** |
| §2.3 declara la escala mono y no la otra | **B0.9 · 9** · y ver §2 de acá |
| El tracking del KPI | **B0.9 · 10** |
| Con qué tipo de panel se dibuja una cifra del agente | **B0.9 · 11** · resuelta por F3.6 |
| `PeriodoId` no admite días, trimestres ni rangos | **B0.9 · 12** |
| El badge de degradado no llega a AA en tema oscuro | **B0.9 · 13** |
| §7.2 pide un param de desagregación que ningún tipo declara | **B0.9 · 14** |
| La interacción del canvas de composición · B2 · F4.9 | `docs/PROPUESTA-CANVAS-2026-09-15.md` |
| `Metrica.base` a `design.md` · **decidido, falta ejecutar** | el plan · **T8** |
| `Columna` sin `decimales` ni `unidad` | el plan · **B1.14**, como pedido |
| `/config/blocks` sin un `grupo` por tipo | el plan · junto a B1.21 |

**Y una que no es de spec sino de operación**, para que no se pierda entre
éstas: rotar las credenciales de `docs/backdocs/environments.txt`. Decidido el
2026-09-15 que se hace más adelante — **diferido, no olvidado**, y está en
`CLAUDE.md`.
