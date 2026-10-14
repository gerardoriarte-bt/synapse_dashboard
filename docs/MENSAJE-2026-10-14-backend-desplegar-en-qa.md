# Para el equipo de backend · qué desplegar en QA · 2026-10-14

> **Histórico.** Un mensaje con fecha: qué se pidió y con qué evidencia.
> No se actualiza.

**Medido contra `8272085` el 2026-10-13**: el binario de `8272085` corriendo acá
con la base local, con y sin `PLATFORM_OPERATOR_USER_IDS`, y el chat contra
`SYNAPSE_UA` real. El detalle está en
`AUDITORIA-2026-10-13-respuestas-del-backend.md`.

**Reemplaza a `MENSAJE-2026-10-05-backend-desplegar-el-front.md`**, que pedía
subir el front y una API anterior a `c8b9247`. Eso quedó viejo.

---

Hola. Para QA:

1. **El front: `main`** de `gerardoriarte-bt/synapse_dashboard`.
2. **El backend: `8272085`**, que es donde están la procedencia del chat por SQL,
   las tablas con `label` y el 403 entre clientes.
3. **Con `PLATFORM_OPERATOR_USER_IDS` cargada** con los usuarios de Lo Bueno que
   operan varios clientes. **Si va vacía, nadie de Lo Bueno ve más que su propio
   cliente en administración y builder.** Lo medimos: sin la lista, la lista de
   clientes trae uno solo; con el usuario en la lista, vuelven todos.

Y cuando esté arriba, **¿nos dicen qué commit quedó en QA?** Con eso volvemos a
medir allá lo que hoy sólo medimos en local.

Gracias.
