# Para el equipo de backend · José no quedó como operador en QA · 2026-10-19

> **Histórico.** Un mensaje con fecha: qué se pidió y con qué evidencia.
> No se actualiza.

**Medido contra `727547e` el 2026-10-19**, en QA y sólo con lecturas, desde la
sesión de `jose.rodriguez@lobueno.co`. Del lado del front medimos lo nuestro
primero: el selector ofrece exactamente lo que devuelve `GET /admin/tenants`, así
que no hay nada que filtremos nosotros. El detalle está en
`docs/AUDITORIA-2026-10-19-cambio-de-cliente.md`.

---

Hola. Gracias por el despliegue: el aislamiento quedó, las dos rutas del 19 dan
403 y la prosa está prendida.

**Una sola cosa no quedó:** José sigue viendo un cliente. En QA hay cinco
—Keralty, Lobueno Analytics, Lobueno Analytics Terpel, Sistema y Synapse UA
HTML— y `GET /admin/tenants` con su sesión devuelve sólo «Synapse UA HTML». O sea
que su `user_id` no está en `PLATFORM_OPERATOR_USER_IDS`, o la variable no se
cargó.

¿Pueden revisarla? Es el `user_id` de `jose.rodriguez@lobueno.co` en la tabla
`users` de QA. Con eso el selector de cliente de administración y builder le
ofrece los cinco.

Y una pregunta: **¿qué commit del front quedó en QA?** El que vemos es anterior
al último de `main` (`b701cef`).

Gracias.
