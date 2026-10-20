# Auditoría · el alta de cliente con su superadmin, contra `4ceb36c` · 2026-10-20

> **Histórico.** Un cruce puntual, con fecha. No se actualiza.

**Qué se miró:** la respuesta del backend
(`docs/RESPUESTA-2026-10-20-backend-consola-por-cliente-medida.md`), su código
en `4ceb36c` —la punta es `30c5c50`, que sólo anota el hash— y el binario de ese
commit corriendo en local, con la base de `dev/postgres`. **Nada contra QA.**

Sigue a `docs/AUDITORIA-2026-10-20-consola-por-cliente.md`.

---

## 1 · Lo que dice la respuesta, medido

| Afirmación | Medido en local | |
|---|---|---|
| `POST /admin/tenants` deja creado el rol `superadmin` del cliente | El cliente nuevo tiene `superadmin`, activo | ✓ |
| El salto a ese cliente anda sin reiniciar | 200, con el proceso levantado antes del alta | ✓ |
| `/config/me` de ese cliente llega con `dashboards: []` | Sí, sin layout activo y sin pestañas; `scope` sigue en `multi_tenant` | ✓ |
| El salto no escribe un registro | Leído: `SwitchTenant` no cambió | ✓ |
| Un `admin` puede seguir asignando `superadmin` | Leído: `UpdateAdmin` no cambió | ✓ |
| El logo sigue abierto | No hay campo | ✓ |

**Para medir se creó un cliente en la base local**, «Cliente de prueba del
salto», con valores de Snowflake de relleno: el alta los pide como
obligatorios.

## 2 · Lo que apareció al mirarlo, y era nuestro

**El superadmin quedaba encerrado en el cliente nuevo.** La consola mostraba
«Este cliente todavía no tiene un dashboard» sin navbar, sin la barra del
cliente y sin ninguna acción. La salida que esa pantalla tenía —volver al
dashboard por defecto— no existe cuando el cliente no tiene ninguno. Sólo
quedaba editar la dirección o cerrar sesión.

**Ninguna prueba lo veía**: las del salto usaban clientes con dashboard. Lo
encontró abrirlo.

**Arreglo · F5.52:** la pantalla lleva arriba la barra del cliente, con su
selector, y quien administra ve «Componer un dashboard en el builder».

## 3 · Lo que queda abierto, sin pedirlo de nuevo

- El registro de entradas a otro cliente: lo dejan para cuando exista el
  super-admin aparte, con MFA y auditoría.
- Que el API rechace asignar `superadmin`: dicen que lo pidamos aparte si hace
  falta. Por decisión humana, por ahora no.
- El logo.
