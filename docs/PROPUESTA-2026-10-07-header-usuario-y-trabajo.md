# Propuesta de spec · el header en dos menús, usuario y trabajo · 2026-10-07

> **Propuesta para diseño, ya construida por decisión humana.** El `.pen`
> dibuja hoy otra cosa —ver §1— y el agente no lo modifica. Lo que se pide es
> que el dibujo alcance al código, o que diga en qué difiere.

## 0 · La decisión, literal

Del humano, el 2026-10-07, mirando el builder en local:

> «Creo que va a ser importante separar en el header las opciones que despliega
> el nombre y las opciones de trabajo, es decir, Nombre despliega todo lo que es
> información del usuario, y un menu hamburguesa todo lo que deba ser de
> administración, construcción de dashboards. En el header debe aparece un
> acceso rápido para volver al dashboard»

Y al preguntarle cuatro cosas que eso dejaba abiertas:

| Pregunta | Respuesta |
|---|---|
| ¿Se construye antes de que el `.pen` lo dibuje? | Sí: construir y dejar esta propuesta |
| ¿Qué lleva el hamburguesa? | **Superficies y pantallas**: acceso directo a cada pantalla |
| ¿A dónde vuelve «volver al dashboard»? | A la consola, al dashboard activo del usuario |
| ¿El nombre gana «Cerrar sesión»? | Sí. **No existía en ninguna superficie** |

## 1 · Lo que reemplaza

La decisión del 2026-09-28 —`PROPUESTA-2026-09-25-navegacion-entre-superficies.md`—
fue **«todo vive DENTRO del punto de identidad»**: el panel del nombre llevaba
la identidad, el tema y una sección **IR A** con las otras superficies. El `.pen`
lo dibujó así en `Console/Panel de usuario`, y el código lo siguió en las tres
superficies.

Esa decisión resolvía la asimetría de septiembre —desde cada superficie se
salía distinto— y eso **se conserva**: el menú nuevo es el mismo componente, en
el mismo lugar, en las tres. Lo que cambia es que la persona y el trabajo dejan
de compartir panel.

## 2 · Lo construido

| | Qué lleva | Dónde va | Quién lo ve |
|---|---|---|---|
| **Menú del nombre** | Nombre, correo, rol; en la consola además cliente y acceso. Tema. **Cerrar sesión** | A la derecha | Todos |
| **Menú de trabajo** (hamburguesa) | Dos grupos: **Administración** con sus cinco pantallas y **Construcción de dashboards** con Dashboards, Editor e Historial de versiones. Marca la actual | **Al final de la fila, a la derecha**, en las tres superficies | Sólo admin |
| **Volver al dashboard** | Lleva a la consola | A la derecha, antes del nombre | En administración y en el builder |

**El orden de la derecha es** `Preguntar` (consola) o `Volver al dashboard`
(administración y builder) · **usuario** · **menú de trabajo**, con 24 de aire
entre los tres. El menú empezó antes del logotipo y el humano pidió moverlo a la
derecha el mismo día, «con más aire entre el botón preguntar, el usuario y el
menú».

Los componentes: `src/surfaces/MenuDeTrabajo.tsx`, `src/surfaces/VolverAlDashboard.tsx`,
`src/surfaces/IdentityBlock.tsx` y `src/surfaces/console/UserMenu.tsx`. Lo que el
menú ofrece sale de `src/surfaces/trabajo.ts`, que lee los registros de pantallas:
una pantalla nueva aparece sola.

**Tres cosas que no se ven y que vinieron con esto:**

- **La URL decide la pantalla** en administración y en el builder. Era estado
  interno, y el acceso directo desde otra superficie no tenía cómo llegar. De paso,
  recargar y «atrás» dejaron de devolver a la primera pantalla.
- **El builder ofrece sólo las pantallas con pestaña.** Selector de gráfico,
  binder de métrica y vista previa viven dentro del editor; entrar en frío las
  deja sin nada que mostrar.
- **Cerrar sesión no pasa por el servicio**: `contracts/synapse-auth.yaml` no
  declara una ruta de salida y el token vive en el navegador. Salir es borrarlo
  **y vaciar el cache**, para que quien entre después no vea un instante los datos
  del anterior.

**El usuario ganó presencia** · también pedido ese día: «no se diferencia con el
resto de información». Era el nombre en mono gris —el traje del rótulo— en la
consola y una nota de 9 en las otras dos. Ahora es un control con borde, un
círculo de iniciales en `$w3` y el nombre en Inter `$ink`; en administración y el
builder sigue el rol, en nota. Es `src/surfaces/ChipDeUsuario.tsx`.

**En administración la identidad subió a la fila del logotipo**, que es donde el
navbar de `A1 · Clientes y plataforma` la dibuja; estaba en la fila del título.

## 3 · Lo que se le pide a diseño

1. **Dibujar el menú de trabajo** en `C1`, `A1` y `B2`: el icono, su lugar al
   final de la fila, el panel con sus dos grupos y cómo se marca la pantalla actual.
   Hoy es un `menu` de línea de 16 en una caja de 32 con borde `$w4`, y el panel
   reusa el de `Console/Panel de usuario`.
2. **Quitar la sección IR A de `Console/Panel de usuario`** y agregar «Cerrar
   sesión» al final, después del tema.
3. **Dibujar «Volver al dashboard»** en `A1` y `B2`. Hoy es una acción compacta
   con `arrow-left`, en el registro `Accion`.
4. **Redibujar el bloque de usuario** de `C1` y el de identidad de `A1` y `B2`
   con la presencia nueva: círculo de iniciales y nombre en Inter. El `.pen` los
   dibuja en mono de 9.
5. **Decidir si el nombre muestra el correo en administración y el builder**,
   como en la consola. Se puso, porque es información del usuario y el pedido la
   pone ahí.

## 4 · Lo que NO se hizo

- **El hamburguesa no cambia de forma por ancho.** El responsive del navbar está
  diferido por decisión humana —`AUDITORIA-2026-09-28-pen-vs-responsive.md`—.
- **«Volver al dashboard» no abre el dashboard que se está editando**: la consola
  muestra lo publicado, y abrirla en el que se edita confundiría «lo que estoy
  componiendo» con «lo que ven los usuarios». Se preguntó y se eligió así.
