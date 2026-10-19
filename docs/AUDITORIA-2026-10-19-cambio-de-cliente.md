# Auditoría · cambiar de cliente como administrador · 2026-10-19

> **Histórico.** Un cruce puntual, con fecha. No se actualiza.

**Por qué:** el humano lo pidió después del despliegue: «no lo siento entendible
cuando se cambia de un cliente a otro como administrador».

**Qué se miró:**

1. **QA**, `qa-synapse.lobueno.co`, con la sesión de `jose.rodriguez@lobueno.co`,
   sólo lecturas.
2. **El flujo entero en local**: el front de `main` en `b701cef` contra
   `7324b26`, con `dev@synapse.local` en `PLATFORM_OPERATOR_USER_IDS`. Al
   cliente semilla se le puso un nombre distinguible mientras se miraba y
   después se le devolvió el suyo, porque en local los dos clientes se llaman
   «Under Armour México».

---

## 0 · En QA, José no puede cambiar de cliente

**QA tiene cinco clientes** —Keralty, Lobueno Analytics, Lobueno Analytics
Terpel, Sistema y Synapse UA HTML, leídos de la ruta pública del formulario de
acceso— y **José ve uno**: `GET /admin/tenants` le devuelve sólo «Synapse UA
HTML». El backend ya es `727547e`: los agentes de otro cliente dan 403. Así que
el aislamiento está, pero **el id de José no quedó en
`PLATFORM_OPERATOR_USER_IDS`**. Para él, hoy, el selector es un nombre fijo.

**Y el front de QA es anterior al #34**: el selector de período todavía dice
«no compara contra uno cerrado», y la ficha, «Identidad del tenant».

## 1 · El recorrido, paso por paso

Con el operador en local, partiendo del cliente propio (UA):

| Paso | Qué se ve | Qué cuesta |
|---|---|---|
| Clientes · elegir el otro | La lista lo marca con borde y punto naranja, y la ficha cambia | **Nada dice cuál es el cliente propio**, el de la sesión. La cabecera dice «Alcance · 2 clientes», no cuál se está mirando |
| Catálogo · Salud de feeds | La cabecera muestra «Cliente · <el elegido>» con su selector | Bien: el elegido se mantiene |
| Usuarios | **El elegido desaparece**: la pantalla es «de plataforma» y el filtro arranca en «Todos los clientes» | Se pasa de trabajar sobre un cliente a ver todos sin que nada lo diga |
| Builder | La cabecera muestra el elegido, y los dashboards son los suyos | Bien |
| «Volver al dashboard» | **Cae en la consola del cliente PROPIO**, sin aviso | Es el salto que se siente roto: se venía trabajando sobre un cliente y se termina mirando otro con el mismo nombre de botón |
| Volver a administración por el menú | Sigue el elegido | La consola dice un cliente y administración otro, al mismo tiempo |
| Recargar la página | **Vuelve al propio**, sin aviso | La elección vive en memoria; la URL no la lleva, y una pestaña nueva arranca en el propio |
| Salud de feeds · «Cargar meses» | El botón no nombra el cliente | Una acción que escribe sobre el cliente elegido, con el selector fuera de la vista al bajar |

## 2 · Por qué pasa, en el código

- **El cliente de trabajo es un `useState` de la app** (`ClienteDeTrabajoProvider`).
  Es lo que la decisión del 2026-10-06 pidió —«una selección unifica todas las
  pantallas»—, y dentro de una sesión de navegación lo cumple. **No sobrevive a
  recargar, y la URL no lo dice.**
- **La consola no puede seguirlo, y no es nuestro**: el cliente de `/config/*`
  es el del token. El backend lo dejó escrito el 13: cuando exista el
  super-admin será «un token nuevo por cliente».
- **«Volver al dashboard» no sabe que hay un cliente de trabajo** distinto del
  propio (`VolverAlDashboard.tsx`): navega a `/`, que es la consola del token.
- **Las pantallas de plataforma ignoran el cliente de trabajo a propósito**
  (`pantallas.ts`: Clientes y Usuarios son `plataforma`). La regla tiene su razón
  —§7.3, A3 cruza clientes—, pero el paso de una a otra no se anuncia.

## 3 · Lo que se propone, del front

| | Qué | Por qué |
|---|---|---|
| A | **El cliente de trabajo en la URL** —`?cliente=<id>`— en administración y builder | Sobrevive a recargar, a una pestaña nueva y a compartir un enlace. Un id que no está en la lista se ignora, como hoy |
| B | **Marcar el cliente propio** en la lista y en el selector: «tu cliente» | Es el punto de referencia: el que ve la consola |
| C | **«Volver al dashboard» dice adónde va** cuando el cliente de trabajo no es el propio: «Volver a la consola de <propio>», con una línea que avisa que la consola muestra el cliente de la sesión | El salto silencioso es lo que más confunde |
| D | **Usuarios arranca filtrado por el cliente de trabajo**, con «Todos los clientes» a un clic | Seguir trabajando sobre el mismo cliente es el caso común; cruzar, la excepción |
| E | **Las acciones que escriben nombran el cliente**: «Cargar meses de <cliente>» | El selector queda fuera de la vista al bajar |

**Lo que no es del front:**

- Que la consola muestre otro cliente: espera al super-admin del backend.
- Que José sea operador en QA: es la variable del despliegue.

## 4 · Lo que no se miró

- El cambio de cliente con más de dos clientes en local.
- El responsive, que sigue diferido.
