# Propuesta de spec · dónde va el selector de dashboard · 2026-09-26

> **Para diseño.** Se construyó F5.1 y ninguna de las dos fuentes normativas
> dibuja este control. Lo que se hizo está descrito abajo y es reversible; lo
> que se pide es dónde va y qué forma tiene.

## El hueco

**Ni el `.pen` ni `design.md` lo dibujan**, y no es un olvido: el
multi-dashboard llegó después de los dos.

- `design.md` §7.1 lista el navbar de C1 entero — «Wordmark · **selector de
  tenant** · rol activo · **tema** · selector de período · notificaciones · CTA
  de chat · **punto de usuario**»— y no lo incluye.
- El `.pen` tampoco. Se revisaron las dieciséis pantallas de consola: los
  selectores que dibuja son el de **período**, el de **contexto** del builder
  (B1) y el de **gráfico** (B3).
- **Y sus «capítulos» son PESTAÑAS**, no dashboards: `eCommerce Overview`,
  `Brand Momentum`, `Product Sales` e `Inventory & Shopping` viven en el menú
  horizontal de 52 y pertenecen al mismo layout.

## Lo que sí hay, y es la vecindad que se siguió

El `.pen` pone un **`chevrons-up-down` de 13 en `$dim`** sobre el bloque de
cliente del navbar, junto al avatar y a las dos líneas de nombre —«Under
Armour» y «UA PERFORMANCE · MÉXICO · ROL CEO»—. Ese control elige **contexto**.

Un dashboard es contexto, igual que el cliente, así que el selector se puso en
esa vecindad. **La forma es la del selector de período**, que está dibujado y
ya vive en esta barra: un `<select>` con su rótulo.

**No se inventó una forma nueva**, y ésa es toda la decisión que se tomó sola.

## Lo que hay que decidir

1. **¿Va en el navbar o en la cabecera?** §7.1 ya advierte que el navbar «de
   ocho elementos a 768 no entra», y esto lo haría de nueve. Hoy el selector
   aparece **sólo con más de uno**, así que la mayoría de los tenants no lo ven
   — pero el que tenga tres dashboards lo va a ver siempre.

2. **¿Es un `<select>` o el chevron del bloque de cliente?** Si el chevron abre
   un panel de contexto —cliente, rol, dashboard— el selector desaparece como
   control suelto y el navbar no crece. Eso es más trabajo y es una pantalla que
   habría que dibujar.

3. **¿Qué pasa a 768 y a 360?** El `.pen` colapsa el navbar y el bloque de
   cliente se achica; un selector más no entra. Hoy no está resuelto: se pinta
   igual en los tres anchos.

4. **El nombre.** El cable y el contrato dicen **dashboard**; `design.md` usa
   «dashboard» sólo para C1 entero —«C1 · Dashboard»— y el plan hablaba de
   «layouts». Son tres palabras para dos cosas: el **dashboard** es lo que se
   elige y el **layout** es su composición publicada. Conviene fijarlo.

## El estado que apareció midiendo, y que sí está resuelto

**Un dashboard sin layout publicado no es un error.** `POST
/admin/tenants/{tenantId}/dashboards` crea uno vacío, y ése es su estado normal
hasta que alguien lo componga. Medido el 2026-09-26 creando «Marca»:
`/config/me` devuelve `active_layout_id: null` **y `tabs: null`**.

Antes de F5.1 el adaptador tiraba ahí y la consola decía «No se pudo cargar tu
contexto · sin detalle del servidor» — un fallo nuestro atribuido al servicio.

Hoy dice **«Marca» todavía no se compuso**, con su razón y **con salida**: el
estado reemplaza la pantalla entera —navbar incluido— así que sin un botón para
volver el usuario quedaba encerrado. Eso se vio abriéndolo, no lo dijo ninguna
prueba, y es el mismo precedente que B5 el 2026-09-25.

**Si diseño prefiere conservar el chrome** en vez de reemplazar la pantalla, es
un cambio chico y la salida propia sobra.
