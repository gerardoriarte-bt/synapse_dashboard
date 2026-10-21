# Propuesta de spec · la conexión del cliente, para el equipo interno · 2026-10-21

**Para diseño.** El `.pen` y lo construido difieren, y se escribe acá en vez de
resolverlo en silencio. No se tocó ni el `.pen` ni `design.md`.

## Lo que dibuja el `.pen`

`A2 · Ficha de cliente`, al pie de «ACCESO A DATOS»:

> «LA INFRAESTRUCTURA LA OPERA EL EQUIPO INTERNO Y ESTA PANTALLA NO LA MODIFICA»

La nota de A2 dice lo mismo con §7.3: nada de nombres de base, rol técnico ni
grants.

## Lo que se construyó · F5.55

Dentro de «Acceso a datos», una sección **«Conexión · equipo interno»** que se
pinta **sólo con alcance de plataforma**. Hace tres cosas:

- Dice con qué usuario y rol se verificó, y qué objetos no aparecen.
- Corrige cuenta, usuario, rol y URL.
- Vuelve a verificar.

Un admin de un cliente sigue viendo la ficha del `.pen`, sin plomería.

## Por qué

1. **Lo pidió el humano el 2026-10-21**: que un superadmin pueda dar de alta un
   cliente y verlo funcionar desde la plataforma.
2. **El `superadmin` ES el equipo interno**: de asignación interna, nunca de un
   cliente, por decisión humana del 2026-10-20. La regla de §7.3 se sostiene
   para quien la escribió —el admin del cliente—.
3. **Sin esto, el alta de Keralty y Terpel era un `curl`.** Consultaban con el
   rol de UA, y nadie veía con qué rol se consultaba.

## Lo que se le pide a diseño

- **Dibujar la variante de plataforma** de «Acceso a datos», o decir dónde va
  si no es en la ficha.
- **Ajustar la nota al pie** para que diga a quién aplica: «esta pantalla no la
  modifica» es cierto para el admin del cliente y ya no para el equipo interno.

Hasta entonces, la sección usa los cuatro registros de texto del builder y la
administración, sin tokens nuevos.
