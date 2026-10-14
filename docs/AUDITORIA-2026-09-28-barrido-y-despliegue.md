# Auditoría · barrido del plan y listo-para-desplegar · 2026-09-28 (noche)

> Base verde antes de empezar, que es lo primero que el método pide: `verify` ✓ y
> `backend-drift` ✓ con las nueve rutas leídas contra `f70cec2`. Auditar sobre un
> árbol roto produce conclusiones sobre código que no compila.

## 1 · LO QUE ESTÁ MAL

### 1.1 · Tres conteos en `CLAUDE.md` estaban vencidos · **corregidos**

| Decía | Es | Qué se hizo |
|---|---|---|
| «Las **170** tareas» | **214** | **Se sacó el número** y se apunta a `docs/ESTADO.md`, que se genera |
| «Lista las **33** pantallas del `.pen`» | **36** | Se sacó el número |
| «**43** documentos» | 81 | Se **fechó**: es un costo medido el 2026-09-25, no un conteo vivo |

Es el hallazgo que la auditoría del 2026-09-14 ya había encontrado con «once
chequeos» cuando eran quince. **La cura no es corregirlos: es sacarlos**, porque
un número corregido vuelve a vencerse.

### 1.2 · Un efecto colateral que dejé en la base local · **anotado**

Para cerrar B4.2 hubo que **publicar**, porque la semilla escribe
`dd_layout_versions` sin pasar por `publish` y por eso no deja fila de auditoría.
Se hizo sobre el segundo dashboard —«Marca»—, que no tenía layout, **para no
tocar el que la consola sirve**.

Funcionó, y el costo es que **«Marca» ya no sirve como el caso “sin componer”**
que `dev/postgres/README.md` describía como útil para F5.1. Queda escrito ahí, con
cómo recuperarlo.

## 2 · LO QUE SE VERIFICÓ Y ESTÁ BIEN

### 2.1 · El barrido de candados · **21 revisados, uno movido**

Se listaron **las 21 tareas no cerradas con candado escrito** y se midió cada
candado contra el servicio corriendo. **Veinte siguen firmes:**

| Candado | Medido |
|---|---|
| `/config/plots` · F1.31, F4.21, B1.21 | **404** |
| `/config/solicitudes` · F2.3 | **404** |
| `/config/decisiones` | **404** |
| Ninguna métrica declara `matriz`, `grafo`, `flujo`, `categoricaComparada` · F4.17–F4.19 | El catálogo trae **sólo** `scalar 9 · multi_series 3 · categorical 2 · prose 2 · tabular 2` |
| `cut` en `series` · F1.44 | Sigue sin definir en el cable |
| El patrón de `PeriodoId` · F5.13 | Los períodos siguen siendo `YYYY-MM` |
| `PayloadDegradado` no dice desde qué punto · B1.28 | Las claves son `governance message reason status unlocks_with value` · ninguna de tramo |

**Y uno venció: B4.2 → ✅.**

### 2.2 · B4.2 · los cuatro de §7.2, medidos

§7.2 pide «quién, cuándo, qué cambió. Permite revertir». Faltaban dos y **la forma
de comprobarlos era publicar, no volver a preguntar**:

| `action` | `previous_layout_id` | `diff.summary` |
|---|---|---|
| `publish` | — | `tabs_added 1 · panels_added 1` |
| `publish` | el anterior | `tabs_added 1 · panels_added 1 · panels_changed 3` |
| `rollback` | el anterior | `tabs_removed 1 · panels_removed 1 · panels_changed 3` |

Las tres con `actor_user_id` y `actor_role: admin`. Y `POST
/admin/layouts/{layoutId}/revert` contestó **200** —el único de sus tres códigos
que nunca se había medido—, devolviendo `version_id: rollback-v-1…`.

**Su explicación del `[]` era correcta**, y conviene decirlo: la semilla no pasa
por `publish`. No era un defecto suyo ni un campo faltante.

**Dos detalles de forma para quien construya B6:** `tabs_added` trae la **`key`**
de la pestaña y no su id, y las colecciones vacías del diff vuelven como **`null`,
no `[]`** — distinto de lo que su documento dibujaba.

### 2.3 · Las `B*` cerradas declaran contra qué · **las dos sin commit están bien**

Se cruzaron las cerradas contra el commit que citan. **Dos no citan ninguno**, y
las dos declaran qué las sostiene en su lugar:

- **B0.5** dice por qué: *«no contra el servicio, porque no produce una ruta sino
  un documento»*, y nombra `contracts/synapse-api.yaml` y `contract-drift` en la
  puerta.
- **B1.18** cita el **resultado medido** —`created=6 updated=4
  catalog_version=2`— y qué devuelve `/config/catalog`, que es mejor evidencia que
  un hash.

**Sin hallazgo.** Y citar un commit viejo no es deriva: es la forma que la regla
pide —«una tarea cerrada dice contra qué se cerró»—. De la deriva se ocupa
`backend-drift`, que está verde.

### 2.4 · El despliegue · **ejercitado a través del contenedor, no deducido**

| | |
|---|---|
| Imagen | **77,3 MB** · sin Node ni `node_modules` |
| Rutas profundas | `/` `/login` `/admin` `/builder` `/admin/usuarios` `/consola` → **200** las seis |
| Login por el proxy | **200** · mismo usuario que el servicio directo |
| Consola entera | `/config/me` `catalog` `blocks` `tabs/{id}` `chat/threads` `panels:batch` → **200** |
| Los doce paneles | **10 `AVAILABLE` + 2 `DEGRADED`** · los dos de prosa, que es el estado correcto |
| Admin entero | Las ocho rutas → **200**, incluida `catalog/health` |
| SSE del chat | **Corrido contra Cortex real** · 79 trozos en 20,87 s |

**No queda nada del despliegue sin correr.**

## 3 · LO QUE NO SE PUDO VERIFICAR, Y ES INFORMACIÓN

| | Por qué |
|---|---|
| **Que exista un `f70cec2` desplegado** | Todo esto vale contra el binario que levantamos acá. Si el ambiente queda con un commit más viejo, el humo hay que correrlo contra ése |
| **El alta de un cliente de punta a punta** | Haría falta un cliente real en Snowflake con sus quince columnas y un par de claves RSA |
| **Las dos composiciones responsive a 360 exactos** | Chrome no achica la ventana por debajo de ~500 en macOS. 500 cae en el mismo escalón `<768` |
| **`/config/chat` en el humo** | Salteada con razón escrita: cuesta una llamada a Cortex y escribe un hilo. Se ejercitó aparte, para el SSE |

## 4 · El veredicto

**El front está para desplegarse en pruebas.** Lo que quedaba —el empaquetado— se
construyó, se corrió y se midió hoy.

**Lo que NO va a andar en ese ambiente, y conviene decirlo antes:** el selector de
gráfico del builder (`/config/plots` da 404), el detalle de hallazgo (`decisiones`
404), la solicitud de acceso (`solicitudes` 404) y las cuatro formas que ninguna
métrica declara. **Los seis son candados del backend o de datos, con su razón
escrita, y ninguno es una pantalla rota**: son pantallas que no existen todavía.

**Lo único del front que se ve mal y es nuestro** es el navbar apretado abajo de
768, diferido por decisión humana ·
`docs/AUDITORIA-2026-09-28-pen-vs-responsive.md`.
