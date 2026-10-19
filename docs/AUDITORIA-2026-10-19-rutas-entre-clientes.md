# Auditoría · las dos rutas entre clientes, remedidas contra `727547e` · 2026-10-19

> **Histórico.** Un cruce puntual, con fecha. No se actualiza.

**Qué se cruzó:** su respuesta al `MENSAJE-2026-10-16-backend-dos-rutas-entre-clientes.md`,
traída sin editar a `RESPUESTA-2026-10-19-backend-rutas-entre-clientes.md`,
contra su código y contra el binario corriendo.

**Contra qué:** `727547e` en `feature/dynamic-dashboard-backend`. `7324b26`
sólo le anota el hash a la respuesta. Se compiló `7324b26` en un worktree
aparte: `go build` y `go vet` limpios, y sus pruebas de handler en verde.

**Una trampa en el camino:** la primera vez que se buscó, a la mañana, el
commit **no estaba publicado**. La API de GitHub contestaba «No commit found
for SHA: 727547e» y la rama seguía en `cb37429`. Lo empujaron después; no se
midió nada antes.

---

## Las dos rutas

**El código es el que pedimos.** Las dos comparan contra `tokenTenantID` con la
misma excepción de `IsPlatformOperator` que el resto de `/admin/*`. Y `runs`,
sin filtro, fija el filtro al cliente del token.

**Medido en vivo, con datos.** En la base local la semilla no tiene agentes ni
corridas, y por eso el 16 el cruce salió del código. Esta vez se le agregó un
agente y una corrida marcados, se midió y **se borraron** (quedan 0 y 0). El
usuario es `dev@synapse.local`, admin de UA:

| | `3651d70` · antes | `727547e` · admin de UA | `727547e` · operador |
|---|---|---|---|
| `GET /admin/agents?tenant_id=` de la semilla | **200 · 1 fila de la semilla** | **403** «no puedes administrar otro cliente» | 200 · 1 fila |
| `GET /admin/agents?tenant_id=` de UA | 200 | 200 | 200 |
| `GET /admin/materialize/runs?tenant_id=` de la semilla | **200 · 1 fila de la semilla** | **403** | 200 · 1 fila |
| `GET /admin/materialize/runs` sin filtro | **200 · 63 filas, los dos clientes** | 200 · 62, **sólo UA** | 200 · 63, los dos |

**El planner no se midió en vivo**: la contraseña del usuario local no es la
documentada. Que la regla le vale igual sale del código: el chequeo está en el
manejador, no en el grupo de rutas.

**Para el front no cambia nada.** Ninguna pantalla usa
`GET /admin/agents?tenant_id=`, y las corridas se piden siempre con el cliente
de trabajo.

## Lo que sigue abierto, y no se vuelve a pedir

Layouts, roles y dashboards por id, y los pedidos 2 a 6 del 2026-10-10. Lo dice
su respuesta y coincide con su código.

## Lo que encontró el humo, y era nuestro

`npm run humo` contra `7324b26` marcaba que `/config/tabs/{id}` **no trae
`tab` ni `panels`**. **Era la herramienta**: pedía la pestaña sin `layoutId`, y
el servicio contesta 404 cuando la pestaña es de otro layout. Es la trampa del
2026-10-05. El cliente sí lo manda, y con él la ruta devuelve las dos claves.
Corregido en `tools/humo.py`.

**Y una falla de proceso, más cara.** Mi `main` local estaba **73 commits atrás**
(`bce2e95`), y de ahí salió la rama del #24: entró a `main` con una prueba que
falla sobre la base real. Se corrige en el #25. Las tres diferencias extra que
el humo mostró al principio —`stale_since`, `/chat/agents` y el drill-down—
también eran de ese árbol viejo; sobre `origin/main` no aparecen.

**Lo único que queda en el humo es `prose_instruction` en `/config/catalog`**,
que trae `5af3b86`, su respuesta a la instrucción de prosa por métrica. **Esa
respuesta no se cruzó todavía.**
