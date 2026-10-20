# Para el equipo de backend · el rol «superadmin» en QA · 2026-10-20

> **Histórico.** Un mensaje con fecha: qué se pidió y con qué evidencia.
> No se actualiza.

**Sin medición previa:** lo que QA hace no está en el código de su repositorio
—`31e97b1` es lo último y `AdminOnlyMiddleware` pide «admin»—, así que lo
medimos en QA y no hay commit contra el cual medir. Del lado del front medimos lo
nuestro primero: el menú de trabajo dependía de `esAdmin` (`src/api/rol.ts`), que
sólo reconocía «admin»; ya lo corregimos.

---

Hola. Vimos el rol nuevo en QA y anda: con «superadmin», José ve los cinco
clientes, y los catálogos, roles, usuarios, layouts y feeds de Keralty contestan
200. Gracias.

**Lo que pasó del lado nuestro:** el front decidía mostrar el menú de trabajo
—administración y builder— sólo si el rol se llamaba «admin». Con «superadmin» el
menú desapareció aunque el servidor lo habilitaba. Ya está corregido en `main`
del front; falta desplegarlo.

**Tres cosas:**

1. **¿Pueden subir el código de «superadmin» al repositorio?** En
   `feature/dynamic-dashboard-backend` el último commit es `31e97b1`, que sólo
   copia un mensaje, y ahí `AdminOnlyMiddleware` sigue pidiendo «admin». No
   podemos leer qué regla aplica QA hasta que esté.
2. **¿«superadmin» reemplaza a `PLATFORM_OPERATOR_USER_IDS`, o conviven?** Nos
   importa porque el front tiene que saber quién administra. Si el rol es la
   regla, la escribimos así; si es la variable, el front no la puede ver.
3. **Desplegar el front de `main`.** El de QA es del 19-oct a las 18:40 GMT y no
   trae los arreglos del #34 y el #35, ni éste.

Gracias.
